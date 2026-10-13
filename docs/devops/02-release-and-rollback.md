# Release and rollback runbook

Written 2026-10-12. Vercel and GitHub menu names are from memory and may have moved; look for the setting by name.

## The path every change takes

1. Work on a branch. Run `bash scripts/scratch-build.sh` locally (copies the tree to a temp folder, runs everything below, never touches the running dev server).
2. Push the branch. GitHub Actions (`.github/workflows/ci.yml`) runs:
   - **App**: lint, typecheck, vitest, the free IP-safety eval (`eval:ip -- --mock`), `next build`.
   - **Pipeline**: typecheck, vitest.
   - **Audit**: `npm audit --omit=dev --audit-level=high` in app and pipeline.
   - **Secret scan**: gitleaks on the pushed commits (full history weekly), matches redacted.
   All mock mode, no secrets, no paid calls.
3. Vercel builds a **preview** for the branch. Its build first runs `scripts/check-env.mjs`.
4. Check the preview (Deployment Protection on). For risky changes, run `tests/e2e/card-flow.mjs` and `shop-walk.mjs` against it.
5. Open a PR to `master`. Merge only when CI is green (branch protection, owner setting).
6. Merging deploys **production**. Watch the build log for `[check-env] warning` lines and the first 15 minutes of runtime logs and alerts.

Hotfix: same path, smaller branch. Never deploy from a laptop with `vercel --prod`, so every production build is a commit CI has checked.

## Rollback

Code-only problem (most cases):
1. Vercel > Project > Deployments, pick the last good production deployment, choose **Instant Rollback** (CLI: `vercel rollback <deployment-url>`). It takes seconds and does not rebuild.
2. After a rollback Vercel stops auto-promoting new production builds until you promote one again. Fix forward on a branch, merge, then **Promote** the fixed deployment.
3. Note it in the incident log (docs/security/05).

Env var problem (for example a bad or missing secret): env changes only apply to **new** deployments. Fix the value in Settings > Environment Variables, then **Redeploy** the current production deployment. Rolling back does not undo an env var change.

Data problem: rollbacks never touch data. Until Supabase exists there is no durable production data to restore. After SEC-18:
- Write migrations expand-then-contract: add columns or tables first, deploy code that uses them, remove old ones in a later release. Then any rollback target still works against the current schema.
- Never run a destructive migration in the same release as the code that needs it.
- Restore uses Supabase backups (docs/devops/03). A restore to a past point loses newer orders and re-creates deleted personal data, so it needs the owner and a privacy re-run of deletions made since the backup.

Webhooks after a rollback: Stripe and printer webhooks retry for hours to days, so events missed during a bad deploy are usually redelivered. Check Stripe > Developers > Webhooks for failed deliveries and resend them.

## Release checklist (production)

- [ ] CI green on the merge commit.
- [ ] `SESSION_SECRET` (32+), `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `GREETHUB_ADMIN_TOKEN` set in Production. The build fails on the first, warns on the rest.
- [ ] `GREETHUB_ALLOW_FAKE` and `GREETHUB_ALLOW_DEV_SIGNIN` unset in Production.
- [ ] Stripe webhook endpoint for this environment points at `/api/webhooks/stripe` with the matching secret.
- [ ] After deploy: home, `/create/card`, sign-in and cart load. Cron listed under Settings > Cron Jobs.
- [ ] Previous production deployment noted as the rollback target.
