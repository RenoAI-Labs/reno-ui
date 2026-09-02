import { existsSync, readFileSync, readdirSync } from "node:fs";
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
      // `registry/reno/blocks` is empty until Phase 5, and git does not track
      // empty directories — so it exists locally and not on a fresh clone.
      // Skipping a missing directory is what scripts/check-boundaries.mjs does.
      if (!existsSync(join(ROOT, dir))) return;
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

describe("the v3 escape hatch stays honest", () => {
  /**
   * Utilities and variants that exist only in Tailwind v4. On v3 they emit
   * nothing at all — no error, no warning, just a missing declaration.
   *
   * reno-ui is v4-only by decision, but docs/tailwind-v4-requirement.md tells a
   * project still on v3 exactly what it loses by running the primitives anyway.
   * That promise is worth only as much as its accuracy, so a primitive picking
   * up a v4-only utility the page does not name has to fail here rather than
   * surface as an unexplained visual gap in someone's product.
   */
  const V4_ONLY = [
    { name: "outline-hidden", re: /\boutline-hidden\b/g },
    { name: "shadow-xs", re: /\bshadow-xs\b/g },
    { name: "rounded-xs", re: /\brounded-xs\b/g },
    { name: "field-sizing-*", re: /\bfield-sizing-[a-z]+/g },
    { name: "`**:`", re: /\*\*:/g },
    // Not used today. Listed so adoption is caught the first time it happens.
    { name: "bg-linear-*", re: /\bbg-(linear|conic|radial)-/g },
    { name: "text-shadow-*", re: /\btext-shadow-/g },
    { name: "inset-shadow-*", re: /\binset-shadow-/g },
    { name: "container queries", re: /\B@(container|sm:|md:|lg:|xl:)/g },
    { name: "not-* variant", re: /\bnot-\[/g },
    { name: "starting:", re: /\bstarting:/g },
  ];

  function sources(dir: string, out: string[] = []): string[] {
    if (!existsSync(join(ROOT, dir))) return out;
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) sources(rel, out);
      else if (/\.tsx?$/.test(entry.name)) out.push(readFileSync(join(ROOT, rel), "utf8"));
    }
    return out;
  }

  it("names every v4-only utility the primitives actually use", () => {
    const doc = readFileSync(join(ROOT, "docs/tailwind-v4-requirement.md"), "utf8");
    const code = [...sources("registry/reno/ui"), ...sources("registry/reno/blocks")];

    const undocumented = V4_ONLY.filter(
      ({ name, re }) => code.some((src) => new RegExp(re.source, "g").test(src)) && !doc.includes(name.replace(/`/g, "")),
    ).map(({ name }) => name);

    expect(undocumented).toEqual([]);
  });
});

describe("icons follow one naming convention", () => {
  /**
   * Ported components arrived from two eras of shadcn: the older one imported
   * `Check`, the current one imports `CheckIcon`. Both spellings lived in
   * registry/reno at once, so a reader could not tell which was intended and
   * every new port picked whichever neighbour it copied.
   *
   * The `*Icon` suffix is the one that survives: it matches shadcn today, so
   * future ports stop introducing drift, and it keeps single-word icons
   * (`X`, `Circle`, `Search`) from colliding with ordinary local identifiers.
   * See docs/icons.md.
   */
  function iconSources(dir: string, out: Array<{ rel: string; src: string }> = []) {
    if (!existsSync(join(ROOT, dir))) return out;
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) iconSources(rel, out);
      else if (/\.tsx?$/.test(entry.name)) out.push({ rel, src: readFileSync(join(ROOT, rel), "utf8") });
    }
    return out;
  }

  /**
   * Every `import ... from "lucide-react"` in registry/reno, whatever its shape.
   *
   * Matching only the braced double-quoted form would leave the convention
   * enforced by Prettier as much as by these tests: a single-quoted or namespace
   * import would sail past. `clause` is the raw text between `import` and
   * `from`, so the tests below can reject the shapes that carry no names as well
   * as check the ones that do.
   */
  function lucideImports() {
    const found: Array<{ rel: string; clause: string; names: string[] }> = [];
    for (const { rel, src } of iconSources("registry/reno")) {
      for (const m of src.matchAll(/import\s+([^;]*?)\s+from\s+["']lucide-react["']/g)) {
        const clause = m[1].trim();
        const braced = clause.match(/\{([^}]*)\}/);
        const names = braced ? braced[1].split(",").map((n) => n.trim()).filter(Boolean) : [];
        found.push({ rel, clause, names });
      }
    }
    return found;
  }

  it("imports icons by name, never as a namespace or default", () => {
    // `import * as Icons from "lucide-react"` compiles and renders, and costs a
    // consuming project the whole 6,000-icon module — the per-icon tree-shaking
    // docs/icons.md promises is a property of named imports only.
    const offenders = lucideImports()
      .filter(({ clause }) => !clause.startsWith("{"))
      .map(({ rel, clause }) => `${rel}: import ${clause}`);

    expect(offenders).toEqual([]);
  });

  it("uses each glyph's canonical name, not a deprecated alias", async () => {
    // The suffix rule alone does not stop the drift it was written for: lucide
    // keeps old names as aliases forever, so `AlertCircleIcon` and
    // `CircleAlertIcon` are the same glyph under two spellings and both satisfy
    // "*Icon". Every alias resolves to a component whose `displayName` is the
    // canonical name, which is what this compares against — so the rule needs no
    // hand-maintained list and cannot go stale when lucide renames something.
    const lucide = (await import("lucide-react")) as unknown as Record<
      string,
      { displayName?: string } | undefined
    >;
    const offenders: string[] = [];

    for (const { rel, names } of lucideImports()) {
      for (const spec of names) {
        const imported = spec.split(/\s+as\s+/)[0]?.trim();
        if (!imported) continue;
        const canonical = lucide[imported]?.displayName;
        if (canonical && imported !== `${canonical}Icon`) {
          offenders.push(`${rel}: ${imported} -> ${canonical}Icon`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("suffixes every lucide-react import with Icon", () => {
    const offenders: string[] = [];

    for (const { rel, names } of lucideImports()) {
      for (const spec of names) {
        // "Check as CheckIcon" -> the local binding is what the file uses.
        const local = spec.split(/\s+as\s+/).pop()?.trim();
        if (local && !local.endsWith("Icon")) offenders.push(`${rel}: ${local}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
