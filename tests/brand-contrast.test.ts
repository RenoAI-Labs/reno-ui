import { oklch, wcagContrast } from "culori";
import { describe, expect, it } from "vitest";

import { brandHex, secondaryOverrides } from "@/app/showcase/_parts/showcase-brand-tokens";
import { CONTRAST, buildRamp, css } from "@/registry/reno/themes/theme-presets.config.mjs";
import { parseThemeCss, resolveVar } from "../scripts/lib/parse-theme-css.mjs";

/**
 * WCAG AA for every brand colour the showcase's brand panel can be handed.
 *
 * `check:contrast` audits the one theme the repo ships. It cannot audit the
 * theme a project actually runs, because the panel lets someone paste any hex
 * and rewrites `--reno-brand-*` and the secondary pair from it. Those overrides
 * leave this repo — they end up in someone's `globals.css` — so the promise the
 * panel makes is "pick any colour, the result still reads". This file is what
 * holds that promise up, across the whole input space rather than at one hue.
 *
 * Only the pairs the panel can actually move are swept. Everything else in
 * `base.css` is a contrast-solved literal the panel never touches, and
 * `check:contrast` already owns it.
 *
 * Why it passes today, which is also how it could quietly stop passing:
 * `RAMP_LIGHTNESS` is the same for every hue, and WCAG luminance is dominated
 * by lightness — so a ramp stop lands at roughly the same luminance whatever
 * brand colour produced it. That is a property of three decisions, not a law:
 * the lightness table, which stop `--primary` reads, and the stops
 * `secondaryOverrides` picks. Change any of them and these ratios move with no
 * other gate noticing.
 */

/** Hue is a full circle; chroma runs past what sRGB can show, and `mk` clamps. */
const HUES = Array.from({ length: 24 }, (_, i) => i * 15);
const CHROMAS = [0.05, 0.1, 0.13, 0.16, 0.2, 0.25, 0.3, 0.37];

/**
 * The sRGB corners, which is where a brand colour is most likely to be extreme.
 * Included as hexes rather than as hue/chroma pairs because that is the form
 * the panel receives them in.
 */
const CORNERS = ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"];

type Brand = { label: string; h: number; c: number; hex: string };

const BRANDS: Brand[] = [
  ...HUES.flatMap((h) =>
    CHROMAS.map((c) => ({ label: `h${h} c${c}`, h, c, hex: brandHex({ h, c }) })),
  ),
  ...CORNERS.map((hex) => {
    const parsed = oklch(hex)!;
    return { label: hex, h: parsed.h ?? 0, c: parsed.c ?? 0, hex };
  }),
];

const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

const theme = parseThemeCss("registry/reno/themes/base.css") as Record<
  "light" | "dark",
  Map<string, string>
>;

/** A literal `base.css` solved and the panel leaves alone. */
function literal(mode: Mode, name: string): string {
  const raw = theme[mode].get(name);
  if (raw === undefined) throw new Error(`base.css has no --${name} in ${mode} mode`);
  return resolveVar(raw, theme[mode]);
}

/**
 * Which ramp stop `--primary` reads, per mode.
 *
 * Read from the CSS rather than restated, so that pointing `--primary` at a
 * different stop — or at a literal, which would take it out of the panel's
 * reach entirely — is caught here instead of leaving the sweep measuring a
 * colour the product no longer uses.
 */
function primaryStop(mode: Mode): number {
  const raw = theme[mode].get("primary");
  const match = /^var\(\s*--reno-brand-(\d+)\s*\)$/.exec(raw ?? "");
  if (!match) {
    throw new Error(
      `--primary is \`${raw}\` in ${mode} mode, not a --reno-brand-* reference. ` +
        `The brand panel can no longer move it, so this sweep does not cover it.`,
    );
  }
  return Number(match[1]);
}

/** The colour a brand produces at one ramp stop, as the panel would emit it. */
function rampStop(brand: Brand, stop: number): string {
  const entry = buildRamp({ h: brand.h, c: brand.c }).find((e) => e.stop === stop);
  if (!entry) throw new Error(`No ramp stop ${stop}`);
  return css(entry.color);
}

/** Every failing combination, so a red test names the colour that broke it. */
function failures(min: number, ratio: (brand: Brand, mode: Mode) => number) {
  const out: string[] = [];
  for (const mode of MODES) {
    for (const brand of BRANDS) {
      const value = ratio(brand, mode);
      if (value < min) out.push(`${mode} ${brand.label}: ${value.toFixed(2)} < ${min}`);
    }
  }
  return out;
}

describe("any brand colour the panel accepts still meets AA", () => {
  it("keeps a primary button's label readable on the button", () => {
    expect(
      failures(CONTRAST.text, (brand, mode) =>
        wcagContrast(literal(mode, "primary-foreground"), rampStop(brand, primaryStop(mode))),
      ),
    ).toEqual([]);
  });

  it("keeps primary readable as text on the page", () => {
    // Links and inline status labels render `--primary` as text on
    // `--background`, which is the obligation `check:contrast` gates at `ui`
    // for the shipped hue and this sweep extends to every hue.
    expect(
      failures(CONTRAST.ui, (brand, mode) =>
        wcagContrast(rampStop(brand, primaryStop(mode)), literal(mode, "background")),
      ),
    ).toEqual([]);
  });

  it("keeps a secondary button's label readable on the button", () => {
    /*
      Unlike primary, both halves of this pair are produced by the panel, so
      neither side is anchored by a solved literal — the two stops
      `secondaryOverrides` picks are the whole of the guarantee.

      Swept through the hex the panel is handed, which means chroma above what
      sRGB can show is clipped on the way in. That is not a gap: a colour input
      cannot produce those, so the clipped colour is the real input.
    */
    expect(
      failures(CONTRAST.text, (brand, mode) => {
        const pair = new Map(secondaryOverrides(brand.hex, mode).map((o) => [o.name, o.value]));
        return wcagContrast(pair.get("--secondary-foreground")!, pair.get("--secondary")!);
      }),
    ).toEqual([]);
  });

  it("sweeps the whole space rather than a handful of hues", () => {
    // Three assertions above are `toEqual([])`, which an empty sweep satisfies
    // perfectly. This is what stops them from passing by measuring nothing.
    expect(BRANDS.length * MODES.length).toBeGreaterThanOrEqual(384);
    expect(new Set(BRANDS.map((b) => b.h)).size).toBeGreaterThanOrEqual(24);
  });
});
