"use client";

import { AlertCircle, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DataGridLabels } from "@/lib/grid-labels";

/**
 * Empty, loading and error states.
 *
 * These live inside the grid rather than being left to each project on purpose:
 * they are the states everyone forgets, so every project ends up inventing its
 * own half-finished version. Shipping them means a grid is never blank and
 * unexplained.
 */

function StateShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataGridEmpty({
  labels,
  children,
}: {
  labels: DataGridLabels;
  /** Optional call to action — "create the first record", say. */
  children?: React.ReactNode;
}) {
  return (
    <StateShell>
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{labels.empty}</p>
      {children}
    </StateShell>
  );
}

export function DataGridError({
  labels,
  onRetry,
}: {
  labels: DataGridLabels;
  onRetry?: () => void;
}) {
  return (
    <StateShell>
      <AlertCircle className="size-8 text-destructive" aria-hidden />
      <p className="text-sm text-muted-foreground">{labels.error}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {labels.retry}
        </Button>
      ) : null}
    </StateShell>
  );
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
