"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Sizes read the same density tokens as `Button`, so an avatar next to a
 * default-size control lines up under every preset without a size lookup
 * table.
 *
 * `shape` picks what the size token drives:
 * - `circle` (default): a round, square-sized portrait — the classic avatar.
 * - `logo`: a brand mark. Only the height comes from the density token; the
 *   width follows the logo image (or the text wordmark in the fallback), and
 *   nothing is rounded or cropped. Radix shows the fallback until, or unless,
 *   the image loads, so a missing logo degrades to the wordmark rather than a
 *   broken image.
 */
const avatarVariants = cva("relative flex shrink-0 overflow-hidden", {
  variants: {
    shape: {
      circle: "rounded-full",
      logo: "w-fit",
    },
    size: {
      sm: "",
      default: "",
      lg: "",
    },
  },
  compoundVariants: [
    { shape: "circle", size: "sm", className: "size-[var(--density-control-height-sm)]" },
    { shape: "circle", size: "default", className: "size-[var(--density-control-height)]" },
    { shape: "circle", size: "lg", className: "size-[var(--density-control-height-lg)]" },
    { shape: "logo", size: "sm", className: "h-[var(--density-control-height-sm)]" },
    { shape: "logo", size: "default", className: "h-[var(--density-control-height)]" },
    { shape: "logo", size: "lg", className: "h-[var(--density-control-height-lg)]" },
  ],
  defaultVariants: {
    shape: "circle",
    size: "default",
  },
});

type AvatarShape = NonNullable<VariantProps<typeof avatarVariants>["shape"]>;

/** The root's shape, so the image and fallback match it without repeating the prop. */
const AvatarShapeContext = React.createContext<AvatarShape>("circle");

function Avatar({
  className,
  size,
  shape,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>) {
  // `null` falls back to the default like `undefined`; compound variants
  // would otherwise see `null` and match no size.
  const resolvedShape = shape ?? "circle";
  const resolvedSize = size ?? "default";

  return (
    <AvatarShapeContext.Provider value={resolvedShape}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-shape={resolvedShape}
        className={cn(avatarVariants({ shape: resolvedShape, size: resolvedSize, className }))}
        {...props}
      />
    </AvatarShapeContext.Provider>
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const shape = React.useContext(AvatarShapeContext);

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        shape === "logo" ? "h-full w-auto object-contain" : "aspect-square size-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const shape = React.useContext(AvatarShapeContext);

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        shape === "logo"
          ? "flex h-full items-center bg-transparent text-sm font-semibold whitespace-nowrap text-foreground"
          : "flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
