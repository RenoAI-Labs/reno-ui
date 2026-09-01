"use client";

import * as React from "react";
import { formatHex, oklch, wcagContrast } from "culori";
import { Palette, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PRESETS,
  RAMP_STOPS,
  buildRamp,
  css,
  mk,
} from "@/registry/reno/themes/theme-presets.config.mjs";
import { useTheme } from "@/app/theme-provider";

/**
 * Pick any brand colour and re-theme the whole page.
 *
 * The ramp is built with the same `buildRamp` that generates the shipped
 * presets — imported, not reimplemented, so what you see here is a palette the
 * build could actually produce. Overriding the eleven `--reno-brand-*` variables
 * on `<html>` is enough because the semantic layer only ever references them:
 * `--primary`, `--ring` and `--sidebar-primary` are `var(--reno-brand-N)`, so
 * every component re-colours with no rebuild and no component change. That
 * indirection is the entire point of the two-tier token design, and this control
 * is the cheapest possible proof that it holds.
 */

const SWATCHES: { name: string; hex: string }[] = PRESETS.map((preset) => ({
  name: preset.title.replace("Theme ", ""),
  // Derived from the preset's own brand hue rather than written as a literal:
  // the showcase is under the same no-raw-color gate as shipped components.
  hex: formatHex(mk(0.637, preset.brand.c, preset.brand.h)) ?? "",
}));

/** Contrast floor for body text. Matches CONTRAST.text in the theme config. */
const AA_TEXT = 4.5;

function applyRamp(hex: string) {
  const parsed = oklch(hex);
  if (!parsed) return;
  const ramp = buildRamp({ h: parsed.h ?? 0, c: parsed.c ?? 0 });
  const root = document.documentElement;
  for (const { stop, color } of ramp) {
    root.style.setProperty(`--reno-brand-${stop}`, css(color));
  }
}

function clearRamp() {
  const root = document.documentElement;
  for (const stop of RAMP_STOPS) root.style.removeProperty(`--reno-brand-${stop}`);
}

export function ShowcaseBrandPicker() {
  const { preset, mode } = useTheme();
  const [custom, setCustom] = React.useState<{ preset: string; hex: string } | null>(null);
  const [contrast, setContrast] = React.useState<number | null>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);

  // An override belongs to the preset it was picked under. Storing that together
  // with the colour means switching preset drops it by derivation rather than by
  // an effect that resets state — otherwise the previous preset's brand hue would
  // survive and hide the very thing the preset switcher demonstrates.
  const activeHex = custom?.preset === preset ? custom.hex : null;

  // Writing CSS variables onto <html> is a DOM side effect, so it belongs in an
  // effect rather than in the click handler: this way the override is applied,
  // replaced and torn down from one place that cannot get out of step with state.
  React.useEffect(() => {
    if (activeHex) applyRamp(activeHex);
    else clearRamp();
    return () => clearRamp();
  }, [activeHex]);

  /**
   * Measure the real rendered colours instead of re-deriving them.
   *
   * `--primary` may resolve to a ramp reference or to a solved literal depending
   * on the preset and mode, so recomputing it here would be a second, divergent
   * implementation of `generate-scale.mjs`. Reading the computed style of a probe
   * gives whatever the browser actually painted.
   */
  React.useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const styles = getComputedStyle(probe);
    const ratio = wcagContrast(styles.color, styles.backgroundColor);
    setContrast(Number.isFinite(ratio) ? ratio : null);
  }, [activeHex, preset, mode]);

  const failsContrast = contrast !== null && contrast < AA_TEXT;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette />
          <span className="hidden sm:inline">Màu thương hiệu</span>
          {failsContrast ? <TriangleAlert className="text-warning" /> : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-[var(--density-gap)]">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Đổi màu thương hiệu</p>
            <p className="text-xs text-muted-foreground">
              Sinh ramp OKLCH 11 bậc ngay trên trình duyệt và ghi đè
              <code className="mx-1 font-mono">--reno-brand-*</code>. Không build lại,
              không sửa dòng component nào.
            </p>
          </div>

          <div className="flex items-center gap-[var(--density-gap)]">
            <Label htmlFor="brand-color" className="text-xs">
              Chọn màu
            </Label>
            <input
              id="brand-color"
              type="color"
              value={activeHex ?? SWATCHES[PRESETS.findIndex((p) => p.name === preset)]?.hex ?? ""}
              onChange={(event) => setCustom({ preset, hex: event.target.value })}
              className="h-[var(--density-control-height-sm)] w-16 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto"
              onClick={() => setCustom(null)}
            >
              <RotateCcw />
              Đặt lại
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                onClick={() => setCustom({ preset, hex: swatch.hex })}
                aria-label={`Màu ${swatch.name}`}
                className="size-7 rounded-md border border-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                style={{ background: swatch.hex }}
              />
            ))}
          </div>

          <p
            className={
              failsContrast ? "text-xs text-warning" : "text-xs text-muted-foreground"
            }
          >
            {contrast === null
              ? "Đang đo tương phản…"
              : `Tương phản primary / background: ${contrast.toFixed(2)}:1${
                  failsContrast ? " — dưới ngưỡng AA 4,5:1" : " — đạt AA"
                }`}
          </p>
        </div>

        {/*
          Probe for the measurement above. Not `hidden`: a display:none element
          still computes colours, but keeping it in flow at zero size avoids
          depending on that detail.
        */}
        <span
          ref={probeRef}
          aria-hidden
          className="pointer-events-none absolute size-0 overflow-hidden"
          style={{ color: "var(--primary)", background: "var(--background)" }}
        />
      </PopoverContent>
    </Popover>
  );
}
