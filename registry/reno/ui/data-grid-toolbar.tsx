"use client";

import * as React from "react";
import {
  ArrowDownUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  DownloadIcon,
  ListFilterIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  moveColumn as moveColumnBy,
  movableColumnIds,
  type ColumnOrderInput,
} from "@/lib/grid-column-order";
import { resolveLabels, type DataGridLabels } from "@/lib/grid-labels";
import type { GridState } from "@/lib/grid-state";

/**
 * Everything a grid needs above it: search, filters, sort, columns, export.
 *
 * Kept a separate registry item from the grid so a screen that only needs a
 * table does not install it, and so a project can replace it wholesale without
 * forking the grid.
 *
 * It is a controlled view over the same `GridState` the grid uses — it holds no
 * state of its own beyond the search debounce, so toolbar and grid can never
 * disagree about what is filtered.
 *
 * One description of the columns drives three menus. `options` makes a column
 * filterable, `canSort` puts it in the sort menu, `canHide` in the visibility
 * menu; a project that repeats itself here has three lists to keep in step.
 */

export type ExportFormat = "csv" | "excel" | "pdf";
export type ImportFormat = "csv" | "excel";

/** Display names are proper nouns and stay the same in every language. */
const FORMAT_NAMES: Record<ExportFormat, string> = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
};

export type DataGridToolbarColumn = {
  id: string;
  label: string;
  /** Offer it in the visibility menu. Default true. */
  canHide?: boolean;
  /** Offer it in the sort menu. */
  canSort?: boolean;
  /**
   * Values offered in the filter menu. A column with no options is not
   * filterable from here — which is the right default, because a free-text
   * column has no list to show.
   */
  options?: { value: string; label: string; icon?: React.ReactNode }[];
};

export type DataGridToolbarProps = {
  state: GridState;
  onStateChange: (updater: (current: GridState) => GridState) => void;
  columns?: DataGridToolbarColumn[];
  /**
   * Every column the grid renders, in declaration order — including ones no
   * menu shows, such as a selection checkbox.
   *
   * Required for the reorder entries, and separate from `columns` on purpose.
   * `columnOrder` is read as the grid's whole column list: a partial one moves
   * the columns it omits to the end, so a toolbar that seeded it from its own
   * menu description would send the checkbox column to the far right the first
   * time anyone reordered anything. Omit this and the columns menu simply does
   * not offer reordering.
   */
  columnIds?: string[];
  labels?: Partial<DataGridLabels>;
  /** Overrides the search box's placeholder and accessible name. */
  searchPlaceholder?: string;
  /** Formats offered under Export. Omit the handler to hide the menu. */
  exportFormats?: ExportFormat[];
  onExport?: (format: ExportFormat) => void;
  /** Formats offered under Import. Omit the handler to hide them. */
  importFormats?: ImportFormat[];
  onImport?: (format: ImportFormat) => void;
  /** Human-readable rendering of an active column filter, for the chips. */
  describeFilter?: (filter: { id: string; value: unknown }) => string;
  searchDebounceMs?: number;
  /** Trailing slot, after the built-in menus: an analytics menu, a help button. */
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function DataGridToolbar({
  state,
  onStateChange,
  columns = [],
  columnIds,
  labels: labelOverrides,
  searchPlaceholder,
  exportFormats = ["csv", "excel", "pdf"],
  onExport,
  importFormats = ["csv", "excel"],
  onImport,
  describeFilter,
  searchDebounceMs = 300,
  actions,
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

  /** Any filter change returns to page 1: page 7 of a smaller result is empty. */
  const withFilters = (columnFilters: GridState["columnFilters"]) =>
    (current: GridState): GridState => ({
      ...current,
      columnFilters,
      pagination: { ...current.pagination, pageIndex: 0 },
    });

  const removeFilter = (id: string) =>
    onStateChange((current) =>
      withFilters(current.columnFilters.filter((f) => f.id !== id))(current),
    );

  /**
   * One value per column, replacing whatever was there.
   *
   * Choosing the "all" entry is `removeFilter`, not a special case here: a facet
   * set to everything is a facet with no filter, and expressing it twice would
   * mean two paths that can disagree about what "cleared" leaves behind.
   */
  const setFilter = (id: string, value: string | null) => {
    if (value === null) {
      removeFilter(id);
      return;
    }
    onStateChange((current) =>
      withFilters([...current.columnFilters.filter((f) => f.id !== id), { id, value }])(current),
    );
  };

  const clearFilters = () => onStateChange(withFilters([]));

  const reset = () =>
    onStateChange((current) => ({
      ...withFilters([])(current),
      globalFilter: "",
    }));

  const toggleColumn = (id: string, visible: boolean) =>
    onStateChange((current) => ({
      ...current,
      columnVisibility: { ...current.columnVisibility, [id]: visible },
    }));

  /**
   * Reordering, with the arithmetic in `@/lib/grid-column-order`.
   *
   * What stays here is only which columns the toolbar knows about; which of
   * them can move, and what the resulting order is, are pure and tested there.
   */
  const orderInput = (current: GridState): ColumnOrderInput => ({
    columnIds: columnIds ?? [],
    describedIds: columns.map((column) => column.id),
    state: current,
  });

  const moveColumn = (id: string, delta: -1 | 1) =>
    onStateChange((current) => ({
      ...current,
      columnOrder: moveColumnBy(orderInput(current), id, delta),
    }));

  /**
   * Sorting from the menu replaces the sort rather than adding to it.
   *
   * Multi-column sort is still available where it belongs — shift-clicking a
   * header, which is the gesture every spreadsheet user already knows. A menu
   * that silently accumulated sorts would leave someone looking at a three-key
   * ordering they cannot see the shape of.
   */
  const toggleSort = (id: string) =>
    onStateChange((current) => {
      const existing = current.sorting.find((s) => s.id === id);
      return {
        ...current,
        sorting: existing?.desc ? [] : [{ id, desc: Boolean(existing) }],
      };
    });

  const filterable = columns.filter((column) => column.options?.length);
  const sortable = columns.filter((column) => column.canSort);
  const hideable = columns.filter((column) => column.canHide !== false);
  /*
    Listed in the order the columns are drawn rather than in `columns` order: a
    list ordered differently from the row it moves things in would make "left"
    ambiguous.

    No `columnIds` leaves this empty and the reorder section unrendered, which
    is `movableColumnIds` returning nothing for an empty order rather than a
    check here — a second check would be a second thing to keep true.
  */
  const movable = movableColumnIds(orderInput(state)).map(
    (id) => columns.find((column) => column.id === id)!,
  );
  const valueOf = (id: string) => activeFilters.find((f) => f.id === id)?.value ?? null;

  return (
    <div
      data-slot="data-grid-toolbar"
      className={cn("flex flex-wrap items-center gap-[var(--density-gap)]", className)}
    >
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute inset-y-0 start-2 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={searchPlaceholder ?? labels.search}
          aria-label={searchPlaceholder ?? labels.search}
          className="w-56 ps-8"
        />
      </div>

      {filterable.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ListFilterIcon />
              {labels.filter}
              {/*
                A dot, because a closed menu otherwise hides the fact that the
                grid is filtered — and "why is this row missing" is the support
                question that follows. The chips below say which, for anyone who
                can see them; this says "something", from across the screen.
              */}
              {activeFilters.length > 0 ? (
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-primary"
                  data-slot="data-grid-toolbar-filter-dot"
                />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {filterable.map((column, index) => {
              const active = valueOf(column.id);
              return (
                <React.Fragment key={column.id}>
                  {index > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel>{column.label}</DropdownMenuLabel>
                  <FilterOption
                    label={labels.allOf(column.label)}
                    selected={active === null}
                    onSelect={() => setFilter(column.id, null)}
                  />
                  {column.options?.map((option) => (
                    <FilterOption
                      key={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={active === option.value}
                      onSelect={() => setFilter(column.id, option.value)}
                    />
                  ))}
                </React.Fragment>
              );
            })}
            {activeFilters.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>{labels.clearFilters}</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {sortable.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowDownUpIcon />
              {labels.sort}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortable.map((column) => {
              const sort = state.sorting.find((s) => s.id === column.id);
              return (
                <DropdownMenuItem key={column.id} onClick={() => toggleSort(column.id)}>
                  {column.label}
                  {sort ? (
                    <span className="ms-auto" aria-hidden>
                      {sort.desc ? (
                        <ArrowDownIcon className="size-3.5" />
                      ) : (
                        <ArrowUpIcon className="size-3.5" />
                      )}
                    </span>
                  ) : null}
                  {/* The direction in words: the arrow alone reaches nobody
                      using a screen reader. */}
                  {sort ? (
                    <span className="sr-only">
                      {sort.desc ? labels.sortDescending : labels.sortAscending}
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {activeFilters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {describeFilter ? describeFilter(filter) : `${filter.id}: ${String(filter.value)}`}
          <button
            type="button"
            onClick={() => removeFilter(filter.id)}
            aria-label={`${labels.clearFilter}: ${filter.id}`}
            className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <XIcon className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}

      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={reset}>
          {labels.reset}
          <XIcon />
        </Button>
      ) : null}

      {children}

      <div className="ms-auto flex items-center gap-2">
        {hideable.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontalIcon />
                <span className="max-sm:sr-only">{labels.columns}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{labels.toggleColumn}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hideable.map((column) => (
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
              {movable.length > 1 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{labels.columnOrder}</DropdownMenuLabel>
                  {movable.map((column, index) => (
                    <DropdownMenuSub key={column.id}>
                      <DropdownMenuSubTrigger>{column.label}</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {/*
                          The menu stays open on a move: reordering is done by
                          repetition, and closing after every step would make
                          three places to the left cost three trips.
                        */}
                        <DropdownMenuItem
                          disabled={index === 0}
                          onSelect={(event) => {
                            event.preventDefault();
                            moveColumn(column.id, -1);
                          }}
                        >
                          <ArrowLeftIcon />
                          {labels.moveColumnLeft}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === movable.length - 1}
                          onSelect={(event) => {
                            event.preventDefault();
                            moveColumn(column.id, 1);
                          }}
                        >
                          <ArrowRightIcon />
                          {labels.moveColumnRight}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {onExport || onImport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon />
                <span className="max-sm:sr-only">{labels.export}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExport
                ? exportFormats.map((format) => (
                    <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                      {labels.exportAs(FORMAT_NAMES[format])}
                    </DropdownMenuItem>
                  ))
                : null}
              {onExport && onImport ? <DropdownMenuSeparator /> : null}
              {onImport
                ? importFormats.map((format) => (
                    <DropdownMenuItem key={format} onClick={() => onImport(format)}>
                      {labels.importFrom(FORMAT_NAMES[format])}
                    </DropdownMenuItem>
                  ))
                : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {actions}
      </div>
    </div>
  );
}

/**
 * One value in a facet.
 *
 * A radio item would be the obvious primitive, but Radix's radio group wants to
 * own the value and this one is owned by `GridState`. `role="menuitemradio"`
 * with an explicit `aria-checked` says the same thing to assistive tech without
 * a second copy of the selection.
 */
function FilterOption({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  icon?: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem role="menuitemradio" aria-checked={selected} onClick={onSelect}>
      {icon}
      {label}
      {selected ? <CheckIcon className="ms-auto size-4" aria-hidden /> : null}
    </DropdownMenuItem>
  );
}
