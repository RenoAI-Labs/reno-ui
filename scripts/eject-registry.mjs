#!/usr/bin/env node
/**
 * Removes every trace of the reno registry from a CUSTOMER project.
 *
 * Run this inside the customer's repo before handover, not inside reno-ui.
 *
 * What it is actually cleaning up: the shadcn CLI is an install-time tool. It
 * fetches JSON, writes .tsx files into the repo, installs npm deps, and exits.
 * Nothing calls home at runtime. The only residue is the `registries` entry in
 * components.json, which is pure dev tooling and affects neither build nor
 * deploy. This script removes it and then proves nothing else is left.
 *
 * Because the registry is public open source there are no tokens or secrets to
 * scrub — ejecting is about a clean contract, not about revoking access.
 *
 * Usage:
 *   node eject-registry.mjs [--dir <path>] [--dry-run]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const NAMESPACE = "@reno";

function parseArgs(argv) {
  const args = { dir: process.cwd(), dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dir") args.dir = resolve(argv[(i += 1)]);
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

/** Step 1 — drop the `@reno` namespace from components.json. */
function cleanComponentsJson(projectDir, dryRun) {
  const path = join(projectDir, "components.json");
  if (!existsSync(path)) {
    console.log("• components.json not found — nothing to clean.");
    return false;
  }

  const raw = readFileSync(path, "utf8");
  const config = JSON.parse(raw);
  if (!config.registries || !(NAMESPACE in config.registries)) {
    console.log(`• components.json has no "${NAMESPACE}" registry — already clean.`);
    return false;
  }

  delete config.registries[NAMESPACE];
  // Leaving an empty `registries: {}` behind is meaningless noise in a file the
  // customer will read.
  if (Object.keys(config.registries).length === 0) delete config.registries;

  if (dryRun) {
    console.log(`• [dry-run] would remove "${NAMESPACE}" from components.json`);
    return true;
  }

  // Preserve the file's trailing-newline convention.
  writeFileSync(path, `${JSON.stringify(config, null, 2)}${raw.endsWith("\n") ? "\n" : ""}`);
  console.log(`✔ Removed "${NAMESPACE}" from components.json`);
  return true;
}

/** Step 2 — prove no source file still references the namespace. */
function assertNoReferences(projectDir) {
  let output = "";
  try {
    output = execFileSync(
      "grep",
      [
        "-rn",
        `${NAMESPACE}/`,
        "--exclude-dir=node_modules",
        "--exclude-dir=.git",
        "--exclude-dir=.next",
        "--exclude-dir=dist",
        "--exclude-dir=build",
        ".",
      ],
      { cwd: projectDir, encoding: "utf8" },
    );
  } catch (error) {
    // grep exits 1 when it finds nothing, which is the success case here.
    if (error.status === 1) {
      console.log(`✔ No "${NAMESPACE}/" references remain.`);
      return true;
    }
    throw error;
  }

  const hits = output.trim().split("\n").filter(Boolean);
  console.error(`✘ Found ${hits.length} remaining "${NAMESPACE}/" reference(s):`);
  for (const hit of hits) console.error(`    ${hit}`);
  return false;
}

/** Step 3 — the parts a script cannot do for you. */
function printManualChecklist() {
  console.log("\nRemaining manual steps before handover:");
  console.log("  1. Copy docs/ui-components.md into the customer repo — it records");
  console.log("     the origin and license of every component they now own.");
  console.log("  2. Run scripts/verify-selfcontained.sh against a clean clone.");
  console.log("  3. Optional: if the customer wants to extend the kit themselves,");
  console.log("     hand over registry/ and registry.json too.");
  console.log("  4. Confirm their browser floor: Safari 16.4+ / Chrome 111+ / Firefox 128+.");
}

function main() {
  const { dir, dryRun } = parseArgs(process.argv.slice(2));
  console.log(`Ejecting reno registry from: ${dir}${dryRun ? " (dry run)" : ""}\n`);

  cleanComponentsJson(dir, dryRun);
  const clean = assertNoReferences(dir);
  printManualChecklist();

  if (!clean) {
    console.error(
      "\nEject incomplete. Every listed reference must be resolved before handover.",
    );
    process.exit(1);
  }
  console.log("\n✔ Eject complete.");
}

main();
