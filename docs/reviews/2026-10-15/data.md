# Data review, committee 2026-10-15 (Head of Data)

Read: docs/PLAN.md (B8, B14.6), docs/data/ (all), pipeline/src/ledger.ts, app code by search. Not run: `docs/data/tools/test-schema.mjs` fails here because `@electric-sql/pglite` is not installed (module not found), so I cannot claim the 23 schema checks pass today. They passed on the draft per 07-implementation-backlog.md.

## 1. Done vs plan (B8: collector, funnel/payment/consent/proof/survey events, UTM capture, internal page; accept = D1/D6/D10 compute from preview data, no third-party scripts on creator/proof/cart)
- Done, in docs only: tracking-plan.json (95 events, each with owner, sensitivity class, retention_days, KPI links), 01-tracking-plan.md, 03-schema.sql (analytics/ml/privacy), 03b seed SQL, data-inventory.json, KPI and dashboard definitions (04), governance (06), photo-events-tracking.md (B14.6 events), validators and generators in docs/data/tools/.
- Not done: DATA-001 to DATA-020 are all unbuilt in the app. B8 acceptance is not met: no collector, no tables, no internal page, so no KPI computes from preview data.
- Gap in my own delivery: 07 says Data would hand over SDK, PgLedger and importer as patches in docs/data/patches/. That folder does not exist. Nothing was handed to the CTO.

## 2. Measurement in code vs only in docs
In code:
- pipeline/src/ledger.ts: `FileLedger`, `MemoryLedger`, `assertUnderCap`. Local file only, no job, creation, subject, prompt-version or ZDR columns (DATA-006), not Postgres.
- app/lib/safety/events.ts: four IP-safety events shaped per the plan, written to a JSONL file or memory. Not the collector.
- app/lib/social.ts: builds tracked links (utm_*, ref) only; reads and stores nothing.
- app/components/shop/CookieNotice.tsx: equal-weight accept/reject, GPC read as reject. Loads no tags today, so both choices do nothing yet.
- Supabase migrations (20261013 to 20261015): core_documents, writing_profiles, memberships. No analytics, ml or privacy schema, no consent table, no ledger table.
Only in docs: everything else, including identity stitching, attribution capture, order/payment facts, consent ledger, deletion propagation, durable spend cap, dashboards, alerts, CI guard (DATA-014).

## 3. Minimum set to judge the soft launch (Phase 1 photo cards gate: 20+ orders; proof-to-order >= 40%, reprint/complaint <= 3%, contribution >= 25% at real print cost, 0 privacy or IP incidents)
Build in this order (small, server-side first; matches the 07 minimum cut):
1. DATA-001 migrations applied (events, fact_orders, consent_records, ledger) and DATA-014 CI validator.
2. DATA-002 server-side `track()` plus `POST /api/t` for few client events. No autocapture.
3. DATA-003 anonymous-to-account stitching.
4. Events: page_viewed (entrance only is enough), creator_started, proof_viewed, proof_approved, add_to_cart, checkout_started, payment_succeeded/failed, order_created, order_shipped (with print_cost_cents, ship_cost_cents), order_delivered, reprint_created, refund_issued, dpi_warning_shown, consent_recorded, policy_accepted, ip_* four.
5. DATA-011 order facts with real printer cost and Stripe fee; this is what makes "contribution at real print cost" computable.
6. DATA-006 ledger in Postgres (cost per creation) and DATA-009 durable spend cap.
7. D1, D6, D10 plus D7 (measured vs CFO workbook with n). A SQL view and one internal page is enough; no Metabase.
Skip until after the gate: surveys/NPS UI, preference pairs, experiments, PostHog, warehouse.
Honest limit: 20 orders gives wide intervals. D7 must print n and the interval, and we should not read rate differences under about 15 points as signal.

## 4. Marketing email and social without third-party scripts
- Links: app/lib/social.ts already builds `utm_source/medium/campaign/content` and `ref`. Rule: lower-case, allowlist of keys, codes match `CODE_PATTERN`, never a child's name.
- Capture: first request on a marketing page, server side (middleware or the page route) reads the allowlisted utm_* keys and the referrer host only, strips the rest of the query (fbclid, gclid never stored), derives `channel` using the CMO CSV channel names, and emits `attribution_captured`. First touch is stored on the subject at signup; last touch is stored on the order. `payment_succeeded` carries both (DATA-004).
- Without consent: no `gh_aid` cookie. Server-side counts of entrance by channel are aggregate and cookieless (no id); stitched journeys need analytics consent. GPC counts as reject for marketing.
- Email: Resend sends are server events (`email_sent`); click attribution is the UTM on the landing request, not a tracking pixel or link wrapper. Do not enable Resend open or click tracking (it adds a pixel and redirect domain): open rate is then unmeasured, which is fine. Marketing email needs its own consent record; the plan defers it to after Valentine's 2027. Transactional email carries no marketing UTMs.
- Social: platform dashboards (Pinterest, Instagram, TikTok) are the only impression source; we reconcile weekly through the CSV into `analytics.ad_spend_daily` (DATA-004). Dark social and creator codes without a promo code will be undercounted; a post-purchase "how did you hear" chip (reason code, no free text) covers the gap. Commission payout needs stored attribution plus a code, not built.
- No third-party tag ever on creator, proof, cart, checkout or account; Playwright test asserts zero third-party requests (DATA-018).

## 5. Owner actions
1. Decide and confirm the Supabase project (Pro) so migrations can apply; allow me to open a read-only `analyst_ro`.
2. Approve the cut in section 3 and say whether I may write app code (SDK, collector, PgLedger) as patches or directly; today I am limited to docs/data/.
3. Confirm the analytics banner stance (server-only first-party; no third-party tags) and whether marketing email consent waits for 2027.
4. Attorney answers on guest-data tiers and ADMT before any training-use or lookalike work; no training on photos of minors or faces is planned.
5. Hosting choice for the internal KPI page (PLAN item 10 says internal page, no Metabase).
6. Ask OpenRouter in writing for ZDR route and DPA (DATA-020) before any real child photo.

## 6. Left undone
Installing pglite and re-running the 23 checks; patches folder; CFO input refresh (no real numbers exist yet, so D7 would be all "no data yet").
