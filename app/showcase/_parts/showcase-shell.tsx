"use client";

import * as React from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ActivityChart } from "./activity-chart";
import { KpiCards } from "./kpi-cards";
import { PeopleTable } from "./people-table";
import { RecentDocuments } from "./recent-documents";
import { ShowcaseCommand } from "./showcase-command";
import { ShowcaseSidebar } from "./showcase-sidebar";
import { ShowcaseTopbar } from "./showcase-topbar";
import { ALL_NAV_ITEMS } from "./showcase-nav";

/**
 * Composition root for the dashboard.
 *
 * Client-side because the shell owns two pieces of interaction state — which nav
 * item is active and whether the ⌘K palette is open — that both the sidebar and
 * the palette read. Everything below it is a plain reno primitive; nothing here
 * styles a component, which is the property the page is meant to demonstrate.
 */
export function ShowcaseShell() {
  const [active, setActive] = React.useState("dashboard");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const title = ALL_NAV_ITEMS.find((item) => item.key === active)?.label ?? "Bảng điều khiển";

  return (
    <SidebarProvider>
      <ShowcaseSidebar
        active={active}
        onNavigate={setActive}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <SidebarInset>
        <ShowcaseTopbar title={title} />

        <div className="flex flex-1 flex-col gap-[var(--density-gap)] p-4">
          <KpiCards />

          <div className="grid gap-[var(--density-gap)] xl:grid-cols-3">
            <ActivityChart className="xl:col-span-2" />
            <RecentDocuments />
          </div>

          <PeopleTable />
        </div>
      </SidebarInset>

      <ShowcaseCommand
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={setActive}
      />
    </SidebarProvider>
  );
}
