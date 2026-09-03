"use client";

import * as React from "react";

export type ColorMode = "light" | "dark";

const STORAGE_KEY = "reno-ui-docs-theme";
const DEFAULT_MODE: ColorMode = "light";

/**
 * Light or dark, and nothing else.
 *
 * This used to carry a theme preset as well — four domain names the docs site
 * and showcase switched between. The presets are gone (2026-09-03): naming
 * themes after our own domains asked a visitor to pick one of ours, when reno
 * ships one theme and a panel for branding it. What is left is the colour mode,
 * which is a reader's preference rather than a product decision.
 */

/**
 * Runs before React hydrates so <html> already carries the right mode on first
 * paint. Without it every reload flashes light, which makes the theming page
 * useless for judging colours.
 */
const NO_FLASH_SCRIPT = `
try {
  var s = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
  var m = s.mode || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", m === "dark");
} catch (e) {}
`;

/**
 * The <html> element is the source of truth, not React state.
 *
 * The no-flash script writes it before hydration, so mirroring it into
 * `useState` would mean rendering the wrong value first and correcting it in an
 * effect. `useSyncExternalStore` reads the DOM directly instead, which keeps the
 * toggle honest about what is actually applied.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function readSnapshot(): ColorMode {
  if (typeof document === "undefined") return DEFAULT_MODE;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function persist(mode: ColorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }));
  } catch {
    // Private browsing or blocked storage — theming still works for this page
    // view, it just will not survive a reload.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      {children}
    </>
  );
}

export function useTheme() {
  const mode = React.useSyncExternalStore(subscribe, readSnapshot, () => DEFAULT_MODE);

  const setMode = React.useCallback((next: ColorMode) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    persist(next);
    emit();
  }, []);

  return { mode, setMode };
}
