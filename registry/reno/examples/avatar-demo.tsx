"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="Ảnh đại diện" />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Ảnh đại diện" />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="/khong-ton-tai.png" alt="Ảnh đại diện" />
        <AvatarFallback>BC</AvatarFallback>
      </Avatar>
    </div>
  );
}
