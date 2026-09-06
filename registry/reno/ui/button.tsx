import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Sizes read `--density-*` rather than fixed Tailwind heights. That is what lets
 * the same button render 1.75rem tall under the ERP preset and 2.75rem tall
 * under e-learning with no code change — see docs/design-tokens.md.
 *
 * The label follows the same rule. `--density-font-size` was documented as "base
 * UI text size" from the start but nothing read it: every control hard-coded
 * `text-sm`, so a preset could shrink the row height and the label stayed put.
 * Weight is the same story one step further — a brand whose buttons read
 * semibold had no way to say so without patching the file. Both fall back to
 * exactly what was hard-coded before (0.875rem / 500), so a theme that sets
 * neither renders byte-identical to the previous version.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-md text-[length:var(--density-font-size,0.875rem)] font-[weight:var(--density-font-weight,500)] transition-[color,box-shadow,background-color] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[var(--density-control-height)] px-[var(--density-control-px)] py-2 has-[>svg]:px-[calc(var(--density-control-px)-0.125rem)]",
        sm: "h-[var(--density-control-height-sm)] gap-1.5 rounded-md px-[calc(var(--density-control-px)*0.75)] has-[>svg]:px-[calc(var(--density-control-px)*0.5)]",
        lg: "h-[var(--density-control-height-lg)] rounded-md px-[calc(var(--density-control-px)*1.5)] has-[>svg]:px-[var(--density-control-px)]",
        icon: "size-[var(--density-control-height)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element instead of a `<button>`, keeping the styling. */
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
