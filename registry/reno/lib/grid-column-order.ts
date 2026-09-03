import type { GridState } from "@/lib/grid-state";

/**
 * Which column sits where, as arithmetic.
 *
 * Separated from the toolbar for the same reason as `pagination-range.ts`: this
 * is the part that can be wrong in a way nobody sees. A reorder that writes an
 * incomplete `columnOrder` does not throw — TanStack reads that array as the
 * whole column list and quietly relocates every column missing from it, so a
 * toolbar that forgot the selection checkbox sends it to the far right the
 * first time anyone reorders anything.
 */

/** The pieces of grid state a reorder depends on. */
export type ColumnOrderState = Pick<
  GridState,
  "columnOrder" | "columnPinning" | "columnVisibility"
>;

export type ColumnOrderInput = {
  /** Every column the grid renders, in declaration order. */
  columnIds: string[];
  /** The ids the caller has a description — and so a label — for. */
  describedIds: string[];
  state: ColumnOrderState;
};

/**
 * The order actually in force.
 *
 * An empty `columnOrder` means declaration order, which is why the first move
 * is also the one that has to seed the array.
 */
function effectiveOrder({ columnIds, state }: ColumnOrderInput): string[] {
  return state.columnOrder.length > 0 ? state.columnOrder : columnIds;
}

/**
 * The columns a move may touch, in the order they are drawn.
 *
 * Three exclusions, each for the same reason: a control that appears available
 * and changes nothing visible is worse than one that is not offered.
 *
 *   - pinned — drawn in its own region whatever the order says;
 *   - hidden — swapping with a column nobody can see looks like a dead button;
 *   - undescribed — no label to offer, and nothing the caller knows to say
 *     about it. This is how a selection checkbox stays first without anyone
 *     having to pin it.
 *
 * Every excluded column keeps its place in the order rather than being shifted,
 * so the remaining columns move across it.
 */
export function movableColumnIds(input: ColumnOrderInput): string[] {
  const { describedIds, state } = input;
  return effectiveOrder(input).filter(
    (id) =>
      describedIds.includes(id) &&
      !state.columnPinning.start.includes(id) &&
      !state.columnPinning.end.includes(id) &&
      state.columnVisibility[id] !== false,
  );
}

/**
 * Swap a column with its nearest movable neighbour, and return the whole order.
 *
 * A swap rather than a splice because a menu offers one step at a time, and one
 * step of a splice is a swap. Out of range — either end of the row, or a column
 * that cannot move — returns the order unchanged rather than throwing: the
 * caller disables those entries, and a menu is not a place to raise errors.
 */
export function moveColumn(input: ColumnOrderInput, id: string, delta: -1 | 1): string[] {
  const order = effectiveOrder(input);
  const movable = movableColumnIds(input);
  const from = movable.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= movable.length) return order;

  const swapped = [...movable];
  [swapped[from], swapped[to]] = [swapped[to]!, swapped[from]!];

  // Written back into the slots the movable columns occupied, which is what
  // leaves the pinned, hidden and undescribed ones exactly where they were.
  const movableSet = new Set(movable);
  let next = 0;
  return order.map((columnId) => (movableSet.has(columnId) ? swapped[next++]! : columnId));
}
