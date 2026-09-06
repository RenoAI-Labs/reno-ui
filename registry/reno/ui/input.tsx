import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Height and padding read `--density-*` rather than a fixed Tailwind size, so
 * the same input renders compact under ERP and roomy under e-learning.
 *
 * A field can also be sized apart from a button. `--density-control-height` and
 * `--density-control-px` are one number shared by every control, which is right
 * until a design gives the text field a tighter box than the button beside it —
 * a common enough call that the only way out was patching this file. The two
 * `--density-input-*` knobs override just this component and fall back to the
 * shared control values, so a theme that sets neither is unchanged.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-[var(--density-input-height,var(--density-control-height))] w-full min-w-0 rounded-md border bg-transparent px-[var(--density-input-px,var(--density-control-px))] py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
