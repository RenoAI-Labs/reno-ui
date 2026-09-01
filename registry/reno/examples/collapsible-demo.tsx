"use client";

import { useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function CollapsibleDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm">
      <div className="flex items-center justify-between gap-[var(--density-gap)]">
        <h4 className="text-sm font-medium">3 dự án đang mở</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon">
            <ChevronsUpDownIcon />
            <span className="sr-only">Thu gọn / mở rộng</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="text-muted-foreground rounded-md border px-4 py-2 text-sm">reno-ui</div>
      <CollapsibleContent className="space-y-2">
        <div className="text-muted-foreground rounded-md border px-4 py-2 text-sm">reno-erp</div>
        <div className="text-muted-foreground rounded-md border px-4 py-2 text-sm">reno-cms</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
