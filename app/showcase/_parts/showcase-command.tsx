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
import { ACCOUNT_PAGES, FOOTER_LINKS, NAV_GROUPS } from "./showcase-nav";

/**
 * Ctrl K palette over the same navigation model the sidebar renders.
 *
 * `open` is lifted so the header's search field and the keyboard shortcut both
 * drive one dialog rather than two that can end up both open.
 */
export function ShowcaseCommand({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (href: string) => void;
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

  const groups = [
    ...NAV_GROUPS,
    { label: "Tài khoản", items: ACCOUNT_PAGES },
    { label: "Tham khảo", items: FOOTER_LINKS },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tìm nhanh"
      description="Tìm màn hình trong showcase"
    >
      <CommandInput placeholder="Nhập để tìm màn hình…" />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.key}
                value={item.label}
                onSelect={() => {
                  onSelect(item.href);
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
