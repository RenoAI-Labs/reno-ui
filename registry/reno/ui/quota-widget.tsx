import * as React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * A usage or credit meter: a label, the remaining figure, the total, and a bar.
 *
 * Lives at the foot of the sidebar and, in a larger form, inside the user menu.
 * The figures arrive already formatted — locale and separators are the
 * project's — while the bar reads the raw numbers, so a wrong format string can
 * never draw a wrong bar.
 *
 * `compact` drops the surrounding box for placement inside something that is
 * already a card. When the sidebar is collapsed to an icon rail the widget
 * hides itself via `group-data-[collapsible=icon]:hidden`, which is a class the
 * caller adds, because only the caller knows what it sits in.
 */
export type QuotaWidgetProps = {
  /** "Điểm còn lại" */
  label: string;
  remaining: number;
  total: number;
  /** Overrides how the figures read. Defaults to `toLocaleString("vi-VN")`. */
  format?: (value: number) => string;
  /** The line under the bar, for example "Gia hạn 12/10/2026". */
  caption?: React.ReactNode;
  /** A link-style action under the bar, for example "Nạp thêm điểm". */
  action?: React.ReactNode;
  /** No box: for placement inside another card. */
  compact?: boolean;
  className?: string;
};

const defaultFormat = (value: number) => value.toLocaleString("vi-VN");

export function QuotaWidget({
  label,
  remaining,
  total,
  format = defaultFormat,
  caption,
  action,
  compact = false,
  className,
}: QuotaWidgetProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;

  return (
    <div
      data-slot="quota-widget"
      className={cn(
        "flex flex-col gap-2 text-sm",
        !compact && "rounded-md border border-border bg-card p-3 text-card-foreground",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {format(remaining)}
          <span className="font-normal text-muted-foreground"> / {format(total)}</span>
        </span>
      </div>
      <Progress value={percent} aria-label={label} />
      {caption || action ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {caption ? <span>{caption}</span> : <span />}
          {action}
        </div>
      ) : null}
    </div>
  );
}
