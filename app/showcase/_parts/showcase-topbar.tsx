"use client";

import { ChevronDown, Download, Plus } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/app/theme-switcher";
import { ShowcaseBrandPanel } from "./showcase-brand-panel";

/**
 * Sticky application header: breadcrumb, primary actions, and the two controls
 * this page exists to demonstrate — light/dark, and the brand panel.
 *
 * The preset row that used to sit here has moved inside the panel. A project
 * does not arrive wanting "the CMS theme"; it arrives with a brand colour and a
 * spacing preference, and one control that starts from a preset and lets you
 * tune it says that better than four buttons named after our own domains.
 */
export function ShowcaseTopbar({ title }: { title: string }) {
  return (
    // `shrink-0`: the inset is a flex column, so without it the flex algorithm
    // squashes this header when the page overflows and the wrapped action row
    // spills out over the content below.
    <header className="sticky top-0 z-[var(--z-sticky)] flex shrink-0 flex-wrap items-center gap-[var(--density-gap)] border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      {/*
        The height override needs the orientation modifier. Separator declares
        `data-[orientation=vertical]:h-full`, and tailwind-merge keys a modified
        utility separately from its bare form — so a plain `h-6` loses, and the
        divider stretches to the tallest wrapped row.
      */}
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-6 max-md:hidden"
      />

      <Breadcrumb className="max-sm:hidden">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Nhân sự</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex flex-wrap items-center gap-2">
        <ModeToggle />
        <ShowcaseBrandPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download />
              <span className="hidden sm:inline">Xuất</span>
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Xuất Excel</DropdownMenuItem>
            <DropdownMenuItem>Xuất CSV</DropdownMenuItem>
            <DropdownMenuItem>Xuất PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm">
          <Plus />
          <span className="hidden sm:inline">Thêm nhân viên</span>
        </Button>
      </div>
    </header>
  );
}
