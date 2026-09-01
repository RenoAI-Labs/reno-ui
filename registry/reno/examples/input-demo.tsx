"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InputDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-[var(--density-gap)]">
      <div className="grid gap-2">
        <Label htmlFor="input-demo-name">Họ và tên</Label>
        <Input id="input-demo-name" placeholder="Nguyễn Văn A" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="input-demo-email">Email</Label>
        <Input
          id="input-demo-email"
          type="email"
          aria-invalid
          defaultValue="khong-hop-le"
        />
        <p className="text-destructive text-sm">Email không hợp lệ.</p>
      </div>
      <Input disabled placeholder="Trường đã vô hiệu hoá" />
    </div>
  );
}
