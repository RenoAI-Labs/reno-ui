"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/theme-provider";

/**
 * Light or dark.
 *
 * This file used to hold a preset row as well — four buttons named after our
 * own domains. They are gone (2026-09-03): reno ships one theme, and branding
 * it is what the showcase's brand panel is for. Flipping the colour mode stays,
 * because it is the check that catches a component which hardcoded a colour —
 * that component stops matching here first.
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
