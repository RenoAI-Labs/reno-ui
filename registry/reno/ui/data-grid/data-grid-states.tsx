"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataGridLabels } from "@/lib/grid-labels";

/**
 * Empty, loading and error states.
 *
 * These live inside the grid rather than being left to each project on purpose:
 * they are the states everyone forgets, so every project ends up inventing its
 * own half-finished version. Shipping them means a grid is never blank and
 * unexplained.
 *
 * The empty and error shells themselves are not grid-specific and are no longer
 * written here — `EmptyState` and `ErrorState` own them, and this file only
 * supplies the grid's labels. Two copies of a state component is how the two
 * drift apart.
 */

export function DataGridEmpty({
  labels,
  children,
}: {
  labels: DataGridLabels;
  /** Optional call to action — "create the first record", say. */
  children?: React.ReactNode;
}) {
  return <EmptyState body={labels.empty} action={children} />;
}

export function DataGridError({
  labels,
  onRetry,
}: {
  labels: DataGridLabels;
  onRetry?: () => void;
}) {
  return <ErrorState body={labels.error} onRetry={onRetry} retryLabel={labels.retry} />;
}

/**
 * Skeleton rows sized to the current density, so the loading state occupies the
 * same height the real rows will. Without that the page reflows on every fetch.
 */
export function DataGridSkeleton({
  columnCount,
  rowCount = 8,
  labels,
}: {
  columnCount: number;
  rowCount?: number;
  labels: DataGridLabels;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={labels.loading}>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex h-[var(--density-row-height)] items-center gap-[var(--density-gap)] border-b border-border px-[var(--density-cell-padding-x)]"
        >
          {Array.from({ length: columnCount }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-3 flex-1"
              // Vary the widths a little so it reads as content, not a barcode.
              style={{ maxWidth: `${40 + ((colIndex * 37) % 50)}%` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">{labels.loading}</span>
    </div>
  );
}
