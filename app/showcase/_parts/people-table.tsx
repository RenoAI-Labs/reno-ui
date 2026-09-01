"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid, selectionColumn } from "@/components/ui/data-grid";
import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";
import {
  PEOPLE,
  STATUS_LABELS,
  STATUS_VARIANTS,
  currency,
  type Person,
} from "./mock-data";

/**
 * The DataGrid inside a real screen rather than a demo page: toolbar, row
 * selection, status badges, sorting and paging over 240 rows in client mode.
 *
 * Client mode is the honest choice at this size — 240 rows fit in memory, so
 * paging and sorting in the browser avoids inventing a fake backend. Server mode
 * is what an ERP list uses; `registry/reno/examples/data-grid-demo.tsx` shows it.
 */

const columns = createGridColumns<Person>((col) => [
  selectionColumn<Person>(),
  col.accessor("name", { header: "Họ tên", size: 200 }),
  col.accessor("email", { header: "Email", size: 220 }),
  col.accessor("department", { header: "Phòng ban", size: 170 }),
  col.accessor("role", { header: "Chức danh", size: 170 }),
  col.accessor("status", {
    header: "Trạng thái",
    size: 130,
    enableSorting: false,
    cell: (ctx) => {
      const status = ctx.getValue() as Person["status"];
      return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
    },
  }),
  col.accessor("salary", {
    header: "Lương",
    size: 150,
    cell: (ctx) => (
      <span className="tabular-nums">{currency.format(ctx.getValue() as number)}</span>
    ),
  }),
  col.accessor("joinedAt", { header: "Ngày vào", size: 130 }),
]);

const TOOLBAR_COLUMNS = [
  { id: "name", label: "Họ tên", canHide: false },
  { id: "email", label: "Email" },
  { id: "department", label: "Phòng ban" },
  { id: "role", label: "Chức danh" },
  { id: "status", label: "Trạng thái" },
  { id: "salary", label: "Lương" },
  { id: "joinedAt", label: "Ngày vào" },
];

export function PeopleTable() {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(25),
    columnPinning: { start: ["select"], end: [] },
  }));

  const selectedCount = Object.keys(state.rowSelection).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách nhân viên</CardTitle>
        <CardDescription>
          {selectedCount > 0
            ? `Đã chọn ${selectedCount} trên ${PEOPLE.length} nhân viên`
            : `${PEOPLE.length} nhân viên đang được quản lý`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-[var(--density-gap)]">
        <DataGridToolbar
          state={state}
          onStateChange={setState}
          columns={TOOLBAR_COLUMNS}
          onExport={() => undefined}
        />
        <DataGrid
          columns={columns}
          data={PEOPLE}
          state={state}
          onStateChange={setState}
          getRowId={(row) => row.id}
          mode="client"
          height={460}
        />
      </CardContent>
    </Card>
  );
}
