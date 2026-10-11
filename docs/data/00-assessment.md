# 00. Data assessment

Owner: Head of Data. Date: 2026-10-10. Basis: reading of `docs/PLAN.md`, `docs/cto/*`, `docs/cmo/*`, `finance/README.md` and the workbook `Inputs` sheet, `docs/legal/*` (esp. 02, 06), `docs/LAUNCH-CHECKLIST.md`, `app/lib/**`, `app/packages/shared/src/**`, `pipeline/src/**`, `pipeline/measurements/*.jsonl`. No `.env` files read, no paid calls made. Legal points are research positions, not legal advice; every attorney item is collected in `06-data-governance.md` section 11.

## 1. Bottom line

GreetHub logs **cost per model call** well and almost nothing else. There is no product analytics, no attribution, no persisted quality signal, no prompt versioning, no printer cost data, and no deletion path that reaches anything outside the book store. If the site launched today the CFO workbook would still be running on guesses for its funnel, product-mix, repeat, refund and print-cost inputs after 90 days, and nobody could answer "which prompt change made pages worse".

The good news: the two things that are hardest to retrofit (a per-call ledger with real USD cost, and a consent record that carries a wording hash and a consent id on every upload) already exist. The work is to widen them, put them in Postgres, and make deletion reach them.

## 2. What is logged today

| Data | Where | What it holds | Verdict |
|---|---|---|---|
| Cost ledger | `pipeline/src/ledger.ts` (`LedgerEntry`), written by `pipeline/src/openrouter.ts` on every attempt (ok, http_error, network_error, no_image) | ts, runId, stage, label, model, kind, imageSize, attempt, status, httpStatus, prompt/completion/image tokens, `costUsd` from OpenRouter `usage.cost`, `costSource`, ms | Strong base. 45 real calls in `pipeline/measurements/*.jsonl`, 0 computed costs, feeds `finance/measured_costs.json`. |
| Ledger location in the app | `app/lib/book/engine/live.ts:47` writes `cost_ledger.jsonl` into the per-project work dir; `app/lib/intake/pipeline-runner.mjs` does the same for guest previews | one JSON-lines file per project | **Deleted with the project**: `deleteUserBookData` in `app/lib/book/privacy.ts` does `rmSync(work/<projectId>)`. Cost history of every deleted customer disappears, which also erases the unit-economics data. |
| Job record | `app/lib/book/types.ts` `Job` (file store, `fileStore.ts`) | kind, status, timestamps, progress, per-page status and versions, `costUsd` (sum), error, `charge` (free_redo / reroll) | Operational state, not analytics. Holds full `JobInput` (character names, scene text). Not queryable across users. |
| Book project | `BookProject` | brief form, photos with `consentId` and `expiresAt`, consent record, story state (`editedIds`), sheet versions and `freeRedosUsed`, per-page versions and `current`, `rerollsUsed`, `proof.approved/approvedAt`, `costUsd` | Contains the behavioural signals (edits, redos, version choice, approval) but only as the **current state**. History of what changed and when is lost. |
| QA verdicts | `pipeline/src/stages/qa.ts` returns `QaVerdict` | pass, characterCount vs expectedCount, whiteBorder, textInImage, notes, source | **Not persisted.** `live.ts:137` keeps only `qaNote` when QA failed. First-attempt pass rate (the main quality metric) cannot be computed from stored data. The QA call itself is in the ledger (`stage: "qa"`), but not its outcome. |
| Prompts | `pipeline/src/stages/prompts.ts`, guard lines in code | rendered per run | **No prompt version id, no hash, nothing stored.** `PLAN.md` and legal 06 req 30 correctly say not to log prompts containing personal data, which means we need template versions and hashes instead. |
| Consent log | `app/lib/book/consent.ts` `ConsentRecord`, held inside `BookProject` | id, userId, time, ip, userAgent, wordingVersion, wordingHash, boxes A-D, photoIds, characterLabels, withdrawnAt | Right shape for legal 02 s6. Lives inside the project so it is removed by `deleteUserBookData`, but legal requires a 5-year log (comment in `privacy.ts` acknowledges the production table must keep it). No box for product-improvement or training use. |
| Photo purge and deletion log | `app/lib/book/privacy.ts` `purgeExpiredPhotos`, `logDeletion` | `logs/deletions.jsonl` with project id, photo ids, reason | Local file, fine for dev. No subject-level propagation, no analytics, no vendors, no task tracking. |
| Orders | `app/lib/shop/types.ts` `Order`, `OrderItem`, `Fulfillment`, `StatusEvent` history, `processedEvents` for webhook idempotency | status history with timestamps, totals, shippingMethod, deliveryDate, printer externalId/tracking, proof-approval consent `{policyVersion, proofApproved, at}` | Good order facts. **Missing:** acquisition channel, first/last touch, actual print and shipping cost from the printer, Stripe fee, refund reason, reprint link, promised-vs-actual delivery computed anywhere. |
| Users | `UserRecord` | acceptance of terms/privacy version and age confirmation, re-roll allowance | No attribution, no consent tier. |
| Briefs/drafts | `Draft.brief`, `packages/shared/src/brief.ts` (Zod), `intake/draft.ts` with `sources` per field (chat/form/template/people/rag) | validated structured brief, per-field source | The `sources` map is a strong signal (chat vs form) but is not recorded as an event or history. |
| Intake chat | `app/lib/intake/live-guide.ts` | returns `costUsd` per turn | Cost per turn is computed and **dropped**: no ledger write, no turn counter, no guardrail-hit record. CFO Inputs B17 (token cost before an unpaid start abandons) and the "intake chat" ESTIMATE in the workbook have no data source. |
| Guest preview spend | `app/lib/intake/preview.ts` | in-process spend counter, with a TODO to use the Supabase `cost_ledger` | Resets on every deploy/restart; not a real cap on Vercel serverless. |
| Analytics events | none | | The only spec is the 13 names in `docs/cmo/ux-spec.md` s12. No code emits them (grep for analytics/track/posthog returns nothing). |
| Attribution | none | | `marketing-plan.md` s8 requires utm and channel stored on user (first touch) and order (last touch). No code reads utm or referrer. |

## 3. What is missing, ranked by damage if absent at launch

| # | Gap | Why it hurts | Fix (ticket) |
|---|---|---|---|
| 1 | **Deletion does not reach analytics, ledger or derived data, and ledger history is destroyed by deletion.** | Legal 02 s7, 06 req 28; and the cost data is the CFO's evidence. | `privacy.delete_subject()` anonymises cost rows instead of deleting them; DATA-007. |
| 2 | **No event stream.** No funnel, no conversion rates, no way to replace the CFO's guessed inputs. | The funnel, mix, repeat, refund and reprint inputs in `Inputs` rows 12-43 are labelled GUESS in `finance/README.md`. | Tracking plan (`01`), SDK, DATA-001/002. |
| 3 | **No attribution.** | CAC by channel is the CMO's day-90 deliverable. | UTM capture, first/last touch, DATA-004. |
| 4 | **QA outcomes, prompt version, served model, fallback and ZDR flag not stored with the generation.** | Cannot compare prompts, models or image sizes; cannot prove "ZDR requested on every photo call" (legal 06 req 8). | Extend ledger, DATA-003/005. |
| 5 | **Human signal not captured as history.** Re-roll reasons, version selection, edits, redos, ratings are overwritten state. | These are the free preference labels for every later improvement. | DATA-006, DATA-010. |
| 6 | **No consent tiers.** Consent boxes A-D exist; nothing separates "use to run my order" from "use to improve" from "use to train". | Without it, nothing collected can ever be used for improvement without a re-consent campaign; with it done wrong, legal exposure. | `privacy.consent_records` boxes E/F (proposed), DATA-008. |
| 7 | **Spend cap not durable.** | An unattended bug can burn the OpenRouter balance (key has about $4). | `analytics.spend_daily` + `spend_ok()`, DATA-009. |
| 8 | **Printer actuals missing.** `adapters/types.ts` has no cost fields. | Print and shipping are the biggest COGS lines (SKU table estimates $12.50 + $5.50 for a 24pp book). | Read cost from Lulu/Prodigi order responses and webhooks, DATA-011. |
| 9 | **No data-quality guardrails.** Nothing stops a developer adding `email` or a story sentence to an event. | One careless event turns analytics into a children's-data store. | Plan validator in CI, DATA-014. |

## 4. Biggest risks

1. **Children's data leaking into analytics or logs.** Names of children are in briefs, chat, `JobInput.characters`, `consent.characterLabels`, story text. Any analytics SDK with autocapture, session replay, or "log the request body" would copy them to a third party. Mitigation: first-party collector with property allowlist, no autocapture, no replay (hard rule in `01`).
2. **Training-use promises that cannot be kept.** The consent text for box B has a deliberately commented-out "we do not train" sentence pending ZDR confirmation (`consent.ts`). Whatever data we keep must be unusable for training by construction (DB constraint `eligible_requires_all_gates` and `c4_never_eligible` in `03-schema.sql`), not by policy alone.
3. **Biometric theory.** Any image analysis on uploads (face count, "is a face present", age estimation, blur-by-face) creates a face-geometry argument under BIPA/CUBI (legal 02 s5). The data plan forbids any image-derived feature of uploads; QA runs only on generated art.
4. **Vendor chain unknowns.** ZDR availability for the Gemini image models is unverified (legal 01 s2, 06 req 8). Until it is, the analytics must not store anything that would make a vendor-side retention issue worse (e.g. do not log `openrouter_generation_id` with user ids beyond the retention window).
5. **Deletion by file deletion.** File stores and JSON-lines ledgers do not delete cleanly from backups and exports. The move to Supabase is the opportunity to make deletion a database function plus crypto-shredding of the identity map.
6. **Metrics theatre.** At about 1,900 orders in year one (workbook Base, $6.5k/month budget) most per-channel and per-template numbers will not be statistically meaningful for months. The plan therefore prioritises instrumentation correctness and cost/quality telemetry (which has thousands of data points per week from day one) over fine-grained funnel analysis.
7. **Unit-economics blind spot.** The workbook shows paid CAC about $76 against about $15 contribution per order. The decision that matters most (how much paid to run) depends on observed CAC and repeat rate, both currently unmeasurable.

## 5. What is already good (keep it)

- `costUsd` from the provider's own `usage.cost` rather than computed prices.
- Idempotent webhook processing (`processedEvents`), explicit order state machine with history (`orderState.ts`): a ready-made fulfilment event source.
- Consent record with wording hash and a `consentId` on every `PhotoRecord`; `consentCovers()` check.
- Server-side-only model calls with spend cap and a job `charge` that is refunded on failure.
- Per-field `source` in the intake draft, `plannedRenders()` (planned cost per brief), and the closed lists in `brief.ts`: perfect enumerated properties for events.

## 6. Where the CFO workbook needs real data (full mapping in `04-kpis-and-dashboards.md`)

| Workbook input (`Inputs` sheet) | Currently | Data source after launch |
|---|---|---|
| B12 visitor -> sign-up (organic) | GUESS 7% | `page_viewed` / `signup_completed` by channel |
| B13 sign-up -> creator start | GUESS 60% | `signup_completed` / `creator_started` |
| B14 start -> purchase | GUESS 25% | `creator_started` / `payment_succeeded` per creation |
| B15 guest preview rate | GUESS 15% | `guest_preview_requested` / visitors |
| B17 token cost before abandoned start | GUESS $0.35 | `ml.generation_attempts` on creations without a purchase |
| B34-B35 re-roll rate | CTO planning figure 20% on 8 pages | `reroll_requested` + `auto_reroll_triggered` per page |
| B32 repeat orders per customer per year | GUESS 0.35 | `reorder_started`, `fact_orders.is_first_order` |
| B36-B37 refund / reprint rates | GUESS 3% / 4% | `refund_issued`, `reprint_created` |
| B9 items per order | GUESS 1.15 | `payment_succeeded.items` |
| SKU table mix | GUESS | `payment_succeeded.skus` |
| SKU table print and shipping cost | ESTIMATE from memory | `order_shipped.print_cost_cents/ship_cost_cents` |
| Model Costs per SKU | MEASURED per call, EXTRAPOLATED per product | `ml.v_generation_cost_by_creation` |
| CMO CSV CPC/CTR/CAC | GUESS | spend import + `attribution_captured` |
| Opex has no analytics line | | see `02-architecture.md` cost table: $0 to $45 per month |

## 7. What I need from other teams

| Team | Need | Why / by when |
|---|---|---|
| **CTO** | (a) Persist ledger to Postgres with extra columns, keep it past deletion (anonymised); (b) emit events from the points in `01` using a thin `track()` wrapper I will supply; (c) persist QA verdicts and page-version history; (d) call `privacy.delete_subject()` from the existing delete flows; (e) a stable `creation_id` and `template_id`; (f) add `prompt_version_id` to each stage; (g) read printer cost from Lulu/Prodigi responses; (h) one `consent_tier` flag on `UserRecord`. | Before launch; see tickets DATA-001..014 in `07`. |
| **CMO** | Stable `template_id`s; channel names exactly as in `channel-assumptions.csv`; UTM naming standard; reason-code chip lists for re-roll and model-sheet feedback (draft in `01`); where the rating UI goes; confirm no tags on creator/proof/cart/account (already in plan); weekly spend export (CSV is fine) so CAC can be computed. | UX hooks before M4 screens freeze; spend export from day 1 of ads. |
| **CFO** | Which workbook inputs to overwrite and how often (proposed monthly refresh from `04` queries); add two opex lines (data tooling $0-45/mo, one-time legal review of data items); agree the definition of "contribution margin per order" (my formula in `04` follows the workbook's Unit Economics sheet); confirm Stripe fee treatment. | Before the day-30 review. |
| **Legal** | Written opinion on the items in `06` section 11, in particular: T0 analytics notice, consent wording for boxes E/F, whether adult consent can cover derived artwork depicting a minor, de-identification standard for scrubbed text, anonymised cost-log retention after deletion, vendor-terms limits on using model outputs to train other models. | T0 items before launch; T1/T2 items before any use. |
| **CX** | Helpdesk choice (ticket bodies are C3 and may hold children's names), contact-reason taxonomy (in `01`), the privacy-request and takedown workflow with SLA (I record only timestamps and codes), post-delivery survey ownership. | Before launch. |
| **Owner** | Supabase Pro, a read-only BI tool decision, budget approvals, decisions listed in the closing summary. | See `07`. |

## 8. Scope boundaries I am holding

- I do not train, fine-tune or distill anything at launch, and I propose no collection that would require it.
- I will not edit `app/`, `pipeline/`, `finance/` or `docs/{cto,cmo,legal}` files. Everything I propose to change in those places is a ticket in `07` with acceptance criteria.
- All SQL and the tracking plan are tested only against an in-process Postgres (PGlite) with synthetic rows; nothing has been applied to a real database.
