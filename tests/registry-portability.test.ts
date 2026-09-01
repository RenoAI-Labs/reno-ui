import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regressions from the first time reno-ui was installed into a real, existing
 * project (P6a gate, 2026-09-01). Both failures below were invisible in every
 * greenfield check the repository already ran, because a greenfield project has
 * nothing to conflict with: no prior dependency versions, no prior ESLint setup.
 *
 * Each one shipped broken code into a consumer while `shadcn add` reported
 * success, so they are pinned here rather than left to a script alone.
 */

const ROOT = join(import.meta.dirname, "..");
const ITEMS_DIR = join(ROOT, "registry/items");

function items() {
  return readdirSync(ITEMS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, json: JSON.parse(readFileSync(join(ITEMS_DIR, f), "utf8")) }));
}

/** "@scope/name@^1.2.3" -> range. Scoped names carry an `@` of their own. */
function rangeOf(spec: string): string | null {
  const at = spec.lastIndexOf("@");
  return at <= 0 ? null : spec.slice(at + 1);
}

describe("registry items are safe to install into an existing project", () => {
  it("pins a version range on every npm dependency", () => {
    const unversioned: string[] = [];
    for (const { file, json } of items()) {
      for (const field of ["dependencies", "devDependencies"] as const) {
        for (const spec of (json[field] ?? []) as string[]) {
          if (!rangeOf(spec)) unversioned.push(`${file}: ${spec}`);
        }
      }
    }

    // An unversioned dependency is satisfied by whatever the project already
    // has. A project on TanStack Table v8 installing @reno/data-grid got v9
    // component source running against its v8 runtime — a clean install and a
    // build that fails with 30+ errors in files the project did not write.
    expect(unversioned).toEqual([]);
  });

  it("keeps @reno/data-grid on the TanStack major it is written against", () => {
    const grid = items().find((i) => i.json.name === "data-grid");
    expect(grid).toBeDefined();
    const table = (grid!.json.dependencies as string[]).find((d) =>
      d.startsWith("@tanstack/react-table@"),
    );
    // The grid uses `useTable` and `create*RowModel`, which exist only in v9.
    // v8 exposes `useReactTable` / `get*RowModel` and nothing else.
    expect(table).toMatch(/^@tanstack\/react-table@\^9\./);
  });

  it("never names an ESLint plugin rule in a disable directive", () => {
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = readFileSync(join(ROOT, rel), "utf8");
          // `eslint-disable[-next-line|-line]` followed by anything other than
          // end-of-comment: that trailing text is a rule name.
          for (const m of source.matchAll(/eslint-disable(?:-next-line|-line)?[^\S\r\n]+([\w@/-]+)/g)) {
            offenders.push(`${rel}: ${m[1]}`);
          }
        }
      }
    }

    for (const dir of ["registry/reno/ui", "registry/reno/blocks", "registry/reno/hooks", "registry/reno/lib"]) {
      walk(dir);
    }

    // Shipped source becomes the customer's own code and is linted by THEIR
    // config. Naming a rule their plugin set does not define is a hard ESLint
    // error ("Definition for rule ... was not found"), so a bare directive is
    // the only portable form.
    expect(offenders).toEqual([]);
  });
});

describe("the handover scripts work outside a single-package npm project", () => {
  const script = readFileSync(join(ROOT, "scripts/verify-selfcontained.sh"), "utf8");

  it("picks the install command from the project's lockfile", () => {
    // Hardcoding `npm ci` made the delivery proof unrunnable on the first real
    // customer repo it met — a pnpm workspace with no package-lock.json.
    for (const lock of ["pnpm-lock.yaml", "yarn.lock", "bun.lock"]) {
      expect(script).toContain(lock);
    }
    expect(script).toContain("pnpm install --frozen-lockfile");
    expect(script).toContain("yarn install --immutable");
  });

  it("looks for components.json anywhere in the tree, not only at the root", () => {
    // A monorepo keeps it in the app package (apps/web/components.json); a
    // root-only check passes while the registry entry is still there.
    expect(script).toContain("--include=components.json");
  });
});
