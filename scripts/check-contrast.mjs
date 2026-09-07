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
 *   - The pair list below is hand-maintained, and it describes what the
 *     COMPONENTS render, not every combination the theme could produce. A pair
 *     nobody added is a pair the gate never looks at, and a gate that reports
 *     green on something it never measured is worse than no gate. When a
 *     component starts painting a token on a new surface, add the pair here.
 *   - `--border` is reported but not gated. It is used for decorative dividers
 *     and card outlines where no information depends on perceiving it; gating it
 *     at 3:1 would force heavy rules on every surface. Controls get `--input`.
 *
 * A theme is only half the answer, though. The tokens this audits are the ones
 * the LIBRARY generates, and a project is expected to override them — that is
 * what the `cssVars` in every registry item are for. Override `--info-soft` with
 * a hand-picked colour from a design export and this gate keeps reporting green
 * on a pair it is no longer looking at, while the real screen is under 4.5:1.
 * `--theme <path>` is the way out: point it at the consuming project's own
 * `globals.css` and the same pair list, the same thresholds and the same solver
 * run against the values that actually ship. Any file with `:root` and `.dark`
 * blocks parses, so a project needs no build step and no copy of this script.
 * A pair the file does not define is skipped and counted, not failed — a
 * project overrides some tokens, not all of them.
 *
 * Usage:
 *   node scripts/check-contrast.mjs [--verbose]
 *   node scripts/check-contrast.mjs --theme ../app/src/app/globals.css
 */

import { readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
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
  // The `soft` appearance of Badge and Alert: pale tint, dark text of the same
  // hue. Solved as its own pair because the solid foreground is not readable on
  // the tint and vice versa.
  ["primary-soft-foreground", "primary-soft"],
  ["destructive-soft-foreground", "destructive-soft"],
  ["success-soft-foreground", "success-soft"],
  ["warning-soft-foreground", "warning-soft"],
  ["info-soft-foreground", "info-soft"],
  // These render as text (links, inline error/status labels) on page and card
  // surfaces, not only as fills. `Alert` in its default `solid` appearance is
  // literally `text-<role> bg-card` for all four status roles, so all four are
  // listed — `success`/`warning`/`info` used to be missing, which meant the
  // gate reported green on three variants it had never looked at.
  ["primary", "background"],
  ["primary", "card"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["success", "background"],
  ["success", "card"],
  ["warning", "background"],
  ["warning", "card"],
  ["info", "background"],
  ["info", "card"],
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

/**
 * @param external true when `vars` came from a project's own stylesheet rather
 *   than from a generated preset. A token the file never declares is then a
 *   token the project did not override, which is a skip; in a generated preset
 *   the same absence is a bug in the generator.
 */
function check(vars, pairs, min, external = false) {
  return pairs.map(([fgName, bgName]) => {
    const fgRaw = vars.get(fgName);
    const bgRaw = vars.get(bgName);
    if (fgRaw === undefined || bgRaw === undefined) {
      return { fgName, bgName, missing: true, pass: external, skipped: external };
    }
    let fg;
    let bg;
    try {
      fg = resolveVar(fgRaw, vars);
      bg = resolveVar(bgRaw, vars);
    } catch {
      // A project's `:root` may point at a variable declared somewhere this
      // parser does not read. Unmeasurable, not failing.
      if (!external) throw new Error(`Unresolved token in --${fgName} / --${bgName}`);
      return { fgName, bgName, missing: true, pass: true, skipped: true };
    }
    const ratio = wcagContrast(fg, bg);
    return { fgName, bgName, ratio, min, pass: ratio >= min };
  });
}

/** `--theme a.css --theme b.css` -> the paths, in order. */
function themeArgs(argv) {
  const out = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--theme" && argv[i + 1]) out.push(argv[i + 1]);
  }
  return out;
}

function main() {
  const verbose = process.argv.includes("--verbose");
  const external = themeArgs(process.argv);
  const files = external.length
    ? external
    : readdirSync(THEME_DIR)
        .filter((f) => f.endsWith(".css"))
        .sort()
        .map((f) => join(THEME_DIR, f));
  const failures = [];
  let checked = 0;
  let skipped = 0;

  for (const file of files) {
    const preset = basename(file).replace(/\.css$/, "");
    const parsed = parseThemeCss(resolve(file));

    for (const mode of ["light", "dark"]) {
      const vars = parsed[mode];
      const results = [
        ...check(vars, TEXT_PAIRS, CONTRAST.text, external.length > 0),
        ...check(vars, UI_PAIRS, CONTRAST.ui, external.length > 0),
      ];
      checked += results.length;

      for (const res of results) {
        if (res.skipped) {
          skipped += 1;
          if (verbose) {
            console.log(
              `  skip ${preset}/${mode}  ${res.fgName} on ${res.bgName}  (not declared here)`,
            );
          }
          continue;
        }
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
        for (const res of check(vars, ADVISORY_PAIRS, 0, external.length > 0)) {
          if (res.skipped) continue;
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
    `Contrast OK — ${checked - skipped} pairs across ${files.length} theme(s) x 2 modes` +
      (skipped ? `, ${skipped} not declared there` : "") +
      ".",
  );
}

main();
