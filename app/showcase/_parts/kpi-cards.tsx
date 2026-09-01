import { ArrowDownRight, ArrowUpRight, Clock, UserMinus, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { number } from "./mock-data";

/**
 * The KPI row. Deliberately includes one card in its loading state: a showcase
 * that only ever shows the happy path hides exactly the states that break.
 */

const KPIS = [
  { key: "total", label: "Tổng nhân sự", value: 240, delta: 3.4, icon: Users, hint: "so với tháng trước" },
  { key: "hired", label: "Tuyển mới tháng 8", value: 19, delta: 12.5, icon: UserPlus, hint: "so với tháng 7" },
  { key: "left", label: "Nghỉ việc tháng 8", value: 9, delta: -8.2, icon: UserMinus, hint: "so với tháng 7" },
];

export function KpiCards() {
  return (
    <div className="grid gap-[var(--density-gap)] sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => {
        const positive = kpi.delta >= 0;
        const Arrow = positive ? ArrowUpRight : ArrowDownRight;

        return (
          <Card key={kpi.key}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <kpi.icon className="size-4" />
                {kpi.label}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{number.format(kpi.value)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={positive ? "success" : "destructive"}>
                <Arrow />
                {Math.abs(kpi.delta).toFixed(1)}%
              </Badge>
              <span className="ms-2 text-xs text-muted-foreground">{kpi.hint}</span>
            </CardContent>
          </Card>
        );
      })}

      <Card aria-busy>
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Clock className="size-4" />
            Chi phí lương tháng 8
          </CardDescription>
          <CardTitle>
            <Skeleton className="h-7 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
