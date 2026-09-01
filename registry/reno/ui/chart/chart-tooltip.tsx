"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  chartSeriesColor,
  chartSeriesLabel,
  toChartNumber,
  type ChartSeries,
} from "@/components/ui/chart/chart-series";

/**
 * Tooltip body for the chart.
 *
 * `payload` is typed as `readonly unknown[]` rather than with the recharts
 * payload type, and narrowed here. recharts has reshaped that type across
 * majors; narrowing one array in one file is cheaper than a type import that
 * turns a library upgrade into a compile error in every consuming project.
 */

export type ChartTooltipContentProps = {
  active?: boolean;
  label?: React.ReactNode;
  payload?: readonly unknown[];
  series: ChartSeries[];
  formatValue?: (value: number) => string;
  formatLabel?: (label: React.ReactNode) => React.ReactNode;
  className?: string;
};

type NarrowedEntry = { key: string; value: number };

function narrow(entry: unknown): NarrowedEntry | null {
  if (typeof entry !== "object" || entry === null) return null;
  const { dataKey, value } = entry as { dataKey?: unknown; value?: unknown };
  if (typeof dataKey !== "string") return null;
  const numeric = toChartNumber(value);
  return numeric === null ? null : { key: dataKey, value: numeric };
}

export function ChartTooltipContent({
  active,
  label,
  payload,
  series,
  formatValue,
  formatLabel,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  const entries = payload
    .map(narrow)
    .filter((entry): entry is NarrowedEntry => entry !== null);
  if (entries.length === 0) return null;

  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "min-w-36 rounded-md border border-border bg-popover px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] text-popover-foreground shadow-md",
        className,
      )}
    >
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {formatLabel ? formatLabel(label) : label}
      </p>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => {
          const index = series.findIndex((s) => s.key === entry.key);
          const matched = index === -1 ? { key: entry.key } : series[index];
          return (
            <li key={entry.key} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-sm"
                style={{ background: chartSeriesColor(matched, Math.max(index, 0)) }}
              />
              <span className="text-muted-foreground">{chartSeriesLabel(matched)}</span>
              <span className="ms-auto font-medium tabular-nums">
                {formatValue ? formatValue(entry.value) : entry.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
