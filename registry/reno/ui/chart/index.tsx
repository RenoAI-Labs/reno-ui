"use client";

import * as React from "react";
import {
  AreaChart,
  BarChart,
  CartesianGrid,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { ChartLegend } from "@/components/ui/chart/chart-legend";
import { chartMarks } from "@/components/ui/chart/chart-marks";
import { ChartTooltipContent } from "@/components/ui/chart/chart-tooltip";
import {
  chartSeriesColor,
  chartSeriesLabel,
  defaultChartLabels,
  type ChartDatum,
  type ChartLabels,
  type ChartSeries,
} from "@/components/ui/chart/chart-series";

/**
 * Bar, line and area charts over recharts.
 *
 * Declarative rather than compositional — you pass `data` + `series`, not
 * recharts children. Same rule as the DataGrid: no third-party type appears in
 * these props, so a recharts major lands in this directory instead of in every
 * screen that draws a chart. It also keeps the boundary that
 * `scripts/check-boundaries.mjs` enforces meaningful: recharts is importable
 * here and nowhere else, so a project that installs no chart pays nothing.
 *
 * Colours come from `--chart-1` .. `--chart-5`, which every preset defines in
 * both light and dark. Grid and axes read `--border` and `--muted-foreground`.
 * Nothing here carries a colour of its own.
 */

export type ChartKind = "bar" | "line" | "area";

export type ChartProps = {
  data: readonly ChartDatum[];
  /** Key holding the category for each row (the x axis). */
  xKey: string;
  series: ChartSeries[];
  kind?: ChartKind;
  /** Stack series instead of drawing them side by side. */
  stacked?: boolean;
  /** Plot height. recharts needs a bounded height to lay out. */
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showYAxis?: boolean;
  formatValue?: (value: number) => string;
  formatX?: (value: string) => string;
  labels?: Partial<ChartLabels>;
  className?: string;
  /** Charts are images to a screen reader; describe what this one shows. */
  "aria-label"?: string;
};

const CHARTS = { bar: BarChart, line: LineChart, area: AreaChart } as const;

/** Axis and grid styling, shared so the three kinds cannot drift apart. */
const AXIS_TICK = { fill: "var(--muted-foreground)" } as const;

export function Chart({
  data,
  xKey,
  series,
  kind = "bar",
  stacked = false,
  height = 260,
  showGrid = true,
  showLegend = true,
  showYAxis = true,
  formatValue,
  formatX,
  labels: labelOverrides,
  className,
  "aria-label": ariaLabel,
}: ChartProps) {
  const labels = { ...defaultChartLabels, ...labelOverrides };
  const ChartRoot = CHARTS[kind];

  return (
    <figure
      data-slot="chart"
      className={cn("flex w-full flex-col gap-[var(--density-gap)]", className)}
    >
      {ariaLabel ? <figcaption className="sr-only">{ariaLabel}</figcaption> : null}

      {showLegend ? <ChartLegend series={series} /> : null}

      <div
        role="img"
        aria-label={ariaLabel}
        className="w-full"
        // Axis text inherits this, so tick labels shrink with the ERP preset and
        // grow with e-learning like every other piece of UI text.
        style={{ height, fontSize: "var(--density-font-size)" }}
      >
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ChartRoot data={data as ChartDatum[]} accessibilityLayer>
              {showGrid ? (
                <CartesianGrid vertical={false} stroke="var(--border)" />
              ) : null}

              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={AXIS_TICK}
                tickFormatter={formatX}
              />
              {showYAxis ? (
                <YAxis
                  width="auto"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={AXIS_TICK}
                  tickFormatter={formatValue}
                />
              ) : null}

              <Tooltip
                cursor={
                  kind === "bar"
                    ? { fill: "var(--muted)" }
                    : { stroke: "var(--border)" }
                }
                content={(props) => (
                  <ChartTooltipContent
                    active={props.active}
                    label={props.label as React.ReactNode}
                    payload={props.payload}
                    series={series}
                    formatValue={formatValue}
                    formatLabel={formatX ? (value) => formatX(String(value)) : undefined}
                  />
                )}
              />

              {chartMarks(kind, series, stacked)}
            </ChartRoot>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
}

export { ChartLegend, ChartTooltipContent, chartSeriesColor, chartSeriesLabel };
export { defaultChartLabels } from "@/components/ui/chart/chart-series";
export type { ChartDatum, ChartLabels, ChartSeries };
