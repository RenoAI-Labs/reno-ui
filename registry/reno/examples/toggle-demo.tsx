"use client";

import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

export default function ToggleDemo() {
  return (
    <div className="flex items-center gap-[var(--density-gap)]">
      <Toggle aria-label="In đậm">
        <BoldIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="In nghiêng" defaultPressed>
        <ItalicIcon />
      </Toggle>
      <Toggle size="sm" aria-label="Gạch chân" disabled>
        <UnderlineIcon />
      </Toggle>
      <Toggle variant="outline">Nổi bật</Toggle>
    </div>
  );
}
