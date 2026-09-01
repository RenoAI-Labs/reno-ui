import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  EMPTY_SELECTION,
  emptyQuery,
  isRowSelected,
  parseSearchParams,
  selectionCount,
  toSearchParams,
  type GridQuery,
} from "@/lib/grid-query";

/**
 * The URL round-trip is what makes a filtered view shareable, and it is the
 * contract three-plus projects will depend on. A silent encoding bug here shows
 * up as "the link my colleague sent shows different rows", which is very hard to
 * trace back. So: round-trip everything, including the awkward values.
 */
describe("grid query URL round-trip", () => {
  function roundTrip(query: GridQuery) {
    return parseSearchParams(toSearchParams(query));
  }

  it("omits defaults so a pristine grid has a clean URL", () => {
    expect(toSearchParams(emptyQuery()).toString()).toBe("");
  });

  it("round-trips pagination and multi-column sort", () => {
    const query: GridQuery = {
      page: 3,
      pageSize: 50,
      sort: [
        { id: "name", desc: false },
        { id: "createdAt", desc: true },
      ],
      filters: [],
    };
    expect(roundTrip(query)).toEqual({ ...query, search: undefined });
  });

  it("round-trips every filter operator shape", () => {
    const query: GridQuery = {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [],
      filters: [
        { id: "status", op: "eq", value: "active" },
        { id: "age", op: "gte", value: "18" },
        { id: "tag", op: "in", value: ["a", "b", "c"] },
        { id: "created", op: "between", value: ["2026-01-01", "2026-06-30"] },
        { id: "deletedAt", op: "isNull", value: null },
      ],
    };
    expect(roundTrip(query).filters).toEqual(query.filters);
  });

  it("survives values containing the delimiter characters", () => {
    const query: GridQuery = {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [],
      // A colon and a comma inside the value would corrupt a naive split.
      filters: [{ id: "note", op: "contains", value: "10:30, phòng A" }],
    };
    expect(roundTrip(query).filters[0].value).toBe("10:30, phòng A");
  });

  it("round-trips free-text search", () => {
    const parsed = parseSearchParams(
      toSearchParams({ ...emptyQuery(), search: "nguyễn văn a" }),
    );
    expect(parsed.search).toBe("nguyễn văn a");
  });

  it("drops malformed segments instead of throwing", () => {
    // URLs get truncated by chat clients and hand-edited. A broken filter must
    // degrade to no filter, never to a crashed page.
    const parsed = parseSearchParams("page=abc&sort=&f=broken&f=x:notAnOp:1&f=ok:eq:1");
    expect(parsed.page).toBe(1);
    expect(parsed.sort).toEqual([]);
    expect(parsed.filters).toEqual([{ id: "ok", op: "eq", value: "1" }]);
  });
});

describe("grid selection", () => {
  it("treats include mode as an explicit list", () => {
    const sel = { mode: "include", ids: ["a", "b"] } as const;
    expect(isRowSelected(sel, "a")).toBe(true);
    expect(isRowSelected(sel, "z")).toBe(false);
    expect(selectionCount(sel, 500)).toBe(2);
  });

  it("treats exclude mode as everything-matching minus the listed ids", () => {
    // This is the case a plain string[] cannot express: the user clicked
    // "select all" on a 50k filtered result the client never received.
    const sel = { mode: "exclude", ids: ["a"] } as const;
    expect(isRowSelected(sel, "a")).toBe(false);
    expect(isRowSelected(sel, "z")).toBe(true);
    expect(selectionCount(sel, 50_000)).toBe(49_999);
  });

  it("starts empty", () => {
    expect(selectionCount(EMPTY_SELECTION, 100)).toBe(0);
  });
});

describe("GridState <-> GridQuery", () => {
  it("translates the 0-based pageIndex to a 1-based page and back", async () => {
    const { gridStateToQuery, queryToGridState, emptyGridState } = await import(
      "@/lib/grid-state"
    );
    const state = {
      ...emptyGridState(50),
      pagination: { pageIndex: 3, pageSize: 50 },
    };
    // The boundary that gets rewritten slightly differently in every project.
    expect(gridStateToQuery(state).page).toBe(4);
    expect(queryToGridState(gridStateToQuery(state)).pagination.pageIndex).toBe(3);
  });

  it("never produces a negative page index from a malformed URL", async () => {
    const { queryToGridState } = await import("@/lib/grid-state");
    expect(
      queryToGridState({ page: 0, pageSize: 25, sort: [], filters: [] }).pagination
        .pageIndex,
    ).toBe(0);
  });

  it("preserves column layout that the query does not describe", async () => {
    const { queryToGridState, emptyGridState } = await import("@/lib/grid-state");
    const base = {
      ...emptyGridState(25),
      columnPinning: { start: ["code"], end: [] },
      columnSizing: { code: 200 },
    };
    // Restoring from a URL must not silently discard the user's column layout.
    const restored = queryToGridState(
      { page: 2, pageSize: 25, sort: [], filters: [], search: "abc" },
      base,
    );
    expect(restored.columnPinning).toEqual({ start: ["code"], end: [] });
    expect(restored.columnSizing).toEqual({ code: 200 });
    expect(restored.globalFilter).toBe("abc");
  });

  it("round-trips sorting and search through the URL and back into state", async () => {
    const { gridStateToQuery, queryToGridState, emptyGridState } = await import(
      "@/lib/grid-state"
    );
    const state = {
      ...emptyGridState(25),
      sorting: [{ id: "createdAt", desc: true }],
      globalFilter: "nguyễn",
    };
    const viaUrl = parseSearchParams(toSearchParams(gridStateToQuery(state)));
    const restored = queryToGridState(viaUrl);
    expect(restored.sorting).toEqual([{ id: "createdAt", desc: true }]);
    expect(restored.globalFilter).toBe("nguyễn");
  });
});
