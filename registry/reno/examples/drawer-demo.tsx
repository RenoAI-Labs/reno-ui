"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Mở ngăn kéo</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Xác nhận thao tác</DrawerTitle>
          <DrawerDescription>
            Ngăn kéo phù hợp cho thao tác nhanh trên thiết bị di động.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Xác nhận</Button>
          <DrawerClose asChild>
            <Button variant="outline">Huỷ</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
