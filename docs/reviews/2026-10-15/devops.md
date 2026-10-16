# DevOps review, 2026-10-15

Sources read: docs/PLAN.md, docs/ops/, docs/devops/01-03, .github/workflows/ci.yml, app/vercel.json. I did not open any vendor dashboard, so nothing below about live accounts is verified.

## Done versus plan
- CI exists (`.github/workflows/ci.yml`): app lint, typecheck, vitest, IP eval (mock), production build; pipeline typecheck and test; `npm audit` (runtime, high+); gitleaks with weekly full-history scan. Mock AI only, no secrets, no paid calls. Dependabot config and `.github/gitleaks.toml` present.
- `app/vercel.json`: env gate (`scripts/check-env.mjs`, fails production build on a weak `SESSION_SECRET`) and the daily 90-day photo purge cron.
- Runbooks written: environments and env-var matrix, release and rollback, monitoring and backups. `scripts/scratch-build.sh` for local builds.
- Plan M1 says "CI enforced on GitHub" is NOT done; real auth (B1) not done.

## Open items
1. Monitoring: nothing is live. No uptime check, no error tracking (Sentry needs an app code change), no alert address, no `/api/health`. Spend, queue-depth and webhook alerts depend on the durable ledger (SEC-10) and the queue (SEC-21), neither built.
2. Backups and restore drill: no cloud state exists to back up (JSON on disk, `/tmp` on Vercel). Needs Supabase Pro (daily backups), then the SEC-39 restore into a scratch project with row counts on orders, consent and ledger. Deletion log must be replayable after a restore.
3. Env separation: matrix defined, not applied. Needs separate Supabase projects, OpenRouter keys (capped on preview), Stripe test versus live and per-endpoint webhook secrets. `GREETHUB_ALLOW_FAKE` and `GREETHUB_ALLOW_DEV_SIGNIN` must stay unset on preview and production (SEC-02 decision still open). `.env.example` is gitignored and stale.
4. Preview test auth: previews run on per-instance `/tmp`, so sign-in, cart and orders vanish. Deployment Protection is an owner setting; the Playwright e2e needs either a protection-bypass secret or a seeded test user, plus Supabase (SEC-18). Not designed yet.
5. CI required checks: no branch protection on `master` (owner GitHub setting). Job names to require: App, Pipeline, Dependency audit, Secret scan. The CI also runs on every push, which is fine at this size. Build runs Next 16 on Node 24; confirm Vercel's Node setting matches.
6. Domain, DNS, email: no domain confirmed in the repo. Needs registrar, Vercel domain, Supabase redirect URLs, Resend domain with SPF, DKIM and DMARC verified, a test of inbox placement at Gmail and Outlook, and a support mailbox. Stripe, Lulu and Prodigi webhooks are not registered anywhere.
7. Cost alerts: OpenRouter balance alert, per-env credit limits, Vercel spend limit, Supabase usage alerts, and a Stripe email alert are all unset. In-app spend cap is per-instance until SEC-10, so on serverless it is not a real cap.
8. Logs: retention on Vercel is short; a 30-day drain (Pro, possibly paid) is needed to investigate payment or privacy incidents. Avoid request bodies in logs.
9. Long jobs cannot run on Vercel; job host (Inngest or Supabase queue) is undecided, and live AI stays off in deployments until then.
10. Photo purge cron: route auth was a mismatch (POST plus x-cron-secret versus Vercel's GET with bearer). Confirm the fix landed and add a failure alert; it is a legal requirement.

## Must exist before an invite-only soft launch
- Vercel Pro project on a custom domain, production deploys only from `master`, branch protection with the four required checks.
- Supabase Pro in production with RLS and the store adapter (SEC-18), one restore drill passed.
- Queue/job host live, durable spend ledger, and a hard daily cap enforced in the database.
- `/api/health`, external uptime check (2 failures in a row alerts), Sentry or equivalent, alerts to one address the owner reads on the phone, each naming a runbook.
- Stripe live webhook plus Lulu and Prodigi callbacks registered and verified with one end-to-end sandbox run.
- Resend domain verified (SPF, DKIM, DMARC), transactional emails received in a real inbox.
- Fake adapters and mock AI confirmed off in production (health endpoint shows mode).
- A rollback rehearsal done once (Vercel instant rollback, plus the database migration rule in the release runbook).
- Purge cron confirmed running with a failure alert.

## Owner actions
- Create or confirm: Vercel Pro, Supabase Pro, Sentry, an uptime service, domain registrar, Resend domain.
- GitHub: turn on branch protection on `master` requiring the four checks; enable secret scanning and push protection if the plan allows (not verified).
- Vercel: Deployment Protection on previews, notification emails for failed builds, spend limit, project env vars per the matrix (mark secrets Sensitive).
- Set credit limits on the OpenRouter keys; turn on Stripe email alerts; choose the alert email address and phone push.
- Decide: job host, SEC-02 (fake sign-in on preview), paid log drain, PITR (skip for now).
- Add DNS records at the registrar when Vercel and Resend show them.

## Needed from others
- App team/CTO: `/api/health`, Sentry hook, SEC-10 ledger, SEC-18, SEC-21, e2e test-login method for previews, committed `.env.example`.
