/**
 * Which page numbers to show, and where to put the gaps.
 *
 * Numbered pages are the only pagination control that answers "how far in am
 * I?" at a glance, but printing all of them stops working the moment a result
 * set is large — 200 pages is a row of buttons nobody can aim at. So the window
 * keeps the first page, the last page, and a few either side of the current
 * one, with an ellipsis standing in for what was left out.
 *
 * Pure, and in its own file, because the off-by-one cases here are the whole
 * difficulty: the window has to stay the same width as it slides, or the
 * buttons shuffle sideways under the pointer as you page through.
 */

/** A page number, or a gap where numbers were omitted. */
export type PageSlot = number | "gap";

/**
 * @param page Current page, 1-based.
 * @param totalPages Total pages, at least 1.
 * @param siblings How many neighbours to keep either side of the current page.
 */
export function paginationRange(page: number, totalPages: number, siblings = 1): PageSlot[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(page)), total);

  /*
    The widest the row ever gets: first, last, the current page, its siblings on
    both sides, and two gaps. Everything below is about keeping the row at this
    width whatever the current page is — a row that grows and shrinks as you
    page moves the buttons under the pointer.
  */
  const windowSize = siblings * 2 + 5;
  if (total <= windowSize) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);

  const slots: PageSlot[] =
    left <= 2 && right >= total - 1
      ? Array.from({ length: total }, (_, index) => index + 1)
      : left <= 2
        ? // Near the start: a run of pages, one gap, the last page.
          [
            ...Array.from({ length: siblings * 2 + 3 }, (_, index) => index + 1),
            "gap",
            total,
          ]
        : right >= total - 1
          ? // Near the end: the first page, one gap, a run of pages.
            [
              1,
              "gap",
              ...Array.from(
                { length: siblings * 2 + 3 },
                (_, index) => total - (siblings * 2 + 3) + 1 + index,
              ),
            ]
          : [
              1,
              "gap",
              ...Array.from({ length: right - left + 1 }, (_, index) => left + index),
              "gap",
              total,
            ];

  return closeSinglePageGaps(slots);
}

/**
 * Replace a gap that hides exactly one page with the page itself.
 *
 * An ellipsis standing in for a single number is wider than the number, and it
 * costs the reader a click to find out what it was. Doing it as a pass over the
 * finished list rather than as another branch above keeps the row the same
 * width — the replacement is one slot for one slot — which is the property the
 * whole function exists to hold.
 */
function closeSinglePageGaps(slots: PageSlot[]): PageSlot[] {
  return slots.map((slot, index) => {
    if (slot !== "gap") return slot;
    const before = slots[index - 1];
    const after = slots[index + 1];
    if (typeof before !== "number" || typeof after !== "number") return slot;
    return after - before === 2 ? before + 1 : slot;
  });
}
