import type { Metadata } from "next";

import { ShowcaseShell } from "./_parts/showcase-shell";

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Một màn hình quản trị nhân sự dựng hoàn toàn bằng primitive của reno-ui. Đổi preset, đổi light/dark, đổi cả màu thương hiệu ngay trên trang mà không sửa dòng component nào.",
};

/**
 * The showcase deliberately sits outside the `(docs)` route group: it needs the
 * whole viewport, and a nested layout cannot escape the reading-width column the
 * documentation pages render inside.
 */
export default function ShowcasePage() {
  return <ShowcaseShell />;
}
