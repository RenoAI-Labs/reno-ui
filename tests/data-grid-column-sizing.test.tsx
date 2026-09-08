import * as React from "react";
import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { DataGrid } from "@/components/ui/data-grid";
import { columnSizeStyle } from "@/components/ui/data-grid/column-sizing";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";

/**
 * Column widths: the grid has to fill its container, and the header has to
 * agree with the body about every column while it does.
 *
 * The defect this file exists for: cells carried a fixed `width` and nothing
 * else, inside a row that is `width: 100%`. Five columns in a 1980px container
 * therefore stopped at 1225px and left a strip of empty bordered table to the
 * right of the last one.
 *
 * jsdom computes no layout — an element's width here is whatever was written
 * into its style attribute, never a laid-out pixel. So `resolveFlexWidths`
 * below applies the flex free-space rule to the declarations read off the DOM:
 * with a definite basis, no shrinking and free space to give away, each item
 * ends at `basis + free x grow / total grow`. That is what the browser will do
 * with these numbers, and asserting on the result is the difference between
 * proving the columns fill the container and merely noting that a `flex-grow`
 * was written somewhere.
 */

/** The width the grid's scroll viewport reports to everything that measures it. */
const VIEWPORT = 800;

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 400,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => VIEWPORT,
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

type Row = { id: string; name: string; qty: number; note: string };

const rows: Row[] = [
  { id: "1", name: "Bàn gỗ", qty: 3, note: "kho A" },
  { id: "2", name: "Ghế xoay", qty: 12, note: "kho B" },
];

/** Sizes chosen so the declared total (450) is well under the viewport. */
const columns = createGridColumns<Row>((col) => [
  col.accessor("name", { header: "Tên", size: 200 }),
  col.accessor("qty", { header: "Số lượng", size: 100 }),
  col.accessor("note", { header: "Ghi chú", size: 150 }),
]);

function Harness({
  initial,
  ...props
}: { initial?: Partial<GridState> } & Partial<
  React.ComponentProps<typeof DataGrid<Row>>
>) {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(25),
    ...initial,
  }));

  return (
    <DataGrid<Row>
      columns={columns}
      data={rows}
      state={state}
      onStateChange={(updater) => setState((current) => updater(current))}
      getRowId={(row) => row.id}
      mode="client"
      {...props}
    />
  );
}

type Cell = { width: number; grow: number; shrink: number };

function readCells(container: HTMLElement, slot: string): Cell[] {
  return Array.from(container.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)).map(
    // A missing factor reads as the CSS initial value, so a cell that declares
    // no flex at all resolves to its bare width — which is the defect, stated
    // in the same numbers as the fix.
    (el) => ({
      width: parseFloat(el.style.width),
      grow: parseFloat(el.style.flexGrow) || 0,
      shrink: parseFloat(el.style.flexShrink) || 0,
    }),
  );
}

/** The flex algorithm for grow-only items with a definite basis. */
function resolveFlexWidths(cells: Cell[], containerWidth: number): number[] {
  const basis = cells.reduce((sum, c) => sum + c.width, 0);
  const totalGrow = cells.reduce((sum, c) => sum + c.grow, 0);
  const free = containerWidth - basis;
  if (free <= 0 || totalGrow === 0) return cells.map((c) => c.width);
  return cells.map((c) => c.width + (free * c.grow) / totalGrow);
}

describe("columnSizeStyle", () => {
  it("grows an unpinned column in proportion to its declared size", () => {
    expect(columnSizeStyle(200, false)).toEqual({
      width: 200,
      flexGrow: 200,
      flexShrink: 0,
    });
  });

  it("never grows a pinned column, whichever edge it is pinned to", () => {
    // The sticky offsets are the running sum of the declared widths, so a
    // pinned column that grew would land beside the offset the next one got.
    expect(columnSizeStyle(200, "start").flexGrow).toBe(0);
    expect(columnSizeStyle(200, "end").flexGrow).toBe(0);
    expect(columnSizeStyle(200, "end").width).toBe(200);
  });

  it("never shrinks, so the declared width is a floor", () => {
    expect(columnSizeStyle(200, false).flexShrink).toBe(0);
    expect(columnSizeStyle(200, "start").flexShrink).toBe(0);
  });
});

describe("DataGrid column widths", () => {
  it("fills the container when the columns are narrower than it", () => {
    const { container } = render(<Harness />);
    const header = readCells(container, "data-grid-header-cell");

    expect(header.reduce((sum, c) => sum + c.width, 0)).toBe(450);

    const resolved = resolveFlexWidths(header, VIEWPORT);
    expect(resolved.reduce((sum, w) => sum + w, 0)).toBeCloseTo(VIEWPORT, 5);

    // Proportional, not equal: the 200px column stays twice the 100px one.
    expect(resolved[0] / resolved[1]).toBeCloseTo(2, 5);
    expect(resolved[2] / resolved[1]).toBeCloseTo(1.5, 5);
  });

  it("gives the body cells the same widths as the header cells", () => {
    const { container } = render(<Harness />);
    const header = readCells(container, "data-grid-header-cell");
    const body = readCells(container, "data-grid-cell").slice(0, header.length);

    expect(body).toEqual(header);
    expect(resolveFlexWidths(body, VIEWPORT)).toEqual(
      resolveFlexWidths(header, VIEWPORT),
    );
  });

  it("keeps a pinned column at its declared width, header and body alike", () => {
    const { container } = render(
      <Harness initial={{ columnPinning: { start: ["name"], end: ["note"] } }} />,
    );
    const header = readCells(container, "data-grid-header-cell");
    const body = readCells(container, "data-grid-cell").slice(0, header.length);

    expect(body).toEqual(header);
    // Only the centre column takes the leftover; both pinned columns land on
    // the exact widths their sticky offsets were computed from.
    expect(resolveFlexWidths(header, VIEWPORT)).toEqual([200, 450, 150]);

    const headerEls = container.querySelectorAll<HTMLElement>(
      '[data-slot="data-grid-header-cell"]',
    );
    const bodyEls = container.querySelectorAll<HTMLElement>(
      '[data-slot="data-grid-cell"]',
    );
    expect(headerEls[0].style.insetInlineStart).toBe("0px");
    expect(bodyEls[0].style.insetInlineStart).toBe("0px");
    expect(headerEls[2].style.insetInlineEnd).toBe("0px");
    expect(bodyEls[2].style.insetInlineEnd).toBe("0px");
  });

  it("does not stretch a grid whose columns already overflow the container", () => {
    const wide = createGridColumns<Row>((col) => [
      col.accessor("name", { header: "Tên", size: 400 }),
      col.accessor("qty", { header: "Số lượng", size: 400 }),
      col.accessor("note", { header: "Ghi chú", size: 400 }),
    ]);
    const { container } = render(<Harness columns={wide} />);

    const table = container.querySelector("table") as HTMLElement;
    // The scroll floor is the declared total, untouched by any of this.
    expect(table.style.minWidth).toBe("1200px");

    const header = readCells(container, "data-grid-header-cell");
    expect(resolveFlexWidths(header, VIEWPORT)).toEqual([400, 400, 400]);
  });
});
