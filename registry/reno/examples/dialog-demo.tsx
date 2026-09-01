"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Sửa hồ sơ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Thay đổi thông tin hồ sơ tại đây. Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[var(--density-gap)] py-2 text-sm">
          <p>Tên hiển thị, email và vai trò được quản trị viên phê duyệt.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Huỷ</Button>
          </DialogClose>
          <Button>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
