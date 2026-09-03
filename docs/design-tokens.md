# Design tokens

The token layer is what lets one component codebase serve four product domains.
Get this wrong and every component built on top of it inherits the mistake, so
the rules here are enforced by lint and CI rather than left to discipline.

## Two tiers, never mixed

```
PRIMITIVE   --reno-brand-500, --reno-neutral-100, --reno-destructive-700
            Raw values. Defined only in the theme.
                │
                ▼  mapped by the theme
SEMANTIC    --primary, --background, --muted-foreground, --border, --radius
            Roles. This is the ONLY tier components may read.
```

Why the split matters: rebranding means remapping semantic → primitive. If
a component read `--reno-blue-500` directly, a brand that wants green
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

Colour is the obvious thing a brand changes. Density is the one that
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
// Correct — adapts with the density scale
className="h-[var(--density-control-height)] px-[var(--density-control-px)]"

// Wrong — identical in ERP and e-learning
className="h-10 px-4"
```

Concretely, `--density-row-height` is `2rem` under ERP and `3.25rem` under
e-learning: roughly 60% more rows on the same screen, from a value change.

## One theme, and how to brand it

reno-ui ships a single theme, `@reno/theme-base`:

| | Value |
|---|---|
| Brand hue | 250 (blue), chroma 0.13 — a starting point, not reno's brand |
| Neutral hue | 250, chroma 0.004 |
| Radius | `0.5rem` |
| Density | normal |

The default hue is deliberately the one that reads as a system default rather
than as anybody's brand. It stays a real colour instead of a near-grey because
an install nobody has branded yet still has to look finished — a grey `<Button>`
in the default variant reads as broken, not as neutral.

Four domain presets shipped until 2026-09-03 — elearning, admin, erp, cms. They
were removed on purpose: naming a theme after one of our own domains asks a
project to pick one of ours, when a project arrives with a brand colour and an
opinion about spacing instead. Everything those presets encoded was a hue, a
radius and a density step, and all three are settings now.

Branding is overriding primitives in your own `globals.css`, after the theme
import:

```css
:root {
  --reno-brand-500: oklch(0.637 0.174 38.4);
  /* …the other ten stops… */
  --radius: 0.25rem;
  --density-row-height: 2rem;
}
```

The **Thương hiệu** panel on [the showcase](https://ui.reno.ai.vn/showcase)
generates exactly that block: it builds the ramp with the same `buildRamp` the
build script uses, applies it live, measures the resulting WCAG contrast, and
warns when a pick falls below AA. Copying from there beats hand-writing eleven
OKLCH stops.

### What the block does not cover, and when that matters

Four semantic tokens read the brand ramp — `--primary`, `--ring`,
`--sidebar-primary`, `--sidebar-ring` — so overriding the eleven stops moves
everything that is meant to carry the brand. The other 48 colour tokens are
literals that `generate-scale.mjs` solved for contrast, and overriding the ramp
does not touch them.

In practice that is fine, and the numbers are why: every surface token sits
between chroma 0.0016 and 0.012, and `--card` and `--popover` are `oklch(1 0 0)`
exactly. Below roughly 0.02 the hue is not perceptible, so those 48 tokens are
effectively a greyscale. A branded primary on neutral greys is what most design
systems ship.

It matters in one case: **deliberately tinted neutrals** — warm greys under a
warm brand. That needs the semantic layer re-solved rather than overridden, and
it is a change to `theme-presets.config.mjs` (`neutral.h`) followed by
`npm run theme:generate`, which is an operation on this repository rather than on
a consuming project. A delivered project that wants tinted neutrals after
handover has to come back to us for it — the one place the "you depend on nobody"
promise is still thin.


## How a theme reaches your project

The shipped artifact is the `cssVars` block of a `registry:theme` item in
`registry.json`. The shadcn CLI merges those variables **directly into your
project's `globals.css`**, which is why installing a preset re-themes the app
with no manual step:

```bash
npx shadcn@latest add @reno/theme-base
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

Two modes × ~45 semantic tokens is past the point where
hand-picked OKLCH values stay accessible. `scripts/check-contrast.mjs` then
re-derives the ratios from the emitted CSS independently, so a bug in the solver
fails CI instead of shipping.

To retune the theme, edit the hue, chroma and density numbers in the config and
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
