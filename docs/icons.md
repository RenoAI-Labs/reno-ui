# Icons

reno-ui ships 42 icons across 34 files and, until now, had no policy for any of
it. Two naming conventions coexisted in the same library — `Check` in components
ported from an older shadcn, `CheckIcon` in the ones ported later — so every new
port copied whichever neighbour it happened to sit next to. This page is the
decision, and the parts of it a machine can check are checked.

## The library: `lucide-react`

Interface icons come from `lucide-react` and nothing else. It is already a
dependency of 20 registry items, it is ISC-licensed, and it tree-shakes per
icon, so an item importing three icons costs three icons.

This was re-examined against `@thesvg/react` in September 2026 and the
alternative lost on measurement, not taste: against a 25-icon sample of what
reno-ui actually imports, `@thesvg/react` covered **0**. It has 6,523 exports
and every one of them is a company logo. It is a brand-mark set, not an icon set — see
[Brand logos](#brand-logos-are-not-here) below.

## Naming: always the `*Icon` suffix

```tsx
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
```

Never `import { Check, ChevronsUpDown, X }`, and never an alias that strips the
suffix back off.

Two reasons this is the convention that survives:

1. **It matches shadcn today.** Every future port arrives already spelled this
   way, so the drift stops at the source instead of being cleaned up afterwards.
2. **Single-word icons collide.** `X`, `Circle`, `Search`, `Home`, `Settings`
   and `Inbox` are all ordinary identifiers a component might want for something
   else. The suffix keeps the icon namespace out of the way.

Enforced by `tests/registry-portability.test.ts` ("suffixes every lucide-react
import with Icon"), which walks `registry/reno/` and reads the local binding —
so `Check as CheckIcon` passes and `CheckIcon as Check` does not. The rule is a
test rather than a note in this file because the drift it fixes was created by
people reading neighbouring code, not documentation.

### And the canonical name, not an alias

The suffix rule alone does not finish the job. lucide keeps renamed glyphs
reachable under their old names forever, so `AlertCircleIcon` and
`CircleAlertIcon` are the same drawing under two spellings and both satisfy
"ends with Icon". Left alone, that reintroduces exactly the confusion the suffix
rule was written to end — one library, two names for one thing.

Use the current name. Every alias resolves to a component whose `displayName` is
the canonical one, so the companion test ("uses each glyph's canonical name")
compares against that rather than a hand-written list, and cannot go stale when
lucide renames something. Aliases already caught and corrected:

| Deprecated | Canonical |
|---|---|
| `AlertCircleIcon` | `CircleAlertIcon` |
| `Loader2Icon` | `LoaderCircleIcon` |
| `MoreHorizontalIcon` | `EllipsisIcon` |
| `HomeIcon` | `HouseIcon` |
| `AlignLeftIcon` / `AlignCenterIcon` / `AlignRightIcon` | `TextAlignStartIcon` / `TextAlignCenterIcon` / `TextAlignEndIcon` |

Editor autocomplete offers both spellings, which is how these get in. The test is
the only thing that reliably keeps them out.

## Size and stroke come from context, not from the icon

| Class | Where |
|---|---|
| `size-4` | Default. Buttons, menu items, inputs, most inline use. |
| `size-3.5` | Dense surfaces — data-grid headers, toolbar chips. |
| `size-8` | Empty and error states, where the icon is the illustration. |

Do not set `strokeWidth` on an interface icon. Lucide's default (2) is what the
whole library is drawn at, and a component that overrides it looks subtly wrong
next to every component that does not. If a specific case genuinely needs a
different weight, set it with a comment saying why — the exception should be
visible in review.

Icons are decoration in almost every case reno-ui has: they sit beside a label
that already carries the meaning. Mark those `aria-hidden`. An icon that is the
*only* content of a control needs an accessible name on the control itself
(`aria-label`, or visually hidden text), not on the SVG.

## Brand logos are not here

reno-ui does not and will not ship third-party brand marks — payment logos,
social icons, partner logos. A project that needs them adds the SVG itself or
installs a logo set directly.

The case for pulling in `@thesvg/react` was priced and rejected:

- **122 MB of `node_modules`** in exchange for the three to five logos a typical
  project actually renders.
- **It misses the ones Vietnamese projects need.** No Momo, VNPay, Napas or
  Viettel, so the project ends up hand-adding SVGs regardless — paying the cost
  and still doing the work.
- **It would force a hole in `reno-tokens/no-raw-color`.** Brand marks are
  defined by exact hex values; that is the whole point of a brand mark. Today
  the rule is absolute across `registry/reno/ui/` and `registry/reno/blocks/`,
  and an absolute rule is one nobody has to argue about.

A licensing note worth passing to clients: the MIT license on an icon package
covers the *code*. It does not grant any right to use the trademarks the SVGs
depict. That permission comes from the brand owner or not at all.

### If this is ever reversed

Reversing it means brand marks land in the registry, which means hardcoded hex
in files the `no-raw-color` rule currently forbids outright. **Build the escape
hatch first, before the first logo lands** — retrofitting one under pressure is
how a rule turns into a suggestion.

There is a working precedent to copy rather than invent: the Nhất Nghệ eLearning
codebase runs the same class of gate in
`scripts/check-no-hardcoded-hex.mjs`, which skips any line carrying a
`// hex-ok: <reason>` comment. It is used 37 times, and the failure message
enumerates the three categories that are allowed to use it. Two properties are
what make it hold up: the exemption is per-line and it must state a reason, so
the diff shows exactly what was let through and why.

## Adding an icon

1. Import it from `lucide-react` with the canonical `*Icon` name.
2. Size it from the table above; leave `strokeWidth` alone.
3. `aria-hidden` if a label sits next to it; otherwise name the control.
4. `npm run verify` — the naming test runs there.
