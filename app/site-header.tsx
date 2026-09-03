import Link from "next/link";

import { ModeToggle } from "@/app/theme-switcher";

const NAV = [
  { href: "/", label: "Tổng quan" },
  { href: "/components", label: "Component" },
  { href: "/theming", label: "Theme" },
  { href: "/showcase", label: "Showcase" },
  { href: "/perf/data-grid", label: "Benchmark" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight">
          reno<span className="text-primary">-ui</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
