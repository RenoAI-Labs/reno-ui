"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * True below `MOBILE_BREAKPOINT`px. Backs `Sidebar`'s mobile/desktop split via
 * `matchMedia`, so it reacts to viewport resizes without a manual listener.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
