# 05. Model improvement roadmap

Owner: Head of Data. Date: 2026-10-10. Read with `06-data-governance.md` (tiers, retention) and `03-schema.sql` (`ml.*`, `training_candidates`).

## 0. Position in one paragraph

GreetHub does not own a model; it orchestrates third-party ones (Sonnet for text and vision QA, Gemini image models through OpenRouter). Quality therefore improves through **prompts, routing, parameters, guard lines, QA and product design**, measured by evaluations and experiments, long before anyone should consider training anything. The data that makes this possible is operational and de-identified (Tier T0). Anything that would train a model on user content sits behind hard gates that are not met at launch and, for photos and photo-derived art, are not unlockable in this plan.

At workbook Base volumes (about 1,900 orders in year 1) the entire annual model bill is in the low thousands of dollars (ESTIMATE from `finance/README.md` unit costs: about $0.25 per card, $1.26 to $1.64 per book). **No fine-tune or distillation can pay back on cost at that scale.** Quality, consistency and trust are the only reasons to go beyond prompts, and each of those has a cheaper first answer (section 9).

## 1. Stage overview

| Stage | When | What it produces | Data used | Cost (ESTIMATE) | Gate to start | Owner |
|---|---|---|---|---|---|---|
| 0. Logging | before launch (DATA-001..011) | ledger with prompt version, served model, QA outcomes, user actions as history | T0 only | engineering time | none | CTO + Data |
| 1. Golden set and eval harness | launch to +4 weeks | `ml.eval_sets` golden_v1, one-command regression run, baseline numbers | synthetic briefs; released staff/volunteer adult photos | $15 to $20 per full run | releases filed for any real photo | Data |
| 2. Automated quality scorer | +4 to +10 weeks | calibrated judge (rules + vision LLM), later a tabular predictor of re-roll | golden labels; T0 outcomes | $0.003 per page judged | golden set labelled by humans | Data |
| 3. Prompt/model/parameter experiments | +8 to +20 weeks | winning prompt versions, size/model routing | T0 | within normal render spend | stage 1 baseline; stage 2 scorer | Data + CTO |
| 4. Preference signals | +16 weeks onward | pairs from re-roll/approval behaviour, used for ranking and routing | T0 (ids only) | none | stage 0 captures pairs | Data |
| 5. Template and style recommendation | about 2,000 completed creations | smoothed ranking by occasion, relationship, tone | T0 | none | volume; ADMT review | Data + CMO |
| 6. Demand forecasting | 12+ months of orders | weekly demand by product, spend pacing, printer cut-off planning | T0 order facts | none | one seasonal cycle | Data + CFO |
| 7. Fine-tune/distill (optional) | not before month 12 | only the options in section 8 that pass every gate | T2-eligible, non-likeness only | per option | G1 to G7 (section 8) | Owner decides |

## 2. Stage 0: logging (what must exist so everything else is possible)

Per model call (`ml.generation_attempts`): stage, label, `prompt_version_id`, `model_requested` vs `model_served`, `fallback_used`, `zdr_requested`, image size, params, tokens, `cost_usd`, latency, status, `experiment_key`/`variant`, `prompt_sha256` (nulled on deletion), `output_ref` (opaque; asset deleted on schedule). Per QA evaluation: evaluator, evaluator version, outputs, cost, whether it caused a re-roll. Per human action: re-roll reason codes, version selected, edits (metrics only), model-sheet redo reasons, ratings, approval. Per outcome: proof approved, ordered, delivered, refunded, reprinted, surveyed.

Prompt versioning rule (ticket DATA-005): every prompt template or guard-line set in `pipeline/src/stages/*` and `app/lib/intake/live-guide.ts` gets an id `stage@YYYY-MM-DD.n`, registered in `ml.prompt_versions` with the template hash and git commit; templates are immutable once used in production. A change to any word is a new version. Rendered prompts containing names are never stored (legal 06 req 30); the hash plus template id is enough to reconstruct what ran when combined with the brief for the operational retention period.

## 3. Stage 1: golden set and eval harness

Purpose: answer "did this prompt/model change make things better or worse, and what did it cost" in 20 minutes, without touching customer data.

**Composition (golden_v1, about 40 cards and 8 books):**

| Slice | Items | Source | Why |
|---|---|---|---|
| Text-only cards, all 15 occasions x 3 tones, 6 art styles | 24 cards | synthetic briefs generated from `brief.ts` enums | style/occasion coverage |
| Cards with adult volunteer photos | 8 cards | staff/volunteer adults with signed release (stored with `ml.eval_sets.release_doc_ref`) | likeness path |
| Cards with pets | 8 cards | staff-owned pets | animals, counts |
| Books, 24 pages, text-described characters | 4 books | synthetic | story, layout, consistency without photos |
| Books, adult proxies for family cast (1 to 4 characters) | 4 books | adult volunteers | multi-character consistency, the known failure mode (count, white border, text) |
| Stress tags | across items | tagged: group of 4, glasses, long names, hair types, skin tones, pet + people, "include/avoid" lists, copyright rewrites | regression targets |

Rules: **no photos of children, real or synthetic.** Child characters are tested through text descriptions and adult proxies; the limitation (likeness quality for real children cannot be evaluated offline) is accepted and stated. The Eye Story family photos are not used until the signed releases from `docs/legal/00-summary.md` open question are on file. No customer content ever enters the golden set.

**Metrics per run:** automated QA pass (count correct, no border, no text), first-attempt pass, fallback rate, cost per item, latency; human scores on a 40-page sample (likeness 1-5, style fidelity 1-5, composition 1-5, "would you pay for this" yes/no), and pairwise A/B preference between configurations. Results go to `ml.eval_runs`/`ml.eval_scores` with the config (model, prompt version ids, size, guard lines).

**Cost:** about 40 cards at $0.16 to $0.25 plus 8 books at $1.26 = $15 to $20 per full run at 2K. Use the spend cap and the `eval` purpose in `analytics.spend_daily`.

**Done when:** one command reruns the set, output is a table by slice, and a baseline is stored for the launch configuration.

## 4. Stage 2: automated quality scorer

1. **Calibrate what exists.** The current QA is a local white-border test plus a vision count/text check (`pipeline/src/stages/qa.ts`). Label 300 golden/early pages by hand (pass, fail reason). Report precision/recall of each check; tune thresholds. Known issue from the CTO report: the counting check mis-counted background animals once and a border check was over-strict; both fixed, so the labelled set is the regression test for them.
2. **Add judges for what QA cannot see:** style consistency of a page against the approved model sheet, outfit consistency, anatomy (hands, extra limbs), crop/headroom for the text zone, banned content (logos, recognisable characters; legal 06 req 19). Each is a cheap vision-LLM question returning JSON, versioned like prompts; stored as `qa_results` rows with `evaluator_version`. These judge calls see the generated page and generated sheet only (never the raw upload), still routed ZDR.
3. **Measure agreement** with human labels (Cohen's kappa, per check). A judge is allowed to auto-reroll only above an agreed precision (GUESS: 0.9) because each false reroll costs about $0.06 and a user-visible delay.
4. **Tabular predictor (optional, T0 only):** gradient-boosted or logistic model predicting "will this page be re-rolled by the user" from metadata (model, size, prompt version, style, cast size, QA flags, judge outputs). Inputs are C0/C1 columns; no images or text. Use: choose a better candidate before showing, decide when to spend an extra render. Needs about 5,000 pages (about 400 books equivalent); until then use the rules.
5. **Never in this stage:** training an image-embedding model on likeness art; storing embeddings of generated pages of real people (they are likeness data and could encode faces, legal 02 s5).

## 5. Stage 3: prompt and model experiments

Principles: offline first (golden set), online second (A/B at the creation level), one variable at a time, immutable versions, pre-registered metric, concurrent randomisation (never before/after, December is not June).

| Item | Rule |
|---|---|
| Unit | creation for render/prompt experiments (so one book sees one prompt version end to end); subject for UX experiments |
| Assignment | deterministic hash of `(experiment_key, unit_id)` -> bucket; recorded in `ml.experiment_assignments`; sticky |
| Primary metrics | first-attempt QA pass; proof approved with no re-roll; effective cost per accepted page; story edit rate for story prompts |
| Guardrails | failure rate, p90 time to proof, cost per creation, support contacts, refund rate |
| Sample size | pages per arm for detecting +8 points on a 75% baseline (alpha 0.05, power 0.8): about 460; clustered by book (14 pages) so plan about 60 books per arm. At about 36 orders/week this is 4 to 8 weeks per experiment, so run offline first and online only for finalists |
| Stopping | fixed horizon, no peeking; or sequential test with alpha spending; decision logged in `ml.experiments.decision` |
| Rollout | winner to 100% only if guardrails hold; prior version stays registered for rollback |
| Forbidden | experiments that change consent text, age gate, retention, moderation thresholds downward, price (CFO owns), or that route a photo to a non-ZDR model |

Candidate experiments, in priority order: (1) image size 2K vs 4K for books (CTO judges 4K not worth 2x; validate with a physical proof and re-roll rate); (2) guard-line variants for FULL-BLEED/FRAMING/exact count; (3) model-sheet prompt variants (cut redo rate); (4) model chain order (cost vs first-pass); (5) story prompt variants (edit distance); (6) auto-reroll policy (one vs zero, judge threshold); (7) re-roll allowance size (needs CFO sign-off).

## 6. Stage 4: preference data from behaviour

Signals already produced by the product flow, stored as ids only (`ml.preference_pairs`, `strength` is heuristic):

| Signal | Chosen | Rejected | Strength |
|---|---|---|---|
| User re-rolls a page and approves the new version | new attempt | replaced attempt | 0.6 |
| User switches back to an earlier version (`page_version_selected`) | earlier | later | 0.8 |
| Auto-QA pass vs auto-QA fail for the same page | passing attempt | failed attempt | 0.5 (not human) |
| Model sheet redo then approved | approved sheet | previous sheet | 0.6 |
| Proof approved with zero re-rolls | all pages | none | positive-only |
| Refund/reprint coded quality | | order's pages | negative-only |

Uses allowed under T0: aggregate analysis of which prompt/model/size produces more accepted pages; training the tabular predictor in stage 2; model/route selection. Uses requiring T2 and sign-off: learning from the **content** of the images or text (reward models, DPO/RLHF data). The pair table holds no content, so it can be kept and analysed safely; joining pairs to images for training is blocked for photo-derived and likeness items by `ml.training_candidates` constraints.

## 7. Stages 5 and 6: recommendation and forecasting

**Recommendation of templates/styles (about 2,000 completed creations):** per context (occasion x relationship group x tone x reading age) compute the smoothed rate of (proof approved with no reroll) and (ordered), using empirical Bayes shrinkage toward the product-wide rate; rank styles and templates; show as ordering of chips and "popular for this occasion". Exploration: Thompson sampling over the top styles with a floor of 20% for the CMO's curated default so cold start is not harmed. Inputs: enumerated brief fields only. No individual-level profiling beyond the user's own saved People and history (already in the plan's RAG). Attorney check on automated decision/profiling rules for personalisation (CPPA, legal 02 s4 gap). Interim: CMO-curated ranking and plain popularity.

**Demand forecasting (12+ months):** the unit is weekly paid items by SKU. Baselines: seasonal-naive and the workbook seasonality indices (`Inputs` rows 68-79: Dec 1.9, May 1.4, Feb 1.3, Nov 1.3). Methods in order: ETS/Prophet-style with holiday regressors (Christmas, Mother's Day, Father's Day, Valentine's, back-to-school), then gradient boosting with leading indicators (creator starts, saved reminders for upcoming dates, waitlist, ad spend). Metric: weekly MAPE on holdout vs workbook forecast. Uses: printer cut-off messaging, daily spend cap planning (`GENERATION_DAILY_SPEND_CAP_USD`), ad pacing, support staffing, inventory-free capacity planning for Lulu/Prodigi. Occasion reminders (`reminder_opt_in_changed`) are the highest-quality leading indicator; recipients' dates are third-party data (attorney item). Before month 12 only simple seasonal scaling from the workbook is used.

## 8. Stage 7: fine-tuning and distillation (optional, gated)

### Options and honest value

| Option | What | Value at GreetHub scale | Data it would need | Verdict |
|---|---|---|---|---|
| A. Distil the story/copy writer into a small model | cheaper/faster text | text is about $0.02 to $0.05 per product of about $1.3: negligible saving | thousands of story outputs | Do not. Low ROI |
| B. Replace vision QA with a small trained classifier | cheaper, faster, consistent QA | QA is about $0.035 per book (about 3%); consistency gain real but modest | labelled images (generated pages) | Maybe later, trained only on golden/synthetic and non-likeness pages |
| C. Reward model for best-of-N selection | pick the best of 2 renders | quality up; cost up (extra render $0.06) | pairs with image content | Only on non-likeness data (T2 + sign-off); otherwise use the stage-2 tabular predictor |
| D. Fine-tune an image model/LoRA for house styles | style consistency, fewer guard lines | real quality lever | style exemplars | Use licensed or commissioned exemplars or staff-made synthetic-brief renders with no likeness, never customer art |
| E. Self-host an image model | cost/control | infra heavy, loses vendor quality; no | | Do not |
| F. Train on user photos or on art derived from them | likeness quality | the one thing the legal docs prohibit | photos of people/minors | **Never in this plan** |

### Gates (all must be satisfied and recorded in `privacy.legal_signoffs` / `ml.dataset_versions`)

| Gate | Requirement |
|---|---|
| G1 Legal scope | Written attorney opinion naming the scope (modality, source, purpose), covering COPPA/state children's laws, BIPA/CUBI, CCPA de-identification, and the privacy policy wording |
| G2 Consent | Row has `consent_tier_at_capture = T2` (separate, unticked checkbox F, wording version recorded, still valid, not withdrawn) |
| G3 Content class | `derived_from_photo = false`, `contains_likeness = false`, `minors_possible = false`; text passed PII scan and scrub; moderation clean. Enforced by the `eligible_requires_all_gates` CHECK |
| G4 Vendor terms | Terms of every model whose outputs are used (Anthropic, Google via OpenRouter) permit using outputs to train another model. Many API terms restrict using outputs to develop competing models [U: not verified this session]; the attorney and a vendor email decide |
| G5 Volume and value | Eligible rows exceed a pre-set minimum (GUESS: 5,000 for classifiers, 10,000 for generation tuning) and a written cost-benefit shows payback or a quality gain proven on the golden set |
| G6 Lineage and deletion | Dataset registered in `ml.dataset_versions` with member list; withdrawal/deletion flags `needs_rebuild`; a policy on already-trained models (retrain schedule, or consent wording that states trained models are not unwound) approved by the attorney |
| G7 Evaluation and red team | Beats the baseline on golden_v1 and on human review; memorisation/leak probe (prompt the tuned model for training names and scenes) passes; no regression on safety checks |

Data collection for T2 does not start until G1 is signed. At launch box F is hidden and `privacy.consent_state.tier` cannot be set to T2 without `consent_id` (check constraint), and `ml.training_candidates` rows can be at most `quarantined`. Whether to open T2 at all is an owner decision (summary), and my recommendation is **not before month 12 and only for non-photo creations**.

## 9. What to do first for each quality problem (cheapest first)

| Problem | Cheaper than training |
|---|---|
| Wrong character count | exact-count guard line (exists), QA reroll, shorter cast per page |
| White borders, text in images | FULL-BLEED/no-text lines (exist), local border check |
| Likeness drift across pages | model sheet gate (exists), sheet-first prompts, lower redo rate via better sheet prompt |
| Story reads flat | prompt versions + edit-distance metric, example-bank in RAG (our own writers' samples, not user text) |
| Costly re-rolls | cheaper first drafts at 1K for sheet previews, better routing, scorer |
| Slow | queue concurrency, fallbacks, size |
| Style inconsistency | style presets (exist), style exemplars in prompt |

## 10. What NOT to do

1. Do not train, fine-tune, distil, embed or evaluate a model on photos of people or on art derived from photos, "just to see". No exceptions for staging, hackathons or the founder's own family unless it is in an `eval_sets` row with a release.
2. Do not run face detection, face counting, age or gender estimation, face embeddings or "is this the same person" on uploads or on generated likeness art (BIPA/CUBI theory; legal 02 s5). Count characters only on generated output, by the existing QA.
3. Do not store prompts or chat text with names in analytics, logs, vendor "prompt logging" (keep OpenRouter prompt logging off), or issue trackers. Use template version + hash.
4. Do not reuse box D (public showcase) or box C (keep Saved Person) as training consent. Do not infer consent from silence, bundle it in Terms, or make it a condition of service.
5. Do not collect now and decide later: no stockpiling of C3/C4 "in case we want it". Retention schedule applies to everything.
6. Do not retroactively use T0/T1 data for T2 purposes.
7. Do not promote a scorer or prompt on a handful of anecdotes; no change ships without golden-set numbers and a rollback.
8. Do not run experiments that change legal text, consent flows, age gates or moderation, or that expose a minor's data to a new vendor.
9. Do not ship a customer-facing "AI learns from your edits" claim. If true later, it needs the claims file (legal 06 req 13).
10. Do not buy or scrape external image datasets of people for training; copyright and consent provenance is unknown.
11. Do not add a vendor (analytics, experimentation, labelling) that receives user-linked content without a DPA and a deletion route.
12. Do not optimise a metric the CFO cannot tie to contribution margin (vanity engagement, time on site).
13. Do not outsource labelling of customer content. Humans label only golden-set items and scrubbed T1 text under the access rules in governance.

## 11. Metrics for the roadmap itself

| Metric | Target by month 6 (GUESS) |
|---|---|
| Golden-set rerun time | < 30 min, < $20 |
| Prompt versions with online evidence | at least 3 A/B decisions logged |
| First-attempt QA pass rate | +10 points over launch baseline, or explanation |
| Share of pages approved without re-roll | +10 points over launch baseline |
| Effective cost per accepted page | -15% vs launch baseline |
| Items in `training_candidates` with status `eligible` | 0 (expected; T2 closed) |
| Deletion requests that required dataset rebuild | tracked, target 0 unexplained |
