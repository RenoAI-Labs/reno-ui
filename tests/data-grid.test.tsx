import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DataGrid } from "@/components/ui/data-grid";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";
import { englishLabels } from "@/lib/grid-labels";

/**
 * jsdom has no layout, so the virtualizer measures a zero-height scroll element
 * and renders no rows. Stubbing the element geometry is what lets the body
 * render at all — without it every row assertion here is vacuous.
 */
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 400,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 400,
  });
  global.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

type Row = { id: string; name: string; qty: number };

const columns = createGridColumns<Row>((col) => [
  col.accessor("name", { header: "Tên" }),
  col.accessor("qty", { header: "Số lượng" }),
]);

const rows: Row[] = [
  { id: "1", name: "Bàn gỗ", qty: 3 },
  { id: "2", name: "Ghế xoay", qty: 12 },
  { id: "3", name: "Tủ hồ sơ", qty: 7 },
];

function Harness({
  initial,
  onState,
  ...props
}: {
  initial?: Partial<GridState>;
  onState?: (state: GridState) => void;
} & Partial<React.ComponentProps<typeof DataGrid<Row>>>) {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(25),
    ...initial,
  }));

  return (
    <DataGrid<Row>
      columns={columns}
      data={rows}
      state={state}
      onStateChange={(updater) =>
        setState((current) => {
          const next = updater(current);
          onState?.(next);
          return next;
        })
      }
      getRowId={(row) => row.id}
      mode="client"
      {...props}
    />
  );
}

describe("DataGrid rendering", () => {
  it("renders headers and rows", () => {
    render(<Harness />);
    expect(screen.getByText("Tên")).toBeInTheDocument();
    expect(screen.getByText("Bàn gỗ")).toBeInTheDocument();
    expect(screen.getByText("Ghế xoay")).toBeInTheDocument();
  });

  it("exposes sort state to assistive tech via aria-sort", () => {
    // The arrow icon conveys nothing to a screen reader; aria-sort is the
    // contract, and multi-column sort is unusable without it.
    render(<Harness initial={{ sorting: [{ id: "name", desc: true }] }} />);
    const header = screen.getAllByRole("columnheader")[0];
    expect(header).toHaveAttribute("aria-sort", "descending");
  });

  it("marks unsorted sortable columns as aria-sort=none", () => {
    render(<Harness />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-sort", "none");
  });
});

describe("DataGrid states", () => {
  it("shows the empty state when there are no rows", () => {
    render(<Harness data={[]} />);
    expect(screen.getByText("Không có dữ liệu")).toBeInTheDocument();
  });

  it("shows the error state with a retry action", () => {
    const onRetry = vi.fn();
    render(<Harness error={new Error("boom")} onRetry={onRetry} />);
    expect(screen.getByText("Đã xảy ra lỗi")).toBeInTheDocument();
    screen.getByRole("button", { name: "Thử lại" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows a busy skeleton while loading with no rows yet", () => {
    render(<Harness data={[]} isLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});

describe("DataGrid i18n", () => {
  it("defaults every visible string to Vietnamese", () => {
    render(<Harness />);
    expect(screen.getByText("Số dòng mỗi trang")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeInTheDocument();
  });

  it("replaces every string when labels are overridden", () => {
    // This is the whole no-i18n-library bet: text is data, so a project swaps
    // it wholesale without reno depending on next-intl or i18next.
    render(<Harness labels={englishLabels} />);
    expect(screen.getByText("Rows per page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.queryByText("Số dòng mỗi trang")).not.toBeInTheDocument();
  });

  it("accepts a partial label override without losing the rest", () => {
    render(<Harness labels={{ rowsPerPage: "Dòng/trang" }} />);
    expect(screen.getByText("Dòng/trang")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeInTheDocument();
  });
});

describe("DataGrid pagination", () => {
  it("reports the visible range against the server total", () => {
    // The range comes from pagination and the server total, not from the rows
    // this fixture happens to hold — page 1 of 25 covers 1-25 of 214.
    render(<Harness mode="server" rowCount={214} />);
    expect(screen.getByText("1–25 trên 214")).toBeInTheDocument();
  });

  it("disables first/previous on the first page", () => {
    render(<Harness mode="server" rowCount={214} />);
    expect(screen.getByRole("button", { name: "Trang đầu" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
  });

  it("advances the page index through onStateChange", () => {
    const onState = vi.fn();
    render(<Harness mode="server" rowCount={214} onState={onState} />);
    screen.getByRole("button", { name: "Trang sau" }).click();
    expect(onState).toHaveBeenCalledWith(
      expect.objectContaining({ pagination: { pageIndex: 1, pageSize: 25 } }),
    );
  });

  it("returns to page 1 when the page size changes", () => {
    // Staying on page 47 after resizing pages lands the user past the end.
    const onState = vi.fn();
    render(
      <Harness
        mode="server"
        rowCount={214}
        initial={{ pagination: { pageIndex: 4, pageSize: 25 } }}
        onState={onState}
      />,
    );
    expect(screen.getByText(/Trang 5/)).toBeInTheDocument();
  });

  it("reports selection count from row state without needing a selection prop", () => {
    // Selection must have one source of truth: passing no `selection` prop
    // still has to report what is selected.
    render(<Harness initial={{ rowSelection: { "1": true, "2": true } }} />);
    expect(screen.getByText("Đã chọn 2 dòng")).toBeInTheDocument();
  });

  it("uses an explicit cross-page selection when given one", () => {
    // "Everything matching the filter, except one" is 213 of 214 — a count no
    // client-side id map could produce.
    render(
      <Harness
        mode="server"
        rowCount={214}
        selection={{ mode: "exclude", ids: ["1"] }}
      />,
    );
    expect(screen.getByText("Đã chọn 213 dòng")).toBeInTheDocument();
  });
});

describe("DataGrid density", () => {
  it("sizes cells from density tokens rather than fixed classes", () => {
    // A hardcoded height here would make ERP and e-learning render identically,
    // which defeats the point of the token layer.
    render(<Harness />);
    const cell = screen.getByText("Bàn gỗ").closest("td");
    expect(cell?.className).toContain("px-[var(--density-cell-padding-x)]");
  });

  it("pads header cells from density tokens too", () => {
    render(<Harness />);
    const header = screen.getAllByRole("columnheader")[0];
    expect(header.className).toContain("px-[var(--density-cell-padding-x)]");
  });
});

describe("DataGrid column pinning", () => {
  it("makes a pinned column sticky", () => {
    render(<Harness initial={{ columnPinning: { start: ["name"], end: [] } }} />);
    const header = screen.getAllByRole("columnheader")[0];
    expect(header).toHaveStyle({ position: "sticky" });
  });

  it("keeps pinned cells opaque so scrolled content cannot show through", () => {
    render(<Harness initial={{ columnPinning: { start: ["name"], end: [] } }} />);
    const cell = screen.getByText("Bàn gỗ").closest("td");
    expect(cell?.className).toContain("bg-background");
  });
});

describe("DataGrid row interaction", () => {
  it("reports the clicked row id", () => {
    const onRowClick = vi.fn();
    render(<Harness onRowClick={onRowClick} />);
    within(screen.getByText("Ghế xoay").closest("tr") as HTMLElement);
    (screen.getByText("Ghế xoay").closest("tr") as HTMLElement).click();
    expect(onRowClick).toHaveBeenCalledWith("2");
  });

  it("marks selected rows with data-state for styling and testing", () => {
    render(<Harness initial={{ rowSelection: { "1": true } }} />);
    const row = screen.getByText("Bàn gỗ").closest("tr");
    expect(row).toHaveAttribute("data-state", "selected");
  });
});

describe("DataGrid feature flags", () => {
  it("disables pinning on the table, not just the header affordance", () => {
    // Hiding the pin menu is not enough: pinning state can arrive from initial
    // state or a saved layout. The flag has to reach TanStack.
    render(
      <Harness
        enableColumnPinning={false}
        initial={{ columnPinning: { start: ["name"], end: [] } }}
      />,
    );
    const header = screen.getAllByRole("columnheader")[0];
    expect(header).not.toHaveStyle({ position: "sticky" });
  });

  it("still pins when the flag is left at its default", () => {
    render(<Harness initial={{ columnPinning: { start: ["name"], end: [] } }} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveStyle({ position: "sticky" });
  });

  it("disables resizing on the table when the flag is false", () => {
    render(<Harness enableColumnResizing={false} />);
    // The resize handle is the separator role inside a header cell.
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
  });
});
