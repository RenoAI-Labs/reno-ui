#!/usr/bin/env node
/**
 * Assembles `registry.json` from `registry/items/*.json`, one file per item.
 *
 * Why split: `registry.json` is the file every contributor touches when adding a
 * component, and theme items alone push it past a thousand generated lines.
 * Keeping items in separate files means two people adding two components never
 * conflict, and reviewing a new item means reading one small file rather than a
 * diff inside a huge one.
 *
 * Each item file is a standard shadcn registry item plus a `meta` block
 * recording provenance. `meta` rides along to consumers, so an installed
 * component carries its own origin and license.
 *
 * Usage:
 *   node scripts/build-registry-json.mjs           # write registry.json
 *   node scripts/build-registry-json.mjs --check   # fail if stale
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = join(ROOT, "registry/items");
const REGISTRY_PATH = join(ROOT, "registry.json");

const REGISTRY_META = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "reno",
  homepage: "https://ui.reno.ai.vn",
};

/**
 * Sort order for the assembled catalog. Deterministic so the file never churns,
 * and grouped so a human scanning it sees infrastructure, then themes, then
 * components, then blocks.
 */
const TYPE_ORDER = [
  "registry:lib",
  "registry:hook",
  "registry:theme",
  "registry:ui",
  "registry:block",
];

const REQUIRED_META = ["source", "license", "added"];

export function loadItems() {
  if (!existsSync(ITEMS_DIR)) return [];
  return readdirSync(ITEMS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const path = join(ITEMS_DIR, file);
      const item = JSON.parse(readFileSync(path, "utf8"));
      const expected = `${item.name}.json`;
      if (file !== expected) {
        throw new Error(`registry/items/${file} declares name "${item.name}" — rename it to ${expected}.`);
      }
      return item;
    })
    .sort((a, b) => {
      const ta = TYPE_ORDER.indexOf(a.type);
      const tb = TYPE_ORDER.indexOf(b.type);
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Every relative import inside a registered file must point at another file in
 * the SAME item.
 *
 * The failure this prevents: splitting a component into a new sibling file and
 * forgetting to add it to `files`. Everything still builds here — the file is on
 * disk — and only the consuming project breaks, with a "Module not found" that
 * points at a path the developer never touched. Caught at assembly time instead.
 */
function checkRelativeImports(item, errors) {
  const own = new Set((item.files ?? []).map((f) => resolve(ROOT, f.path)));

  for (const file of item.files ?? []) {
    const abs = resolve(ROOT, file.path);
    if (!existsSync(abs)) continue;

    const source = readFileSync(abs, "utf8");
    for (const match of source.matchAll(/from\s*["'](\.[^"']*)["']/g)) {
      const target = resolve(dirname(abs), match[1]);
      const resolved = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].some((ext) =>
        own.has(`${target}${ext}`),
      );
      if (!resolved) {
        errors.push(
          `"${item.name}" file ${file.path} imports "${match[1]}", which is not listed in its own files[]. A consuming project would install a broken component.`,
        );
      }
    }
  }
}

function validate(items) {
  const errors = [];
  const names = new Set();

  for (const item of items) {
    if (names.has(item.name)) errors.push(`Duplicate item name "${item.name}".`);
    names.add(item.name);

    if (!TYPE_ORDER.includes(item.type)) {
      errors.push(`"${item.name}" has unknown type "${item.type}".`);
    }
    for (const key of REQUIRED_META) {
      if (!item.meta?.[key]) {
        errors.push(`"${item.name}" is missing meta.${key} in registry/items/${item.name}.json.`);
      }
    }
    for (const file of item.files ?? []) {
      if (!existsSync(join(ROOT, file.path))) {
        errors.push(`"${item.name}" references missing file ${file.path}.`);
      }
    }
    checkRelativeImports(item, errors);

    // A dangling registryDependency installs nothing and fails silently in the
    // consuming project, so catch it here rather than at someone's install time.
    for (const dep of item.registryDependencies ?? []) {
      if (!dep.startsWith("@reno/")) continue;
      const depName = dep.slice("@reno/".length);
      if (!items.some((i) => i.name === depName)) {
        errors.push(`"${item.name}" depends on "${dep}", which is not in this registry.`);
      }
    }
  }

  if (errors.length) {
    console.error(`Registry item validation failed (${errors.length} issue(s)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

function main() {
  const check = process.argv.includes("--check");
  const items = loadItems();
  if (items.length === 0) {
    console.error("No item files found in registry/items/.");
    process.exit(1);
  }
  validate(items);

  const next = `${JSON.stringify({ ...REGISTRY_META, items }, null, 2)}\n`;
  const current = existsSync(REGISTRY_PATH) ? readFileSync(REGISTRY_PATH, "utf8") : null;

  if (current === next) {
    if (check) console.log(`registry.json up to date (${items.length} items).`);
    return;
  }
  if (check) {
    console.error("registry.json is stale. Run `npm run registry:assemble`.");
    process.exit(1);
  }
  writeFileSync(REGISTRY_PATH, next);
  console.log(`Assembled registry.json from ${items.length} item files.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
