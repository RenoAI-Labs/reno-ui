import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

/**
 * Client mode was never exercised end-to-end before the showcase used it, and
 * all three of these failed silently: the toolbar and pager updated, the rows
 * did not. They fail silently because every stage of the v9 row-model chain
 * falls through to the core rows when the model is not registered, so nothing
 * throws and nothing looks wrong until you read the rows themselves.
 */
describe("DataGrid client mode", () => {
  type Item = { id: string; name: string; qty: number };

  const manyColumns = createGridColumns<Item>((col) => [
    col.accessor("name", { header: "Tên" }),
    col.accessor("qty", { header: "Số lượng" }),
  ]);

  const many: Item[] = Array.from({ length: 240 }, (_, i) => ({
    id: String(i),
    // Zero-padded so string ordering and numeric ordering agree, which keeps
    // the sort assertion about the grid rather than about collation.
    name: `Mục ${String(i).padStart(3, "0")}`,
    qty: 240 - i,
  }));

  function ClientHarness({ initial }: { initial?: Partial<GridState> }) {
    const [state, setState] = React.useState<GridState>(() => ({
      ...emptyGridState(25),
      ...initial,
    }));
    return (
      <DataGrid
        columns={manyColumns}
        data={many}
        state={state}
        onStateChange={setState}
        getRowId={(row) => row.id}
        mode="client"
        labels={englishLabels}
      />
    );
  }

  it("renders only the requested page, not the whole dataset", () => {
    render(<ClientHarness />);
    expect(screen.getAllByRole("row")).toHaveLength(26); // 25 rows + header
    expect(screen.getByText("Mục 000")).toBeInTheDocument();
    expect(screen.queryByText("Mục 025")).not.toBeInTheDocument();
  });

  it("moves to the rows of the requested page", () => {
    render(<ClientHarness initial={{ pagination: { pageIndex: 1, pageSize: 25 } }} />);
    expect(screen.getByText("Mục 025")).toBeInTheDocument();
    expect(screen.queryByText("Mục 000")).not.toBeInTheDocument();
  });

  it("applies the global filter to the rendered rows and to the total", () => {
    render(<ClientHarness initial={{ globalFilter: "Mục 12" }} />);
    // Matches "Mục 120" through "Mục 129": ten rows, plus the header row.
    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("Mục 120")).toBeInTheDocument();
    expect(screen.queryByText("Mục 000")).not.toBeInTheDocument();
  });

  it("applies sorting to the rendered rows", () => {
    render(<ClientHarness initial={{ sorting: [{ id: "qty", desc: false }] }} />);
    const firstDataRow = screen.getAllByRole("row")[1];
    expect(within(firstDataRow).getByText("Mục 239")).toBeInTheDocument();
  });

  it("renders rows through the virtualizer once the page is large enough", () => {
    // Above DEFAULT_VIRTUALIZE_THRESHOLD the body switches to the virtualized
    // path, which renders nothing at all unless it re-renders after the scroll
    // viewport is attached.
    render(<ClientHarness initial={{ pagination: { pageIndex: 0, pageSize: 240 } }} />);
    expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    expect(screen.getByText("Mục 000")).toBeInTheDocument();
  });
});

describe("DataGrid column filters", () => {
  /**
   * The regression this exists for shipped and hid itself.
   *
   * TanStack v9 makes filter functions opt-in alongside the features, and an
   * unresolvable one is skipped rather than reported: the toolbar wrote the
   * filter, the chip appeared, and the row count never moved. Nothing caught it
   * because the toolbar could only ever *remove* a filter until a filter menu
   * existed to set one, and the only filter test covered the global one.
   */
  type Row = { id: string; name: string; team: string };

  const teamColumns = createGridColumns<Row>((col) => [
    col.accessor("name", { header: "Tên" }),
    col.accessor("team", { header: "Nhóm", filterFn: "equalsString" }),
  ]);

  const staff: Row[] = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    name: `Người ${i}`,
    team: i % 3 === 0 ? "Kỹ thuật" : i % 3 === 1 ? "Kinh doanh" : "Kế toán",
  }));

  function TeamHarness({ initial }: { initial?: Partial<GridState> }) {
    const [state, setState] = React.useState<GridState>(() => ({
      ...emptyGridState(25),
      ...initial,
    }));
    return (
      <DataGrid
        columns={teamColumns}
        data={staff}
        state={state}
        onStateChange={setState}
        getRowId={(row) => row.id}
        mode="client"
        labels={englishLabels}
      />
    );
  }

  it("actually removes the rows a column filter excludes", () => {
    render(<TeamHarness initial={{ columnFilters: [{ id: "team", value: "Kỹ thuật" }] }} />);
    // 10 of the 30 rows are on that team.
    expect(screen.getByText("1–10 of 10")).toBeInTheDocument();
    expect(screen.queryByText("Người 1")).not.toBeInTheDocument();
  });

  it("matches a faceted value exactly rather than as a substring", () => {
    // "Kế toán" must not be matched by a filter for "toán", and a facet for one
    // department must not pull in another that contains its name.
    render(<TeamHarness initial={{ columnFilters: [{ id: "team", value: "toán" }] }} />);
    expect(screen.getByText(englishLabels.empty)).toBeInTheDocument();
  });
});

describe("DataGrid numbered pages", () => {
  it("marks the page you are on, not only in colour", () => {
    // `variant="default"` carries the current page as a fill, which reaches
    // nobody using a screen reader — and "Page 3" alone does not say you are
    // on it.
    render(<ClientPager initial={{ pagination: { pageIndex: 2, pageSize: 10 } }} />);
    const current = screen.getByRole("button", { name: englishLabels.page(3) });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: englishLabels.page(1) })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("jumps straight to a page when its number is clicked", async () => {
    const user = userEvent.setup();
    render(<ClientPager />);
    await user.click(screen.getByRole("button", { name: englishLabels.page(4) }));
    expect(screen.getByText(englishLabels.rangeOf(31, 40, 240))).toBeInTheDocument();
  });
});

/**
 * 240 rows at 10 a page: 24 pages, enough for the window to need gaps.
 *
 * Columns and rows are module-level on purpose. Building them inside the
 * component hands the table a new `columns` identity on every render, which
 * rebuilds the instance and throws away the pagination state — the click lands
 * and the page never moves.
 */
const pagerColumns = createGridColumns<{ id: string; name: string }>((col) => [
  col.accessor("name", { header: "Tên" }),
]);

const pagerRows = Array.from({ length: 240 }, (_, i) => ({
  id: String(i),
  name: `Người ${i}`,
}));

function ClientPager({ initial }: { initial?: Partial<GridState> }) {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(10),
    ...initial,
  }));
  return (
    <DataGrid
      columns={pagerColumns}
      data={pagerRows}
      state={state}
      onStateChange={setState}
      getRowId={(row) => row.id}
      mode="client"
      labels={englishLabels}
    />
  );
}
