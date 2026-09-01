"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SelectDemo() {
  return (
    <Select defaultValue="hcm">
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Chọn thành phố" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Thành phố</SelectLabel>
          <SelectItem value="hn">Hà Nội</SelectItem>
          <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
          <SelectItem value="dn">Đà Nẵng</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
