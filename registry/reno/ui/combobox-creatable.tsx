"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ComboboxOption } from "@/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";

/**
 * A `Combobox` that can also add the option the user just typed.
 *
 * The requirement it answers: a select field has to let someone create a
 * missing option without leaving the form. Sending them to an admin screen to
 * add one tag loses whatever they had already filled in, and every project we
 * ship has at least one field — tag, category, unit, supplier — where the list
 * is not knowable up front.
 *
 * `Combobox` is left untouched and this sits beside it. The two are installed
 * separately, so a project whose selects are all closed lists never ships a
 * create path it does not want a user to find.
 *
 * The option type is imported rather than redeclared, so a project can hand the
 * same array to either component.
 */

export type ComboboxCreatableLabels = {
  placeholder: string;
  searchPlaceholder: string;
  /** Shown when nothing matches AND creating is not allowed for this query. */
  empty: string;
  /** The create row. Quotes the query so it is obvious what will be created. */
  create: (query: string) => string;
  creating: string;
  createFailed: string;
  clear: string;
};

export const defaultComboboxCreatableLabels: ComboboxCreatableLabels = {
  placeholder: "Chọn...",
  searchPlaceholder: "Tìm hoặc nhập tên mới...",
  empty: "Không tìm thấy",
  create: (query) => `Tạo "${query}"`,
  creating: "Đang tạo...",
  createFailed: "Không tạo được lựa chọn mới.",
  clear: "Xoá lựa chọn",
};

export const englishComboboxCreatableLabels: ComboboxCreatableLabels = {
  placeholder: "Select...",
  searchPlaceholder: "Search or type a new name...",
  empty: "No results",
  create: (query) => `Create "${query}"`,
  creating: "Creating...",
  createFailed: "Could not create the new option.",
  clear: "Clear selection",
};

/** Trimmed, case-insensitive: "Hà Nội " must not offer to create "Hà Nội" again. */
function hasExactMatch(options: { label: string }[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return options.some((option) => option.label.trim().toLocaleLowerCase() === needle);
}

function ComboboxCreatable<TValue extends string | number = string>({
  options,
  value = null,
  onValueChange,
  onCreate,
  canCreate,
  clearable = false,
  disabled = false,
  className,
  id,
  labels: labelOverrides,
}: {
  options: ComboboxOption<TValue>[];
  value?: TValue | null;
  onValueChange?: (value: TValue | null) => void;
  /**
   * Called with the typed text when the create row is chosen.
   *
   * Return the new option's value to have it selected here. Return nothing when
   * the caller re-renders with a longer `options` list and sets `value` itself —
   * both flows are real, and forcing the first one would mean this component
   * inventing an id the server has not issued yet. Rejecting surfaces
   * `createFailed` and leaves the popover open with the text intact, so a failed
   * round-trip does not cost the user what they typed.
   */
  onCreate?: (query: string) => Promise<TValue | null | void> | TValue | null | void;
  /** Veto the create row, e.g. a minimum length. Defaults to any non-empty text. */
  canCreate?: (query: string) => boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  labels?: Partial<ComboboxCreatableLabels>;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultComboboxCreatableLabels, ...labelOverrides }),
    [labelOverrides],
  );

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const selected = options.find((option) => option.value === value) ?? null;
  const trimmed = query.trim();
  const allowed = canCreate ? canCreate(trimmed) : trimmed.length > 0;
  const showCreate =
    Boolean(onCreate) && allowed && !hasExactMatch(options, trimmed) && !pending;

  const closeAndReset = () => {
    setOpen(false);
    setQuery("");
    setFailed(false);
  };

  const handleSelect = (option: ComboboxOption<TValue>) => {
    if (option.disabled) return;
    onValueChange?.(option.value);
    closeAndReset();
  };

  const handleCreate = async () => {
    if (!onCreate || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const created = await onCreate(trimmed);
      // `undefined` means the caller is driving `value` itself; selecting a
      // value it never returned would fight its own state update.
      if (created !== undefined && created !== null) onValueChange?.(created);
      closeAndReset();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange?.(null);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        // A create in flight owns the popover: closing it mid-request would
        // unmount the pending row and leave the user with no sign anything
        // happened when the server finally answers.
        if (!next && pending) return;
        if (next) setOpen(true);
        else closeAndReset();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-busy={pending || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : labels.placeholder}</span>
          <span className="flex items-center gap-1">
            {clearable && selected ? (
              <XIcon
                data-slot="combobox-creatable-clear"
                aria-label={labels.clear}
                className="size-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            ) : null}
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-40 p-0" align="start">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={labels.searchPlaceholder}
            disabled={pending}
          />
          <CommandList>
            {/* cmdk only renders this when no item matches, and the create row
                is an item, so the two never appear together. */}
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled || pending}
                  onSelect={() => handleSelect(option)}
                >
                  <CheckIcon
                    className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")}
                  />
                  {option.label}
                </CommandItem>
              ))}

              {showCreate ? (
                <CommandItem
                  data-slot="combobox-creatable-create"
                  // The query as the item's own value, so cmdk's filter always
                  // scores it a match and the row cannot filter itself out.
                  value={trimmed}
                  onSelect={handleCreate}
                >
                  <PlusIcon className="size-4" />
                  {labels.create(trimmed)}
                </CommandItem>
              ) : null}

              {pending ? (
                <div
                  data-slot="combobox-creatable-pending"
                  className="flex min-h-[var(--density-control-height-sm)] items-center gap-2 px-[var(--density-control-px)] py-1.5 text-sm"
                >
                  <Spinner size="sm" label={labels.creating} />
                  <span className="text-muted-foreground">{labels.creating}</span>
                </div>
              ) : null}
            </CommandGroup>
          </CommandList>
          {failed ? (
            <p role="alert" className="text-destructive px-[var(--density-control-px)] py-1.5 text-xs">
              {labels.createFailed}
            </p>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxCreatable };
