"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The site's brand mark for a header or footer: a logo with the brand name as
 * a text wordmark, linked home.
 *
 * `variant` says which parts show. `default` is logo plus wordmark, `logo` is
 * the mark alone (a narrow header, a mobile bar), `wordmark` is the name alone.
 * The wordmark is also the fallback: with no `logo`, or a `logo` URL that fails
 * to load, the name renders instead, so a missing asset never leaves an empty
 * link in the header.
 *
 * The logo is free-width — wordmark logos are wide, marks are square — and only
 * its height is fixed, read from the same density tokens as `Button`, so the
 * brand lines up with the header's controls under every preset.
 *
 * `asChild` hands the link to the project's router: pass `<Link href="/" />`
 * as the only child and the logo and wordmark render inside it. reno-ui itself
 * never imports a router.
 */
export type SiteBrandLabels = {
  /** Accessible name of the link; the brand name comes first so it matches what is seen. */
  home: (wordmark: string) => string;
};

export const defaultSiteBrandLabels: SiteBrandLabels = {
  home: (wordmark) => `${wordmark} — Trang chủ`,
};

const siteBrandVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight whitespace-nowrap text-foreground outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "",
        logo: "",
        wordmark: "",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const siteBrandLogoVariants = cva(
  "block w-auto max-w-none shrink-0 object-contain [&>img]:h-full [&>img]:w-auto [&>svg]:h-full [&>svg]:w-auto",
  {
    variants: {
      size: {
        sm: "h-[var(--density-control-height-sm)]",
        default: "h-[var(--density-control-height)]",
        lg: "h-[var(--density-control-height-lg)]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function SiteBrand({
  className,
  variant,
  size,
  href = "/",
  asChild = false,
  logo,
  wordmark,
  labels: labelOverrides,
  children,
  ...props
}: React.ComponentProps<"a"> &
  VariantProps<typeof siteBrandVariants> & {
    /** Where the brand links. Ignored with `asChild`, where the child carries it. */
    href?: string;
    /** Render the single child element (a router `Link`) as the link, keeping the styling. */
    asChild?: boolean;
    /**
     * An image URL, or an element such as an inline SVG component. A URL that
     * fails to load falls back to the wordmark.
     */
    logo?: string | React.ReactElement;
    /** The brand name: the visible wordmark, the fallback and the accessible name. */
    wordmark: string;
    labels?: Partial<SiteBrandLabels>;
  }) {
  const labels = React.useMemo(
    () => ({ ...defaultSiteBrandLabels, ...labelOverrides }),
    [labelOverrides],
  );

  const logoSrc = typeof logo === "string" ? logo : null;
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const logoFailed = logoSrc !== null && failedSrc === logoSrc;

  const showLogo = variant !== "wordmark" && Boolean(logo) && !logoFailed;
  const showWordmark = variant !== "logo" || !showLogo;
  const renderImage = showLogo && logoSrc !== null;

  const imageRef = React.useRef<HTMLImageElement>(null);

  // A server-rendered image can fail before React hydrates, and then its
  // `onError` never fires. `decode()` rejects for an image that is already
  // broken, and resolves for one that loaded, SVGs without intrinsic size
  // included — which a `naturalWidth === 0` test gets wrong.
  React.useEffect(() => {
    const image = imageRef.current;
    if (!renderImage || logoSrc === null || !image || typeof image.decode !== "function") return;
    let active = true;
    image.decode().catch(() => {
      if (active) setFailedSrc(logoSrc);
    });
    return () => {
      active = false;
    };
  }, [renderImage, logoSrc]);

  const content = (
    <>
      {renderImage && logoSrc !== null ? (
        <>
          {/*
            A plain `<img>`, not `next/image`: primitives here must run in any
            React app, and the boundary check rejects a `next/*` import in
            `registry/reno/ui`.
          */}
          {/* eslint-disable-next-line */}
          <img
            ref={imageRef}
            data-slot="site-brand-logo"
            src={logoSrc}
            alt={showWordmark ? "" : wordmark}
            onError={() => setFailedSrc(logoSrc)}
            className={siteBrandLogoVariants({ size })}
          />
        </>
      ) : null}
      {showLogo && logoSrc === null ? (
        <span data-slot="site-brand-logo" aria-hidden className={siteBrandLogoVariants({ size })}>
          {logo}
        </span>
      ) : null}
      {showWordmark ? (
        <span data-slot="site-brand-wordmark" className="min-w-0 truncate">
          {wordmark}
        </span>
      ) : null}
    </>
  );

  const shared = {
    "data-slot": "site-brand",
    "aria-label": labels.home(wordmark),
    className: cn(siteBrandVariants({ variant, size }), className),
  };

  if (asChild) {
    return (
      <Slot {...shared} {...props}>
        <Slottable>{children}</Slottable>
        {content}
      </Slot>
    );
  }

  return (
    <a {...shared} href={href} {...props}>
      {content}
    </a>
  );
}

export { SiteBrand, siteBrandVariants };
