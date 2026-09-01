"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="monthly">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="radio-group-demo-monthly" />
        <Label htmlFor="radio-group-demo-monthly">Thanh toán hàng tháng</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="yearly" id="radio-group-demo-yearly" />
        <Label htmlFor="radio-group-demo-yearly">Thanh toán hàng năm</Label>
      </div>
    </RadioGroup>
  );
}
