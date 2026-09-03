import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import { paginationRange } from "@/components/ui/data-grid/pagination-range";
import { emptyGridState, type GridState } from "@/lib/grid-state";
import { englishLabels } from "@/lib/grid-labels";

/**
 * The toolbar is where a grid stops being a table and starts being a screen
 * someone can work in: set a filter, change the sort, take the data out.
 *
 * All of it is a controlled view over one `GridState`, so what these assert is
 * the state each control produces — a menu that looks right and writes the
 * wrong shape is the failure mode, and it is invisible in a screenshot.
 */

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

const COLUMNS = [
  { id: "name", label: "Name", canHide: false, canSort: true },
  { id: "score", label: "Score", canSort: true },
  {
    id: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "left", label: "Left" },
    ],
  },
  {
    id: "source",
    label: "Source",
    options: [
      { value: "google", label: "Google" },
      { value: "referral", label: "Referral" },
    ],
  },
];

function Harness({
  initial,
  onState,
  ...props
}: {
  initial?: Partial<GridState>;
  onState?: (state: GridState) => void;
} & Partial<React.ComponentProps<typeof DataGridToolbar>>) {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(10),
    ...initial,
  }));

  return (
    <DataGridToolbar
      state={state}
      onStateChange={(updater) =>
        setState((current) => {
          const next = updater(current);
          onState?.(next);
          return next;
        })
      }
      columns={COLUMNS}
      labels={englishLabels}
      {...props}
    />
  );
}

describe("the filter menu", () => {
  it("groups values by column, with an entry for no filter at all", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));

    // A facet per column that declared options, and nothing for the ones that
    // did not: a free-text column has no list to show.
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.queryByText("Score")).not.toBeInTheDocument();

    expect(screen.getByRole("menuitemradio", { name: "All status" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Active" })).toBeInTheDocument();
  });

  it("writes one filter per column and resets to the first page", async () => {
    // Page 7 of a smaller result set is empty, and an empty grid after applying
    // a filter reads as "no matches".
    const onState = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={{ pagination: { pageIndex: 6, pageSize: 10 } }} onState={onState} />);

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    await user.click(screen.getByRole("menuitemradio", { name: "Active" }));

    const next = onState.mock.calls.at(-1)![0];
    expect(next.columnFilters).toEqual([{ id: "status", value: "active" }]);
    expect(next.pagination.pageIndex).toBe(0);
  });

  it("replaces the value for a column rather than stacking two", async () => {
    const onState = vi.fn();
    const user = userEvent.setup();
    render(<Harness onState={onState} />);

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    await user.click(screen.getByRole("menuitemradio", { name: "Active" }));
    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    await user.click(screen.getByRole("menuitemradio", { name: "Left" }));

    expect(onState.mock.calls.at(-1)![0].columnFilters).toEqual([
      { id: "status", value: "left" },
    ]);
  });

  it("marks the chosen value, and only in that facet", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ columnFilters: [{ id: "status", value: "active" }] }} />);

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));

    expect(screen.getByRole("menuitemradio", { name: "Active" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // The other facet is still unset, so its "all" entry is the checked one.
    expect(screen.getByRole("menuitemradio", { name: "All source" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "All status" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("clears a column by choosing its all entry", async () => {
    const onState = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness
        initial={{ columnFilters: [{ id: "status", value: "active" }] }}
        onState={onState}
      />,
    );

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    await user.click(screen.getByRole("menuitemradio", { name: "All status" }));

    expect(onState.mock.calls.at(-1)![0].columnFilters).toEqual([]);
  });

  it("shows a mark on the closed button while anything is filtered", async () => {
    // Without it a closed menu hides the fact that rows are missing, and "where
    // did that row go" is the support question that follows.
    // Two renders rather than a rerender: the harness seeds its state from
    // `initial` once, so re-rendering it with different props changes nothing.
    const unfiltered = render(<Harness />);
    expect(
      unfiltered.container.querySelector("[data-slot=data-grid-toolbar-filter-dot]"),
    ).not.toBeInTheDocument();
    unfiltered.unmount();

    const filtered = render(
      <Harness initial={{ columnFilters: [{ id: "status", value: "active" }] }} />,
    );
    expect(
      filtered.container.querySelector("[data-slot=data-grid-toolbar-filter-dot]"),
    ).toBeInTheDocument();
  });

  it("offers to clear everything only when there is something to clear", async () => {
    const onState = vi.fn();
    const user = userEvent.setup();
    const unfiltered = render(<Harness />);

    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    expect(
      screen.queryByRole("menuitem", { name: englishLabels.clearFilters }),
    ).not.toBeInTheDocument();
    unfiltered.unmount();

    render(
      <Harness
        initial={{
          columnFilters: [
            { id: "status", value: "active" },
            { id: "source", value: "google" },
          ],
        }}
        onState={onState}
      />,
    );
    await user.click(screen.getByRole("button", { name: englishLabels.filter }));
    await user.click(screen.getByRole("menuitem", { name: englishLabels.clearFilters }));

    expect(onState.mock.calls.at(-1)![0].columnFilters).toEqual([]);
  });
});

describe("the sort menu", () => {
  it("lists the sortable columns and nothing else", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: englishLabels.sort }));

    expect(screen.getByRole("menuitem", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Score/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Source/ })).not.toBeInTheDocument();
  });

  it("cycles a column through ascending, descending and off", async () => {
    const onState = vi.fn();
    const user = userEvent.setup();
    render(<Harness onState={onState} />);

    const open = async () => user.click(screen.getByRole("button", { name: englishLabels.sort }));

    await open();
    await user.click(screen.getByRole("menuitem", { name: /Score/ }));
    expect(onState.mock.calls.at(-1)![0].sorting).toEqual([{ id: "score", desc: false }]);

    await open();
    await user.click(screen.getByRole("menuitem", { name: /Score/ }));
    expect(onState.mock.calls.at(-1)![0].sorting).toEqual([{ id: "score", desc: true }]);

    await open();
    await user.click(screen.getByRole("menuitem", { name: /Score/ }));
    expect(onState.mock.calls.at(-1)![0].sorting).toEqual([]);
  });

  it("replaces the sort rather than accumulating keys", async () => {
    /*
      Multi-column sort still exists where people expect it — shift-clicking a
      header. A menu that quietly accumulated would leave someone looking at a
      three-key ordering whose shape they cannot see.
    */
    const onState = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={{ sorting: [{ id: "name", desc: false }] }} onState={onState} />);

    await user.click(screen.getByRole("button", { name: englishLabels.sort }));
    await user.click(screen.getByRole("menuitem", { name: /Score/ }));

    expect(onState.mock.calls.at(-1)![0].sorting).toEqual([{ id: "score", desc: false }]);
  });

  it("says the direction in words, not only as an arrow", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ sorting: [{ id: "score", desc: true }] }} />);

    await user.click(screen.getByRole("button", { name: englishLabels.sort }));
    expect(
      screen.getByRole("menuitem", { name: new RegExp(englishLabels.sortDescending) }),
    ).toBeInTheDocument();
  });
});

describe("export and import", () => {
  it("offers a format per handler and reports which was chosen", async () => {
    const onExport = vi.fn();
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<Harness onExport={onExport} onImport={onImport} />);

    await user.click(screen.getByRole("button", { name: englishLabels.export }));
    await user.click(screen.getByRole("menuitem", { name: "Export as Excel" }));
    expect(onExport).toHaveBeenCalledWith("excel");

    await user.click(screen.getByRole("button", { name: englishLabels.export }));
    await user.click(screen.getByRole("menuitem", { name: "Import from CSV" }));
    expect(onImport).toHaveBeenCalledWith("csv");
  });

  it("shows only what is handled", async () => {
    // A menu entry that does nothing teaches the reader the menu is decorative.
    const user = userEvent.setup();
    render(<Harness onExport={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: englishLabels.export }));
    expect(screen.getByRole("menuitem", { name: "Export as CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Import/ })).not.toBeInTheDocument();
  });

  it("stays out of the way entirely when neither is handled", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: englishLabels.export })).not.toBeInTheDocument();
  });

  it("narrows the formats to the ones offered", async () => {
    const user = userEvent.setup();
    render(<Harness onExport={vi.fn()} exportFormats={["csv"]} />);

    await user.click(screen.getByRole("button", { name: englishLabels.export }));
    expect(screen.getByRole("menuitem", { name: "Export as CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Export as PDF" })).not.toBeInTheDocument();
  });
});

describe("search", () => {
  it("takes a placeholder over the default label", () => {
    // Both attributes: the accessible name and the visible placeholder are set
    // from the same prop, and asserting only the name let a change to the
    // placeholder alone go unnoticed.
    render(<Harness searchPlaceholder="Search Anything..." />);
    const box = screen.getByRole("textbox", { name: "Search Anything..." });
    expect(box).toHaveAttribute("placeholder", "Search Anything...");
  });

  it("falls back to the label when no placeholder is given", () => {
    render(<Harness />);
    expect(screen.getByRole("textbox", { name: englishLabels.search })).toHaveAttribute(
      "placeholder",
      englishLabels.search,
    );
  });
});

describe("the trailing actions slot", () => {
  it("renders after the built-in menus", () => {
    render(<Harness actions={<button type="button">Phân tích</button>} />);
    expect(screen.getByRole("button", { name: "Phân tích" })).toBeInTheDocument();
  });
});

describe("which page numbers to show", () => {
  /**
   * The window has to stay the same width as it slides. A row that grows and
   * shrinks moves the buttons under the pointer while someone is paging, which
   * is how you end up on page 9 having aimed at page 5.
   */
  it("prints every page while they still fit", () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps one gap near either end and two in the middle", () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
    expect(paginationRange(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
    expect(paginationRange(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
  });

  it("holds its width across every page of a long list", () => {
    const widths = new Set(
      Array.from({ length: 20 }, (_, index) => paginationRange(index + 1, 20).length),
    );
    expect(widths.size).toBe(1);
  });

  it("never draws a gap that hides a single page", () => {
    // An ellipsis standing in for one number is wider than the number.
    for (let page = 1; page <= 9; page += 1) {
      const slots = paginationRange(page, 9);
      for (let i = 1; i < slots.length - 1; i += 1) {
        if (slots[i] !== "gap") continue;
        const before = slots[i - 1] as number;
        const after = slots[i + 1] as number;
        expect(after - before).toBeGreaterThan(2);
      }
    }
  });

  it("survives the degenerate inputs a real page count produces", () => {
    // An empty result set is zero pages, and the grid clamps to one.
    expect(paginationRange(1, 0)).toEqual([1]);
    expect(paginationRange(0, 1)).toEqual([1]);
    expect(paginationRange(99, 3)).toEqual([1, 2, 3]);
  });
});
