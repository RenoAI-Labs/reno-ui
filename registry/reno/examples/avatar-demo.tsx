"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="Ảnh đại diện" />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Ảnh đại diện" />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      {/*
        Fallback state. Shown by omitting the image rather than pointing at a
        deliberately broken URL: the broken URL worked, but left a permanent 404
        in the console of a public docs site on every page that renders this demo.
      */}
      <Avatar size="lg">
        <AvatarFallback>BC</AvatarFallback>
      </Avatar>
    </div>
  );
}
