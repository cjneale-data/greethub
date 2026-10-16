# Security review, committee 2026-10-15 (gh-security)

Method: read docs/PLAN.md and docs/security/*, then grepped app/lib, app/app/api, app/proxy.ts, app/next.config.ts, .github/ on branch committee-review-2026-10-15. Nothing was run (no tests, no build, no model calls). Not legal advice.

## 1. Done against the plan (verified in code)

- SEC-04 admin gate: `adminAllowed` (app/lib/safety/reports.ts:89) uses a SHA-256 plus `timingSafeEqual` token check. Production without a token returns false.
- SEC-22: `childProcessEnv` allow-list (app/lib/env.ts:15).
- SEC-06 mostly: .github/workflows/ci.yml has lint, typecheck, tests, build, `npm audit --omit=dev --audit-level=high` and a gitleaks job; .github/gitleaks.toml, .gitleaksignore, dependabot.yml and scripts/hooks/pre-commit exist. Not verified: that a seeded fake secret is blocked, and whether `core.hooksPath` is set up for the team.
- Stripe webhook: signature verified; fake-adapter webhook refused outside `fakeAllowed()`; event-id replay check (app/lib/shop/orderService.ts:279-292).
- SEC-02 partly: SESSION_SECRET (32+ chars) required in production (app/lib/shop/session.ts:13). scripts/check-env.mjs runs before the Vercel build (app/vercel.json) and fails on a missing secret in production. A cron for the privacy purge exists.
- SEC-16 partly: HSTS, X-Frame-Options and a `frame-ancestors/base-uri/object-src` CSP in app/next.config.ts.
- Recipients importer has hard caps (1 MB / 1,000 rows / 100 columns, app/lib/recipients/csv.ts; 500 per list, 25 lists).

## 2. Verified gaps, ranked

Critical (launch blockers)
1. **Fake and dev flags still work in production.** `fakeAllowed()` = `NODE_ENV !== production || GREETHUB_ALLOW_FAKE=1` (app/lib/shop/policies.ts:14); `devSigninAllowed` same (app/lib/book/config.ts:40). One env var on Vercel Production turns on fake auth and fake payments. `VERCEL_ENV` is not checked; check-env.mjs only warns. Needs a hard boot failure (SEC-02).
2. **Spend caps are in memory.** app/lib/intake/rate-limit.ts is a per-instance Map; `underDailyCap` in the preview route, the intake cap and the writing-render limit reset on every cold start and are not shared across instances. No ledger, no `ai_mode` kill switch anywhere in app/lib except the agent channel's own switches (SEC-07, 08, 10 not started). This is the main way the OpenRouter bill runs away.
3. **No CAPTCHA anywhere** (no Turnstile or captcha code in app/). Guest previews are limited by a cookie and a spoofable IP (SEC-13).
4. **IP key is the left-most `x-forwarded-for`** in intake, card/message, card/preview, report, styles/offer and book consent routes. A client can rotate it to dodge every limit. On Vercel use the platform-set client IP.
5. **Magic-link route has no rate limit** (app/app/api/auth/magic-link/route.ts): email bombing and Resend quota burn (SEC-15). Also no disposable-email block.
6. **Guest cookie is unsigned** and proxy.ts only checks presence, not format (SEC-01 partial). Same `Secure` flag only when NODE_ENV is production.
7. **Mock AI can be on in production** with no guard, and `GREETHUB_MOCK_AI` unset plus a missing key silently means mock (app/lib/intake/config.ts). Orders could go through with mock output. Add to the SEC-02 guard.

High
8. Stripe webhook idempotency uses `processed_events`, an in-memory list capped at 500 in the file store (app/lib/shop/store.ts:117-120). Not durable until Supabase is the store. No `livemode` check seen (SEC-19).
9. No origin/CSRF check on non-GET routes; the only CSP is frame-ancestors, so no script protection (SEC-16 remainder).
10. Supabase RLS policies are not built or tested (SEC-18). Production data depends on this.
11. No payment or deposit gate before page rendering (SEC-12) and no production queue or concurrency cap (SEC-21).
12. Upload hardening (EXIF strip, pixel caps) not evidenced (SEC-20).

## 3. Launch blockers vs later

Blockers: items 1 to 7 and 10, plus SEC-05 (key rotation, owner), SEC-08, SEC-12, SEC-19, SEC-24 cart caps, SEC-25 pen test. Item 11 is a blocker before any marketing spend.
Later (within 60 days): SEC-30 to SEC-40 as in docs/security/06-backlog.md, plus hashed tokens at rest, security.txt, quarterly rotation.
docs/security/06-backlog.md status line (2026-10-12) is still accurate for SEC-01 to SEC-04; it does not yet record the CI gitleaks job, check-env.mjs or the privacy cron, so update it.

## 4. What the new code adds

- **Photo sets** (app/lib/photo-sets): consent record, 90-day purge with hold logic and a deletions.jsonl log (no customer content in it as written). Risks: it is a lib only, with no API route yet, so the real attack surface is undefined. The purge writes files under a root dir and needs the daily cron wired and an account-delete hook (SEC-23 purge covered book data only; confirm photo sets are included). Derived proofs and print PDFs hold full-resolution faces and must be covered by deletion; the code says they are. Upload limits, EXIF stripping and signed URLs must be added when routes land (docs/security/photo-events-threats.md covers this).
- **Recipients** (app/lib/recipients): CSV/vCard import is bounded, which is good. Risks: it stores third-party names and postal addresses (PII of people who never signed up), so it needs export/delete coverage, spreadsheet-formula neutralisation on any export, and per-user import rate limits. No route exists yet.
- **Shop and photo cards** (app/lib/shop, shop/photoCard, collage, proof-check): cart still lacks a line and size cap (SEC-24). A collage render is CPU and image work with no queue; apply SEC-21 limits before routes are public.
- **New home page**: no security-relevant finding in what I read; I did not audit page components for raw HTML sinks (SEC-17 still open).

## 5. Owner actions

1. Rotate the OpenRouter key; create separate dev, preview and production keys with credit limits; auto top-up off (SEC-05).
2. Set `VERCEL_ENV`-scoped variables: confirm no `GREETHUB_ALLOW_FAKE`, `GREETHUB_ALLOW_DEV_SIGNIN` or `GREETHUB_MOCK_AI=1` exist in Production.
3. Create a Cloudflare Turnstile site (free) and put the secret in Vercel Production.
4. Choose the free-user rule for page rendering (SEC-12) and the daily spend ceilings (suggest $0.50 for the measured-cost run, SEC-14).
5. Pick alert recipients for spend and abuse alerts (SEC-09).
6. Attorney: CSAM reporting procedure, retention basis for recipient addresses.
7. Enable GitHub secret scanning and push protection, and run `git config core.hooksPath scripts/hooks` on each machine.

## 6. Not verified

No tests were run. I did not read every route; routes under account, orders, agent, mcp and book/projects were not checked for per-route authorization. I did not review git history for secrets in this pass (the CI job scans it weekly).
