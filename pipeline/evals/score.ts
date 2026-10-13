/** Free, offline eval scorer. No model calls.
 *  npx tsx evals/score.ts                     validate the golden set + measured QA pass rate and cost from measurements/
 *  npx tsx evals/score.ts --scores <file>     also summarise human rubric scores (JSONL, one page per line:
 *     {"item":"g01","page":"front","config":"nb2.1@2K+guard_v1","style":"watercolor_wash","consistency":4,...,"would_pay":true})
 *  Reports sample size and a 95% interval for every rate and mean, because n is small. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { LedgerEntry } from "../src/ledger.js";

const ROOT = join(import.meta.dirname, "..");
const golden = JSON.parse(readFileSync(join(ROOT, "evals", "golden-v0.json"), "utf8"));
const styleIds = new Set<string>(JSON.parse(readFileSync(join(ROOT, "..", "docs", "design", "style-library.json"), "utf8")).styles.map((s: { id: string }) => s.id));

/** Wilson 95% interval for k successes out of n. */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 1];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
const pct = (x: number) => `${(100 * x).toFixed(0)}%`;
const meanCi = (xs: number[]) => {
  const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / (n || 1);
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : 0;
  return `${m.toFixed(2)} ${n > 1 ? "±" + ((1.96 * sd) / Math.sqrt(n)).toFixed(2) : "(no interval)"} (n=${n})`;
};

// 1. Golden set checks: no photos, known styles, cast limits, page cast drawn from the item cast.
const problems: string[] = [];
for (const it of golden.items) {
  const names = new Set<string>([...it.cast, ...(it.pet ? [it.pet] : [])].map((c: { name: string }) => c.name));
  if (!styleIds.has(it.artStyle)) problems.push(`${it.id}: unknown style ${it.artStyle}`);
  if (it.cast.length > 4) problems.push(`${it.id}: more than 4 characters`);
  if (JSON.stringify(it).includes("photoIds")) problems.push(`${it.id}: golden items must not reference photos`);
  for (const p of it.pages) for (const n of p.characters) if (!names.has(n)) problems.push(`${it.id}/${p.id}: ${n} not in cast`);
}
const styles = new Set(golden.items.map((i: { artStyle: string }) => i.artStyle));
console.log(`golden ${golden.id}: ${golden.items.length} items, ${golden.items.reduce((a: number, i: { pages: unknown[] }) => a + i.pages.length, 0)} pages, ${styles.size}/${styleIds.size} styles; ${problems.length ? "PROBLEMS:\n  " + problems.join("\n  ") : "valid"}`);

// 2. Measured runs: first-attempt pass rate (a page passed if it has no "#reroll" attempt) and cost by model and stage.
const dir = join(ROOT, "measurements");
const all: LedgerEntry[] = readdirSync(dir).filter((f) => f.endsWith(".jsonl")).flatMap((f) => readFileSync(join(dir, f), "utf8").trim().split("\n").map((l) => JSON.parse(l)));
const renders = all.filter((e) => e.stage === "render");
const firsts = renders.filter((e) => !e.label.includes("#"));
const rerolled = new Set(renders.filter((e) => e.label.endsWith("#reroll")).map((e) => `${e.runId}/${e.label.split("#")[0]}`));
const passed = firsts.filter((e) => !rerolled.has(`${e.runId}/${e.label}`)).length;
const [lo, hi] = wilson(passed, firsts.length);
console.log(`first-attempt QA pass (dev runs, includes since-fixed QA bugs): ${passed}/${firsts.length} = ${pct(passed / (firsts.length || 1))}, 95% CI ${pct(lo)}-${pct(hi)}`);
const groups = new Map<string, number[]>();
for (const e of all.filter((x) => x.status === "ok")) {
  const k = `${e.stage.padEnd(10)} ${e.model}${e.imageSize ? "@" + e.imageSize : ""}`;
  groups.set(k, [...(groups.get(k) ?? []), e.costUsd]);
}
for (const [k, xs] of [...groups].sort()) console.log(`  ${k}: $${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(4)}/call, n=${xs.length}`);
console.log(`  total measured spend in ledgers: $${all.reduce((a, e) => a + e.costUsd, 0).toFixed(4)} (this script spends $0)`);

// 3. Optional human rubric scores, summarised per config and per style.
const i = process.argv.indexOf("--scores");
if (i > 0) {
  const rows = readFileSync(process.argv[i + 1], "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const dims = Object.keys(golden.rubric.dimensions);
  for (const key of ["config", "style"]) {
    for (const g of [...new Set(rows.map((r) => r[key]))]) {
      const rs = rows.filter((r) => r[key] === g);
      const pay = rs.filter((r) => r.would_pay === true).length;
      const [a, b] = wilson(pay, rs.length);
      console.log(`${key}=${g}: would_pay ${pay}/${rs.length} (${pct(a)}-${pct(b)})`);
      for (const d of dims) { const xs = rs.map((r) => r[d]).filter((x) => typeof x === "number"); if (xs.length) console.log(`  ${d}: ${meanCi(xs)}`); }
    }
  }
}
if (problems.length) process.exit(1);
