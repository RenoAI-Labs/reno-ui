import { describe, expect, it } from "vitest";

import {
  BRAND_VAR_NAMES,
  DENSITY_STEPS,
  DENSITY_VAR_NAMES,
  RADIUS_CHOICES,
  brandHex,
  brandOverrides,
  densityOverrides,
  presetDensityStep,
  radiusOverride,
  secondaryOverrides,
  toCssBlock,
} from "@/app/showcase/_parts/showcase-brand-tokens";
import { BASE_PRESET, DENSITY } from "@/registry/reno/themes/theme-presets.config.mjs";

/**
 * The showcase's brand panel produces CSS that a project pastes into its own
 * `globals.css`. That makes it the one piece of the docs site whose output
 * leaves the docs site, so the maths behind it is worth holding down — a wrong
 * variable name here is a token that silently does nothing in someone's
 * product.
 *
 * The panel itself is not rendered: everything asserted below is pure, which is
 * why it lives in its own module.
 */

describe("the brand ramp comes from the build's own generator", () => {
  it("emits all eleven stops under the names the theme files use", () => {
    const overrides = brandOverrides("#7c3aed");
    expect(overrides.map((o) => o.name)).toEqual(BRAND_VAR_NAMES);
    expect(overrides).toHaveLength(11);
  });

  it("reproduces the shipped theme's ramp from its own brand colour", () => {
    /*
      The whole claim of the panel: what you preview is a palette the build could
      produce. Feeding the theme's own brand colour back in has to land on the
      ramp it ships — if it does not, the panel is previewing colours no build
      will ever produce.

      Compared at the mid stops. The extremes are near-white and near-black, so a
      hex round trip loses hue precision there and would make this test about
      sRGB rounding rather than about the ramp.
    */
    const overrides = brandOverrides(brandHex(BASE_PRESET.brand));
    const byName = new Map(overrides.map((o) => [o.name, o.value]));

    for (const stop of [400, 500, 600, 700]) {
      // The hue is what has to survive; it is the identity of the brand.
      expect(byName.get(`--reno-brand-${stop}`)).toContain(String(BASE_PRESET.brand.h));
    }
  });

  it("returns nothing for a colour it cannot parse, rather than a broken ramp", () => {
    // A colour input cannot produce this, but `toCssBlock` must never be handed
    // `--reno-brand-500: undefined`.
    expect(brandOverrides("không phải màu")).toEqual([]);
  });
});

describe("the secondary pair is produced, not read back", () => {
  it("uses a light surface in light mode and a dark one in dark", () => {
    const light = new Map(secondaryOverrides("#7c3aed", "light").map((o) => [o.name, o.value]));
    const dark = new Map(secondaryOverrides("#7c3aed", "dark").map((o) => [o.name, o.value]));

    const lightnessOf = (value: string) => Number(value.match(/oklch\(([\d.]+)/)![1]);

    // A secondary button is a surface: light on light, dark on dark.
    expect(lightnessOf(light.get("--secondary")!)).toBeGreaterThan(0.9);
    expect(lightnessOf(dark.get("--secondary")!)).toBeLessThan(0.35);
    // Whether the label on that surface is readable used to be asserted here as
    // a lightness threshold on `--secondary-foreground`. That was a proxy for
    // contrast, and `tests/brand-contrast.test.ts` now measures the real ratio
    // across every hue the panel accepts. Two tests answering one question mean
    // one regression reddens both and neither name says what broke.
  });

  it("keeps a vivid brand colour from turning a surface vivid", () => {
    /*
      The ramp's chroma curve does this, which is the reason for taking the
      value from a ramp stop rather than from the picked colour directly. A
      fully saturated secondary reads as an alert, not as a surface.
    */
    const chromaOf = (value: string) => Number(value.match(/oklch\([\d.]+ ([\d.]+)/)![1]);
    const overrides = new Map(secondaryOverrides("#ff0000", "light").map((o) => [o.name, o.value]));
    expect(chromaOf(overrides.get("--secondary")!)).toBeLessThan(0.05);
  });

  it("is a pure function of the colour and the mode", () => {
    // The property that fixes the drift the first draft had: the panel writes
    // `--secondary` itself, so anything derived from reading it back moves a
    // little further on every change. Same inputs, same output, always.
    const once = secondaryOverrides("#7c3aed", "light");
    const twice = secondaryOverrides("#7c3aed", "light");
    expect(once).toEqual(twice);
  });
});

describe("density and radius stay inside what the build ships", () => {
  it("writes all ten density variables for a step", () => {
    const overrides = densityOverrides("comfortable");
    expect(overrides.map((o) => o.name)).toEqual(DENSITY_VAR_NAMES);
  });

  it("takes its values from the config rather than restating them", () => {
    // A second copy of these numbers would let the panel preview a spacing
    // scale `npm run theme:generate` cannot produce.
    const overrides = new Map(densityOverrides("compact").map((o) => [o.name, o.value]));
    expect(overrides.get("--density-row-height")).toBe(DENSITY.compact.rowHeight);
    expect(overrides.get("--density-gap")).toBe(DENSITY.compact.gap);
  });

  it("names the step the shipped theme uses", () => {
    // If the theme's density were not one of the four steps, the panel's
    // dropdown would show the wrong one as selected.
    expect(DENSITY_STEPS).toContain(presetDensityStep(BASE_PRESET.density));
  });

  it("offers the radius the shipped theme uses", () => {
    expect(RADIUS_CHOICES).toContain(
      BASE_PRESET.radius as (typeof RADIUS_CHOICES)[number],
    );
  });
});

describe("the pasteable block", () => {
  it("is empty when nothing has been changed", () => {
    // An empty `:root {}` in someone's stylesheet is a puzzle, and the copy
    // button is disabled on this.
    expect(toCssBlock([])).toBe("");
  });

  it("writes each override as a declaration inside :root", () => {
    const block = toCssBlock([...radiusOverride("0.75rem"), ...densityOverrides("roomy")]);
    expect(block).toContain(":root {");
    expect(block).toContain("  --radius: 0.75rem;");
    expect(block).toContain(`  --density-gap: ${DENSITY.roomy.gap};`);
    expect(block.trimEnd().endsWith("}")).toBe(true);
  });

  it("says what it is not", () => {
    /*
      Six months later a block of solved values in a project's globals.css is
      indistinguishable from a generated theme, and the two diverge the moment a
      preset is regenerated. The header has to point at the config and the
      command, or this output becomes a second source of truth nobody knows is
      one.
    */
    const block = toCssBlock(radiusOverride("0.5rem"));
    expect(block).toContain("theme-presets.config.mjs");
    expect(block).toContain("theme:generate");
  });
});
