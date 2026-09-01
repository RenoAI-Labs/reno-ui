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
  scrollRef: React.RefObject<HTMLDivElement | null>;
  virtualizeThreshold?: number;
};

export function DataGridBody<TData extends RowData>({
  rows,
  onRowClick,
  estimatedRowHeight,
  scrollRef,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
}: BodyProps<TData>) {
  if (rows.length <= virtualizeThreshold) {
    return (
      <tbody data-slot="data-grid-body" style={{ display: "block" }}>
        {rows.map((row) => (
          <DataGridRow
            key={row.id}
            row={row}
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
      scrollRef={scrollRef}
    />
  );
}

function VirtualizedBody<TData extends RowData>({
  rows,
  onRowClick,
  estimatedRowHeight,
  scrollRef,
}: Omit<BodyProps<TData>, "virtualizeThreshold">) {
  // React Compiler cannot analyse TanStack Virtual's returned functions, so it
  // skips this component rather than memoising it. That is an upstream
  // limitation, not a defect here — and it applies only to the large-list path,
  // which is why the plain body above is kept separate.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    // A larger overscan costs a few extra rows of DOM but removes the blank
    // band users see when flicking a trackpad hard.
    overscan: 8,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <tbody
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
