"use client";

import * as React from "react";
import {
  ArchiveIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  GlobeIcon,
  HistoryIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  UserXIcon,
  UsersIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { DataGrid, selectionColumn } from "@/components/ui/data-grid";
import { DataGridToolbar } from "@/components/ui/data-grid-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { RowActions } from "@/components/ui/row-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadCsv, toCsv } from "@/lib/grid-export";
import { createGridColumns, emptyGridState, type GridState } from "@/lib/grid-state";
import { ROLE_IDS, ROLE_LABELS, type RoleId } from "./mock-admin-data";
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
import { densityOverrides, type DensityStep } from "./showcase-brand-tokens";

/**
 * The standard list page (docs/admin-layout-standard.md §7).
 *
 * Everything the standard asks of a list is on this one screen, wired for real:
 *
 * - toolbar: search, Lọc, Sắp xếp, then Cột, Xuất dữ liệu and a saved-views menu
 * - status tabs with counts, here one per role, and a density toggle
 * - the select column, and the bulk action bar that goes with it
 * - the Hành động column, pinned to the right edge
 * - the pagination footer, and the empty, loading and error states
 *
 * Client mode is the honest choice at this size: 240 rows fit in memory, so
 * paging and sorting in the browser avoids inventing a fake backend. Server mode
 * is what an ERP list uses; `registry/reno/examples/data-grid-demo.tsx` shows it.
 */

/** Initials from a Vietnamese name: family plus given, skipping the middle. */
function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length < 2) return name.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/*
  Generic glyphs, not brand marks. reno-ui ships no third-party brand logos and
  lucide carries none, so a professional-network source gets a briefcase and a
  search-engine source a magnifier. See docs/icons.md.
*/
const SOURCE_ICONS: Record<HireSource, React.ReactNode> = {
  linkedin: <BriefcaseBusinessIcon className="size-3.5" aria-hidden />,
  google: <SearchIcon className="size-3.5" aria-hidden />,
  referral: <UsersIcon className="size-3.5" aria-hidden />,
  website: <GlobeIcon className="size-3.5" aria-hidden />,
  coldcall: <PhoneIcon className="size-3.5" aria-hidden />,
};

/** A score as a bar and a number: the bar compares at a glance, the number is what a screen reader gets. */
function ScoreCell({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
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

const ACTIONS_COLUMN_WIDTH = 220;

/**
 * Row handlers the columns need. The columns are built once from this, so the
 * grid never sees a new column definition per render.
 */
type RowHandlers = {
  report: (message: string) => void;
  remove: (id: string) => void;
};

function buildColumns({ report, remove }: RowHandlers) {
  return createGridColumns<Person>((col) => [
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
    col.accessor("roles", {
      header: "Vai trò",
      size: 220,
      enableSorting: false,
      // The cell holds several roles, so "equals" is membership. The role tabs
      // and the filter chip both write one role id.
      filterFn: (row, columnId, value) => (row.getValue(columnId) as RoleId[]).includes(value as RoleId),
      cell: (ctx) => (
        <span className="flex flex-wrap items-center gap-1">
          {(ctx.getValue() as RoleId[]).map((role) => (
            <Badge key={role} variant="secondary">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </span>
      ),
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
      header: "Điểm",
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
        <span className="block w-full text-end tabular-nums">{currency.format(ctx.getValue() as number)}</span>
      ),
    }),
    col.accessor("joinedAt", { header: "Ngày vào", size: 130 }),
    col.display({
      id: "actions",
      header: "Hành động",
      size: ACTIONS_COLUMN_WIDTH,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      cell: ({ row }) => {
        const person = row.original;
        const say = (verb: string) => () => report(`${verb} ${person.name}`);
        return (
          // The four most used actions are inline; the rest sit behind "⋯".
          <RowActions
            actions={[
              { key: "view", label: "Xem", icon: <EyeIcon />, onSelect: say("Đang mở hồ sơ") },
              { key: "edit", label: "Sửa", icon: <PencilIcon />, onSelect: say("Đang sửa") },
              { key: "mail", label: "Gửi email", icon: <MailIcon />, onSelect: say("Đã gửi email cho") },
              { key: "approve", label: "Duyệt", icon: <CheckIcon />, onSelect: say("Đã duyệt") },
              { key: "copy", label: "Nhân bản", icon: <CopyIcon />, onSelect: say("Đã nhân bản") },
              { key: "archive", label: "Lưu trữ", icon: <ArchiveIcon />, onSelect: say("Đã lưu trữ") },
              {
                key: "delete",
                label: "Xóa",
                icon: <Trash2Icon />,
                destructive: true,
                onSelect: () => remove(person.id),
                confirm: {
                  title: `Xóa ${person.name}?`,
                  description: "Hồ sơ sẽ bị xóa khỏi danh sách. Thao tác này không thể hoàn tác.",
                  confirmLabel: "Xóa",
                },
              },
            ]}
          />
        );
      },
    }),
  ]);
}

/**
 * One description of the columns, feeding three menus: `options` makes a column
 * filterable, `canSort` puts it in the sort menu, `canHide` in the visibility
 * menu. Repeating the list per menu would be three things to keep in step.
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
  { id: "roles", label: "Vai trò", options: ROLE_IDS.map((id) => ({ value: id, label: ROLE_LABELS[id] })) },
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

/**
 * The grid's columns in declaration order, checkbox and actions included.
 * `TOOLBAR_COLUMNS` describes only what a menu shows, and TanStack reads
 * `columnOrder` as the whole column list.
 */
const COLUMN_IDS = ["select", ...TOOLBAR_COLUMNS.map((column) => column.id), "actions"];

const FILTER_LABELS: Record<string, (value: string) => string> = {
  status: (value) => `Trạng thái: ${STATUS_LABELS[value as Person["status"]] ?? value}`,
  source: (value) => `Nguồn: ${SOURCE_LABELS[value as HireSource] ?? value}`,
  department: (value) => `Phòng ban: ${value}`,
  roles: (value) => `Vai trò: ${ROLE_LABELS[value as RoleId] ?? value}`,
};

/** What goes into the CSV: a different document from the grid, with raw values and no controls. */
const CSV_COLUMNS = [
  { label: "Mã", value: (row: Person) => row.id },
  { label: "Họ tên", value: (row: Person) => row.name },
  { label: "Email", value: (row: Person) => row.email },
  { label: "Phòng ban", value: (row: Person) => row.department },
  { label: "Vai trò", value: (row: Person) => row.roles.map((role) => ROLE_LABELS[role]).join("; ") },
  { label: "Trạng thái", value: (row: Person) => STATUS_LABELS[row.status] },
  { label: "Điểm", value: (row: Person) => row.score },
  { label: "Nguồn tuyển", value: (row: Person) => SOURCE_LABELS[row.source] },
  { label: "Lương", value: (row: Person) => row.salary },
  { label: "Ngày vào", value: (row: Person) => row.joinedAt },
];

const DENSITY_CHOICES: { step: DensityStep; label: string }[] = [
  { step: "compact", label: "Gọn" },
  { step: "normal", label: "Thường" },
  { step: "comfortable", label: "Thoáng" },
];

/** Only the row tokens: a density toggle on a list must not resize the page's own controls. */
const ROW_TOKENS = new Set(["--density-row-height", "--density-cell-padding-x", "--density-cell-padding-y"]);

function rowDensityStyle(step: DensityStep): React.CSSProperties | undefined {
  if (step === "normal") return undefined;
  return Object.fromEntries(
    densityOverrides(step)
      .filter((entry) => ROW_TOKENS.has(entry.name))
      .map((entry) => [entry.name, entry.value]),
  ) as React.CSSProperties;
}

type DataMode = "normal" | "loading" | "empty" | "error";

const DATA_MODES: { value: DataMode; label: string }[] = [
  { value: "normal", label: "Có dữ liệu" },
  { value: "loading", label: "Đang tải" },
  { value: "empty", label: "Rỗng" },
  { value: "error", label: "Lỗi" },
];

const ALL_TAB = "all";

export function EmployeesPage() {
  const [people, setPeople] = React.useState<Person[]>(PEOPLE);
  const [state, setState] = React.useState<GridState>(() => ({
    ...emptyGridState(10),
    columnPinning: { start: ["select"], end: ["actions"] },
  }));
  const [view, setView] = React.useState<{ pageRowIds: string[]; total: number }>({
    pageRowIds: [],
    total: PEOPLE.length,
  });
  const [allMatching, setAllMatching] = React.useState(false);
  const [density, setDensity] = React.useState<DensityStep>("normal");
  const [dataMode, setDataMode] = React.useState<DataMode>("normal");
  // Nothing is wired to a backend, so actions report what was asked rather than
  // pretending to do it. A demo that silently does nothing teaches the reader
  // the control is decorative.
  const [message, setMessage] = React.useState<string | null>(null);

  const handlers = React.useMemo<RowHandlers>(
    () => ({
      report: setMessage,
      remove: (id) => {
        setPeople((current) => current.filter((person) => person.id !== id));
        setState((current) => {
          const rowSelection = { ...current.rowSelection };
          delete rowSelection[id];
          return { ...current, rowSelection };
        });
        setMessage("Đã xóa nhân viên khỏi danh sách");
      },
    }),
    [],
  );
  const columns = React.useMemo(() => buildColumns(handlers), [handlers]);

  /** Any selection change that is not "all matching" itself drops the cross-page selection. */
  const updateState = React.useCallback((updater: (current: GridState) => GridState) => {
    setState((current) => {
      const next = updater(current);
      if (next.rowSelection !== current.rowSelection) setAllMatching(false);
      return next;
    });
  }, []);

  const roleCounts = React.useMemo(() => {
    const counts = new Map<RoleId, number>();
    for (const person of people) for (const role of person.roles) counts.set(role, (counts.get(role) ?? 0) + 1);
    return counts;
  }, [people]);

  const activeRole = (state.columnFilters.find((filter) => filter.id === "roles")?.value as RoleId | undefined) ?? ALL_TAB;

  const selectTab = (value: string) =>
    updateState((current) => ({
      ...current,
      columnFilters: [
        ...current.columnFilters.filter((filter) => filter.id !== "roles"),
        ...(value === ALL_TAB ? [] : [{ id: "roles", value }]),
      ],
      pagination: { ...current.pagination, pageIndex: 0 },
    }));

  const selectedIds = Object.keys(state.rowSelection);
  const selectedCount = allMatching ? view.total : selectedIds.length;
  const pageFullySelected =
    view.pageRowIds.length > 0 && view.pageRowIds.every((id) => state.rowSelection[id]);

  const clearSelection = () => {
    setAllMatching(false);
    setState((current) => ({ ...current, rowSelection: {} }));
  };

  const bulk = (verb: string) => () =>
    setMessage(`${verb} ${selectedCount} người${allMatching ? " khớp bộ lọc" : ""}`);

  const exportSelected = () => {
    const rows = people.filter((person) => state.rowSelection[person.id]);
    downloadCsv("nhan-vien-da-chon", toCsv(rows, CSV_COLUMNS));
    setMessage(`Đã xuất ${rows.length} dòng ra CSV`);
  };

  const savedView = (filters: GridState["columnFilters"]) => () =>
    updateState((current) => ({
      ...current,
      columnFilters: filters,
      pagination: { ...current.pagination, pageIndex: 0 },
    }));

  return (
    <>
      <PageHeader
        title="Nhân viên"
        subtitle={message ?? `${people.length} nhân viên đang được quản lý`}
        actions={
          <Button size="sm" onClick={() => setMessage("Đang mở biểu mẫu thêm nhân viên")}>
            <PlusIcon />
            Thêm nhân viên
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-[var(--density-gap)]">
        {/* Status tabs with counts: "Tất cả", then one tab per role. */}
        <Tabs value={activeRole} onValueChange={selectTab} className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value={ALL_TAB}>
              Tất cả <span className="tabular-nums text-muted-foreground">{people.length}</span>
            </TabsTrigger>
            {ROLE_IDS.map((role) => (
              <TabsTrigger key={role} value={role}>
                {ROLE_LABELS[role]}{" "}
                <span className="tabular-nums text-muted-foreground">{roleCounts.get(role) ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={dataMode} onValueChange={(value) => setDataMode(value as DataMode)}>
            <SelectTrigger size="sm" aria-label="Trạng thái dữ liệu để xem thử" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={density}
            aria-label="Mật độ"
            onValueChange={(value) => value && setDensity(value as DensityStep)}
          >
            {DENSITY_CHOICES.map((choice) => (
              <ToggleGroupItem key={choice.step} value={choice.step} aria-label={`Mật độ ${choice.label}`}>
                {choice.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <DataGridToolbar
        state={state}
        onStateChange={updateState}
        columns={TOOLBAR_COLUMNS}
        columnIds={COLUMN_IDS}
        searchPlaceholder="Tìm kiếm bất kỳ…"
        /*
          CSV only, and it downloads for real. Excel and PDF need a library, and
          picking one on a project's behalf is not reno's call — so the menu does
          not offer what it will not do.
        */
        exportFormats={["csv"]}
        onExport={() => {
          downloadCsv("nhan-vien", toCsv(people, CSV_COLUMNS));
          setMessage(`Đã xuất ${people.length} dòng ra CSV`);
        }}
        describeFilter={(filter) =>
          FILTER_LABELS[filter.id]?.(String(filter.value)) ?? `${filter.id}: ${String(filter.value)}`
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Chế độ xem đã lưu">
                <HistoryIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Chế độ xem đã lưu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={savedView([])}>Tất cả nhân viên</DropdownMenuItem>
              <DropdownMenuItem onSelect={savedView([{ id: "status", value: "probation" }])}>
                Đang thử việc
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={savedView([{ id: "status", value: "leave" }])}>
                Đang nghỉ phép
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/*
        Directly above the table, and only while rows are selected. Mandatory for
        any list whose rows support a bulk-able action (standard §7).
      */}
      <BulkActionBar
        count={selectedCount}
        noun="người"
        pageFullySelected={pageFullySelected}
        matchingTotal={view.total}
        allMatchingSelected={allMatching}
        onSelectAllMatching={() => setAllMatching(true)}
        onClear={clearSelection}
      >
        <Button variant="outline" size="sm" onClick={bulk("Đã vô hiệu hóa")}>
          <UserXIcon />
          Vô hiệu hóa
        </Button>
        <Button variant="outline" size="sm" onClick={bulk("Đã gửi email cho")}>
          <MailIcon />
          Gửi email
        </Button>
        <Button variant="outline" size="sm" disabled={allMatching} onClick={exportSelected}>
          <DownloadIcon />
          Xuất
        </Button>
        <Button variant="destructive" size="sm" onClick={bulk("Đã yêu cầu xóa")}>
          <Trash2Icon />
          Xóa
        </Button>
      </BulkActionBar>

      <div style={rowDensityStyle(density)}>
        <DataGrid
          // Re-mounted on a density change: the grid measures its row height once
          // from the scroll element, and the wrapper's tokens do not touch <html>.
          key={density}
          columns={columns}
          data={dataMode === "empty" ? [] : people}
          state={state}
          onStateChange={updateState}
          getRowId={(row) => row.id}
          mode="client"
          height={460}
          isLoading={dataMode === "loading"}
          error={dataMode === "error" ? new Error("network") : undefined}
          onRetry={() => setDataMode("normal")}
          selection={allMatching ? { mode: "exclude", ids: [] } : undefined}
          onClearSelection={clearSelection}
          onViewChange={setView}
          emptyAction={
            <Button size="sm" onClick={() => setDataMode("normal")}>
              Thêm nhân viên đầu tiên
            </Button>
          }
        />
      </div>
    </>
  );
}
