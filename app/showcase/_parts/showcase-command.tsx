"use client";

import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_GROUPS } from "./showcase-nav";

/**
 * ⌘K palette over the same navigation model the sidebar renders.
 *
 * `open` is lifted so the sidebar's search button and the keyboard shortcut both
 * drive one dialog rather than two that can end up both open.
 */
export function ShowcaseCommand({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (key: string) => void;
}) {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tìm nhanh"
      description="Tìm màn hình, nhân viên hoặc tài liệu"
    >
      <CommandInput placeholder="Nhập để tìm màn hình…" />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.key}
                value={item.label}
                onSelect={() => {
                  onSelect(item.key);
                  onOpenChange(false);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.badge ? <CommandShortcut>{item.badge}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
