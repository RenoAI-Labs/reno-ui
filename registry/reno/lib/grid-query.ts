/**
 * The wire contract between a reno DataGrid and a backend.
 *
 * Every reno project sends the same query shape, so backend teams implement it
 * once instead of inventing a pagination/sort/filter convention per project.
 * Changing this after several projects have shipped is expensive, so it is
 * deliberately small and closed.
 *
 * The grid never fetches. It emits state; the project wires that to its own data
 * layer (React Query, server actions, whatever). These helpers exist to make the
 * URL round-trip lossless, which is what makes a filtered view shareable.
 *
 * See docs/data-grid-server-contract.md for the backend-facing spec.
 */

/** Comparison operators a column filter may use. */
export type FilterOp =
  | "eq"
  | "ne"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull";

export type GridSort = {
  /** Column id, matching the `id` of a ColumnDef. */
  id: string;
  desc: boolean;
};

export type GridFilter = {
  id: string;
  op: FilterOp;
  /**
   * `between` takes a two-element tuple, `in`/`notIn` take an array,
   * `isNull`/`isNotNull` ignore it entirely.
   */
  value: unknown;
};

export type GridQuery = {
  /** 1-based. Page 1 is the first page — off-by-one bugs at the API boundary are worse than the small asymmetry with TanStack's 0-based index. */
  page: number;
  pageSize: number;
  /** Multi-column sort, most significant first. */
  sort: GridSort[];
  filters: GridFilter[];
  /** Free-text search across whatever the backend deems searchable. */
  search?: string;
};

export type GridResponse<TRow> = {
  rows: TRow[];
  /** Total rows matching the current filters, ignoring pagination. */
  total: number;
};

/**
 * Row selection that survives paging.
 *
 * The naive `string[]` of selected ids breaks the moment a user clicks
 * "select all" on a filtered 50,000-row result: the client does not have the
 * ids. `exclude` mode expresses "everything matching the current filters,
 * except these", which the backend can act on with the query it already has.
 *
 * A bulk action must send the `GridQuery` alongside an `exclude` selection —
 * the selection is meaningless without the filters it was made under.
 */
export type GridSelection =
  | { mode: "include"; ids: readonly string[] }
  | { mode: "exclude"; ids: readonly string[] };

export const EMPTY_SELECTION: GridSelection = { mode: "include", ids: [] };

export function isRowSelected(selection: GridSelection, id: string): boolean {
  return selection.mode === "include"
    ? selection.ids.includes(id)
    : !selection.ids.includes(id);
}

/**
 * How many rows a selection covers, given the total for the current filters.
 * `exclude` mode cannot be counted client-side without that total.
 */
export function selectionCount(selection: GridSelection, total: number): number {
  return selection.mode === "include"
    ? selection.ids.length
    : Math.max(0, total - selection.ids.length);
}

export const DEFAULT_PAGE_SIZE = 25;

export function emptyQuery(pageSize: number = DEFAULT_PAGE_SIZE): GridQuery {
  return { page: 1, pageSize, sort: [], filters: [], search: undefined };
}

// ---------------------------------------------------------------------------
// URL serialisation
// ---------------------------------------------------------------------------

/**
 * Encoding is chosen to stay readable in an address bar, because the point of
 * URL state is that someone can paste a link into chat and their colleague sees
 * the same view:
 *
 *   ?page=2&size=50&sort=name:asc,created:desc&f=status:eq:active&f=age:gte:18&q=hoa
 *
 * Operands are individually percent-encoded so a value containing `:` or `,`
 * round-trips intact.
 */
const PARAM = {
  page: "page",
  pageSize: "size",
  sort: "sort",
  filter: "f",
  search: "q",
} as const;

const OPS_WITHOUT_VALUE = new Set<FilterOp>(["isNull", "isNotNull"]);
const OPS_WITH_LIST = new Set<FilterOp>(["in", "notIn", "between"]);

const ALL_OPS = new Set<FilterOp>([
  "eq", "ne", "contains", "startsWith", "endsWith", "gt", "gte", "lt", "lte",
  "between", "in", "notIn", "isNull", "isNotNull",
]);

function encodeFilterValue(filter: GridFilter): string {
  if (OPS_WITHOUT_VALUE.has(filter.op)) return "";
  if (OPS_WITH_LIST.has(filter.op)) {
    const list = Array.isArray(filter.value) ? filter.value : [filter.value];
    return list.map((v) => encodeURIComponent(String(v))).join(",");
  }
  return encodeURIComponent(String(filter.value));
}

function decodeFilterValue(op: FilterOp, raw: string): unknown {
  if (OPS_WITHOUT_VALUE.has(op)) return null;
  if (OPS_WITH_LIST.has(op)) {
    return raw === "" ? [] : raw.split(",").map((v) => decodeURIComponent(v));
  }
  return decodeURIComponent(raw);
}

export function toSearchParams(query: GridQuery): URLSearchParams {
  const params = new URLSearchParams();

  // Defaults are omitted so a pristine grid produces a clean URL.
  if (query.page > 1) params.set(PARAM.page, String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set(PARAM.pageSize, String(query.pageSize));
  }
  if (query.sort.length > 0) {
    params.set(
      PARAM.sort,
      query.sort.map((s) => `${encodeURIComponent(s.id)}:${s.desc ? "desc" : "asc"}`).join(","),
    );
  }
  for (const filter of query.filters) {
    const value = encodeFilterValue(filter);
    params.append(
      PARAM.filter,
      value === ""
        ? `${encodeURIComponent(filter.id)}:${filter.op}`
        : `${encodeURIComponent(filter.id)}:${filter.op}:${value}`,
    );
  }
  if (query.search) params.set(PARAM.search, query.search);

  return params;
}

/**
 * Parse back into a `GridQuery`. Malformed segments are dropped rather than
 * thrown on: URLs get hand-edited and truncated by chat clients, and a broken
 * filter should degrade to "no filter", never to a crashed page.
 */
export function parseSearchParams(
  input: URLSearchParams | string,
  defaults: { pageSize?: number } = {},
): GridQuery {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const pageSize = Number(params.get(PARAM.pageSize)) || defaults.pageSize || DEFAULT_PAGE_SIZE;
  const page = Number(params.get(PARAM.page)) || 1;

  const sort: GridSort[] = [];
  const rawSort = params.get(PARAM.sort);
  if (rawSort) {
    for (const segment of rawSort.split(",")) {
      const [id, dir] = segment.split(":");
      if (!id) continue;
      sort.push({ id: decodeURIComponent(id), desc: dir === "desc" });
    }
  }

  const filters: GridFilter[] = [];
  for (const raw of params.getAll(PARAM.filter)) {
    // Split into at most 3 parts: the value may itself contain colons.
    const first = raw.indexOf(":");
    if (first === -1) continue;
    const second = raw.indexOf(":", first + 1);

    const id = decodeURIComponent(raw.slice(0, first));
    const op = (second === -1 ? raw.slice(first + 1) : raw.slice(first + 1, second)) as FilterOp;
    if (!id || !ALL_OPS.has(op)) continue;

    const rest = second === -1 ? "" : raw.slice(second + 1);
    filters.push({ id, op, value: decodeFilterValue(op, rest) });
  }

  const search = params.get(PARAM.search) ?? undefined;

  return { page: Math.max(1, page), pageSize, sort, filters, search: search || undefined };
}
