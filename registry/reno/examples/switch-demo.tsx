"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SwitchDemo() {
  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-demo-notify" defaultChecked />
      <Label htmlFor="switch-demo-notify">Bật thông báo</Label>
    </div>
  );
}
