import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation model for the showcase shell. Data, not JSX: the sidebar and the
 * Ctrl K palette render the same list and cannot fall out of step, and
 * `tests/showcase-nav.test.ts` walks it to prove that every entry has a page.
 *
 * The rule from docs/admin-layout-standard.md §1: no item may exist without a
 * page. Adding an entry here without creating `app/showcase/<route>/page.tsx`
 * fails that test, which is what keeps the menu from drifting back into the
 * decorative sidebar this file used to describe.
 */

export type NavItem = {
  key: string;
  label: string;
  /** Absolute path, optionally with a query string. */
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const SHOWCASE_ROOT = "/showcase";
export const PROFILE_HREF = `${SHOWCASE_ROOT}/profile`;
export const ALL_COMPONENTS_HREF = `${SHOWCASE_ROOT}/all-components`;
export const DOCS_HREF = "/";

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { key: "dashboard", label: "Bảng điều khiển", href: SHOWCASE_ROOT, icon: LayoutDashboard },
      { key: "reports", label: "Báo cáo", href: `${SHOWCASE_ROOT}/reports`, icon: BarChart3, badge: "Mới" },
    ],
  },
  {
    label: "Nhân sự",
    items: [
      { key: "employees", label: "Nhân viên", href: `${SHOWCASE_ROOT}/employees`, icon: Users, badge: "240" },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ key: "settings", label: "Cấu hình", href: `${SHOWCASE_ROOT}/settings`, icon: Settings }],
  },
];

/** Shortcuts. They point at pages that exist, like every other entry. */
export const FAVOURITES: NavItem[] = [
  { key: "fav-recruiting", label: "Báo cáo tuyển dụng", href: `${SHOWCASE_ROOT}/reports`, icon: FileText },
  { key: "fav-roles", label: "Vai trò và phân quyền", href: `${SHOWCASE_ROOT}/settings?tab=roles`, icon: ShieldCheck },
];

export const FOOTER_LINKS: NavItem[] = [
  { key: "all-components", label: "Tất cả component", href: ALL_COMPONENTS_HREF, icon: LayoutGrid },
];

/** Reachable from the avatar menu rather than the sidebar. */
export const ACCOUNT_PAGES: NavItem[] = [
  { key: "profile", label: "Hồ sơ cá nhân", href: PROFILE_HREF, icon: UserCog },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Every internal destination the shell can link to, for the orphan test. */
export const ALL_SHELL_HREFS: string[] = [
  ...ALL_NAV_ITEMS,
  ...FAVOURITES,
  ...FOOTER_LINKS,
  ...ACCOUNT_PAGES,
].map((item) => item.href);

/** The path without its query string. */
export function pathOf(href: string) {
  return href.split("?")[0]!;
}

/**
 * Whether a sidebar item is the current page. Exact for the root, because every
 * showcase path starts with it.
 */
export function isActive(pathname: string, href: string) {
  const path = pathOf(href);
  return path === SHOWCASE_ROOT ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}
