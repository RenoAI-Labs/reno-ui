"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BrandProvider } from "./showcase-brand-panel";
import { ShowcaseCommand } from "./showcase-command";
import { ShowcaseHeader } from "./showcase-header";
import { ShowcaseSidebar } from "./showcase-sidebar";

/**
 * The shell every showcase page mounts inside, rendered once by
 * `app/showcase/layout.tsx` so the sidebar, header and palette keep their state
 * (collapsed, open groups, workspace) while pages swap underneath.
 *
 * Client-side because it owns the palette's open state, which the header's
 * search field and the Ctrl K shortcut both drive. `BrandProvider` is here for
 * the same reason it must outlive a page: the brand a reviewer dialled in
 * Cấu hình has to survive clicking any other menu item.
 */
export function ShowcaseShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <BrandProvider>
      <SidebarProvider>
        <ShowcaseSidebar />

        <SidebarInset>
          <ShowcaseHeader onOpenSearch={() => setSearchOpen(true)} />
          <main className="flex flex-1 flex-col gap-[var(--density-gap)] p-4">{children}</main>
        </SidebarInset>

        <ShowcaseCommand
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelect={(href) => router.push(href)}
        />
      </SidebarProvider>
    </BrandProvider>
  );
}
