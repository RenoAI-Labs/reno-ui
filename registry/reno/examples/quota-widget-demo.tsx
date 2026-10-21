"use client";

import { Button } from "@/components/ui/button";
import { QuotaWidget } from "@/components/ui/quota-widget";

export default function QuotaWidgetDemo() {
  return (
    <div className="flex max-w-xs flex-col gap-[var(--density-gap)]">
      <QuotaWidget label="Điểm còn lại" remaining={2155} total={4300} />
      <QuotaWidget
        label="Điểm còn lại kỳ này"
        remaining={310}
        total={4300}
        caption="Gia hạn 12/10/2026"
        action={
          <Button variant="link" size="sm" className="h-auto p-0">
            Nạp thêm điểm
          </Button>
        }
      />
    </div>
  );
}
