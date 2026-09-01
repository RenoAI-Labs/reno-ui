"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export default function SonnerDemo() {
  return (
    <div>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Đã lưu thay đổi", {
            description: "Dữ liệu của bạn được cập nhật lúc " + new Date().toLocaleTimeString("vi-VN"),
          })
        }
      >
        Hiện thông báo
      </Button>
      <Toaster />
    </div>
  );
}
