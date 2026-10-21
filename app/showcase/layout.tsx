import type { Metadata } from "next";

import { ShowcaseShell } from "./_parts/showcase-shell";

export const metadata: Metadata = {
  title: {
    default: "Showcase",
    template: "%s · Showcase",
  },
  description:
    "Cổng quản trị hoàn chỉnh dựng bằng primitive của reno-ui: bảng điều khiển, báo cáo, danh sách, cấu hình và hồ sơ cá nhân. Đây là layout chuẩn của mọi cổng admin; đổi màu thương hiệu ngay trên trang mà không sửa dòng component nào.",
};

/**
 * The showcase deliberately sits outside the `(docs)` route group: it needs the
 * whole viewport, and a nested layout cannot escape the reading-width column the
 * documentation pages render inside.
 *
 * The shell mounts here once, so every page below it is just content. The layout
 * it draws is the contract in `docs/admin-layout-standard.md`.
 */
export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return <ShowcaseShell>{children}</ShowcaseShell>;
}
