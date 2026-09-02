#!/usr/bin/env node
/**
 * Refreshes `registry/dependency-licenses.json` from the packages installed in
 * this repository.
 *
 * Run by hand after adding or bumping a dependency that a registry item
 * declares — never in CI. The gate that reads the table
 * (`scripts/check-provenance.mjs`) must stay offline and must not need
 * `node_modules`, so the two are separate commands.
 *
 * The license is read from the installed package rather than from the npm
 * registry, because the installed version is the one reno-ui builds and tests
 * against, and a package's license can change between versions. Whether the
 * package ships its own NOTICE file is recorded too: under Apache-2.0 that file
 * is what has to travel with a redistribution, and it is the one fact about a
 * dependency that cannot be derived from the license identifier.
 *
 * Usage:
 *   node scripts/sync-dependency-licenses.mjs
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadItems } from "./build-registry-json.mjs";
import { TABLE_PATH, TABLE_REL, collectDependencies } from "./lib/dependency-licenses.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** npm has carried three shapes for this field over the years. Read all of them. */
function licenseOf(pkg) {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type ?? l).join(" OR ");
  return null;
}

function readInstalled(name) {
  const dir = join(ROOT, "node_modules", name);
  const manifest = join(dir, "package.json");
  if (!existsSync(manifest)) return null;
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  return {
    version: pkg.version,
    license: licenseOf(pkg),
    notice: readdirSync(dir).some((f) => /^notice(\.|$)/i.test(f)),
  };
}

function main() {
  const deps = collectDependencies(loadItems());
  const missing = [];
  const unlicensed = [];
  const packages = {};

  for (const { name } of deps) {
    const installed = readInstalled(name);
    if (!installed) {
      missing.push(name);
      continue;
    }
    if (!installed.license) {
      unlicensed.push(name);
      continue;
    }
    packages[name] = {
      license: installed.license,
      version: installed.version,
      notice: installed.notice,
    };
  }

  if (missing.length) {
    console.error(`Not installed — run \`npm install\` first (${missing.length}):`);
    for (const n of missing) console.error(`  - ${n}`);
    process.exit(1);
  }

  if (unlicensed.length) {
    // No license field at all means no permission to redistribute, whatever the
    // README says. It has to be resolved with the upstream, not guessed at here.
    console.error(`Installed but declares no license (${unlicensed.length}):`);
    for (const n of unlicensed) console.error(`  - ${n}`);
    process.exit(1);
  }

  const table = {
    $generatedBy: "scripts/sync-dependency-licenses.mjs — run `npm run licenses:sync`, do not edit by hand",
    $note: "License of each npm package a registry item installs into a customer project. A record of what the licenses say, not a legal opinion.",
    packages,
  };

  writeFileSync(TABLE_PATH, `${JSON.stringify(table, null, 2)}\n`);
  console.log(`Wrote ${TABLE_REL} — ${Object.keys(packages).length} package(s).`);
}

main();
