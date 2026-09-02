#!/usr/bin/env node
/**
 * Architectural boundary gate.
 *
 * The layering (tokens -> primitives -> blocks) and the bundle split are both
 * invariants that nothing else enforces. They fail silently and expensively: a
 * CMS project that ships the ERP grid only finds out from a bundle report
 * months later, and a block that imports `next/link` only fails when someone
 * tries to use it outside Next.js.
 *
 * Usage: node scripts/check-boundaries.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Each rule names a directory (or single file), the import patterns banned
 * inside it, and why. The reason is printed on failure so the next person does
 * not have to reverse-engineer the intent.
 */
const RULES = [
  {
    dir: "registry/reno/ui",
    forbid: [
      { pattern: /^next\/(link|navigation|router|image)$/, why: "primitives take href/asChild so they work outside Next.js" },
      { pattern: /\bnext-intl\b|\bi18next\b|react-i18next|@lingui\//, why: "display strings go through props with Vietnamese defaults, never an i18n runtime" },
    ],
    reason:
      "Primitives must run in any React app. A framework or i18n import here is inherited by every consuming project and left behind at handover.",
  },
  {
    dir: "registry/reno/ui/table.tsx",
    forbid: [/@tanstack\//],
    reason:
      "`table` is the lightweight styled <table> for CMS and e-learning list views. Heavy grid features belong to @reno/data-grid, so a project installing only `table` pays no TanStack bundle cost.",
  },
  {
    dir: "registry/reno/ui",
    forbid: [{ pattern: /^recharts(\/|$)/, why: "recharts belongs to the chart item alone" }],
    except: ["registry/reno/ui/chart"],
    reason:
      "`chart` is a separate registry item so a project that draws no charts never installs recharts. The moment another primitive imports it, that split is gone and every consumer pays for it — the same reason `table` may not import TanStack.",
  },
  {
    dir: "registry/reno/ui",
    forbid: [{ pattern: /^embla-carousel/, why: "Embla belongs to the carousel item alone" }],
    except: ["registry/reno/ui/carousel.tsx"],
    reason:
      "`carousel` is a separate registry item so a project with no slider never installs Embla. Same split, same reason, as `chart`/recharts and `table`/TanStack: one primitive reaching for it makes every consumer pay.",
  },
  {
    dir: "registry/reno/ui/data-grid",
    forbid: [/\bnext-intl\b/, /\bi18next\b/, /react-i18next/, /\@lingui\//],
    reason:
      "DataGrid text goes through the `labels` prop with Vietnamese defaults. Depending on an i18n library would break the zero-dependency handover promise.",
  },
  {
    dir: "registry/reno/blocks",
    forbid: [
      { pattern: /@radix-ui\//, why: "blocks compose reno primitives, not Radix directly" },
      { pattern: /\bnext\/link\b/, why: "blocks take href/onNavigate so they work outside Next.js" },
      { pattern: /\bnext\/navigation\b/, why: "blocks must not embed routing" },
      { pattern: /\bnext-intl\b|\bi18next\b/, why: "blocks use the `labels` prop, not an i18n library" },
    ],
    reason: "Blocks must stay framework-agnostic and composed from reno primitives.",
  },
];

// Static import/export, side-effect import, CommonJS require, and dynamic import().
//
// `[^;]` rather than `[\s\S]` in the static branch matters: an unbounded lazy
// scan starting at the `import` of `import("x")` runs forward to the NEXT
// `from "..."` in the file and swallows the dynamic import whole, so the
// dynamic branch never gets a chance to match.
//
// The bare `import "x"` branch is not academic: it is the one form that pulls a
// package in for its side effects alone, so a banned dependency written that way
// would land in the consumer's bundle with every other branch here blind to it.
const IMPORT_RE =
  /(?:import|export)[^;]*?from\s*["']([^"']+)["']|\bimport\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|\bimport\(\s*["']([^"']+)["']\s*\)/g;

function collectFiles(target) {
  const abs = join(ROOT, target);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [abs];

  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const full = join(abs, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(relative(ROOT, full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function importsOf(source) {
  const found = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    found.push(match[1] ?? match[2] ?? match[3] ?? match[4]);
  }
  return found.filter(Boolean);
}

function normalise(forbid) {
  return forbid.map((f) => (f instanceof RegExp ? { pattern: f, why: null } : f));
}

/**
 * Shipped component source must not mention the `@reno/` namespace at all —
 * not even in a comment.
 *
 * Once installed, these files are the customer's own code and live in their
 * repository permanently. A stray `@reno/` reference is both meaningless to
 * them and, more practically, a false positive that makes
 * `scripts/eject-registry.mjs` refuse to certify a clean handover.
 */
function checkNamespaceLeaks(errors) {
  const dirs = ["registry/reno/ui", "registry/reno/blocks", "registry/reno/hooks", "registry/reno/lib"];
  for (const dir of dirs) {
    for (const file of collectFiles(dir)) {
      const source = readFileSync(file, "utf8");
      if (source.includes("@reno/")) {
        errors.push(
          `${relative(ROOT, file)} mentions "@reno/". Shipped source becomes the customer's own code; the namespace must not appear in it, and eject-registry.mjs treats it as an unclean handover.`,
        );
      }
    }
  }
}

function main() {
  const errors = [];
  let filesChecked = 0;

  for (const rule of RULES) {
    const patterns = normalise(rule.forbid);
    // `except` carves the owning directory out of a rule aimed at its parent,
    // which is how "recharts anywhere under ui/ except ui/chart" is expressed.
    const exceptions = (rule.except ?? []).map((dir) => join(ROOT, dir));
    const files = collectFiles(rule.dir).filter(
      (file) => !exceptions.some((dir) => file.startsWith(`${dir}/`) || file === dir),
    );

    for (const file of files) {
      filesChecked += 1;
      const rel = relative(ROOT, file);
      for (const spec of importsOf(readFileSync(file, "utf8"))) {
        for (const { pattern, why } of patterns) {
          if (pattern.test(spec)) {
            errors.push(
              `${rel} imports "${spec}" — ${why ?? rule.reason}\n      ${rule.reason}`,
            );
          }
        }
      }
    }
  }

  checkNamespaceLeaks(errors);

  if (errors.length) {
    console.error(`Boundary check failed (${errors.length} violation(s)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`Boundaries OK — ${filesChecked} files checked against ${RULES.length} rules.`);
}

main();
