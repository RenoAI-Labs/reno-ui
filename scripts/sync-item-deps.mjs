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
 * Usage:
 *   node scripts/sync-item-deps.mjs           # rewrite registry/items/*.json
 *   node scripts/sync-item-deps.mjs --check   # fail if any item is stale
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

function pin(spec, itemName, errors) {
  const { name } = splitSpec(spec);
  const version = known[name];
  if (!version) {
    errors.push(
      `${itemName}: dependency "${name}" is not in reno-ui's own package.json. ` +
        `Add it there first — the registry may only ship versions this repository builds and tests against.`,
    );
    return spec;
  }
  return `${name}@^${version}`;
}

function main() {
  const check = process.argv.includes("--check");
  const errors = [];
  const stale = [];
  let pinned = 0;

  for (const file of readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const path = join(ITEMS_DIR, file);
    const raw = readFileSync(path, "utf8");
    const item = JSON.parse(raw);
    let changed = false;

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
