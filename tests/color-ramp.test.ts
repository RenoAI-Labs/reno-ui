import { describe, expect, it } from "vitest";

import {
  PRESETS,
  RAMP_STOPS,
  buildRamp,
  css,
} from "@/registry/reno/themes/theme-presets.config.mjs";
import { parseThemeCss } from "../scripts/lib/parse-theme-css.mjs";

/**
 * The showcase brand picker builds an OKLCH ramp in the browser and writes it
 * over `--reno-brand-*`. It calls the same `buildRamp` the theme generator does,
 * and this test is what holds that claim up: if the two ever computed different
 * colours, the picker would preview a palette no preset can actually produce —
 * the failure mode `sync-theme-vars.mjs` guards against one layer higher.
 *
 * Comparing against the generated CSS rather than a snapshot means the assertion
 * fails if either side drifts, not just the one a snapshot happened to capture.
 */
describe("brand ramp", () => {
  it.each(PRESETS.map((preset) => preset.name))(
    "reproduces every --reno-brand stop shipped by the %s preset",
    (name) => {
      const preset = PRESETS.find((p) => p.name === name)!;
      // The parser is plain JS shared with the build scripts; name its shape here.
      const { light } = parseThemeCss(`registry/reno/themes/${name}.css`) as {
        light: Map<string, string>;
      };
      const ramp = buildRamp(preset.brand);

      expect(ramp).toHaveLength(RAMP_STOPS.length);
      for (const { stop, color } of ramp) {
        expect(css(color)).toBe(light.get(`reno-brand-${stop}`));
      }
    },
  );

  it("keeps lightness monotonically decreasing from 50 to 950", () => {
    const ramp = buildRamp({ h: 250, c: 0.13 });
    const lightness = ramp.map((entry) => entry.color.l);
    for (let i = 1; i < lightness.length; i += 1) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1]);
    }
  });

  it("clamps a chroma no sRGB display can show back into gamut", () => {
    // A caller can pass any chroma; an out-of-gamut ramp would render as a flat
    // clipped block in the browser rather than as the picked colour.
    const ramp = buildRamp({ h: 145, c: 0.9 });
    for (const { color } of ramp) {
      expect(color.c).toBeLessThan(0.4);
      expect(Number.isFinite(color.c)).toBe(true);
    }
  });

  it("emits a neutral grey with no hue component when chroma is zero", () => {
    const [first] = buildRamp({ h: 250, c: 0 });
    expect(css(first.color)).toMatch(/^oklch\([\d.]+ 0 0\)$/);
  });
});
