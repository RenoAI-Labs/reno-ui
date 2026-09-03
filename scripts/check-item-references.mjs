#!/usr/bin/env node
/**
 * Every `@reno/<item>` named in a CI workflow must still exist.
 *
 * Written after a real outage of exactly this shape. Removing the four domain
 * theme presets left `@reno/theme-cms` in one step of `registry.yml`. The
 * install smoke job failed on a 404, the deploy job depends on it, and so six
 * pushes in a row went green locally and shipped nothing — the site stayed on
 * the commit before the removal for five hours before anyone looked at Actions.
 *
 * Nothing else could have caught it. Every other gate reads the registry, the
 * source or the built site; none of them reads the workflow that installs from
 * the registry, and a workflow is the one file whose mistakes only surface
 * after a push.
 *
 * Scope is deliberately just the workflows. Docs also name items, but a reader
 * following a stale install command sees the 404 immediately, and
 * `docs/ui-components.md` names removed items on purpose — it is where their
 * removal is recorded.
 *
 * Usage: node scripts/check-item-references.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadItems } from "./build-registry-json.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW_DIR = join(ROOT, ".github/workflows");

const existing = new Set(loadItems().map((item) => item.name));

const problems = [];
let references = 0;

for (const file of readdirSync(WORKFLOW_DIR).filter((f) => /\.ya?ml$/.test(f))) {
  const lines = readFileSync(join(WORKFLOW_DIR, file), "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/@reno\/([a-z0-9-]+)/g)) {
      // `@reno` on its own is the registry alias in `components.json`, not an
      // item; only a name after the slash is a reference to check.
      references += 1;
      if (!existing.has(match[1])) {
        problems.push(`${file}:${index + 1} references @reno/${match[1]}, which no item defines`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error("Workflow references an item that does not exist:");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("\nCI installs from the registry, so this fails after a push, not before one.");
  process.exit(1);
}

console.log(`Item references OK — ${references} @reno/* reference(s) in workflows all resolve.`);
