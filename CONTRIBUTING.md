# Contributing to reno-ui

## Licensing — read this first

reno-ui is public, open source, MIT. Everything in it must be redistributable
under those terms. There are exactly two valid origins for component code:

1. **shadcn/ui** — MIT. Copy and adapt freely; record the upstream reference in
   `docs/ui-components.md`.
2. **Code you wrote** — recorded as `original`.

### `zerostaticthemes/square-ui` is off limits

`square-ui` is distributed under the **ln-dev UI License**, a proprietary
commercial license. It forbids, among other things:

> - "Create or distribute a UI kit, component library, template collection, or design system based on these Components or Templates"
> - "Make the Components or Templates available in any repository, marketplace, or website (free or paid)"

The first clause describes exactly what reno-ui is. The second forbids putting
it in a repository at all. This repository is public, so a violation would be
visible to anyone who looks.

**Allowed:** viewing square-ui in a browser to study a layout, then writing your
own implementation from scratch.

**Not allowed:** cloning the repo, opening its source files, copying any code,
or adapting a file "with changes". If you have had its source open in an editor,
do not write the corresponding component in the same sitting.

`scripts/check-provenance.mjs` fails CI on any row citing it, but the real
enforcement is code review. Reviewers: ask where a component came from.

## Adding a component

1. Create the file under `registry/reno/ui/` (or `blocks/`, `hooks/`, `lib/`).
2. Register it in `registry.json` with **complete** `dependencies` (npm) and
   `registryDependencies` (other reno items). A missing entry breaks the
   consuming project at install time and is the most common defect here.
3. Add a demo at `registry/reno/examples/<name>-demo.tsx` with a default export,
   then run `npm run demos:generate`. The docs page is generated from this — you
   do not write one.
4. Add a row to `docs/ui-components.md` with source, license and upstream ref.
5. Run `npm run check:all`, `npm run lint`, `npm run typecheck`, `npm test`.

## Rules the CI enforces

**No raw colours in component source.** `bg-blue-500`, `#2563eb`, `rgb(...)` are
all rejected inside `registry/reno/ui/` and `registry/reno/blocks/`. Use semantic
tokens: `bg-primary`, `text-muted-foreground`, `var(--border)`. A hardcoded
colour looks correct under one preset and silently breaks the other three, and
because the failure is visual, no test catches it.

**No fixed control heights.** Anything with a height — buttons, inputs, table
rows — reads `var(--density-control-height)` or a sibling density token. This is
what makes the ERP preset denser than e-learning without a code change.

**Layer boundaries.** `registry/reno/ui/table.tsx` must not import TanStack —
heavy grid features live in `@reno/data-grid`, so a CMS project pays no grid
bundle cost. Blocks must not import Radix directly, must not import `next/link`
or `next/navigation`, and must not import an i18n library.

**No i18n dependency.** Display strings go through a `labels` prop with
Vietnamese defaults, exported as `defaultLabels`. reno-ui must not depend on
next-intl or i18next; that would break the zero-dependency handover promise.

**Never edit generated files.** `registry/reno/themes/*.css`, the `cssVars`
blocks in `registry.json`, and `app/lib/demo-index.generated.ts` are all
generated. Edit the source and regenerate; `check:all` fails on drift.

## Scope

reno-ui exists to serve our own outsourced projects. Scope is deliberately
narrow, and we do not commit to a support SLA. Issues and pull requests are
welcome, but a feature that only one domain needs usually belongs in that
project rather than here.

## Commits

Conventional commits, focused changes. Never commit secrets, `.env` files or
client data.
