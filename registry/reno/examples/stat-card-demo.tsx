"use client";

import { UserMinusIcon, UserPlusIcon, UsersIcon, WalletIcon } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

export default function StatCardDemo() {
  return (
    <div className="grid gap-[var(--density-gap)] sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Tổng nhân sự"
        value="240"
        icon={<UsersIcon className="size-4" aria-hidden />}
        delta={{ text: "3,4%", direction: "up" }}
        hint="so với tháng trước"
      />
      <StatCard
        label="Tuyển mới tháng 8"
        value="19"
        icon={<UserPlusIcon className="size-4" aria-hidden />}
        delta={{ text: "12,5%", direction: "up" }}
        hint="so với tháng 7"
      />
      {/*
        The case the source implementation gets wrong: attrition rising is bad
        news, so the arrow points up and the colour says negative.
      */}
      <StatCard
        label="Tỉ lệ nghỉ việc"
        value="3,8"
        unit="%"
        icon={<UserMinusIcon className="size-4" aria-hidden />}
        delta={{ text: "0,6 điểm", direction: "up", intent: "negative" }}
        hint="so với tháng 7"
      />
      <StatCard
        label="Chi phí lương tháng 8"
        value=""
        icon={<WalletIcon className="size-4" aria-hidden />}
        delta={{ text: "" }}
        loading
      />
    </div>
  );
}
