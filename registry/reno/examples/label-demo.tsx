"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function LabelDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="label-demo-terms" />
      <Label htmlFor="label-demo-terms">Tôi đồng ý với điều khoản dịch vụ</Label>
    </div>
  );
}
