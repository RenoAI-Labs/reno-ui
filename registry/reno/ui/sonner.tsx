"use client";

import type * as React from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

/**
 * reno stays framework-neutral, so this wraps sonner directly instead of
 * depending on next-themes. Pass `theme` explicitly if the host app tracks
 * it; defaults to "system" like sonner itself. Colours are wired to the
 * semantic tokens via sonner's CSS-variable styling API.
 */
function Toaster({ theme = "system", className, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      data-slot="toaster"
      theme={theme}
      className={cn("toaster group", className)}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--border)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--warning)",
          "--warning-border": "var(--border)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--info)",
          "--info-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
