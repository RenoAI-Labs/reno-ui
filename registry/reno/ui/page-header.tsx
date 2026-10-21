import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The header inside the content area of an admin page: optional breadcrumb, the
 * title, a muted subtitle, and at the right the page filter and the primary
 * action.
 *
 * Positions are part of the admin layout standard (docs/admin-layout-standard.md
 * §2.3), which is why this is a component and not a className convention: the
 * breadcrumb sits above the title, `filters` sits before `actions`, and neither
 * moves from one project to the next.
 *
 * It renders no navigation of its own. The breadcrumb is a slot because a link
 * is a framework concern (`next/link`, a router) and primitives stay
 * framework-neutral.
 */
export type PageHeaderProps = {
  title: React.ReactNode;
  /** The muted line under the title, for example the period and the timezone. */
  subtitle?: React.ReactNode;
  /** A `Breadcrumb`, for pages deeper than the first level. */
  breadcrumb?: React.ReactNode;
  /** Page filter controls, such as the period selector. Rendered before `actions`. */
  filters?: React.ReactNode;
  /** The primary action and its siblings. */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  filters,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("flex flex-col gap-2", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-[var(--density-gap)]">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {filters || actions ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
