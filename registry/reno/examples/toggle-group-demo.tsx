"use client";

import {
  BoldIcon,
  ItalicIcon,
  TextAlignCenterIcon,
  TextAlignEndIcon,
  TextAlignStartIcon,
  UnderlineIcon,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function ToggleGroupDemo() {
  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      {/* spacing=0: segmented control — one continuous surface, single choice. */}
      <ToggleGroup type="single" variant="outline" defaultValue="left">
        <ToggleGroupItem value="left" aria-label="Căn trái">
          <TextAlignStartIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Căn giữa">
          <TextAlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Căn phải">
          <TextAlignEndIcon />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Same component, spaced: independent buttons, multiple choice. */}
      <ToggleGroup type="multiple" variant="outline" spacing={2} defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="In đậm">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="In nghiêng">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Gạch chân">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Text segments — the "tab bar that is not a tab bar" every project rewrites. */}
      <ToggleGroup type="single" defaultValue="month">
        <ToggleGroupItem value="day">Ngày</ToggleGroupItem>
        <ToggleGroupItem value="week">Tuần</ToggleGroupItem>
        <ToggleGroupItem value="month">Tháng</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
