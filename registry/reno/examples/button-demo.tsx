"use client";

import { ArrowRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        <Button>Lưu thay đổi</Button>
        <Button variant="secondary">Phụ</Button>
        <Button variant="outline">Viền</Button>
        <Button variant="ghost">Trong suốt</Button>
        <Button variant="link">Liên kết</Button>
        <Button variant="destructive">
          <Trash2 />
          Xoá
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        <Button size="sm">Nhỏ</Button>
        <Button>Mặc định</Button>
        <Button size="lg">Lớn</Button>
        <Button size="icon" aria-label="Tiếp tục">
          <ArrowRight />
        </Button>
        <Button disabled>Vô hiệu hoá</Button>
      </div>
    </div>
  );
}
