"use client";

import * as React from "react";
import { flexRender, type Row, type RowData } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import type { GridFeatures } from "@/lib/grid-state";

import { indexOf, useDataGridContext, widthsOf } from "./data-grid-context";
import { pinnedEdgeClass, pinnedStyle } from "./column-pinning";

/**
 * One rendered row. Shared by the plain and virtualized bodies so the two can
 * never drift on cell layout, pinning offsets or selection styling.
 */
export function DataGridRow<TData extends RowData>({
  row,
  rowIndex,
  onRowClick,
  style,
}: {
  row: Row<GridFeatures, TData>;
  /** 1-based position among all the grid's rows, header rows included. */
  rowIndex: number;
  onRowClick?: (rowId: string) => void;
  /** Absolute positioning supplied by the virtualizer, absent when not virtualized. */
  style?: React.CSSProperties;
}) {
  const { layout, enableColumnPinning, enableRowSelection } = useDataGridContext();

  return (
    <tr
      data-slot="data-grid-row"
      // A flex container is not a table row to a browser, so the role is
      // written out. `data-state` styles the selected row and is invisible to
      // assistive tech; `aria-selected` is what announces it.
      role="row"
      aria-rowindex={rowIndex}
      aria-selected={enableRowSelection ? row.getIsSelected() : undefined}
      data-state={row.getIsSelected() ? "selected" : undefined}
      onClick={onRowClick ? () => onRowClick(row.id) : undefined}
      style={{ display: "flex", width: "100%", ...style }}
      className={cn(
        "border-b border-border bg-background transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        onRowClick && "cursor-pointer",
      )}
    >
      {row.getVisibleCells().map((cell) => {
        // Mirrors the header: with pinning off, stored pin state is ignored.
        const pinned = enableColumnPinning ? cell.column.getIsPinned() : false;
        const group =
          pinned === "start" ? layout.start : pinned === "end" ? layout.end : [];
        const groupIndex = pinned === false ? -1 : indexOf(group, cell.column.id);

        return (
          <td
            key={cell.id}
            data-slot="data-grid-cell"
            role="gridcell"
            style={{
              display: "flex",
              alignItems: "center",
              width: cell.column.getSize(),
              ...(pinned === false
                ? {}
                : pinnedStyle(pinned, widthsOf(group), groupIndex)),
            }}
            className={cn(
              "px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] align-middle whitespace-nowrap",
              // A pinned cell needs its own opaque background, otherwise
              // scrolling content shows through it.
              pinned !== false && "bg-background",
              pinnedEdgeClass(pinned, groupIndex, group.length),
            )}
          >
            <span className="truncate">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </span>
          </td>
        );
      })}
    </tr>
  );
}
