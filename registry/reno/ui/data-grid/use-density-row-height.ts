"use client";

import * as React from "react";

/**
 * Read `--density-row-height` from the live element rather than hardcoding it,
 * so switching theme preset re-measures the virtualizer instead of leaving rows
 * at the previous preset's height.
 */
export function useDensityRowHeight(element: HTMLElement | null): number {
  const [height, setHeight] = React.useState(44);

  React.useEffect(() => {
    const el = element;
    if (!el) return;
    const read = () => {
      const value = getComputedStyle(el).getPropertyValue("--density-row-height").trim();
      if (!value) return;
      // Values are authored in rem; convert against the root font size.
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const px = value.endsWith("rem") ? parseFloat(value) * rootPx : parseFloat(value);
      if (Number.isFinite(px) && px > 0) setHeight(px);
    };
    read();

    // The preset can change at runtime (theme switcher), which changes the token.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-preset", "style"],
    });
    return () => observer.disconnect();
  }, [element]);

  return height;
}
