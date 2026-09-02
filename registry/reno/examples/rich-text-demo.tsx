"use client";

import * as React from "react";

import { RichText } from "@/components/ui/rich-text";

const INITIAL = `<h2>Khoá học React nâng cao</h2>
<p>Khai giảng <strong>12/09</strong>. Còn <em>8 chỗ</em>, xem <a href="/dang-ky">trang đăng ký</a>.</p>
<ul><li>Server Components</li><li>Suspense và streaming</li></ul>
<blockquote>Học xong là làm được, không phải học xong là biết.</blockquote>
`;

export default function RichTextDemo() {
  const [value, setValue] = React.useState(INITIAL);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <RichText
        value={value}
        onChange={setValue}
        // Every group, including the two that are off by default, so switching
        // preset re-themes all of them and `check:render` sees them all draw.
        groups={["format", "heading", "list", "align", "link", "history", "media"]}
        /*
          A stand-in for a real upload, so the "Tải lên" tab exists here at all.
          It keeps the file in the browser and returns a blob URL — which is
          exactly what a project must not ship, because the URL dies with the
          tab. A real handler puts the file somewhere durable and returns that
          address.
        */
        onImageUpload={async (file) => URL.createObjectURL(file)}
      />
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">HTML</summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {value}
        </pre>
      </details>
    </div>
  );
}
