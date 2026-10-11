/**
 * Red-team eval for the IP-safety screen.
 *   npm run eval:ip            live classifier (rules + one Sonnet call per batch), needs OPENROUTER_API_KEY
 *   npm run eval:ip -- --mock  rules only, free
 * Prints precision, recall and false-positive rate (positive = the case must be rewritten or blocked), per-category recall,
 * constraint failures (names that must be gone / kept) and the spend. Aborts if spend would pass --cap (default 0.15 USD).
 * The key is read from the environment or app/.env.local (OPENROUTER_API_KEY line only) and is never printed.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import fixtures from "../tests/fixtures/ip-redteam.json";
import { createLiveIpSafety, createMockIpSafety } from "../lib/safety/service";
import { ipScreenSpendUsd, openRouterCaller } from "../lib/safety/server";
import type { IpField, IpInput, IpResult } from "../lib/safety/types";

const HERE = dirname(fileURLToPath(import.meta.url));
type Case = { id: string; cat: string; field: IpField; text: string; expect: "ok" | "rewritten" | "blocked"; no?: string[]; keep?: string[]; knownNames?: string[]; history?: string[] };

function loadKey() {
  if (process.env.OPENROUTER_API_KEY) return;
  const f = join(HERE, "..", ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    if (line.startsWith("OPENROUTER_API_KEY=")) process.env.OPENROUTER_API_KEY = line.slice("OPENROUTER_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  }
}

const argv = process.argv.slice(2);
const mock = argv.includes("--mock");
/** Saves money: cases the free rules already rewrite or block keep the rules result; only rules-silent cases go to the model. */
const skipRulesHits = argv.includes("--skip-rules-hits");
const capArg = argv.indexOf("--cap");
const cap = capArg >= 0 ? Number(argv[capArg + 1]) : 0.15;

async function main() {
  if (!mock) loadKey();
  if (!mock && !process.env.OPENROUTER_API_KEY) throw new Error("No OPENROUTER_API_KEY (env or app/.env.local). Use --mock for the free rules-only run.");
  const svc = mock ? createMockIpSafety() : createLiveIpSafety(openRouterCaller);
  const cases = fixtures.cases as Case[];
  const results: IpResult[] = [];
  const BATCH = 8;
  const rules = createMockIpSafety();
  const toInput = (c: Case): IpInput => ({ text: c.text, field: c.field, knownNames: c.knownNames, history: c.history });
  const pre = await rules.screenBatch(cases.map(toInput));
  const idx = cases.map((_, i) => i).filter((i) => !skipRulesHits || mock || pre[i].verdict === "ok");
  const out: IpResult[] = [...pre];
  for (let i = 0; i < idx.length; i += BATCH) {
    if (!mock && ipScreenSpendUsd() >= cap) throw new Error(`Spend cap $${cap} reached; stopping.`);
    const part = idx.slice(i, i + BATCH);
    const res = await svc.screenBatch(part.map((k) => toInput(cases[k])));
    part.forEach((k, n) => (out[k] = res[n]));
  }
  results.push(...out);
  if (skipRulesHits && !mock) console.log(`(live model ran on ${idx.length} of ${cases.length} cases: the ones the free rules left unflagged)`);
  let tp = 0, fp = 0, fn = 0, tn = 0, verdictOk = 0, constraintFails = 0, degraded = 0;
  const byCat: Record<string, { pos: number; hit: number }> = {};
  const misses: string[] = [];
  const falsePos: string[] = [];
  cases.forEach((c, i) => {
    const r = results[i];
    const wantPos = c.expect !== "ok";
    const gotPos = r.verdict !== "ok";
    if (r.degraded) degraded++;
    if (wantPos && gotPos) tp++;
    else if (!wantPos && gotPos) (fp++, falsePos.push(`${c.id} ${JSON.stringify(c.text)} -> ${r.verdict}`));
    else if (wantPos && !gotPos) (fn++, misses.push(`${c.id} ${JSON.stringify(c.text)} -> ${r.verdict}`));
    else tn++;
    if (r.verdict === c.expect) verdictOk++;
    if (wantPos) {
      byCat[c.cat] ??= { pos: 0, hit: 0 };
      byCat[c.cat].pos++;
      if (gotPos) byCat[c.cat].hit++;
    }
    const low = r.safeText.toLowerCase();
    const bad = (c.no ?? []).some((s) => low.includes(s.toLowerCase())) || (c.keep ?? []).some((s) => !r.safeText.includes(s));
    if (bad) {
      constraintFails++;
      console.log(`  constraint fail ${c.id}: ${JSON.stringify(r.safeText).slice(0, 140)}`);
    }
  });
  const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "n/a");
  console.log(`\nIP-safety eval (${mock ? "rules only / mock" : "live: rules + claude-sonnet-5.5"}), ${cases.length} cases`);
  console.log(`  precision        ${pct(tp, tp + fp)}  (${tp}/${tp + fp})`);
  console.log(`  recall           ${pct(tp, tp + fn)}  (${tp}/${tp + fn})`);
  console.log(`  false-positive   ${pct(fp, fp + tn)}  (${fp}/${fp + tn} benign cases flagged)`);
  console.log(`  exact verdict    ${pct(verdictOk, cases.length)}`);
  console.log(`  constraint fails ${constraintFails}   degraded calls ${degraded}`);
  console.log("  recall by category:");
  for (const [k, v] of Object.entries(byCat)) console.log(`    ${k.padEnd(18)} ${pct(v.hit, v.pos)} (${v.hit}/${v.pos})`);
  if (misses.length) console.log(`  missed (${misses.length}):\n    ${misses.join("\n    ")}`);
  if (falsePos.length) console.log(`  false positives (${falsePos.length}):\n    ${falsePos.join("\n    ")}`);
  if (!mock) console.log(`  spend: $${ipScreenSpendUsd().toFixed(4)}`);
}

main().catch((e) => {
  console.error(String((e as Error).message).replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***"));
  process.exit(1);
});
