# 02. Data architecture

Owner: Head of Data. Date: 2026-10-10. Principle: cheap and boring. One database the CTO already has to run (Supabase Postgres), SQL views, one BI tool, no new vendor that sees user data at launch. Every price below is an ESTIMATE from memory of public price pages and must be verified before purchase; none was checked this session.

## 1. Decision summary

| Layer | At launch (Nov 2026) | Later (trigger) | Not now |
|---|---|---|---|
| Event capture | First-party collector: `POST /api/t` (client) and `track()` helper (server/worker/webhook) writing to `analytics.events` through `analytics.ingest_event()` | Add PostHog Cloud only if the team wants self-serve funnels/retention/feature flags and the DPA is signed (autocapture and replay off) | Segment/RudderStack, Snowplow, Kafka |
| Store | Supabase Postgres, schemas `privacy`, `analytics`, `ml` in the production project, not exposed through the API | Separate Supabase project for `analytics`+`ml` when T1 text exists or events exceed about 20M rows | ClickHouse, Snowflake |
| Warehouse | None. Postgres is the warehouse | BigQuery or MotherDuck via nightly parquet export when a single query regularly exceeds 10 s or the table exceeds about 50M rows | Redshift, Databricks |
| Transforms | SQL views (`analytics.v_*`, `ml.v_*`), `pg_cron` refresh of 3 to 5 materialised views | dbt Core in GitHub Actions once there are about 30 models or a second analyst | dbt Cloud, Airflow |
| Orchestration | `pg_cron` for SQL, Vercel Cron or Supabase scheduled function for HTTP jobs (purge, partitions, reminders) | GitHub Actions schedule for dbt and eval runs | Airflow, Dagster, Prefect |
| Dashboards | Metabase OSS (one small container) on a read-only role, or Looker Studio as the zero-cost fallback | Same | Tableau, Looker |
| Marketing traffic | Own `page_viewed` events; optional cookie-less Plausible or Umami on marketing pages only | Same | GA4 on creator/proof/cart/account |
| Ad conversions | Server-side purchase events only, payload limited by the attorney | Same | Browser pixels on any page that shows photos or children's names |
| Experiments | Deterministic bucketing in code + `ml.experiments` tables | PostHog flags if adopted | Third-party personalisation |
| Model evals | Scripts in the pipeline repo reading a golden set and writing `ml.eval_*` | Scheduled eval in CI | Hosted eval platforms |

## 2. Build-your-own vs PostHog (the real choice)

| Criterion | Own collector + Postgres | PostHog Cloud |
|---|---|---|
| Cost at launch volume (about 100k to 400k events/month) | $0 beyond existing Supabase | free tier then usage-based; ESTIMATE $0 at this volume (verify the free allowance) |
| Time to useful dashboards | 2 to 3 days of SQL | hours for funnels |
| Control of what is stored | Total. Ingest rejects any unknown event or property | Allowlisting is a convention; a developer can send anything; autocapture must be disabled |
| Children's-data exposure | One processor (Supabase), already in the DPA list | New sub-processor holding user-linked events; DPA and deletion API needed (legal 02 s10, s7 step 4) |
| Deletion | `privacy.delete_subject()` in one transaction | API call per person; asynchronous; must be a deletion task |
| Cost/quality joins | Native (same DB as `ml.generation_attempts`, orders) | Needs export or warehouse sync |
| Lock-in | None | Moderate |
| Risk | We build funnels ourselves | Vendor config mistakes |

**Recommendation:** build-your-own for the system of record. The thing GreetHub needs most (cost, quality, outcome joins on one key with deletion that works) is exactly what a SaaS analytics tool is worst at. Revisit PostHog at month 4 to 6 when the question becomes "which UI change moved conversion" rather than "is the pipeline healthy". If adopted: server-side ingestion of an allowlisted subset only, `person_profiles: identified_only`, no autocapture, no session replay, no feature-flag payloads containing content, delete-person API wired into `privacy.deletion_tasks`.

## 3. Flow

```
 Browser ──(allowlisted batch, only if analytics allowed)──► /api/t ─┐
 Next.js routes (brief, consent, cart, proof...) ── track() ─────────┤
 Worker (jobs, ledger, QA) ── track() / PgLedger ────────────────────┼─► analytics.ingest_event()
 Stripe / Lulu / Prodigi / Resend webhooks ── track() ───────────────┘        │ validates name, tier, tombstones
                                                                               ▼
                         analytics.events (monthly partitions)    ml.generation_attempts   ml.qa_results
                         analytics.sessions   fact_orders/items/creations   ml.user_feedback/edits/outcomes
                                                                               │
                                        pg_cron: refresh views, partitions, purge_expired(), spend rollups
                                                                               ▼
                                   Metabase (read-only role) ◄── analytics.v_* / ml.v_* ── CSV ad spend import
```

Rules:
1. **Never block a user action on analytics.** `track()` is fire-and-forget with a bounded in-memory queue and a local `events.jsonl` spill file (also the dev/fake-mode sink with the identical envelope). Failure increments a counter surfaced in `retention_job_run`/health.
2. **The ledger is not an event.** `ml.generation_attempts` is written synchronously by a `PgLedger` that implements the existing `CostLedger` interface (`pipeline/src/ledger.ts`), buffering writes, because cost and spend caps depend on it. A `generation_attempted` event is derived from it for funnel joins.
3. **Server-side identity only.** The collector resolves `subject_id` from the Supabase session; the browser never learns it and never sends one.
4. **Idempotency.** `event_id` plus `on conflict do nothing`. Webhook events derive the id from the vendor event id so retries are harmless.
5. **Environment parity.** Dev and the Playwright run use the same code writing to PGlite or a throwaway schema; the plan validator runs in CI (DATA-014).

## 4. Postgres layout (details in `03-schema.sql`)

| Schema | Purpose | Who can read |
|---|---|---|
| `privacy` | identity map (`subjects`, `anonymous_links`), consent ledger, consent state, legal sign-offs, deletion requests/tasks/tombstones/log | `privacy_admin`, service role |
| `analytics` | `events` (monthly partitions), `sessions`, `fact_orders`, `fact_order_items`, `fact_creations`, `spend_daily`, `ad_spend_daily`, definitions | `analyst_ro` (views and facts), `analytics_writer` |
| `ml` | `generation_attempts`, `qa_results`, `user_feedback`, `edits`, `preference_pairs`, `outcomes`, `text_samples`, golden-set and eval tables, experiments, `training_candidates` registry, datasets, model registry | `ml_ro` (not `text_samples`), `analytics_writer` |

Security: schemas are not in the PostgREST exposed list; RLS enabled on every table with no permissive policies; only roles that bypass RLS (service role, owner) and explicit grants can read. Metabase connects as `analyst_ro` through the pooler with SSL; it gets facts and views, never `privacy.*`, `ml.text_samples` or `ml.training_candidates`.

Sizing (Base scenario, about 1,900 orders in year 1, 10k visits/month): about 15 to 30 events per visit-with-creator, about 60 generation/QA rows per book. Expect 100k to 400k events and 10k to 60k generation rows per month: 100 to 400 MB per month at 1 KB/row. The 8 GB included with Supabase Pro covers the first year with indexes. Monthly partitions plus the 13-month retention keep the table bounded.

## 5. Transform plan

Launch: plain views and three materialised views refreshed hourly by `pg_cron`.

| Model | Grain | Used by |
|---|---|---|
| `analytics.v_funnel_daily` (in schema) | day | funnel dashboard |
| `analytics.mv_creation_funnel` | creation | step times, drop-off, cost-to-abandon |
| `analytics.mv_channel_economics` | day x channel | CAC, payback; joins `ad_spend_daily`, `fact_orders` |
| `ml.v_generation_cost_by_creation` (in schema) | creation | cost per SKU vs CFO workbook |
| `ml.v_qa_first_pass_rate` (in schema) | week x model x prompt version | quality dashboard |
| `ml.mv_outcome_features` | creation | approval/reroll/refund labels for later scorer work |

Later (dbt Core): staging models over raw tables, marts `fct_creations`, `fct_orders`, `fct_generations`, `dim_template`, `dim_style`; tests (unique `event_id`, accepted values for enums from `tracking-plan.json`, not-null `subject_id` on facts, freshness) run nightly in GitHub Actions.

## 6. Dashboards and BI

Metabase OSS in a Docker container on a small always-on host (Fly.io, Render or a $5 to $10 VPS), SSO restricted to the owner and team, connected as `analyst_ro` to views. Alternative with no hosting: Looker Studio with the Postgres connector over the same views. Dashboards are defined in `04-kpis-and-dashboards.md` with exact SQL logic; the Metabase questions are exported to a JSON file in the repo each time they change (ticket DATA-013).

## 7. Cost for the CFO (all ESTIMATE, verify; none of these is in the workbook `Opex` sheet today)

| Item | Launch to month 6 | Months 7 to 18 | Notes |
|---|---|---|---|
| Supabase storage/compute for analytics | $0 (inside the existing "Supabase (Pro + compute)" line, $35 in `Inputs`) | $0 to $25 extra if compute is upsized | Pro includes 8 GB; analytics adds about 1 GB in year 1 |
| Metabase OSS host | $5 to $10 /mo | $5 to $10 /mo | or $0 with Looker Studio |
| Plausible/Umami (optional marketing-page traffic) | $0 to $9 /mo | $0 to $9 /mo | skip if own `page_viewed` is enough |
| PostHog | $0 (not used) | $0 to $50 /mo if adopted | usage-based; decide at month 4 to 6 |
| Warehouse (BigQuery/MotherDuck) | $0 (not used) | $0 to $20 /mo if triggered | free tiers likely cover the volume |
| dbt Core + GitHub Actions | $0 | $0 | free minutes are ample |
| Supabase PITR add-on | $0 (not bought) | about $100 /mo if a restore window under a day is wanted | conflicts with short deletion windows; see governance |
| Eval runs (OpenRouter) | $15 to $20 per golden-set run (see `05`) | $20 to $60 /mo | golden set of 40 cards and 8 books at 2K |
| **Total recurring incremental** | **$5 to $20 /mo** | **$5 to $100 /mo** | against $75 /mo "OpenRouter base" already in Opex |
| One-time | Attorney time for data items in the same engagement as the $4,000 legal/COPPA line; no estimate here | | |

Suggested workbook change (CFO to decide): add an `Opex` line "Data tooling" with $10 fixed and $0 variable for months 1 to 6, and an `Inputs` row "Eval spend per month" under model costs.

## 8. What to defer (and why)

| Deferred | Reason | Trigger to revisit |
|---|---|---|
| Warehouse, dbt, Airflow | volume far below Postgres limits | table above 50M rows or p95 dashboard query above 10 s |
| PostHog / session replay / heatmaps | replay is prohibited on creator/proof pages; funnels are covered by SQL | month 4 to 6 and a signed DPA; replay stays off |
| Customer-facing recommendations | needs hundreds of orders per template | 2,000+ completed creations |
| Demand forecasting models | 36-month workbook is enough until 12+ months of history | month 12 (seasonality needs a full cycle) |
| Reverse ETL, CDP | no marketing automation need | after email programme exists |
| Feature store | no model in production | after the first scorer ships |
| Real-time dashboards | daily is fine | never at this scale |
| Separate analytics database | extra cost, extra backup policy | first T1 text sample, or 20M events |

## 9. Failure modes and guards

| Risk | Guard |
|---|---|
| Analytics write fails and loses events | spill file + replay; count of dropped events on the health dashboard; acceptable loss under 0.5% for client events, 0% for commerce/ledger |
| Developer adds a PII property | CI validator (name deny-list) + ingest rejects undefined properties in strict mode after week 2 |
| Backup restore resurrects deleted people | `privacy.replay_tombstones()` runs after every restore (runbook in governance) |
| Spend runaway | `analytics.spend_daily` + `spend_ok()` checked before each call; `spend_cap_hit` alerts |
| Metabase user exports raw rows | `analyst_ro` has no access to text or candidate tables; rows are pseudonymous; export logged by Metabase audit |
| Table bloat | monthly partitions, 13-month retention in `purge_expired()`, partition creation job |

## 10. Things only the owner can do

Create the Supabase Pro project (Checklist Part 4) and approve the extra roles; decide the BI host and pay for it; sign the DPAs; decide on PostHog later. Everything else in this document is buildable by me once the repo access rule allows changes outside `docs/data/` (see `07`).
