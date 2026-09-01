"use client";

import * as React from "react";

import { Calendar } from "@/components/ui/calendar";

export default function CalendarDemo() {
  const [ngay, setNgay] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={ngay}
      onSelect={setNgay}
      className="rounded-md border"
    />
  );
}
