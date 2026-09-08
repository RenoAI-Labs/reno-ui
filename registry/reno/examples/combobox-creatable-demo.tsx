"use client";

import * as React from "react";

import { ComboboxCreatable } from "@/components/ui/combobox-creatable";
import type { ComboboxOption } from "@/components/ui/combobox";

const initialTags: ComboboxOption[] = [
  { value: "khuyen-mai", label: "Khuyến mãi" },
  { value: "san-pham-moi", label: "Sản phẩm mới" },
  { value: "huong-dan", label: "Hướng dẫn" },
];

/** Stands in for the server round-trip a real create makes. */
function slugify(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ComboboxCreatableDemo() {
  const [tags, setTags] = React.useState(initialTags);
  const [tag, setTag] = React.useState<string | null>("huong-dan");

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <ComboboxCreatable
        options={tags}
        value={tag}
        onValueChange={setTag}
        onCreate={async (query) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          const created = { value: slugify(query), label: query };
          setTags((prev) => [...prev, created]);
          return created.value;
        }}
        clearable
        labels={{ placeholder: "Chọn chủ đề", searchPlaceholder: "Tìm hoặc nhập chủ đề mới..." }}
        className="w-64"
      />
      <p className="text-sm text-muted-foreground">
        Đã chọn: {tag ? tags.find((t) => t.value === tag)?.label : "chưa chọn"}
      </p>
    </div>
  );
}
