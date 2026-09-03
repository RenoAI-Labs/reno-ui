# reno-ui requires Tailwind v4

This is a hard requirement, not a preference, and reno-ui will not grow a v3
compatibility mode. This page says why, how to check whether a project is ready,
what the migration actually costs (measured, not guessed), and what a project
still on v3 can salvage in the meantime.

## Why v4 only

reno-ui's whole proposition is one component codebase serving four product
domains, which only works if the token layer is the single lever. Supporting
both major versions would mean shipping every token twice — OKLCH for v4, HSL
triplets for v3 — and the two would not agree: reno's colour ramps are generated
in OKLCH, and the steps near the sRGB boundary get clipped on the way down to
HSL. A component library whose answer to "what colour is `primary`?" is "depends
on your Tailwind version" has already lost the property it exists for.

The rest is arithmetic. A v3 mode costs the library roughly double for every
component, token and bug from then on, forever, on the shrinking side of the
ecosystem. Getting one project onto v4 costs that project about a week, once.

## Check a project in three commands

```bash
# 1. Which major?  v4 has no tailwind.config by default.
node -p "require('./package.json').devDependencies?.tailwindcss ?? require('./package.json').dependencies?.tailwindcss"

# 2. The expensive migration blockers — theme()/config() calls inside CSS.
grep -rn "theme(\|config(" --include=*.css src/ | wc -l

# 3. The mechanical ones — utilities v4 renamed or redefined.
grep -rEo '\b(shadow|rounded|blur)(-sm|-md)?\b|outline-none|\bring(-[0-9])?\b|space-[xy]-' \
  --include=*.tsx src/ | wc -l
```

A zero on (2) means the migration is mechanical. A non-zero count there is the
part that needs real thought.

## What the migration actually costs

Measured on a real Next.js 15 app during the P6a validation gate: 433 `.tsx`
files with 3,629 `className` attributes, 4,891 lines of hand-written CSS, live
in production.

| Piece | Real work |
|---|---|
| `tailwind.config.ts` → `@theme inline` | 95 config lines → ~60 CSS lines. Token names map one to one. |
| Hand-written CSS (4,891 lines, incl. a contract-frozen design export) | **Zero changes.** Plain CSS passes through v4 untouched. |
| `@tailwind base/components/utilities` → `@import "tailwindcss"` | 3 lines |
| `darkMode: 'class'` → `@custom-variant dark (&:where(.dark, .dark *))` | 1 line |
| `postcss.config.js`: `tailwindcss` → `@tailwindcss/postcss`, drop autoprefixer | 2 lines |
| Renamed / redefined utilities across all 433 files | **~72 occurrences.** `npx @tailwindcss/upgrade` handles most. |
| `theme()` / `config()` in CSS | **0** — the expensive case was simply absent |

Roughly a week including visual QA. The number that matters is that the frozen
CSS did not move: a project's existing design system is not the obstacle people
expect it to be.

### You keep your own tokens

The common fear is that adopting reno-ui means adopting reno's palette. It does
not. v4 consumes whatever colour syntax you already store, including the HSL
triplets a v3 project typically keeps:

```css
/* your tokens, unchanged — exactly as your v3 config already read them */
:root { --primary: 150 100% 25%; }

@theme inline {
  --color-primary: hsl(var(--primary));
}
```

```css
/* what v4 emits */
.bg-primary    { background-color: hsl(var(--primary)); }
.bg-primary\/50 { background-color: color-mix(in oklab, hsl(var(--primary)) 50%, transparent); }
```

reno components read semantic utilities (`bg-primary`, `text-muted-foreground`),
so with that mapping in place they render in *your* brand colours with no theme
installed. This was verified on a real project: the reno DataGrid picked up the
host's brand green and accent yellow with zero reno theme present.

Note the second line. Under v3, `hsl(var(--primary))` without `<alpha-value>`
makes Tailwind silently drop the opacity modifier — `bg-primary/50` renders
fully opaque. v4 fixes that on its own, so the migration usually repairs bugs a
project did not know it had.

**Install the reno theme only if you want reno's palette.** A project with
its own design system should keep its tokens and map them as above; installing
`@reno/theme-*` would overwrite `--primary` with an `oklch(…)` value, and any
remaining `hsl(var(--primary))` reference then resolves to nothing.

## Still on v3, and cannot upgrade yet

Unsupported, but real: most reno primitives work on Tailwind v3 once the config
declares what they read. Verified by installing `@reno/data-grid` into a v3
project and driving it against a live database — sorting, paging and row
selection all correct.

Add to `tailwind.config.ts`:

```ts
// reno-ui compat shim for Tailwind v3. Delete this when the project reaches v4.
// `<alpha-value>` is what makes `bg-primary/90` work; without it v3 emits the
// colour at full opacity and says nothing.
colors: {
  // …your existing colours, each written as hsl(var(--x) / <alpha-value>)…
  success:   { DEFAULT: 'hsl(var(--success) / <alpha-value>)',
               foreground: 'hsl(var(--success-foreground) / <alpha-value>)' },
  warning:   { DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
               foreground: 'hsl(var(--warning-foreground) / <alpha-value>)' },
  info:      { DEFAULT: 'hsl(var(--info) / <alpha-value>)',
               foreground: 'hsl(var(--info-foreground) / <alpha-value>)' },
  overlay:   'hsl(var(--overlay) / <alpha-value>)',
},
```

and declare the density scale, which reno components size themselves from. Scope
it to a wrapper class rather than `:root` if you want it contained:

```css
:root {
  --density-control-height-sm: 2rem;   --density-control-height: 2.25rem;
  --density-control-height-lg: 2.5rem; --density-control-px: 0.75rem;
  --density-row-height: 2.75rem;       --density-cell-padding-x: 0.75rem;
  --density-cell-padding-y: 0.5rem;    --density-gap: 0.75rem;
  --density-font-size: 0.875rem;       --density-line-height: 1.45;
}
```

Define any of `--success`, `--warning`, `--info`, `--overlay` your token file is
missing. Without the colour keys those utilities emit **no CSS at all** and the
element renders transparent — a failure that looks like a layout bug, not a
missing token.

### What you do not get

- **The theme.** `@reno/theme-base` ships `@theme inline` and OKLCH; neither
  means anything to v3. You keep your own palette, which is the point anyway.
- **Exact visuals.** The primitives use five utilities that only exist in v4:
  `outline-hidden`, `shadow-xs`, `rounded-xs`, `field-sizing-*`, and the `**:`
  descendant variant (34 occurrences at the time of writing). On v3 these emit
  nothing — slightly heavier focus outlines, no extra-small shadow or radius,
  and one sizing rule missing inside `@reno/command`. Degraded, not broken.
  `tests/registry-portability.test.ts` fails if a primitive starts using a
  v4-only utility this list does not name, so the list cannot quietly rot.
- **Support.** No CI job runs against v3 and none will. Treat this as a bridge
  with a deadline, not a configuration.

## If a project ignores this page

The failure is quiet, which is why the page exists. Components install cleanly,
the build passes, and colours are simply absent — `bg-success` with no matching
config key produces no declaration at all. Nothing errors. Someone finds it in
review, or a user does.
