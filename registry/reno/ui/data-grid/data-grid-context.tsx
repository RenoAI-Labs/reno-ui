"use client";

import * as React from "react";

import type { DataGridLabels } from "@/lib/grid-labels";

/**
 * Shared context for the grid's parts.
 *
 * The header, body and pagination all need the same labels and the same
 * ordered list of visible columns. Threading those through props would mean
 * every part re-declaring the same six props, and would make it easy for one
 * part to be given a stale column list while another is not.
 *
 * Typed loosely on `table` because the grid parts are generic over `TData` and
 * a context cannot be. The root component owns the concrete type; the parts only
 * read table APIs that do not depend on the row type.
 */

export type ColumnLayout = {
  /** Ordered ids of start-pinned columns, with their widths. */
  start: { id: string; width: number }[];
  center: { id: string; width: number }[];
  end: { id: string; width: number }[];
};

export type DataGridContextValue = {
  labels: DataGridLabels;
  layout: ColumnLayout;
  /** True while a request is in flight; parts use it to soften interactions. */
  isLoading: boolean;
  enableColumnResizing: boolean;
  enableColumnPinning: boolean;
};

const DataGridContext = React.createContext<DataGridContextValue | null>(null);

export function DataGridProvider({
  value,
  children,
}: {
  value: DataGridContextValue;
  children: React.ReactNode;
}) {
  return <DataGridContext.Provider value={value}>{children}</DataGridContext.Provider>;
}

export function useDataGridContext(): DataGridContextValue {
  const ctx = React.useContext(DataGridContext);
  if (!ctx) {
    throw new Error("DataGrid parts must be rendered inside <DataGrid>.");
  }
  return ctx;
}

/** Width lookup for a pinned group, in the order the columns are pinned. */
export function widthsOf(group: { id: string; width: number }[]): number[] {
  return group.map((c) => c.width);
}

/** Index of a column within its pinned group, or -1 when it is not in it. */
export function indexOf(group: { id: string; width: number }[], id: string): number {
  return group.findIndex((c) => c.id === id);
}
