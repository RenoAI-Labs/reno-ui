"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { vi } from "date-fns/locale/vi";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * react-day-picker v10. Locale defaults to Vietnamese (`date-fns/locale/vi`)
 * and can be overridden via the standard `locale` prop. Navigation buttons
 * reuse `buttonVariants` so they stay in sync with `Button`'s own styling.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = vi,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("bg-background p-[var(--density-gap)]", className)}
      classNames={{
        months: cn("flex flex-col gap-[var(--density-gap)] sm:flex-row"),
        month: cn("flex flex-col gap-[var(--density-gap)]"),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between"),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-[var(--density-control-height-sm)] p-0",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-[var(--density-control-height-sm)] p-0",
        ),
        month_caption: cn(
          "flex h-[var(--density-control-height-sm)] items-center justify-center text-sm font-medium",
        ),
        weekdays: cn("flex"),
        weekday: cn(
          "w-[var(--density-control-height)] text-xs font-normal text-muted-foreground",
        ),
        week: cn("mt-2 flex w-full"),
        day: cn("relative size-[var(--density-control-height)] p-0 text-center text-sm"),
        range_start: cn("rounded-l-md bg-accent"),
        range_middle: cn("rounded-none bg-accent/50"),
        range_end: cn("rounded-r-md bg-accent"),
        today: cn("rounded-md bg-accent text-accent-foreground"),
        outside: cn("text-muted-foreground opacity-50"),
        disabled: cn("text-muted-foreground opacity-50"),
        hidden: cn("invisible"),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} {...chevronProps} />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "size-[var(--density-control-height)] rounded-md p-0 font-normal",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
