#!/usr/bin/env node
/**
 * Pins a version range on every npm dependency a registry item declares.
 *
 * Why this exists — the failure it prevents is silent and expensive:
 *
 * `shadcn add` hands each `dependencies` entry to the consumer's package
 * manager. An entry with no version ("@tanstack/react-table") is satisfied by
 * WHATEVER the project already has. A project sitting on TanStack Table v8
 * therefore installs reno's v9 component source against its own v8 runtime,
 * the CLI reports success, and the project only finds out at the next
 * typecheck — with 30+ errors pointing at files it did not write.
 *
 * That is exactly what happened when reno-ui was first pulled into a real
 * project (P6a gate, 2026-09-01). A version range makes the same situation a
 * loud install-time conflict instead.
 *
 * The range is derived from this repository's own `package.json`, because the
 * version reno-ui is developed and tested against is the only version it can
 * honestly claim to support. Caret, not exact: a consumer should be free to
 * take patches, but never a major.
 *
 * The same pass also catches the opposite mistake: source that imports a
 * package the item never declares. `shadcn add` only installs what the item
 * lists, so an undeclared import installs nothing and the consumer's FIRST
 * typecheck fails inside a file it did not write. Five items shipped importing
 * `lucide-react` without declaring it; nothing here read the source, so nothing
 * could see it. Found by installing the registry into a blank project.
 *
 * Usage:
 *   node scripts/sync-item-deps.mjs           # rewrite registry/items/*.json
 *   node scripts/sync-item-deps.mjs --check   # fail if any item is stale
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_DIR = join(ROOT, "registry/items");
const DEP_FIELDS = ["dependencies", "devDependencies"];

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const known = { ...pkg.dependencies, ...pkg.devDependencies };

/** Split "@scope/name@^1.2.3" into name and range without tripping on the scope's `@`. */
function splitSpec(spec) {
  const at = spec.lastIndexOf("@");
  if (at <= 0) return { name: spec, range: null };
  return { name: spec.slice(0, at), range: spec.slice(at + 1) };
}

/**
 * Strip a range operator off a version this repository declares.
 *
 * reno-ui pins its own dependencies exactly, so for a long time every value
 * read here was a bare version and prefixing `^` was safe. `npm install`
 * disagrees: it writes `^1.7.1` unless told otherwise, and one dependency
 * landing that way produced `hls.js@^^1.7.1` in an item — which installs
 * nowhere. npm rejects it with `EINVALIDTAGNAME`, and the only place that
 * surfaced was a real `shadcn add` into a real project.
 *
 * `>=`, `<=` and `<` are matched before `>` and `~`, so the two-character forms
 * are not left half-stripped.
 */
function bareVersion(declared) {
  return declared.replace(/^(?:\^|~|>=|<=|>|<|=)/, "").trim();
}

function pin(spec, itemName, errors) {
  const { name } = splitSpec(spec);
  const declared = known[name];
  if (!declared) {
    errors.push(
      `${itemName}: dependency "${name}" is not in reno-ui's own package.json. ` +
        `Add it there first — the registry may only ship versions this repository builds and tests against.`,
    );
    return spec;
  }
  return `${name}@^${bareVersion(declared)}`;
}

/**
 * Packages every consumer already has because the component tree runs in them.
 * Declaring these would make `shadcn add` try to reinstall the project's own
 * framework, so they stay out of item dependencies on purpose.
 */
const AMBIENT = new Set(["react", "react-dom", "next"]);

/** Bare npm package name from an import specifier, or null if it is not one. */
function packageOf(spec) {
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@/")) return null;
  if (spec.startsWith("node:")) return null;
  const parts = spec.split("/");
  const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  if (AMBIENT.has(name) || name.startsWith("next/")) return null;
  return name;
}

/** Every npm package an item's own source files import. */
function importsOf(item) {
  const found = new Set();
  for (const file of item.files ?? []) {
    const path = join(ROOT, file.path);
    if (!existsSync(path)) continue;
    // Comments hold example imports that nothing installs - a doc block showing
    // `import { css } from "@codemirror/lang-css"` is not a dependency.
    const src = readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => !/^\s*\/\//.test(line))
      .join("\n");
    for (const m of src.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
      const name = packageOf(m[1]);
      if (name) found.add(name);
    }
    for (const m of src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) {
      const name = packageOf(m[1]);
      if (name) found.add(name);
    }
  }
  return found;
}

function main() {
  const check = process.argv.includes("--check");
  const errors = [];
  const stale = [];
  const undeclared = [];
  let pinned = 0;

  for (const file of readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(ITEMS_DIR, file);
    const raw = readFileSync(path, "utf8");
    const item = JSON.parse(raw);
    let changed = false;

    // Source imports a package the item never declared -> the consumer installs
    // nothing and fails at typecheck. Add it here, from this repo's own range.
    const declared = new Set(
      DEP_FIELDS.flatMap((f) => item[f] ?? []).map((spec) => splitSpec(spec).name),
    );
    const missing = [...importsOf(item)].filter((name) => !declared.has(name)).sort();
    if (missing.length) {
      const unknown = missing.filter((name) => !known[name]);
      if (unknown.length) {
        errors.push(
          `${item.name ?? file}: source imports ${unknown.map((u) => `"${u}"`).join(", ")}, ` +
            `which reno-ui's own package.json does not have. Add it there first.`,
        );
      }
      const addable = missing.filter((name) => known[name]);
      if (addable.length) {
        item.dependencies = [...(item.dependencies ?? []), ...addable].sort();
        changed = true;
        undeclared.push(`${item.name ?? file}: ${addable.join(", ")}`);
      }
    }

    for (const field of DEP_FIELDS) {
      const list = item[field];
      if (!Array.isArray(list)) continue;
      const next = list.map((spec) => pin(spec, item.name ?? file, errors));
      pinned += next.length;
      if (next.some((v, i) => v !== list[i])) {
        item[field] = next;
        changed = true;
      }
    }

    if (!changed) continue;
    if (check) stale.push(file);
    else writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
  }

  if (errors.length) {
    console.error("Registry dependency check failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  if (check && undeclared.length) {
    console.error(
      `Registry items import npm packages they do not declare (${undeclared.length} item(s)):`,
    );
    for (const u of undeclared) console.error(`  - ${u}`);
    console.error("Run `npm run items:sync` and rebuild the registry.");
    process.exit(1);
  }

  if (check && stale.length) {
    console.error(
      `Registry items carry unversioned or stale npm dependencies (${stale.length} file(s)):`,
    );
    for (const f of stale) console.error(`  - registry/items/${f}`);
    console.error("Run `npm run items:sync` and rebuild the registry.");
    process.exit(1);
  }

  console.log(
    check
      ? `Registry dependency versions OK — ${pinned} dependency spec(s) pinned.`
      : `Pinned ${pinned} dependency spec(s) across registry/items/.`,
  );
}

main();
