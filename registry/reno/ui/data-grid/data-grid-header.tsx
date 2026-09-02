"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, PinIcon, PinOffIcon } from "lucide-react";
import { flexRender, type Header, type RowData } from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GridFeatures } from "@/lib/grid-state";

import { indexOf, useDataGridContext, widthsOf } from "./data-grid-context";
import { pinnedEdgeClass, pinnedStyle } from "./column-pinning";

/**
 * Header cells: sort affordance, resize handle and the pin/sort menu.
 *
 * The header is a normal sticky row rather than a separate scroll-synced
 * element. Synced scrolling is the usual cause of a header that drifts a pixel
 * behind the body on fast scroll; `position: sticky` cannot drift.
 */

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUpIcon className="size-3.5" aria-hidden />;
  if (sorted === "desc") return <ArrowDownIcon className="size-3.5" aria-hidden />;
  return <ChevronsUpDownIcon className="size-3.5 opacity-50" aria-hidden />;
}

export function DataGridHeaderCell<TData extends RowData>({
  header,
}: {
  header: Header<GridFeatures, TData, unknown>;
}) {
  const { labels, layout, enableColumnPinning, enableColumnResizing } =
    useDataGridContext();
  const column = header.column;
  // `getIsPinned()` reads state directly, so an explicit `state.columnPinning`
  // or a restored layout would still render sticky with pinning switched off.
  // The prop means "no pinning", not "no pin menu".
  const pinned = enableColumnPinning ? column.getIsPinned() : false;
  const sorted = column.getIsSorted();

  const group = pinned === "start" ? layout.start : pinned === "end" ? layout.end : [];
  const groupIndex = pinned === false ? -1 : indexOf(group, column.id);
  const style = {
    width: column.getSize(),
    ...(pinned === false ? {} : pinnedStyle(pinned, widthsOf(group), groupIndex)),
  };

  const canSort = column.getCanSort();

  return (
    <th
      data-slot="data-grid-header-cell"
      // Explicit because the header row is a flex container, which costs the
      // `<th>` its implicit role — and with it the `aria-sort` below.
      role="columnheader"
      scope="col"
      colSpan={header.colSpan}
      // `aria-sort` is what makes multi-column sort perceivable to a screen
      // reader; the arrow icon alone conveys nothing.
      aria-sort={
        !canSort ? undefined : sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
      }
      style={style}
      className={cn(
        "relative border-b border-border bg-muted px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] text-start align-middle font-medium whitespace-nowrap select-none",
        pinned !== false && "bg-muted",
        pinnedEdgeClass(pinned, groupIndex, group.length),
      )}
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1">
          {canSort ? (
            <button
              type="button"
              // Shift-click adds a column to the sort instead of replacing it,
              // which is the convention every spreadsheet user already knows.
              onClick={(event) => column.toggleSorting(undefined, event.shiftKey)}
              className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label={sorted === "asc" ? labels.sortDescending : labels.sortAscending}
            >
              {flexRender(column.columnDef.header, header.getContext())}
              <SortIcon sorted={sorted} />
            </button>
          ) : (
            flexRender(column.columnDef.header, header.getContext())
          )}

          {enableColumnPinning ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ms-auto inline-flex size-5 items-center justify-center rounded-sm opacity-0 outline-none group-hover/header:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:opacity-100"
                aria-label={labels.columns}
              >
                {pinned === false ? (
                  <PinIcon className="size-3.5" aria-hidden />
                ) : (
                  <PinOffIcon className="size-3.5" aria-hidden />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canSort ? (
                  <>
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                      {labels.sortAscending}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                      {labels.sortDescending}
                    </DropdownMenuItem>
                    {sorted !== false ? (
                      <DropdownMenuItem onClick={() => column.clearSorting()}>
                        {labels.clearSort}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={() => column.pin("start")}>
                  {labels.pinLeft}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => column.pin("end")}>
                  {labels.pinRight}
                </DropdownMenuItem>
                {pinned !== false ? (
                  <DropdownMenuItem onClick={() => column.pin(false)}>
                    {labels.unpin}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}

      {enableColumnResizing && column.getCanResize() ? (
        <span
          role="separator"
          aria-orientation="vertical"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute inset-y-0 end-0 w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-ring",
            column.getIsResizing() && "bg-ring",
          )}
        />
      ) : null}
    </th>
  );
}
