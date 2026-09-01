"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DropdownMenuDemo() {
  const [showStatus, setShowStatus] = useState(true);
  const [sort, setSort] = useState("newest");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Tuỳ chọn</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Hiển thị</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
          Trạng thái đơn hàng
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="newest">Mới nhất</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Cũ nhất</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
