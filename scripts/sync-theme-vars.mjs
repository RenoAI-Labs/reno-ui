#!/usr/bin/env node
/**
 * Derives the `cssVars` of every `registry:theme` item from
 * `registry/reno/themes/*.css` into `registry/items/theme-*.json`.
 *
 * Why this exists: the `.css` files are what a human reads and what the docs
 * site renders, but they are NOT what ships. The shadcn CLI merges `cssVars`
 * straight into the consuming project's `globals.css`, which is the only way an
 * installed preset re-themes the app with zero manual steps. Two representations
 * of the same palette means they can drift, so one is generated from the other
 * and CI fails when they disagree.
 *
 * Usage:
 *   node scripts/sync-theme-vars.mjs           # write item files
 *   node scripts/sync-theme-vars.mjs --check   # fail if they are stale
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseThemeCss } from "./lib/parse-theme-css.mjs";
import { ANIMATION_CSS } from "../registry/reno/themes/theme-presets.config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME_DIR = join(ROOT, "registry/reno/themes");
const ITEMS_DIR = join(ROOT, "registry/items");

/** `theme-erp` -> `erp.css` */
function cssFileFor(itemName) {
  return join(THEME_DIR, `${itemName.replace(/^theme-/, "")}.css`);
}

function buildCssVars(cssPath) {
  const parsed = parseThemeCss(cssPath);
  const cssVars = {};
  // `theme` is only present on theme-base — presets override values, not the
  // Tailwind mapping. Emitting an empty object would add noise to the payload.
  if (parsed.theme.size > 0) cssVars.theme = Object.fromEntries(parsed.theme);
  cssVars.light = Object.fromEntries(parsed.light);
  cssVars.dark = Object.fromEntries(parsed.dark);
  return cssVars;
}

function main() {
  const check = process.argv.includes("--check");
  const themeFiles = readdirSync(ITEMS_DIR).filter((f) => f.startsWith("theme-"));

  if (themeFiles.length === 0) {
    console.error("No theme item files found in registry/items/.");
    process.exit(1);
  }

  const drifted = [];
  for (const file of themeFiles) {
    const path = join(ITEMS_DIR, file);
    const item = JSON.parse(readFileSync(path, "utf8"));
    const cssPath = cssFileFor(item.name);

    if (!existsSync(cssPath)) {
      console.error(`No theme CSS for "${item.name}" (expected ${cssPath}).`);
      process.exit(1);
    }

    const next = buildCssVars(cssPath);
    // Only theme-base carries the animation utilities: they are identical for
    // every preset, and `css` overwrites rules in the consuming project, so
    // shipping four copies would be four chances to conflict.
    const nextCss = item.name === "theme-base" ? ANIMATION_CSS : undefined;

    const varsSame = JSON.stringify(item.cssVars ?? {}) === JSON.stringify(next);
    const cssSame = JSON.stringify(item.css) === JSON.stringify(nextCss);
    if (varsSame && cssSame) continue;

    drifted.push(item.name);
    if (!check) {
      // Rebuild the object so cssVars keeps its position rather than moving to
      // the end and producing a noisy diff.
      const rebuilt = {};
      for (const [key, value] of Object.entries(item)) {
        if (key === "css" && nextCss === undefined) continue;
        rebuilt[key] = key === "cssVars" ? next : key === "css" ? nextCss : value;
      }
      if (!("cssVars" in rebuilt)) rebuilt.cssVars = next;
      if (nextCss !== undefined && !("css" in rebuilt)) rebuilt.css = nextCss;
      writeFileSync(path, `${JSON.stringify(rebuilt, null, 2)}\n`);
    }
  }

  if (check) {
    if (drifted.length) {
      console.error("Theme cssVars are stale. Run `npm run theme:sync`:");
      for (const name of drifted) console.error(`  - ${name}`);
      process.exit(1);
    }
    console.log(`Theme cssVars up to date (${themeFiles.length} themes).`);
    return;
  }

  if (drifted.length === 0) {
    console.log(`Theme cssVars already in sync (${themeFiles.length} themes).`);
    return;
  }
  console.log(`Synced cssVars for: ${drifted.join(", ")}`);
}

main();
