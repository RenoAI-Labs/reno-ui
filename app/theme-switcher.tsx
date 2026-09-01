"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRESET_NAMES, useTheme, type PresetName } from "@/app/theme-provider";

const PRESET_LABELS: Record<PresetName, string> = {
  elearning: "E-learning",
  admin: "Admin",
  erp: "ERP",
  cms: "CMS",
};

/**
 * The daily driver for building components: flip preset and colour mode and see
 * every demo on the page re-theme. If a component hardcodes a colour or a fixed
 * height, it stops matching here first.
 */
export function ThemeSwitcher() {
  const { preset, mode, setPreset, setMode } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-2">
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

      <Button
        size="icon"
        variant="outline"
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
      >
        {mode === "dark" ? <Moon /> : <Sun />}
      </Button>
    </div>
  );
}
