"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

import { RolesSection } from "./settings-roles-section";
import {
  BillingSection,
  BrandSection,
  GENERAL_DEFAULTS,
  GeneralSection,
  IntegrationsSection,
  NOTIFICATION_DEFAULTS,
  NotificationsSection,
  SECURITY_DEFAULTS,
  SecuritySection,
  useDraft,
} from "./settings-sections";

const TABS = [
  { id: "general", label: "Chung" },
  { id: "brand", label: "Thương hiệu" },
  { id: "notifications", label: "Thông báo" },
  { id: "security", label: "Bảo mật" },
  { id: "integrations", label: "Tích hợp" },
  { id: "billing", label: "Gói và thanh toán" },
  { id: "roles", label: "Vai trò và phân quyền" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth, so `?tab=roles` deep-links and Back works.
  const param = searchParams.get("tab");
  const tab: TabId = TABS.find((t) => t.id === param)?.id ?? "general";

  // The three form drafts live here so an unsaved edit survives a tab switch.
  const general = useDraft(GENERAL_DEFAULTS);
  const notifications = useDraft(NOTIFICATION_DEFAULTS);
  const security = useDraft(SECURITY_DEFAULTS);

  const select = (id: TabId) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeader title="Cấu hình" subtitle="Thiết lập không gian làm việc" />

      <div className="flex flex-col gap-[var(--density-gap)] md:flex-row md:items-start">
        <nav
          aria-label="Mục cấu hình"
          className="flex gap-1 overflow-x-auto md:w-56 md:shrink-0 md:flex-col md:overflow-visible"
        >
          {TABS.map((t) => (
            <Button
              key={t.id}
              variant={t.id === tab ? "secondary" : "ghost"}
              size="sm"
              aria-current={t.id === tab ? "page" : undefined}
              className={cn("shrink-0 justify-start", t.id === tab && "font-semibold")}
              onClick={() => select(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </nav>

        <div
          id="settings-panel"
          // Sections sit in a column; the SaveBar at the end of each form sticks to the bottom.
          className="flex min-w-0 flex-1 flex-col gap-[var(--density-gap)]"
        >
          {tab === "general" ? <GeneralSection form={general} /> : null}
          {tab === "brand" ? <BrandSection /> : null}
          {tab === "notifications" ? <NotificationsSection form={notifications} /> : null}
          {tab === "security" ? <SecuritySection form={security} /> : null}
          {tab === "integrations" ? <IntegrationsSection /> : null}
          {tab === "billing" ? <BillingSection /> : null}
          {tab === "roles" ? <RolesSection /> : null}
        </div>
      </div>
    </>
  );
}
