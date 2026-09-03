import { formatHex, oklch } from "culori";

import {
  DENSITY,
  RAMP_STOPS,
  buildRamp,
  css,
  mk,
} from "@/registry/reno/themes/theme-presets.config.mjs";

/**
 * The token maths behind the brand panel, with no React in it.
 *
 * Separated from the panel for two reasons: the panel is otherwise a long file
 * of layout, and these are the functions that could silently emit wrong CSS —
 * which is worth a test, and a test cannot render a popover to get at them.
 *
 * Everything derives from `theme-presets.config.mjs`: the same `buildRamp` the
 * build script uses, and the same four `DENSITY` steps. Nothing here invents a
 * value, because a panel that previews a palette the build cannot produce is
 * worse than no panel.
 */

export type DensityStep = keyof typeof DENSITY;

export const DENSITY_STEPS: DensityStep[] = ["compact", "normal", "comfortable", "roomy"];

/** Radius choices, spanning what the shipped presets already use. */
export const RADIUS_CHOICES = ["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem"] as const;
export type RadiusChoice = (typeof RADIUS_CHOICES)[number];

/** The `--density-*` variable names, in the order `generate-scale.mjs` writes them. */
const DENSITY_VARS: [keyof (typeof DENSITY)["normal"], string][] = [
  ["controlHeightSm", "density-control-height-sm"],
  ["controlHeight", "density-control-height"],
  ["controlHeightLg", "density-control-height-lg"],
  ["controlPx", "density-control-px"],
  ["rowHeight", "density-row-height"],
  ["cellPaddingX", "density-cell-padding-x"],
  ["cellPaddingY", "density-cell-padding-y"],
  ["gap", "density-gap"],
  ["fontSize", "density-font-size"],
  ["lineHeight", "density-line-height"],
];

/** One CSS custom property, as a name/value pair. */
export type TokenOverride = { name: string; value: string };

/** The eleven brand ramp stops for a hex colour. */
export function brandOverrides(hex: string): TokenOverride[] {
  const parsed = oklch(hex);
  if (!parsed) return [];
  return buildRamp({ h: parsed.h ?? 0, c: parsed.c ?? 0 }).map(({ stop, color }) => ({
    name: `--reno-brand-${stop}`,
    value: css(color),
  }));
}

export const BRAND_VAR_NAMES = RAMP_STOPS.map((stop) => `--reno-brand-${stop}`);

/**
 * The secondary pair, taken from the picked colour's own ramp.
 *
 * `--secondary` is not a ramp reference in the shipped presets — it is a
 * literal that `generate-scale.mjs` solved for contrast — so there is nothing
 * upstream of it to override and the value has to be produced here.
 *
 * It comes from `buildRamp` rather than from reading what the browser is
 * currently painting. Reading the DOM was the first attempt and it is wrong in
 * a way that is easy to miss: this panel writes `--secondary` itself, so the
 * next read returns the panel's own output and the value drifts a little
 * further on every change. Ramp stops have no such feedback path, and they keep
 * this file's promise that every value could have come out of the build.
 *
 * The stops are chosen to land near what the solver picks — a near-white tint
 * in light mode, a near-black one in dark — and the ramp's own chroma curve is
 * what keeps a vivid brand colour from turning a surface vivid. It is still an
 * approximation of a solved value, which is why the panel measures the contrast
 * instead of claiming it.
 */
const SECONDARY_STOPS = {
  light: { surface: 100, text: 950 },
  dark: { surface: 950, text: 50 },
} as const;

export function secondaryOverrides(hex: string, mode: "light" | "dark"): TokenOverride[] {
  const parsed = oklch(hex);
  if (!parsed) return [];

  const ramp = buildRamp({ h: parsed.h ?? 0, c: parsed.c ?? 0 });
  const at = (stop: number) => ramp.find((entry) => entry.stop === stop)?.color;

  const surface = at(SECONDARY_STOPS[mode].surface);
  const text = at(SECONDARY_STOPS[mode].text);
  if (!surface || !text) return [];

  return [
    { name: "--secondary", value: css(surface) },
    { name: "--secondary-foreground", value: css(text) },
  ];
}

export const SECONDARY_VAR_NAMES = ["--secondary", "--secondary-foreground"];

export function densityOverrides(step: DensityStep): TokenOverride[] {
  const values = DENSITY[step];
  return DENSITY_VARS.map(([key, name]) => ({ name: `--${name}`, value: values[key] }));
}

export const DENSITY_VAR_NAMES = DENSITY_VARS.map(([, name]) => `--${name}`);

export function radiusOverride(radius: RadiusChoice): TokenOverride[] {
  return [{ name: "--radius", value: radius }];
}

export const RADIUS_VAR_NAMES = ["--radius"];

/** The hex a colour input can show for a preset's brand hue. */
export function brandHex({ h, c }: { h: number; c: number }): string {
  // Stop 500 is the ramp's mid point, which is the colour a person means when
  // they say "the brand colour".
  return formatHex(mk(0.637, c, h)) ?? "";
}

/**
 * Which density step a preset uses.
 *
 * Read from the config rather than measured off the page for the same reason as
 * the secondary pair: the panel writes `--density-*` itself, so measuring would
 * be reading back its own output.
 */
export function presetDensityStep(density: (typeof DENSITY)[DensityStep]): DensityStep | null {
  return DENSITY_STEPS.find((step) => DENSITY[step] === density) ?? null;
}

/**
 * The overrides as a pasteable block.
 *
 * The header says what this is and what it is not, because a block of solved
 * values in someone's `globals.css` is indistinguishable from a generated theme
 * six months later — and the two diverge the moment a preset is regenerated.
 */
export function toCssBlock(overrides: TokenOverride[]): string {
  if (overrides.length === 0) return "";
  const lines = overrides.map(({ name, value }) => `  ${name}: ${value};`);
  return [
    "/* Sinh từ panel Thương hiệu của reno-ui showcase.",
    "   Dán vào globals.css SAU khi import theme để ghi đè.",
    "   Đây là giá trị đã chốt bằng mắt, không phải theme sinh từ",
    "   theme-presets.config.mjs — muốn thành preset thật thì sửa hue/chroma/",
    "   density trong config đó rồi chạy `npm run theme:generate`. */",
    ":root {",
    ...lines,
    "}",
  ].join("\n");
}
