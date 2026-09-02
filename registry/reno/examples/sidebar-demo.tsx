"use client";

import { HouseIcon, InboxIcon, SearchIcon, SettingsIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const items = [
  { title: "Trang chủ", icon: HouseIcon },
  { title: "Hộp thư", icon: InboxIcon },
  { title: "Tìm kiếm", icon: SearchIcon },
  { title: "Cài đặt", icon: SettingsIcon },
];

export default function SidebarDemo() {
  return (
    <SidebarProvider className="min-h-0 rounded-lg border">
      <Sidebar collapsible="none" className="w-56">
        <SidebarHeader className="px-2 py-3 text-sm font-semibold">reno-ui</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="p-4">
        <SidebarTrigger />
        <p className="mt-2 text-sm text-muted-foreground">Nội dung chính nằm cạnh sidebar.</p>
      </SidebarInset>
    </SidebarProvider>
  );
}
