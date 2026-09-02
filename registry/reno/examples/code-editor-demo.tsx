"use client";

import * as React from "react";

import { CodeEditor } from "@/components/ui/code-editor";

const INITIAL = `<section class="hero">
  <!-- Bảng giá khoá học -->
  <h1 data-role="title">Khoá học React nâng cao</h1>
  <p>Khai giảng <strong>12/09</strong> &mdash; còn 8 chỗ.</p>
  <a href="/dang-ky" class="btn">Đăng ký</a>
</section>
`;

export default function CodeEditorDemo() {
  const [value, setValue] = React.useState(INITIAL);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <CodeEditor
        value={value}
        onChange={setValue}
        height="14rem"
        label="Nội dung HTML"
        placeholder="Dán HTML vào đây…"
      />
      {/* The sample covers a tag, an attribute, a string, an entity and a
          comment, so switching preset visibly recolours more than one thing. */}
      <p className="text-sm text-muted-foreground">{value.length} ký tự</p>
    </div>
  );
}
