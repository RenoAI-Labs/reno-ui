import * as React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Original component — no shadcn equivalent. Size reads the density tokens
 * so the same spinner scales with the active preset like every other control;
 * colour comes from `currentColor`, so it inherits the surrounding text colour.
 */
const spinnerVariants = cva(
  "inline-flex shrink-0 animate-spin items-center justify-center text-current",
  {
    variants: {
      size: {
        sm: "size-[calc(var(--density-control-height-sm)*0.5)]",
        default: "size-[calc(var(--density-control-height)*0.5)]",
        lg: "size-[calc(var(--density-control-height-lg)*0.5)]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Spinner({
  className,
  size,
  label = "Đang tải…",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof spinnerVariants> & {
    /** Screen-reader label; override for a more specific loading message. */
    label?: string;
  }) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <LoaderCircleIcon className="size-full" aria-hidden="true" />
    </span>
  );
}

export { Spinner, spinnerVariants };
