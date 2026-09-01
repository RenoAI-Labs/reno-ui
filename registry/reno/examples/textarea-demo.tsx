"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TextareaDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="textarea-demo-note">Ghi chú</Label>
      <Textarea id="textarea-demo-note" placeholder="Nhập ghi chú của bạn..." />
    </div>
  );
}
