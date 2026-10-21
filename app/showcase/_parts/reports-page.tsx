"use client";

import * as React from "react";
import { ChevronDownIcon, DownloadIcon, UserMinusIcon, UserPlusIcon, UsersIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart, type ChartKind } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCsv, toCsv } from "@/lib/grid-export";
import {
  GROUP_BY,
  PERIODS,
  REPORT_BY_SOURCE,
  REPORT_FUNNEL,
  REPORT_SERIES_BY_DEPARTMENT,
  REPORT_SERIES_BY_MONTH,
  REPORT_SERIES_BY_WEEK,
  REPORT_SUMMARY,
  periodFactor,
  type GroupByValue,
  type PeriodValue,
} from "./mock-admin-data";
import { currency, number } from "./mock-data";

const SERIES = [
  { key: "tuyenMoi", label: "Tuyển mới" },
  { key: "nghiViec", label: "Nghỉ việc" },
  { key: "ungTuyen", label: "Ứng tuyển" },
];

const FUNNEL_SERIES = [
  { key: "dauVao", label: "Hồ sơ đầu vào" },
  { key: "phongVan", label: "Phỏng vấn" },
  { key: "nhanViec", label: "Nhận việc" },
];

const KINDS: { value: ChartKind; label: string }[] = [
  { value: "bar", label: "Cột" },
  { value: "area", label: "Vùng" },
  { value: "line", label: "Đường" },
];

const SERIES_BY_GROUP = {
  week: { rows: REPORT_SERIES_BY_WEEK, label: "8 tuần gần nhất" },
  month: { rows: REPORT_SERIES_BY_MONTH, label: "8 tháng gần nhất" },
  department: { rows: REPORT_SERIES_BY_DEPARTMENT, label: "Theo từng phòng ban" },
} satisfies Record<GroupByValue, { rows: readonly Record<string, string | number>[]; label: string }>;

/** Scale every numeric field of a row, keeping the label, so a period change moves every bar. */
function scaleRow<T extends Record<string, string | number>>(row: T, factor: number): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? Math.round(value * factor) : value]),
  ) as T;
}

/** The loading stand-in for a chart: same footprint, so the card does not jump when data arrives. */
function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" aria-hidden />;
}

export function ReportsPage() {
  const [period, setPeriod] = React.useState<PeriodValue>("30d");
  const [groupBy, setGroupBy] = React.useState<GroupByValue>("month");
  const [kind, setKind] = React.useState<ChartKind>("bar");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");

  const factor = periodFactor(period);
  const periodLabel = PERIODS.find((option) => option.value === period)?.label ?? period;

  const series = React.useMemo(
    () => SERIES_BY_GROUP[groupBy].rows.map((row) => scaleRow(row, factor)),
    [groupBy, factor],
  );
  const funnel = React.useMemo(() => REPORT_FUNNEL.map((row) => scaleRow(row, factor)), [factor]);
  const sources = React.useMemo(
    () =>
      REPORT_BY_SOURCE.map((row) => ({ ...row, value: Math.round(row.value * factor) })).sort(
        (a, b) => b.value - a.value,
      ),
    [factor],
  );
  // Headcount is a stock, not a flow: it does not grow with the length of the period, so only
  // hires, leavers and cost scale. Every KPI below is a flow and does scale.
  const summary = React.useMemo(
    () =>
      REPORT_SUMMARY.map((row) => ({
        ...row,
        hired: Math.round(row.hired * factor),
        left: Math.round(row.left * factor),
        cost: Math.round(row.cost * factor),
      })),
    [factor],
  );
  const totals = React.useMemo(
    () =>
      summary.reduce(
        (sum, row) => ({
          headcount: sum.headcount + row.headcount,
          hired: sum.hired + row.hired,
          left: sum.left + row.left,
          cost: sum.cost + row.cost,
        }),
        { headcount: 0, hired: 0, left: 0, cost: 0 },
      ),
    [summary],
  );
  const applications = Math.round(
    REPORT_SERIES_BY_MONTH.reduce((sum, row) => sum + row.ungTuyen, 0) * factor,
  );
  const maxSource = sources[0]?.value ?? 0;

  function exportCsv() {
    const csv = toCsv(summary, [
      { label: "Phòng ban", value: (row) => row.department },
      { label: "Nhân sự", value: (row) => row.headcount },
      { label: "Tuyển mới", value: (row) => row.hired },
      { label: "Nghỉ việc", value: (row) => row.left },
      { label: "Chi phí (₫)", value: (row) => row.cost },
    ]);
    downloadCsv(`bao-cao-${period}.csv`, csv);
    setStatus(`Đã xuất bao-cao-${period}.csv (${summary.length} phòng ban, ${periodLabel.toLowerCase()}).`);
  }

  // reno ships CSV only (see grid-export): Excel and PDF mean picking a library, which is the
  // project's call. Those menu items say so instead of producing a fake file.

  return (
    <>
      <PageHeader
        title="Báo cáo"
        subtitle={`${periodLabel} · GMT+7`}
        filters={
          <>
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodValue)}>
              <SelectTrigger size="sm" aria-label="Khoảng thời gian">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByValue)}>
              <SelectTrigger size="sm" aria-label="Nhóm theo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_BY.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon aria-hidden />
                Xuất
                <ChevronDownIcon aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportCsv}>Xuất CSV</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setStatus("Chưa xuất Excel: bản trình diễn chỉ có CSV. Dự án thật chọn thư viện Excel riêng.")}
              >
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setStatus("Chưa xuất PDF: bản trình diễn chỉ có CSV. Dự án thật chọn thư viện PDF riêng.")}
              >
                Xuất PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setLoading((value) => !value)} aria-pressed={loading}>
          {loading ? "Hiện dữ liệu" : "Xem trạng thái đang tải"}
        </Button>
      </div>

      <section
        aria-label="Chỉ số chính"
        className="grid grid-cols-1 gap-[var(--density-gap)] sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Hồ sơ ứng tuyển"
          value={number.format(applications)}
          icon={<UsersIcon className="size-4" aria-hidden />}
          delta={{ text: "12%", direction: "up" }}
          hint="so với kỳ trước"
          loading={loading}
        />
        <StatCard
          label="Tuyển mới"
          value={number.format(totals.hired)}
          icon={<UserPlusIcon className="size-4" aria-hidden />}
          delta={{ text: "8%", direction: "up" }}
          hint="so với kỳ trước"
          loading={loading}
        />
        <StatCard
          label="Nghỉ việc"
          value={number.format(totals.left)}
          icon={<UserMinusIcon className="size-4" aria-hidden />}
          delta={{ text: "2,1%", direction: "up", intent: "negative" }}
          hint="so với kỳ trước"
          loading={loading}
        />
        <StatCard
          label="Chi phí nhân sự"
          value={number.format(Math.round(totals.cost / 1_000_000))}
          unit="triệu ₫"
          icon={<WalletIcon className="size-4" aria-hidden />}
          delta={{ text: "3,4%", direction: "up", intent: "neutral" }}
          hint="so với kỳ trước"
          loading={loading}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Biến động nhân sự</CardTitle>
          <CardDescription>{SERIES_BY_GROUP[groupBy].label}</CardDescription>
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
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Chart
              data={series}
              xKey="label"
              series={SERIES}
              kind={kind}
              height={280}
              aria-label={`Biến động nhân sự ${GROUP_BY.find((o) => o.value === groupBy)?.label.toLowerCase()}, ${periodLabel.toLowerCase()}`}
              formatValue={(value) => number.format(value)}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-[var(--density-gap)] lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phễu tuyển dụng</CardTitle>
            <CardDescription>Hồ sơ đầu vào, phỏng vấn và nhận việc theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <Chart
                data={funnel}
                xKey="label"
                series={FUNNEL_SERIES}
                kind="bar"
                stacked
                height={260}
                aria-label={`Phễu tuyển dụng theo tháng, ${periodLabel.toLowerCase()}`}
                formatValue={(value) => number.format(value)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tuyển dụng theo nguồn</CardTitle>
            <CardDescription>Xếp hạng nguồn ứng viên</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : groupBy === "department" ? (
              // Sources are tracked per hire, not per department, so grouping by department
              // leaves this card with nothing honest to rank: show why and the way out.
              <EmptyState
                title="Chưa có dữ liệu nguồn theo phòng ban"
                body="Nguồn ứng viên chỉ được ghi nhận theo tuần hoặc tháng."
                action={
                  <Button variant="outline" size="sm" onClick={() => setGroupBy("month")}>
                    Xem theo tháng
                  </Button>
                }
              />
            ) : (
              <ol aria-label={`Số lượt tuyển theo nguồn, ${periodLabel.toLowerCase()}`} className="flex flex-col gap-3">
                {sources.map((source) => (
                  <li key={source.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.label}</span>
                      <span className="font-medium tabular-nums">{number.format(source.value)}</span>
                    </div>
                    <Progress
                      value={maxSource > 0 ? (source.value / maxSource) * 100 : 0}
                      aria-label={`${source.label}: ${number.format(source.value)} lượt tuyển`}
                    />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp theo phòng ban</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading}>
              <DownloadIcon aria-hidden />
              Xuất CSV
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableCaption className="sr-only">
                Tổng hợp nhân sự, tuyển mới, nghỉ việc và chi phí theo phòng ban, {periodLabel.toLowerCase()}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Phòng ban</TableHead>
                  <TableHead scope="col" className="text-right">
                    Nhân sự
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Tuyển mới
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Nghỉ việc
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Chi phí
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((row) => (
                  <TableRow key={row.department}>
                    <TableHead scope="row">{row.department}</TableHead>
                    <TableCell className="text-right tabular-nums">{number.format(row.headcount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{number.format(row.hired)}</TableCell>
                    <TableCell className="text-right tabular-nums">{number.format(row.left)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency.format(row.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableHead scope="row">Tổng cộng</TableHead>
                  <TableCell className="text-right font-medium tabular-nums">
                    {number.format(totals.headcount)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{number.format(totals.hired)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{number.format(totals.left)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{currency.format(totals.cost)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
