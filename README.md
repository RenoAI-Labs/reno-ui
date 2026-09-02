# reno-ui

A self-hosted [shadcn](https://ui.shadcn.com) registry for building product UIs
across several domains — e-learning, admin, ERP and CMS — from one component
codebase.

Components are installed as source. `npx shadcn add @reno/button` writes a real
`.tsx` file into your repository and installs its npm dependencies. Nothing
calls back to this registry at runtime, so a project built with reno-ui keeps
building forever whether or not this registry exists.

**Registry:** https://ui.reno.ai.vn · **License:** MIT

## Install

Add the `@reno` namespace to your project's `components.json`:

```json
{
  "registries": {
    "@reno": "https://ui.reno.ai.vn/r/{name}.json"
  }
}
```

Then install a theme and any components you need:

```bash
npx shadcn@latest add @reno/theme-admin
npx shadcn@latest add @reno/button
```

The registry is public. There is no token and no authentication.

## Architecture

Three layers, each unaware of the one above it.

```
Tokens       theme-base + 4 presets (elearning, admin, erp, cms)
             OKLCH scales, radius, density, typography, dark mode
     ↑
Primitives   47 components derived from shadcn/ui, plus a virtualized DataGrid
     ↑
Blocks       dashboard-shell, crud-page, auth-pages   (not built yet)
```

Blocks are deliberately not built yet. They must be derived from screens that
actually shipped in a real project rather than guessed at, so they stay behind a
validation gate until reno-ui has been used end to end on one.

Blocks import primitives. Primitives read tokens through CSS variables only —
never a hardcoded colour, and never a fixed control height. That constraint is
what lets a single `<Button>` render compact in an ERP screen and roomy in an
e-learning one, and it is enforced by lint (`reno-tokens/no-raw-color`) rather
than by convention.

See [docs/design-tokens.md](./docs/design-tokens.md) for the token contract and
[docs/data-grid-server-contract.md](./docs/data-grid-server-contract.md) for what
the DataGrid sends a backend.

### DataGrid

`@reno/table` is a styled `<table>` for light list views. `@reno/data-grid` is
the virtualized grid for admin and ERP: server-side paging/sorting/filtering,
column pinning, resizing and visibility, cross-page row selection, and built-in
empty, loading and error states.

They are separate registry items on purpose — a CMS project installing `table`
gets no TanStack in its bundle, and CI fails if that ever stops being true.

TanStack Table v9 was chosen partly because its features are tree-shakable.
Measured rather than assumed (`npm run bench:tanstack`, esbuild, minified, React
external):

| Build | Minified | Gzipped |
|---|---|---|
| v8.21.3, all features (v8 has no opt-out) | 53.0 kB | 14.1 kB |
| v9.2.4, the ten features DataGrid registers | 77.0 kB | 21.2 kB |
| v9.2.4, core row model only | 32.4 kB | 10.5 kB |

The tree-shaking is real — dropping to the core model cuts 58% — but DataGrid
registers every feature, so as shipped it costs about 45% more than v8 would.
The saving is available to a grid that lets a project opt features out, which
this one does not do yet.

The grid never fetches. It emits state; you wire that to React Query, a server
action, or the URL via `@reno/use-data-grid-url-state`. See the server contract
doc for the wiring.

## Requirements

reno-ui targets modern browsers only, because Tailwind v4 and OKLCH colours do:

| Browser | Minimum |
|---|---|
| Safari | 16.4 |
| Chrome / Edge | 111 |
| Firefox | 128 |

Confirm this floor with a client before starting a project on reno-ui.

Runtime: React 19, **Tailwind CSS v4**. Node 20.19+ to work on this repository.

Tailwind v4 is a hard requirement and there will be no v3 compatibility mode —
supporting both would mean shipping every token twice, in two colour spaces that
do not agree. A project on v3 upgrades before adopting reno-ui;
[docs/tailwind-v4-requirement.md](./docs/tailwind-v4-requirement.md) covers what
that costs (measured on a real 433-file app), the `@theme inline` mapping that
lets a project keep its own palette, and an unsupported shim for getting value
out of the primitives in the meantime.

## Handover

reno-ui is built for outsourced delivery, where the client must end up owning
everything and depending on nobody.

```bash
node scripts/eject-registry.mjs --dir /path/to/client-project
scripts/verify-selfcontained.sh /path/to/client-project
```

The first removes the `@reno` entry from `components.json` — dev tooling, not a
build input — and proves no `@reno/` reference remains. The second clones the
project into a clean directory and runs `npm ci && npm run build` to prove it
stands alone.

Ship `docs/ui-components.md` with the delivery. It records the origin and
license of every component the client now owns.

[docs/handover-checklist.md](./docs/handover-checklist.md) is the full sequence,
including the compatibility questions worth asking before a project starts
rather than at delivery.

## Development

```bash
npm install
npm run dev              # docs site at localhost:3000
npm run registry:build   # regenerate public/r/*.json
npm run verify           # static gates + lint + types + tests
npm run check:all        # the generated-artifact and policy gates only

# The render gate needs a build and a running server, so it is separate:
npm run build && npx next start &
npm run check:render     # opens the site in Chrome and asserts it draws
```

| Command | Purpose |
|---|---|
| `npm run theme:generate` | Rebuild theme CSS from `theme-presets.config.mjs` |
| `npm run theme:sync` | Rebuild theme `cssVars` from theme CSS |
| `npm run registry:assemble` | Rebuild `registry.json` from `registry/items/*.json` |
| `npm run demos:generate` | Rebuild the docs demo index |
| `npm run check:contrast` | WCAG AA gate across all presets |
| `npm run check:provenance` | License gate; regenerates the inventory in `docs/ui-components.md` |
| `npm run check:boundaries` | Layering, framework-neutrality and bundle-split gate |
| `npm run check:render` | Opens the built site in Chrome: rows render, no horizontal overflow, clean console |
| `npm run bench:data-grid` | Scroll benchmark: 10k rows, three runs, prints FPS (not a CI gate — runner frame timing is noise) |

Generated files are never edited by hand — `check:all` fails if they drift from
their sources.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Note in particular the licensing
constraint on component sources: only shadcn/ui (MIT) and original code may be
added.
