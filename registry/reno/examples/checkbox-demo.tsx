"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function CheckboxDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-demo-newsletter" defaultChecked />
      <Label htmlFor="checkbox-demo-newsletter">Nhận bản tin qua email</Label>
    </div>
  );
}
