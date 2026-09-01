#!/usr/bin/env node
/**
 * Measures what TanStack Table costs a consumer's bundle, v8 versus v9.
 *
 * reno-ui chose v9 partly on the claim that its features are tree-shakable.
 * Until now that claim rested on an upstream quote (plan open question 11).
 * This measures it instead, on the exact surface `@reno/data-grid` imports:
 * every feature the grid registers, and nothing else.
 *
 * The comparison is only meaningful if both entry points do the SAME WORK, so
 * the v8 entry pulls the row models that give v8 the same capabilities the v9
 * feature list gives v9 — sorting, filtering, pagination, and the core model.
 * Comparing v9's opt-in list against v8's `stockFeatures` equivalent would
 * flatter v9 by measuring a smaller table, not a smaller library.
 *
 * Usage: node scripts/measure-tanstack-bundle.mjs [--json]
 * Needs network on first run (installs the two versions into a temp dir).
 */

import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const V8 = "8.21.3";
const V9 = "9.2.4";

/** What `registry/reno/lib/grid-state.ts` and `hooks/use-data-grid.ts` import. */
const ENTRY_V9 = `
import {
  useTable, tableFeatures, createCoreRowModel, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, createColumnHelper, flexRender,
  columnFilteringFeature, columnOrderingFeature, columnPinningFeature,
  columnResizingFeature, columnSizingFeature, columnVisibilityFeature,
  globalFilteringFeature, rowPaginationFeature, rowSelectionFeature, rowSortingFeature,
} from "@tanstack/react-table";
export const used = [
  useTable, tableFeatures, createCoreRowModel, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, createColumnHelper, flexRender,
  columnFilteringFeature, columnOrderingFeature, columnPinningFeature,
  columnResizingFeature, columnSizingFeature, columnVisibilityFeature,
  globalFilteringFeature, rowPaginationFeature, rowSelectionFeature, rowSortingFeature,
];
`;

/**
 * A v9 table with the core model and nothing else. Not what reno ships — it is
 * the control that shows whether v9's opt-in features shake out at all, which
 * is the property the version was chosen for.
 */
const ENTRY_V9_MIN = `
import { useTable, tableFeatures, createCoreRowModel, flexRender } from "@tanstack/react-table";
export const used = [useTable, tableFeatures, createCoreRowModel, flexRender];
`;

/** The v8 equivalent: same capabilities, v8's API for them. */
const ENTRY_V8 = `
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, createColumnHelper, flexRender,
} from "@tanstack/react-table";
export const used = [
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, createColumnHelper, flexRender,
];
`;

function measure(root, label, version, entrySource) {
  const dir = join(root, label);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "probe", private: true, type: "module" }));
  execFileSync(
    "npm",
    ["install", "--silent", "--no-audit", "--no-fund", `@tanstack/react-table@${version}`, "react@19.2.8", "react-dom@19.2.8"],
    { cwd: dir, stdio: "inherit" },
  );
  writeFileSync(join(dir, "entry.js"), entrySource);
  execFileSync(
    "npx",
    ["--yes", "esbuild@0.25.10", "entry.js", "--bundle", "--minify", "--format=esm",
     "--platform=browser", "--external:react", "--external:react-dom", "--outfile=out.js"],
    { cwd: dir, stdio: "inherit" },
  );
  const bytes = readFileSync(join(dir, "out.js"));
  return { label, version, minified: bytes.length, gzipped: gzipSync(bytes, { level: 9 }).length };
}

const root = mkdtempSync(join(tmpdir(), "reno-tanstack-"));
try {
  const v8 = measure(root, "v8-full", V8, ENTRY_V8);
  const v9 = measure(root, "v9-reno", V9, ENTRY_V9);
  const v9min = measure(root, "v9-core", V9, ENTRY_V9_MIN);
  const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
  const delta = (a, b) => `${b > a ? "+" : ""}${(((b - a) / a) * 100).toFixed(1)}%`;

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ v8, v9, v9min }, null, 2));
  } else {
    console.log("\nTanStack Table, bundled for the surface @reno/data-grid uses");
    console.log("(esbuild, minified, react external)\n");
    const row = (name, m) =>
      console.log(`  ${name.padEnd(24)} ${kb(m.minified).padStart(9)} min   ${kb(m.gzipped).padStart(9)} gzip`);
    row(`v${V8}, all features`, v8);
    row(`v${V9}, reno's 10`, v9);
    row(`v${V9}, core only`, v9min);
    console.log(
      `\n  reno's v9 vs v8:        ${delta(v8.minified, v9.minified).padStart(9)} min   ` +
        `${delta(v8.gzipped, v9.gzipped).padStart(9)} gzip`,
    );
    console.log(
      `  v9 core vs reno's v9:  ${delta(v9.minified, v9min.minified).padStart(9)} min   ` +
        `${delta(v9.gzipped, v9min.gzipped).padStart(9)} gzip  (what opting out buys)\n`,
    );
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
