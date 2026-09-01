"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid, LogOut, Search, Sparkles, UserCog } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { FAVOURITES, NAV_GROUPS } from "./showcase-nav";

/**
 * Application sidebar for the showcase.
 *
 * Note what is *not* here: no colour, no pixel height. Every surface reads a
 * `--sidebar*` token and every control reads a density token, which is why the
 * same markup renders as a compact ERP rail and a roomy e-learning column.
 */
export function ShowcaseSidebar({
  active,
  onNavigate,
  onOpenSearch,
}: {
  active: string;
  onNavigate: (key: string) => void;
  onOpenSearch: () => void;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Nhân sự Reno</span>
            <span className="truncate text-xs text-muted-foreground">Công ty CP Đại Việt</span>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSearch} tooltip="Tìm nhanh (⌘K)">
              <Search />
              <span>Tìm nhanh</span>
              <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">
                ⌘K
              </SidebarMenuBadge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={active === item.key}
                      tooltip={item.label}
                      onClick={() => onNavigate(item.key)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarSeparator />

        <Collapsible defaultOpen className="group/favourites">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Yêu thích
                <ChevronRight className="ms-auto size-4 transition-transform group-data-[state=open]/favourites:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {FAVOURITES.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton size="sm" tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Tài khoản">
                  <Avatar className="size-7">
                    <AvatarFallback>NH</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">Nguyễn Thu Hà</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Trưởng phòng nhân sự
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCog />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <LogOut />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" tooltip="Tất cả component">
              <Link href="/showcase/all-components">
                <LayoutGrid />
                <span>Tất cả component</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" tooltip="Về trang tài liệu">
              <Link href="/">
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
