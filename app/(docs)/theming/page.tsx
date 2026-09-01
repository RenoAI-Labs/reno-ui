import type { Metadata } from "next";

import { CodeBlock } from "@/app/code-block";
import { THEME_ITEMS, installCommand } from "@/app/lib/registry-catalog";
import { TokenGallery } from "@/app/(docs)/theming/token-gallery";

export const metadata: Metadata = {
  title: "Theme",
  description:
    "Bốn theme preset cho elearning, admin, ERP và CMS. Đổi preset là đổi toàn bộ UI, không sửa dòng nào trong component.",
};

export default function ThemingPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="max-w-2xl text-muted-foreground">
          Đổi preset bằng nút ở góc trên bên phải. Mọi thứ trên trang này đổi
          theo — màu, bo góc và cả density — mà không có dòng code component nào
          thay đổi. Đó là toàn bộ điểm của tầng token.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Cài preset</h2>
        <p className="text-sm text-muted-foreground">
          Preset tự kéo theo <code className="font-mono">theme-base</code> và
          merge biến CSS thẳng vào <code className="font-mono">globals.css</code>{" "}
          của dự án.
        </p>
        <CodeBlock
          code={THEME_ITEMS.filter((t) => t.name !== "theme-base")
            .map((t) => installCommand(t.name))
            .join("\n")}
        />
      </section>

      <TokenGallery />
    </div>
  );
}
