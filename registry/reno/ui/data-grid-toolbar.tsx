"use client";

import * as React from "react";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolveLabels, type DataGridLabels } from "@/lib/grid-labels";
import type { GridState } from "@/lib/grid-state";

/**
 * Search, active-filter chips, column visibility and export.
 *
 * Kept a separate registry item from the grid so a screen that only needs a
 * table does not install it, and so a project can replace it wholesale without
 * forking the grid.
 *
 * It is a controlled view over the same `GridState` the grid uses — it holds no
 * state of its own beyond the debounce buffer, so toolbar and grid can never
 * disagree about what is filtered.
 */

export type DataGridToolbarProps = {
  state: GridState;
  onStateChange: (updater: (current: GridState) => GridState) => void;
  /** Columns offered in the visibility menu. */
  columns?: { id: string; label: string; canHide?: boolean }[];
  labels?: Partial<DataGridLabels>;
  onExport?: () => void;
  /** Human-readable rendering of an active column filter, for the chips. */
  describeFilter?: (filter: { id: string; value: unknown }) => string;
  searchDebounceMs?: number;
  className?: string;
  children?: React.ReactNode;
};

export function DataGridToolbar({
  state,
  onStateChange,
  columns = [],
  labels: labelOverrides,
  onExport,
  describeFilter,
  searchDebounceMs = 300,
  className,
  children,
}: DataGridToolbarProps) {
  const labels = React.useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);

  // The input holds its own draft between keystrokes so typing stays
  // responsive; committing on a debounce is what stops a request per character.
  const committed = state.globalFilter;
  const [draft, setDraft] = React.useState(committed);
  const [seenCommitted, setSeenCommitted] = React.useState(committed);

  // Adjusting state during render is React's sanctioned way to react to a
  // changed prop. Doing it in an effect would render the stale draft first and
  // then correct it, which shows as a flicker when the filter is reset.
  if (committed !== seenCommitted) {
    setSeenCommitted(committed);
    setDraft(committed);
  }

  React.useEffect(() => {
    if (draft === committed) return;
    const timer = setTimeout(() => {
      onStateChange((current) => ({ ...current, globalFilter: draft }));
    }, searchDebounceMs);
    return () => clearTimeout(timer);
  }, [draft, committed, onStateChange, searchDebounceMs]);

  const activeFilters = state.columnFilters;
  const hasActive = activeFilters.length > 0 || committed !== "";

  const removeFilter = (id: string) =>
    onStateChange((current) => ({
      ...current,
      columnFilters: current.columnFilters.filter((f) => f.id !== id),
      pagination: { ...current.pagination, pageIndex: 0 },
    }));

  const reset = () =>
    onStateChange((current) => ({
      ...current,
      columnFilters: [],
      globalFilter: "",
      pagination: { ...current.pagination, pageIndex: 0 },
    }));

  const toggleColumn = (id: string, visible: boolean) =>
    onStateChange((current) => ({
      ...current,
      columnVisibility: { ...current.columnVisibility, [id]: visible },
    }));

  return (
    <div
      data-slot="data-grid-toolbar"
      className={cn("flex flex-wrap items-center gap-[var(--density-gap)]", className)}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 start-2 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
          className="w-56 ps-8"
        />
      </div>

      {activeFilters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {describeFilter ? describeFilter(filter) : `${filter.id}: ${String(filter.value)}`}
          <button
            type="button"
            onClick={() => removeFilter(filter.id)}
            aria-label={`${labels.clearFilter}: ${filter.id}`}
            className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}

      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={reset}>
          {labels.reset}
          <X />
        </Button>
      ) : null}

      {children}

      <div className="ms-auto flex items-center gap-2">
        {columns.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal />
                {labels.columns}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{labels.toggleColumn}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns
                .filter((c) => c.canHide !== false)
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    // Absent means visible: TanStack's visibility map only
                    // records explicit overrides.
                    checked={state.columnVisibility[column.id] !== false}
                    onCheckedChange={(value) => toggleColumn(column.id, Boolean(value))}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {onExport ? (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download />
            {labels.export}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
