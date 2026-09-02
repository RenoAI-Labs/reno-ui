/**
 * The npm side of provenance: which third-party packages a customer receives
 * when they install reno items, and under what license.
 *
 * This answers a different question from each item's `meta.license`, and the two
 * are deliberately not merged. `meta.license` says where the *source code in
 * this repository* came from — only `MIT` (shadcn/ui) or `original` may ship.
 * This module says what `shadcn add` installs into the customer's
 * `package.json` alongside that source, where a wider set of permissive
 * licenses is fine. Folding them together would make one gate answer two
 * questions and turn the inventory table into a claim that is not true.
 *
 * Two sources feed it, because they assert different things:
 *
 *   registry/dependency-licenses.json  what we assert about the packages we
 *                                      chose — license, pinned version, and
 *                                      whether the package ships a NOTICE file,
 *                                      which only the installed tree knows.
 *                                      Refreshed by `npm run licenses:sync`.
 *
 *   package-lock.json                  what npm's resolver actually pulled in
 *                                      underneath them. Read live; committed,
 *                                      so it can never go stale against itself.
 *
 * Neither needs the network, so `npm run check:all` stays offline.
 *
 * This is a record of what the licenses say, not a legal opinion.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isAllowedLicense } from "./spdx-license-expression.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const TABLE_PATH = join(ROOT, "registry/dependency-licenses.json");
export const TABLE_REL = "registry/dependency-licenses.json";
export const NOTICE_PATH = join(ROOT, "NOTICE");

/**
 * Licenses a dependency may carry.
 *
 * All permissive: they allow use in a closed-source product, and none of them
 * reaches into the customer's own code. Copyleft (`GPL*`, `AGPL*`, `LGPL*`,
 * `MPL*`) and anything proprietary are absent on purpose — reno-ui ships into
 * client products that are not open source, so pulling one in is a decision
 * somebody has to make in writing, not a line a dependency bump can slip past.
 *
 * Adding an entry here is allowed. Doing it in its own commit, with the reason,
 * is the point.
 */
export const ALLOWED_DEP_LICENSES = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
]);

/** Split "@scope/name@^1.2.3" into name and range without tripping on the scope's `@`. */
export function splitSpec(spec) {
  const at = spec.lastIndexOf("@");
  return at <= 0 ? { name: spec, range: null } : { name: spec.slice(0, at), range: spec.slice(at + 1) };
}

/**
 * Every npm package declared by any registry item, mapped to the items that
 * carry it. Sorted by package name so the generated table has a stable order.
 */
export function collectDependencies(items) {
  const byPackage = new Map();

  for (const item of items) {
    for (const field of ["dependencies", "devDependencies"]) {
      for (const spec of item[field] ?? []) {
        const { name, range } = splitSpec(spec);
        const entry = byPackage.get(name) ?? { name, ranges: new Set(), items: [] };
        if (range) entry.ranges.add(range);
        entry.items.push(item.name);
        byPackage.set(name, entry);
      }
    }
  }

  return [...byPackage.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function loadTable() {
  return JSON.parse(readFileSync(TABLE_PATH, "utf8")).packages;
}

/**
 * Fail when the table does not describe exactly the packages the registry ships.
 *
 * A package missing from the table is the dangerous direction: it reaches a
 * customer with its license unrecorded. A leftover entry is harmless in itself,
 * but it makes the table read as a claim about something nobody installs any
 * more. One `licenses:sync` fixes either.
 */
export function verifyCoverage(deps, table) {
  const errors = [];

  for (const { name, items } of deps) {
    if (!table[name]) {
      errors.push(
        `npm dependency "${name}" (declared by ${items.join(", ")}) is missing from ${TABLE_REL}. Run \`npm run licenses:sync\`.`,
      );
    }
  }

  for (const name of Object.keys(table)) {
    if (!deps.some((d) => d.name === name)) {
      errors.push(
        `${TABLE_REL} still lists "${name}", which no registry item declares any more. Run \`npm run licenses:sync\`.`,
      );
    }
  }

  return errors;
}

/**
 * Fail on a license outside the permissive set. Packages the table does not
 * cover are left to `verifyCoverage` — one failure, one cause, one gate.
 */
export function verifyLicenses(deps, table) {
  const errors = [];

  for (const { name, items } of deps) {
    const record = table[name];
    if (record && !isAllowedLicense(record.license, ALLOWED_DEP_LICENSES)) {
      errors.push(
        `npm dependency "${name}" is "${record.license}", which ALLOWED_DEP_LICENSES does not permit. It reaches the customer's package.json through ${items.join(", ")}. Permissive licenses only — widening the set needs its own commit and a reason.`,
      );
    }
  }

  return errors;
}

/**
 * The same rule applied to everything those packages drag in behind them.
 *
 * Reported separately from the direct check because the fix is different: a
 * direct dependency is one we chose and can drop, while a transitive one has to
 * be traced back to whichever direct dependency introduced it.
 */
export function verifyClosureLicenses(closure) {
  const errors = [];

  for (const { name, license } of closure.packages) {
    if (!isAllowedLicense(license, ALLOWED_DEP_LICENSES)) {
      errors.push(
        `transitive package "${name}" is "${license ?? "(no license field)"}", which ALLOWED_DEP_LICENSES does not permit. It is not declared by any item — trace it with \`npm ls ${name}\` and deal with whichever dependency pulls it in.`,
      );
    }
  }

  for (const name of closure.unresolved) {
    errors.push(
      `"${name}" is required somewhere in the dependency graph but has no entry in package-lock.json. Run \`npm install\` to repair the lockfile.`,
    );
  }

  return errors;
}

/** Apache-2.0, and anything shipping its own NOTICE, has to be named in ours. */
function requiresNoticeEntry(record) {
  return record.notice === true || /\bApache-2\.0\b/.test(record.license ?? "");
}

/**
 * Fail when a package that carries an attribution obligation is not mentioned
 * in `NOTICE`.
 *
 * The prose is written by hand on purpose. A generated entry would have to
 * invent the copyright line, which is not in `package.json` — the one for
 * `class-variance-authority` was read off the upstream LICENSE file — and a
 * confidently wrong copyright line in a legal document is worse than a missing
 * one. So this checks that somebody wrote the entry, not what they wrote.
 *
 * Scope is the packages we declare, not the whole closure: NOTICE records what
 * reno-ui chose to put in front of a customer, and the transitive tree is
 * covered by the summary table in docs/ui-components.md instead.
 */
export function verifyNoticeMentions(table, noticeText) {
  return Object.entries(table)
    .filter(([, record]) => requiresNoticeEntry(record))
    .filter(([name]) => !noticeText.includes(name))
    .map(
      ([name, record]) =>
        `npm dependency "${name}" is ${record.license} and is not named in NOTICE. Add an entry with its copyright line, taken from the package's own LICENSE file rather than guessed at.`,
    );
}

/** Both dependency checks, in the order a reader wants them. */
export function verifyDependencies(deps, table) {
  return [...verifyCoverage(deps, table), ...verifyLicenses(deps, table)];
}
