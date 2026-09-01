"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Di chuột vào đây</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Thêm vào danh sách yêu thích</p>
      </TooltipContent>
    </Tooltip>
  );
}
