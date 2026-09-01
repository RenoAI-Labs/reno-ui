"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copyable code snippet. Docs pages are useless if the install command has to be
 * retyped by hand, so every snippet carries a copy button.
 */
export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard is unavailable over plain HTTP and in some embedded browsers.
      // The code is selectable either way, so a failure needs no error state.
    }
  }

  return (
    <div className={cn("relative rounded-lg border border-border bg-card", className)}>
      <pre className="overflow-x-auto p-4 pr-14 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2"
        onClick={copy}
        aria-label={copied ? "Đã sao chép" : "Sao chép"}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}
