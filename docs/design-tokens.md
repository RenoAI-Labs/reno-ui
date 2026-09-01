# Design tokens

The token layer is what lets one component codebase serve four product domains.
Get this wrong and every component built on top of it inherits the mistake, so
the rules here are enforced by lint and CI rather than left to discipline.

## Two tiers, never mixed

```
PRIMITIVE   --reno-brand-500, --reno-neutral-100, --reno-destructive-700
            Raw values. Defined only in theme presets.
                │
                ▼  mapped by the preset
SEMANTIC    --primary, --background, --muted-foreground, --border, --radius
            Roles. This is the ONLY tier components may read.
```

Why the split matters: switching preset means remapping semantic → primitive. If
a component read `--reno-blue-500` directly, an ERP preset that wants green
would have to edit the component. That single mistake destroys the multi-domain
property, which is the entire point of the library.

`reno-tokens/no-raw-color` enforces the component side. Nothing in
`registry/reno/ui/` or `registry/reno/blocks/` may contain a hex value, a colour
function, or a Tailwind palette class.

## Semantic colour tokens

Names follow shadcn exactly, so a component ported from shadcn works without
renaming anything.

| Token | Role |
|---|---|
| `--background` / `--foreground` | Page surface and its text |
| `--card` / `--card-foreground` | Raised surface |
| `--popover` / `--popover-foreground` | Floating surface |
| `--primary` / `--primary-foreground` | Brand action; also used as link text |
| `--secondary` / `--secondary-foreground` | Lower-emphasis action |
| `--muted` / `--muted-foreground` | Subdued surface and secondary text |
| `--accent` / `--accent-foreground` | Hover and selected states |
| `--border` | Dividers and outlines |
| `--input` | Control boundary |
| `--ring` | Focus indicator |
| `--chart-1` … `--chart-5` | Data series |
| `--sidebar*` | Sidebar surface family |

reno additions beyond shadcn:

| Token | Role |
|---|---|
| `--destructive` / `--destructive-foreground` | Errors, deletion |
| `--success` / `--success-foreground` | Confirmation |
| `--warning` / `--warning-foreground` | Caution |
| `--info` / `--info-foreground` | Neutral notice |

## Density tokens

Colour is the obvious difference between presets. Density is the one that
actually matters for ERP.

| Token | Purpose |
|---|---|
| `--density-control-height` | Button, input, select height |
| `--density-control-height-sm` / `-lg` | Size variants |
| `--density-control-px` | Horizontal padding inside controls |
| `--density-row-height` | DataGrid and table row height |
| `--density-cell-padding-x` / `-y` | Table cell padding |
| `--density-gap` | Default gap in forms and toolbars |
| `--density-font-size` | Base UI text size |
| `--density-line-height` | Base UI line height |
| `--radius` | Corner radius; `--radius-sm/md/lg/xl` derive from it |

Anything with a height reads a density token. Never `h-10`.

```tsx
// Correct — adapts per preset
className="h-[var(--density-control-height)] px-[var(--density-control-px)]"

// Wrong — identical in ERP and e-learning
className="h-10 px-4"
```

Concretely, `--density-row-height` is `2rem` under ERP and `3.25rem` under
e-learning: roughly 60% more rows on the same screen, from a value change.

## Presets

| Preset | Brand hue | Radius | Density |
|---|---|---|---|
| `elearning` | warm amber | 0.75rem | roomy |
| `admin` | blue | 0.5rem | normal |
| `erp` | teal-green | 0.25rem | compact |
| `cms` | violet | 0.5rem | comfortable |

`theme-base` is a neutral fallback carrying the complete token set plus the
Tailwind mapping layer. Every preset depends on it, so installing a preset pulls
it automatically. A project that installs only `theme-base` still renders
correctly.

## How a theme reaches your project

The shipped artifact is the `cssVars` block of a `registry:theme` item in
`registry.json`. The shadcn CLI merges those variables **directly into your
project's `globals.css`**, which is why installing a preset re-themes the app
with no manual step:

```bash
npx shadcn@latest add @reno/theme-erp
```

The `.css` files under `registry/reno/themes/` are *not* shipped. They are the
readable form used by the docs site and by the contrast checker.
`scripts/sync-theme-vars.mjs` derives `cssVars` from them and CI fails if the
two disagree — one source of truth, two representations.

## Why the values are generated, not chosen

`scripts/generate-scale.mjs` produces every theme file from
`registry/reno/themes/theme-presets.config.mjs`. For each foreground/background
pair it *solves* for a lightness that clears the WCAG threshold, rather than
picking a value that looks about right.

Four presets × two modes × ~45 semantic tokens is well past the point where
hand-picked OKLCH values stay accessible. `scripts/check-contrast.mjs` then
re-derives the ratios from the emitted CSS independently, so a bug in the solver
fails CI instead of shipping.

To retune a preset, edit the hue, chroma and density numbers in the config and
run `npm run theme:generate`. Never edit the generated CSS.

### Contrast thresholds

| Pair | Ratio | Basis |
|---|---|---|
| Text on its surface | 4.5:1 | WCAG 2.2 SC 1.4.3 |
| `--input`, `--ring` vs surface | 3:1 | SC 1.4.11 — these identify a control and its focus state |
| `--border` vs surface | reported, not gated | Decorative dividers carry no information; gating them at 3:1 would force heavy rules on every surface. Controls use `--input`. |

## Animation

Overlays use `animate-in` / `fade-in-0` / `zoom-in-95` / `slide-in-from-*`. In a
stock shadcn project those come from the `tw-animate-css` plugin. **reno-ui does
not depend on it** — requiring an extra Tailwind plugin would leave that
dependency in the customer's repository, which is exactly what the handover
promise rules out. The keyframes and utilities ship with `theme-base` instead and
merge into the consuming project's `globals.css`.

The split between the two channels is not arbitrary:

| Channel | Carries | Why |
|---|---|---|
| `cssVars.theme` (`--animate-*`) | `animate-in`, `animate-out`, `animate-accordion-*`, `animate-caret-blink` | Tailwind generates `.animate-in` from `--animate-in`, **and keeps the referenced `@keyframes` alive because of it** |
| `css` | the `@keyframes`, and the modifier utilities | The shadcn CLI nests `@keyframes` from `css` into `@theme`, which is where Tailwind wants them for the above |

Defining `.animate-in` as a hand-written `@utility` looks equivalent and is not:
Tailwind then sees nothing referencing the keyframes and drops them, so the class
exists but animates nothing. Composition works the tw-animate-css way — one
`enter`/`exit` keyframe reads CSS variables, each modifier sets one variable — so
`animate-in fade-in-0 zoom-in-95` combines rather than fighting over
`animation-name`.

Tune duration per project with `--reno-animation-duration`.

## Colour space

OKLCH, not HSL. Perceptual uniformity means a 50→950 ramp steps evenly in
apparent lightness, instead of HSL's characteristic bright yellows and muddy
blues at the same nominal lightness. Tailwind v4 supports it natively.

The cost is the browser floor: Safari 16.4+, Chrome 111+, Firefox 128+. Confirm
this with a client before starting a project on reno-ui.
