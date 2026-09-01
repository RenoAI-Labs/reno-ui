import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `min-h` is a multiple of the density control height rather than a fixed
 * rem value, so the default size still scales with the active preset.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive field-sizing-content flex min-h-[calc(var(--density-control-height)*2.5)] w-full rounded-md border bg-transparent px-[var(--density-control-px)] py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
