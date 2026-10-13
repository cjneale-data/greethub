// Shared helpers for the e2e scripts in this folder. Plain Playwright library (no @playwright/test runner yet).
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

/** One env name for every script. BASE is kept for the older shop-walk usage. */
export const BASE_URL = (process.env.BASE_URL || process.env.BASE || "http://localhost:3101").replace(/\/$/, "");
export const IS_LOCAL = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE_URL);
/** Screenshots and JSON go outside the repo by default (not gitignored), e.g. %TEMP%\greethub-e2e\launch. */
export const outDir = (name) => process.env.OUT || join(tmpdir(), "greethub-e2e", name);
export const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };

/**
 * Vercel Deployment Protection: pass VERCEL_AUTOMATION_BYPASS_SECRET (from the project's Protection settings)
 * to reach a protected preview. Read from the environment only; never print it.
 */
export function contextOptions(viewport) {
  const o = { viewport, deviceScaleFactor: viewport.width < 600 ? 2 : 1, isMobile: viewport.width < 600 };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) o.extraHTTPHeaders = { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" };
  return o;
}

export function makeReporter(tag = "") {
  const results = { ok: 0, fail: [], gaps: [] };
  const p = tag ? `[${tag}] ` : "";
  return {
    results,
    must(cond, msg) {
      if (!cond) {
        results.fail.push(msg);
        throw new Error(`FAIL: ${p}${msg}`);
      }
      results.ok++;
      console.log(`ok: ${p}${msg}`);
    },
    /** A known product gap against the stop condition: recorded, not thrown, unless STRICT=1. */
    gap(cond, msg) {
      if (cond) {
        results.ok++;
        console.log(`ok: ${p}${msg}`);
        return true;
      }
      results.gaps.push(msg);
      console.log(`GAP: ${p}${msg}`);
      if (process.env.STRICT === "1") throw new Error(`FAIL (STRICT): ${p}${msg}`);
      return false;
    },
    step: (s) => console.log(`\n== ${p}${s}`),
  };
}

/**
 * next dev compiles a route on first hit and can full-reload the page while it does, which wipes typed input
 * and made the first run of every script flaky. Request each route once before the browser opens it.
 */
export async function warmup(paths) {
  if (!IS_LOCAL) return;
  for (const p of paths) {
    try {
      await fetch(BASE_URL + p, { signal: AbortSignal.timeout(180_000) });
    } catch {
      /* the browser step will report the real error */
    }
  }
}

/** Console and page errors, minus the ones a step causes on purpose (declined test card, refused second preview). */
export function collectErrors(page, allow = [/status of 402/, /status of 403/, /status of 401/, /Download the React DevTools/]) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (!allow.some((r) => r.test(t))) errors.push(t);
  });
  return errors;
}

export function shotter(page, dir, prefix) {
  mkdirSync(dir, { recursive: true });
  let n = 0;
  return (name) => page.screenshot({ path: join(dir, `${prefix}-${String(++n).padStart(2, "0")}-${name}.png`), fullPage: true });
}

/**
 * A synthetic "photo": abstract shapes, no person. Never use real people or customer photos in tests
 * (docs/legal/06). 900x900 clears the 600 px minimum.
 */
export async function syntheticPhoto(seed = 0) {
  const sharp = require("sharp");
  const hue = (seed * 67) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <rect width="900" height="900" fill="hsl(${hue},45%,85%)"/>
    <circle cx="450" cy="380" r="190" fill="hsl(${(hue + 30) % 360},50%,65%)"/>
    <rect x="250" y="600" width="400" height="260" rx="60" fill="hsl(${(hue + 200) % 360},40%,55%)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

/** Run axe-core on the current page. Returns violations; tags limit it to WCAG 2.x A and AA. */
export async function axe(page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
  });
}

export function writeJson(dir, name, data) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), JSON.stringify(data, null, 2));
}
