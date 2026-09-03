"use client";

import * as React from "react";
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

  /*
    Three ids, so the column's own title can name more than one control.

    Measured on the built showcase before this existed: six of ten column
    headers reached the accessibility tree named "Sắp xếp tăng dần", because an
    `aria-label` on the sort button replaced the header text it wrapped — and a
    header cell takes its name from its content, so the column name was gone
    from the cell too. `aria-sort` on a column nobody can name says nothing.

    `useId` rather than `header.id`: a page can render two grids, and two
    elements sharing a DOM id would send every `aria-labelledby` here to the
    first one.
  */
  const id = React.useId();
  const titleId = `${id}-title`;
  const sortHintId = `${id}-sort`;
  const menuId = `${id}-menu`;

  return (
    <th
      data-slot="data-grid-header-cell"
      // Explicit because the header row is a flex container, which costs the
      // `<th>` its implicit role — and with it the `aria-sort` below.
      role="columnheader"
      scope="col"
      colSpan={header.colSpan}
      /*
        Named by the column's title alone. A cell otherwise takes its name from
        everything inside it, which now includes two controls that name
        themselves after the column — so a reader moving across the header row
        would hear "Trạng thái Tuỳ chọn cột Trạng thái" instead of the column.
      */
      aria-labelledby={header.isPlaceholder ? undefined : titleId}
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
              /*
                Referenced rather than left to compose from the content:
                implementations differ on whether a space is inserted between
                two child elements, and "TênSắp xếp tăng dần" is what that
                costs. Ids join with a space everywhere.
              */
              aria-labelledby={`${titleId} ${sortHintId}`}
            >
              <span id={titleId}>
                {flexRender(column.columnDef.header, header.getContext())}
              </span>
              <SortIcon sorted={sorted} />
              {/*
                The action in words, after the column rather than instead of it.
                A header that renders an icon beside its text has no plain
                string to fall back on, so the name has to come from the
                rendered content — which is also what keeps this working for a
                header a project renders however it likes.
              */}
              <span id={sortHintId} className="sr-only">
                {sorted === "asc" ? labels.sortDescending : labels.sortAscending}
              </span>
            </button>
          ) : (
            <span id={titleId}>
              {flexRender(column.columnDef.header, header.getContext())}
            </span>
          )}

          {enableColumnPinning ? (
            <DropdownMenu>
              {/*
                Named "Tuỳ chọn cột" plus the column's own title, which is why
                the title carries an id. Every header used to render this
                trigger as "Cột" — the same name as the toolbar's columns
                button, nine or ten times over on one screen, and not even a
                description of a menu that sorts and pins.
              */}
              <DropdownMenuTrigger
                className="ms-auto inline-flex size-5 items-center justify-center rounded-sm opacity-0 outline-none group-hover/header:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:opacity-100"
                aria-labelledby={`${menuId} ${titleId}`}
              >
                {pinned === false ? (
                  <PinIcon className="size-3.5" aria-hidden />
                ) : (
                  <PinOffIcon className="size-3.5" aria-hidden />
                )}
                <span id={menuId} className="sr-only">
                  {labels.columnMenu}
                </span>
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
