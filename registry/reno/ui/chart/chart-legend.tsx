"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  chartSeriesColor,
  chartSeriesLabel,
  type ChartSeries,
} from "@/components/ui/chart/chart-series";

/**
 * Legend rendered from the `series` list rather than from recharts' own legend
 * payload. It therefore keeps the same order and the same colours as the plot
 * without a second source of truth, and it lays out with flexbox instead of the
 * absolutely-positioned block recharts injects — which is what makes it wrap
 * cleanly on a phone.
 */
export function ChartLegend({
  series,
  className,
  ...props
}: React.ComponentProps<"ul"> & { series: ChartSeries[] }) {
  return (
    <ul
      data-slot="chart-legend"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs", className)}
      {...props}
    >
      {series.map((entry, index) => (
        <li key={entry.key} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-sm"
            style={{ background: chartSeriesColor(entry, index) }}
          />
          {chartSeriesLabel(entry)}
        </li>
      ))}
    </ul>
  );
}
