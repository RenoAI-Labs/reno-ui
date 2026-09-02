"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Row, RowData } from "@tanstack/react-table";

import type { GridFeatures } from "@/lib/grid-state";

import { DataGridRow } from "./data-grid-row";

/**
 * The grid body, in two modes.
 *
 * **Below `virtualizeThreshold` rows the body is plain.** Virtualization is not
 * free — it needs a measured scroll element, absolute positioning and a spacer
 * — and a server-mode page of 25 rows gains nothing from it. Paying that cost
 * on the common path would add fragility (and a class of layout bug) for no
 * benefit. Virtualizing starts when the row count actually makes it worthwhile,
 * which in practice means client mode over a large dataset.
 *
 * **Above it, rows are virtualized.** The awkward part is coexisting with pinned
 * columns and a sticky header, which is where most grids break. Two decisions
 * prevent that:
 *
 * 1. Pinned cells use `position: sticky`, not absolute positioning. Sticky
 *    participates in normal flow, so it rides the virtualizer's transform
 *    rather than fighting it.
 * 2. The header is a sticky element outside the scroll transform, so neither it
 *    nor the virtualizer needs to know about the other.
 */

/** Rows at or below this count render without virtualization. */
export const DEFAULT_VIRTUALIZE_THRESHOLD = 100;

type BodyProps<TData extends RowData> = {
  rows: Row<GridFeatures, TData>[];
  onRowClick?: (rowId: string) => void;
  estimatedRowHeight: number;
  /**
   * The scroll viewport, as an element rather than a ref.
   *
   * This is load-bearing for the virtualized path below: TanStack Virtual only
   * attaches its resize and scroll observers once `getScrollElement()` returns a
   * node, and it re-checks that on render. A ref is populated *after* the render
   * that creates it and triggers no second render, so with a ref the virtualizer
   * could stay unattached forever and the body would render a full-height
   * spacer containing no rows. Passing state guarantees the extra render.
   */
  scrollElement: HTMLElement | null;
  virtualizeThreshold?: number;
  /**
   * How many rows precede the first data row — the header rows. `aria-rowindex`
   * counts every row in the grid, header included, so the body cannot start
   * at 1.
   */
  rowIndexOffset: number;
};

export function DataGridBody<TData extends RowData>({
  rows,
  onRowClick,
  estimatedRowHeight,
  scrollElement,
  rowIndexOffset,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
}: BodyProps<TData>) {
  if (rows.length <= virtualizeThreshold) {
    return (
      <tbody role="rowgroup" data-slot="data-grid-body" style={{ display: "block" }}>
        {rows.map((row, index) => (
          <DataGridRow
            key={row.id}
            row={row}
            rowIndex={rowIndexOffset + index + 1}
            onRowClick={onRowClick}
            style={{ height: estimatedRowHeight }}
          />
        ))}
      </tbody>
    );
  }

  return (
    <VirtualizedBody
      rows={rows}
      onRowClick={onRowClick}
      estimatedRowHeight={estimatedRowHeight}
      scrollElement={scrollElement}
      rowIndexOffset={rowIndexOffset}
    />
  );
}

function VirtualizedBody<TData extends RowData>({
  rows,
  onRowClick,
  estimatedRowHeight,
  scrollElement,
  rowIndexOffset,
}: Omit<BodyProps<TData>, "virtualizeThreshold">) {
  // TanStack Virtual keeps its window in a mutable instance and signals updates
  // by forcing a re-render; the values it returns are not derived from props or
  // state React can see. React Compiler therefore caches `getVirtualItems()`
  // from the first render — when the scroll element has not been measured yet
  // and the window is empty — and never recomputes it, so the body renders a
  // full-height spacer containing no rows at all. `"use no memo"` is TanStack's
  // documented opt-out and the only thing that keeps this component correct.
  "use no memo";

  // Bare directive on purpose. The rule that fires here
  // (`react-hooks/incompatible-library`) only exists in the React Compiler-era
  // eslint-plugin-react-hooks; naming it would make this file a hard ESLint
  // error ("Definition for rule ... was not found") in any project on an older
  // plugin — and this file becomes the customer's own source at install time.
  // eslint-disable-next-line
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimatedRowHeight,
    // A larger overscan costs a few extra rows of DOM but removes the blank
    // band users see when flicking a trackpad hard.
    overscan: 8,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <tbody
      role="rowgroup"
      data-slot="data-grid-body"
      style={{
        display: "block",
        position: "relative",
        height: virtualizer.getTotalSize(),
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <DataGridRow
            key={row.id}
            row={row}
            // The virtualizer's own index, not the position in the DOM: only a
            // window of rows is mounted, and they are absolutely positioned, so
            // nothing else tells a reader that this is row 4,312.
            rowIndex={rowIndexOffset + virtualRow.index + 1}
            onRowClick={onRowClick}
            style={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        );
      })}
    </tbody>
  );
}
