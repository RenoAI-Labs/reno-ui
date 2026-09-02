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
 * The npm packages an item pulls in are a separate question, answered by
 * `registry/dependency-licenses.json` and checked here too — see
 * `scripts/lib/dependency-licenses.mjs` for why the two are not merged.
 *
 * Usage:
 *   node scripts/check-provenance.mjs           # verify + refresh the doc tables
 *   node scripts/check-provenance.mjs --check   # verify only; fail if stale
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadItems } from "./build-registry-json.mjs";
import {
  NOTICE_PATH,
  collectDependencies,
  loadTable,
  verifyClosureLicenses,
  verifyDependencies,
  verifyNoticeMentions,
} from "./lib/dependency-licenses.mjs";
import { renderClosureSection, renderDependencySection } from "./lib/license-doc-sections.mjs";
import { collectRuntimeClosure, loadLockfile } from "./lib/transitive-dependencies.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOC_PATH = join(ROOT, "docs/ui-components.md");

const INVENTORY = {
  begin: "<!-- BEGIN GENERATED INVENTORY -->",
  end: "<!-- END GENERATED INVENTORY -->",
};
const DEPENDENCIES = {
  begin: "<!-- BEGIN GENERATED DEPENDENCY LICENSES -->",
  end: "<!-- END GENERATED DEPENDENCY LICENSES -->",
};
const CLOSURE = {
  begin: "<!-- BEGIN GENERATED TRANSITIVE LICENSES -->",
  end: "<!-- END GENERATED TRANSITIVE LICENSES -->",
};

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

function renderInventory(items) {
  const rows = items.map((item) => {
    const m = item.meta ?? {};
    const type = item.type.replace("registry:", "");
    return `| \`${item.name}\` | ${type} | ${m.group ?? "—"} | ${m.source} | ${m.license} | ${m.upstream ?? "—"} | ${m.added} |`;
  });

  return [
    `_Generated from \`registry/items/*.json\` by \`scripts/check-provenance.mjs\`. Do not edit by hand — edit the item's \`meta\` block and run \`npm run check:provenance\`._`,
    "",
    "| Item | Type | Group | Source | License | Upstream ref | Added |",
    "|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

/** Replace the text between a block's markers, keeping the markers themselves. */
function spliceBlock(doc, block, body) {
  const start = doc.indexOf(block.begin);
  const end = doc.indexOf(block.end);
  if (start === -1 || end === -1) {
    console.error(`docs/ui-components.md is missing the ${block.begin} / ${block.end} markers.`);
    process.exit(1);
  }
  return `${doc.slice(0, start + block.begin.length)}\n\n${body}\n\n${doc.slice(end)}`;
}

function main() {
  const check = process.argv.includes("--check");
  const items = loadItems();
  const deps = collectDependencies(items);
  const table = loadTable();
  const closure = collectRuntimeClosure(loadLockfile(), deps.map((d) => d.name));

  const errors = [
    ...verify(items),
    ...verifyDependencies(deps, table),
    ...verifyClosureLicenses(closure),
    ...verifyNoticeMentions(table, readFileSync(NOTICE_PATH, "utf8")),
  ];
  if (errors.length) {
    console.error(`Provenance check failed (${errors.length} issue(s)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const doc = readFileSync(DOC_PATH, "utf8");
  let next = spliceBlock(doc, INVENTORY, renderInventory(items));
  next = spliceBlock(next, DEPENDENCIES, renderDependencySection(deps, table));
  next = spliceBlock(next, CLOSURE, renderClosureSection(deps, closure));

  const summary = `${items.length} items, ${deps.length} npm dependencies (${closure.packages.length} with their tree), all sourced and licensed`;
  if (next === doc) {
    console.log(`Provenance OK — ${summary}.`);
    return;
  }
  if (check) {
    console.error("docs/ui-components.md is stale. Run `npm run check:provenance`.");
    process.exit(1);
  }
  writeFileSync(DOC_PATH, next);
  console.log(`Provenance OK — ${summary}; refreshed the generated tables.`);
}

main();
