"use client";

import * as React from "react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

const provinces: ComboboxOption[] = [
  { value: "hanoi", label: "Hà Nội" },
  { value: "hcm", label: "TP. Hồ Chí Minh" },
  { value: "danang", label: "Đà Nẵng" },
  { value: "haiphong", label: "Hải Phòng" },
  { value: "cantho", label: "Cần Thơ", disabled: true },
];

export default function ComboboxDemo() {
  const [province, setProvince] = React.useState<string | null>("hanoi");

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <Combobox
        options={provinces}
        value={province}
        onValueChange={setProvince}
        placeholder="Chọn tỉnh/thành phố"
        searchPlaceholder="Tìm tỉnh/thành phố..."
        emptyText="Không tìm thấy tỉnh/thành phố"
        clearable
        className="w-64"
      />
      <p className="text-sm text-muted-foreground">
        Đã chọn: {province ? provinces.find((p) => p.value === province)?.label : "chưa chọn"}
      </p>
    </div>
  );
}
