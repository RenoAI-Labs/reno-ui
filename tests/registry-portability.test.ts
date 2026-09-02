import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALLOWED_DEP_LICENSES,
  collectDependencies,
  verifyClosureLicenses,
  verifyCoverage,
  verifyDependencies,
  verifyLicenses,
  verifyNoticeMentions,
} from "../scripts/lib/dependency-licenses.mjs";
import { isAllowedLicense } from "../scripts/lib/spdx-license-expression.mjs";
import { collectRuntimeClosure, loadLockfile } from "../scripts/lib/transitive-dependencies.mjs";

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

  it("pins a range npm can actually install", () => {
    /*
      `hls.js@^^1.7.1` reached an item and got as far as a real `shadcn add`,
      where npm refused it outright: `EINVALIDTAGNAME`. The pinner prefixed `^`
      onto whatever this repository's package.json declared, which had always
      been a bare version — until `npm install` wrote `^1.7.1` for one
      dependency and nobody noticed, because a doubled caret still looks like a
      range.

      Every gate in the repository passed on that item: it is not unversioned,
      the name is right, the number is right. Only installing it fails.
    */
    const invalid: string[] = [];
    for (const { file, json } of items()) {
      for (const field of ["dependencies", "devDependencies"] as const) {
        for (const spec of (json[field] ?? []) as string[]) {
          const range = rangeOf(spec);
          // One optional operator, then a plain semver version.
          if (range && !/^(?:\^|~|>=|<=|>|<|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(range)) {
            invalid.push(`${file}: ${spec}`);
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it("declares its own dependencies as exact versions", () => {
    // The other half of the same defect. Ranges in this repository's
    // package.json are what made a doubled caret possible, and they also mean
    // the version reno-ui tests against is not the version it claims to
    // support.
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const ranged = Object.entries({
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    })
      .filter(([, version]) => /^[\^~><=]/.test(version as string))
      .map(([name, version]) => `${name}: ${version}`);

    expect(ranged).toEqual([]);
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

describe("every npm package a customer receives has its license on record", () => {
  /**
   * `docs/ui-components.md` is handed to the customer as their record of what
   * they now own. Until this gate existed it recorded the provenance of the
   * source files and said nothing about the npm packages installed alongside
   * them — including that `class-variance-authority`, which arrives with most
   * primitives, is Apache-2.0 rather than MIT, and that `lucide-react` is ISC.
   *
   * The table is checked against the registry rather than against npm, so the
   * gate stays offline and needs no `node_modules`. `npm run licenses:sync` is
   * what reads the installed packages.
   */
  const table = JSON.parse(
    readFileSync(join(ROOT, "registry/dependency-licenses.json"), "utf8"),
  ).packages as Record<string, { license: string; version: string; notice: boolean }>;

  const deps = collectDependencies(items().map((i) => i.json));

  it("covers every dependency declared by a registry item, and nothing else", () => {
    expect(verifyCoverage(deps, table)).toEqual([]);
  });

  it("carries only permissive licenses", () => {
    // Widening ALLOWED_DEP_LICENSES is allowed; doing it silently is not. reno
    // components ship into closed-source client products, so a copyleft package
    // arriving through a dependency bump has to stop the build.
    expect(verifyLicenses(deps, table)).toEqual([]);
  });

  it("rejects a copyleft package and an unrecorded one", () => {
    // The gate is only worth its runtime if it fails on the thing it is for.
    const copyleft = verifyDependencies(
      [{ name: "some-widget", ranges: new Set(["^1.0.0"]), items: ["video-player"] }],
      { "some-widget": { license: "GPL-3.0", version: "1.0.0", notice: false } },
    );
    expect(copyleft).toHaveLength(1);
    expect(copyleft[0]).toContain("ALLOWED_DEP_LICENSES does not permit");

    const unrecorded = verifyDependencies(
      [{ name: "some-widget", ranges: new Set(["^1.0.0"]), items: ["video-player"] }],
      {},
    );
    expect(unrecorded).toHaveLength(1);
    expect(unrecorded[0]).toContain("missing from registry/dependency-licenses.json");
  });
});

describe("license expressions are read as expressions, not as strings", () => {
  /**
   * `victory-vendor`, which arrives underneath `recharts`, declares
   * "MIT AND ISC". Comparing the raw string against the allowed set rejects it
   * even though both halves are permissive — a false failure on a correct
   * dependency, which is how people learn to work around a gate.
   */
  const allowed = ALLOWED_DEP_LICENSES;

  it("accepts a conjunction only when every part is allowed", () => {
    expect(isAllowedLicense("MIT AND ISC", allowed)).toBe(true);
    expect(isAllowedLicense("MIT AND GPL-3.0", allowed)).toBe(false);
  });

  it("accepts a disjunction when either part is allowed", () => {
    // `OR` is a choice offered to us, so one acceptable branch is enough.
    expect(isAllowedLicense("(MIT OR GPL-3.0)", allowed)).toBe(true);
    expect(isAllowedLicense("GPL-3.0 OR AGPL-3.0", allowed)).toBe(false);
  });

  it("decides a WITH exception on the base license", () => {
    // An exception can only widen a license, never rescue a rejected one, and
    // reading it is a judgement call rather than a lookup.
    expect(isAllowedLicense("Apache-2.0 WITH LLVM-exception", allowed)).toBe(true);
    expect(isAllowedLicense("GPL-2.0 WITH Classpath-exception-2.0", allowed)).toBe(false);
  });

  it("refuses anything it cannot parse rather than guessing", () => {
    for (const unreadable of ["SEE LICENSE IN LICENSE.txt", "UNLICENSED", "Apache-2.0+", "MIT AND", "(MIT", ""]) {
      expect(isAllowedLicense(unreadable, allowed)).toBe(false);
    }
    expect(isAllowedLicense(null as unknown as string, allowed)).toBe(false);
  });
});

describe("the packages underneath the declared ones are licensed too", () => {
  /**
   * The declared list is 44 packages; they pull in 127. Checking only what an
   * item names leaves two thirds of what reaches a customer's bundle unread,
   * so a copyleft package could arrive as a dependency of a dependency.
   *
   * Resolved from the committed lockfile, which records a license on every
   * entry from v3 onward — no network, no installed tree.
   */
  const closure = collectRuntimeClosure(
    loadLockfile(),
    collectDependencies(items().map((i) => i.json)).map((d) => d.name),
  );

  it("resolves the whole graph", () => {
    expect(closure.unresolved).toEqual([]);
    expect(closure.packages.length).toBeGreaterThan(100);
  });

  it("finds nothing outside the permissive set", () => {
    expect(verifyClosureLicenses(closure)).toEqual([]);
  });

  it("reports a copyleft package it cannot attribute to any item", () => {
    const injected = verifyClosureLicenses({
      packages: [{ name: "some-parser", license: "AGPL-3.0" }],
      unresolved: [],
    });
    expect(injected).toHaveLength(1);
    expect(injected[0]).toContain("npm ls some-parser");
  });
});

describe("attribution obligations reach NOTICE", () => {
  /**
   * `class-variance-authority` is Apache-2.0 and arrives with most primitives.
   * The NOTICE prose is written by hand — a generated entry would have to
   * invent the copyright line, which is not in package.json — so this checks
   * that somebody wrote it, not what they wrote.
   */
  const notice = readFileSync(join(ROOT, "NOTICE"), "utf8");
  const table = JSON.parse(
    readFileSync(join(ROOT, "registry/dependency-licenses.json"), "utf8"),
  ).packages;

  it("names every package carrying one", () => {
    expect(verifyNoticeMentions(table, notice)).toEqual([]);
  });

  it("fails when an Apache-2.0 package is missing from NOTICE", () => {
    // A name that is deliberately fictional. This fixture used to say `hls.js`,
    // which stopped proving anything the day the video player shipped and
    // `hls.js` got a real NOTICE entry — the assertion inverted from "the gate
    // catches a missing entry" to "the gate is broken" without a word changing.
    const missing = verifyNoticeMentions(
      { "some-apache-widget": { license: "Apache-2.0", version: "1.0.0", notice: true } },
      notice,
    );
    expect(missing).toHaveLength(1);
    expect(missing[0]).toContain("taken from the package's own LICENSE file");
  });
});

describe("the docs name the two things a real install trips over", () => {
  /**
   * Both of these cost an afternoon each on the P6a install, and neither was a
   * code defect — the code did what it says. What was missing was any sentence
   * telling the person installing what to do, at the moment they were reading.
   *
   * Pinned here because prose has no other gate: a rename in the source would
   * leave the docs quietly describing an API that no longer exists.
   */

  it("points at selectionColumn wherever it explains row selection", () => {
    // `enableRowSelection` defaults to true and renders no checkbox on its own.
    // The first grid anyone builds therefore comes up with selection apparently
    // broken, and nothing in the UI, the props or the console says why.
    const grid = readFileSync(join(ROOT, "registry/reno/ui/data-grid.tsx"), "utf8");
    const exportsIt = /export\s*\{\s*selectionColumn\s*\}/.test(grid);
    const defaultsOn = /enableRowSelection\s*=\s*true/.test(grid);
    expect([exportsIt, defaultsOn]).toEqual([true, true]);

    const contract = readFileSync(join(ROOT, "docs/data-grid-server-contract.md"), "utf8");
    expect(contract).toContain("selectionColumn");
  });

  it("warns in the README about a project that already has its own ui directory", () => {
    // The README is what gets read at kickoff; the handover checklist is read at
    // delivery, which is months too late to choose an install path. Every
    // project that is already running needs this, and the default install
    // overwrites same-named files without asking.
    const installsIntoTheUiAlias = items().some(({ json }) =>
      (json.files ?? []).some((f: { path: string }) => f.path.startsWith("registry/reno/ui/")),
    );
    expect(installsIntoTheUiAlias).toBe(true);

    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("aliases.ui");
  });
});

describe("the one place a wrapper leaks its upstream is written down", () => {
  /**
   * `code-editor` takes `extensions?: unknown[]`, which every other heavy
   * wrapper in reno deliberately refuses to do — no TanStack type reaches
   * `DataGrid`'s props, no recharts element reaches `Chart`'s. The exception is
   * intentional and narrow, and it is worth nothing to a reader who cannot tell
   * it apart from an oversight.
   */
  it("explains the escape hatch while the escape hatch exists", () => {
    const source = readFileSync(join(ROOT, "registry/reno/ui/code-editor.tsx"), "utf8");
    expect(/extensions\?:\s*unknown\[\]/.test(source)).toBe(true);

    const doc = readFileSync(join(ROOT, "docs/code-editor.md"), "utf8");
    expect(doc).toContain("unknown[]");
    expect(doc).toContain("extensions");
  });
});

describe("the boundary between the video primitive and a course block is written down", () => {
  /**
   * Phase 6's third unlock condition. The plan's own P5 backlog carries a
   * `course-player` block whose scope overlaps this component's, and building
   * the primitive without settling the line first was called out as near-certain
   * rework.
   *
   * The line is: the player attaches HLS and draws controls; playlist, chapters,
   * lesson progress, notes and quizzes belong to the block. It is checked here
   * rather than trusted, because the failure mode is gradual — a playlist prop,
   * then a "next lesson" callback, and the primitive is a block wearing a
   * primitive's name.
   */
  it("keeps course vocabulary out of the player's props", () => {
    const source = readFileSync(join(ROOT, "registry/reno/ui/video-player.tsx"), "utf8");
    const props = source.slice(
      source.indexOf("export type VideoPlayerProps"),
      source.indexOf("};", source.indexOf("export type VideoPlayerProps")),
    );
    expect(props.length).toBeGreaterThan(0);

    const courseWords = ["playlist", "lesson", "chapter", "course", "quiz", "note"];
    const found = courseWords.filter((word) => new RegExp(word, "i").test(props));
    expect(found).toEqual([]);
  });

  it("states the boundary where someone extending the player will read it", () => {
    const doc = readFileSync(join(ROOT, "docs/video-player.md"), "utf8");
    expect(doc).toContain("course-player");
    // And the licence obligation that arrives with it, since hls.js is the
    // registry's first non-MIT dependency.
    expect(doc).toContain("NOTICE");
  });
});
