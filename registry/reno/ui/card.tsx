import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  /**
   * Drop every built-in utility and render with `className` alone. The element,
   * `data-slot` and the children stay; the look becomes the project's.
   */
  unstyled?: boolean;
};

/**
 * Padding and gaps here are normal spacing, not density tokens — a card's
 * internal rhythm does not need to compress in ERP the way a control's height
 * does. See docs/design-tokens.md.
 *
 * `unstyled` is the escape hatch for a project whose card look already lives in
 * its own stylesheet. Tailwind utilities sit in the `utilities` layer, which is
 * ordered AFTER `@layer components`, so `rounded-xl` / `py-6` / `shadow-xs` /
 * `gap-6` beat a `.card` rule every time and no `className` can undo a radius
 * and a padding and a shadow at once. Projects were dropping `Card` entirely
 * and writing `<div class="card">`, which loses `data-slot` and the shared
 * anatomy with it. With `unstyled` the component contributes the element, the
 * slot and nothing else — every class comes from the caller.
 *
 * It is a boolean rather than a variant because a card has no variant axis to
 * put it on; `Button` spells the same idea `variant="unstyled"` because it has
 * one. The four parts that carry box measurements take the same flag; the two
 * that only carry typography do not need it, because a single-property utility
 * in `className` already wins there.
 */
function Card({ className, unstyled, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={
        unstyled
          ? cn(className)
          : cn(
              "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-xs",
              className,
            )
      }
      {...props}
    />
  );
}

function CardHeader({ className, unstyled, ...props }: CardProps) {
  return (
    <div
      data-slot="card-header"
      className={
        unstyled
          ? cn(className)
          : cn(
              "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[[data-slot=card-action]]:grid-cols-[1fr_auto] [.border-b]:pb-6",
              className,
            )
      }
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, unstyled, ...props }: CardProps) {
  return (
    <div
      data-slot="card-content"
      className={unstyled ? cn(className) : cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, unstyled, ...props }: CardProps) {
  return (
    <div
      data-slot="card-footer"
      className={
        unstyled
          ? cn(className)
          : cn("flex items-center px-6 [.border-t]:pt-6", className)
      }
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
