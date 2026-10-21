"use client";

import { AttentionCard } from "@/components/ui/attention-card";

export default function AttentionCardDemo() {
  return (
    <div className="grid gap-[var(--density-gap)] sm:grid-cols-2">
      <AttentionCard
        severity="warning"
        status="Chờ duyệt"
        meta="Cũ nhất 2 ngày"
        value="12"
        description="Đơn nghỉ phép đang chờ bạn duyệt."
        actionLabel="Duyệt ngay"
      />
      <AttentionCard
        severity="destructive"
        status="Thất bại"
        meta="3 lần thử"
        value="4"
        description="Bản đồng bộ lương không chạy được."
        actionLabel="Xem lỗi"
      />
    </div>
  );
}
