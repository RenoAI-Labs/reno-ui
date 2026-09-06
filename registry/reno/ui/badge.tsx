import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * `shape` exists because the two looks are not interchangeable and neither is
 * wrong. A rounded rectangle reads as a label attached to the row it sits in; a
 * pill reads as a standalone status token. Design systems pick one and stay with
 * it, so it has to be settable without forking the file — the previous way was
 * `className="rounded-full"` at every call site, which misses the badges the
 * library renders itself (the DataGrid filter chip, the StatCard delta).
 *
 * Weight reads `--density-font-weight` for the same reason `Button` does; the
 * fallback is the 500 that was hard-coded here before.
 *
 * `appearance` is the second axis, and it is orthogonal to `variant`: `variant`
 * says WHAT the badge means (danger, success, brand), `appearance` says how loud
 * it says it. `solid` is the filled chip with white text and stays the default,
 * so nothing that already renders a Badge changes. `soft` is the pale-tint chip
 * with same-hue text that status tables and dashboards use, where twenty solid
 * chips on one screen turn into a traffic light nobody can read.
 *
 * Soft is a token pair (`--success-soft` / `--success-soft-foreground`), not
 * `bg-success/10`: an alpha wash of the solid colour keeps the solid
 * foreground, and that foreground was solved against the PAGE, not against the
 * wash. See `solveSoftPair` in scripts/generate-scale.mjs — every soft pair is
 * contrast-solved on its own and gated by scripts/check-contrast.mjs.
 *
 * `secondary` and `outline` are already low-emphasis, so `soft` is a deliberate
 * no-op on them rather than a third look nobody asked for.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2 py-0.5 text-xs font-[weight:var(--density-font-weight,500)] whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      shape: {
        rounded: "rounded-md",
        pill: "rounded-full",
      },
      appearance: {
        solid: "",
        soft: "",
      },
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-success text-success-foreground [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground [a&]:hover:bg-info/90",
      },
    },
    compoundVariants: [
      {
        appearance: "soft",
        variant: "default",
        class:
          "border-transparent bg-primary-soft text-primary-soft-foreground [a&]:hover:bg-primary-soft/70",
      },
      {
        appearance: "soft",
        variant: "destructive",
        class:
          "border-transparent bg-destructive-soft text-destructive-soft-foreground [a&]:hover:bg-destructive-soft/70 focus-visible:ring-destructive/20",
      },
      {
        appearance: "soft",
        variant: "success",
        class:
          "border-transparent bg-success-soft text-success-soft-foreground [a&]:hover:bg-success-soft/70",
      },
      {
        appearance: "soft",
        variant: "warning",
        class:
          "border-transparent bg-warning-soft text-warning-soft-foreground [a&]:hover:bg-warning-soft/70",
      },
      {
        appearance: "soft",
        variant: "info",
        class:
          "border-transparent bg-info-soft text-info-soft-foreground [a&]:hover:bg-info-soft/70",
      },
    ],
    defaultVariants: {
      variant: "default",
      shape: "rounded",
      appearance: "solid",
    },
  },
);

function Badge({
  className,
  variant,
  shape,
  appearance,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Render the child element instead of a `<span>`, keeping the styling. */
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape, appearance }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
