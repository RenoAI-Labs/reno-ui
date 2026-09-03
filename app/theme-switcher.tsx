"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRESET_NAMES, useTheme, type PresetName } from "@/app/theme-provider";


export const PRESET_LABELS: Record<PresetName, string> = {
  elearning: "E-learning",
  admin: "Admin",
  erp: "ERP",
  cms: "CMS",
};

/**
 * Light/dark on its own.
 *
 * Split out because the showcase needs the mode toggle without the preset row:
 * there, choosing a theme happens inside the brand panel, where a preset is one
 * starting point among the knobs rather than the only way to change anything.
 */
export function ModeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
    >
      {mode === "dark" ? <Moon /> : <Sun />}
    </Button>
  );
}

/** Preset row on its own, for the docs pages. */
export function PresetSwitcher() {
  const { preset, setPreset } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme preset"
      className="flex items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      {PRESET_NAMES.map((name) => (
        <Button
          key={name}
          role="radio"
          aria-checked={preset === name}
          size="sm"
          variant={preset === name ? "default" : "ghost"}
          onClick={() => setPreset(name)}
        >
          {PRESET_LABELS[name]}
        </Button>
      ))}
    </div>
  );
}

/**
 * The daily driver for building components: flip preset and colour mode and see
 * every demo on the page re-theme. If a component hardcodes a colour or a fixed
 * height, it stops matching here first.
 */
export function ThemeSwitcher() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PresetSwitcher />
      <ModeToggle />
    </div>
  );
}
