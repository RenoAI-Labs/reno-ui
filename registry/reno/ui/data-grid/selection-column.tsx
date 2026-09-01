"use client";

import * as React from "react";
import type { RowData } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import { resolveLabels, type DataGridLabels } from "@/lib/grid-labels";
import { createGridColumns, type GridColumn } from "@/lib/grid-state";

/**
 * The checkbox column for row selection.
 *
 * `enableRowSelection` turns the *state* on; something still has to render the
 * control. Shipping that here rather than leaving it to each screen matters for
 * more than convenience: a hand-rolled copy tends to lose the indeterminate
 * header state, the `selectAll` / `selectRow` labels, and the click-guard that
 * stops ticking a box from also firing `onRowClick`. Those labels have always
 * been in `DataGridLabels`; this is what finally uses them.
 */
export function selectionColumn<TData extends RowData>(
  labelOverrides?: Partial<DataGridLabels>,
): GridColumn<TData> {
  const labels = resolveLabels(labelOverrides);

  const [column] = createGridColumns<TData>((col) => [
    col.display({
      id: "select",
      size: 44,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={labels.selectAll}
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
        />
      ),
      cell: ({ row }) => (
        // The grid makes the whole row clickable when `onRowClick` is set, so the
        // checkbox has to stop the event or selecting a row would also open it.
        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            aria-label={labels.selectRow}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          />
        </span>
      ),
    }),
  ]);

  return column;
}
