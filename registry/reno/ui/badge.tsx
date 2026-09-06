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
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2 py-0.5 text-xs font-[weight:var(--density-font-weight,500)] whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      shape: {
        rounded: "rounded-md",
        pill: "rounded-full",
      },
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success: "border-transparent bg-success text-success-foreground [a&]:hover:bg-success/90",
        warning: "border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground [a&]:hover:bg-info/90",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "rounded",
    },
  },
);

function Badge({
  className,
  variant,
  shape,
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
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
