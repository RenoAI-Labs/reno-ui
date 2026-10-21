"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QuotaWidget } from "@/components/ui/quota-widget";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DOCS_HREF,
  FAVOURITES,
  FOOTER_LINKS,
  NAV_GROUPS,
  isActive,
  type NavItem,
} from "./showcase-nav";

/**
 * Application sidebar, in the order docs/admin-layout-standard.md §2.1 fixes:
 * logo and name, groups, favourites, the quota widget, the footer links. There is
 * no user card: the account lives in the header avatar menu.
 *
 * Note what is *not* here: no colour, no pixel height. Every surface reads a
 * `--sidebar*` token and every control reads a density token, which is why the
 * same markup renders as a compact ERP rail and a roomy e-learning column.
 */

function NavGroupSection({
  label,
  items,
  pathname,
  small = false,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  small?: boolean;
}) {
  return (
    <Collapsible defaultOpen className="group/nav-group">
      <SidebarGroup>
        <SidebarGroupLabel asChild className="uppercase tracking-wide">
          <CollapsibleTrigger className="flex w-full items-center">
            {label}
            <ChevronRight className="ms-auto size-4 transition-transform group-data-[state=open]/nav-group:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    size={small ? "sm" : "default"}
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function ShowcaseSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Nhân sự Reno</span>
            <span className="truncate text-xs text-muted-foreground">Cổng quản trị</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <NavGroupSection
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
          />
        ))}
        <NavGroupSection label="Yêu thích" items={FAVOURITES} pathname={pathname} small />
      </SidebarContent>

      <SidebarFooter>
        <QuotaWidget
          label="Điểm còn lại"
          remaining={2155}
          total={4300}
          className="bg-sidebar-accent/40 group-data-[collapsible=icon]:hidden"
        />

        <SidebarMenu>
          {FOOTER_LINKS.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                asChild
                size="sm"
                tooltip={item.label}
                isActive={isActive(pathname, item.href)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" tooltip="Về trang tài liệu">
              <Link href={DOCS_HREF}>
                <Badge variant="outline" className="px-1">
                  ui
                </Badge>
                <span>Về trang tài liệu</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
