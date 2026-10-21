"use client";

import * as React from "react";
import Link from "next/link";
import { BellIcon, CheckIcon, ChevronDownIcon, CircleQuestionMarkIcon, MegaphoneIcon, SearchIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/app/theme-switcher";
import { ANNOUNCEMENT, NOTIFICATIONS, WORKSPACES } from "./mock-admin-data";
import { ShowcaseUserMenu } from "./showcase-user-menu";

/**
 * Sticky application header. Left to right, per docs/admin-layout-standard.md
 * §2.2: sidebar toggle, workspace switcher, announcement pill, spacer, search
 * with the Ctrl K hint, help, notification bell, theme toggle, avatar menu.
 *
 * The brand panel is not here. It used to sit in this bar; it lives in
 * Cấu hình › Thương hiệu now, because the header order is the standard and a
 * tenth control would be a project-specific addition to it.
 */

function WorkspaceSwitcher() {
  const [active, setActive] = React.useState(WORKSPACES[0]!.id);
  const current = WORKSPACES.find((workspace) => workspace.id === active) ?? WORKSPACES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Đổi không gian làm việc">
          <Avatar className="size-6 rounded-md">
            <AvatarFallback className="rounded-md text-[0.625rem]">{current.initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-40 truncate max-md:hidden">{current.name}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Không gian làm việc</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WORKSPACES.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onSelect={() => setActive(workspace.id)}>
            <Avatar className="size-6 rounded-md">
              <AvatarFallback className="rounded-md text-[0.625rem]">{workspace.initials}</AvatarFallback>
            </Avatar>
            {workspace.name}
            {workspace.id === active ? <CheckIcon className="ms-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const unread = NOTIFICATIONS.filter((notification) => notification.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Thông báo, ${unread} chưa đọc`}>
          <BellIcon />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[0.625rem] font-medium text-destructive-foreground"
            >
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="px-4 py-3 text-sm font-medium">Thông báo</p>
        <Separator />
        <ul className="flex max-h-80 flex-col overflow-auto">
          {NOTIFICATIONS.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "flex flex-col gap-0.5 border-b border-border px-4 py-3 last:border-b-0",
                notification.unread && "bg-accent/40",
              )}
            >
              <span className="text-sm font-medium">{notification.title}</span>
              <span className="text-xs text-muted-foreground">
                {notification.detail} · {notification.time}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function ShowcaseHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    // `shrink-0`: the inset is a flex column, so without it the flex algorithm
    // squashes this header when the page overflows.
    <header
      data-slot="showcase-header"
      className="sticky top-0 z-[var(--z-sticky)] flex shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 py-2 backdrop-blur"
    >
      <SidebarTrigger />
      <WorkspaceSwitcher />

      <div
        data-slot="announcement-pill"
        className="hidden min-w-0 items-center gap-2 rounded-full bg-info-soft px-3 py-1 text-xs text-info-soft-foreground lg:flex"
      >
        <MegaphoneIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{ANNOUNCEMENT}</span>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Tìm nhanh"
          className="flex h-[var(--density-control-height)] w-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-64 md:justify-start"
        >
          <SearchIcon className="size-4 shrink-0" aria-hidden />
          <span className="max-md:hidden">Tìm nhanh…</span>
          <kbd className="ms-auto rounded border border-border px-1.5 font-mono text-[0.625rem] max-md:hidden">
            Ctrl K
          </kbd>
        </button>

        <Button asChild variant="ghost" size="icon" aria-label="Trợ giúp">
          <Link href="/components">
            <CircleQuestionMarkIcon />
          </Link>
        </Button>
        <NotificationBell />
        <ModeToggle />
        <ShowcaseUserMenu />
      </div>
    </header>
  );
}
