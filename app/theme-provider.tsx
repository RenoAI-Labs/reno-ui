"use client";

import * as React from "react";

export const PRESET_NAMES = ["elearning", "admin", "erp", "cms"] as const;
export type PresetName = (typeof PRESET_NAMES)[number];
export type ColorMode = "light" | "dark";

const STORAGE_KEY = "reno-ui-docs-theme";
const DEFAULT_PRESET: PresetName = "admin";
const DEFAULT_MODE: ColorMode = "light";

/**
 * Runs before React hydrates so <html> already carries the right preset and mode
 * on first paint. Without it every reload flashes the default theme, which makes
 * the theming page useless for judging colours.
 */
const NO_FLASH_SCRIPT = `
try {
  var s = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
  var p = s.preset || ${JSON.stringify(DEFAULT_PRESET)};
  var m = s.mode || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.preset = p;
  document.documentElement.classList.toggle("dark", m === "dark");
} catch (e) {}
`;

/**
 * The <html> element is the source of truth, not React state.
 *
 * The no-flash script writes it before hydration, so mirroring it into
 * `useState` would mean rendering the wrong value first and correcting it in an
 * effect. `useSyncExternalStore` reads the DOM directly instead, which keeps the
 * switcher honest about what is actually applied.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function readSnapshot(): string {
  if (typeof document === "undefined") return `${DEFAULT_PRESET}:${DEFAULT_MODE}`;
  const el = document.documentElement;
  const preset = el.dataset.preset ?? DEFAULT_PRESET;
  const mode = el.classList.contains("dark") ? "dark" : "light";
  return `${preset}:${mode}`;
}

const SERVER_SNAPSHOT = `${DEFAULT_PRESET}:${DEFAULT_MODE}`;

function persist(preset: PresetName, mode: ColorMode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, mode }));
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
  const snapshot = React.useSyncExternalStore(
    subscribe,
    readSnapshot,
    () => SERVER_SNAPSHOT,
  );

  const [rawPreset, rawMode] = snapshot.split(":");
  const preset = (PRESET_NAMES as readonly string[]).includes(rawPreset)
    ? (rawPreset as PresetName)
    : DEFAULT_PRESET;
  const mode: ColorMode = rawMode === "dark" ? "dark" : "light";

  const setPreset = React.useCallback(
    (next: PresetName) => {
      document.documentElement.dataset.preset = next;
      persist(next, readSnapshot().endsWith("dark") ? "dark" : "light");
      emit();
    },
    [],
  );

  const setMode = React.useCallback((next: ColorMode) => {
    const el = document.documentElement;
    el.classList.toggle("dark", next === "dark");
    persist((el.dataset.preset as PresetName) ?? DEFAULT_PRESET, next);
    emit();
  }, []);

  return { preset, mode, setPreset, setMode };
}
