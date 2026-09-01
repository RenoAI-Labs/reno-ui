"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";

/**
 * Server-mode DataGrid over a fake backend.
 *
 * The fake `fetchOrders` below is deliberately shaped like a real endpoint —
 * it takes page/sort/search and returns `{ rows, total }` — because the point
 * of the demo is the wiring, not the data. Swap it for a real fetch and nothing
 * else in this file changes.
 */

type Order = {
  id: string;
  code: string;
  customer: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  total: number;
  createdAt: string;
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đã giao",
  cancelled: "Đã huỷ",
};

const STATUS_VARIANT: Record<Order["status"], "secondary" | "success" | "info" | "destructive"> = {
  pending: "secondary",
  paid: "success",
  shipped: "info",
  cancelled: "destructive",
};

const CUSTOMERS = [
  "Công ty TNHH Minh Long",
  "Nguyễn Thị Hoa",
  "Cửa hàng Bách Hoá An Phú",
  "Trần Văn Bình",
  "Công ty CP Đại Việt",
  "Lê Thị Mai",
];

/** Deterministic so the demo renders identically on server and client. */
const ALL_ORDERS: Order[] = Array.from({ length: 10_000 }, (_, i) => {
  const statuses: Order["status"][] = ["pending", "paid", "shipped", "cancelled"];
  return {
    id: `ord_${i + 1}`,
    code: `DH${String(i + 1).padStart(6, "0")}`,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    status: statuses[i % statuses.length],
    total: 50_000 + ((i * 37_000) % 4_950_000),
    createdAt: new Date(2026, 0, 1 + (i % 240)).toISOString().slice(0, 10),
  };
});

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

/** Stands in for a real API call, including the latency that makes states visible. */
function fetchOrders(state: GridState): Promise<{ rows: Order[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let rows = ALL_ORDERS;

      const search = state.globalFilter.trim().toLowerCase();
      if (search) {
        rows = rows.filter(
          (o) =>
            o.code.toLowerCase().includes(search) ||
            o.customer.toLowerCase().includes(search),
        );
      }

      for (const sort of [...state.sorting].reverse()) {
        rows = [...rows].sort((a, b) => {
          const av = a[sort.id as keyof Order];
          const bv = b[sort.id as keyof Order];
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sort.desc ? -cmp : cmp;
        });
      }

      const { pageIndex, pageSize } = state.pagination;
      resolve({
        rows: rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        total: rows.length,
      });
    }, 250);
  });
}

const columns = createGridColumns<Order>((col) => [
  col.accessor("code", { header: "Mã đơn", size: 130 }),
  col.accessor("customer", { header: "Khách hàng", size: 260 }),
  col.accessor("status", {
    header: "Trạng thái",
    size: 150,
    enableSorting: false,
    cell: (ctx) => {
      const status = ctx.getValue() as Order["status"];
      return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
    },
  }),
  col.accessor("total", {
    header: "Tổng tiền",
    size: 150,
    cell: (ctx) => (
      <span className="tabular-nums">{currency.format(ctx.getValue() as number)}</span>
    ),
  }),
  col.accessor("createdAt", { header: "Ngày tạo", size: 130 }),
]);

const TOOLBAR_COLUMNS = [
  { id: "code", label: "Mã đơn", canHide: false },
  { id: "customer", label: "Khách hàng" },
  { id: "status", label: "Trạng thái" },
  { id: "total", label: "Tổng tiền" },
  { id: "createdAt", label: "Ngày tạo" },
];

export default function DataGridDemo() {
  const [state, setState] = React.useState<GridState>(() => emptyGridState(25));
  const [view, setView] = React.useState<{
    rows: Order[];
    total: number;
    /** Which state this data answers. Loading is derived from it. */
    forState: GridState | null;
  }>({ rows: [], total: 0, forState: null });

  React.useEffect(() => {
    let cancelled = false;
    fetchOrders(state).then((result) => {
      // A stale response must not overwrite a newer one — the classic race when
      // a user types fast enough to have two requests in flight.
      if (cancelled) return;
      setView({ rows: result.rows, total: result.total, forState: state });
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  // Derived, not stored: no setState in the effect body, and the flag cannot
  // fall out of sync with the data it describes.
  const isLoading = view.forState !== state;

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <DataGridToolbar
        state={state}
        onStateChange={setState}
        columns={TOOLBAR_COLUMNS}
        onExport={() => window.alert("Xuất dữ liệu — nối vào API của dự án")}
      />
      <DataGrid
        columns={columns}
        data={view.rows}
        state={state}
        onStateChange={setState}
        getRowId={(row) => row.id}
        mode="server"
        rowCount={view.total}
        isLoading={isLoading}
        height={420}
      />
      <p className="text-sm text-muted-foreground">
        Server mode trên tập 10.000 dòng: mỗi lần chỉ tải 1 trang, sort và tìm
        kiếm chạy phía &ldquo;server&rdquo;. Đổi theme preset ở góc trên để thấy
        density đổi chiều cao dòng mà không sửa dòng code nào.
      </p>
    </div>
  );
}
