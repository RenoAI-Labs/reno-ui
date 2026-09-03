"use client";

import { BanknoteIcon, PhoneIcon, TriangleAlertIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/ui/timeline";

export default function TimelineDemo() {
  return (
    <Timeline
      className="max-w-xl"
      entries={[
        {
          id: "paid",
          title: "Đã thanh toán đơn SO-1042",
          meta: "Nguyễn Thu Hà · 2 giờ trước",
          icon: <BanknoteIcon aria-hidden />,
          // The word "Đã thanh toán" is in the title, so the green dot is a
          // second signal rather than the only one.
          intent: "success",
        },
        {
          id: "call",
          title: "Gọi tư vấn lần 2",
          meta: "Trần Minh Quân · hôm qua",
          note: "Khách hẹn gọi lại sau 20/9, đang so sánh với hai đơn vị khác.",
          icon: <PhoneIcon aria-hidden />,
          actions: (
            <Button variant="ghost" size="sm">
              Sửa
            </Button>
          ),
        },
        {
          id: "overdue",
          title: "Quá hạn theo dõi 3 ngày",
          meta: "Hệ thống · 3 ngày trước",
          icon: <TriangleAlertIcon aria-hidden />,
          intent: "warning",
        },
        {
          id: "created",
          title: "Tạo lead từ form đăng ký",
          meta: "Hệ thống · 12/08/2026",
          icon: <UserPlusIcon aria-hidden />,
        },
      ]}
    />
  );
}
