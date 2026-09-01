import type { GridPinnedPosition } from "@/lib/grid-state";

/**
 * Sticky offsets for pinned columns.
 *
 * Pinning plus virtualization is the classic place a data grid breaks. The fix
 * that survives both is to keep pinned columns in normal document flow with
 * `position: sticky` and a computed offset, rather than absolutely positioning
 * them: sticky cells scroll with the virtualizer's transform without needing to
 * know anything about it.
 *
 * Offsets are cumulative — the second start-pinned column sits after the width
 * of the first — so they must be computed from the ordered pinned list, not per
 * column in isolation.
 */

export type PinnedStyle = {
  position: "sticky";
  insetInlineStart?: number;
  insetInlineEnd?: number;
  zIndex: number;
};

/** Pinned cells sit above normal cells but below the sticky header row. */
const PINNED_Z = 2;

export function pinnedOffset(
  widths: number[],
  index: number,
  position: "start" | "end",
): number {
  if (position === "start") {
    return widths.slice(0, index).reduce((sum, w) => sum + w, 0);
  }
  return widths.slice(index + 1).reduce((sum, w) => sum + w, 0);
}

export function pinnedStyle(
  pinned: GridPinnedPosition,
  widths: number[],
  index: number,
): PinnedStyle | undefined {
  if (pinned === false) return undefined;
  const offset = pinnedOffset(widths, index, pinned);
  // Logical properties rather than left/right so the same code works in RTL,
  // matching v9's start/end pinning vocabulary.
  return pinned === "start"
    ? { position: "sticky", insetInlineStart: offset, zIndex: PINNED_Z }
    : { position: "sticky", insetInlineEnd: offset, zIndex: PINNED_Z };
}

/**
 * A shadow on the last start-pinned and first end-pinned column, so the user can
 * see that content is scrolling underneath rather than being clipped.
 */
export function pinnedEdgeClass(
  pinned: GridPinnedPosition,
  index: number,
  total: number,
): string {
  if (pinned === "start" && index === total - 1) {
    return "after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-border after:shadow-[2px_0_4px_-2px_var(--border)]";
  }
  if (pinned === "end" && index === 0) {
    return "before:absolute before:inset-y-0 before:start-0 before:w-px before:bg-border before:shadow-[-2px_0_4px_-2px_var(--border)]";
  }
  return "";
}
