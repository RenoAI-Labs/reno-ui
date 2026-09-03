"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A vertical feed of things that happened: order history, an audit log, a
 * consultation record, an activity panel. Every admin screen has one.
 *
 * Two things the version this is drawn from carried are deliberately left out,
 * because they are that project's and not a component's: attachments fetched
 * through an authenticated route, and a per-item permission rule about editing
 * within 24 hours. Both go in through `actions`, where the screen that knows
 * the rules can put them.
 */

export type TimelineEntry = {
  /** Stable across renders. Not the array index — items get inserted at the top. */
  id: string;
  title: React.ReactNode;
  /** Who and when. Rendered as one muted line: "Thu Hà · 2 giờ trước". */
  meta?: React.ReactNode;
  note?: React.ReactNode;
  /** Small glyph inside the dot. Pass `aria-hidden`; the title is the name. */
  icon?: React.ReactNode;
  /**
   * Tints the dot. `success` for something that completed, `destructive` for a
   * failure, `warning` for something needing attention.
   *
   * Colour is the only thing this changes, so it must never be the only carrier
   * of the meaning — say it in `title` or `meta` too.
   */
  intent?: "default" | "success" | "warning" | "destructive";
  /** Per-item controls: edit, delete, open an attachment. */
  actions?: React.ReactNode;
};

export function Timeline({
  entries,
  className,
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  entries: TimelineEntry[];
}) {
  return (
    <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props}>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;

        return (
          <li
            key={entry.id}
            data-slot="timeline-entry"
            data-intent={entry.intent ?? "default"}
            className="flex gap-[var(--density-gap)]"
          >
            {/* The rail: dot plus the line down to the next entry. */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3",
                  entry.intent === "success" && "border-success bg-success/10 text-success",
                  entry.intent === "warning" && "border-warning bg-warning/10 text-warning",
                  entry.intent === "destructive" &&
                    "border-destructive bg-destructive/10 text-destructive",
                  (entry.intent ?? "default") === "default" &&
                    "border-border bg-muted text-muted-foreground",
                )}
              >
                {entry.icon}
              </span>
              {/*
                Not drawn after the last entry: a line trailing into nothing
                reads as "more below", which is the one thing it must not say
                at the end of a feed.
              */}
              {!isLast ? <span aria-hidden className="w-px flex-1 bg-border" /> : null}
            </div>

            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-1",
                // Bottom padding only between entries, so the list does not end
                // with a gap the caller has to counteract.
                !isLast && "pb-[var(--density-gap)]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{entry.title}</span>
                {entry.actions ? <span className="ms-auto">{entry.actions}</span> : null}
              </div>
              {entry.meta ? (
                <span className="text-xs text-muted-foreground">{entry.meta}</span>
              ) : null}
              {entry.note ? (
                <span className="text-sm text-muted-foreground">{entry.note}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
