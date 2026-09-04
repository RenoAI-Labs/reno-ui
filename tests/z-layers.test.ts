import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseThemeCss } from "../scripts/lib/parse-theme-css.mjs";

/**
 * Which layer each overlay sits on, asserted against the components that read
 * it rather than as a list of numbers.
 *
 * A per-component ladder — dropdown below modal below popover — is the obvious
 * design and it is wrong. Radix portals every overlay to `document.body`, so a
 * select opened inside a popover is that popover's sibling and needs to be
 * above it; a select opened inside a dialog needs to be above the dialog. No
 * fixed number per component type can be both. Measured on the showcase before
 * this was fixed: the brand panel's radius select opened with z-index 1000
 * against the popover's 1400 and rendered behind an opaque panel — present in
 * the DOM, hit-testable through `pointer-events: none`, and invisible, which is
 * the worst of the three.
 *
 * Equal z-indexes hand the ordering to DOM order, which for Radix portals is
 * open order. So the invariant is not "these numbers" — it is "one layer", and
 * that is what is asserted.
 */

const UI_DIR = "registry/reno/ui";

/** `--z-*` tokens as the shipped theme defines them. */
const tokens = (() => {
  const { theme } = parseThemeCss("registry/reno/themes/base.css") as {
    theme: Map<string, string>;
  };
  const out = new Map<string, number>();
  for (const [name, value] of theme) {
    if (name.startsWith("z-")) out.set(`--${name}`, Number(value));
  }
  return out;
})();

/**
 * Every `--z-*` token a component reads, with the file that reads it.
 *
 * Read out of the sources rather than listed here, so a new overlay component
 * that reaches for its own layer is caught by this test rather than by someone
 * opening a select inside a dialog in production.
 */
function tokensUsedByComponents() {
  const used = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith(".tsx")) continue;
      for (const match of readFileSync(path, "utf8").matchAll(/z-\[var\((--z-[\w-]+)\)\]/g)) {
        used.set(match[1]!, [...(used.get(match[1]!) ?? []), path]);
      }
    }
  };
  walk(UI_DIR);
  return used;
}

/** In normal flow, so it is not part of the portaled stack. */
const IN_FLOW = "--z-sticky";

describe("portaled overlays share one layer", () => {
  const used = tokensUsedByComponents();

  it("uses only layers the theme defines", () => {
    // A component reaching for a token that does not exist gets `z-index:
    // auto`, which happens to work until something else is positioned.
    for (const [token, files] of used) {
      expect(tokens.has(token), `${token} (used by ${files.join(", ")}) is not in base.css`).toBe(
        true,
      );
    }
  });

  it("puts every portaled overlay on the same z-index", () => {
    /*
      The one that matters. Two overlays on different layers cannot both be
      "above whatever opened me", and the loser renders behind an opaque
      surface — which is what happened to the brand panel's selects.
    */
    // Tokens the theme actually defines: an invented one is the test above's
    // to report, and counting it here as a second layer would mean one mistake
    // reddening both.
    const overlays = [...used.keys()].filter((token) => token !== IN_FLOW && tokens.has(token));
    const layers = new Map<number, string[]>();
    for (const token of overlays) {
      const z = tokens.get(token)!;
      layers.set(z, [...(layers.get(z) ?? []), token]);
    }

    expect(overlays.length).toBeGreaterThan(1);
    expect([...layers.keys()]).toHaveLength(1);
  });

  it("keeps the sticky layer under the overlays and toasts over them", () => {
    // Compared against `--z-modal` rather than against the overlay set, so
    // this stays a statement about these three layers even if the set above
    // ever splits.
    const overlay = tokens.get("--z-modal")!;
    expect(tokens.get(IN_FLOW)!).toBeLessThan(overlay);
    // A toast reports something that happened elsewhere, so it outranks
    // whatever is open by rule rather than by which opened last.
    expect(tokens.get("--z-toast")!).toBeGreaterThan(overlay);
  });
});
