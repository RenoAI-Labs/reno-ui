import type {
  PermissionGrants,
  PermissionGroup,
  PermissionRole,
} from "@/components/ui/permission-matrix";

/**
 * Fixtures for the admin showcase pages: roles and permissions, reports,
 * sessions, notifications and the workspace list.
 *
 * Same rule as `mock-data.ts`: every value is derived from an index or written
 * out, never from `Math.random` or `Date.now`. The pages are server-rendered and
 * then hydrated, so a value that differs between the two renders is a hydration
 * mismatch on the one screen whose job is to look trustworthy.
 */

// ---------------------------------------------------------------------------
// Roles and permissions: 8 roles x 12 resources x 4 levels
// ---------------------------------------------------------------------------

export const ROLE_IDS = [
  "admin",
  "hr",
  "accountant",
  "manager",
  "recruiter",
  "trainer",
  "employee",
  "auditor",
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const ROLE_LABELS: Record<RoleId, string> = {
  admin: "Quản trị viên",
  hr: "Nhân sự",
  accountant: "Kế toán",
  manager: "Trưởng phòng",
  recruiter: "Tuyển dụng",
  trainer: "Đào tạo",
  employee: "Nhân viên",
  auditor: "Kiểm toán",
};

export const PERMISSION_ROLES: PermissionRole[] = ROLE_IDS.map((id) => ({
  id,
  label: ROLE_LABELS[id],
}));

/** The four levels of every resource. "Toàn quyền" implies the other three. */
const LEVELS = [
  { key: "read", label: "Xem" },
  { key: "write", label: "Tạo và sửa" },
  { key: "delete", label: "Xóa" },
  { key: "all", label: "Toàn quyền" },
] as const;
type LevelKey = (typeof LEVELS)[number]["key"];

/** `scoped` marks the resources whose "Tạo và sửa" is limited to own or team records. */
const RESOURCES = [
  { id: "accounts", label: "Tài khoản và vai trò", scoped: false },
  { id: "employees", label: "Nhân viên", scoped: true },
  { id: "departments", label: "Phòng ban", scoped: false },
  { id: "contracts", label: "Hợp đồng", scoped: true },
  { id: "payroll", label: "Bảng lương", scoped: false },
  { id: "leave", label: "Nghỉ phép", scoped: true },
  { id: "recruitment", label: "Tuyển dụng", scoped: true },
  { id: "training", label: "Đào tạo", scoped: false },
  { id: "documents", label: "Tài liệu", scoped: true },
  { id: "reports", label: "Báo cáo", scoped: false },
  { id: "settings", label: "Cấu hình hệ thống", scoped: false },
  { id: "audit", label: "Nhật ký hoạt động", scoped: false },
] as const;

export const PERMISSION_GROUPS: PermissionGroup[] = RESOURCES.map((resource) => ({
  id: resource.id,
  label: resource.label,
  rows: LEVELS.map((level) => ({
    id: `${resource.id}.${level.key}`,
    label: level.label,
    scope: level.key === "write" && resource.scoped ? "Phạm vi khác" : undefined,
    implies:
      level.key === "all"
        ? LEVELS.filter((other) => other.key !== "all").map(
            (other) => `${resource.id}.${other.key}`,
          )
        : undefined,
  })),
}));

/** The highest level each role holds per resource; a missing resource means none. */
const DEFAULT_LEVEL: Record<RoleId, Partial<Record<(typeof RESOURCES)[number]["id"], LevelKey>>> = {
  admin: Object.fromEntries(RESOURCES.map((resource) => [resource.id, "all"])),
  hr: {
    employees: "all",
    departments: "delete",
    contracts: "all",
    leave: "all",
    recruitment: "write",
    training: "write",
    documents: "delete",
    reports: "read",
  },
  accountant: { employees: "read", contracts: "read", payroll: "all", reports: "read", documents: "write" },
  manager: { employees: "read", departments: "read", leave: "write", reports: "read", training: "read" },
  recruiter: { employees: "read", recruitment: "all", documents: "write", reports: "read" },
  trainer: { employees: "read", training: "all", documents: "write" },
  employee: { leave: "write", training: "read", documents: "read" },
  auditor: Object.fromEntries(RESOURCES.map((resource) => [resource.id, "read"])),
};

function grantsFor(level: LevelKey | undefined, resourceId: string): string[] {
  if (!level) return [];
  const order: LevelKey[] = ["read", "write", "delete", "all"];
  const upto = order.indexOf(level);
  // "all" implies the three below it, and is itself a row that is ticked.
  return order.slice(0, upto + 1).map((key) => `${resourceId}.${key}`);
}

export const DEFAULT_GRANTS: PermissionGrants = Object.fromEntries(
  ROLE_IDS.map((roleId) => [
    roleId,
    RESOURCES.flatMap((resource) => grantsFor(DEFAULT_LEVEL[roleId][resource.id], resource.id)),
  ]),
);

// ---------------------------------------------------------------------------
// Shell: workspaces and notifications
// ---------------------------------------------------------------------------

export const WORKSPACES = [
  { id: "dai-viet", name: "Công ty CP Đại Việt", initials: "ĐV" },
  { id: "hai-phong", name: "Chi nhánh Hải Phòng", initials: "HP" },
  { id: "da-nang", name: "Chi nhánh Đà Nẵng", initials: "ĐN" },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "12 đơn nghỉ phép chờ duyệt", detail: "Cũ nhất 2 ngày", time: "5 phút trước", unread: true },
  { id: "n2", title: "Đồng bộ chấm công thất bại", detail: "Máy chủ trả về lỗi 500", time: "1 giờ trước", unread: true },
  { id: "n3", title: "Trần Minh Quân đã nhận việc", detail: "Phòng Kỹ thuật", time: "Hôm qua", unread: true },
  { id: "n4", title: "Bảng lương tháng 8 đã chốt", detail: "Kế toán xác nhận", time: "2 ngày trước", unread: false },
];

export const ANNOUNCEMENT = "Bảo trì hệ thống lúc 23:00 tối nay, dự kiến 30 phút.";

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const PERIODS = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "quarter", label: "Quý này" },
  { value: "year", label: "Năm nay" },
] as const;
export type PeriodValue = (typeof PERIODS)[number]["value"];

export const GROUP_BY = [
  { value: "week", label: "Theo tuần" },
  { value: "month", label: "Theo tháng" },
  { value: "department", label: "Theo phòng ban" },
] as const;
export type GroupByValue = (typeof GROUP_BY)[number]["value"];

/** Per-period scale: the same shapes, different magnitudes, so a filter visibly moves every card. */
const PERIOD_FACTOR: Record<PeriodValue, number> = { "7d": 0.25, "30d": 1, quarter: 3, year: 11 };

export function periodFactor(period: PeriodValue) {
  return PERIOD_FACTOR[period];
}

export const REPORT_SERIES_BY_MONTH = [
  { label: "T1", tuyenMoi: 12, nghiViec: 4, ungTuyen: 68 },
  { label: "T2", tuyenMoi: 9, nghiViec: 6, ungTuyen: 54 },
  { label: "T3", tuyenMoi: 17, nghiViec: 3, ungTuyen: 92 },
  { label: "T4", tuyenMoi: 14, nghiViec: 8, ungTuyen: 77 },
  { label: "T5", tuyenMoi: 21, nghiViec: 5, ungTuyen: 105 },
  { label: "T6", tuyenMoi: 18, nghiViec: 7, ungTuyen: 88 },
  { label: "T7", tuyenMoi: 24, nghiViec: 4, ungTuyen: 121 },
  { label: "T8", tuyenMoi: 19, nghiViec: 9, ungTuyen: 96 },
];

export const REPORT_SERIES_BY_WEEK = Array.from({ length: 8 }, (_, i) => ({
  label: `Tuần ${i + 1}`,
  tuyenMoi: 3 + ((i * 5) % 7),
  nghiViec: 1 + ((i * 3) % 4),
  ungTuyen: 18 + ((i * 11) % 19),
}));

export const REPORT_SERIES_BY_DEPARTMENT = [
  { label: "Kỹ thuật", tuyenMoi: 31, nghiViec: 7, ungTuyen: 160 },
  { label: "Kinh doanh", tuyenMoi: 22, nghiViec: 11, ungTuyen: 118 },
  { label: "Kế toán", tuyenMoi: 6, nghiViec: 2, ungTuyen: 34 },
  { label: "Nhân sự", tuyenMoi: 5, nghiViec: 1, ungTuyen: 27 },
  { label: "CSKH", tuyenMoi: 17, nghiViec: 9, ungTuyen: 91 },
  { label: "Vận hành", tuyenMoi: 12, nghiViec: 6, ungTuyen: 63 },
];

/** Stacked bar: the outcome of the applications received, per month. */
export const REPORT_FUNNEL = [
  { label: "T4", dauVao: 40, phongVan: 24, nhanViec: 14 },
  { label: "T5", dauVao: 52, phongVan: 33, nhanViec: 21 },
  { label: "T6", dauVao: 47, phongVan: 29, nhanViec: 18 },
  { label: "T7", dauVao: 61, phongVan: 38, nhanViec: 24 },
  { label: "T8", dauVao: 49, phongVan: 31, nhanViec: 19 },
];

/** Ranked horizontal bar: hires by source, sorted descending. */
export const REPORT_BY_SOURCE = [
  { label: "Giới thiệu", value: 64 },
  { label: "LinkedIn", value: 48 },
  { label: "Website", value: 37 },
  { label: "Google", value: 29 },
  { label: "Tự ứng tuyển", value: 18 },
];

export const REPORT_SUMMARY = [
  { department: "Kỹ thuật", headcount: 74, hired: 31, left: 7, cost: 1_480_000_000 },
  { department: "Kinh doanh", headcount: 52, hired: 22, left: 11, cost: 910_000_000 },
  { department: "Kế toán", headcount: 18, hired: 6, left: 2, cost: 330_000_000 },
  { department: "Nhân sự", headcount: 14, hired: 5, left: 1, cost: 245_000_000 },
  { department: "Chăm sóc khách hàng", headcount: 46, hired: 17, left: 9, cost: 620_000_000 },
  { department: "Vận hành", headcount: 36, hired: 12, left: 6, cost: 470_000_000 },
];

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** Per-bar colour by status, from the chart tokens. */
export const CONTENT_BY_STATUS = [
  { status: "Bản nháp", count: 38 },
  { status: "Chờ duyệt", count: 12 },
  { status: "Đã duyệt", count: 74 },
  { status: "Đã xuất bản", count: 156 },
  { status: "Thất bại", count: 4 },
];

export const CHANNEL_BREAKDOWN = [
  { label: "Giới thiệu", count: 64 },
  { label: "LinkedIn", count: 48 },
  { label: "Website", count: 37 },
  { label: "Google", count: 29 },
];

export const APPLICATIONS_TREND = [
  { label: "1", value: 12 },
  { label: "2", value: 18 },
  { label: "3", value: 15 },
  { label: "4", value: 24 },
  { label: "5", value: 22 },
  { label: "6", value: 31 },
  { label: "7", value: 28 },
  { label: "8", value: 36 },
];

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const CURRENT_USER = {
  name: "Nguyễn Thu Hà",
  email: "ha.nguyen@congty.vn",
  initials: "TH",
  plan: "Cao Cấp",
  phone: "0903 456 789",
  title: "Trưởng phòng nhân sự",
  roles: ["hr", "manager"] as RoleId[],
};

export type LoginSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  /** `ok` is a sign-in that worked; `failed` one that did not. */
  result: "ok" | "failed";
};

export const SESSIONS: LoginSession[] = [
  { id: "s1", device: "Chrome trên macOS", location: "TP. Hồ Chí Minh", lastActive: "Đang hoạt động", current: true, result: "ok" },
  { id: "s2", device: "Safari trên iPhone", location: "TP. Hồ Chí Minh", lastActive: "2 giờ trước", current: false, result: "ok" },
  { id: "s3", device: "Chrome trên Windows", location: "Hà Nội", lastActive: "Hôm qua", current: false, result: "ok" },
  { id: "s4", device: "Firefox trên Linux", location: "Singapore", lastActive: "3 ngày trước", current: false, result: "failed" },
  { id: "s5", device: "Edge trên Windows", location: "Hà Nội", lastActive: "1 tuần trước", current: false, result: "ok" },
];

export const NOTIFICATION_PREFERENCES = [
  { id: "leave", label: "Đơn nghỉ phép chờ duyệt", description: "Gửi khi có đơn mới cần bạn duyệt." },
  { id: "sync", label: "Đồng bộ thất bại", description: "Gửi khi một tích hợp báo lỗi." },
  { id: "digest", label: "Bản tin tuần", description: "Tóm tắt nhân sự gửi sáng thứ hai." },
  { id: "product", label: "Tin cập nhật sản phẩm", description: "Tính năng mới và thay đổi quan trọng." },
];
