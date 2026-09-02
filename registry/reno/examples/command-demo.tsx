"use client";

import {
  CalendarIcon,
  FaceSlightlySmilingIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export default function CommandDemo() {
  return (
    <Command className="border-border max-w-md rounded-lg border shadow-md">
      <CommandInput placeholder="Nhập lệnh hoặc tìm kiếm..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        <CommandGroup heading="Gợi ý">
          <CommandItem>
            <CalendarIcon />
            Lịch làm việc
          </CommandItem>
          <CommandItem>
            <FaceSlightlySmilingIcon />
            Danh bạ
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Cài đặt">
          <CommandItem>
            <UserIcon />
            Hồ sơ
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon />
            Cài đặt hệ thống
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
