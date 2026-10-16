# Model evals: committee review, 2026-10-15

Sources read: docs/PLAN.md (Model evals section), docs/evals/photo-events-evals.md, pipeline/evals/, app/scripts/eval-ip.ts, app/package.json. I did not re-run anything today. Spend to date: $0 (no paid model call has been made for evals).

## Done vs plan
| Item | Status |
|---|---|
| Rubric (4 hard checks, 6 dimensions 1-5, would_pay) | Exists, in `pipeline/evals/golden-v0.json` |
| Golden set golden_v0 (12 items, 8 cards, 4 books, 16 pages, 12 of 26 styles; neutral, no photos) | Exists as data; validates offline |
| Scorer `pipeline/evals/score.ts` | Runs offline, $0: validates the set, Wilson 95% intervals for QA pass and cost by model and stage from `pipeline/measurements/`, summarises human score files |
| Plan step 8 "Eval gate" (no prompt/model/style change merges without a golden run) | Written in PLAN, not enforced: no CI step, no stored baseline |
| Data roadmap stage 1 (docs/data/05) | Unbuilt |
| Photo and events evals (docs/evals/photo-events-evals.md) | Status PROPOSED. Docs only |

## Exists and runs vs docs only
- RUNS: `score.ts` (validation plus measured-run stats); `npm run eval:ip -- --mock` in app (215 cases, precision 100%, recall 90.7%, 0/65 false positives per the PLAN; in CI, mock only; today's rerun not done by me).
- EXISTS BUT CANNOT RUN: golden_v0 end to end. The identity stage requires reference photos, so text-only casts have no path. Needs a pipeline-owner change (text-described identity sheet plus a `--golden` CLI that writes one ledger per item). So there is no baseline: 0 golden renders have been scored.
- DOCS ONLY: pe-crop-v1 (80 photos x 3 slot shapes), photo-ranking set, proof-checker set, AI-background set, procedural photo generator. None is built (no files under pipeline/evals beyond the two above).
- No scorer for character consistency, anatomy, hands, teeth, framing or style fidelity. Automated QA checks only cast count, white border, text-in-image and IP, and it fails open on a vision error. QA verdicts are not stored.
- Only quality evidence today: 10 first-attempt renders, 5 passed (95% CI 24-76%), all on one legacy style and one image model (nano-banana-2.1, 21 calls). Per-style quality and cost: none. Fallback image models: never measured. Re-roll rate of 20% is a guess; use 20-50%.

## Quality gates needed before the Nov gates (Nov 13 books/cards, Nov 20 ship)
1. Character consistency: build the text-only identity path, run golden_v0 once to set the baseline, human-score consistency on the 4 books (model sheet vs pages). Gate: no worse than baseline on hard checks and would_pay; report n and CI. A judge cannot gate until calibrated on about 300 labelled pages, so for November the gate is human scoring.
2. IP eval: add `eval:ip --mock` as its own CI step; get the five missing protected characters (Rudolph, Frosty, Grinch, Jack Skellington, Elf on the Shelf) approved and committed with red-team and benign cases; fail-closed vision QA with a stored per-page verdict (pipeline owner); live eval of new cases under a cap.
3. Proof checker: build the `pe-proof` set (names spelled two ways, year not 2026, blurred copy) from the docs/evals spec. Pure code, $0, can be done before Oct 24 go/no-go. Also needed: layout `unfitted` text must fail the job.
4. Auto-crop: build the `pe-crop-v1` procedural set ($0, ground truth by construction). Blocked on one DPI rule (docs and code disagree: warn 200/block 150 vs code flags under 120, never blocks) and the owner's decision.
5. Fallback models: log `model_served`, baseline each of the two unmeasured fallbacks on golden_v0, or remove them from the chain before launch.

## Spend needed (all need an owner cap; nothing spent yet)
- First golden_v0 baseline on the primary model: about $2-3 (estimate); owner cap proposed $5.
- Each fallback model baseline: about $2-3 each, so $5 more.
- Synthetic adult photos for ranking/crop sets: cap $4. AI-background eval: cap $8 (91 renders about $5.50). Both are non-essential for Nov 13; backgrounds are not in 2026 scope.
- Recurring: about $50 a month ceiling if golden runs on every pipeline-prompt PR; mock mode for harness-only changes.
- November minimum: about $10-15 total (baseline, two fallbacks, one IP live run).

## Owner actions
- Approve a dollar cap (suggest $15) and name a human scorer (about 2 hours for 16 pages x 2 configs).
- Decide the DPI block rule; approve the five-character IP table; order the physical proof by Nov 6 so thresholds come from paper.
- Attorney: whether generated photoreal minors may be used as test data (until answered, none are).

## Needs from teammates
- Pipeline owner: text-only identity path, `--golden` mode, `model_served` and prompt version in the ledger, fail-closed IP QA, store QA verdicts.
- Card engineer: align `quality.ts` with the DPI rule. DevOps: add the eval steps to CI.
