"use client";

import * as React from "react";
import { EllipsisIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The "Hành động" column of a list: the most used actions as icon buttons, the
 * rest behind "⋯".
 *
 * The rule it enforces, from the admin layout standard (§7): the most used
 * actions are never hidden in the overflow menu, and a user never needs two
 * clicks for the common action. So `actions` is ordered by how often people use
 * it, the first `maxInline` (at most four) are always visible, and the "⋯" menu
 * exists only when there are more than that. `maxInline` is clamped to four —
 * asking for six inline buttons is a request to break the rule, not a setting.
 *
 * Every inline button has a tooltip and an accessible name, since an icon alone
 * names nothing to a screen reader. A destructive action in the menu takes the
 * destructive colour and, with `confirm`, asks before running.
 */
export type RowAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Ask before running. Meant for destructive actions. */
  confirm?: { title: string; description: string; confirmLabel?: string };
};

export const MAX_INLINE_ROW_ACTIONS = 4;

/** Which actions are inline and which go in the menu. Pure, so it can be tested alone. */
export function splitRowActions(actions: RowAction[], maxInline: number = MAX_INLINE_ROW_ACTIONS) {
  const limit = Math.min(Math.max(1, Math.floor(maxInline)), MAX_INLINE_ROW_ACTIONS);
  return { inline: actions.slice(0, limit), overflow: actions.slice(limit) };
}

export type RowActionsLabels = {
  more: string;
  cancel: string;
  confirm: string;
};

export const defaultRowActionsLabels: RowActionsLabels = {
  more: "Thao tác khác",
  cancel: "Huỷ",
  confirm: "Xác nhận",
};

export type RowActionsProps = {
  /** Ordered by how often they are used, most used first. */
  actions: RowAction[];
  maxInline?: number;
  labels?: Partial<RowActionsLabels>;
  className?: string;
};

export function RowActions({ actions, maxInline, labels: overrides, className }: RowActionsProps) {
  const labels = { ...defaultRowActionsLabels, ...overrides };
  const { inline, overflow } = splitRowActions(actions, maxInline);
  const [pending, setPending] = React.useState<RowAction | null>(null);

  const run = (action: RowAction) => {
    if (action.confirm) setPending(action);
    else action.onSelect();
  };

  return (
    // The grid makes the whole row clickable when `onRowClick` is set; a button
    // in the row must not also open it.
    <span
      data-slot="row-actions"
      className={cn("flex items-center gap-1", className)}
      onClick={(event) => event.stopPropagation()}
    >
      {inline.map((action) => (
        <Tooltip key={action.key}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={action.label}
              disabled={action.disabled}
              className={cn(action.destructive && "text-destructive hover:text-destructive")}
              onClick={() => run(action)}
            >
              {action.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      ))}

      {overflow.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={labels.more}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflow.map((action, index) => (
              <React.Fragment key={action.key}>
                {action.destructive && index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  variant={action.destructive ? "destructive" : "default"}
                  disabled={action.disabled}
                  onSelect={() => run(action)}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pending?.confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                pending?.destructive &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                pending?.onSelect();
                setPending(null);
              }}
            >
              {pending?.confirm?.confirmLabel ?? labels.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
