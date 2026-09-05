"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";

export default function NumberInputDemo() {
  const [posts, setPosts] = React.useState<number | null>(12);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="posts">Số bài viết mỗi tháng</Label>
        <NumberInput id="posts" aria-label="Số bài viết mỗi tháng" value={posts} onValueChange={setPosts} min={0} max={200} step={4} />
      </div>
      <NumberInput aria-label="Tỉ lệ" defaultValue={1.5} min={0} max={3} step={0.25} />
      <NumberInput aria-label="Đã khoá" defaultValue={5} disabled />
    </div>
  );
}
