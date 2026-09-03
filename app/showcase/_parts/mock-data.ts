/**
 * Fake data for the showcase dashboard.
 *
 * Every value is derived from an index, never from `Math.random` or `Date.now`.
 * The page is server-rendered and then hydrated, so a value that differs between
 * the two renders is a hydration mismatch — and the resulting console error
 * would sit on the one page whose whole purpose is to look trustworthy.
 */

export type Person = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "active" | "leave" | "probation" | "left";
  salary: number;
  joinedAt: string;
  /** Where the hire came from. Faceted in the toolbar's filter menu. */
  source: HireSource;
  /** Last performance review, 0-100. Rendered as a bar plus the number. */
  score: number;
  /** When the next review falls due, as a phrase rather than a date. */
  nextReview: string;
};

export const HIRE_SOURCES = ["linkedin", "google", "referral", "website", "coldcall"] as const;
export type HireSource = (typeof HIRE_SOURCES)[number];

export const SOURCE_LABELS: Record<HireSource, string> = {
  linkedin: "LinkedIn",
  google: "Google",
  referral: "Giới thiệu",
  website: "Website",
  coldcall: "Tự ứng tuyển",
};

export const DEPARTMENTS = [
  "Kỹ thuật",
  "Kinh doanh",
  "Kế toán",
  "Nhân sự",
  "Chăm sóc khách hàng",
  "Vận hành",
] as const;

const FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const MIDDLE = ["Văn", "Thị", "Hữu", "Đức", "Minh", "Quang", "Thu", "Ngọc"];
const GIVEN = [
  "An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Hải", "Hạnh", "Khánh", "Lâm",
  "Linh", "Mai", "Nam", "Ngân", "Phong", "Quân", "Sơn", "Thảo", "Trang", "Tuấn",
];

const ROLES = [
  "Chuyên viên",
  "Trưởng nhóm",
  "Quản lý",
  "Thực tập sinh",
  "Chuyên viên cao cấp",
];

const STATUSES: Person["status"][] = ["active", "active", "active", "leave", "probation", "left"];

/**
 * Relative phrases rather than dates.
 *
 * "In 3 days" is what a reviewer actually needs from this column, and a real
 * date here would have to be computed from `Date.now()` — which differs between
 * the server render and the hydration that follows, and puts a mismatch error
 * on the one page whose job is to look trustworthy.
 */
const REVIEW_WINDOWS = [
  "Trong 2 ngày",
  "Trong 3 ngày",
  "Trong 1 tuần",
  "Trong 2 tuần",
  "Trong 1 tháng",
  "Quá hạn 4 ngày",
];

export const STATUS_LABELS: Record<Person["status"], string> = {
  active: "Đang làm",
  leave: "Nghỉ phép",
  probation: "Thử việc",
  left: "Đã nghỉ",
};

export const STATUS_VARIANTS: Record<Person["status"], "success" | "info" | "warning" | "secondary"> =
  {
    active: "success",
    leave: "info",
    probation: "warning",
    left: "secondary",
  };

/**
 * Each field advances on its own stride *plus* a slower carry term. Strides
 * alone repeat with period lcm(10, 8, 20) = 40, which over 240 rows means every
 * name appears six times — obvious the moment the list is sorted. The carry
 * breaks that cycle while keeping the data fully deterministic.
 */
export const PEOPLE: Person[] = Array.from({ length: 240 }, (_, i) => {
  const family = FAMILY[i % FAMILY.length];
  const middle = MIDDLE[(i * 3 + Math.floor(i / 10)) % MIDDLE.length];
  const given = GIVEN[(i * 7 + Math.floor(i / 8)) % GIVEN.length];
  const department = DEPARTMENTS[(i * 5) % DEPARTMENTS.length];

  return {
    id: `nv_${String(i + 1).padStart(4, "0")}`,
    name: `${family} ${middle} ${given}`,
    email: `nv${String(i + 1).padStart(4, "0")}@congty.vn`,
    department,
    role: ROLES[(i * 11) % ROLES.length],
    status: STATUSES[(i * 13) % STATUSES.length],
    salary: 9_000_000 + ((i * 1_370_000) % 41_000_000),
    joinedAt: new Date(Date.UTC(2021, (i * 5) % 12, ((i * 17) % 27) + 1))
      .toISOString()
      .slice(0, 10),
    // Same stride-plus-carry trick as the fields above: a bare stride would
    // make the facet counts land on suspiciously round numbers.
    source: HIRE_SOURCES[(i * 3 + Math.floor(i / 7)) % HIRE_SOURCES.length],
    score: 22 + ((i * 37 + Math.floor(i / 5) * 11) % 77),
    nextReview: REVIEW_WINDOWS[(i * 19 + Math.floor(i / 11)) % REVIEW_WINDOWS.length],
  };
});

export type MonthlyPoint = {
  month: string;
  tuyenMoi: number;
  nghiViec: number;
  ungTuyen: number;
};

export const HEADCOUNT_BY_MONTH: MonthlyPoint[] = [
  { month: "T1", tuyenMoi: 12, nghiViec: 4, ungTuyen: 68 },
  { month: "T2", tuyenMoi: 9, nghiViec: 6, ungTuyen: 54 },
  { month: "T3", tuyenMoi: 17, nghiViec: 3, ungTuyen: 92 },
  { month: "T4", tuyenMoi: 14, nghiViec: 8, ungTuyen: 77 },
  { month: "T5", tuyenMoi: 21, nghiViec: 5, ungTuyen: 105 },
  { month: "T6", tuyenMoi: 18, nghiViec: 7, ungTuyen: 88 },
  { month: "T7", tuyenMoi: 24, nghiViec: 4, ungTuyen: 121 },
  { month: "T8", tuyenMoi: 19, nghiViec: 9, ungTuyen: 96 },
];

export type RecentDocument = {
  id: string;
  title: string;
  owner: string;
  kind: "Hợp đồng" | "Bảng lương" | "Quy trình" | "Đánh giá";
  updatedAt: string;
  size: string;
};

export const RECENT_DOCUMENTS: RecentDocument[] = [
  { id: "d1", title: "Hợp đồng lao động — Quý III", owner: "Nguyễn Thu Hà", kind: "Hợp đồng", updatedAt: "2 giờ trước", size: "1,2 MB" },
  { id: "d2", title: "Bảng lương tháng 8", owner: "Trần Minh Quân", kind: "Bảng lương", updatedAt: "Hôm qua", size: "486 KB" },
  { id: "d3", title: "Quy trình onboarding 2026", owner: "Lê Ngọc Trang", kind: "Quy trình", updatedAt: "3 ngày trước", size: "2,8 MB" },
  { id: "d4", title: "Đánh giá hiệu suất Q2", owner: "Phạm Đức Nam", kind: "Đánh giá", updatedAt: "1 tuần trước", size: "940 KB" },
  { id: "d5", title: "Phụ lục hợp đồng — Kỹ thuật", owner: "Hoàng Văn Sơn", kind: "Hợp đồng", updatedAt: "2 tuần trước", size: "312 KB" },
];

export const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat("vi-VN");
