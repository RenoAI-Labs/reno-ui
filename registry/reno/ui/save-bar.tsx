import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The sticky bar a settings page shows once something has changed: the dirty
 * count, "Hoàn tác" and "Lưu tất cả thay đổi (n)".
 *
 * With nothing changed it is disabled rather than hidden, so the page does not
 * jump when the first field is touched and the user can see where saving will
 * happen. `dirtyCount` is the caller's number — fields, cells, or sections —
 * because only the caller knows what "one change" means on its form.
 */
export type SaveBarLabels = {
  revert: string;
  save: (count: number) => string;
  pristine: string;
  dirty: (count: number) => string;
};

export const defaultSaveBarLabels: SaveBarLabels = {
  revert: "Hoàn tác",
  save: (count) => `Lưu tất cả thay đổi (${count})`,
  pristine: "Chưa có thay đổi",
  dirty: (count) => `${count} thay đổi chưa lưu`,
};

export type SaveBarProps = {
  dirtyCount: number;
  onRevert: () => void;
  onSave: () => void;
  saving?: boolean;
  labels?: Partial<SaveBarLabels>;
  className?: string;
};

export function SaveBar({
  dirtyCount,
  onRevert,
  onSave,
  saving = false,
  labels: overrides,
  className,
}: SaveBarProps) {
  const labels = { ...defaultSaveBarLabels, ...overrides };
  const pristine = dirtyCount === 0;

  return (
    <div
      data-slot="save-bar"
      data-dirty={!pristine}
      className={cn(
        "sticky bottom-0 z-[var(--z-sticky)] flex flex-wrap items-center justify-between gap-[var(--density-gap)] rounded-lg border border-border bg-background/95 px-4 py-3 shadow-md backdrop-blur",
        className,
      )}
    >
      <p role="status" className="text-sm text-muted-foreground">
        {pristine ? labels.pristine : labels.dirty(dirtyCount)}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pristine || saving} onClick={onRevert}>
          {labels.revert}
        </Button>
        <Button size="sm" disabled={pristine || saving} onClick={onSave}>
          {labels.save(dirtyCount)}
        </Button>
      </div>
    </div>
  );
}
