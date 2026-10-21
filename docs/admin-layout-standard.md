# Admin layout standard

**Version: `admin-layout-standard v1`** · 2026-10-21

This is the fixed layout of every admin portal built on reno-ui. The live
reference is the showcase at https://ui.reno.ai.vn/showcase (source in
`app/showcase/`); this document is the contract that reference implements. A
project's portal screens, and the portal mockups drawn before the build, follow
it. Anything stated here as fixed is fixed in every project.

The rule that splits the two halves of a project:

> **Layout, component positions and functions are the standard. Brand and
> style are per project.**

Brand and style reach the layout only through tokens (`--reno-brand-*`,
`--radius`, `--density-*`, `--sidebar*`, `--chart-*`; see
[design-tokens.md](./design-tokens.md)). The **Thương hiệu** panel on the
showcase re-themes the whole shell live so a reviewer can see that colour moves
and no element does.

All copy is Vietnamese by default and travels through the `labels` props of the
components. The Vietnamese strings quoted below are the default copy of the
reference implementation.

## 1. Pages

A portal always has these five pages, each reachable from the sidebar, each
mounted inside the same shell. A menu item without a page is a defect: the
navigation model in `app/showcase/_parts/showcase-nav.ts` is the single data
source for the sidebar and the Ctrl K palette, and a test fails if any item has
no route.

| Route (showcase) | Page | Section of this document |
|---|---|---|
| `/showcase` | Bảng điều khiển (dashboard) | §5 |
| `/showcase/reports` | Báo cáo | §6 |
| `/showcase/employees` | Nhân viên (the standard grid) | §7 |
| `/showcase/settings` | Cấu hình | §8 |
| `/showcase/profile` | Hồ sơ cá nhân | §9 |

A project renames the domain page (Nhân viên becomes Học viên, Đơn hàng, ...)
and adds its own list pages built to §7; it does not rearrange the shell. The
showcase also carries `/showcase/all-components`, which is a documentation page
outside the portal shell and is not part of the standard.

## 2. Shell

```
┌────────────┬──────────────────────────────────────────────────────────┐
│ Logo  Name │ ☰  [Workspace ▾]  (Announcement pill)    [Search Ctrl K] ? 🔔 ☀ (AV) │  header, sticky
│            ├──────────────────────────────────────────────────────────┤
│ TỔNG QUAN ▾│ Breadcrumb (optional)                                     │
│  ▣ Bảng... │ Page title                        [Period ▾] [Primary]    │  page header
│  ▤ Báo cáo │ subtitle: period · timezone                               │
│ NHÂN SỰ ▾  │                                                           │
│  ...       │ content                                                   │
│ YÊU THÍCH ▾│                                                           │
│            │                                                           │
│ Điểm còn   │                                                           │
│ lại 2.155  │                                                           │
│ ▓▓▓▓░░░    │                                                           │
│ Tất cả...  │                                                           │
│ Về tài liệu│                                                           │
└────────────┴──────────────────────────────────────────────────────────┘
```

### 2.1 Sidebar (left, collapsible)

Collapses to an icon rail with the toggle at the left end of the header
(`@reno/sidebar`). On narrow screens it becomes a drawer.

Top to bottom, in this order:

1. **Product logo and name.** The workspace or tenant switcher is in the
   header, never here.
2. **Groups.** Each group has a small uppercase heading and a chevron that
   collapses it. An item has an icon, a label, and optionally a trailing count
   badge or a "Mới" tag. The active item uses the sidebar active token.
3. **Favourites** (optional group, collapsible).
4. **Quota or credit widget slot** (`@reno/quota-widget`): label, the current
   number, the total, a progress bar. Optional per project, shown in the
   showcase.
5. **Footer links:** "Tất cả component" (reference only) and "Về trang tài
   liệu" in the showcase; a project puts its own help or docs links here.

The sidebar holds **no user card**. The account lives in the header avatar menu
(§3).

Colours come from `--sidebar*` tokens only, so one project renders it dark navy,
another light, another in the brand colour, with the same markup.

### 2.2 Header (top, sticky)

Left to right, in this order. Positions 1, 2, 5 to 9 never move; 3 is an
optional slot; 4 is a spacer.

| # | Element | Notes |
|---|---|---|
| 1 | Sidebar toggle | `SidebarTrigger` |
| 2 | Workspace or tenant switcher | Avatar-initials chip, name, chevron. May be switched off per project (single-tenant products); the slot then collapses, nothing else moves |
| 3 | Announcement pill | Rounded info pill with an icon and a one-line message that truncates. Optional |
| 4 | Spacer | |
| 5 | Global search | Field with the `Ctrl K` hint; opens the command palette over the same navigation model as the sidebar |
| 6 | Help | Icon button |
| 7 | Notification bell | Red count badge; opens a popover list of notifications |
| 8 | Theme toggle | Sun or moon |
| 9 | Avatar button | Initials; opens the user menu (§3) |

On narrow screens the search field collapses to an icon, and the announcement
pill and workspace name drop out first. The order of what remains does not
change.

### 2.3 Page header (inside the content area)

`@reno/page-header`, above every page's content:

- Optional breadcrumb above the title, for pages deeper than the first level.
- **Title.**
- Muted **subtitle** line (for example the period and the timezone).
- At the right: the **page filter control** (period selector) and the **primary
  action** button, in that order.

## 3. Avatar (user) menu

`@reno/user-menu`. A popover under the avatar. Content and order are fixed:

1. **Identity block:** avatar, full name, email, plan badge (for example "Cao
   Cấp").
2. **Usage card:** a progress bar labelled "Điểm còn lại kỳ này" with the
   figure `2.155 / 4.300`, the renewal line ("Gia hạn 12/10/2026") and a
   link-style action ("Nạp thêm điểm").
3. Divider, then the account items with icons: **Hồ sơ cá nhân**, **Cài đặt tài
   khoản**, **Gói và thanh toán**, **Lịch sử đăng nhập**.
4. Divider, then **Ngôn ngữ** (current language, chevron opens the list),
   **Giao diện** (inline segmented control Sáng, Tối, Auto) and **Trợ giúp và hỗ
   trợ**.
5. Divider, then **Đăng xuất** in the destructive colour.

A product with no plans or credits drops the plan badge and the usage card
(items 1 and 3 to 5 remain); it does not reorder what is left.

## 4. Page conventions that apply everywhere

- Every page shows loading, empty and error states, not only the happy path.
  The showcase demonstrates each state in at least one place per page.
- Destructive actions are in the destructive colour and ask for confirmation.
- Colours are tokens, heights are density tokens. No raw colour, no pixel
  height (lint enforces it in `app/showcase/**`).

## 5. Dashboard (information first, charts dominate)

Top to bottom:

1. **Page header:** "Bảng điều khiển", subtitle with period and timezone,
   period selector, primary action.
2. **"Cần bạn xử lý"** (`@reno/attention-card`): three attention cards. Each
   has a status pill ("Chờ duyệt", "Thất bại", "Cần kết nối lại"), a
   right-aligned meta (a count or an age), a large number, one explanatory line
   and one action button. Severity tints the border and background: amber for
   pending, red for failed, red or amber for needs attention.
3. **"Tiến trình kỳ này":** four KPI cards (`@reno/stat-card`): label, big
   number, a delta or sub-line ("+12 so với kỳ trước", "trên hạn mức 4.300").
   One may show progress to a limit.
4. **Charts row** (`@reno/chart`):
   - wide bar chart ("Nội dung theo trạng thái · 30 ngày") with a link-button
     "Mở Báo cáo" in its header, one colour per status, values under the axis;
   - a card with a big number, a delta pill ("+18% kỳ trước"), a sparkline or
     area chart and a per-channel breakdown with horizontal progress bars and
     counts.
5. Optionally one compact list (recent items). Grids do not live on the
   dashboard; they have their own page (§7).

## 6. Reports page

- Page header with the period and group-by controls and an **Xuất** menu.
- KPI strip.
- Two or three charts: a time series with the **Cột, Vùng, Đường** switcher; a
  donut or stacked bar; a ranked horizontal bar.
- A summary table with totals and an export button.
- Everything filters by the same period control as the dashboard.

## 7. The standard grid (list pages)

Every list page is built to this. It is a `@reno/data-grid` with the pieces
below.

**Toolbar**, left to right: search, **Lọc**, **Sắp xếp**; spacer; **Cột**
(column visibility), **Xuất dữ liệu**, and the history or saved-view icon.
Optional status tabs with counts above the toolbar (Tất cả, then one tab per
group, each with its count) and a density toggle ("Mật độ").

**Select column.** A checkbox column with a header checkbox (select page).

> **Rule (mandatory): every list whose rows support any bulk-able action has
> the select column and the bulk action bar.**

**Bulk action bar** (`@reno/bulk-action-bar`), directly above the table, shown
only while rows are selected: "Đã chọn N" at the left, the bulk buttons (for
example Vô hiệu hóa, Gửi email, Xuất, Xóa), "Bỏ chọn" at the right. When the
whole page is selected it adds a banner: "Đã chọn N người trên trang này. Chọn
tất cả M người khớp bộ lọc".

**Columns.** Sortable headers with sort icons; typed cells (name with avatar
initials, email, text, status badge, score with a mini progress bar, source
chip, right-aligned money, date); sticky header; row hover; zebra optional.

**Hành động column** (`@reno/row-actions`), sticky to the right edge. The 3 to
4 most frequently used actions are visible icon buttons with tooltips (for
example Xem, Sửa, Gửi email, Duyệt). If the row has more actions, the last
control is a "⋯" menu holding the less used ones (for example Nhân bản, Lưu
trữ, Xóa).

> **Rule (mandatory): the most used actions are never hidden in the "⋯" menu. A
> user never needs two clicks for the common action.** At most four actions are
> inline; the "⋯" menu exists only when there are more than four. Destructive
> actions in the menu are in the destructive colour and ask for confirmation.

**Pagination footer.** Range text ("1–10 trên 240"), page-size select, "Trang x
/ y", first, previous, numbered pages with ellipsis, next, last.

**States.** Empty, loading (skeleton) and error, with a retry.

## 8. Settings page (Cấu hình)

Left sub-navigation (tabs on narrow screens): **Chung, Thương hiệu, Thông báo,
Bảo mật, Tích hợp, Gói và thanh toán, Vai trò và phân quyền.**

- Forms use the form items. A **sticky save bar** (`@reno/save-bar`) shows the
  dirty state: "Hoàn tác" and "Lưu tất cả thay đổi (n)", where n counts
  changed fields.
- **Thương hiệu** is the brand panel: brand colour, secondary, radius and
  spacing, with contrast measured as you go.
- **Vai trò và phân quyền** is the permission matrix (§8.1).

### 8.1 Roles and permissions matrix

`@reno/permission-matrix`. Roles are columns, permissions are rows.

- Rows are grouped by resource, with a group header row. Each resource has the
  four levels **Xem, Tạo và sửa, Xóa, Toàn quyền**; "Toàn quyền" implies the
  other three.
- A row that carries a scope shows a small **"Phạm vi khác"** badge.
- Columns are roles, each with an edit icon in the header. Cells are
  checkboxes.
- Header buttons: **Tạo vai trò**, **Hoàn tác**, **Lưu tất cả thay đổi (n)**.
- Header row and first column are sticky.
- A cell has a visible focus ring and is reachable by keyboard; column and row
  headers are announced by screen readers.
- An account holds one or more roles; its effective permission is the union of
  its roles (see §9 for how this shows on the profile).

## 9. Profile page (Hồ sơ cá nhân)

Avatar with upload and crop (`@reno/image-cropper`, `@reno/file-upload`),
personal information form, change password, two-factor settings, active sessions
and login history table, language and theme preference, notification
preference toggles, and the account's roles as **multiple role chips** with a
"Gán vai trò" control.

## 10. What a project may vary, and what it may not

**Per project (through tokens or props):**

- Brand colour and secondary colour, corner radius, spacing step.
- Sidebar tone (dark, light, branded) through `--sidebar*`.
- Logo and product name.
- Workspace switcher on or off; announcement pill on or off; quota widget on or
  off; favourites group on or off.
- Group names, item names and icons of the sidebar, as long as every item has a
  page.
- The domain of the list pages (columns, row actions, bulk actions) and the
  dashboard figures.
- Chart series and their colours (from `--chart-*`).
- Extra settings tabs, extra account menu items after "Lịch sử đăng nhập".

**Never varies (positions and functions):**

- The shell: sidebar left and collapsible, header sticky, page header inside
  the content.
- The header order (§2.2) and the avatar menu content and order (§3).
- The page header's contents and order (§2.3).
- No user card in the sidebar.
- The dashboard order: attention cards, KPI cards, charts (§5).
- The grid toolbar order, the select column plus bulk action bar rule, the
  Hành động column rule with at most four inline actions, the pagination footer
  (§7).
- The settings sub-navigation and the sticky save bar; the matrix structure
  (§8).
- Loading, empty and error states on every data view.

A project that needs a variation outside the "may vary" list changes this
document first, as a new version, in reno-ui.

## 11. Registry items

| Standard element | Item |
|---|---|
| Sidebar | `@reno/sidebar` |
| Page header | `@reno/page-header` |
| Avatar menu | `@reno/user-menu` |
| Quota or credit widget | `@reno/quota-widget` |
| Attention cards | `@reno/attention-card` |
| KPI cards | `@reno/stat-card` |
| Charts | `@reno/chart` |
| Grid, toolbar | `@reno/data-grid`, `@reno/data-grid-toolbar` |
| Bulk action bar | `@reno/bulk-action-bar` |
| Hành động column | `@reno/row-actions` |
| Sticky save bar | `@reno/save-bar` |
| Permission matrix | `@reno/permission-matrix` |

The showcase consumes these items exactly as a project would; there are no
private copies of them under `app/showcase/`.

## Changelog

- **v1 (2026-10-21):** first version. Five pages, shell, header order, avatar
  menu, dashboard, reports, grid (select column, bulk action bar, Hành động
  column, pagination), settings with the permission matrix, profile with
  multi-role chips.
