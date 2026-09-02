"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

/**
 * A set of toggles that behave as one control — single- or multiple-select.
 *
 * `spacing` is what makes this cover both shapes real projects keep rewriting:
 * `spacing={0}` (the default) joins the items into a segmented control with
 * shared borders and rounded ends, and any positive value separates them into
 * independent buttons. Projects have been shipping two or three near-identical
 * components for those two looks.
 */
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & { spacing?: number }
>({
  size: "default",
  variant: "default",
  spacing: 0,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  style,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    /** Gap between items, in Tailwind spacing steps. 0 joins them into a segmented control. */
    spacing?: number;
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      // `style` is merged rather than spread past: a consumer passing their own
      // style would otherwise drop the gap variable and get spacing={n} with no
      // gap and no error.
      style={{ "--toggle-group-gap": spacing, ...style } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--toggle-group-gap))] rounded-md data-[spacing=0]:data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        // Group items are wider than a standalone Toggle and share one padding
        // across sizes — upstream hardcodes `px-3` here for the same reason: a
        // segmented control reads as one surface, so uneven segments look
        // broken. reno's version at least scales with the preset.
        "w-auto min-w-0 shrink-0 px-[calc(var(--density-control-px)*0.75)] focus:z-10 focus-visible:z-10",
        // Joined mode: one continuous surface. Only the outer corners round, and
        // the shared edge is drawn once rather than twice.
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
