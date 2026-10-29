"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarDemo() {
  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
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
      {/*
        shape="logo": a brand mark for a site header or footer. The height comes
        from the size's density token and the width from the logo. Without an
        image (or until it loads) the fallback shows the text wordmark.
      */}
      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        <Avatar shape="logo">
          <AvatarImage src="https://github.com/shadcn.png" alt="Logo Reno" />
          <AvatarFallback>Reno</AvatarFallback>
        </Avatar>
        <Avatar shape="logo" size="sm">
          <AvatarFallback>Reno</AvatarFallback>
        </Avatar>
        <Avatar shape="logo" size="lg">
          <AvatarFallback>Reno</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
