#!/usr/bin/env node
/**
 * Builds `app/lib/demo-index.generated.ts` by scanning
 * `registry/reno/examples/*.tsx`.
 *
 * Why generated: adding a component means adding a demo. If every contributor
 * had to edit one shared map file, parallel work on different components would
 * collide on the same lines for no reason. Dropping a file in `examples/` is
 * enough — the index picks it up.
 *
 * Naming contract: `registry/reno/examples/<slug>-demo.tsx` must default-export
 * the demo, and `<slug>` must match the registry item name.
 *
 * Usage:
 *   node scripts/generate-demo-index.mjs
 *   node scripts/generate-demo-index.mjs --check
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES_DIR = join(ROOT, "registry/reno/examples");
const OUT_PATH = join(ROOT, "app/lib/demo-index.generated.ts");

function collectSlugs() {
  if (!existsSync(EXAMPLES_DIR)) return [];
  return readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith("-demo.tsx"))
    .map((f) => f.replace(/-demo\.tsx$/, ""))
    .sort();
}

function render(slugs) {
  const entries = slugs
    .map(
      (slug) =>
        `  ${JSON.stringify(slug)}: dynamic(() => import("@/registry/reno/examples/${slug}-demo")),`,
    )
    .join("\n");

  return `// GENERATED FILE — do not edit.
// Source: registry/reno/examples/*-demo.tsx
// Regenerate: npm run demos:generate
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Demos are loaded lazily so a docs page only ships the one component it shows.
 * Without this the docs bundle would grow with every primitive added.
 */
export const DEMOS: Record<string, ComponentType> = {
${entries}
};

export const DEMO_SLUGS = Object.keys(DEMOS);
`;
}

function main() {
  const check = process.argv.includes("--check");
  const next = render(collectSlugs());

  let current = null;
  if (existsSync(OUT_PATH)) current = readFileSync(OUT_PATH, "utf8");
  if (current === next) {
    if (check) console.log("Demo index up to date.");
    return;
  }
  if (check) {
    console.error("app/lib/demo-index.generated.ts is stale. Run `npm run demos:generate`.");
    process.exit(1);
  }
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, next);
  console.log("wrote app/lib/demo-index.generated.ts");
}

main();
