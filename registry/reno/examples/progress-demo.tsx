"use client";

import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";

export default function ProgressDemo() {
  const [value, setValue] = useState(20);

  useEffect(() => {
    const timeout = setTimeout(() => setValue(66), 400);
    return () => clearTimeout(timeout);
  }, []);

  return <Progress value={value} className="w-full max-w-sm" />;
}
