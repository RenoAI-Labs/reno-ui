#!/usr/bin/env node
/**
 * Drives the DataGrid scroll benchmark at `/perf/data-grid` and prints the
 * result.
 *
 * The harness itself measures frames painted during a five-second window while
 * *someone scrolls*. Leaving that to a human makes the number unreproducible —
 * scroll speed and distance change it — so this script performs the scroll:
 * a wheel event every ~16ms for the whole window, which is roughly a sustained
 * flick rather than a gentle drag.
 *
 * The number is device-dependent, and the plan's ≥55 FPS acceptance criterion is
 * about a mid-range developer machine. Always record the hardware alongside the
 * result; a figure with no machine attached says nothing.
 *
 * Deliberately NOT part of CI. A shared runner's frame timing is noise, and a
 * performance gate that flakes gets disabled within a week — which is worse than
 * having no gate. `check-render.mjs` covers the part that must never regress
 * (that the virtualized grid renders rows at all).
 *
 * Usage:
 *   npm run build && npx next start &
 *   node scripts/bench-data-grid.mjs                       # http://127.0.0.1:3000
 *   node scripts/bench-data-grid.mjs --base http://host:1234 --runs 3
 */

import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};

const BASE = readArg("--base", "http://127.0.0.1:3000");
const RUNS = Number(readArg("--runs", "3"));

/** Matches MEASURE_MS in the harness, plus room for the result to settle. */
const WINDOW_MS = 5600;
const WHEEL_STEP_PX = 220;
const WHEEL_INTERVAL_MS = 16;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((path) => existsSync(path));
  if (!found) {
    console.error("No Chrome found. Set CHROME_PATH to a Chromium binary.");
    process.exit(1);
  }
  return found;
}

async function runOnce(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/perf/data-grid`, { waitUntil: "networkidle" });

  const rows = await page.locator("[data-slot=data-grid] tbody tr").count();
  if (rows === 0) {
    // Guard against benchmarking an empty grid, which reports a beautiful frame
    // rate while drawing nothing. That is not hypothetical — it is exactly what
    // this page did before the virtualizer took its scroll viewport from state.
    await page.close();
    throw new Error("The grid rendered no rows; there is nothing to benchmark.");
  }

  const scroller = page.locator("[data-slot=data-grid] .overflow-auto").first();
  const box = await scroller.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  await page.getByRole("button", { name: /Đo FPS/ }).click();

  const deadline = Date.now() + WINDOW_MS;
  while (Date.now() < deadline) {
    await page.mouse.wheel(0, WHEEL_STEP_PX);
    await page.waitForTimeout(WHEEL_INTERVAL_MS);
  }

  await page.waitForFunction(
    () => /FPS trung bình/.test(document.body.innerText),
    null,
    { timeout: 15_000 },
  );

  const summary = await page.evaluate(() => {
    const match = document.body.innerText.match(/[\d.]+ FPS trung bình.*/);
    return match ? match[0] : null;
  });
  const scrolled = await scroller.evaluate((el) => el.scrollTop);
  await page.close();

  return { rows, scrolled, summary };
}

async function main() {
  const browser = await chromium.launch({
    executablePath: findChrome(),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    for (let run = 1; run <= RUNS; run += 1) {
      const { rows, scrolled, summary } = await runOnce(browser);
      console.log(`run ${run}: ${summary}  (${rows} rows in DOM, scrolled ${scrolled}px)`);
    }
  } finally {
    await browser.close();
  }

  console.log("\nRecord the machine alongside these numbers — they are device-dependent.");
}

await main();
