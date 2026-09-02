#!/usr/bin/env node
/**
 * Render gate: open the built site in a real browser and assert it actually
 * draws.
 *
 * Every other gate in this repo checks the code without ever running it. That
 * left a hole big enough to drive a truck through: the virtualized DataGrid body
 * rendered a full-height spacer containing zero rows on every page of the site,
 * and `mode="client"` filtered, sorted and paged nothing at all — for weeks,
 * with lint, types, 98 unit tests, an install-into-a-blank-project smoke test
 * and a deploy check all green. Nothing was *looking* at the result.
 *
 * The three assertions here are chosen to catch that class of defect and nothing
 * more, so the gate stays fast and does not turn into a flaky screenshot suite:
 *
 * 1. **Rows exist.** A grid that reports "1–25 of 10000" while rendering an
 *    empty tbody is the exact failure above.
 * 2. **No horizontal overflow.** A missing `min-w-0` on one flex item scrolls
 *    the whole application sideways; it is invisible in a unit test and obvious
 *    in a browser.
 * 3. **A clean console.** React key warnings, hydration mismatches and thrown
 *    effects all surface here and nowhere else.
 *
 * The showcase is swept across all four presets in both colour modes, because
 * the virtualizer bug reproduced only under the preset whose row height happened
 * to equal the hook's default.
 *
 * Uses the Chrome already installed on the runner rather than downloading a
 * browser: `playwright-core` ships no binaries, and GitHub's ubuntu image has
 * Google Chrome preinstalled.
 *
 * Usage:
 *   node scripts/check-render.mjs                       # http://127.0.0.1:3000
 *   node scripts/check-render.mjs --base http://host:1234
 *   CHROME_PATH=/path/to/chrome node scripts/check-render.mjs
 */

import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const BASE = baseIndex === -1 ? "http://127.0.0.1:3000" : args[baseIndex + 1];

const PRESETS = ["elearning", "admin", "erp", "cms"];
const MODES = ["light", "dark"];
const STORAGE_KEY = "reno-ui-docs-theme";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/**
 * Console noise that says nothing about whether the page rendered. Kept
 * deliberately short — an allowlist that grows is a gate that stops working.
 *
 * Matched against the message text *and* its source URL: a failed request logs
 * "Failed to load resource: ... 404" with the URL only in the location, so a
 * text-only match would either miss it or, worse, be widened to ignore every
 * 404 on the site.
 */
const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
];

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    console.error(
      "No Chrome found. Install Google Chrome or set CHROME_PATH to a Chromium binary.",
    );
    process.exit(1);
  }
  return found;
}

/**
 * Pages to check, and what "rendered" means for each.
 *
 * `minRows` counts `tbody tr` inside a DataGrid. Zero is the failure mode this
 * gate exists for, so any page carrying a grid declares it.
 */
const PAGES = [
  { path: "/", label: "home" },
  { path: "/components", label: "component index" },
  { path: "/components/data-grid", label: "DataGrid docs (server mode)", minRows: 1 },
  { path: "/components/chart", label: "Chart docs", requireSelector: ".recharts-surface" },
  // CodeMirror builds its text box in an effect and measures the document to do
  // it. A wrapper that renders on the server and never mounts leaves an empty
  // bordered box, which no test in jsdom can tell apart from a working one.
  {
    path: "/components/code-editor",
    label: "CodeEditor docs",
    requireSelector: ".cm-content",
  },
  /*
    The player attaches hls.js in an effect, after a dynamic import, and jsdom
    cannot run hls.js at all — so this page is the only place the real thing is
    exercised. `.cm-content`'s counterpart here is the `<video>` element with a
    source actually attached: a failed manifest leaves the element there with no
    `src`, which is the failure worth catching.
  */
  /*
    TipTap builds its contenteditable in an effect, after a dynamic import of
    ProseMirror, and renders nothing on the server. A wrapper that fails to
    mount therefore leaves an empty bordered box — indistinguishable, in jsdom,
    from a working editor.
  */
  {
    path: "/components/rich-text",
    label: "RichText docs",
    requireSelector: "[data-slot=rich-text] .ProseMirror",
  },
  {
    path: "/components/video-player",
    label: "VideoPlayer docs (local HLS fixture)",
    requireSelector: "[data-slot=video-player] video",
  },
  { path: "/perf/data-grid", label: "perf harness (10k rows, virtualized)", minRows: 1 },
  { path: "/theming", label: "theming" },
  { path: "/showcase/all-components", label: "kitchen sink" },
];

/** Collect console errors and uncaught exceptions for one navigation. */
function watchConsole(page, sink) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const url = message.location()?.url ?? "";
    if (IGNORED_CONSOLE.some((pattern) => pattern.test(text) || pattern.test(url))) return;
    sink.push(`console.error: ${text}${url ? ` (${url})` : ""}`);
  });
  page.on("pageerror", (error) => sink.push(`pageerror: ${error.message}`));
}

async function measure(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return {
      viewportWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      rows: document.querySelectorAll("[data-slot=data-grid] tbody tr").length,
    };
  });
}

/**
 * `scrollWidth` can exceed the viewport by a sub-pixel from rounding, so the
 * comparison carries a 1px tolerance. Anything larger is a real layout escape.
 */
function checkOverflow(where, { viewportWidth, scrollWidth }, errors) {
  if (scrollWidth > viewportWidth + 1) {
    errors.push(
      `${where}: page scrolls horizontally — scrollWidth ${scrollWidth} vs viewport ${viewportWidth}. ` +
        "Usually a flex item missing min-w-0, or a fixed-width child of a responsive container.",
    );
  }
}

async function checkPage(context, spec, errors) {
  const page = await context.newPage();
  const consoleErrors = [];
  watchConsole(page, consoleErrors);

  const response = await page.goto(`${BASE}${spec.path}`, { waitUntil: "networkidle" });
  if (!response || !response.ok()) {
    errors.push(`${spec.path}: HTTP ${response ? response.status() : "no response"}`);
    await page.close();
    return;
  }

  const metrics = await measure(page);
  checkOverflow(spec.path, metrics, errors);

  if (spec.minRows && metrics.rows < spec.minRows) {
    errors.push(
      `${spec.path} (${spec.label}): DataGrid rendered ${metrics.rows} rows, expected at least ${spec.minRows}. ` +
        "The grid reports a row count and paints a spacer even when it draws nothing, so this is silent in every other check.",
    );
  }

  if (spec.requireSelector) {
    const count = await page.locator(spec.requireSelector).count();
    if (count === 0) {
      errors.push(`${spec.path} (${spec.label}): nothing matched "${spec.requireSelector}".`);
    }
  }

  for (const message of consoleErrors) errors.push(`${spec.path}: ${message}`);
  await page.close();
  console.log(`  ✓ ${spec.path} — ${metrics.rows} grid row(s), no overflow`);
}

/**
 * The showcase across every preset and colour mode.
 *
 * This is the sweep a person would do by hand and never actually does. It is
 * cheap here because the theme lives in localStorage and one reload applies it.
 */
async function checkShowcase(context, viewport, errors) {
  const page = await context.newPage();
  const consoleErrors = [];
  watchConsole(page, consoleErrors);
  await page.setViewportSize(viewport);

  // First load establishes the origin so localStorage can be written.
  await page.goto(`${BASE}/showcase`, { waitUntil: "networkidle" });

  for (const preset of PRESETS) {
    for (const mode of MODES) {
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [STORAGE_KEY, JSON.stringify({ preset, mode })],
      );
      await page.reload({ waitUntil: "networkidle" });

      const where = `/showcase [${preset}/${mode} @ ${viewport.width}px]`;
      const metrics = await measure(page);
      checkOverflow(where, metrics, errors);

      if (metrics.rows === 0) {
        errors.push(`${where}: the people grid rendered no rows.`);
      }
      console.log(`  ✓ ${where} — ${metrics.rows} grid row(s)`);
    }
  }

  for (const message of consoleErrors) errors.push(`/showcase: ${message}`);
  await page.close();
}

async function main() {
  const executablePath = findChrome();
  console.log(`Rendering ${BASE} in ${executablePath}`);

  const browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ viewport: DESKTOP });
  const errors = [];

  try {
    for (const spec of PAGES) await checkPage(context, spec, errors);
    await checkShowcase(context, DESKTOP, errors);
    await checkShowcase(context, MOBILE, errors);
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.error(`\nRender check failed (${errors.length} problem(s)):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log("\nRender OK — every page drew, nothing overflowed, console clean.");
}

await main();
