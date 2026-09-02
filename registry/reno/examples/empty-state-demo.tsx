"use client";

import { SearchXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function EmptyStateDemo() {
  return (
    <div className="flex w-full flex-col divide-y divide-border rounded-md border border-border">
      <EmptyState
        title="Chưa có khoá học nào"
        body="Tạo khoá học đầu tiên để bắt đầu."
        action={<Button size="sm">Tạo khoá học</Button>}
      />
      {/* Same component, different story: a search that matched nothing. */}
      <EmptyState
        icon={<SearchXIcon className="size-8 text-muted-foreground" aria-hidden />}
        body="Không tìm thấy kết quả nào khớp bộ lọc."
      />
    </div>
  );
}
