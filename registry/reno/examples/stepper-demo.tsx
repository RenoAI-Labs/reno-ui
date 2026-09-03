"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";

const STEPS = [
  { label: "Giỏ hàng", description: "3 khoá học" },
  { label: "Thông tin", description: "Người học" },
  { label: "Thanh toán", description: "Chuyển khoản" },
  { label: "Hoàn tất" },
];

export default function StepperDemo() {
  const [current, setCurrent] = React.useState(1);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <Stepper steps={STEPS} current={current} />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((n) => n - 1)}
        >
          Quay lại
        </Button>
        <Button
          size="sm"
          disabled={current >= STEPS.length}
          onClick={() => setCurrent((n) => n + 1)}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
