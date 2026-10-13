# 06. Security backlog

Effort: S under 1 day, M 1 to 3 days, L over 3 days. Priority: MUST = before any public URL or launch; AFTER = within 60 days of launch. "Builder" is the agent that implements; gh-security reviews every MUST item and writes tests where listed. Risk ids refer to 00-assessment.md.

## Status, 2026-10-12 (platform assessment; checked against code, not docs)

- Done: SEC-04 (build fix 0cd6c67; admin token timing-safe and required in production builds), SEC-22 (`childProcessEnv`), SEC-23 purge wiring (account delete calls `deleteUserBookData`; CSAM procedure still open). Stripe forged-webhook hole closed (shop engineer, not a ticket here).
- Partly done: SEC-01 (guest id format checked in fake `getSession` and `upgradeGuest`; cookie still unsigned, `proxy.ts` does not re-mint bad ids). SEC-02 (SESSION_SECRET required in production; `fakeAllowed`/`devSigninAllowed` still honour the flags on `VERCEL_ENV=production`; mock-AI-in-production guard missing). SEC-03 (Google stub refuses outside `fakeAllowed()`; `/api/auth/session` not reviewed). SEC-16 (baseline headers in `next.config.ts`; no full CSP, no origin check, `Secure` added to `gh_guest_card`). SEC-11 (`card/message` now limited per IP, in memory).
- Not started: SEC-05 to SEC-10, SEC-12 to SEC-15, SEC-17 to SEC-21, SEC-24, SEC-25. No `.github/`, no gitleaks, no `vercel.json` cron.

## MUST before launch

| ID | Ticket | Risk | Builder | Effort | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | Validate and sign guest ids | R1 | gh-shop-engineer | S | `gh_guest` accepted only if it matches `^g_[0-9a-f]{16}$` (or a signed value) in `getSession`, `actor`, `proxy.ts`, `upgradeGuest`; test: cookie `u_<hash>` is ignored and cannot read or merge a user's cart, drafts or people; existing cart tests pass |
| SEC-02 | Production env guard | R2, R3, R11 | gh-cto | S | App fails to boot in production when: SESSION_SECRET missing or under 32 chars; fake auth active; ALLOW_FAKE or ALLOW_DEV_SIGNIN is 1; mock AI is on; Stripe test key with live env. `fakeAllowed` and `devSigninAllowed` return false when `VERCEL_ENV=production`. Unit tests for each branch |
| SEC-03 | Gate fake Google stub and remove fake-adapter info leak | R2 | gh-shop-engineer | S | `/api/auth/google` returns 404 unless `fakeAllowed()`; `/api/auth/session` no longer reports `fake` flags in production |
| SEC-04 | Admin gate hardening and fix `/internal/reports` build | R3, R13 | gh-cto | S | `adminAllowed` requires token in production, `timingSafeEqual`, failure rate-limited; page has no `dynamic` export, `headers()` read inside Suspense; `next build` passes in a scratch copy; test that production without token returns 404 |
| SEC-05 | Rotate OpenRouter key, per-env keys with limits | R6 | owner (asks), gh-devops | S | Old key revoked; dev, preview, prod keys exist with credit limits; auto top-up off; keys recorded by name only in the password manager; owner confirms in writing |
| SEC-06 | Secret scanning: pre-commit and CI | R6 | gh-devops | S | gitleaks hook in `.githooks/` plus `core.hooksPath` setup doc; GitHub Actions job on push and PR; a seeded fake secret in a test branch is blocked; `.env.example` added with names only |
| SEC-07 | Persistent limits module | R4, R5, R7 | gh-cto | M | `lib/security/limits.ts` backed by DB or Upstash; survives restart and redeploy; keys combine device, user, IP network; used by every route in the table of 02; tests for window, burst, 429 + Retry-After; replaces `lib/intake/rate-limit.ts` |
| SEC-08 | Kill switch | R4, R5 | gh-cto | S | `ai_mode` flag (live, degraded, off) read by every model route; flip takes effect within 60 seconds; admin toggle documented; test for each mode |
| SEC-09 | Alerts | R4 | gh-devops | M | Email/push alerts for the list in 03 section 8; fire in a staging drill; recipients confirmed by owner |
| SEC-10 | Persistent spend ledger with reservations and pools | R4, R5 | gh-cto | L | Table and reserve/settle/release flow from 03 section 5; per-user, device, network, pool, global caps; failed renders counted; replaces in-memory spend in `preview.ts` and `safety/server.ts`; concurrency test (50 parallel reserves never exceed cap); weekly reconciliation script against the OpenRouter export |
| SEC-11 | Quotas on all model routes | R4 | gh-card-engineer (card routes), gh-book-engineer (book routes), gh-ip-safety (screen calls) | M | Per-tier limits from 02 enforced on intake, card/message, preview, project create, upload, generate-story, sheet, reroll; moderation and IP screen blocked attempts rate-limited harder; rules-first screening so most turns cost nothing; tests per route |
| SEC-12 | Payment (or deposit) before page rendering | R4 | gh-book-engineer, gh-shop-engineer | M | Free users can reach story and character sheet only; `start-render` requires a paid order or deposit; owner has approved the rule; test that an unpaid user gets 402 on `start-render` |
| SEC-13 | Turnstile on sign-up, first chat, preview, report, checkout | R5, R7 | gh-shop-engineer (sign-up, report), gh-card-engineer (chat, preview) | M | Server-side verify on every protected route; token single use; failure path in brand voice; site key public, secret in Vercel Production; test with Cloudflare test keys |
| SEC-14 | Measure unmeasured costs | 03 | gh-cto (cost ledger owner), gh-book-engineer | S | One mock-off run with a dollar cap set by owner (suggest $0.50) records `usage.cost` for an intake turn, an IP screen call and a photo moderation call; numbers added to `finance/measured_costs.json` by gh-cfo; limits in 03 rechecked |
| SEC-15 | Email endpoint limits and disposable email block | R7 | gh-shop-engineer | S | Magic link: 5 per hour per IP and 3 per hour per email, same response either way; report confirmation obeys per-email limit; disposable domain list and Gmail-alias normalization with tests |
| SEC-16 | Security headers and origin check | R9 | gh-security (headers), gh-cto (origin helper) | S | Headers from 04 section 6 on all routes (CSP report-only first week); `assertSameOrigin` on every non-GET route except webhooks; `Secure` on all cookies; header snapshot test |
| SEC-17 | Output encoding and component grep | 04 | gh-security | S | Grep and review of `app/components` and pages for raw HTML sinks and user-supplied URLs; findings fixed or listed |
| SEC-18 | Supabase adapter with RLS, tests | R2 | gh-cto, gh-shop-engineer | L | Policies from 04 section 8 in migrations; cross-user test proves user A cannot read, update or delete user B's rows in any table; anon reads nothing; storage policy test; service role only on server; reviewed by gh-security |
| SEC-19 | Webhook hardening | R8 | gh-shop-engineer | M | Unique event id insert before processing; `livemode` check; amount mismatch alert and runbook; printer secret moved out of URL (or HMAC) if provider supports; body size cap; replay tests |
| SEC-20 | Upload hardening | R10 | gh-book-engineer | M | Streaming byte cap; max dimensions and pixels; server re-encode removes EXIF (test with a GPS-tagged fixture generated in code, not a real photo); nosniff; per-user quotas; `readImageInfo` fuzz tests |
| SEC-21 | Production queue and compute caps | R4 | gh-cto, gh-devops | L | Queue replaces detached process; global concurrency 5, depth cap 200; per-user 1 active job; timeout reaper; spend re-check before each paid call; preview goes through queue; load test shows caps hold |
| SEC-22 | Child process env allow-list | R6 | gh-cto | S | `preview.ts` and `queue.ts` pass only named variables; test asserts `SESSION_SECRET` and Stripe keys are absent in the child env |
| SEC-23 | Account deletion calls book data purge; CSAM procedure | R12 | gh-book-engineer (purge wiring), owner and attorney (procedure), gh-ip-safety (hook) | M | `deleteAccount` calls `deleteUserBookData`; test shows photos gone; CSAM hook locks account and writes metadata only; attorney-approved text linked from the hook |
| SEC-24 | Cart input validation and caps | R14 | gh-shop-engineer | S | `restore` validated with schema and id format; max 30 lines per cart; request body cap; draft `brief` size cap |
| SEC-25 | Pre-launch penetration check | all | gh-security | M | Scripted run against staging with mock AI: authorization matrix (each route as anonymous, user A, user B), limits, headers, webhook replays; report with zero open High items |

## AFTER launch (first 60 days)

| ID | Ticket | Builder | Effort | Acceptance criteria |
| --- | --- | --- | --- | --- |
| SEC-30 | Abuse scoring and never-buy detection dashboard | gh-data (dashboard), gh-security (rules) | M | Daily top-spenders-without-orders list in Metabase; auto downgrade or hold at thresholds in 03; weekly false positive review |
| SEC-31 | Hash tokens at rest, revocable sessions, shorter session lifetime | gh-shop-engineer | M | Magic and delete tokens stored hashed; sessions revocable; 14 day sliding lifetime |
| SEC-32 | Device and network signal service | gh-cto | M | Salted hashes, 30 day retention, no raw signals in analytics; feeds the score |
| SEC-33 | Dependency hygiene | gh-devops | S | Dependabot weekly; `npm audit --omit=dev` fails CI at high; fix dev-chain highs when `eslint-config-next` offers a fix; move `vitest` to devDependencies |
| SEC-34 | Phone or card-on-file step for suspicious accounts | gh-shop-engineer | M | Triggered only at score 5 or more; conversion impact measured |
| SEC-35 | Consent log IP minimization | gh-data, owner and attorney | S | IP hashed after 30 days or retention basis documented |
| SEC-36 | Cloudflare in front of Vercel (only if attacked) | gh-devops | M | Playbook tested in staging; real client IP header handled; Vercel WAF rules ported |
| SEC-37 | Security.txt, SECURITY.md, bug report address | gh-devops | S | Published; mailbox monitored |
| SEC-38 | Quarterly key rotation and access review | gh-security, owner | S | Calendar entry; rotation recorded; unused accounts removed |
| SEC-39 | Restore test and backup check | gh-devops | S | One successful restore of the database and storage metadata to a scratch project |
| SEC-40 | Admin tool with MFA and audit log | gh-cto | M | Replaces header-token admin; every action logged with who and when |

## Suggested order (critical path)

Week 1: SEC-01, 02, 03, 04, 05, 06, 22, 24 (all small; closes the Critical items).
Week 2 to 3: SEC-07, 08, 10, 11, 15, 16 (limits, ledger, kill switch).
Week 3 to 5: SEC-12, 13, 18, 19, 20 (payment gate, Turnstile, Supabase with RLS, webhooks, uploads), then SEC-21 with the production queue.
Last: SEC-09, 14, 17, 23, 25.
