"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/**
 * The two shapes every toolbar group takes, and the divider between them.
 *
 * `ToggleGroup` rather than a row of buttons: a group of formatting toggles is
 * one control, and Radix gives it arrow-key navigation, so a keyboard user
 * tabs *to* the group once instead of through six buttons. `spacing={0}` joins
 * them into a segmented control, which is also what says visually that they
 * belong together.
 */

/** One item in a toggle group: the value the editor reports, its icon, its name. */
export type ToolbarToggle = {
  value: string;
  label: string;
  icon: React.ReactNode;
  onToggle: () => void;
  active: boolean;
  disabled?: boolean;
};

/**
 * A set of independent on/off toggles — bold, italic, underline.
 *
 * `type="multiple"` because several can be on at once, and the value array is
 * derived from the editor rather than held here: the editor is the only source
 * of truth for what the caret is sitting in.
 */
export function ToolbarToggleGroup({
  toggles,
  label,
}: {
  toggles: ToolbarToggle[];
  /** Accessible name of the group itself, not of its items. */
  label: string;
}) {
  const active = toggles.filter((toggle) => toggle.active).map((toggle) => toggle.value);

  return (
    <ToggleGroup
      type="multiple"
      size="sm"
      variant="outline"
      aria-label={label}
      value={active}
      className="shrink-0"
    >
      {toggles.map((toggle) => (
        <ToggleGroupItem
          key={toggle.value}
          value={toggle.value}
          aria-label={toggle.label}
          disabled={toggle.disabled}
          // `onClick`, not `onValueChange`: the editor already knows the new
          // state, so routing through the group's value would mean deriving it
          // twice and letting the two disagree.
          onClick={(event) => {
            event.preventDefault();
            toggle.onToggle();
          }}
        >
          {toggle.icon}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * A set where exactly one is on — heading level, text alignment.
 *
 * Radix clears a single-select group when its active item is clicked again, so
 * `onValueChange` receives an empty string. That is not "nothing selected", it
 * is "back to the default", which is why the empty case maps to `onClear`
 * rather than being ignored.
 */
export function ToolbarRadioGroup({
  toggles,
  label,
  value,
  onClear,
}: {
  toggles: ToolbarToggle[];
  label: string;
  value: string;
  onClear?: () => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      aria-label={label}
      value={value}
      className="shrink-0"
      onValueChange={(next) => {
        if (next === "") onClear?.();
      }}
    >
      {toggles.map((toggle) => (
        <ToggleGroupItem
          key={toggle.value}
          value={toggle.value}
          aria-label={toggle.label}
          disabled={toggle.disabled}
          onClick={(event) => {
            event.preventDefault();
            toggle.onToggle();
          }}
        >
          {toggle.icon}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Groups that are plain actions rather than state — link, media, history. */
export function ToolbarActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex shrink-0 items-center gap-1", className)}>{children}</div>;
}

export function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-6 shrink-0" aria-hidden />;
}
