import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Plain `<nav>`/`<a>` pagination, no `next/link` dependency — `PaginationLink`
 * takes `asChild` the same way `Button` does. All visible copy is Vietnamese
 * by default and overridable via props, per reno's no-i18n-library rule.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-[var(--density-gap)]", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  asChild?: boolean;
  size?: VariantSize;
} & React.ComponentProps<"a">;

type VariantSize = NonNullable<Parameters<typeof buttonVariants>[0]>["size"];

function PaginationLink({
  className,
  isActive,
  size = "icon",
  asChild = false,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), className)}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = "Trước",
  ariaLabel = "Trang trước",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string; ariaLabel?: string }) {
  return (
    <PaginationLink
      aria-label={ariaLabel}
      size="default"
      className={cn("gap-1 px-[calc(var(--density-control-px)*0.75)]", className)}
      {...props}
    >
      <ChevronLeft />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Sau",
  ariaLabel = "Trang sau",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string; ariaLabel?: string }) {
  return (
    <PaginationLink
      aria-label={ariaLabel}
      size="default"
      className={cn("gap-1 px-[calc(var(--density-control-px)*0.75)]", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRight />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  label = "Thêm trang",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-[var(--density-control-height)] items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
