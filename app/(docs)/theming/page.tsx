import type { Metadata } from "next";

import { CodeBlock } from "@/app/code-block";
import { installCommand } from "@/app/lib/registry-catalog";
import { TokenGallery } from "@/app/(docs)/theming/token-gallery";

export const metadata: Metadata = {
  title: "Theme",
  description:
    "Một theme, đọc bằng CSS variable. Đổi màu thương hiệu, bo góc và mật độ là đổi toàn bộ UI, không sửa dòng nào trong component.",
};

export default function ThemingPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="max-w-2xl text-muted-foreground">
          reno-ui ship <strong>một</strong> theme. Component không bao giờ ghi
          một mã màu hay một chiều cao cố định — chúng đọc CSS variable, nên đổi
          màu thương hiệu, bo góc hay mật độ là đổi toàn bộ UI mà không có dòng
          code component nào thay đổi. Đó là toàn bộ điểm của tầng token.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Cài theme</h2>
        <p className="text-sm text-muted-foreground">
          Theme merge biến CSS thẳng vào{" "}
          <code className="font-mono">globals.css</code> của dự án. Mọi item
          khác tự kéo theo nó, nên thường không phải cài tay.
        </p>
        <CodeBlock code={installCommand("theme-base")} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Brand nó thành của bạn</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Ghi đè <code className="font-mono">--reno-brand-*</code>,{" "}
          <code className="font-mono">--radius</code> và thang{" "}
          <code className="font-mono">--density-*</code> trong{" "}
          <code className="font-mono">globals.css</code> của dự án. Panel{" "}
          <strong>Thương hiệu</strong> trên{" "}
          <a className="text-primary underline underline-offset-4" href="/showcase">
            /showcase
          </a>{" "}
          làm việc đó ngay trên trình duyệt, đo tương phản WCAG tại chỗ, và cho
          copy đúng khối CSS để dán vào.
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {/*
            Said here because it is the question the four domain presets used to
            answer, and someone who saw them will look for them.
          */}
          Trước đây chỗ này có bốn preset đặt tên theo domain — elearning, admin,
          ERP, CMS. Chúng đã bỏ: đặt tên theme theo domain của chính mình là mời
          người đọc chọn một trong số của mình, còn một dự án thì đến với một màu
          thương hiệu và một ý muốn về khoảng cách. Những gì bốn preset đó mã hoá
          — một hue, một bo góc, một bậc mật độ — giờ là setting trong panel.
        </p>
      </section>

      <TokenGallery />
    </div>
  );
}
