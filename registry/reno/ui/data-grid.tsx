"use client";

import * as React from "react";
import type { RowData } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { resolveLabels, type DataGridLabels } from "@/lib/grid-labels";
import type { GridSelection } from "@/lib/grid-query";
import { useDataGrid } from "@/hooks/use-data-grid";
import type { GridColumn, GridState } from "@/lib/grid-state";
import {
  DataGridProvider,
  type ColumnLayout,
} from "@/components/ui/data-grid/data-grid-context";
import { DataGridBody } from "@/components/ui/data-grid/data-grid-body";
import { DataGridHeaderCell } from "@/components/ui/data-grid/data-grid-header";
import { DataGridPagination } from "@/components/ui/data-grid/data-grid-pagination";
import {
  DataGridEmpty,
  DataGridError,
  DataGridSkeleton,
} from "@/components/ui/data-grid/data-grid-states";
import { useDensityRowHeight } from "@/components/ui/data-grid/use-density-row-height";

/**
 * A virtualized data grid for admin and ERP screens.
 *
 * Design rules, all of which exist because the alternative bites later:
 *
 * - **Controlled, one channel.** All state leaves through `onStateChange`. The
 *   grid never fetches and never owns a copy, so it composes with React Query,
 *   URL state or a store without fighting any of them.
 * - **No TanStack types in these props.** `useDataGrid` adapts. A version bump
 *   is a change in this directory, not across every project.
 * - **Every string is a label.** `labels` defaults to Vietnamese; reno-ui
 *   depends on no i18n runtime, so nothing is left behind at handover.
 *
 * Use the plain Table component instead if you only need a styled `<table>` —
 * this one pulls in TanStack, and a light project should not pay for an ERP grid.
 */

export type DataGridProps<TData extends RowData> = {
  columns: GridColumn<TData>[];
  data: TData[];
  state: GridState;
  onStateChange: (updater: (current: GridState) => GridState) => void;
  getRowId: (row: TData) => string;

  /** `server` delegates paging/sorting/filtering to the backend. */
  mode?: "server" | "client";
  /** Total rows matching the current filters. Required when `mode="server"`. */
  rowCount?: number;

  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;

  labels?: Partial<DataGridLabels>;
  /**
   * Only needed for a cross-page selection ("everything matching the filter").
   * When omitted it is derived from `state.rowSelection`, so ordinary
   * per-row selection works with no extra prop and no second source of truth.
   */
  selection?: GridSelection;
  onClearSelection?: () => void;
  onRowClick?: (rowId: string) => void;

  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  enableColumnPinning?: boolean;

  /** Height of the scroll viewport. Virtualization needs a bounded height. */
  height?: number | string;
  className?: string;
  /** Rendered inside the empty state — typically a "create the first one" CTA. */
  emptyAction?: React.ReactNode;
};

export function DataGrid<TData extends RowData>({
  columns,
  data,
  state,
  onStateChange,
  getRowId,
  mode = "server",
  rowCount,
  isLoading = false,
  error,
  onRetry,
  labels: labelOverrides,
  selection,
  onClearSelection,
  onRowClick,
  enableRowSelection = true,
  enableColumnResizing = true,
  enableColumnPinning = true,
  height = 480,
  className,
  emptyAction,
}: DataGridProps<TData>) {
  const labels = React.useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const table = useDataGrid<TData>({
    data,
    columns,
    state,
    onStateChange,
    mode,
    rowCount,
    getRowId,
    enableRowSelection,
    // Must reach the table, not just the header UI: hiding the pin affordance
    // does not stop pinning arriving via initial state or a saved layout.
    enableColumnResizing,
    enableColumnPinning,
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();

  /**
   * The ordered pinned/centre split. Computed every render on purpose: header
   * and body must agree on it exactly, or pinned columns misalign by a pixel or
   * two — visible, and maddening to debug from a screenshot. Memoising it would
   * mean maintaining a dependency list covering pinning, sizing, visibility and
   * order, and a stale entry there is exactly that bug. Three short array maps
   * are cheaper than the risk.
   */
  const toEntry = (c: { id: string; getSize: () => number }) => ({
    id: c.id,
    width: c.getSize(),
  });
  const layout: ColumnLayout = {
    start: table.getPinnedVisibleLeafColumns("start").map(toEntry),
    center: table.getCenterVisibleLeafColumns().map(toEntry),
    end: table.getPinnedVisibleLeafColumns("end").map(toEntry),
  };

  const totalWidth = table.getVisibleLeafColumns().reduce((sum, c) => sum + c.getSize(), 0);
  const total = mode === "server" ? (rowCount ?? 0) : rows.length;

  // Density drives row height, so ERP renders more rows per screen than
  // e-learning with no prop and no code change.
  const rowHeight = useDensityRowHeight(scrollRef);

  const showEmpty = !isLoading && !error && rows.length === 0;

  // One source of truth: an explicit `selection` wins (it can express "all rows
  // matching the filter", which a client-side id map cannot), otherwise the
  // grid's own row-selection state is the selection.
  const effectiveSelection = React.useMemo<GridSelection>(
    () => selection ?? { mode: "include", ids: Object.keys(state.rowSelection) },
    [selection, state.rowSelection],
  );

  return (
    <DataGridProvider
      value={{ labels, layout, isLoading, enableColumnPinning, enableColumnResizing }}
    >
      <div
        data-slot="data-grid"
        className={cn("flex flex-col overflow-hidden rounded-lg border border-border", className)}
      >
        <div
          ref={scrollRef}
          className="relative overflow-auto"
          style={{ height }}
        >
          <table
            className="w-full border-separate border-spacing-0 text-sm"
            style={{ minWidth: totalWidth, display: "grid" }}
          >
            <thead
              className="sticky top-0 z-[var(--z-sticky)]"
              style={{ display: "grid" }}
            >
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
                  {headerGroup.headers.map((header) => (
                    <DataGridHeaderCell key={header.id} header={header} />
                  ))}
                </tr>
              ))}
            </thead>

            {!showEmpty && !error && !(isLoading && rows.length === 0) ? (
              <DataGridBody
                rows={rows}
                onRowClick={onRowClick}
                estimatedRowHeight={rowHeight}
                scrollRef={scrollRef}
              />
            ) : null}
          </table>

          {isLoading && rows.length === 0 ? (
            <DataGridSkeleton
              columnCount={table.getVisibleLeafColumns().length}
              labels={labels}
            />
          ) : null}
          {error ? <DataGridError labels={labels} onRetry={onRetry} /> : null}
          {showEmpty ? <DataGridEmpty labels={labels}>{emptyAction}</DataGridEmpty> : null}
        </div>

        <DataGridPagination
          labels={labels}
          pageIndex={state.pagination.pageIndex}
          pageSize={state.pagination.pageSize}
          total={total}
          selection={effectiveSelection}
          onClearSelection={
            onClearSelection ??
            (() => onStateChange((current) => ({ ...current, rowSelection: {} })))
          }
          onPageChange={(pageIndex) =>
            onStateChange((current) => ({
              ...current,
              pagination: { ...current.pagination, pageIndex },
            }))
          }
          onPageSizeChange={(pageSize) =>
            onStateChange((current) => ({
              ...current,
              pagination: { pageIndex: 0, pageSize },
            }))
          }
        />
      </div>
    </DataGridProvider>
  );
}
