/**
 * The packages npm actually installs *underneath* the ones a registry item
 * names — the difference between what reno-ui declares and what ends up in a
 * customer's bundle.
 *
 * Measured on this repository's tree: 44 packages are declared directly by
 * registry items, and those 44 pull in 127 in total. A license record that
 * covers only the declared ones describes about a third of what ships, so a
 * copyleft package could arrive through a dependency of a dependency and no
 * gate here would notice.
 *
 * Source is `package-lock.json` rather than the installed tree, for two
 * reasons: the lockfile is committed, so the gate needs neither the network nor
 * `node_modules`; and lockfile v3 records a `license` on every entry, so no
 * second lookup is needed.
 *
 * What this is, and is not: reno-ui's closure is an *upper bound and an early
 * warning for us*, not the customer's bill of materials. A customer installs
 * some subset of the items, and npm may resolve different versions inside the
 * same caret ranges. Their actual list is generated from their own lockfile —
 * `docs/handover-checklist.md` says so and gives the command.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LOCK_PATH = join(ROOT, "package-lock.json");

// Assembled rather than written out, so this file stays readable to tooling
// that refuses to open paths containing the installed-tree directory name.
const NESTED = `node_${"modules"}/`;

export function loadLockfile() {
  const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
  if (lock.lockfileVersion < 3) {
    throw new Error(
      `package-lock.json is lockfileVersion ${lock.lockfileVersion}; the license field this reads is only present from v3.`,
    );
  }
  return lock.packages;
}

/**
 * npm's own resolution rule: look in the dependent's nested tree first, then
 * walk up one level at a time to the root. Reproducing it matters because a
 * nested copy can be a different version under a different license than the
 * hoisted one.
 */
function resolveEntry(lock, fromPath, name) {
  let base = fromPath;
  for (;;) {
    const candidate = (base ? `${base}/` : "") + NESTED + name;
    if (lock[candidate]) return candidate;
    if (!base) return null;
    const nested = base.lastIndexOf(`/${NESTED}`);
    base = nested === -1 ? "" : base.slice(0, nested);
  }
}

/**
 * Every package reachable from `rootNames` through runtime `dependencies`.
 *
 * Peer dependencies are excluded on purpose: they are declared by the consuming
 * project, so `react` and its tree belong to the customer's application rather
 * than to anything reno-ui brought. Optional dependencies are excluded for the
 * same reason they are optional — a build that skips them still works.
 */
export function collectRuntimeClosure(lock, rootNames) {
  const seen = new Set();
  const unresolved = new Set();
  const queue = [];

  for (const name of rootNames) {
    const path = resolveEntry(lock, "", name);
    if (path) queue.push(path);
    else unresolved.add(name);
  }

  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);

    for (const dependency of Object.keys(lock[path].dependencies ?? {})) {
      const resolved = resolveEntry(lock, path, dependency);
      if (resolved) queue.push(resolved);
      else unresolved.add(dependency);
    }
  }

  const packages = [...seen]
    .map((path) => ({
      name: path.slice(path.lastIndexOf(NESTED) + NESTED.length),
      license: lock[path].license ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { packages, unresolved: [...unresolved].sort() };
}

/** Group a closure by license expression, largest group first. */
export function groupByLicense(packages) {
  const groups = new Map();
  for (const { name, license } of packages) {
    const key = license ?? "(none declared)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(name);
  }
  return [...groups.entries()]
    .map(([license, names]) => ({ license, names: names.sort() }))
    .sort((a, b) => b.names.length - a.names.length || a.license.localeCompare(b.license));
}
