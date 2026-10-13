# Monitoring, alerts and backups

Written 2026-10-12. Status today: **nothing is monitored.** No error tracking, no uptime check, no alert email. Costs and plan limits below are not verified; check each vendor's pricing page before buying.

## What to watch, in order

| # | Signal | Source | Alert (to the owner) | Needs |
|---|---|---|---|---|
| 1 | Site down | Free external uptime check on `/` and one API route, every 5 min | 2 failures in a row, email + phone push | Owner account on an uptime service (free tier) |
| 2 | Server errors | Vercel runtime logs; Sentry free tier for stack traces | New error type, or 5xx rate over 2% for 10 min | Owner Sentry account; app code change (app team) |
| 3 | Model spend | App cost ledger vs OpenRouter usage | 50/80/100% of daily cap; hourly spend 3x the 7-day average; balance under $20; ledger vs OpenRouter gap over 5% (docs/security/03 s8) | Durable ledger (SEC-10) |
| 4 | Paid but no order | Stripe webhook handler | Any amount mismatch or failed fulfilment, immediately | Shop engineer adds an alert call (today only `console.error`) |
| 5 | Webhook failures | Stripe dashboard webhook stats; app logs for `/api/webhooks/*` | Any 4xx/5xx streak over 3 | Stripe email alerts (built in, owner turns on) |
| 6 | Queue depth and age | Job table (after SEC-21) | Depth over 200, or oldest queued job over 15 min | Hosted queue |
| 7 | Photo purge ran | Purge route result, daily | No successful run in 26 h; any photo older than 90 days | Supabase (purge only sees `/tmp` today) |
| 8 | Printer stuck | Order lines in `submitted` over 3 days, `needs_attention` any | Daily digest | Supabase |
| 9 | Build or cron failure | Vercel email notifications | Failed production build | Owner turns on in Vercel notification settings |

Routing: one alert address the owner reads on the phone (Resend email to it from the app; Slack or SMS later). Every alert names the runbook to open. Don't send customer content, emails or photos in alerts or logs (standing rule 5); use order ids and counts.

Recommended small app addition (app team, not built): `GET /api/health` that returns build id, adapter modes (fake or real, per provider) and `ok`, with no secrets. The uptime check hits it, and it shows at a glance if production is running on fake adapters.

## Logs

- Vercel keeps runtime logs only briefly (about 1 day on Hobby, a few days on Pro; not verified). A log drain to a store with 30-day retention is needed before launch to investigate payment or privacy incidents. Log drains are a Pro feature; a drain destination may cost money (owner decision).
- Do not log request bodies (docs/security/04). The current code logs some errors with `console.error`; keep ids, not names or briefs.

## Backups

- **Today: there is nothing to back up in the cloud.** All state is JSON on local disk (`app/.data/`) or `/tmp` on Vercel, which disappears. Local dev data is not backed up and should not be relied on.
- After Supabase: Pro plan daily backups (Free has none). Before launch, run SEC-39: restore the latest backup into a scratch project and check row counts on orders, consent records and the cost ledger.
- Storage buckets (photos, renders, print PDFs) are not covered by database backups (not verified). Photos are deliberately short-lived (90-day purge), so do **not** back them up elsewhere. Print PDFs can be rebuilt from stored renders and layout.
- A restore brings back data deleted since the backup. Keep the deletion log (ids only) so deletions can be re-applied after a restore.
- PITR is about $100/month (docs/data/02) and keeps deleted data longer. Skip it until order volume makes a one-day loss expensive.
