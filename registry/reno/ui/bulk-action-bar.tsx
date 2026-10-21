"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The strip above a list that appears while rows are selected: "Đã chọn N" at the
 * left, the bulk buttons, "Bỏ chọn" at the right.
 *
 * Mandatory in the admin layout standard (§7): every list whose rows support any
 * bulk-able action has the select column AND this bar. The bar renders nothing
 * at zero so a screen can mount it unconditionally.
 *
 * When the whole page is selected and more rows match the filter than the page
 * holds, a banner under the bar offers the cross-page selection — "Đã chọn 10
 * người trên trang này. Chọn tất cả 240 người khớp bộ lọc". The component does
 * not decide what "the whole page" is; the caller passes `pageFullySelected`
 * because only the grid knows its page.
 *
 * The bulk buttons are `children`, not a prop array: which of them are
 * destructive, which confirm first and which are disabled for this selection
 * are all the screen's business.
 */
export type BulkActionBarLabels = {
  region: string;
  selected: (count: number) => string;
  clear: string;
  pageSelected: (count: number, noun: string) => string;
  selectAllMatching: (total: number, noun: string) => string;
  allMatchingSelected: (total: number, noun: string) => string;
};

export const defaultBulkActionBarLabels: BulkActionBarLabels = {
  region: "Thao tác hàng loạt",
  selected: (count) => `Đã chọn ${count}`,
  clear: "Bỏ chọn",
  pageSelected: (count, noun) => `Đã chọn ${count} ${noun} trên trang này.`,
  selectAllMatching: (total, noun) => `Chọn tất cả ${total} ${noun} khớp bộ lọc`,
  allMatchingSelected: (total, noun) => `Đã chọn tất cả ${total} ${noun} khớp bộ lọc.`,
};

export type BulkActionBarProps = {
  /** Selected rows. Zero renders nothing. */
  count: number;
  onClear: () => void;
  /** The bulk buttons. */
  children?: React.ReactNode;
  /** What the rows are called in the banner: "người", "đơn hàng". */
  noun?: string;
  /** True when every row on the current page is selected. */
  pageFullySelected?: boolean;
  /** Rows matching the current filter, across all pages. */
  matchingTotal?: number;
  /** True once the selection is "everything matching the filter". */
  allMatchingSelected?: boolean;
  onSelectAllMatching?: () => void;
  labels?: Partial<BulkActionBarLabels>;
  className?: string;
};

export function BulkActionBar({
  count,
  onClear,
  children,
  noun = "dòng",
  pageFullySelected = false,
  matchingTotal,
  allMatchingSelected = false,
  onSelectAllMatching,
  labels: overrides,
  className,
}: BulkActionBarProps) {
  const labels = { ...defaultBulkActionBarLabels, ...overrides };
  if (count === 0) return null;

  const offerAll =
    pageFullySelected &&
    onSelectAllMatching !== undefined &&
    matchingTotal !== undefined &&
    matchingTotal > count;

  return (
    <div
      data-slot="bulk-action-bar"
      role="region"
      aria-label={labels.region}
      className={cn("flex flex-col overflow-hidden rounded-lg border border-primary/30 bg-primary-soft text-primary-soft-foreground", className)}
    >
      <div className="flex flex-wrap items-center gap-[var(--density-gap)] px-3 py-2">
        <span role="status" className="text-sm font-medium tabular-nums">
          {labels.selected(count)}
        </span>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
        <Button variant="ghost" size="sm" className="ms-auto" onClick={onClear}>
          {labels.clear}
        </Button>
      </div>

      {offerAll || allMatchingSelected ? (
        <div
          data-slot="bulk-action-bar-banner"
          className="flex flex-wrap items-center gap-2 border-t border-primary/20 px-3 py-1.5 text-sm"
        >
          {allMatchingSelected ? (
            <span>{labels.allMatchingSelected(matchingTotal ?? count, noun)}</span>
          ) : (
            <>
              <span>{labels.pageSelected(count, noun)}</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={onSelectAllMatching}>
                {labels.selectAllMatching(matchingTotal!, noun)}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
