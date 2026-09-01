/**
 * Every user-visible string the DataGrid can render.
 *
 * reno-ui deliberately does not depend on next-intl, i18next or any other i18n
 * library. A component library that pulls in an i18n runtime forces that choice
 * onto every consuming project and leaves a dependency behind at handover —
 * which breaks the promise that a delivered project owes us nothing.
 *
 * Instead, strings are data. Defaults are Vietnamese because that is what our
 * projects ship; a project needing another language passes its own object, and
 * a project already using an i18n library just feeds its translations in here.
 *
 * Consequence for contributors: a string literal inside the grid's JSX is a bug.
 */

export type DataGridLabels = {
  /** Shown when the query succeeded but matched nothing. */
  empty: string;
  /** Shown while the first page is loading. */
  loading: string;
  /** Shown when the query failed. */
  error: string;
  /** Retry affordance on the error state. */
  retry: string;

  /** e.g. (3) => "Đã chọn 3 dòng" */
  rowsSelected: (count: number) => string;
  /** e.g. (1, 10) => "Trang 1 / 10" */
  pageOf: (page: number, totalPages: number) => string;
  /** e.g. (1, 25, 214) => "1–25 trên 214" */
  rangeOf: (from: number, to: number, total: number) => string;

  rowsPerPage: string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;

  columns: string;
  toggleColumn: string;
  search: string;
  reset: string;
  filter: string;
  clearFilter: string;
  export: string;

  selectAll: string;
  selectAllMatching: string;
  clearSelection: string;
  selectRow: string;

  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
};

export const defaultLabels: DataGridLabels = {
  empty: "Không có dữ liệu",
  loading: "Đang tải...",
  error: "Đã xảy ra lỗi",
  retry: "Thử lại",

  rowsSelected: (count) => `Đã chọn ${count} dòng`,
  pageOf: (page, totalPages) => `Trang ${page} / ${totalPages}`,
  rangeOf: (from, to, total) => `${from}–${to} trên ${total}`,

  rowsPerPage: "Số dòng mỗi trang",
  firstPage: "Trang đầu",
  previousPage: "Trang trước",
  nextPage: "Trang sau",
  lastPage: "Trang cuối",

  columns: "Cột",
  toggleColumn: "Ẩn/hiện cột",
  search: "Tìm kiếm",
  reset: "Đặt lại",
  filter: "Lọc",
  clearFilter: "Xoá bộ lọc",
  export: "Xuất dữ liệu",

  selectAll: "Chọn tất cả",
  selectAllMatching: "Chọn tất cả kết quả khớp bộ lọc",
  clearSelection: "Bỏ chọn",
  selectRow: "Chọn dòng",

  sortAscending: "Sắp xếp tăng dần",
  sortDescending: "Sắp xếp giảm dần",
  clearSort: "Bỏ sắp xếp",
  pinLeft: "Ghim trái",
  pinRight: "Ghim phải",
  unpin: "Bỏ ghim",
};

/**
 * English labels, provided because it is the override every project reaches for
 * first and re-typing 30 strings per project is waste.
 */
export const englishLabels: DataGridLabels = {
  empty: "No data",
  loading: "Loading...",
  error: "Something went wrong",
  retry: "Retry",

  rowsSelected: (count) => `${count} row${count === 1 ? "" : "s"} selected`,
  pageOf: (page, totalPages) => `Page ${page} of ${totalPages}`,
  rangeOf: (from, to, total) => `${from}–${to} of ${total}`,

  rowsPerPage: "Rows per page",
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",

  columns: "Columns",
  toggleColumn: "Toggle column",
  search: "Search",
  reset: "Reset",
  filter: "Filter",
  clearFilter: "Clear filter",
  export: "Export",

  selectAll: "Select all",
  selectAllMatching: "Select all matching the current filter",
  clearSelection: "Clear selection",
  selectRow: "Select row",

  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clearSort: "Clear sort",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  unpin: "Unpin",
};

/**
 * Merge partial overrides onto the defaults, so a project that only wants to
 * change one string does not have to restate the whole object.
 */
export function resolveLabels(
  overrides?: Partial<DataGridLabels>,
  base: DataGridLabels = defaultLabels,
): DataGridLabels {
  return overrides ? { ...base, ...overrides } : base;
}
