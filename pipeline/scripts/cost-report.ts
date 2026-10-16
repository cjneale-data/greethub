/** Builds finance/measured_costs.json from the ledgers in measurements/. Re-run after any new measured run.
 *  npx tsx scripts/cost-report.ts */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { LedgerEntry } from "../src/ledger";

const dir = join(import.meta.dirname, "..", "measurements");
const load = (n: string) => readFileSync(join(dir, `${n}.jsonl`), "utf8").trim().split("\n").map((l) => JSON.parse(l) as LedgerEntry);
const runs = Object.fromEntries(readdirSync(dir).map((f) => f.replace(".jsonl", "")).map((n) => [n, load(n)]));
const sum = (e: LedgerEntry[]) => e.reduce((a, x) => a + x.costUsd, 0);
const avg = (e: LedgerEntry[]) => (e.length ? sum(e) / e.length : 0);
const r4 = (n: number) => Number(n.toFixed(4));

const all = Object.values(runs).flat();
const ok = (e: LedgerEntry[]) => e.filter((x) => x.status === "ok");
const render2k = ok(all.filter((e) => e.stage === "render" && e.imageSize === "2K"));
const sheet2k = ok(all.filter((e) => e.stage === "modelsheet" && e.imageSize === "2K"));
const probe = (s: string) => ok(runs["size-probe"].filter((e) => e.imageSize === s && e.kind === "image"));
const render1k = ok(all.filter((e) => e.stage === "render" && e.imageSize === "1K"));
const stage = (s: string, from: LedgerEntry[] = all) => ok(from.filter((e) => e.stage === s));

const unit = {
  image_1K: r4(avg([...render1k, ...ok(all.filter((e) => e.stage === "modelsheet" && e.imageSize === "1K"))])),
  image_2K: r4(avg([...render2k, ...sheet2k])),
  image_4K: r4(avg(probe("4K"))),
  identity_sheet: r4(avg(stage("identity"))),
  qa_vision_per_page: r4(avg(stage("qa"))),
  card_copy: r4(avg(all.filter((e) => e.label === "card_copy"))),
  book_story_3_spreads: r4(avg(all.filter((e) => e.label === "story"))),
  page_prompts_card_2_pages: r4(avg(all.filter((e) => e.stage === "prompts" && runs["card-3"].includes(e)))),
  page_prompts_book_4_pages: r4(avg(all.filter((e) => e.stage === "prompts" && runs["book-1"].includes(e)))),
};

const img2k = ok(all.filter((e) => e.kind === "image" && e.imageSize === "2K"));
const total = (name: string) => r4(sum(runs[name]));
const measuredProducts = {
  card_2K_front_plus_inside: { run: "card-3", renders: 3, rerolls: 0, costUsd: total("card-3"), note: "clean run: model sheet + front + inside, vision QA, no re-rolls" },
  card_2K_with_two_qa_rerolls: { run: "card-2", renders: 5, rerolls: 2, costUsd: total("card-2"), note: "both pages hit a real white-border failure and re-rolled once" },
  card_1K_front_plus_inside: { run: "card-1", renders: 5, rerolls: 2, costUsd: total("card-1"), note: "1K; re-rolls were false positives of an early over-strict border check (fixed), so cost is inflated by ~$0.08" },
  book_2K_4_art_pages: { run: "book-1", renders: 6, rerolls: 1, costUsd: total("book-1"), note: "model sheet + cover + 3 spreads (+1 re-roll caused by a QA counting bug, fixed). Text: identity, 3-spread story, prompts" },
};

// ---- extrapolation (2K), documented assumptions in docs/cto/pipeline-costs.md ----
const render = unit.image_2K;
const qa = unit.qa_vision_per_page;
const promptsPerPage = r4(unit.page_prompts_book_4_pages / 4);
const storyPerSpread = r4(unit.book_story_3_spreads / 3);
const REROLL = 0.2; // observed first-pass QA failure rate on real pages ~2/8 (all white-border), rounded to 20% for the plan
function book(spreads: number) {
  const renders = 1 + spreads + 2; // model sheet + spreads + front + back cover
  const art = renders * render;
  const text = unit.identity_sheet + storyPerSpread * spreads + promptsPerPage * (spreads + 2);
  const qaCost = (renders - 1) * qa;
  const base = art + text + qaCost;
  const rerolls = (renders - 1) * REROLL * (render + qa);
  return { renders, base_no_rerolls: r4(base), expected_with_rerolls: r4(base + rerolls), art: r4(art), text: r4(text + qaCost) };
}
function card(renders: number) {
  const pages = renders - 1;
  const base = renders * render + unit.identity_sheet + unit.card_copy + promptsPerPage * pages + pages * qa;
  return { renders, base_no_rerolls: r4(base), expected_with_rerolls: r4(base + pages * REROLL * (render + qa)) };
}
const extrapolated = {
  assumptions: { image_size: "2K (about 280 DPI at card size, 234 DPI at book size)", reroll_rate: REROLL, prompts_cost_per_page: promptsPerPage, story_cost_per_spread: storyPerSpread },
  card_front_only: card(2),
  card_front_plus_inside: card(3),
  book_24_pages: book(11),
  book_32_pages: book(15),
  book_24_pages_at_4K: (() => { const b = book(11); const d = (unit.image_4K - render) * b.renders; return { base_no_rerolls: r4(b.base_no_rerolls + d), expected_with_rerolls: r4(b.expected_with_rerolls + d * (1 + REROLL)) }; })(),
  guest_preview_1K_front_only_no_model_sheet: { costUsd: r4(unit.image_1K + unit.identity_sheet + unit.card_copy + promptsPerPage + qa), note: "estimate; not run end to end" },
};

const real = all.filter((e) => e.kind === "image" || e.kind === "text");
const attempts = real.length;
const httpErrors = real.filter((e) => e.status === "http_error").length;
const netErrors = real.filter((e) => e.status === "network_error").length;
const noImage = real.filter((e) => e.status === "no_image").length;
const out = {
  generated_at: new Date().toISOString(),
  currency: "USD",
  source: "pipeline/measurements/*.jsonl (OpenRouter usage.cost per call, costSource=openrouter_usage)",
  test_spend_total_usd: r4(sum(all)),
  models: { text: "anthropic/claude-sonnet-5.5", image_used: "google/gemini-nano-banana-2.1 (first in chain, served every call)", fallbacks_not_triggered: ["google/gemini-3.1-flash-image", "google/gemini-3-pro-image"] },
  per_call_usd: unit,
  per_call_detail: {
    image_by_size: { "1K": { avg: unit.image_1K, n: render1k.length + 1 }, "2K": { avg: unit.image_2K, n: render2k.length + sheet2k.length }, "4K": { avg: unit.image_4K, n: probe("4K").length, note: "single probe call" } },
    latency_seconds_avg_image_2K: r4(img2k.reduce((a, e) => a + e.ms, 0) / 1000 / img2k.length),
  },
  measured_products: measuredProducts,
  extrapolated_per_product_usd: extrapolated,
  reliability: {
    total_calls: attempts,
    http_errors: httpErrors,
    network_errors: netErrors,
    no_image_responses: noImage,
    retry_rate: r4((httpErrors + netErrors) / attempts),
    fallback_model_used: false,
    page_qa_first_pass_failures: "2 of 8 real page renders at 2K failed QA first pass (white-border vignette); 1 more flagged by a QA counting bug since fixed; 0 of 3 at 1K were true failures",
    assumed_reroll_rate: REROLL,
  },
  notes: ["Costs exclude print, shipping, Stripe and hosting.", "4K costs about 2x the 2K price; 2K is the recommended default for print at these trim sizes.", "Only 4 pipeline runs fit the $2.50 test budget, so reroll and failure rates are small-sample."],
};
writeFileSync(join(import.meta.dirname, "..", "..", "finance", "measured_costs.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify({ unit, extrapolated, total: out.test_spend_total_usd }, null, 1));
