"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Numeric field with decrement / increment buttons.
 *
 * `<input type="number">` alone is not enough for the cases this exists for:
 * the native spinners are tiny, differ per browser, and disappear on touch. The
 * two buttons here are real controls at the density height, so a quantity is
 * adjustable with a thumb.
 *
 * Not to be confused with `stepper`, which is the multi-step progress
 * indicator for wizards. That naming collision has already cost one project a
 * wrong mapping.
 *
 * Height and padding read `--density-*` like every other control, so the field
 * matches the inputs beside it under any preset.
 */

export type NumberInputLabels = {
  decrement: string;
  increment: string;
};

export const defaultNumberInputLabels: NumberInputLabels = {
  decrement: "Giảm",
  increment: "Tăng",
};

export const englishNumberInputLabels: NumberInputLabels = {
  decrement: "Decrease",
  increment: "Increase",
};

/** Clamp to the range and snap to the step grid anchored at `min` (or 0). */
function normalise(raw: number, min: number, max: number, step: number): number {
  const anchor = Number.isFinite(min) ? min : 0;
  const snapped = anchor + Math.round((raw - anchor) / step) * step;
  const clamped = Math.min(max, Math.max(min, snapped));
  // Rounding kills the float drift that 0.1-style steps produce.
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(clamped.toFixed(decimals));
}

function NumberInput({
  className,
  value,
  defaultValue,
  onValueChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled,
  labels: labelOverrides,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
  /** Controlled value. Leave undefined and pass `defaultValue` for uncontrolled. */
  value?: number | null;
  defaultValue?: number | null;
  /** Fires on every committed change: buttons, typing, and arrow keys. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Button labels. Vietnamese by default; pass `englishNumberInputLabels` to switch. */
  labels?: Partial<NumberInputLabels>;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultNumberInputLabels, ...labelOverrides }),
    [labelOverrides],
  );

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<number | null>(defaultValue ?? null);
  const current = isControlled ? (value ?? null) : internal;

  const commit = React.useCallback(
    (next: number | null) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const nudge = (direction: 1 | -1) => {
    const base = current ?? (Number.isFinite(min) ? min : 0);
    commit(normalise(base + direction * step, min, max, step));
  };

  const atMin = current !== null && current <= min;
  const atMax = current !== null && current >= max;

  return (
    <div
      data-slot="number-input"
      className={cn("inline-flex items-stretch gap-1", className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || atMin}
        aria-label={labels.decrement}
        onClick={() => nudge(-1)}
      >
        <MinusIcon aria-hidden="true" />
      </Button>

      <input
        type="number"
        inputMode="decimal"
        data-slot="number-input-field"
        aria-label={ariaLabel}
        value={current ?? ""}
        min={Number.isFinite(min) ? min : undefined}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const raw = event.target.value;
          commit(raw === "" ? null : Number(raw));
        }}
        onBlur={(event) => {
          const raw = event.target.value;
          if (raw === "") return;
          commit(normalise(Number(raw), min, max, step));
        }}
        className={cn(
          "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "h-[var(--density-control-height)] w-20 min-w-0 rounded-md border bg-transparent px-[var(--density-control-px)] py-1",
          "text-center text-base tabular-nums shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // The native spinners duplicate the buttons and are unusable on touch.
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
        {...props}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || atMax}
        aria-label={labels.increment}
        onClick={() => nudge(1)}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </div>
  );
}

export { NumberInput };
