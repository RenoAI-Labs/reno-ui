"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboboxOption<TValue extends string | number = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps<TValue extends string | number = string> {
  options: ComboboxOption<TValue>[];
  value?: TValue | null;
  onValueChange?: (value: TValue | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Shows a clear (x) affordance once a value is selected. */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Single-select searchable dropdown, composed from Popover + Command + Button
 * (shadcn ships this only as a copy-paste recipe, not a component). Generic
 * over `TValue` via the `{ value, label }` option shape so callers get type
 * safety without an `any` escape hatch.
 */
function Combobox<TValue extends string | number = string>({
  options,
  value = null,
  onValueChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy",
  clearable = false,
  disabled = false,
  className,
  id,
}: ComboboxProps<TValue>) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value) ?? null;

  const handleSelect = (option: ComboboxOption<TValue>) => {
    if (option.disabled) return;
    onValueChange?.(option.value);
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange?.(null);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <span className="flex items-center gap-1">
            {clearable && selected ? (
              <XIcon
                data-slot="combobox-clear"
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
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option)}
                >
                  <CheckIcon
                    className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
