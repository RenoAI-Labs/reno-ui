"use client";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export default function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@nguyenvana</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Nguyễn Văn A</p>
          <p className="text-muted-foreground text-sm">
            Quản trị viên hệ thống, tham gia từ tháng 3/2024.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
