import type { GridPinnedPosition } from "@/lib/grid-state";

/**
 * How wide one cell renders.
 *
 * A header row and a body row are flex containers at `width: 100%`, inside a
 * table that is `w-full` with `min-width` set to the sum of the declared column
 * sizes. So the row is as wide as the container while the columns fit in it,
 * and exactly as wide as the columns once they overflow.
 *
 * Fixed-width cells in that row leave the difference as dead space. A five
 * column grid in a 1980px container stopped drawing cells at 1225px, with the
 * table's own border carrying on past the last one — the columns were right,
 * the row was right, and nothing was told to take up the gap. Handing the
 * leftover to the browser is what closes it, and routing both the header and
 * the body through this one function is what stops the two disagreeing about
 * where a column starts.
 *
 * - **Centre columns grow in proportion to their declared size.** A column
 *   declared twice as wide as its neighbour stays twice as wide.
 * - **Pinned columns never grow.** Their sticky offset is the running sum of
 *   the declared widths of the columns before them (`pinnedStyle`), so a pinned
 *   column that grew would sit a few pixels off the offset the next one was
 *   given — invisible on a screenshot and miserable to chase.
 * - **Nothing shrinks.** When the columns are wider than the container the row
 *   is as wide as they are and the viewport scrolls sideways, which is what the
 *   table's `min-width` is for; `flex-shrink: 0` keeps that true no matter what
 *   a project wraps the grid in.
 */

export type ColumnSizeStyle = {
  width: number;
  flexGrow: number;
  flexShrink: 0;
};

export function columnSizeStyle(
  width: number,
  pinned: GridPinnedPosition,
): ColumnSizeStyle {
  return {
    width,
    /*
      The grow factor is the declared width itself. Flex shares free space in
      proportion to the factors, so proportional growth needs no second number
      kept in sync with the first — and a resized column keeps its share,
      because the size it was dragged to is the factor.
    */
    flexGrow: pinned === false ? width : 0,
    flexShrink: 0,
  };
}
