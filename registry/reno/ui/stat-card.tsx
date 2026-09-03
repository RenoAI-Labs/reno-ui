"use client";

import * as React from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A KPI tile: a label, one number, and how that number is moving.
 *
 * Every dashboard has a row of these and every project writes them again — the
 * source this is drawn from is 134 lines, and the same shape was written a
 * third time inside reno's own showcase. This is that shape, once.
 *
 * It stays a primitive rather than becoming a block: it renders one tile and
 * knows nothing about the grid it sits in, where the number came from, or what
 * clicking it filters.
 */

/**
 * The trend chip under the value.
 *
 * `direction` and `intent` are separate on purpose, and this is the one place
 * this component deliberately departs from the implementation it was drawn
 * from. That one colours "up" green unconditionally — which is wrong the first
 * time a dashboard shows churn, refunds or cost, where up is the bad news. The
 * arrow is a fact about the number; the colour is a judgement about the
 * business. So a churn tile passes `direction: "up"` with
 * `intent: "negative"`, and the common case still needs neither.
 *
 * `direction: undefined` renders no arrow at all, which is the honest state for
 * a KPI with no baseline to compare against — it says "not enough data yet"
 * instead of quietly disappearing.
 */
export type StatDelta = {
  /** Rendered verbatim: "3,4%", "+19 đơn", "chưa có dữ liệu". */
  text: string;
  direction?: "up" | "down";
  /** Defaults to positive for `up`, negative for `down`, neutral for neither. */
  intent?: "positive" | "negative" | "neutral";
};

function deltaIntent(delta: StatDelta): NonNullable<StatDelta["intent"]> {
  if (delta.intent) return delta.intent;
  if (delta.direction === "up") return "positive";
  if (delta.direction === "down") return "negative";
  return "neutral";
}

export type StatCardProps = {
  label: string;
  /** Pre-formatted. Locale and thousands separators are the project's. */
  value: React.ReactNode;
  /** e.g. "đơn", "%", "₫". Rendered smaller, beside the value. */
  unit?: string;
  /** Shown at the tile's corner. Give it `aria-hidden` — the label is the name. */
  icon?: React.ReactNode;
  delta?: StatDelta;
  /** Plain footer text, next to the delta chip: "so với tháng trước". */
  hint?: React.ReactNode;
  /**
   * Replaces the value with a skeleton and marks the tile busy.
   *
   * A KPI row where one number is slower than the others is the normal case,
   * not an edge case, so the state is part of the component rather than
   * something each dashboard reinvents.
   */
  loading?: boolean;
  /**
   * Makes the whole tile a control — a KPI that filters the list below it.
   *
   * With it the tile gains button semantics and keyboard activation, because a
   * clickable `<div>` is reachable by mouse only.
   */
  onClick?: () => void;
  className?: string;
};

export function StatCard({
  label,
  value,
  unit,
  icon,
  delta,
  hint,
  loading = false,
  onClick,
  className,
}: StatCardProps) {
  const interactive = Boolean(onClick);
  const intent = delta ? deltaIntent(delta) : "neutral";

  return (
    <Card
      data-slot="stat-card"
      aria-busy={loading || undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              // Enter and Space are what a real button answers to, so a tile
              // wearing button semantics has to answer to both.
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onClick?.();
            }
          : undefined
      }
      className={cn(
        interactive &&
          "cursor-pointer transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {loading ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <>
              {value}
              {unit ? (
                <span className="ms-1 text-base font-normal text-muted-foreground">{unit}</span>
              ) : null}
            </>
          )}
        </CardTitle>
      </CardHeader>

      {delta || hint ? (
        <CardContent className="flex flex-wrap items-center gap-2">
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <>
              {delta ? (
                <Badge
                  variant={
                    intent === "positive"
                      ? "success"
                      : intent === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {delta.direction === "up" ? <ArrowUpRightIcon aria-hidden /> : null}
                  {delta.direction === "down" ? <ArrowDownRightIcon aria-hidden /> : null}
                  {delta.text}
                </Badge>
              ) : null}
              {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
            </>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
