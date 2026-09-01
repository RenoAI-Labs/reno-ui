#!/usr/bin/env node
/**
 * WCAG AA gate for every theme preset.
 *
 * Runs independently of `generate-scale.mjs`: the generator solves for these
 * ratios, this script re-derives them from the emitted CSS. A bug in the solver
 * therefore fails CI instead of shipping an inaccessible palette.
 *
 * Threshold rationale (SC 1.4.3 / 1.4.11):
 *   - 4.5:1 for anything rendered as normal-size text.
 *   - 3.0:1 for `--input` and `--ring`: the boundary that identifies a control
 *     and its focus state are non-text UI components under SC 1.4.11.
 *   - `--border` is reported but not gated. It is used for decorative dividers
 *     and card outlines where no information depends on perceiving it; gating it
 *     at 3:1 would force heavy rules on every surface. Controls get `--input`.
 *
 * Usage: node scripts/check-contrast.mjs [--verbose]
 */

import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { wcagContrast } from "culori";

import { parseThemeCss, resolveVar } from "./lib/parse-theme-css.mjs";
import { CONTRAST } from "../registry/reno/themes/theme-presets.config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME_DIR = join(ROOT, "registry/reno/themes");

/** Pairs carrying a text-level obligation. */
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  // These four render as text (links, inline error/status labels) on page and
  // card surfaces, not only as fills.
  ["primary", "background"],
  ["primary", "card"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["sidebar-primary-foreground", "sidebar-primary"],
];

/** Non-text UI components under SC 1.4.11. */
const UI_PAIRS = [
  ["input", "background"],
  ["input", "card"],
  ["ring", "background"],
  ["ring", "card"],
  ["sidebar-ring", "sidebar"],
];

/** Reported for visibility, deliberately not gated — see header. */
const ADVISORY_PAIRS = [
  ["border", "background"],
  ["border", "card"],
];

function check(vars, pairs, min) {
  return pairs.map(([fgName, bgName]) => {
    const fgRaw = vars.get(fgName);
    const bgRaw = vars.get(bgName);
    if (fgRaw === undefined || bgRaw === undefined) {
      return { fgName, bgName, missing: true, pass: false };
    }
    const ratio = wcagContrast(resolveVar(fgRaw, vars), resolveVar(bgRaw, vars));
    return { fgName, bgName, ratio, min, pass: ratio >= min };
  });
}

function main() {
  const verbose = process.argv.includes("--verbose");
  const files = readdirSync(THEME_DIR).filter((f) => f.endsWith(".css")).sort();
  const failures = [];
  let checked = 0;

  for (const file of files) {
    const preset = file.replace(/\.css$/, "");
    const parsed = parseThemeCss(join(THEME_DIR, file));

    for (const mode of ["light", "dark"]) {
      const vars = parsed[mode];
      const results = [
        ...check(vars, TEXT_PAIRS, CONTRAST.text),
        ...check(vars, UI_PAIRS, CONTRAST.ui),
      ];
      checked += results.length;

      for (const res of results) {
        if (res.pass) {
          if (verbose) {
            console.log(
              `  ok   ${preset}/${mode}  ${res.fgName} on ${res.bgName}  ${res.ratio.toFixed(2)}:1`,
            );
          }
          continue;
        }
        failures.push(
          res.missing
            ? `${preset}/${mode}: missing token --${res.fgName} or --${res.bgName}`
            : `${preset}/${mode}: --${res.fgName} on --${res.bgName} = ${res.ratio.toFixed(2)}:1 (need ${res.min}:1)`,
        );
      }

      if (verbose) {
        for (const res of check(vars, ADVISORY_PAIRS, 0)) {
          console.log(
            `  note ${preset}/${mode}  ${res.fgName} on ${res.bgName}  ${res.ratio.toFixed(2)}:1 (advisory)`,
          );
        }
      }
    }
  }

  if (failures.length) {
    console.error(`Contrast check failed (${failures.length} of ${checked} pairs):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `Contrast OK — ${checked} pairs across ${files.length} presets x 2 modes.`,
  );
}

main();
