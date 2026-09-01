"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";

import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";

export default function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [range, setRange] = React.useState<DateRange | undefined>();

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <DatePicker value={date} onValueChange={setDate} className="w-56" />
      <DateRangePicker value={range} onValueChange={setRange} className="w-72" />
    </div>
  );
}
