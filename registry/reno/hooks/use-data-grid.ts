"use client";

import * as React from "react";
import { useTable, type RowData } from "@tanstack/react-table";
import {
  gridFeatures,
  type GridColumn,
  type GridFeatures,
  type GridState,
} from "@/lib/grid-state";

/**
 * The adapter between reno's public grid API and TanStack Table.
 *
 * Two jobs, both about insulation:
 *
 * 1. **One state channel.** reno exposes a single `state` / `onStateChange`
 *    pair. TanStack v9 has no `onStateChange` — it dropped v8's unified handler
 *    in favour of per-slice callbacks. This hook fans one out into the other, so
 *    a future TanStack upgrade cannot reshape every consuming project's API.
 *
 * 2. **No TanStack types in reno props.** Consumers use `GridState`,
 *    `GridColumn` and `createGridColumns` from `@/lib/grid-state`. They never
 *    import `@tanstack/react-table` themselves, which is what makes a version
 *    swap a change inside this directory rather than across every project.
 *
 * The state vocabulary itself lives in `@/lib/grid-state`, so a project can type
 * against it without importing this hook.
 */

export type UseDataGridOptions<TData extends RowData> = {
  data: TData[];
  columns: GridColumn<TData>[];
  state: GridState;
  onStateChange: (updater: (current: GridState) => GridState) => void;
  /**
   * `server` delegates paging, sorting and filtering to the backend.
   * `client` does it in memory — fine below a couple of thousand rows.
   */
  mode: "server" | "client";
  /** Total rows matching the current filters. Required in server mode. */
  rowCount?: number;
  getRowId: (row: TData) => string;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnPinning?: boolean;
};

/**
 * TanStack's per-slice handlers take an `Updater<T>` — a value or a function.
 * Normalising here keeps that shape out of reno's own state channel.
 */
type Updater<T> = T | ((old: T) => T);

function applyUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

export function useDataGrid<TData extends RowData>({
  data,
  columns,
  state,
  onStateChange,
  mode,
  rowCount,
  getRowId,
  enableRowSelection = true,
  enableColumnResizing = true,
  enableColumnPinning = true,
}: UseDataGridOptions<TData>) {
  const manual = mode === "server";

  /**
   * One setter per slice, each writing through the single `onStateChange`.
   * Built once and kept stable: TanStack re-reads options every render, and a
   * fresh handler identity each time causes avoidable work.
   */
  const set = React.useMemo(() => {
    function slice<K extends keyof GridState>(key: K) {
      return (updater: Updater<GridState[K]>) =>
        onStateChange((current) => {
          const next = applyUpdater(updater, current[key]);
          if (Object.is(next, current[key])) return current;
          return { ...current, [key]: next };
        });
    }
    return {
      pagination: slice("pagination"),
      sorting: slice("sorting"),
      columnFilters: slice("columnFilters"),
      globalFilter: slice("globalFilter"),
      rowSelection: slice("rowSelection"),
      columnVisibility: slice("columnVisibility"),
      columnOrder: slice("columnOrder"),
      columnPinning: slice("columnPinning"),
      columnSizing: slice("columnSizing"),
    };
  }, [onStateChange]);

  /**
   * Changing sort, filter or page size must return to page 1. Without this, a
   * user filtering a 200-page result while on page 47 lands on an empty page —
   * a bug every grid rediscovers on its own.
   */
  const resetPage = React.useCallback(() => {
    onStateChange((current) =>
      current.pagination.pageIndex === 0
        ? current
        : { ...current, pagination: { ...current.pagination, pageIndex: 0 } },
    );
  }, [onStateChange]);

  const table = useTable<GridFeatures, TData>({
    features: gridFeatures,
    data,
    columns,
    getRowId,
    enableRowSelection,
    // Passed through so `column.getCanResize()` / `getCanPin()` agree with what
    // the UI actually offers, instead of the header guessing.
    enableColumnResizing,
    enableColumnPinning,

    // Server mode hands paging/sorting/filtering to the backend; the grid then
    // renders exactly the rows it was given.
    manualPagination: manual,
    manualSorting: manual,
    manualFiltering: manual,
    rowCount: manual ? (rowCount ?? 0) : undefined,

    state: {
      pagination: state.pagination,
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      globalFilter: state.globalFilter,
      rowSelection: state.rowSelection,
      columnVisibility: state.columnVisibility,
      columnOrder: state.columnOrder,
      columnPinning: state.columnPinning,
      columnSizing: state.columnSizing,
    },

    onPaginationChange: set.pagination,
    onSortingChange: (updater) => {
      set.sorting(updater);
      resetPage();
    },
    onColumnFiltersChange: (updater) => {
      set.columnFilters(updater);
      resetPage();
    },
    onGlobalFilterChange: (updater) => {
      set.globalFilter(updater);
      resetPage();
    },
    onRowSelectionChange: set.rowSelection,
    onColumnVisibilityChange: set.columnVisibility,
    onColumnOrderChange: set.columnOrder,
    onColumnPinningChange: set.columnPinning,
    onColumnSizingChange: set.columnSizing,
  });

  return table;
}

export type DataGridTable<TData extends RowData> = ReturnType<typeof useDataGrid<TData>>;
