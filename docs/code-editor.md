# CodeEditor

`@reno/code-editor` wraps [CodeMirror 6](https://codemirror.net/) through
`@uiw/react-codemirror`. It exists because two reno projects independently
reached for the same three packages to put a raw-HTML field on a screen, and
both then wrote the same wrapper around them.

```tsx
import { CodeEditor } from "@/components/ui/code-editor";

<CodeEditor value={html} onChange={setHtml} label="Nội dung HTML" />;
```

## Where this wrapper is deliberately thin

Every other heavy wrapper in reno hides its upstream completely. `DataGrid`
takes no TanStack type; `Chart` takes no recharts element. A major version of
either is a change inside one directory rather than across every consuming
project, and that is the whole reason those wrappers are thick.

`CodeEditor` breaks that rule in exactly one place:

```ts
extensions?: unknown[];
```

CodeMirror's cost is not its API, it is its **language set** — around forty
packages, of which reno ships one. Wrapping the other thirty-nine would be
building for demand that does not exist, in a library whose scope is already the
thing most at risk. So `language` covers what is proven (`html`, which is what
both source projects edit), and `extensions` is the way out for everything else:

```tsx
import { css } from "@codemirror/lang-css";

<CodeEditor value={value} onChange={setValue} extensions={[css()]} />;
```

Two consequences worth stating rather than discovering:

- **The type is `unknown[]`, not `Extension[]`, on purpose.** A CodeMirror type
  in a public prop would drag every consuming project into CodeMirror's version
  timeline — the precise failure the other wrappers avoid. The cast is the
  project's to make, which also means the project owns the breakage if CodeMirror
  changes that type.
- **Adding a language to `CodeEditor` later is not a breaking change**, because
  this door was open from the first release. A project that needed CSS in the
  meantime keeps working; its `extensions` entry simply becomes redundant.

## Colours come from tokens, including the syntax colours

CodeMirror ships a light and a dark theme, and the bundled "basic setup"
registers a default highlight style on top. All three carry hardcoded palettes,
and all three live in the package's JavaScript — `reno-tokens/no-raw-color`
scans this repository, so it would never see them. An editor themed that way
looks the same in an ERP screen as in an e-learning one, which is the one thing
reno-ui exists to prevent.

So the component switches all three off (`theme="none"`,
`basicSetup={{ syntaxHighlighting: false }}`) and supplies its own, where every
colour is a `var(--...)` reference. Switching preset re-colours the editor,
syntax included, with no code change.

The syntax colours reuse the chart ramp (`--chart-1` … `--chart-5`). That ramp
is the only set of tokens a preset defines specifically so its members are
distinguishable from one another, which is what highlighting needs. Inventing
`--code-tag`, `--code-string` and the rest would mean five new tokens per preset
and five more contrast pairs to keep passing, for a benefit nobody has asked for.

| Role | Token |
|---|---|
| Tag and element names | `--chart-1` |
| Attribute, property and variable names | `--chart-2` |
| Strings and attribute values | `--chart-3` |
| Keywords and operators | `--chart-4` |
| Numbers, booleans, entities | `--chart-5` |
| Comments, doctype, brackets | `--muted-foreground` |
| Invalid syntax | `--destructive` |

CodeMirror always mounts a base theme underneath, and picks its light or dark
variant from a facet that cannot be set correctly here — whether reno is in dark
mode is decided by a class on `<html>`, which this module cannot read. The base
light variant is therefore always what sits underneath, and `reno-theme.ts`
overrides every surface it colours. If a base-theme surface is ever missed, the
symptom is a light-grey patch inside a dark editor.

## `readOnly` blocks the write, not the reading

`readOnly` sets CodeMirror's read-only state. The text box keeps
`contenteditable`, so it stays focusable, selectable and copyable — a keyboard
user can still read the code.

The tempting shortcut, `editable={false}`, does something different: it removes
`contenteditable` and takes the field out of the tab order with it, which makes
the code unreachable rather than unwritable.

## What this is not

- **Not a formatter or a linter.** Neither is configured. Both are available as
  CodeMirror extensions and go in through `extensions`.
- **Not a sanitizer.** HTML typed here is exactly what `onChange` returns. Any
  document that reaches a browser must be sanitized server-side; an editor is
  not a security boundary.
- **Not a diff or merge view.** Those are separate CodeMirror packages, and
  nothing in reno needs them yet.

## Bundle

CodeMirror reaches a project only if that project installs `@reno/code-editor`.
`scripts/check-boundaries.mjs` fails if any other primitive imports
`@uiw/react-codemirror`, `@codemirror/*` or `@lezer/*` — the same split, for the
same reason, as `chart`/recharts, `carousel`/Embla and `table`/TanStack.
