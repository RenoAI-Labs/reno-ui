# DataGrid server contract

For backend engineers. This is everything a reno DataGrid sends and everything it
expects back. Implement it once and the same endpoint shape works for every reno
project.

Types live in `registry/reno/lib/grid-query.ts` and ship with the component, so
frontend and backend can share them literally if both are TypeScript.

## Request

```ts
type GridQuery = {
  page: number;        // 1-based
  pageSize: number;
  sort: { id: string; desc: boolean }[];   // most significant first
  filters: { id: string; op: FilterOp; value: unknown }[];
  search?: string;     // free text
};
```

`page` is **1-based**. TanStack uses a 0-based index internally, and the grid
converts before it reaches you: an off-by-one at the API boundary is a worse bug
than the small asymmetry.

`id` is the column id, agreed between frontend and backend. It is not
necessarily a database column — map it explicitly and reject unknown ids rather
than interpolating them into SQL.

### Operators

| `op` | Meaning | `value` |
|---|---|---|
| `eq`, `ne` | equals / not equals | scalar |
| `contains`, `startsWith`, `endsWith` | substring match | string |
| `gt`, `gte`, `lt`, `lte` | comparison | scalar |
| `between` | inclusive range | `[from, to]` |
| `in`, `notIn` | set membership | array |
| `isNull`, `isNotNull` | null check | ignored |

Filters combine with **AND**. There is no OR and no nesting. That is a
deliberate limit: every project that has needed OR has actually needed a named
server-side view, which is cheaper to build and far cheaper to secure than a
client-supplied boolean tree.

`search` is a single free-text term. Which columns it covers is the backend's
decision — document it per endpoint.

## Response

```ts
type GridResponse<TRow> = {
  rows: TRow[];
  total: number;   // rows matching the filters, IGNORING pagination
};
```

`total` must ignore pagination. The grid computes page count and the "1–25 of
214" label from it, and cannot function without it. If an exact count is too
expensive at your scale, say so before the grid is built rather than returning
an approximation silently — the UI has to be designed differently for that case.

## URL encoding

The grid can mirror its state into the URL so a filtered view is shareable. The
format is stable and both directions are covered by tests:

```
?page=2&size=50&sort=name:asc,created:desc&f=status:eq:active&f=age:gte:18&q=hoa
```

- Defaults are omitted, so a pristine grid produces a clean URL.
- Operands are individually percent-encoded, so a value containing `:` or `,`
  round-trips intact.
- Malformed segments are dropped, not thrown on. URLs get truncated by chat
  clients and hand-edited; a broken filter degrades to no filter rather than a
  crashed page.

Helpers: `toSearchParams(query)` and `parseSearchParams(params)`.

## Wiring it up

`GridState` is what the grid renders from; `GridQuery` is what the backend and
the URL speak. `gridStateToQuery` / `queryToGridState` are the only place the
translation lives — including the 0-based `pageIndex` to 1-based `page`
boundary, so that off-by-one is written once rather than per project.

```tsx
const { query, setQuery } = useDataGridUrlState();          // URL is the state
const state = React.useMemo(() => queryToGridState(query), [query]);
const { data } = useQuery({
  queryKey: ["orders", query],
  queryFn: () => fetchOrders(query),                        // send GridQuery as-is
});

<DataGrid
  state={state}
  onStateChange={(updater) => setQuery(gridStateToQuery(updater(state)))}
  data={data?.rows ?? []}
  rowCount={data?.total ?? 0}
  mode="server"
  columns={columns}
  getRowId={(row) => row.id}
/>
```

`queryToGridState` takes an optional `base` for everything the query does not
describe — column pinning, sizing, order, selection — so restoring from a URL
never silently discards the user's column layout.

## Selection and bulk actions

This is the part that is usually got wrong, so it is specified rather than left
to each project.

### The checkbox column is not automatic

`enableRowSelection` defaults to `true`, and on its own it renders nothing.
It turns the selection *state* on; a column still has to draw the control.

```tsx
import { DataGrid, selectionColumn } from "@/components/ui/data-grid";

const columns = [selectionColumn<Order>(), ...orderColumns];
```

Without that first column the grid looks like selection is broken rather than
absent: no checkboxes, no bulk bar, and no error to explain why. `selectionColumn()`
is exported from `data-grid` itself, takes the same optional `labels` override as
the grid, and is worth using rather than hand-rolling — a hand-rolled copy tends
to lose the indeterminate header state, the `selectAll` / `selectRow` labels, and
the guard that stops ticking a box from also firing `onRowClick`.

Pass `enableRowSelection={false}` when a screen has no bulk actions. That also
drops `aria-selected` from every row, so assistive tech stops announcing a
selection the screen does not offer.

```ts
type GridSelection =
  | { mode: "include"; ids: string[] }   // user picked these rows
  | { mode: "exclude"; ids: string[] };  // "everything matching the filters", minus these
```

When a user ticks "select all" on a filtered 50,000-row result, the client does
not have those ids and never will. A `string[]` cannot express the intent. The
grid switches to `exclude` mode instead.

**Therefore: a bulk action endpoint must accept the `GridQuery` alongside the
selection.** An `exclude` selection is meaningless without the filters it was
made under.

```jsonc
// POST /api/orders/bulk-cancel
{
  "selection": { "mode": "exclude", "ids": ["ord_88"] },
  "query": { "page": 1, "pageSize": 25, "sort": [], "filters": [{ "id": "status", "op": "eq", "value": "pending" }] }
}
```

Server-side that reads as: apply the filters, exclude the listed ids, act on the
rest. Ignore `page`/`pageSize` for bulk actions — the user meant the whole
result set, not the page they were looking at.

Guard rails worth having: return the affected count for confirmation before
committing, and cap or queue very large `exclude` operations.

## Faceted filters need a filter function registered

The toolbar's filter menu writes one exact value per column:

```ts
columnFilters: [{ id: "source", value: "referral" }]
```

For that to remove any rows in **client mode**, two things have to be true, and
both fail silently when they are not.

`gridFeatures` must register the filter function. TanStack v9 makes filter
functions opt-in the same way it makes features opt-in, and a column filter
whose function cannot be resolved is skipped — the filter is in the state, the
chip is on screen, the row count does not move. reno registers `includesString`
(what `filterFn: "auto"` resolves to for a string column) and `equalsString`.
Anything else your columns use has to be added there, or passed directly as the
column's `filterFn`, which needs no registration.

And a faceted column should say so:

```ts
col.accessor("source", { header: "Nguồn", filterFn: "equalsString" })
```

Without it the column falls back to substring matching, so a facet for
"Kỹ thuật" also matches every department whose name contains it. Exact is what a
facet means.

None of this applies in server mode: `manualFiltering` is on, so the filters go
to your backend as `GridQuery` and the row models are pass-throughs.

## Reordering columns needs the whole column list

The columns menu offers **Sang trái / Sang phải** per column, which writes
`GridState.columnOrder`. It only appears when the toolbar is given `columnIds`:

```tsx
const TOOLBAR_COLUMNS = [{ id: "name", label: "Họ tên" }, /* … */];
const COLUMN_IDS = ["select", ...TOOLBAR_COLUMNS.map((column) => column.id)];

<DataGridToolbar columns={TOOLBAR_COLUMNS} columnIds={COLUMN_IDS} … />
```

Two lists, on purpose. `columns` describes the columns a menu shows; TanStack
reads `columnOrder` as the grid's **entire** column list and relocates whatever
is missing from it. Seed it from the menu description and the selection
checkbox — which no menu shows — lands at the far right the first time anyone
reorders anything. Nothing errors; the layout is just wrong. So `columnIds` is
declaration order including every column, and without it the entries are not
offered at all.

Three kinds of column are not offered, and keep their place while others move
across them:

- **pinned** — drawn in its own pinned region whatever the order says, so
  moving it would be a control with no visible effect;
- **hidden** — swapping with a column nobody can see looks like a dead button;
- **undescribed** — present in `columnIds` and absent from `columns`. There is
  no label to put in the menu, and this is what keeps a selection checkbox
  first without anyone having to pin it.

Drag-and-drop is deliberately not shipped. It needs `@dnd-kit`, and a menu that
moves one step at a time reaches keyboard and touch users that a drag handle
does not.

## Export: CSV is shipped, the rest is yours

`onExport` reports a format; producing the file is separate, and only one format
comes with reno.

```tsx
import { downloadCsv, toCsv } from "@/lib/grid-export";

<DataGridToolbar
  exportFormats={["csv"]}
  onExport={() => downloadCsv("nhan-su", toCsv(rows, CSV_COLUMNS))}
/>
```

`@reno/grid-export` is a separate item — install it when you want CSV. It looks
like string joining and is not; three things go wrong silently and it handles
all three:

- **Separators inside values.** A comma, a quote or a newline in a cell ends the
  field early. Quoted and doubled per RFC 4180, and only where needed so the
  file stays readable.
- **Excel and Vietnamese.** Without a byte-order mark Excel reads the file as
  the system code page and every accented character arrives as mojibake.
- **Formula injection.** A cell beginning with `=`, `+`, `-`, `@`, a tab or a
  carriage return is a formula to Excel and Sheets. Data someone typed into your
  app then executes on the machine of whoever opens the export. Prefixed with an
  apostrophe rather than stripped, so `-5` stays `-5`.

**Excel and PDF are deliberately not shipped.** Both need a library, and picking
one for a project is not a component library's call — check whatever you choose
against `ALLOWED_DEP_LICENSES` before it reaches a customer's bundle. Do not
offer a format in `exportFormats` that you have not wired: a menu entry that
does nothing teaches people the menu is decorative.

**Import is not shipped either, and for a different reason.** The toolbar's job
is to emit the intent; parsing somebody's spreadsheet — encodings, merged cells,
header guessing, partial failure — is application work with no generic answer.

Declare the exported columns separately from the grid's. An export is a
different document: it wants the raw score rather than a bar, the status label
rather than a badge, and it has no use for the selection checkbox.

**Server mode:** reno holds only the current page, so an export built from
`rows` is that page. Exporting the whole filtered result is a request to your
backend with the same `GridQuery` the grid emits — decide which of the two your
screens mean, and say so in the button.

## Accessibility, and where it stops

The grid writes out `role="grid"`, `rowgroup`, `row`, `columnheader` and
`gridcell` rather than relying on the elements it is built from. It has to: the
table elements carry `display: grid` and `display: flex` so that pinned columns,
a sticky header and a virtualized body can share one layout, and a browser drops
the implicit table semantics of an element whose `display` is not the table value
it was born with. Measured in Chrome's accessibility tree on the docs demo, the
grid exposed **no** rows, columns or cells at all before those roles were
written; it now exposes 26 rows, 5 column headers and 125 cells. `aria-sort` on
the header only means something once the header is a `columnheader`, so it was
inert until then too.

Every control in a header cell is named after its column. That also had to be
written out: an `aria-label` on the sort button replaced the header text the
button wraps, so measured in Chrome on the showcase, six of ten headers reached
the accessibility tree named "Sắp xếp tăng dần" — the column name absent from
the button and, because a cell is named by its content, from the cell as well.
`aria-sort` on a column nobody can name says nothing. The sort control now reads
"Họ tên, Sắp xếp tăng dần" and the per-column menu "Tuỳ chọn cột Họ tên", while
the cell itself is named by the column alone.

A header rendered as an element rather than a string is the normal case — a
glyph beside the text is what makes a wide grid scannable — so none of this can
depend on a plain-string `header`. The names are composed with
`aria-labelledby` against the rendered title, which works whatever a project
renders there.

Rows carry `aria-rowindex` and the grid `aria-rowcount`, because above the
virtualize threshold most rows are not in the DOM and position in the markup says
nothing about position in the page. The count is the current page plus its header
row — not the server total, which would announce "row 12 of 50,000" on a grid
whose indices stop at the page size.

**Not implemented: cell-level keyboard navigation.** The ARIA grid pattern expects
arrow keys to move a focus point between cells with a roving `tabindex`. This grid
has none — interactive controls inside it (sort buttons, checkboxes, the pin menu)
are reached by `Tab` in DOM order, and rows are read with a screen reader's own
table commands. That is enough to perceive and operate the grid, and it is not the
full pattern. A project under a WCAG 2.1 AA commitment should treat grid keyboard
navigation as work it still has to scope.

## Implementation checklist

- [ ] Map every accepted `id` explicitly; reject unknown ids. Never interpolate a
      client-supplied id into SQL.
- [ ] Validate `pageSize` against a maximum. An unbounded `pageSize` is a
      denial-of-service vector.
- [ ] Apply sort deterministically — append a unique tiebreaker (usually the
      primary key), or rows shuffle between pages when the sort column has ties.
- [ ] `total` counts filtered rows, not all rows.
- [ ] `filters` combine with AND; validate `op` against the enum.
- [ ] Bulk endpoints accept `selection` + `query` and honour `exclude` mode.
- [ ] Enforce row-level authorisation on filters and bulk actions, not only on
      the list endpoint.
- [ ] Pass `columnIds` if the columns menu should offer reordering, and include
      every column the grid draws in it.

## Open question

Cursor pagination is not covered. Every reno project so far needs jump-to-page,
which cursors cannot serve. If a dataset arrives where offset pagination is too
slow, that is a contract extension to design deliberately — not something to
improvise per project.
