#!/usr/bin/env node
/**
 * License provenance gate, and generator for the inventory table in
 * `docs/ui-components.md`.
 *
 * reno-ui is public open source under MIT. Every shipped item must therefore be
 * traceable to a source we are allowed to redistribute. The only valid origins
 * are shadcn/ui (MIT) and code we wrote ourselves.
 *
 * The specific hazard this guards against: `zerostaticthemes/square-ui` is under
 * the ln-dev UI License, which forbids building a component library from it and
 * forbids publishing it to any repository. Copying from it into a public repo
 * would be a visible license violation. Visual reference only — never source.
 *
 * Provenance lives in each item's `meta` block rather than in a separate table,
 * so it cannot be forgotten when adding a component and it travels with the
 * component into the customer's repository.
 *
 * Usage:
 *   node scripts/check-provenance.mjs           # verify + refresh the doc table
 *   node scripts/check-provenance.mjs --check   # verify only; fail if stale
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadItems } from "./build-registry-json.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOC_PATH = join(ROOT, "docs/ui-components.md");

const BEGIN = "<!-- BEGIN GENERATED INVENTORY -->";
const END = "<!-- END GENERATED INVENTORY -->";

/** Licenses we are allowed to redistribute under MIT. */
const ALLOWED_LICENSES = new Set(["MIT", "original"]);

/** Origins that must never appear. */
const FORBIDDEN_SOURCES = [
  {
    pattern: /square-ui|zerostatic|ln-dev/i,
    reason: "ln-dev UI License forbids redistribution and republication",
  },
];

function verify(items) {
  const errors = [];

  for (const item of items) {
    const meta = item.meta ?? {};
    const where = `registry/items/${item.name}.json`;

    // `meta` free text is rendered into docs/ui-components.md, and the eject
    // checklist instructs the delivery team to copy that file into the customer
    // repo. A `@reno/` mention there survives handover and makes
    // `grep -r "@reno/"` — the exact command that certifies a clean delivery —
    // return a hit. This is the only path by which the namespace can reach a
    // customer artifact, so it is blocked at the source.
    for (const field of ["source", "upstream", "group"]) {
      if (typeof meta[field] === "string" && meta[field].includes("@reno/")) {
        errors.push(
          `"${item.name}": meta.${field} in ${where} mentions "@reno/". It is rendered into docs/ui-components.md, which ships to the customer, where the namespace would break the clean-handover grep.`,
        );
      }
    }

    if (!meta.source) {
      errors.push(`"${item.name}": missing meta.source in ${where}.`);
    }
    if (!ALLOWED_LICENSES.has(meta.license)) {
      errors.push(
        `"${item.name}": license "${meta.license ?? "(none)"}" in ${where}. Only ${[...ALLOWED_LICENSES].join(" or ")} may ship in a public MIT registry.`,
      );
    }

    const haystack = `${meta.source ?? ""} ${meta.upstream ?? ""}`;
    for (const { pattern, reason } of FORBIDDEN_SOURCES) {
      if (pattern.test(haystack)) {
        errors.push(`"${item.name}" cites a forbidden source: ${reason}.`);
      }
    }
  }

  return errors;
}

function renderTable(items) {
  const rows = items.map((item) => {
    const m = item.meta ?? {};
    const type = item.type.replace("registry:", "");
    return `| \`${item.name}\` | ${type} | ${m.group ?? "—"} | ${m.source} | ${m.license} | ${m.upstream ?? "—"} | ${m.added} |`;
  });

  return [
    BEGIN,
    "",
    `_Generated from \`registry/items/*.json\` by \`scripts/check-provenance.mjs\`. Do not edit by hand — edit the item's \`meta\` block and run \`npm run check:provenance\`._`,
    "",
    "| Item | Type | Group | Source | License | Upstream ref | Added |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    "",
    END,
  ].join("\n");
}

function main() {
  const check = process.argv.includes("--check");
  const items = loadItems();

  const errors = verify(items);
  if (errors.length) {
    console.error(`Provenance check failed (${errors.length} issue(s)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const doc = readFileSync(DOC_PATH, "utf8");
  const start = doc.indexOf(BEGIN);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1) {
    console.error(`docs/ui-components.md is missing the ${BEGIN} / ${END} markers.`);
    process.exit(1);
  }

  const next = doc.slice(0, start) + renderTable(items) + doc.slice(end + END.length);
  if (next === doc) {
    console.log(`Provenance OK — ${items.length} items, all sourced and licensed.`);
    return;
  }
  if (check) {
    console.error("docs/ui-components.md inventory is stale. Run `npm run check:provenance`.");
    process.exit(1);
  }
  writeFileSync(DOC_PATH, next);
  console.log(`Provenance OK — ${items.length} items; refreshed the inventory table.`);
}

main();
