"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Kích thước</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm leading-none font-medium">Kích thước</h4>
          <p className="text-muted-foreground text-sm">
            Đặt kích thước chiều rộng và chiều cao cho lớp phủ.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
