"use client";

import * as React from "react";
import { DownloadIcon, MailIcon, Trash2Icon } from "lucide-react";

import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";

export default function BulkActionBarDemo() {
  const [count, setCount] = React.useState(10);
  const [all, setAll] = React.useState(false);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <BulkActionBar
        count={all ? 240 : count}
        noun="người"
        pageFullySelected
        matchingTotal={240}
        allMatchingSelected={all}
        onSelectAllMatching={() => setAll(true)}
        onClear={() => {
          setCount(0);
          setAll(false);
        }}
      >
        <Button variant="outline" size="sm">
          <MailIcon />
          Gửi email
        </Button>
        <Button variant="outline" size="sm">
          <DownloadIcon />
          Xuất
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2Icon />
          Xóa
        </Button>
      </BulkActionBar>
      {count === 0 ? (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setCount(10)}>
          Chọn lại 10 dòng
        </Button>
      ) : null}
    </div>
  );
}
