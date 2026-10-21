import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * "Cần bạn xử lý": a card that says something is waiting on the reader.
 *
 * The shape is fixed by the admin layout standard (§5): a status pill at the
 * left, a right-aligned meta (a count or an age), a large number, one
 * explanatory line and one action. Severity tints the border and the
 * background, and it is a prop rather than a className because the tint is the
 * meaning: amber waits, red failed, red or amber needs attention.
 *
 * The tint uses the `--warning` and `--destructive` tokens at low alpha, never
 * a palette colour, so a brand that changes those tokens changes this card.
 */
export type AttentionSeverity = "warning" | "destructive";

const TINT: Record<AttentionSeverity, string> = {
  warning: "border-warning/50 bg-warning/5",
  destructive: "border-destructive/50 bg-destructive/5",
};

export type AttentionCardProps = {
  severity: AttentionSeverity;
  /** The status pill: "Chờ duyệt", "Thất bại", "Cần kết nối lại". */
  status: string;
  /** Right-aligned: a count or an age, "3 mục" or "2 giờ trước". */
  meta?: React.ReactNode;
  /** The large number. Pre-formatted. */
  value: React.ReactNode;
  description: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
  className?: string;
};

export function AttentionCard({
  severity,
  status,
  meta,
  value,
  description,
  actionLabel,
  onAction,
  className,
}: AttentionCardProps) {
  return (
    <Card
      data-slot="attention-card"
      data-severity={severity}
      className={cn("gap-3 p-4", TINT[severity], className)}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant={severity === "warning" ? "warning" : "destructive"} appearance="soft" shape="pill">
          {status}
        </Badge>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </div>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" className="self-start" onClick={onAction}>
        {actionLabel}
      </Button>
    </Card>
  );
}
