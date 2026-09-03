#!/usr/bin/env node
/**
 * Generates `registry/reno/themes/base.css` from `theme-presets.config.mjs`.
 *
 * Two jobs:
 *   1. Build the OKLCH primitive ramps (`--reno-brand-50` .. `--reno-neutral-950`).
 *   2. Map semantic tokens (`--primary`, `--muted-foreground`, ...) onto those
 *      ramps, *solving* for a value that clears the WCAG threshold for the pair
 *      instead of picking one by eye.
 *
 * Step 2 is the reason this script exists. Four presets x two modes x ~45
 * semantic tokens is far past the point where hand-picked OKLCH values stay
 * accessible. `scripts/check-contrast.mjs` re-verifies the output independently,
 * so a bug here fails CI rather than shipping.
 *
 * Usage:
 *   node scripts/generate-scale.mjs            # write theme CSS files
 *   node scripts/generate-scale.mjs --check    # fail if files are stale
 *   node scripts/generate-scale.mjs --ramp "oklch(0.55 0.13 250)"  # print a ramp
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatCss, oklch, wcagContrast } from "culori";

import {
  BASE_PRESET,
  CONTRAST,
  RAMP_STOPS,
  ANIMATION_CSS,
  ANIMATION_THEME_TOKENS,
  STATIC_THEME_TOKENS,
  STATUS_HUES,
  buildRamp,
  css,
  mk,
} from "../registry/reno/themes/theme-presets.config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Ramp stops emitted for status hues. Full 11-step ramps are overkill there. */
const STATUS_STOPS = [100, 500, 700];

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

// `mk`, `css` and `buildRamp` come from theme-presets.config.mjs so the browser
// brand picker in the showcase builds ramps with the exact same maths.

function contrast(a, b) {
  return wcagContrast(css(a), css(b));
}

/**
 * Find the ramp entry closest to `preferStop` that clears `min` contrast against
 * `bg`. Returns `null` when no stop qualifies, so the caller can fall back to a
 * solved literal.
 */
function pickStop(ramp, bg, min, preferStop) {
  const target = min + CONTRAST.margin;
  const preferIndex = RAMP_STOPS.indexOf(preferStop);
  const ordered = [...ramp].sort((a, b) => {
    const da = Math.abs(RAMP_STOPS.indexOf(a.stop) - preferIndex);
    const db = Math.abs(RAMP_STOPS.indexOf(b.stop) - preferIndex);
    return da - db;
  });
  return ordered.find((entry) => contrast(entry.color, bg) >= target) ?? null;
}

/**
 * Walk lightness away from `startL` until the pair clears `min`. Used when no
 * ramp stop qualifies (common for foregrounds sitting on a saturated surface).
 */
function solveLightness({ h, c, bg, min, startL, direction }) {
  const target = min + CONTRAST.margin;
  for (let l = startL; l >= 0 && l <= 1; l += direction * 0.002) {
    const color = mk(l, c, h);
    if (contrast(color, bg) >= target) return color;
  }
  return mk(direction < 0 ? 0 : 1, 0, h);
}

/**
 * Pick a readable foreground for a filled surface: try near-white and near-black,
 * keep whichever already has more headroom, then push it further if needed.
 */
function solveForeground(surface, hue, min = CONTRAST.text) {
  const light = mk(0.985, 0.005, hue);
  const dark = mk(0.21, 0.012, hue);
  const useLight = contrast(light, surface) >= contrast(dark, surface);
  const start = useLight ? light : dark;
  if (contrast(start, surface) >= min + CONTRAST.margin) return start;
  return solveLightness({
    h: hue,
    c: start.c,
    bg: surface,
    min,
    startL: start.l,
    direction: useLight ? 1 : -1,
  });
}

// ---------------------------------------------------------------------------
// Token construction
// ---------------------------------------------------------------------------

/** Reference a primitive token so the semantic layer stays a *mapping*. */
const ref = (name) => `var(--reno-${name})`;

/**
 * Build one mode (light or dark) of a preset.
 *
 * Surfaces are anchored first because everything else is solved against them.
 * Foregrounds and affordances are then resolved to a ramp stop when one clears
 * the threshold, and to a solved literal otherwise.
 */
function buildMode(preset, mode, ramps) {
  const dark = mode === "dark";
  const { brand: brandRamp, neutral: neutralRamp } = ramps;
  const brandHue = preset.brand.h;
  const neutralHue = preset.neutral.h;
  const neutralChroma = preset.neutral.c;

  // --- Surfaces (no contrast obligation of their own) ---------------------
  const background = dark
    ? mk(0.165, neutralChroma * 1.5, neutralHue)
    : mk(0.995, neutralChroma * 0.4, neutralHue);
  const card = dark
    ? mk(0.205, neutralChroma * 1.5, neutralHue)
    : mk(1, 0, neutralHue);
  const popover = card;
  const muted = dark
    ? mk(0.255, neutralChroma * 1.5, neutralHue)
    : mk(0.967, neutralChroma * 1.2, neutralHue);

  // --- Brand ---------------------------------------------------------------
  // `primary` doubles as link text in shadcn-derived components, so it carries a
  // text-level obligation against the page background, not just a fill role.
  const primaryStop = pickStop(
    brandRamp,
    background,
    CONTRAST.text,
    dark ? 400 : 600,
  );
  const primary =
    primaryStop?.color ??
    solveLightness({
      h: brandHue,
      c: preset.brand.c,
      bg: background,
      min: CONTRAST.text,
      startL: dark ? 0.75 : 0.55,
      direction: dark ? 1 : -1,
    });

  const tokens = new Map();
  const put = (name, value) => tokens.set(name, value);

  put("background", css(background));
  put("foreground", css(solveForeground(background, neutralHue)));
  put("card", css(card));
  put("card-foreground", css(solveForeground(card, neutralHue)));
  put("popover", css(popover));
  put("popover-foreground", css(solveForeground(popover, neutralHue)));

  put("primary", primaryStop ? ref(`brand-${primaryStop.stop}`) : css(primary));
  put("primary-foreground", css(solveForeground(primary, brandHue)));

  put("secondary", css(muted));
  put("secondary-foreground", css(solveForeground(muted, neutralHue)));
  put("muted", css(muted));
  // Muted text must stay readable on both the muted surface and the page
  // background — solve against whichever is the harder of the two.
  const mutedFgBase =
    contrast(mk(0.5, 0, neutralHue), muted) <
    contrast(mk(0.5, 0, neutralHue), background)
      ? muted
      : background;
  const mutedFgStop = pickStop(
    neutralRamp,
    mutedFgBase,
    CONTRAST.text,
    dark ? 400 : 600,
  );
  put(
    "muted-foreground",
    mutedFgStop
      ? ref(`neutral-${mutedFgStop.stop}`)
      : css(solveForeground(mutedFgBase, neutralHue)),
  );
  put("accent", css(muted));
  put("accent-foreground", css(solveForeground(muted, neutralHue)));

  // --- Status --------------------------------------------------------------
  for (const [role, hue] of Object.entries(STATUS_HUES)) {
    const ramp = ramps[role];
    const stop = pickStop(ramp, background, CONTRAST.text, dark ? 500 : 700);
    const fill =
      stop?.color ??
      solveLightness({
        h: hue.h,
        c: hue.c,
        bg: background,
        min: CONTRAST.text,
        startL: dark ? 0.7 : 0.55,
        direction: dark ? 1 : -1,
      });
    put(role, stop ? ref(`${role}-${stop.stop}`) : css(fill));
    put(`${role}-foreground`, css(solveForeground(fill, hue.h)));
  }

  // --- Affordances ---------------------------------------------------------
  // `input` and `ring` carry a real WCAG 1.4.11 / 2.4.11 obligation: they are
  // what identifies a control and its focus state. `border` is a decorative
  // divider and is intentionally lighter — see docs/design-tokens.md.
  put(
    "border",
    css(
      dark
        ? mk(0.31, neutralChroma * 2, neutralHue)
        : mk(0.915, neutralChroma * 2, neutralHue),
    ),
  );
  const inputStop = pickStop(
    neutralRamp,
    background,
    CONTRAST.ui,
    dark ? 500 : 400,
  );
  put(
    "input",
    inputStop
      ? ref(`neutral-${inputStop.stop}`)
      : css(
          solveLightness({
            h: neutralHue,
            c: neutralChroma * 3,
            bg: background,
            min: CONTRAST.ui,
            startL: dark ? 0.4 : 0.8,
            direction: dark ? 1 : -1,
          }),
        ),
  );
  const ringStop = pickStop(brandRamp, background, CONTRAST.ui, dark ? 400 : 500);
  put(
    "ring",
    ringStop
      ? ref(`brand-${ringStop.stop}`)
      : css(
          solveLightness({
            h: brandHue,
            c: preset.brand.c,
            bg: background,
            min: CONTRAST.ui,
            startL: dark ? 0.7 : 0.6,
            direction: dark ? 1 : -1,
          }),
        ),
  );

  // Modal scrim. Deliberately dark in both light and dark mode — a light scrim
  // over a dark app reads as a flash, not a dim. Declared as a token anyway so a
  // preset can tune the opacity rather than components hardcoding `bg-black/50`.
  put("overlay", dark ? "oklch(0 0 0 / 0.65)" : "oklch(0 0 0 / 0.5)");

  // --- Charts (decorative, no contrast gate) -------------------------------
  const chartL = dark ? 0.68 : 0.6;
  [0, 62, 130, 205, 285].forEach((offset, i) => {
    put(`chart-${i + 1}`, css(mk(chartL, preset.brand.c * 0.95, (brandHue + offset) % 360)));
  });

  // --- Sidebar -------------------------------------------------------------
  const sidebar = dark
    ? mk(0.195, neutralChroma * 1.5, neutralHue)
    : mk(0.978, neutralChroma * 1.2, neutralHue);
  const sidebarAccent = dark
    ? mk(0.265, neutralChroma * 1.5, neutralHue)
    : mk(0.94, neutralChroma * 1.5, neutralHue);
  put("sidebar", css(sidebar));
  put("sidebar-foreground", css(solveForeground(sidebar, neutralHue)));
  put("sidebar-primary", tokens.get("primary"));
  put("sidebar-primary-foreground", tokens.get("primary-foreground"));
  put("sidebar-accent", css(sidebarAccent));
  put("sidebar-accent-foreground", css(solveForeground(sidebarAccent, neutralHue)));
  put("sidebar-border", tokens.get("border"));
  put("sidebar-ring", tokens.get("ring"));

  return tokens;
}

/** Primitive ramp variables for one preset. */
function buildPrimitives(preset, ramps) {
  const out = new Map();
  for (const { stop, color } of ramps.brand) out.set(`reno-brand-${stop}`, css(color));
  for (const { stop, color } of ramps.neutral) out.set(`reno-neutral-${stop}`, css(color));
  for (const role of Object.keys(STATUS_HUES)) {
    for (const { stop, color } of ramps[role]) {
      if (STATUS_STOPS.includes(stop)) out.set(`reno-${role}-${stop}`, css(color));
    }
  }
  return out;
}

/**
 * Semantic colour tokens that get a matching Tailwind utility (`bg-background`,
 * `text-muted-foreground`, ...). Derived from what `buildMode` emits so the two
 * cannot drift.
 */
const COLOR_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  ...Object.keys(STATUS_HUES).flatMap((role) => [role, `${role}-foreground`]),
  "border",
  "input",
  "ring",
  "overlay",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

/**
 * The `@theme` block — the Tailwind *mapping* layer, not values.
 *
 * Every entry is a `var()` reference, which is what makes theme switching work:
 * Tailwind emits `bg-background` as `var(--background)` rather than baking in a
 * literal, so overriding `--background` in a scoped selector re-themes every
 * utility without recompiling. Only `theme-base` ships this block; presets only
 * override the values it points at.
 */
function buildThemeBlock() {
  const entries = new Map();
  for (const name of COLOR_TOKEN_NAMES) {
    entries.set(`color-${name}`, `var(--${name})`);
  }
  entries.set("radius-sm", "calc(var(--radius) - 4px)");
  entries.set("radius-md", "calc(var(--radius) - 2px)");
  entries.set("radius-lg", "var(--radius)");
  entries.set("radius-xl", "calc(var(--radius) + 4px)");
  for (const [name, value] of Object.entries(STATIC_THEME_TOKENS)) {
    entries.set(name, value);
  }
  // Tailwind's own animation namespace: `--animate-in` is what makes Tailwind
  // generate `.animate-in` AND keep the @keyframes it references alive.
  for (const [name, value] of Object.entries(ANIMATION_THEME_TOKENS)) {
    entries.set(name, value);
  }
  return entries;
}

/**
 * Non-colour tokens that DO vary per preset, so they live in `:root`/`.dark`
 * rather than `@theme`. Density is the whole reason an ERP grid fits more rows
 * than an e-learning one, so it has to be overridable per preset.
 */
function buildShapeTokens(preset) {
  const d = preset.density;
  return new Map(
    Object.entries({
      radius: preset.radius,
      "density-control-height-sm": d.controlHeightSm,
      "density-control-height": d.controlHeight,
      "density-control-height-lg": d.controlHeightLg,
      "density-control-px": d.controlPx,
      "density-row-height": d.rowHeight,
      "density-cell-padding-x": d.cellPaddingX,
      "density-cell-padding-y": d.cellPaddingY,
      "density-gap": d.gap,
      "density-font-size": d.fontSize,
      "density-line-height": d.lineHeight,
    }),
  );
}

function buildRamps(preset) {
  const ramps = {
    brand: buildRamp(preset.brand),
    neutral: buildRamp(preset.neutral),
  };
  for (const [role, hue] of Object.entries(STATUS_HUES)) ramps[role] = buildRamp(hue);
  return ramps;
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/**
 * Render the nested `css` object (the same shape the registry ships) as real
 * CSS, so base.css and the registry payload cannot describe different animations.
 */
function renderCssRules(rules, indent = "") {
  return Object.entries(rules)
    .map(([selector, body]) => {
      const inner = Object.entries(body)
        .map(([key, value]) =>
          typeof value === "object" && value !== null
            ? renderCssRules({ [key]: value }, `${indent}  `)
            : `${indent}  ${key}: ${value};`,
        )
        .join("\n");
      return `${indent}${selector} {\n${inner}\n${indent}}`;
    })
    .join("\n\n");
}

function block(selector, entries, indent = "  ") {
  const body = [...entries]
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

function renderTheme(preset) {
  const ramps = buildRamps(preset);
  const primitives = buildPrimitives(preset, ramps);
  const shape = buildShapeTokens(preset);

  // Primitives and shape tokens live in both modes: the semantic layer
  // references primitives by name, and shadcn's `cssVars` merge writes light and
  // dark into separate selectors that must each stand alone.
  const lightAll = new Map([...primitives, ...shape, ...buildMode(preset, "light", ramps)]);
  const darkAll = new Map([...primitives, ...shape, ...buildMode(preset, "dark", ramps)]);

  const header = `/**
 * GENERATED FILE — do not edit.
 * Source: registry/reno/themes/theme-presets.config.mjs
 * Regenerate: npm run theme:generate
 *
 * ${preset.title} — ${preset.description}
 *
 * This file is the human-readable preview used by the docs site and by
 * scripts/check-contrast.mjs. The artifact actually SHIPPED to consuming
 * projects is the \`cssVars\` block that scripts/sync-theme-vars.mjs derives
 * from this file into registry.json.
 */
`;

  const themeSection = `\n${block("@theme inline", buildThemeBlock())}\n`;
  const animationSection = `\n${renderCssRules(ANIMATION_CSS)}\n`;

  return `${header}${themeSection}
${block(":root", lightAll)}

${block(".dark", darkAll)}
${animationSection}`;
}

function main() {
  const args = process.argv.slice(2);

  const rampIndex = args.indexOf("--ramp");
  if (rampIndex !== -1) {
    const input = args[rampIndex + 1];
    const parsed = oklch(input);
    if (!parsed) {
      console.error(`Cannot parse colour: ${input}`);
      process.exit(1);
    }
    for (const { stop, color } of buildRamp({ h: parsed.h ?? 0, c: parsed.c })) {
      console.log(`${String(stop).padStart(3)}  ${css(color)}  ${formatCss(color)}`);
    }
    return;
  }

  const check = args.includes("--check");
  const stale = [];

  /*
    One file. There used to be five, plus a docs-only stylesheet that re-emitted
    every preset under `[data-preset="..."]` so the switcher could show them side
    by side. The four domain presets are gone and so is that file — nothing
    switches theme at runtime any more, and the brand panel overrides custom
    properties on `<html>` instead.
  */
  const outputs = [
    {
      relPath: `registry/reno/themes/${BASE_PRESET.name}.css`,
      content: renderTheme(BASE_PRESET),
    },
  ];

  for (const { relPath, content } of outputs) {
    const path = resolve(ROOT, relPath);
    let current = null;
    try {
      current = readFileSync(path, "utf8");
    } catch {
      /* file does not exist yet */
    }
    if (current === content) continue;
    if (check) {
      stale.push(relPath);
      continue;
    }
    writeFileSync(path, content);
    console.log(`wrote ${relPath}`);
  }

  if (stale.length) {
    console.error("Theme CSS is stale. Run `npm run theme:generate`:");
    for (const f of stale) console.error(`  - ${f}`);
    process.exit(1);
  }
  if (check) console.log("Theme CSS up to date.");
}

main();
