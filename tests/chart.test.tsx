import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chart, ChartTooltipContent, chartSeriesColor } from "@/components/ui/chart";

/**
 * recharts needs real layout to draw anything, and jsdom has none, so these
 * assertions deliberately target the parts that do not depend on it: the
 * empty state, the legend, the accessible name, and the token-driven colours.
 * Whether recharts can draw a bar is recharts' problem; whether reno hands it
 * the right colours is this library's.
 */

const DATA = [
  { month: "T1", moi: 10, quayLai: 4 },
  { month: "T2", moi: 12, quayLai: 6 },
];

const SERIES = [
  { key: "moi", label: "Khách mới" },
  { key: "quayLai", label: "Khách quay lại" },
];

describe("Chart", () => {
  it("labels the plot for assistive tech", () => {
    render(<Chart data={DATA} xKey="month" series={SERIES} aria-label="Khách theo tháng" />);
    expect(screen.getByRole("img", { name: "Khách theo tháng" })).toBeInTheDocument();
  });

  it("renders a legend from the series list", () => {
    render(<Chart data={DATA} xKey="month" series={SERIES} />);
    expect(screen.getByText("Khách mới")).toBeInTheDocument();
    expect(screen.getByText("Khách quay lại")).toBeInTheDocument();
  });

  it("shows the empty state instead of an axis-only plot", () => {
    render(<Chart data={[]} xKey="month" series={SERIES} />);
    expect(screen.getByText("Chưa có dữ liệu")).toBeInTheDocument();
  });

  it("takes an empty-state override rather than hardcoding Vietnamese", () => {
    render(
      <Chart data={[]} xKey="month" series={SERIES} labels={{ empty: "No data yet" }} />,
    );
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });
});

describe("chartSeriesColor", () => {
  it("reads the chart tokens so a preset switch re-colours the plot", () => {
    expect(chartSeriesColor({ key: "a" }, 0)).toBe("var(--chart-1)");
    expect(chartSeriesColor({ key: "b" }, 4)).toBe("var(--chart-5)");
  });

  it("wraps past the fifth series instead of falling off the token set", () => {
    expect(chartSeriesColor({ key: "f" }, 5)).toBe("var(--chart-1)");
  });

  it("lets a caller override, for a status colour that is not a series hue", () => {
    expect(chartSeriesColor({ key: "err", color: "var(--destructive)" }, 0)).toBe(
      "var(--destructive)",
    );
  });
});

describe("ChartTooltipContent", () => {
  const payload = [
    { dataKey: "moi", value: 128 },
    { dataKey: "quayLai", value: 84 },
  ];

  it("renders nothing when inactive", () => {
    const { container } = render(
      <ChartTooltipContent active={false} payload={payload} series={SERIES} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("names each series and formats its value", () => {
    render(
      <ChartTooltipContent
        active
        label="T1"
        payload={payload}
        series={SERIES}
        formatValue={(value) => `${value} khách`}
      />,
    );
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("Khách mới")).toBeInTheDocument();
    expect(screen.getByText("128 khách")).toBeInTheDocument();
  });

  it("drops payload entries that carry no usable number", () => {
    render(
      <ChartTooltipContent
        active
        label="T1"
        payload={[{ dataKey: "moi", value: 128 }, { dataKey: "quayLai", value: null }]}
        series={SERIES}
      />,
    );
    expect(screen.getByText("Khách mới")).toBeInTheDocument();
    expect(screen.queryByText("Khách quay lại")).not.toBeInTheDocument();
  });
});
