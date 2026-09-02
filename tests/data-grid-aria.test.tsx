import * as React from "react";
import { act, render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { DataGrid } from "@/components/ui/data-grid";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";
import { englishLabels } from "@/lib/grid-labels";

/**
 * The grid's table semantics, asserted as written attributes rather than as
 * computed roles.
 *
 * That distinction is the whole point of this file. The grid lays itself out
 * with `display: grid` and `display: flex` on `<table>`, `<thead>`, `<tbody>`,
 * `<tr>` — the only arrangement in which pinned columns, a sticky header and a
 * virtualized body can coexist. A browser drops the implicit table semantics of
 * an element whose `display` is not the table value it was born with, so the
 * grid reached a real screen reader as undifferentiated text: no rows, no
 * columns, and `aria-sort` sitting on an element that cannot carry it.
 *
 * jsdom does not model that. `getByRole("columnheader")` finds a `<th>` no
 * matter what CSS says, so a role query here would pass on the broken markup
 * and prove nothing. Every assertion below therefore reads the attribute off
 * the element.
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
  ...props
}: {
  initial?: Partial<GridState>;
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
      onStateChange={setState}
      getRowId={(row) => row.id}
      mode="client"
      labels={englishLabels}
      {...props}
    />
  );
}

function renderGrid(ui: React.ReactElement) {
  const { container } = render(ui);
  const q = (selector: string) => container.querySelector(selector);
  const qa = (selector: string) => Array.from(container.querySelectorAll(selector));
  return { container, q, qa };
}

/**
 * A page long enough to virtualize. `name` carries the row's own position so an
 * assertion can compare what a row says it is against what the grid claims.
 */
type Item = { id: string; name: string };

const itemColumns = createGridColumns<Item>((col) => [
  col.accessor("name", { header: "Tên" }),
]);

const items: Item[] = Array.from({ length: 240 }, (_, i) => ({
  id: String(i),
  name: `Mục ${String(i).padStart(3, "0")}`,
}));

function VirtualizedHarness() {
  const [state, setState] = React.useState<GridState>(() => emptyGridState(240));
  return (
    <DataGrid
      columns={itemColumns}
      data={items}
      state={state}
      onStateChange={setState}
      getRowId={(row) => row.id}
      mode="client"
      labels={englishLabels}
    />
  );
}

/** Scrolls the grid's viewport so the mounted window is no longer the first rows. */
function scrollPast(container: HTMLElement, top: number) {
  const viewport = container.querySelector('[data-slot="data-grid"] > div') as HTMLElement;
  act(() => {
    viewport.scrollTop = top;
    viewport.dispatchEvent(new Event("scroll"));
  });
}

describe("DataGrid table semantics survive its CSS layout", () => {
  it("declares itself a grid", () => {
    const { q } = renderGrid(<Harness />);
    expect(q('[data-slot="data-grid"] table')).toHaveAttribute("role", "grid");
  });

  it("groups the header rows", () => {
    const { q } = renderGrid(<Harness />);
    expect(q("thead")).toHaveAttribute("role", "rowgroup");
  });

  it("groups the body rows, plain body or virtualized one", () => {
    // Both bodies, one test: the plain and virtualized paths are separate
    // elements in separate branches, and only asserting the short one leaves
    // the body most projects actually render unchecked.
    const plain = renderGrid(<Harness />);
    expect(plain.q('[data-slot="data-grid-body"]')).toHaveAttribute("role", "rowgroup");

    const virtualized = renderGrid(<VirtualizedHarness />);
    expect(virtualized.q('[data-slot="data-grid-body"]')).toHaveAttribute("role", "rowgroup");
  });

  it("declares the header cells column headers, so aria-sort has something to sit on", () => {
    const { qa } = renderGrid(<Harness />);
    const headers = qa('[data-slot="data-grid-header-cell"]');
    expect(headers).toHaveLength(2);
    for (const header of headers) {
      expect(header).toHaveAttribute("role", "columnheader");
    }
  });

  it("declares the data rows rows", () => {
    const { qa } = renderGrid(<Harness />);
    const bodyRows = qa('[data-slot="data-grid-row"]');
    expect(bodyRows).toHaveLength(3);
    for (const row of bodyRows) {
      expect(row).toHaveAttribute("role", "row");
    }
  });

  it("declares the data cells grid cells", () => {
    const { qa } = renderGrid(<Harness />);
    const cells = qa('[data-slot="data-grid-cell"]');
    expect(cells).toHaveLength(6);
    for (const cell of cells) {
      expect(cell).toHaveAttribute("role", "gridcell");
    }
  });
});

describe("DataGrid tells a reader where a row sits", () => {
  it("counts the header row alongside the page's rows", () => {
    // Not the server total: row indices stop at the page size, so a count of
    // 50,000 would leave a reader hearing "row 12 of 50,000" on a 25-row page.
    const { q } = renderGrid(<Harness />);
    expect(q('[data-slot="data-grid"] table')).toHaveAttribute("aria-rowcount", "4");
  });

  it("numbers every row from the header down, virtualized or not", () => {
    // One test for both render paths on purpose: the numbering is a single
    // behaviour, and a wrong offset should point at one failure rather than
    // scatter across the file.
    const plain = renderGrid(<Harness />);
    expect(
      plain.qa('[data-slot="data-grid-row"]').map((r) => r.getAttribute("aria-rowindex")),
    ).toEqual(["2", "3", "4"]);

    // Virtualization is the reason the attribute exists at all: the rows in the
    // DOM are a moving window of absolutely positioned elements, so position in
    // the markup says nothing about position in the page.
    //
    // The scroll is what makes this test able to fail. Unscrolled, the window
    // starts at the first row and DOM position happens to equal row number, so
    // numbering rows by their place in the DOM — the plausible mistake — would
    // pass. Scrolled, the two diverge, and each row's own name says which one
    // it should be.
    const virtualized = renderGrid(<VirtualizedHarness />);
    scrollPast(virtualized.container, 3000);

    const mounted = virtualized.qa('[data-slot="data-grid-row"]');
    expect(mounted.length).toBeGreaterThan(1);
    expect(mounted.length).toBeLessThan(items.length);
    // The window moved, otherwise the divergence above never happens.
    expect(mounted[0]?.textContent).not.toContain("Mục 000");

    for (const row of mounted) {
      const position = Number(/Mục (\d+)/.exec(row.textContent ?? "")?.[1]);
      // +1 for the header row, +1 because aria-rowindex counts from one.
      expect(row.getAttribute("aria-rowindex")).toBe(String(position + 2));
    }
  });
});

describe("DataGrid announces selection, not only styles it", () => {
  it("reports the selected row as selected", () => {
    // `data-state="selected"` drives the background colour and is invisible to
    // assistive tech.
    const { qa } = renderGrid(<Harness initial={{ rowSelection: { "1": true } }} />);
    expect(qa('[data-slot="data-grid-row"]').map((r) => r.getAttribute("aria-selected"))).toEqual(
      ["true", "false", "false"],
    );
  });

  it("says nothing about selection on a grid that has none", () => {
    // Reporting every row as "not selected" would announce an affordance the
    // grid does not offer.
    const { qa } = renderGrid(<Harness enableRowSelection={false} />);
    for (const row of qa('[data-slot="data-grid-row"]')) {
      expect(row).not.toHaveAttribute("aria-selected");
    }
  });
});
