"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarXIcon, Clock, PlusIcon, UserMinus, UserPlus, Users } from "lucide-react";

import { AttentionCard } from "@/components/ui/attention-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  APPLICATIONS_TREND,
  CHANNEL_BREAKDOWN,
  CONTENT_BY_STATUS,
  PERIODS,
  periodFactor,
  type PeriodValue,
} from "./mock-admin-data";
import { number } from "./mock-data";
import { RecentDocuments } from "./recent-documents";
import { SHOWCASE_ROOT } from "./showcase-nav";

/**
 * The dashboard, in the order docs/admin-layout-standard.md §5 fixes: what needs
 * the reader first, then the period's figures, then the charts.
 *
 * The employee grid used to live here. It has its own page now — a dashboard
 * that opens with a 240-row table puts the one thing a reader has to act on
 * below the fold.
 *
 * Loading and empty states are shown on purpose, not only the happy path: the
 * last KPI is left loading, and the interview card is empty.
 */

/**
 * One series per status, and one row per status holding only its own value, so
 * each bar takes the colour of its own series and its label sits under the axis.
 * The chart has no per-bar colour prop; this is the shape that gets it from the
 * series tokens without adding one.
 */
const STATUS_SERIES = CONTENT_BY_STATUS.map((entry) => ({ key: entry.status, label: entry.status }));
const STATUS_DATA = CONTENT_BY_STATUS.map((entry) => ({ label: entry.status, [entry.status]: entry.count }));

const KPIS = [
  { key: "total", label: "Tổng nhân sự", value: 240, delta: { text: "+12 so với kỳ trước", direction: "up" as const }, icon: Users },
  { key: "hired", label: "Tuyển mới", value: 19, delta: { text: "+12,5%", direction: "up" as const }, hint: "so với kỳ trước", icon: UserPlus },
  {
    key: "left",
    label: "Nghỉ việc",
    value: 9,
    // Attrition rising is bad news: the arrow follows the number, the colour
    // follows the business.
    delta: { text: "+8,2%", direction: "up" as const, intent: "negative" as const },
    hint: "so với kỳ trước",
    icon: UserMinus,
  },
];

export function DashboardPage() {
  const [period, setPeriod] = React.useState<PeriodValue>("30d");
  const factor = periodFactor(period);
  const scaled = (value: number) => number.format(Math.round(value * factor));
  const periodLabel = PERIODS.find((entry) => entry.value === period)!.label;

  const channelMax = Math.max(...CHANNEL_BREAKDOWN.map((channel) => channel.count));

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle={`${periodLabel} · GMT+7`}
        filters={
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodValue)}>
            <SelectTrigger size="sm" aria-label="Chọn kỳ báo cáo" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <Button asChild size="sm">
            <Link href={`${SHOWCASE_ROOT}/employees`}>
              <PlusIcon />
              Thêm nhân viên
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="dash-attention" className="flex flex-col gap-2">
        <h2 id="dash-attention" className="text-sm font-semibold">
          Cần bạn xử lý
        </h2>
        <div className="grid gap-[var(--density-gap)] md:grid-cols-3">
          <AttentionCard
            severity="warning"
            status="Chờ duyệt"
            meta="Cũ nhất 2 ngày"
            value="12"
            description="Đơn nghỉ phép đang chờ bạn duyệt."
            actionLabel="Duyệt ngay"
          />
          <AttentionCard
            severity="destructive"
            status="Thất bại"
            meta="3 lần thử"
            value="4"
            description="Bản đồng bộ chấm công không chạy được."
            actionLabel="Xem lỗi"
          />
          <AttentionCard
            severity="warning"
            status="Cần kết nối lại"
            meta="2 tích hợp"
            value="2"
            description="Tích hợp lương và email đã hết phiên."
            actionLabel="Kết nối lại"
          />
        </div>
      </section>

      <section aria-labelledby="dash-progress" className="flex flex-col gap-2">
        <h2 id="dash-progress" className="text-sm font-semibold">
          Tiến trình kỳ này
        </h2>
        <div className="grid gap-[var(--density-gap)] sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <StatCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.key === "total" ? number.format(kpi.value) : scaled(kpi.value)}
              icon={<kpi.icon className="size-4" aria-hidden />}
              delta={kpi.delta}
              hint={kpi.hint}
            />
          ))}
          <StatCard
            label="Chi phí lương"
            value=""
            icon={<Clock className="size-4" aria-hidden />}
            delta={{ text: "" }}
            loading
          />
        </div>
      </section>

      <div className="grid gap-[var(--density-gap)] xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Hồ sơ theo trạng thái · 30 ngày</CardTitle>
            <CardDescription>Số hồ sơ ở từng bước xử lý</CardDescription>
            <CardAction>
              <Button asChild variant="link" size="sm">
                <Link href={`${SHOWCASE_ROOT}/reports`}>Mở Báo cáo</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Chart
              data={STATUS_DATA}
              xKey="label"
              series={STATUS_SERIES}
              kind="bar"
              stacked
              showLegend={false}
              height={280}
              aria-label="Số hồ sơ theo trạng thái trong 30 ngày"
              formatValue={(value) => number.format(value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lượt ứng tuyển</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-[var(--density-gap)]">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold tabular-nums">{scaled(96)}</span>
              <Badge variant="success" appearance="soft" shape="pill">
                +18% kỳ trước
              </Badge>
            </div>
            <Chart
              data={APPLICATIONS_TREND}
              xKey="label"
              series={[{ key: "value", label: "Ứng tuyển" }]}
              kind="area"
              height={80}
              showGrid={false}
              showYAxis={false}
              showLegend={false}
              aria-label="Xu hướng lượt ứng tuyển"
            />
            <ul className="flex flex-col gap-2">
              {CHANNEL_BREAKDOWN.map((channel) => (
                <li key={channel.label} className="flex flex-col gap-1 text-sm">
                  <span className="flex items-center justify-between">
                    <span>{channel.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {scaled(channel.count)}
                    </span>
                  </span>
                  <Progress value={(channel.count / channelMax) * 100} aria-label={channel.label} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-[var(--density-gap)] xl:grid-cols-3">
        <RecentDocuments className="xl:col-span-2" />
        <Card>
          <CardHeader>
            <CardTitle>Lịch phỏng vấn tuần này</CardTitle>
            <CardDescription>Các buổi đã được sắp xếp</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<CalendarXIcon className="size-8 text-muted-foreground" aria-hidden />}
              title="Chưa có lịch phỏng vấn"
              body="Tạo buổi phỏng vấn đầu tiên cho ứng viên đang chờ."
              action={
                <Button variant="outline" size="sm">
                  Tạo lịch
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
