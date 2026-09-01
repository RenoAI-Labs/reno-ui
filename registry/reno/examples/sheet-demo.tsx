"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Mở bảng bên</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bộ lọc đơn hàng</SheetTitle>
          <SheetDescription>
            Chọn tiêu chí lọc rồi áp dụng cho danh sách đơn hàng.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-[var(--density-gap)] px-4 text-sm">
          <p>Trạng thái, chi nhánh và khoảng thời gian sẽ hiển thị ở đây.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Đóng</Button>
          </SheetClose>
          <Button>Áp dụng</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
