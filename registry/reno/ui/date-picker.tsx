"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_DATE_FORMAT = "dd/MM/yyyy";

/** `dd/MM/yyyy`, Vietnamese-friendly. Override via the `formatDate` prop. */
function defaultFormatDate(date: Date) {
  return format(date, DEFAULT_DATE_FORMAT, { locale: vi });
}

type SharedCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
>;

interface DatePickerProps {
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  formatDate?: (date: Date) => string;
  disabled?: boolean;
  className?: string;
  /** Forwarded to the underlying Calendar, e.g. `disabled` day matchers. */
  calendarProps?: SharedCalendarProps;
}

/** Single-date picker composed from Popover + Calendar + Button. */
function DatePicker({
  value,
  onValueChange,
  placeholder = "Chọn ngày",
  formatDate = defaultFormatDate,
  disabled = false,
  className,
  calendarProps,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange?.(date);
            setOpen(false);
          }}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  formatDate?: (date: Date) => string;
  disabled?: boolean;
  className?: string;
  calendarProps?: SharedCalendarProps;
}

/** Date-range picker composed from Popover + Calendar + Button. */
function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Chọn khoảng ngày",
  formatDate = defaultFormatDate,
  disabled = false,
  className,
  calendarProps,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label = React.useMemo(() => {
    if (!value?.from) return placeholder;
    if (!value.to) return formatDate(value.from);
    return `${formatDate(value.from)} - ${formatDate(value.to)}`;
  }, [value, placeholder, formatDate]);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onValueChange}
          numberOfMonths={2}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, DateRangePicker };
export type { DatePickerProps, DateRangePickerProps };
