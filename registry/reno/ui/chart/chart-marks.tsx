"use client";

import * as React from "react";
import { Area, Bar, Line } from "recharts";

import {
  chartSeriesColor,
  chartSeriesLabel,
  type ChartSeries,
} from "@/components/ui/chart/chart-series";

/**
 * The drawn marks, one per series.
 *
 * A plain function returning elements, not a component: recharts inspects its
 * own children to build the plot, and a wrapper component would hide them, so
 * nothing would render.
 */
export function chartMarks(
  kind: "bar" | "line" | "area",
  series: ChartSeries[],
  stacked: boolean,
): React.ReactNode[] {
  const stackId = stacked ? "stack" : undefined;

  return series.map((entry, index) => {
    const color = chartSeriesColor(entry, index);
    const name = chartSeriesLabel(entry);

    if (kind === "bar") {
      return (
        <Bar
          key={entry.key}
          dataKey={entry.key}
          name={name}
          fill={color}
          stackId={stackId}
          radius={[4, 4, 0, 0]}
        />
      );
    }

    if (kind === "line") {
      return (
        <Line
          key={entry.key}
          dataKey={entry.key}
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      );
    }

    return (
      <Area
        key={entry.key}
        dataKey={entry.key}
        name={name}
        stroke={color}
        fill={color}
        fillOpacity={0.2}
        strokeWidth={2}
        stackId={stackId}
      />
    );
  });
}
