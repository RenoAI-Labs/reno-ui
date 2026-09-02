"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function ErrorStateDemo() {
  return (
    <div className="flex w-full flex-col divide-y divide-border rounded-md border border-border">
      <ErrorState
        title="Không tải được danh sách"
        body="Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại."
        onRetry={() => window.location.reload()}
      />
      {/* Without onRetry there is no button — an error nobody can retry should
          not pretend otherwise. */}
      <ErrorState body="Bạn không có quyền xem mục này." />
    </div>
  );
}
