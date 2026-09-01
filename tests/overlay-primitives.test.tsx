import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * jsdom implements neither ResizeObserver nor the pointer-capture surface
 * Radix's Popper/Presence machinery expects, and vaul additionally calls
 * `scrollIntoView`/measures layout on mount. These stubs are scoped to this
 * test file only — none of it belongs in the shared test setup, since most
 * other batches never render a positioned overlay.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver ??= ResizeObserverStub;
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

describe("Dialog", () => {
  it("renders trigger and, once open, its content by role", () => {
    render(
      <Dialog open>
        <DialogTrigger>Mở hộp thoại</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiêu đề</DialogTitle>
            <DialogDescription>Mô tả</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    // Radix marks background content aria-hidden while a modal dialog is open,
    // so the trigger must be looked up with `hidden: true` here.
    expect(
      screen.getByRole("button", { name: "Mở hộp thoại", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Tiêu đề")).toBeInTheDocument();
  });
});

describe("Sheet", () => {
  it("opens with the requested side applied to its content", () => {
    render(
      <Sheet open>
        <SheetTrigger>Mở bảng bên</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Tiêu đề</SheetTitle>
            <SheetDescription>Mô tả</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    const content = screen.getByRole("dialog");
    expect(content).toBeInTheDocument();
    expect(content.className).toContain("left-0");
  });
});

describe("Drawer", () => {
  it("shows its content after the trigger is clicked", async () => {
    render(
      <Drawer>
        <DrawerTrigger>Mở ngăn kéo</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Tiêu đề</DrawerTitle>
            <DrawerDescription>Mô tả</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mở ngăn kéo" }));
    expect(await screen.findByText("Tiêu đề")).toBeInTheDocument();
  });
});

describe("Popover", () => {
  it("renders trigger and open content", () => {
    render(
      <Popover open>
        <PopoverTrigger>Mở popover</PopoverTrigger>
        <PopoverContent>Nội dung popover</PopoverContent>
      </Popover>,
    );
    expect(screen.getByRole("button", { name: "Mở popover" })).toBeInTheDocument();
    expect(screen.getByText("Nội dung popover")).toBeInTheDocument();
  });
});

describe("Tooltip", () => {
  it("renders the tooltip role when open", () => {
    render(
      <Tooltip open>
        <TooltipTrigger>Di chuột vào đây</TooltipTrigger>
        <TooltipContent>Gợi ý</TooltipContent>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("Gợi ý");
  });
});

describe("DropdownMenu", () => {
  it("opens and exposes menu items by role", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Mở menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Mục 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mục 1" })).toBeInTheDocument();
  });
});

describe("ContextMenu", () => {
  it("opens the menu on a right-click of the trigger area", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Khu vực chuột phải</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Sao chép</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("Khu vực chuột phải"));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sao chép" })).toBeInTheDocument();
  });
});

describe("AlertDialog", () => {
  it("opens as an alertdialog and reuses buttonVariants on its actions", () => {
    render(
      <AlertDialog open>
        <AlertDialogTrigger>Xoá</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>Không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction>Đồng ý</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    // buttonVariants() default styling — proves the action button reuses @reno/button.
    expect(screen.getByRole("button", { name: "Đồng ý" }).className).toContain("bg-primary");
  });
});

describe("HoverCard", () => {
  it("renders trigger and open content", () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>@nguyenvana</HoverCardTrigger>
        <HoverCardContent>Thông tin người dùng</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText("@nguyenvana")).toBeInTheDocument();
    expect(screen.getByText("Thông tin người dùng")).toBeInTheDocument();
  });
});

describe("Command", () => {
  it("renders the input and its items", () => {
    render(
      <Command>
        <CommandInput placeholder="Tìm kiếm" />
        <CommandList>
          <CommandEmpty>Không có kết quả</CommandEmpty>
          <CommandGroup heading="Nhóm">
            <CommandItem>Mục A</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByPlaceholderText("Tìm kiếm")).toBeInTheDocument();
    expect(screen.getByText("Mục A")).toBeInTheDocument();
  });

  it("CommandDialog composes @reno/dialog", () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Tìm kiếm" />
        <CommandList>
          <CommandItem>Mục A</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
