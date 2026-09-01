"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Khoá học</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[16rem] gap-2 p-2">
              <li>
                <NavigationMenuLink href="/khoa-hoc/lap-trinh-web">
                  <div className="text-sm font-medium">Lập trình web</div>
                  <div className="text-sm text-muted-foreground">
                    Khoá học nền tảng cho người mới bắt đầu.
                  </div>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="/khoa-hoc/thiet-ke-uiux">
                  <div className="text-sm font-medium">Thiết kế UI/UX</div>
                  <div className="text-sm text-muted-foreground">
                    Nguyên tắc thiết kế giao diện và trải nghiệm.
                  </div>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/gioi-thieu">Giới thiệu</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
