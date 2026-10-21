"use client";

import * as React from "react";

import { SaveBar } from "@/components/ui/save-bar";

export default function SaveBarDemo() {
  const [dirty, setDirty] = React.useState(2);

  return (
    <SaveBar
      dirtyCount={dirty}
      onRevert={() => setDirty(0)}
      onSave={() => setDirty(0)}
    />
  );
}
