"use client";

import * as React from "react";
import {
  ChartPieIcon,
  CircleCheckIcon,
  CircleXIcon,
  GlobeIcon,
  BriefcaseBusinessIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  TargetIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGrid, selectionColumn } from "@/components/ui/data-grid";
import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";
import {
  HIRE_SOURCES,
  PEOPLE,
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  currency,
  type HireSource,
  type Person,
} from "./mock-data";

/**
 * The DataGrid inside a real screen rather than a demo page.
 *
 * This is the page that has to prove the grid is finished: search, a faceted
 * filter menu, a sort menu, column visibility, export and import, a trailing
 * actions menu, numbered pages, row selection, and cells that are more than
 * text — an avatar, badges carrying their own glyph, and a score rendered as a
 * bar as well as a number.
 *
 * Client mode is the honest choice at this size — 240 rows fit in memory, so
 * paging and sorting in the browser avoids inventing a fake backend. Server
 * mode is what an ERP list uses; `registry/reno/examples/data-grid-demo.tsx`
 * shows it.
 */

/** Initials from a Vietnamese name: family plus given, skipping the middle. */
function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length < 2) return name.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/*
  Generic glyphs, not brand marks. The reference screen uses the LinkedIn and
  Google logos; reno-ui ships no third-party brand logos and lucide carries
  none, so a professional-network source gets a briefcase and a search-engine
  source a magnifier. See docs/icons.md for why that rule exists — a logo set
  would also force an exception in `no-raw-color`, since a brand mark is
  defined by exact hex values.
*/
const SOURCE_ICONS: Record<HireSource, React.ReactNode> = {
  linkedin: <BriefcaseBusinessIcon className="size-3.5" aria-hidden />,
  google: <SearchIcon className="size-3.5" aria-hidden />,
  referral: <UsersIcon className="size-3.5" aria-hidden />,
  website: <GlobeIcon className="size-3.5" aria-hidden />,
  coldcall: <PhoneIcon className="size-3.5" aria-hidden />,
};

/**
 * A score as a bar and a number.
 *
 * Both, not either. The bar is what makes a column of scores comparable at a
 * glance; the number is what a screen reader gets, and what anyone reads when
 * two bars are nearly the same length.
 */
function ScoreCell({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={`block h-full rounded-full ${score >= 70 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive"}`}
          style={{ width: `${score}%` }}
        />
      </span>
      <span className="tabular-nums">{score}</span>
    </span>
  );
}

/** Column headers carry a glyph, which is what makes a wide grid scannable. */
function HeaderWithIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

const columns = createGridColumns<Person>((col) => [
  selectionColumn<Person>(),
  col.accessor("name", {
    header: () => <HeaderWithIcon icon={<UserIcon className="size-3.5" aria-hidden />}>Họ tên</HeaderWithIcon>,
    size: 220,
    cell: (ctx) => {
      const name = ctx.getValue() as string;
      return (
        <span className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-[0.625rem]">{initials(name)}</AvatarFallback>
          </Avatar>
          {name}
        </span>
      );
    },
  }),
  col.accessor("email", {
    header: () => <HeaderWithIcon icon={<MailIcon className="size-3.5" aria-hidden />}>Email</HeaderWithIcon>,
    size: 220,
  }),
  // `equalsString`, not the default substring match: the filter menu writes one
  // exact value, and a facet for "Kỹ thuật" must not also match every
  // department that contains it.
  col.accessor("department", { header: "Phòng ban", size: 170, filterFn: "equalsString" }),
  col.accessor("nextReview", {
    header: () => (
      <HeaderWithIcon icon={<TargetIcon className="size-3.5" aria-hidden />}>Đánh giá tới</HeaderWithIcon>
    ),
    size: 150,
  }),
  col.accessor("status", {
    header: "Trạng thái",
    size: 140,
    enableSorting: false,
    filterFn: "equalsString",
    cell: (ctx) => {
      const status = ctx.getValue() as Person["status"];
      return (
        <Badge variant={STATUS_VARIANTS[status]}>
          {status === "left" ? (
            <CircleXIcon className="size-3.5" aria-hidden />
          ) : (
            <CircleCheckIcon className="size-3.5" aria-hidden />
          )}
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
  }),
  col.accessor("score", {
    header: () => <HeaderWithIcon icon={<ZapIcon className="size-3.5" aria-hidden />}>Điểm</HeaderWithIcon>,
    size: 150,
    cell: (ctx) => <ScoreCell score={ctx.getValue() as number} />,
  }),
  col.accessor("source", {
    header: "Nguồn tuyển",
    size: 160,
    enableSorting: false,
    filterFn: "equalsString",
    cell: (ctx) => {
      const source = ctx.getValue() as HireSource;
      return (
        <Badge variant="outline">
          {SOURCE_ICONS[source]}
          {SOURCE_LABELS[source]}
        </Badge>
      );
    },
  }),
  col.accessor("salary", {
    header: "Lương",
    size: 150,
    cell: (ctx) => (
      <span className="tabular-nums">{currency.format(ctx.getValue() as number)}</span>
    ),
  }),
  col.accessor("joinedAt", { header: "Ngày vào", size: 130 }),
]);

/**
 * One description of the columns, feeding three menus.
 *
 * `options` makes a column filterable, `canSort` puts it in the sort menu,
 * `canHide` in the visibility menu. Repeating the list per menu would be three
 * things to keep in step.
 */
const TOOLBAR_COLUMNS = [
  { id: "name", label: "Họ tên", canHide: false, canSort: true },
  { id: "email", label: "Email", canSort: true },
  {
    id: "department",
    label: "Phòng ban",
    options: ["Kỹ thuật", "Kinh doanh", "Kế toán", "Nhân sự", "Chăm sóc khách hàng", "Vận hành"].map(
      (name) => ({ value: name, label: name }),
    ),
  },
  { id: "nextReview", label: "Đánh giá tới" },
  {
    id: "status",
    label: "Trạng thái",
    options: (Object.keys(STATUS_LABELS) as Person["status"][]).map((status) => ({
      value: status,
      label: STATUS_LABELS[status],
      icon:
        status === "left" ? (
          <CircleXIcon className="size-4" aria-hidden />
        ) : (
          <CircleCheckIcon className="size-4" aria-hidden />
        ),
    })),
  },
  { id: "score", label: "Điểm", canSort: true },
  {
    id: "source",
    label: "Nguồn tuyển",
    options: HIRE_SOURCES.map((source) => ({
      value: source,
      label: SOURCE_LABELS[source],
      icon: SOURCE_ICONS[source],
    })),
  },
  { id: "salary", label: "Lương", canSort: true },
  { id: "joinedAt", label: "Ngày vào", canSort: true },
];

const FILTER_LABELS: Record<string, (value: string) => string> = {
  status: (value) => `Trạng thái: ${STATUS_LABELS[value as Person["status"]] ?? value}`,
  source: (value) => `Nguồn: ${SOURCE_LABELS[value as HireSource] ?? value}`,
  department: (value) => `Phòng ban: ${value}`,
};

export function PeopleTable() {
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(10),
    columnPinning: { start: ["select"], end: [] },
  }));

  // Nothing is wired to a backend here, so the export and import menus report
  // what was asked for rather than pretending to do it. A demo that silently
  // does nothing teaches the reader the menu is decorative.
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  const selectedCount = Object.keys(state.rowSelection).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách nhân viên</CardTitle>
        <CardDescription>
          {selectedCount > 0
            ? `Đã chọn ${selectedCount} trên ${PEOPLE.length} nhân viên`
            : lastAction
              ? lastAction
              : `${PEOPLE.length} nhân viên đang được quản lý`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-[var(--density-gap)]">
        <DataGridToolbar
          state={state}
          onStateChange={setState}
          columns={TOOLBAR_COLUMNS}
          searchPlaceholder="Search Anything..."
          onExport={(format) => setLastAction(`Đã yêu cầu xuất ${format.toUpperCase()}`)}
          onImport={(format) => setLastAction(`Đã yêu cầu nhập từ ${format.toUpperCase()}`)}
          describeFilter={(filter) =>
            FILTER_LABELS[filter.id]?.(String(filter.value)) ??
            `${filter.id}: ${String(filter.value)}`
          }
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Phân tích">
                  <ChartPieIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLastAction("Đang mở phân tích")}>
                  Xem phân tích
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLastAction("Đang dựng phân bổ nhân sự")}>
                  Phân bổ nhân sự
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLastAction("Đang tính tỉ lệ nghỉ việc")}>
                  Tỉ lệ nghỉ việc
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLastAction("Đang tạo báo cáo")}>
                  Tạo báo cáo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
        <DataGrid
          columns={columns}
          data={PEOPLE}
          state={state}
          onStateChange={setState}
          getRowId={(row) => row.id}
          mode="client"
          height={460}
        />
      </CardContent>
    </Card>
  );
}
