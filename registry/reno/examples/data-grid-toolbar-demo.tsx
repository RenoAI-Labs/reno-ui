"use client";

import * as React from "react";

import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import { emptyGridState, type GridState } from "@/lib/grid-state";

const COLUMNS = [
  { id: "code", label: "Mã đơn", canHide: false },
  { id: "customer", label: "Khách hàng" },
  { id: "status", label: "Trạng thái" },
  { id: "total", label: "Tổng tiền" },
];

const FILTER_LABELS: Record<string, string> = {
  status: "Trạng thái",
  customer: "Khách hàng",
};

/**
 * The toolbar on its own, with the state it drives printed underneath.
 *
 * Shown without a grid on purpose: the toolbar is a controlled view over
 * `GridState` and holds nothing but the search debounce, so the state dump below
 * is the whole contract. Search is debounced — the JSON updates a moment after
 * you stop typing, which is the request-per-keystroke problem being avoided.
 */
export default function DataGridToolbarDemo() {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(25),
    columnFilters: [{ id: "status", value: "Đã thanh toán" }],
  }));

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <DataGridToolbar
        state={state}
        onStateChange={setState}
        columns={COLUMNS}
        describeFilter={(filter) =>
          `${FILTER_LABELS[filter.id] ?? filter.id}: ${String(filter.value)}`
        }
        onExport={() => undefined}
      />

      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
        {JSON.stringify(
          {
            globalFilter: state.globalFilter,
            columnFilters: state.columnFilters,
            columnVisibility: state.columnVisibility,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
