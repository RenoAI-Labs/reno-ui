"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DataGrid } from "@/components/ui/data-grid";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";

/**
 * Scroll benchmark for the virtualized path.
 *
 * Measures frames actually painted during a real scroll rather than reporting a
 * synthetic render time, because the acceptance criterion is about how scrolling
 * feels. Numbers are device-dependent — record the machine alongside the result.
 */

type Row = {
  id: string;
  code: string;
  name: string;
  qty: number;
  price: number;
  warehouse: string;
  updatedAt: string;
};

const WAREHOUSES = ["Kho Hà Nội", "Kho Đà Nẵng", "Kho HCM", "Kho Cần Thơ"];

/** Deterministic: a benchmark that changes its own input is not a benchmark. */
const ROWS: Row[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: `sku_${i + 1}`,
  code: `SKU${String(i + 1).padStart(6, "0")}`,
  name: `Sản phẩm ${i + 1}`,
  qty: (i * 7) % 500,
  price: 10_000 + ((i * 13_000) % 990_000),
  warehouse: WAREHOUSES[i % WAREHOUSES.length],
  updatedAt: new Date(2026, 0, 1 + (i % 300)).toISOString().slice(0, 10),
}));

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const columns = createGridColumns<Row>((col) => [
  col.accessor("code", { header: "Mã SKU", size: 140 }),
  col.accessor("name", { header: "Tên sản phẩm", size: 240 }),
  col.accessor("warehouse", { header: "Kho", size: 150 }),
  col.accessor("qty", {
    header: "Tồn",
    size: 100,
    cell: (ctx) => <span className="tabular-nums">{String(ctx.getValue())}</span>,
  }),
  col.accessor("price", {
    header: "Giá",
    size: 150,
    cell: (ctx) => (
      <span className="tabular-nums">{currency.format(ctx.getValue() as number)}</span>
    ),
  }),
  col.accessor("updatedAt", { header: "Cập nhật", size: 130 }),
]);

const MEASURE_MS = 5000;

export function PerfHarness() {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(10_000),
    // Pinning the first column on purpose: pinning combined with virtualization
    // is the pairing that usually breaks, so the benchmark should exercise it.
    columnPinning: { start: ["code"], end: [] },
  }));
  const [result, setResult] = React.useState<string | null>(null);
  const [measuring, setMeasuring] = React.useState(false);

  const measure = React.useCallback(() => {
    setMeasuring(true);
    setResult(null);

    let frames = 0;
    let worstFrame = 0;
    let last = performance.now();
    const start = last;

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      frames += 1;
      if (delta > worstFrame) worstFrame = delta;

      if (now - start < MEASURE_MS) {
        requestAnimationFrame(tick);
        return;
      }
      const elapsed = (now - start) / 1000;
      setResult(
        `${(frames / elapsed).toFixed(1)} FPS trung bình · khung chậm nhất ${worstFrame.toFixed(1)}ms · ${frames} khung / ${elapsed.toFixed(1)}s`,
      );
      setMeasuring(false);
    };

    requestAnimationFrame(tick);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        <Button onClick={measure} disabled={measuring}>
          {measuring ? "Đang đo — cuộn đi!" : "Đo FPS (5 giây)"}
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {result ?? `${ROWS.length.toLocaleString("vi-VN")} dòng đã nạp`}
        </span>
      </div>

      <DataGrid
        columns={columns}
        data={ROWS}
        state={state}
        onStateChange={setState}
        getRowId={(row) => row.id}
        mode="client"
        height={560}
      />

      <p className="text-sm text-muted-foreground">
        Ngưỡng chấp nhận của plan: ≥ 55 FPS khi cuộn 10k dòng trên máy tầm trung.
        Con số phụ thuộc thiết bị — ghi kèm cấu hình máy khi báo cáo.
      </p>
    </div>
  );
}
