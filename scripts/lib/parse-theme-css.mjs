/**
 * Shared parser for `registry/reno/themes/*.css`.
 *
 * Those files are generated with a fixed shape (`@theme`, `:root`, `.dark`), so
 * a full CSS parser would be dead weight. Both `sync-theme-vars.mjs` (which
 * turns them into registry `cssVars`) and `check-contrast.mjs` (which audits
 * them) read them through here, so the two can never drift on interpretation.
 */

import { readFileSync } from "node:fs";

const BLOCK_SELECTORS = {
  // `@theme inline` is what shadcn writes into a consuming project. Matched on
  // the at-rule name so a plain `@theme` block parses identically.
  theme: "@theme",
  light: ":root",
  dark: ".dark",
};

/**
 * Extract the body of `selector { ... }`. Brace-counting rather than a regex,
 * because declaration values contain parentheses and commas but never braces.
 */
function extractBlock(source, selector) {
  const pattern = new RegExp(`^${selector.replace(/[.*+?^$()|[\\]\\\\]/g, "\\\\$&")}[^{]*\\{`, "m");
  const match = pattern.exec(source);
  if (!match) return null;
  const start = match.index;
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(source.indexOf("{", start) + 1, i);
      }
    }
  }
  return null;
}

/** Parse `--name: value;` declarations into an ordered Map keyed without `--`. */
function parseDeclarations(body) {
  const out = new Map();
  if (!body) return out;
  for (const raw of body.split(";")) {
    const line = raw.trim();
    if (!line || line.startsWith("/*")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).trim();
    if (!name.startsWith("--")) continue;
    out.set(name.slice(2), line.slice(colon + 1).trim());
  }
  return out;
}

/**
 * Read one theme file into `{ theme, light, dark }` Maps.
 * Keys are variable names without the leading `--`, matching the shape the
 * shadcn registry expects in `cssVars`.
 */
export function parseThemeCss(path) {
  const source = readFileSync(path, "utf8");
  const result = {};
  for (const [key, selector] of Object.entries(BLOCK_SELECTORS)) {
    result[key] = parseDeclarations(extractBlock(source, selector));
  }
  return result;
}

/**
 * Resolve `var(--x)` chains against a Map so contrast checks operate on literal
 * colour values. Depth-limited: a cycle in generated output is a bug, not
 * something to recurse forever on.
 */
export function resolveVar(value, vars, depth = 0) {
  if (depth > 8) throw new Error(`var() chain too deep resolving: ${value}`);
  const match = /^var\(\s*--([\w-]+)\s*\)$/.exec(value.trim());
  if (!match) return value.trim();
  const next = vars.get(match[1]);
  if (next === undefined) throw new Error(`Unresolved variable: --${match[1]}`);
  return resolveVar(next, vars, depth + 1);
}
