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
 * whose whole job is to be read. It now carries the same colour as the title;
 * the visual step between the two survives as weight, which is what carried it
 * anyway.
 *
 * That colour is `--<role>-soft-foreground`, not `--<role>`. The two are
 * different roles and they answer to different thresholds: `--<role>` is a FILL
 * — the Badge and the impersonation banner paint it as a background and put
 * `--<role>-foreground` ink on top, so it is solved for 4.5:1 against its own
 * ink, not against the page. `--<role>-soft-foreground` is the readable INK of
 * the same role, solved for 4.5:1 against a pale surface. Every system that
 * ships both keeps them apart — Material 3 has `warning` and
 * `on-warning-container`, Radix has step 9 for the solid fill and step 11 for
 * text — because one value cannot satisfy both obligations at once.
 *
 * The generated preset here happens to satisfy both, which is why
 * `text-<role> bg-card` looked correct for as long as it did. A project that
 * overrides `--warning` with a real brand amber — the case these tokens exist
 * for — gets a fill colour, and painting it as text lands at 2.14:1 on `--card`
 * against the 4.5:1 SC 1.4.3 asks. Measured on a consuming project's theme
 * 2026-09-07: amber `hsl(38 92% 50%)` as text is 2.14:1 on `--card` and 2.03:1
 * on `--background`; its `--warning-soft-foreground` is 5.16:1 and 4.91:1. In
 * this repo's own preset the swap moves base/light by 0.13 and base/dark up by
 * about two points, so nothing visibly changes here and the bug cannot come
 * back for the next consumer.
 *
 * `size="sm"` is the compact banner: same anatomy, one step down on radius,
 * padding, gap and text. Screens ported from a dense design (an operations
 * console, an ERP grid page) need it; it is a size, not a new component.
 *
 * The icon column opens for a bare `<svg>` — the lucide glyph most call sites
 * pass — and that covers most of them. It did not cover the rest: a status dot,
 * a spinner, an avatar, a numbered pip are all `<div>`s, and an Alert built
 * around one had to restate `grid-cols-[Npx_1fr]` and the gap at every call
 * site. `AlertIcon` is that column made explicit: wrap anything in it and the
 * column opens, sized to the content rather than to a number the call site has
 * to know. `<svg>` children keep working untouched, so nothing that renders an
 * Alert today changes.
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 border has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>[data-slot=alert-icon]]:grid-cols-[auto_1fr] [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
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
          "text-destructive-soft-foreground bg-card *:data-[slot=alert-description]:text-destructive-soft-foreground",
        success:
          "text-success-soft-foreground bg-card *:data-[slot=alert-description]:text-success-soft-foreground",
        warning:
          "text-warning-soft-foreground bg-card *:data-[slot=alert-description]:text-warning-soft-foreground",
        info: "text-info-soft-foreground bg-card *:data-[slot=alert-description]:text-info-soft-foreground",
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

/**
 * The icon column, for anything that is not a bare `<svg>`.
 *
 * `w-fit` plus a grid column of `auto` is what lets an 18px dot and a 24px
 * avatar both sit in the column without either the component or the call site
 * naming a width. The `translate-y-0.5` matches what a bare `<svg>` child gets,
 * so the two paths line up against the title.
 *
 * The space to the title is a margin here, not the parent's `gap-x` the `<svg>`
 * path uses. A gap would have to be written `has-[>[data-slot=alert-icon]]:`,
 * and `:has()` takes the specificity of its argument — that selector outranks a
 * plain `gap-x-*` utility, so a call site whose design says 10px could never
 * dial it back down. `me-3` is the same 12px the `<svg>` path gets and any
 * `me-*` in `className` replaces it cleanly.
 */
function AlertIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-icon"
      aria-hidden="true"
      className={cn(
        "col-start-1 row-start-1 me-3 flex w-fit shrink-0 translate-y-0.5 items-center justify-center [&>svg]:size-4",
        className,
      )}
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

export { Alert, AlertIcon, AlertTitle, AlertDescription };
