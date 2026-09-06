"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * Two looks, because two page archetypes ask for different things.
 *
 * `segmented` is the default: a filled track with a raised active pill. It reads
 * as a control, which is what a small in-card switch (Tài khoản / Mật khẩu)
 * should be.
 *
 * `underline` is the object-page strip — a full-width rule with the active label
 * marked by a bar under it. It reads as navigation between sections of one
 * record rather than as a control that changes a value, and it survives five or
 * six labels where a segmented track runs out of room.
 *
 * The variant is declared once on `Tabs` and inherited through context, so the
 * list and every trigger stay in agreement. Passing it directly to `TabsList` or
 * `TabsTrigger` still works for a tree that does not own its root.
 */
type TabsVariant = "segmented" | "underline";

const TabsVariantContext = React.createContext<TabsVariant>("segmented");

function Tabs({
  className,
  variant = "segmented",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  /** `segmented` (default) or the object-page `underline` strip. */
  variant?: TabsVariant;
}) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-variant={variant}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  const inherited = React.useContext(TabsVariantContext);
  const resolved = variant ?? inherited;

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={resolved}
      className={cn(
        resolved === "underline"
          ? "border-border text-muted-foreground inline-flex w-full items-center justify-start gap-0.5 border-b"
          : "bg-muted text-muted-foreground inline-flex h-[var(--density-control-height)] w-fit items-center justify-center rounded-lg p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { variant?: TabsVariant }) {
  const inherited = React.useContext(TabsVariantContext);
  const resolved = variant ?? inherited;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant={resolved}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        resolved === "underline"
          ? // The bottom border is on the resting state too, so the active tab
            // does not shift the label up by two pixels when it is selected.
            "text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary -mb-px border-b-2 border-transparent px-3 py-2 data-[state=active]:font-semibold"
          : "text-foreground dark:text-muted-foreground h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-2 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
