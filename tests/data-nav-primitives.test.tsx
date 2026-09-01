import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// jsdom has no ResizeObserver, which Radix's Menubar/NavigationMenu collision
// logic touches during layout. Stub it locally rather than in the shared
// tests/setup.ts, which other batches' suites also load.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

describe("Table", () => {
  it("renders rows and cells", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>An</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("An")).toBeInTheDocument();
  });

  it("reads density tokens for row height and cell padding", () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell data-testid="cell">An</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByTestId("row").className).toContain("h-[var(--density-row-height)]");
    expect(screen.getByTestId("cell").className).toContain(
      "px-[var(--density-cell-padding-x)]",
    );
    expect(screen.getByTestId("cell").className).toContain(
      "py-[var(--density-cell-padding-y)]",
    );
  });
});

describe("Avatar", () => {
  it("renders the fallback when no image loads", () => {
    render(
      <Avatar>
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AN")).toBeInTheDocument();
  });
});

describe("Calendar", () => {
  it("renders a grid of days", () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 0, 1)} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("renders default Vietnamese labels", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByLabelText("Trang trước")).toBeInTheDocument();
    expect(screen.getByLabelText("Trang sau")).toBeInTheDocument();
  });

  it("renders overridden labels when label props are passed", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" text="Quay lại" ariaLabel="Về trang trước" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" text="Tiếp theo" ariaLabel="Đến trang sau" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByLabelText("Về trang trước")).toBeInTheDocument();
    expect(screen.getByText("Quay lại")).toBeInTheDocument();
    expect(screen.getByLabelText("Đến trang sau")).toBeInTheDocument();
    expect(screen.getByText("Tiếp theo")).toBeInTheDocument();
  });
});

describe("Breadcrumb", () => {
  it("renders links and the current page", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Hiện tại</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Trang chủ" })).toBeInTheDocument();
    expect(screen.getByText("Hiện tại")).toHaveAttribute("aria-current", "page");
  });
});

describe("NavigationMenu", () => {
  it("renders top-level links", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/gioi-thieu">Giới thiệu</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByRole("link", { name: "Giới thiệu" })).toBeInTheDocument();
  });
});

describe("Menubar", () => {
  it("renders a menu trigger", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Tệp</MenubarTrigger>
          <MenubarContent>Nội dung</MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("Tệp")).toBeInTheDocument();
  });
});
