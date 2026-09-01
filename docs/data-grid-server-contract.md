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

## Open question

Cursor pagination is not covered. Every reno project so far needs jump-to-page,
which cursors cannot serve. If a dataset arrives where offset pagination is too
slow, that is a contract extension to design deliberately — not something to
improvise per project.
