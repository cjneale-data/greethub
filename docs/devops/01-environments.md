# Environments and env var matrix

Written 2026-10-12 by DevOps from the code (`process.env` reads in `app/lib`, `app/app`), not from `.env.example`.
Values never go in this file, in chat or in commits. Names only.

## The three environments

| | Development | Preview | Production |
|---|---|---|---|
| Where | `localhost:3000` (`npm run dev` in `app/`) | Vercel deployment for every pushed branch or PR | Vercel deployment of `master`, on the custom domain |
| `VERCEL_ENV` | unset | `preview` | `production` |
| `NODE_ENV` | `development` | `production` | `production` |
| AI | `GREETHUB_MOCK_AI=1` (default) | mock, unless a capped preview key is set | live key with a credit limit |
| Stripe / printers | fake adapters | test keys, sandboxes | live keys (only after owner go-live) |
| Data today | `app/.data/` on disk | `/tmp` per instance: **lost between requests** | same: **not usable until Supabase (SEC-18)** |
| Cron | none | none (Vercel runs crons on production only) | `app/vercel.json` purge, daily 08:17 UTC |
| Protection | n/a | Vercel Deployment Protection on (owner setting) | public |

Rule: production and preview each get their **own** OpenRouter key, Stripe mode and webhook secret (docs/security/01). A preview key must have a small credit limit.

## Build gate

`app/vercel.json` runs `scripts/check-env.mjs` before `next build`. It prints names and pass/fail only.
- Production: a missing or short `SESSION_SECRET` **fails the build**, so the last good deployment keeps serving instead of a deploy where nobody can sign in.
- Preview and production: warnings for missing `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `GREETHUB_ADMIN_TOKEN`, Stripe keys, and for `GREETHUB_ALLOW_FAKE` / `GREETHUB_ALLOW_DEV_SIGNIN` being on. Read them in the Vercel build log.

## Matrix

S = secret (mark "Sensitive" in Vercel). Req = needed for that environment to work as intended. "-" = leave unset.

| Variable | S | Dev | Preview | Prod | Notes |
|---|---|---|---|---|---|
| `SESSION_SECRET` | S | optional | **Req** | **Req, build fails without** | 32+ chars, different per env. Without it sign-in fails closed (`app/lib/shop/session.ts`). |
| `NEXT_PUBLIC_SITE_URL` | | optional | Req | Req | Preview: leave unset only if links may use the request host. |
| `CRON_SECRET` | S | - | - | **Req** | Vercel Cron sends it as `Authorization: Bearer`. Without it the purge returns 403. |
| `GREETHUB_CRON_SECRET` | S | - | - | optional | For a non-Vercel scheduler (`POST`, `x-cron-secret`). |
| `GREETHUB_ADMIN_TOKEN` | S | optional | Req if reports page is used | Req | Takedown reports page and admin API. |
| `OPENROUTER_API_KEY` | S | optional | capped key or unset | Req | Server only. Per-env key with credit limit (SEC-05). |
| `GREETHUB_MOCK_AI` | | `1` | `1` until a capped key exists | unset | On in prod skips real photo moderation. |
| `GENERATION_DAILY_SPEND_CAP_USD`, `GREETHUB_BOOK_SPEND_CAP_USD` | | optional | Req with live AI | Req | Defaults: $25/day guest cap in code. Per-instance until SEC-10. |
| `GREETHUB_MODERATION_MODEL`, `GREETHUB_BOOK_IMAGE_SIZE`, `GREETHUB_BOOK_MAX_SPREADS` | | optional | optional | optional | Tuning; defaults in code. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | S | - | test | live (at go-live) | Webhook secret is per endpoint, so per env. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | | - | test | live | |
| `STRIPE_AUTOMATIC_TAX` | | - | `1` | `1` | |
| `RESEND_API_KEY`, `EMAIL_FROM`, `REPORT_INBOX_EMAIL` | S (key) | - | test sender | verified domain | |
| `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_API_BASE` | S | - | sandbox | live | |
| `PRODIGI_API_KEY`, `PRODIGI_API_BASE` | S | - | sandbox | live | |
| `PRINTER_WEBHOOK_SECRET` | S | - | Req with printers | Req | |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | S (service) | - | dev project | prod project | Code reads them, adapter not built (SEC-18). Separate projects for preview and prod. |
| `GREETHUB_ALLOW_FAKE`, `GREETHUB_ALLOW_DEV_SIGNIN` | | `1` ok | **unset** (owner decision, SEC-02) | **never** | Master keys: fake sign-in as anyone, fake paid orders. |
| `GREETHUB_DATA_DIR`, `GREETHUB_MOCK_DELAY_MS`, `GREETHUB_MOCK_FAIL_PAGE` | | optional | - | - | Dev and tests. |
| `AGENT_CHANNEL_ENABLED`, other `AGENT_*`, `GREETHUB_SANDBOX` | `AGENT_KEY_PEPPER` S | - | - | off | Agent channel is dark until 2027 (Integrations). |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | S (secret) | - | optional | optional | Listed in the checklist; the app code does not read them yet (Supabase handles Google). |

Known gap: `app/.env.example` exists locally but `app/.gitignore` ignores it (`.env*`), so it has never been committed and lacks `SESSION_SECRET`, `CRON_SECRET`, `PRINTER_WEBHOOK_SECRET` and `GREETHUB_ADMIN_TOKEN`. This table is the source of truth until that is fixed.

## Checking what is set (names only)

With the Vercel CLI linked to the project (`vercel link` inside `app/`): `vercel env ls production` and `vercel env ls preview` list names and scopes, not values. Never use `vercel env pull` into the repo; if needed, pull into a temp folder and delete it.
