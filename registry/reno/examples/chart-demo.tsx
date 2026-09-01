"use client";

import * as React from "react";

import { Chart, type ChartKind } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

/**
 * Same data, three kinds — the point of the demo is that switching `kind` is the
 * only change, and that the series colours follow the active preset.
 */

const DATA = [
  { month: "T1", moi: 128, quayLai: 84 },
  { month: "T2", moi: 152, quayLai: 96 },
  { month: "T3", moi: 141, quayLai: 112 },
  { month: "T4", moi: 186, quayLai: 121 },
  { month: "T5", moi: 173, quayLai: 138 },
  { month: "T6", moi: 210, quayLai: 154 },
];

const SERIES = [
  { key: "moi", label: "Khách mới" },
  { key: "quayLai", label: "Khách quay lại" },
];

const KINDS: { value: ChartKind; label: string }[] = [
  { value: "bar", label: "Cột" },
  { value: "line", label: "Đường" },
  { value: "area", label: "Vùng" },
];

const number = new Intl.NumberFormat("vi-VN");

export default function ChartDemo() {
  const [kind, setKind] = React.useState<ChartKind>("bar");

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <div className="flex flex-wrap gap-[var(--density-gap)]">
        {KINDS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={kind === option.value ? "default" : "outline"}
            onClick={() => setKind(option.value)}
            aria-pressed={kind === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Chart
        data={DATA}
        xKey="month"
        series={SERIES}
        kind={kind}
        aria-label="Khách hàng theo tháng"
        formatValue={(value) => number.format(value)}
      />
    </div>
  );
}
