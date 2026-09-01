"use client";

import * as React from "react";

import { Chart, type ChartKind } from "@/components/ui/chart";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HEADCOUNT_BY_MONTH, number } from "./mock-data";

const SERIES = [
  { key: "tuyenMoi", label: "Tuyển mới" },
  { key: "nghiViec", label: "Nghỉ việc" },
  { key: "ungTuyen", label: "Ứng tuyển" },
];

const KINDS: { value: ChartKind; label: string }[] = [
  { value: "bar", label: "Cột" },
  { value: "area", label: "Vùng" },
  { value: "line", label: "Đường" },
];

/**
 * Biến động nhân sự. The chart is the only place on this page that draws its own
 * colours, and it draws them from `--chart-1..5` — so switching preset re-colours
 * the series along with everything else.
 */
export function ActivityChart({ className }: { className?: string }) {
  const [kind, setKind] = React.useState<ChartKind>("bar");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Biến động nhân sự</CardTitle>
        <CardDescription>8 tháng gần nhất</CardDescription>
        <CardAction>
          <Tabs value={kind} onValueChange={(value) => setKind(value as ChartKind)}>
            <TabsList>
              {KINDS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Chart
          data={HEADCOUNT_BY_MONTH}
          xKey="month"
          series={SERIES}
          kind={kind}
          height={280}
          aria-label="Biến động nhân sự theo tháng"
          formatValue={(value) => number.format(value)}
        />
      </CardContent>
    </Card>
  );
}
