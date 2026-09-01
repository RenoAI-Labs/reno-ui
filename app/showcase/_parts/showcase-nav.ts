import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation model for the showcase shell. Data, not JSX, so the sidebar and the
 * ⌘K palette render the same list and cannot fall out of step.
 */

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { key: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
      { key: "reports", label: "Báo cáo", icon: BarChart3, badge: "Mới" },
    ],
  },
  {
    label: "Nhân sự",
    items: [
      { key: "people", label: "Nhân viên", icon: Users, badge: "240" },
      { key: "departments", label: "Phòng ban", icon: Building2 },
      { key: "leave", label: "Nghỉ phép", icon: CalendarDays, badge: "6" },
      { key: "payroll", label: "Bảng lương", icon: Wallet },
    ],
  },
  {
    label: "Tài liệu",
    items: [
      { key: "documents", label: "Kho tài liệu", icon: FileText },
      { key: "settings", label: "Cấu hình", icon: Settings },
    ],
  },
];

export const FAVOURITES: NavItem[] = [
  { key: "fav-payroll", label: "Bảng lương tháng 8", icon: Wallet },
  { key: "fav-onboarding", label: "Onboarding 2026", icon: FileText },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
