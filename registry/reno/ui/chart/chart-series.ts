/**
 * Series vocabulary shared by the chart and its tooltip/legend.
 *
 * Kept free of any recharts type on purpose, mirroring the DataGrid rule: a
 * consuming project describes its series with plain objects, so a recharts
 * major bump is a change inside this directory rather than across every screen
 * that draws a chart.
 */

export type ChartSeries = {
  /** Key to read from each data row. */
  key: string;
  /** Display name. Falls back to `key`. */
  label?: string;
  /** CSS colour. Defaults to the matching `--chart-*` token. */
  color?: string;
};

/** A chart row. Values are read by `key`, so the shape stays open. */
export type ChartDatum = Record<string, unknown>;

export type ChartLabels = {
  /** Shown in place of the plot when `data` is empty. */
  empty: string;
};

export const defaultChartLabels: ChartLabels = {
  empty: "Chưa có dữ liệu",
};

/**
 * Colour for series `index`.
 *
 * The five `--chart-*` tokens are defined by every preset in both modes, so a
 * chart re-colours with the theme and never needs a palette of its own. Series
 * past the fifth wrap rather than fall back to an untokened colour.
 */
export function chartSeriesColor(series: ChartSeries, index: number): string {
  return series.color ?? `var(--chart-${(index % 5) + 1})`;
}

export function chartSeriesLabel(series: ChartSeries): string {
  return series.label ?? series.key;
}

/** Numeric coercion for values arriving from an untyped data row. */
export function toChartNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
