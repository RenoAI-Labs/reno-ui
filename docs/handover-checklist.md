# Handover checklist

Run this before delivering any project built on reno-ui. It exists because the
whole commercial argument for the library is that the customer ends up owning
everything and depending on nobody — and an argument that has not been executed
is not evidence.

Every step below is either a command that exits non-zero on failure, or a
document you hand over. Nothing here is a judgement call.

## Why the claim holds (say this to the customer)

`shadcn` is an **install-time** tool, not a runtime dependency:

```
npx shadcn add @reno/data-grid
  → fetches JSON from the registry
  → writes real .tsx files into the repository
  → installs npm dependencies
  → exits
```

After that the code is theirs. No CDN import, no call home, no license check.
Shut the registry down, let the domain lapse, close the company — their source
still builds and runs. The only residue is the `registries` entry in
`components.json`, which is dev tooling and takes no part in build, test or
deploy. Step 2 removes it.

## The checklist

### 1. Freeze what you are delivering

- [ ] Deliver from a **branch or tag**, never a working tree. Every step below
      runs against a clean clone, so uncommitted work is invisible to all of it.
- [ ] `git status` is empty in the project.

### 2. Eject the registry

```bash
node scripts/eject-registry.mjs --dir /path/to/customer-project
```

In a monorepo, `--dir` is the package that holds `components.json`
(e.g. `apps/web`), not the repository root.

- [ ] Exit code 0 and `✔ Eject complete.`

It fails on any remaining `@reno/` string, **including ones in comments and in
visible UI text** — that is deliberate, not overzealous. Fix the source; do not
work around the check.

### 3. Prove it stands alone

```bash
scripts/verify-selfcontained.sh /path/to/customer-project [git-ref]
```

Clones into a throwaway directory, so no local `node_modules` and no cached
registry response can mask a missing dependency, then installs and builds from
scratch. It reads the lockfile to pick the package manager, so pnpm, yarn, bun
and npm projects all work.

- [ ] Exit code 0 and `✔ Self-contained`.

### 4. Hand over the paperwork

- [ ] Copy `docs/ui-components.md` into the customer repository. It is their
      record of every component they now own, its origin, and its license — and,
      in the "Dependency licenses" section, the license of every npm package
      those components pulled into their `package.json`. Their legal or
      procurement side will ask for the second table; hand it over unprompted.
- [ ] Say out loud what that second table is and is not. It resolves the full
      runtime tree, but from **our** lockfile — they installed a subset of the
      items, possibly at different versions inside the same caret ranges. It is
      an upper bound, not their bill of materials. Theirs comes from their own
      lockfile, after eject, once:

      ```bash
      npx license-checker --production --summary
      ```

      Run it *for* them if procurement is asking; it takes a minute and it is
      the number their legal side will actually accept.
- [ ] Optional — if they want to extend the kit themselves, copy `registry/` and
      `registry.json` too. Tell them explicitly whether you are doing this; it is
      the difference between "you own these components" and "you own the factory".

### 5. Confirm the environment, in writing

- [ ] **Browser floor: Safari 16.4+ / Chrome 111+ / Firefox 128+.** Tailwind v4
      and OKLCH colours require it. Get this confirmed *before* the project
      starts, not at delivery.
- [ ] **Tailwind v4.** See the compatibility section below — this is the one that
      has actually bitten.

## Compatibility, before you start a project

Learned by pulling reno-ui into a running product rather than a fresh scaffold.
Check these at kickoff; each one is far more expensive to discover later.

| Check | Why it matters |
|---|---|
| **Tailwind v4?** | A hard requirement — see [tailwind-v4-requirement.md](./tailwind-v4-requirement.md), which also measures what the upgrade costs. A v3 project can still run most primitives through the shim documented there, but gets no theme presets and no support. Either way, do not install `@reno/theme-*` into a project that has its own design system: it overwrites `--primary` with an `oklch(…)` value, and every remaining `hsl(var(--primary))` reference then resolves to nothing. Map their tokens with `@theme inline` instead. |
| **Does `src/components/ui/` already exist?** | reno writes there by default and will overwrite same-named files. Point `aliases.ui` at a separate directory in `components.json` (e.g. `@/components/reno/ui`) before installing anything. |
| **Conflicting versions of a shared dependency?** | Registry items pin version ranges, so a conflict now surfaces at install time. Check `@tanstack/react-table` in particular: `@reno/data-grid` needs v9, and v9 removed `useReactTable` and `get*RowModel`, so it cannot coexist with v8 code under one specifier. Either migrate that code or alias one version (`"@tanstack/react-table-v9": "npm:@tanstack/react-table@9"`). |
| **Which colour utilities does their Tailwind config define?** | reno components use `bg-success`, `bg-warning`, `bg-info` and `bg-overlay`. A config without those keys emits no CSS at all for them — the element renders transparent, silently. |
| **Do they have the `--density-*` scale?** | Every reno control reads its height and padding from ten `--density-*` custom properties rather than a fixed `h-10`. A project that does not declare them gets `height: var(--density-control-height)` with nothing behind it, which collapses to `auto`. Values and the copy-paste block are in [tailwind-v4-requirement.md](./tailwind-v4-requirement.md). |
| **Their ESLint setup** | Installed files are linted by *their* config. Report anything in shipped source that assumes a plugin they do not have. |

## After delivery

- [ ] The customer can keep using the public registry — nothing is revoked. Eject
      is about a clean contract, not access control.
- [ ] Note in the handover document which reno-ui version the components came
      from. They own a snapshot; later registry changes will not reach them.
