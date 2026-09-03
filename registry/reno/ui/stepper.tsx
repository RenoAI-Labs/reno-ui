"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Where you are in a multi-step flow: checkout, onboarding, an import wizard.
 *
 * The version this is drawn from is presentational only — a row of numbered
 * pills, no semantics at all. That is the part worth fixing rather than
 * porting: a stepper is the only thing on screen telling someone how much is
 * left, and to a screen reader a row of `<div>`s says nothing.
 *
 * So it renders an ordered list, names itself, marks the current step with
 * `aria-current="step"`, and puts each step's state in text rather than only in
 * colour — "Đã xong", "Đang làm" — because colour alone is neither readable by
 * assistive tech nor distinguishable to everyone who can see it.
 *
 * It is a progress indicator, not a tab list. Steps are not buttons here: a
 * flow decides for itself whether jumping back is allowed, so navigation is the
 * consuming screen's to add.
 */

export type Step = {
  label: string;
  /** One line under the label. Left out on a compact stepper. */
  description?: string;
};

export type StepperLabels = {
  /** Accessible name of the whole control. */
  stepper: string;
  done: string;
  current: string;
  upcoming: string;
  /** e.g. (2, 4) => "Bước 2 / 4" */
  stepOf: (index: number, total: number) => string;
};

export const defaultStepperLabels: StepperLabels = {
  stepper: "Tiến trình",
  done: "Đã xong",
  current: "Đang làm",
  upcoming: "Chưa tới",
  stepOf: (index, total) => `Bước ${index} / ${total}`,
};

export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  labels: labelOverrides,
  className,
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  steps: Step[];
  /** Zero-based. Past `steps.length - 1` marks every step done. */
  current: number;
  orientation?: "horizontal" | "vertical";
  labels?: Partial<StepperLabels>;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultStepperLabels, ...labelOverrides }),
    [labelOverrides],
  );

  return (
    <ol
      data-slot="stepper"
      aria-label={labels.stepper}
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "flex-row items-start gap-[var(--density-gap)]"
          : "flex-col gap-[var(--density-gap)]",
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.label}
            data-slot="stepper-step"
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex min-w-0 gap-2",
              orientation === "horizontal" ? "flex-1 items-start" : "items-start",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-[var(--density-control-height-sm)] shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary text-primary",
                state === "upcoming" && "border-border text-muted-foreground",
              )}
            >
              {state === "done" ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>

            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="text-xs text-muted-foreground">{step.description}</span>
              ) : null}
              {/*
                The state in words. Everything above encodes it as colour and a
                tick, which reaches neither a screen reader nor a reader who
                cannot tell the two greys apart.
              */}
              <span className="sr-only">
                {labels.stepOf(index + 1, steps.length)} —{" "}
                {state === "done"
                  ? labels.done
                  : state === "current"
                    ? labels.current
                    : labels.upcoming}
              </span>
            </span>

            {/*
              The connector, drawn per step rather than between them: a separate
              element between list items would be a list item that is not a
              step, which is exactly the kind of thing that makes a screen
              reader announce "8 items" for a 4-step flow.
            */}
            {!isLast && orientation === "horizontal" ? (
              <span
                aria-hidden
                className={cn(
                  "mt-[calc(var(--density-control-height-sm)/2)] h-px min-w-4 flex-1",
                  index < current ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
