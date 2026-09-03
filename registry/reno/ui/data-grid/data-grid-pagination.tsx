"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataGridLabels } from "@/lib/grid-labels";
import { selectionCount, type GridSelection } from "@/lib/grid-query";

import { paginationRange } from "./pagination-range";

/**
 * Footer: page controls, page size, and the selection summary.
 *
 * The selection summary is here rather than in the toolbar because it has to
 * report counts the toolbar does not know — an "everything matching the filter"
 * selection is a number derived from the server's total, not from the rows on
 * screen.
 */

const PAGE_SIZES = [10, 25, 50, 100];

export function DataGridPagination({
  labels,
  pageIndex,
  pageSize,
  total,
  selection,
  onPageChange,
  onPageSizeChange,
  onClearSelection,
  pageSizes = PAGE_SIZES,
}: {
  labels: DataGridLabels;
  pageIndex: number;
  pageSize: number;
  total: number;
  selection?: GridSelection;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onClearSelection?: () => void;
  pageSizes?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = pageIndex + 1;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  const selected = selection ? selectionCount(selection, total) : 0;

  const pages = paginationRange(page, totalPages);

  return (
    <div
      data-slot="data-grid-pagination"
      className="flex flex-wrap items-center gap-[var(--density-gap)] border-t border-border px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] text-sm"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {selected > 0 ? (
          <>
            <span>{labels.rowsSelected(selected)}</span>
            {onClearSelection ? (
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                {labels.clearSelection}
              </Button>
            ) : null}
          </>
        ) : (
          <span className="tabular-nums">{labels.rangeOf(from, to, total)}</span>
        )}
      </div>

      {/*
        Wraps as well as the bar itself. A grid is not always full width — put
        one in a side panel or a three-up dashboard column and this group,
        unwrapped, runs the last-page button straight off the edge where nothing
        can scroll to it.
      */}
      <div className="ms-auto flex flex-wrap items-center justify-end gap-[var(--density-gap)]">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-muted-foreground">
            {labels.rowsPerPage}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {labels.pageOf(page, totalPages)}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={labels.firstPage}
            disabled={pageIndex === 0}
            onClick={() => onPageChange(0)}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={labels.previousPage}
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          {/*
            Numbered pages, which are the only control here that answers "how
            far in am I?" without arithmetic. Windowed rather than printed in
            full: 200 buttons is a row nobody can aim at.

            Hidden on the narrowest screens — the arrows and the "page 3 / 12"
            readout already cover navigation there, and eight extra buttons is
            what pushes this bar into a third wrapped row on a phone.
          */}
          <div className="hidden items-center gap-1 sm:flex">
            {pages.map((slot, index) =>
              slot === "gap" ? (
                <span
                  key={`gap-${index}`}
                  aria-hidden
                  className="px-1 text-muted-foreground"
                  title={labels.morePages}
                >
                  …
                </span>
              ) : (
                <Button
                  key={slot}
                  variant={slot === page ? "default" : "outline"}
                  size="icon"
                  aria-label={labels.page(slot)}
                  // The pressed state, for a screen reader: `variant` carries it
                  // in colour only, and "Page 3" alone does not say you are on
                  // it.
                  aria-current={slot === page ? "page" : undefined}
                  className="tabular-nums"
                  onClick={() => onPageChange(slot - 1)}
                >
                  {slot}
                </Button>
              ),
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label={labels.nextPage}
            disabled={page >= totalPages}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={labels.lastPage}
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages - 1)}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
