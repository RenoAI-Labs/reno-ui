import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * `appearance` is the same axis `Badge` carries and means the same thing.
 * `solid` — the default, and what every existing call site keeps — is a card
 * surface with the status colour on the text alone. `soft` tints the surface and
 * the border to match, which is the banner an operator console uses when the
 * alert has to be seen from across the page rather than read on approach.
 *
 * The soft colours are the contrast-solved `--*-soft` token pairs, not an alpha
 * wash: see the note in `badge.tsx` and `solveSoftPair` in
 * scripts/generate-scale.mjs.
 *
 * The description used to be `text-destructive/90` on a `bg-card` surface. In a
 * dark theme that is a translucent light red over a dark card, and it landed at
 * 4.2:1 — under the 4.5:1 that SC 1.4.3 asks of body text, in the one variant
 * whose whole job is to be read. It now carries the full status colour, which is
 * already solved against `--card` by scripts/check-contrast.mjs. The visual step
 * between title and description survives as weight, which is what carried it
 * anyway.
 *
 * `size="sm"` is the compact banner: same anatomy, one step down on radius,
 * padding, gap and text. Screens ported from a dense design (an operations
 * console, an ERP grid page) need it; it is a size, not a new component.
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 border has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      size: {
        default: "rounded-lg px-4 py-3 text-sm has-[>svg]:gap-x-3",
        sm: "rounded-md px-3 py-2.5 text-[0.8125rem] has-[>svg]:gap-x-2.5",
      },
      appearance: {
        solid: "",
        soft: "",
      },
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card *:data-[slot=alert-description]:text-destructive",
        success:
          "text-success bg-card *:data-[slot=alert-description]:text-success",
        warning:
          "text-warning bg-card *:data-[slot=alert-description]:text-warning",
        info: "text-info bg-card *:data-[slot=alert-description]:text-info",
      },
    },
    compoundVariants: [
      {
        appearance: "soft",
        variant: "default",
        class:
          "bg-muted text-foreground border-border *:data-[slot=alert-description]:text-muted-foreground",
      },
      {
        appearance: "soft",
        variant: "destructive",
        class:
          "bg-destructive-soft text-destructive-soft-foreground border-destructive/35 *:data-[slot=alert-description]:text-destructive-soft-foreground",
      },
      {
        appearance: "soft",
        variant: "success",
        class:
          "bg-success-soft text-success-soft-foreground border-success/35 *:data-[slot=alert-description]:text-success-soft-foreground",
      },
      {
        appearance: "soft",
        variant: "warning",
        class:
          "bg-warning-soft text-warning-soft-foreground border-warning/40 *:data-[slot=alert-description]:text-warning-soft-foreground",
      },
      {
        appearance: "soft",
        variant: "info",
        class:
          "bg-info-soft text-info-soft-foreground border-info/35 *:data-[slot=alert-description]:text-info-soft-foreground",
      },
    ],
    defaultVariants: {
      variant: "default",
      appearance: "solid",
      size: "default",
    },
  },
);

function Alert({
  className,
  variant,
  appearance,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, appearance, size }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 [font-size:inherit] [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
