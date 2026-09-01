"use client";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

export default function MenubarDemo() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Tệp</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Tạo mới <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Lưu <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem variant="destructive">Xoá</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Xem</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>Hiện thanh công cụ</MenubarCheckboxItem>
          <MenubarCheckboxItem>Hiện thanh trạng thái</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
