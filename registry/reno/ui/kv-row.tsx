"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A label and its value, on one line. The identity panel on every detail page.
 *
 * Fifteen lines in the project it was drawn from, and written again in the next
 * one, because the tricky part is not the row — it is the hairline between
 * consecutive rows, which the source got from a `.kv-row + .kv-row` rule in a
 * stylesheet the component did not own. `KvList` owns it here, so the pair
 * installs as one thing and needs no CSS from the project.
 */

export function KvList({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="kv-list"
      /*
        `<dl>`, not a stack of divs. A screen reader reads a description list as
        pairs — "Mã đơn: SO-1042" — which is what this is; a div soup reads as
        two unrelated runs of text.

        The divider is a sibling rule so a row never has to know whether it is
        first. Adding one to the middle of the list cannot get it wrong.
      */
      className={cn("[&>*+*]:border-t [&>*+*]:border-border", className)}
      {...props}
    />
  );
}

export function KvRow({
  label,
  children,
  mono = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  children: React.ReactNode;
  /**
   * Tabular figures and a monospace face, for values that are read character by
   * character: an order code, an IBAN, a hash, an IP.
   */
  mono?: boolean;
}) {
  return (
    <div
      data-slot="kv-row"
      className={cn(
        "flex flex-wrap items-baseline gap-x-[var(--density-gap)] gap-y-1 py-[var(--density-cell-padding-y)]",
        className,
      )}
      {...props}
    >
      <dt className="min-w-32 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          // `min-w-0` so a long unbroken value wraps instead of pushing the row
          // wider than its container — an email or a URL does this immediately.
          "min-w-0 flex-1 text-sm font-medium",
          mono && "font-mono tabular-nums",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
