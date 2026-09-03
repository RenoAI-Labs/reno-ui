/**
 * Source of truth for every reno theme preset.
 *
 * Nothing here is a final CSS value — `scripts/generate-scale.mjs` turns these
 * compact definitions into the OKLCH ramps and the contrast-solved semantic
 * tokens written to `registry/reno/themes/*.css`. Hand-authoring ~300 OKLCH
 * values across 4 presets x 2 modes cannot be kept WCAG AA compliant by eye,
 * so the values are solved instead of guessed.
 *
 * To tune a preset: change the hue/chroma/density numbers below and re-run
 * `npm run theme:generate`. Never edit the generated `.css` files directly.
 */

import { clampChroma } from "culori";

/** Lightness stops for an 11-step OKLCH ramp (50 -> 950). */
export const RAMP_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Perceptual lightness for each ramp stop. Shared by every hue. */
export const RAMP_LIGHTNESS = [
  0.985, 0.967, 0.929, 0.871, 0.746, 0.637, 0.577, 0.505, 0.444, 0.396, 0.269,
];

/**
 * Chroma multiplier per ramp stop. Chroma peaks in the middle of the ramp and
 * falls off at both ends, which is what keeps a ramp from looking muddy at 50
 * and neon at 950.
 */
export const RAMP_CHROMA_SCALE = [
  0.09, 0.18, 0.35, 0.6, 0.85, 1.0, 1.0, 0.92, 0.8, 0.7, 0.55,
];

/**
 * Ramp construction lives here, not in `scripts/generate-scale.mjs`, because it
 * has two callers: the build script that writes the shipped presets, and the
 * showcase brand picker that builds a ramp in the browser. Two copies would
 * mean the picker previews colours the presets never produce — the same class
 * of drift `sync-theme-vars.mjs` guards against one layer up.
 *
 * This module is plain `.mjs` on purpose: Node 20 cannot import TypeScript, so
 * a `.ts` module could not be shared with the build script at all.
 */

/** Round to 4 decimals so generated files are byte-stable across runs. */
export const r4 = (n) => Math.round(n * 10000) / 10000;

/** Build an sRGB-safe OKLCH colour object. */
export function mk(l, c, h) {
  return clampChroma({ mode: "oklch", l, c, h }, "oklch", "rgb");
}

/** Serialise as `oklch(L C H)` with stable precision. */
export function css(color) {
  const { l, c, h } = color;
  if (c < 0.0005) return `oklch(${r4(l)} 0 0)`;
  return `oklch(${r4(l)} ${r4(c)} ${r4(h ?? 0)})`;
}

/**
 * Build an 11-step ramp for a hue. Lightness comes from the shared stop table;
 * chroma is scaled so it peaks mid-ramp, which keeps the light end from looking
 * muddy and the dark end from looking neon.
 */
export function buildRamp({ h, c }) {
  return RAMP_STOPS.map((stop, i) => ({
    stop,
    color: mk(RAMP_LIGHTNESS[i], c * RAMP_CHROMA_SCALE[i], h),
  }));
}

/** WCAG AA thresholds. `check-contrast.mjs` enforces the same numbers. */
export const CONTRAST = {
  /** Normal-size body text. */
  text: 4.5,
  /** Large text and non-text UI affordances (borders, icons, focus rings). */
  ui: 3.0,
  /** Solved values aim slightly above the gate so rounding never trips CI. */
  margin: 0.15,
};

/**
 * Semantic hues shared by every preset. Only `primary` varies per preset —
 * destructive/success/warning/info must stay recognisable across domains.
 */
export const STATUS_HUES = {
  destructive: { h: 27, c: 0.19 },
  success: { h: 150, c: 0.14 },
  warning: { h: 75, c: 0.16 },
  info: { h: 235, c: 0.14 },
};

/**
 * Density presets. These drive `--density-*` tokens, which is what makes an ERP
 * screen fit more rows than an e-learning screen without any component change.
 *
 * Exported for the same reason `buildRamp` is: the showcase's brand panel lets
 * you switch density live, and a second copy of these numbers there would let
 * the panel preview a spacing scale the build cannot produce.
 */
export const DENSITY = {
  compact: {
    controlHeightSm: "1.5rem",
    controlHeight: "1.75rem",
    controlHeightLg: "2rem",
    controlPx: "0.5rem",
    rowHeight: "2rem",
    cellPaddingX: "0.5rem",
    cellPaddingY: "0.25rem",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    lineHeight: "1.35",
  },
  normal: {
    controlHeightSm: "2rem",
    controlHeight: "2.25rem",
    controlHeightLg: "2.5rem",
    controlPx: "0.75rem",
    rowHeight: "2.75rem",
    cellPaddingX: "0.75rem",
    cellPaddingY: "0.5rem",
    gap: "0.75rem",
    fontSize: "0.875rem",
    lineHeight: "1.45",
  },
  comfortable: {
    controlHeightSm: "2.25rem",
    controlHeight: "2.5rem",
    controlHeightLg: "2.875rem",
    controlPx: "0.875rem",
    rowHeight: "3rem",
    cellPaddingX: "0.875rem",
    cellPaddingY: "0.625rem",
    gap: "1rem",
    fontSize: "0.9375rem",
    lineHeight: "1.55",
  },
  roomy: {
    controlHeightSm: "2.5rem",
    controlHeight: "2.75rem",
    controlHeightLg: "3.25rem",
    controlPx: "1rem",
    rowHeight: "3.25rem",
    cellPaddingX: "1rem",
    cellPaddingY: "0.75rem",
    gap: "1rem",
    fontSize: "1rem",
    lineHeight: "1.6",
  },
};

/**
 * `base` is not a domain preset — it is the neutral fallback. A project that
 * installs `@reno/theme-base` and no preset must still render correctly, so
 * base carries a complete token set of its own.
 */
export const BASE_PRESET = {
  name: "base",
  title: "Theme Base",
  description:
    "Neutral fallback theme. Declares every semantic token reno components read. Installed automatically as a dependency of every preset.",
  brand: { h: 250, c: 0.13 },
  neutral: { h: 250, c: 0.004 },
  radius: "0.5rem",
  density: DENSITY.normal,
};

export const PRESETS = [
  {
    name: "elearning",
    title: "Theme E-learning",
    description:
      "Warm palette, large radius and roomy density for long reading sessions.",
    brand: { h: 45, c: 0.145 },
    neutral: { h: 60, c: 0.008 },
    radius: "0.75rem",
    density: DENSITY.roomy,
  },
  {
    name: "admin",
    title: "Theme Admin",
    description:
      "Neutral blue, standard density. The safe default for back-office screens.",
    brand: { h: 250, c: 0.13 },
    neutral: { h: 250, c: 0.004 },
    radius: "0.5rem",
    density: DENSITY.normal,
  },
  {
    name: "erp",
    title: "Theme ERP",
    description:
      "High-density preset for data-heavy ERP screens. Small radius, tight spacing, short grid rows.",
    brand: { h: 165, c: 0.115 },
    neutral: { h: 200, c: 0.003 },
    radius: "0.25rem",
    density: DENSITY.compact,
  },
  {
    name: "cms",
    title: "Theme CMS",
    description:
      "Content-first preset. Violet accent, generous typography and spacing.",
    brand: { h: 305, c: 0.13 },
    neutral: { h: 300, c: 0.004 },
    radius: "0.5rem",
    density: DENSITY.comfortable,
  },
];

/** Non-color tokens that never vary between presets. */
export const STATIC_THEME_TOKENS = {
  // Deliberately framework-neutral: a consuming project that is not Next.js must
  // still get a sane stack. Projects layering a webfont on top override --font-sans
  // in their own globals.css.
  "font-sans":
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "font-mono":
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  "shadow-xs": "0 1px 2px 0 oklch(0 0 0 / 0.05)",
  "shadow-sm": "0 1px 3px 0 oklch(0 0 0 / 0.1), 0 1px 2px -1px oklch(0 0 0 / 0.1)",
  "shadow-md":
    "0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)",
  "shadow-lg":
    "0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)",
  "z-dropdown": "1000",
  "z-sticky": "1100",
  "z-overlay": "1200",
  "z-modal": "1300",
  "z-popover": "1400",
  "z-toast": "1500",
};

/**
 * Animation primitives, shipped through the theme item.
 *
 * Overlays (dialog, sheet, drawer, popover, tooltip, dropdown, ...) use
 * `animate-in` / `fade-in-0` / `zoom-in-95` / `slide-in-from-*`. Those classes
 * come from `tw-animate-css` in a stock shadcn project. reno-ui does NOT depend
 * on it: a component library that requires an extra Tailwind plugin leaves that
 * dependency behind in the customer's repo, which is exactly what the handover
 * promise rules out.
 *
 * Split across two channels, and the split is not arbitrary:
 *
 * - `ANIMATION_THEME_TOKENS` -> `cssVars.theme`, i.e. Tailwind's own
 *   `--animate-*` namespace. Tailwind generates `.animate-in` from
 *   `--animate-in` **and emits the referenced @keyframes only because the
 *   utility is generated from the theme**. Defining `.animate-in` as a hand-
 *   written `@utility` instead looks equivalent but silently drops the
 *   keyframes: Tailwind sees nothing referencing them and treats them as dead.
 * - `ANIMATION_CSS` -> the item's `css` field, carrying the @keyframes and the
 *   *modifier* utilities. The shadcn CLI nests `@keyframes` from `css` into
 *   `@theme`, which is precisely where Tailwind wants them for the above.
 *
 * Composition follows tw-animate-css: one `enter`/`exit` keyframe reads a set
 * of CSS variables and each modifier sets one variable, so
 * `animate-in fade-in-0 zoom-in-95` combines instead of fighting over
 * `animation-name`.
 */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export const ANIMATION_THEME_TOKENS = {
  "animate-in": `reno-enter 150ms ${EASE}`,
  "animate-out": `reno-exit 150ms ${EASE}`,
  "animate-accordion-down": "reno-accordion-down 200ms cubic-bezier(0.87, 0, 0.13, 1)",
  "animate-accordion-up": "reno-accordion-up 200ms cubic-bezier(0.87, 0, 0.13, 1)",
  "animate-caret-blink": "reno-caret-blink 1.25s ease-out infinite",
};

/** Directional slide utilities, generated so the eight names cannot drift apart. */
function slideUtilities() {
  const axes = {
    top: ["translate-y", "-100%"],
    bottom: ["translate-y", "100%"],
    left: ["translate-x", "-100%"],
    right: ["translate-x", "100%"],
  };
  const out = {};
  for (const [side, [axis, distance]] of Object.entries(axes)) {
    out[`@utility slide-in-from-${side}-*`] = {
      [`--reno-enter-${axis}`]: "calc(--value(integer) * 1px)",
    };
    out[`@utility slide-out-to-${side}-*`] = {
      [`--reno-exit-${axis}`]: "calc(--value(integer) * 1px)",
    };
    out[`@utility slide-in-from-${side}`] = { [`--reno-enter-${axis}`]: distance };
    out[`@utility slide-out-to-${side}`] = { [`--reno-exit-${axis}`]: distance };
  }
  return out;
}

export const ANIMATION_CSS = {
  "@keyframes reno-enter": {
    from: {
      opacity: "var(--reno-enter-opacity, 1)",
      transform:
        "translate3d(var(--reno-enter-translate-x, 0), var(--reno-enter-translate-y, 0), 0) scale3d(var(--reno-enter-scale, 1), var(--reno-enter-scale, 1), var(--reno-enter-scale, 1))",
    },
  },
  "@keyframes reno-exit": {
    to: {
      opacity: "var(--reno-exit-opacity, 1)",
      transform:
        "translate3d(var(--reno-exit-translate-x, 0), var(--reno-exit-translate-y, 0), 0) scale3d(var(--reno-exit-scale, 1), var(--reno-exit-scale, 1), var(--reno-exit-scale, 1))",
    },
  },
  "@keyframes reno-accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "@keyframes reno-accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "@keyframes reno-caret-blink": {
    "0%,70%,100%": { opacity: "1" },
    "20%,50%": { opacity: "0" },
  },

  "@utility fade-in-*": { "--reno-enter-opacity": "calc(--value(integer) / 100)" },
  "@utility fade-out-*": { "--reno-exit-opacity": "calc(--value(integer) / 100)" },
  "@utility zoom-in-*": { "--reno-enter-scale": "calc(--value(integer) / 100)" },
  "@utility zoom-out-*": { "--reno-exit-scale": "calc(--value(integer) / 100)" },

  ...slideUtilities(),
};
