/**
 * The public state and column vocabulary of the reno DataGrid.
 *
 * Separate from the `useDataGrid` hook so a project can type its own state,
 * URL sync or React Query keys against these without importing the grid — and
 * without importing TanStack Table at all.
 */

import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

import type { FilterOp, GridQuery } from "@/lib/grid-query";

/**
 * The feature set every reno grid registers.
 *
 * Listed explicitly rather than using `stockFeatures` because v9 features are
 * tree-shakable — a table only pays for what it imports, which is the whole
 * reason this library is on v9.
 */
export const gridFeatures = tableFeatures({
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,

  /*
    Filter functions are opt-in in v9, for the same tree-shaking reason the
    features are — and leaving the slot empty fails silently. A column filter
    whose function cannot be resolved is skipped: the toolbar writes the filter,
    the chip appears, the row count does not move. Measured on the showcase
    before this was registered: filtering by hire source left the footer reading
    "1–10 of 240".

    Two, not the whole set. `includesString` is what `filterFn: "auto"` resolves
    to for a string column, so it is the default path. `equalsString` is what a
    faceted filter means — the toolbar's filter menu writes one exact value, and
    substring matching there would make a facet for "Kỹ thuật" also match every
    department containing it. Faceted columns should say
    `filterFn: "equalsString"`.
  */
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
});

export type GridFeatures = typeof gridFeatures;

/** A column definition bound to reno's feature set. */
export type GridColumn<TData extends RowData> = ColumnDef<GridFeatures, TData, unknown>;

/**
 * Type-safe column builder. Keys are checked against `TData`, and each column
 * keeps its own value type — no `any` anywhere in a consumer's column list.
 *
 * ```ts
 * const columns = createGridColumns<Order>((col) => [
 *   col.accessor("code", { header: "Mã đơn" }),
 *   col.accessor("total", { header: "Tổng tiền", cell: (c) => format(c.getValue()) }),
 * ]);
 * ```
 */
export function createGridColumns<TData extends RowData>(
  build: (
    helper: ReturnType<typeof createColumnHelper<GridFeatures, TData>>,
  ) => unknown[],
): GridColumn<TData>[] {
  const helper = createColumnHelper<GridFeatures, TData>();
  return build(helper) as GridColumn<TData>[];
}

/** Where a column is pinned. `start`/`end` rather than left/right so RTL works. */
export type GridPinnedPosition = false | "start" | "end";

/**
 * Everything the grid owns, in one object.
 *
 * Kept flat and serialisable so a project can drop it into URL state, React
 * Query keys, or a store without unwrapping anything.
 */
export type GridState = {
  pagination: { pageIndex: number; pageSize: number };
  sorting: { id: string; desc: boolean }[];
  columnFilters: { id: string; value: unknown }[];
  globalFilter: string;
  /**
   * Only selected rows appear. TanStack v9 removes a key on deselect rather
   * than setting it false, so `Record<string, true>` is the honest type — a
   * `boolean` map would invite `if (rowSelection[id] === false)` checks that
   * never match.
   */
  rowSelection: Record<string, true>;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  /** `start`/`end` rather than left/right, so the same state works in RTL. */
  columnPinning: { start: string[]; end: string[] };
  columnSizing: Record<string, number>;
};

export function emptyGridState(pageSize = 25): GridState {
  return {
    pagination: { pageIndex: 0, pageSize },
    sorting: [],
    columnFilters: [],
    globalFilter: "",
    rowSelection: {},
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { start: [], end: [] },
    columnSizing: {},
  };
}

// ---------------------------------------------------------------------------
// GridState <-> GridQuery
// ---------------------------------------------------------------------------

/**
 * `GridState` is what the grid renders from; `GridQuery` is what the backend and
 * the URL speak. They overlap but are not the same: state also carries pinning,
 * sizing, ordering and selection, none of which a backend cares about.
 *
 * These two functions are the only place the translation happens — in
 * particular the 0-based `pageIndex` / 1-based `page` boundary, which is exactly
 * the kind of off-by-one that otherwise gets rewritten slightly differently in
 * every project.
 */

export function gridStateToQuery(state: GridState): GridQuery {
  return {
    page: state.pagination.pageIndex + 1,
    pageSize: state.pagination.pageSize,
    sort: state.sorting.map((s) => ({ id: s.id, desc: s.desc })),
    filters: state.columnFilters.map((f) => ({
      id: f.id,
      // Column filters carry no operator of their own; `eq` is the sane default
      // and a project needing another operator sets it on the filter value.
      op: (f.value as { op?: FilterOp })?.op ?? "eq",
      value: (f.value as { value?: unknown })?.value ?? f.value,
    })),
    search: state.globalFilter || undefined,
  };
}

/**
 * Fold a query (typically parsed from the URL) back into grid state.
 *
 * `base` supplies everything the query does not describe — pinning, sizing,
 * column order, selection — so restoring from a URL never silently discards the
 * user's column layout.
 */
export function queryToGridState(query: GridQuery, base: GridState = emptyGridState()): GridState {
  return {
    ...base,
    pagination: {
      pageIndex: Math.max(0, query.page - 1),
      pageSize: query.pageSize,
    },
    sorting: query.sort.map((s) => ({ id: s.id, desc: s.desc })),
    columnFilters: query.filters.map((f) => ({
      id: f.id,
      value: f.op === "eq" ? f.value : { op: f.op, value: f.value },
    })),
    globalFilter: query.search ?? "",
  };
}
