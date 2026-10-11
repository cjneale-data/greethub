# 07. Implementation backlog

Owner: Head of Data. Date: 2026-10-10. Tickets for the CTO (and others where marked). Effort: **S** = up to 1 day, **M** = 2 to 3 days, **L** = 4 to 8 days, one engineer, including tests. "Data" means I can deliver it (see section 4); "CTO" means it touches app routes, workers, webhooks or deployment owned by engineering.

Ground rules for every ticket: no photo, face, name, address, email or free text in any event, log or ml table; every new table in `analytics`/`ml` has `subject_id` (or is listed in `privacy.non_subject_tables`); a test uses synthetic data only; the tracking-plan validator passes in CI (DATA-014).

## 1. Must-have before launch

Launch minimum cut (if time forces a choice): DATA-001, 002 (server side only), 003, 006, 007, 008, 009, 011, 014, 016. Everything else in this section should follow within two weeks of launch at the latest.

### DATA-001 Apply the analytics/ml/privacy schema (M, Data writes SQL, CTO applies)
- **Do:** turn `03-schema.sql` plus `03b-seed-event-definitions.sql` into Supabase migrations; create roles; schedule `pg_cron`: `analytics.ensure_event_partitions(3)` weekly, `privacy.purge_expired()` nightly.
- **Accept:**
  - Migrations apply on a clean database and re-apply without error.
  - `privacy`, `analytics`, `ml` are not in the API-exposed schemas; RLS is on for every table.
  - Test: `analyst_ro` cannot `select` from `privacy.*`, `ml.text_samples` or `ml.training_candidates`.
  - Test: inserting an `analytics.events` row with sensitivity C2 fails.
  - Test: `update ml.training_candidates set status='eligible'` fails for a likeness row (constraint).
  - `node docs/data/tools/test-schema.mjs` (PGlite, 23 checks, already passing on the draft) passes in CI.
- **Depends on:** Supabase project (owner, checklist Part 4).

### DATA-002 Event SDK and collector (M, Data writes, CTO reviews and wires)
- **Do:** `track(name, props, ctx)` for server/worker/webhook; `POST /api/t` batch endpoint for the ~15 client events; a 10-line browser helper with no autocapture.
- **Accept:**
  - Validates names and properties against `tracking-plan.json` (types, enums, required); unknown event/property is rejected in dev and logged-and-dropped in prod.
  - Fire-and-forget with a bounded queue and spill file `events.jsonl`; a thrown error never reaches the request.
  - Calls `analytics.ingest_event` (dedupe by `event_id`).
  - Client path is a no-op without `gh_aid` consent state; GPC treated as reject for marketing.
  - Unit tests cover: invalid property, oversize payload, dedupe, consent off, DB down.
- **Depends on:** DATA-001, DATA-003.

### DATA-003 Identity and stitching (M, CTO)
- **Do:** create `privacy.subjects` row for every Supabase user (anonymous included) on first server contact; set `gh_aid` cookie only when analytics is allowed; call `privacy.link_anonymous` at guest sign-in/signup/login; call `privacy.merge_subjects` when a guest logs into an existing account; mark `is_guest=false` on upgrade.
- **Accept:**
  - Test: anonymous page views are back-filled with `subject_id` after signup.
  - Test: merge retargets events, facts, ml rows, links.
  - No auth uid, email or name appears in any analytics column.
  - Subject deletion test in DATA-007 passes using these helpers.

### DATA-004 Attribution capture and spend import (S to M, CTO + CMO input, Data writes importer)
- **Do:** capture the UTM allowlist, `channel` (derived by the CSV channel names) and referrer host on first request; `attribution_captured`; store first-touch on subject at signup, last-touch on the checkout/order; weekly CSV import script for `analytics.ad_spend_daily`.
- **Accept:**
  - Order has `channel_first_touch` and `channel_last_touch`; `payment_succeeded` carries them.
  - Click ids (fbclid, gclid) are not stored.
  - Importer rejects unknown channels; a sample CSV from the CMO loads.
  - D3 CAC tile reproduces the CSV's CAC formula on a fixture.

### DATA-005 Prompt version registry (S to M, CTO)
- **Do:** give each prompt template/guard-line set in `pipeline/src/stages/*` and `app/lib/intake/live-guide.ts` an id `stage@YYYY-MM-DD.n`; register on boot in `ml.prompt_versions` (template hash + git commit).
- **Accept:**
  - Every ledger row has a non-null `prompt_version_id`.
  - Changing one character in a template changes its hash and fails a test that pins ids to hashes unless the id is bumped.
  - No rendered prompt (with names) is stored.

### DATA-006 PgLedger: ledger into Postgres with the extra columns (L, Data writes, CTO integrates)
- **Do:** implement `CostLedger` writing to `ml.generation_attempts`; add to `LedgerEntry`: `jobId`, `creationId`, `subjectId`, `purpose`, `modelServed`, `fallbackUsed`, `zdrRequested`, `promptVersionId`, `promptSha256`, `params`, `nInputImages`, `outputIsLikeness`, `mock`; replace `FileLedger` in `app/lib/book/engine/live.ts` and `app/lib/intake/pipeline-runner.mjs`; log intake chat turns (cost currently dropped in `live-guide.ts`) and guest previews; emit `generation_attempted` events from the ledger.
- **Accept:**
  - Sum of ledger `cost_usd` per job equals `Job.costUsd`; per project equals `BookProject.costUsd` (test).
  - Existing 24 pipeline tests still pass; a JSONL-to-Postgres parity test over `pipeline/measurements/*.jsonl` reproduces `finance/measured_costs.json` per-call averages.
  - `zdr_requested` is recorded true for every call that carries a photo (and a test fails otherwise).
  - Mock runs write rows with `mock = true`, excluded from dashboards.
  - Ledger writes never throw into the pipeline (buffered, retried), except the spend-cap check.

### DATA-007 Deletion propagation (L, CTO with Data)
- **Do:** call `privacy.delete_subject()` from `deleteUserBookData`, account deletion and consent withdrawal; stop deleting cost history with the work dir (ledger rows are anonymised, not removed); implement the task runner for `storage`, `resend`, `stripe`, `lulu_prodigi`, `posthog_or_other_tool` (stubs until vendors exist) writing results to `privacy.deletion_tasks`; extend `exportUserData` to include analytics/ml rows by `subject_id`; send the confirmation email.
- **Accept:**
  - Synthetic-user test: create events, ledger, feedback, a training-candidate row, a dataset member; delete; assert zero rows by `subject_id` in every analytics/ml table, ledger rows anonymised (cost kept), dataset `needs_rebuild = true`, tombstone present, `deletion_log` row without a subject id.
  - Open-order case keeps order facts per policy and scrubs address when the order closes.
  - `privacy.replay_tombstones()` after a simulated restore removes a resurrected subject.
  - Deletion request visible on D10 with task states; due date 30 days.
- **Depends on:** DATA-001, DATA-003, legal items 11.A.3 to 11.A.5 for final wording.

### DATA-008 Consent model: tiers and ledger (M, CTO; wording by attorney)
- **Do:** move the consent record to `privacy.consent_records` (5-year retention, `purge_after`); add columns E and F and `consent_state.tier`; keep UI for E hidden until wording is approved and F hidden until a `legal_signoffs` row exists; policy acceptance stored; consent re-prompt on wording change as today.
- **Accept:**
  - Every `PhotoRecord.consentId` joins to a valid, current-wording, non-withdrawn record (P3 = 100%, test).
  - `consent_state` cannot be set to T2 without `consent_id` (constraint).
  - Events `consent_recorded`, `consent_changed`, `policy_accepted` emitted.
  - Withdrawal of box A/B stops processing and creates deletion tasks.
- **Depends on:** legal wording (11.B, 11.C) for E/F only; A to D already exist.

### DATA-009 Durable spend cap (S, CTO)
- **Do:** write every ledger cost into `analytics.spend_daily` (purpose, UTC day); replace the in-process counter in `app/lib/intake/preview.ts` and the per-job caps with `analytics.spend_ok(cap)`; emit `spend_cap_hit`.
- **Accept:** cap holds across restarts and instances (test with two processes); alert at 70% and 100%; guest preview returns the friendly message when blocked.

### DATA-010 Persist quality signals as history (M to L, CTO)
- **Do:** write `ml.qa_results` for each QA evaluation (local border, vision count/text) with evaluator versions; record each page version as an attempt id (not only `qaNote` on failure, `live.ts:137`); record user actions as events and `ml.user_feedback`/`ml.edits`; derive `ml.preference_pairs`; keep sheet and page version history instead of overwriting.
- **Accept:**
  - First-attempt QA pass rate query (Q1) returns the same number as a manual count on a fixture run.
  - Re-roll with reason codes produces `reroll_requested` and a feedback row; choosing an earlier version produces `page_version_selected` and a pair.
  - Edit events carry lengths and edit distance, never text.

### DATA-011 Commerce and fulfilment facts and events (L, CTO)
- **Do:** emit `payment_succeeded`, `payment_failed`, `order_created`, `refund_issued`, `dispute_opened`, `fulfillment_*`, `order_shipped`, `order_delivered`, `reprint_created` from the Stripe and printer webhooks (idempotent); populate `analytics.fact_orders`, `fact_order_items`, `fact_creations`; capture printer print/ship cost from Lulu/Prodigi responses (adapter types have no cost fields today) and Stripe fee from the balance transaction.
- **Accept:**
  - Webhook replay yields no duplicates.
  - Order totals reconcile: items + postage + method + tax = total (test).
  - `order_shipped` has `print_cost_cents`/`ship_cost_cents` in sandbox runs.
  - `is_first_order` and channels set; D7 shows measured vs workbook rows.

### DATA-012 Views and dashboards v0 (M, Data; hosting by owner)
- **Do:** `mv_creation_funnel`, `mv_channel_economics`, `mv_outcome_features`, `v_funnel_by_channel`; deploy Metabase OSS with `analyst_ro` (or Looker Studio); build D1, D2, D4, D5, D6, D7, D8, D10 per `04`; export Metabase questions to the repo.
- **Accept:** every tile has the exact definition from `04` in its description; all dashboards exclude `mock`; D7 lists each workbook row with n and interval; D10 shows consent coverage 100% and zero overdue photos on test data.
- **Depends on:** DATA-001, 006, 011; owner BI host decision.

### DATA-013 Alerts and data-quality checks (S to M, Data + CTO)
- **Do:** implement alerts and checks from `04` sections 8 and 9 (spend, failure spike, QA collapse, purge overdue, consent gap, deletion due, event integrity, payment mismatch).
- **Accept:** each alert fires on a synthetic condition in a test; Slack/email target set by owner.

### DATA-014 CI guards (S, Data)
- **Do:** CI job runs `node docs/data/tools/build-tracking-plan.mjs` (fails on PII-named property, unknown KPI, missing owner/retention, uncovered UX events), schema lint (analytics/ml tables without `subject_id` not listed in `non_subject_tables`), PGlite migration test, forbidden-pattern grep for `console.log(` of prompts/bodies in `pipeline/` and `app/lib/`.
- **Accept:** a deliberately bad event (property `email`) fails the build.

### DATA-015 Retention and purge on Supabase (M, CTO)
- **Do:** rebuild `purgeExpiredPhotos`/`photosExpiringSoon` on Supabase Storage and tables (daily); guest expiry 7 days; 14-day reminder email; drafts/art 12 months; Saved Person 24-month inactivity with 30-day notice; emit `photo_purge_run`, `photo_deleted`, `email_sent`.
- **Accept:** time-travel test (inject `now`) deletes at 90 days, never earlier, never later than 120; Saved Person exempt; overdue count shown on D10; CDN/thumbnail copies verified deleted.

### DATA-016 Logging hygiene (S, CTO)
- **Do:** audit app and worker logs for prompts, chat text, names, signed URLs; Sentry `beforeSend` scrubbing; set platform log retention to 30 days; keep OpenRouter prompt logging off.
- **Accept:** grep-based test over log call sites; a canary string with a fake child name posted through chat and brief never appears in logs, events or Sentry in an integration test.

### DATA-017 UX hooks for feedback and templates (M, CMO + CTO)
- **Do:** thumbs/stars on sheet, pages, story and proof; reason chips on re-roll and sheet redo (lists in `01`); stable `template_id`; post-delivery survey (email link) with NPS and reason codes.
- **Accept:** each control emits its event with reason codes only; no free-text box value is sent to analytics; copy reviewed by CMO.

### DATA-018 Consent banner and GPC gating (M, CTO + CMO)
- **Do:** banner on marketing pages with equal-weight Accept/Reject (06 req 43); GPC read; no third-party tag before choice; none ever on creator/proof/cart/checkout/account.
- **Accept:** Playwright test asserts zero third-party requests on those pages; `consent_banner_decided` emitted.

### DATA-019 Backup and restore drill (S, CTO + owner)
- **Do:** confirm backup window on the chosen Supabase plan, restore into a scratch project, run `privacy.replay_tombstones()`, record the window for the Privacy Policy.
- **Accept:** written note with window N days and a successful drill.

### DATA-020 ZDR and vendor evidence capture (S, CTO + owner)
- **Do:** query `https://openrouter.ai/api/v1/endpoints/zdr`, test image calls with `provider: { zdr: true }`, record result; ask OpenRouter for the route/tier and DPA in writing.
- **Accept:** result stored under `docs/legal/` or `docs/data/evidence/` with the date; ledger shows `zdr_requested = true` on photo calls; if no ZDR route exists, escalate to owner before any real child's photo.

## 2. After launch

| ID | Title | Owner | Effort | When / trigger |
|---|---|---|---|---|
| DATA-101 | Golden set v1 (40 cards, 8 books, synthetic/released) and eval harness writing `ml.eval_*` | Data | L | weeks 1 to 4 |
| DATA-102 | Human labelling CLI for golden pages; judge calibration report (kappa) | Data | M | weeks 4 to 8 |
| DATA-103 | Experiment framework: deterministic bucketing, `ml.experiments` ops, analysis script with intervals | Data | M | week 8 |
| DATA-104 | Tabular re-roll predictor on C0/C1 features | Data | M | about 5,000 pages |
| DATA-105 | CFO workbook refresh export: CSV of measured values in workbook import order, monthly | Data | S | day 30 |
| DATA-106 | Preference-pair analysis by prompt/model/size | Data | M | month 3 |
| DATA-107 | dbt Core project over the same tables; tests from tracking plan enums | Data | M | about 30 models |
| DATA-108 | Template/style recommender (shrinkage + bandit) | Data + CMO | L | about 2,000 completed creations; attorney ADMT answer |
| DATA-109 | T1 text-sample pipeline: scrubber, PII scan, logged export job | Data | L | only after attorney clears box E |
| DATA-110 | Demand forecast v1 and workbook seasonality update | Data + CFO | M | month 12 |
| DATA-111 | Warehouse export to BigQuery/MotherDuck with tombstone replay | Data | M | volume trigger in `02` |
| DATA-112 | PostHog evaluation (server-only, allowlisted) | Data | S | month 4 to 6 |
| DATA-113 | Access review and incident tabletop | Data + CTO | S, quarterly | from month 3 |
| DATA-114 | Reminder lifecycle analytics (opt-in, recipient dates) | CMO + Data | M | when reminders ship; attorney item 11.A.11 |
| DATA-115 | T2 gating UI and registry jobs | CTO + Data | M | only if owner opens T2 after legal sign-off; recommended not before month 12 |
| DATA-116 | Printer file-validation and reject analysis | Data + CTO | S | month 2 |
| DATA-117 | Lifetime value cohorts and payback charts | Data + CFO | M | month 6 |

## 3. Sizing

| Block | Tickets | Effort (person-days, one engineer) |
|---|---|---|
| Schema, identity, SDK | 001, 002, 003, 004 | about 9 to 11 |
| Ledger and quality history | 005, 006, 009, 010 | about 12 to 16 |
| Commerce and fulfilment | 011 | about 5 to 7 |
| Privacy | 007, 008, 015, 016, 019, 020 | about 12 to 15 |
| Dashboards and guards | 012, 013, 014, 018 | about 7 to 9 |
| UX hooks | 017 | about 2 to 3 |
| **Total** | 20 tickets | **about 47 to 61 person-days**, roughly 28 to 38 if I write the SQL, SDK, PgLedger, views, importers and validators and the CTO only integrates and reviews |

Order of work: 001, 003, 014 -> 002, 006, 005, 009 -> 011, 010 -> 007, 008, 015 -> 012, 013, 016, 017, 018, 019, 020.

## 4. What I can build myself, and what is owner-only

| I can build (Data) | Constraint |
|---|---|
| SQL migrations (`03-schema.sql`, views, functions, cron definitions), PGlite tests | Already drafted; applying them needs the Supabase project (owner) |
| Tracking-plan validator, JSON plan, seed SQL generator, inventory generator | Done in `docs/data/tools/` |
| Event SDK (`track()`, collector route, browser helper), `PgLedger`, importer for ad spend, retention and deletion SQL, Metabase question exports, dbt models, eval harness and golden-set generator, scrubber, forecast scripts, workbook refresh script | These touch `app/` and `pipeline/`. I was told not to change app code outside `docs/data/` unless the owner says so. Until then I deliver them as reviewed patch files under `docs/data/patches/` or ask the owner for explicit permission per ticket |
| Analysis: weekly reports, variance tables, experiment readouts | Read-only DB access via `analyst_ro` |

| CTO-only | Why |
|---|---|
| Wiring `track()` into routes, workers and webhooks; deploying migrations; storage purge; hosted queue | owns runtime and deployment |

| Owner-only | Why |
|---|---|
| Accounts: Supabase Pro project, BI host, helpdesk, Sentry, (later) PostHog; domain and DNS | identity, payment card |
| Budget: tooling lines ($5 to $20 per month at launch), eval spend, legal fees for the data items | money |
| Attorney engagement and written opinions; signing DPAs; vendor emails (OpenRouter ZDR/DPA, Lulu, Prodigi) | legal identity and signatures |
| Decisions: box E at launch or not; whether T2 ever opens; Illinois; retention values; backup window; analytics banner stance | business and legal risk |
| Releases for golden-set volunteers and the Eye Story family; physical proofs | real-world consent |
| Opening any production data access for me (read-only roles) | credentials |

## 5. Definition of done for "everything is tracked at launch"

1. A synthetic end-to-end run (guest -> signup -> book -> order -> fulfilment -> delivered -> delete) produces the full event sequence, ledger rows, facts and a clean deletion with zero residue; D1 to D10 render on it.
2. Cost per creation computed from the database equals `Job.costUsd` and the CTO's `measured_costs.json` method.
3. Consent coverage 100%, overdue photos 0, validator green, no PII in events, logs or Sentry canary test.
4. The CFO receives the D7 table with every workbook input listed as "no data yet" or measured with n.
