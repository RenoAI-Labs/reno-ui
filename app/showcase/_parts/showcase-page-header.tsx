"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/app/theme-switcher";
import { ShowcaseBrandPicker } from "./showcase-brand-picker";

/**
 * Sticky header for showcase pages that have no application sidebar of their
 * own. Carries the same two theming controls as the dashboard topbar, because a
 * page you cannot re-theme is useless for visual review.
 */
export function ShowcasePageHeader({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-background/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-[var(--density-gap)] px-4 py-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeft />
            {backLabel}
          </Link>
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground max-sm:hidden">{description}</p>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <ThemeSwitcher />
          <ShowcaseBrandPicker />
        </div>
      </div>
    </header>
  );
}
