"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

/**
 * react-resizable-panels v4 renamed its exports (PanelGroup/PanelResizeHandle
 * became Group/Separator) and `direction` became `orientation`. We re-export
 * under the familiar Resizable* names so consumers keep the shadcn-shaped API.
 */
function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      orientation={orientation}
      className={cn("flex h-full w-full", orientation === "vertical" && "flex-col", className)}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  orientation = "horizontal",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Separator>, "orientation"> & {
  withHandle?: boolean;
  /** Must match the parent ResizablePanelGroup's orientation. */
  orientation?: "horizontal" | "vertical";
}) {
  const isVertical = orientation === "vertical";

  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex items-center justify-center focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none",
        isVertical ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex size-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className={cn("size-2.5", isVertical && "rotate-90")} />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
