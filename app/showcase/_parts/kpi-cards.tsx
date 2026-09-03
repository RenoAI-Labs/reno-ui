import { Clock, UserMinus, UserPlus, Users } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { number } from "./mock-data";

/**
 * The KPI row.
 *
 * This file used to draw the tile itself — Card + Badge + Skeleton + an arrow,
 * about forty lines of it. That shape was already written twice: once in a real
 * project, once here. It is `@reno/stat-card` now, and this page consumes it
 * like any project would, which is the only way the extraction is worth
 * anything.
 *
 * One card is deliberately left in its loading state: a showcase that only ever
 * shows the happy path hides exactly the states that break.
 */

const KPIS = [
  {
    key: "total",
    label: "Tổng nhân sự",
    value: 240,
    delta: { text: "3,4%", direction: "up" },
    icon: Users,
    hint: "so với tháng trước",
  },
  {
    key: "hired",
    label: "Tuyển mới tháng 8",
    value: 19,
    delta: { text: "12,5%", direction: "up" },
    icon: UserPlus,
    hint: "so với tháng 7",
  },
  {
    key: "left",
    label: "Nghỉ việc tháng 8",
    // Attrition rising is bad news: the arrow follows the number, the colour
    // follows the business. This is the case a single "up = green" rule gets
    // wrong, and the reason StatCard separates the two.
    value: 9,
    delta: { text: "8,2%", direction: "up", intent: "negative" },
    icon: UserMinus,
    hint: "so với tháng 7",
  },
] as const;

export function KpiCards() {
  return (
    <div className="grid gap-[var(--density-gap)] sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => (
        <StatCard
          key={kpi.key}
          label={kpi.label}
          value={number.format(kpi.value)}
          icon={<kpi.icon className="size-4" aria-hidden />}
          delta={kpi.delta}
          hint={kpi.hint}
        />
      ))}

      <StatCard
        label="Chi phí lương tháng 8"
        value=""
        icon={<Clock className="size-4" aria-hidden />}
        delta={{ text: "" }}
        loading
      />
    </div>
  );
}
