# GreetHub security assessment

Author: gh-security. Date: 2026-10-11. Scope: repo `C:\Users\seejn\greethub` at commit 4346fc7 (assessment only, no app code changed).
Companion files: 01 secrets, 02 DDoS, 03 abuse and cost, 04 app and data, 05 incident response, 06 backlog, costs.

## Bottom line

The code is careful in many places (Stripe signature check with timing-safe compare and replay window, event-id idempotency, owner checks on every book route, path checks on storage, fail-closed photo moderation, server-side pricing). The weak spots are the ones you would expect before Supabase exists: the stand-in auth is not safe to put on the internet, every spend limit lives in memory, and most model-calling routes have no limit at all. Nothing is deployed yet, so all of this is cheap to fix now.

No secrets were found in the repo or its git history (details in 01). Nothing was found that needs emergency action today. Five items must be fixed before any public URL exists.

## What I checked, and how

- Git history (20 commits, 587 tracked files) and the working tree with regex patterns for OpenRouter, Stripe, Resend, JWT, GitHub, AWS and PEM keys. Result: no matches in tracked files or history. I did not print or open any value. I did not open any .env file.
- Every route under `app/app/api/` (44 route files), `app/proxy.ts`, `app/next.config.ts`, `app/lib/env.ts`, the adapters, book service, queue, stores, moderation, safety, shop services.
- `npm audit` in `app/` and `pipeline/`.
- Docs: PLAN, LAUNCH-CHECKLIST, data governance and schema (RLS section), legal children-photos doc.
- I ran no model calls and no build. Items I could not verify are marked "not verified".

## Ranked risks

Severity: Critical = fix before any public deploy. High = fix before launch. Medium = fix before launch if cheap, else soon after. Effort: S under 1 day, M 1 to 3 days, L over 3 days.

### R1. Critical. Anyone can read or take another person's cart, drafts and saved people ("people" holds children's names and ages)

- Where: `app/lib/adapters/fake/auth.ts` `getSession()` returns `userId: jar.get("gh_guest")` with no format check; `app/lib/shop/api.ts` `actor()`; `app/app/api/cart/route.ts`; `upgradeGuest()` in fake/auth.ts; `app/app/api/auth/callback/route.ts`.
- Exploit: user ids are `"u_" + first 14 hex of sha256(lowercased email)` (`lib/shop/session.ts` `userIdForEmail`). An attacker who knows a victim's email computes the id, sets their own `gh_guest` cookie to it, and the cart API treats them as that "guest": read, add, remove the victim's cart lines. Worse: the attacker then signs in normally with their own email while the cookie is still set; the callback calls `upgradeGuest(guestId, attackerId)`, which moves the victim's cart, drafts and people into the attacker's account.
- Fix: validate guest ids as `^g_[0-9a-f]{16}$` in `getSession`, `actor`, `proxy.ts` and `upgradeGuest` (reject anything else, mint a new id). Better: sign the guest cookie (HMAC, same helper as the session). Add a test that a `u_...` value in `gh_guest` is ignored. Replace the deterministic user id with a random uuid when Supabase lands.
- Effort: S. Owner: gh-shop-engineer.

### R2. Critical. The stand-in auth is the only auth, and it is not safe in production

- Where: `app/lib/adapters/index.ts` (`auth: fakeAuth` always, `supabase: false`), `app/lib/shop/session.ts` line 6, `app/app/api/auth/google/route.ts`, `app/lib/adapters/fake/auth.ts` `signInWithGoogle`.
- Exploits:
  1. `SESSION_SECRET` falls back to a hard-coded string in source. If the env var is missing on the deploy, anyone can mint a valid session cookie for any email.
  2. `POST /api/auth/google` is not gated by `fakeAllowed()`. In production it still returns a callback link that signs the caller in as the shared demo account `sam.demo@gmail.test`. That is a free "signed-in" identity for anyone, which also defeats every per-account quota.
  3. Magic-link tokens, orders, carts and the idempotency list live in one JSON file on local disk (`lib/shop/store.ts`). On Vercel the disk is read-only or per-instance, so the site will either fail or lose data and double-process webhooks.
- Fix: until Supabase auth ships, make the app refuse to start in production when `auth.name === "fake"` unless `GREETHUB_ALLOW_FAKE=1`; throw if `SESSION_SECRET` is missing or under 32 chars when `NODE_ENV=production`; gate the Google stub with `fakeAllowed()`. The real fix is the Supabase adapter (DB-backed carts and orders, Supabase Auth sessions).
- Effort: S for the guards, L for Supabase (already planned). Owner: gh-cto (guards), gh-shop-engineer (Supabase adapter).

### R3. Critical. `GREETHUB_ALLOW_FAKE=1` and `GREETHUB_ALLOW_DEV_SIGNIN=1` are master keys

- Where: `lib/shop/api.ts` `fakeAllowed`, `lib/safety/reports.ts` `adminAllowed`, `lib/book/config.ts` `devSigninAllowed`, routes `api/dev/outbox`, `api/checkout/fake`, `api/orders/[id]/advance`, `api/auth/magic-link` (`devLink`), `api/account/delete` (`devLink`), `api/admin/reports`, `(shop)/internal/reports`.
- Exploit: with ALLOW_FAKE on any internet-reachable deploy (Vercel preview URLs are reachable unless Deployment Protection is on): `POST /api/auth/magic-link` for any email returns `devLink`, which logs the caller in as that person; `/api/dev/outbox` lists every email including magic and delete links; the fake checkout creates paid orders with no payment; `adminAllowed` returns true with no token, exposing reporter contact details. ALLOW_DEV_SIGNIN=1 gives a shared full-access book session to any visitor with a cookie.
- Fix: never set either flag on Vercel. Make the code enforce it: ignore both flags when `VERCEL_ENV === "production"`; on previews require Vercel Deployment Protection; make `adminAllowed` require the token whenever `NODE_ENV=production` regardless of ALLOW_FAKE, compare with `timingSafeEqual`, and rate limit failures.
- Effort: S. Owner: gh-cto. Owner ask: keep both flags unset on Vercel and turn on Deployment Protection for previews.

### R4. High. Most model-calling routes have no limit and no spend cap; free accounts can render whole books

- Where: `api/intake/route.ts` (40 per minute per IP, in memory, no cap), `api/card/message/route.ts` (no limit at all), `api/book/projects` (create runs the IP screen, no limit), `api/book/projects/[id]/photos` (a vision call per upload, no limit), `api/book/projects/[id]/[action]` (generate-story, generate-sheet, start-render, reroll: only a per-project $4 cap and one active job).
- Exploit: scripted chat or message calls burn Sonnet money with no ceiling. A free account can create unlimited projects and each runs a full render (about $1.26 for 24 pages) because payment is only checked at checkout. See 03 for the arithmetic: today there is no ceiling per attacker per day; one parallel project is about $225 a day.
- Fix: tiered quotas, persistent per-user and global ledgers, payment (or a small deposit) before page rendering, CAPTCHA at signup and first chat. Full design in 03.
- Effort: M for quotas and ledger, M for the payment gate. Owner: gh-cto (ledger, quota library), gh-book-engineer (render gate), gh-card-engineer (card routes).

### R5. High. Guest preview limit is a cookie; limiter and daily cap reset on restart and are per instance

- Where: `api/card/preview/route.ts` (`gh_guest_card` cookie), `lib/intake/rate-limit.ts` (Map), `lib/intake/preview.ts` (`spend` object).
- Exploit: delete the cookie (or use a fresh browser profile) and get another free preview, bounded only by 5 per 10 minutes per IP. The IP is read from the first `x-forwarded-for` value; behind Vercel this is set by the platform, but anywhere else it is client-controlled, and the fallback key `"local"` puts every unknown caller in one bucket. On serverless, every instance has its own Map and its own $25 cap, so the real limit scales with traffic. A restart resets all of it. The cap also records spend only after a render succeeds, so failed or timed-out renders cost money but do not count. And a botnet can burn the whole $25 in under an hour and lock real customers out (cap-exhaustion denial of service).
- Fix: move counters and the spend ledger to the database (or Upstash Redis for limiters) keyed by a signed device token plus IP network plus (later) account; record reserved spend before the call and reconcile after; keep a protected budget pool for paying customers.
- Effort: M. Owner: gh-cto.

### R6. High. Key handling: shared plaintext key, wide inheritance, no scanning

- Where: OpenRouter key in `C:\Users\seejn\book\.env` used by several agents (not opened); `lib/intake/preview.ts` and `lib/book/queue.ts` pass `...process.env` to child processes; `lib/book/engine/live.ts` and `pipeline/src/cli.ts` read `.env.local` files themselves; no `.env.example` in the repo although `.gitignore` expects one; no pre-commit scan, no CI, no GitHub secret scanning.
- Risk: any agent transcript, log or tool output may contain the key; the key has no spend limit; child processes see every future secret (Stripe, Supabase service role).
- Fix: rotate the OpenRouter key now and again at launch; one key per environment, each with a credit limit; pass children only the variables they need; add gitleaks as pre-commit and in CI; add `.env.example` with names only. Details in 01.
- Effort: S. Owner: gh-security (scan config), gh-devops (CI), owner (rotation, dashboard limits).

### R7. High. Email endpoints can be used to bomb inboxes and burn the sending reputation

- Where: `api/auth/magic-link` (no rate limit, no CAPTCHA), `api/account/delete` (signed-in only, fine), `api/report` (8 per 10 min per IP, then sends a confirmation email to any address the caller supplies, plus a team notice).
- Exploit: loop the magic-link endpoint with a victim's address (or thousands of addresses); Resend quota and domain reputation suffer, and the victim is harassed. Same with `/api/report` and `contactEmail`. Disposable emails are accepted without any check, which is how free-account farming starts.
- Fix: per-email (3 per hour) and per-IP limits in a persistent store, Turnstile on the sign-in and report forms, disposable-domain blocklist, same response whether or not the email exists. Report confirmation only to addresses that also pass the per-email limit.
- Effort: S to M. Owner: gh-shop-engineer.

### R8. Medium. Webhooks and order state are not multi-instance safe

- Where: `lib/shop/orderService.ts` `handlePaymentWebhook`, `lib/shop/store.ts`, `api/webhooks/printer/[name]`.
- Good: Stripe signature and 5-minute window verified, timing-safe, amount compared, order creation idempotent per checkout, event ids remembered.
- Gaps: idempotency list is a file kept to 500 ids (no cross-instance lock; fine once it is a unique-key row in Postgres); `livemode` and currency not checked; an amount mismatch marks the checkout failed with no alert or refund path; the printer webhook secret travels in the URL query string (appears in request logs) and Lulu/Prodigi signature headers are not used (not verified which each supports); no body size cap.
- Fix: unique index on Stripe event id, insert before processing; assert `livemode` matches the environment; alert on mismatch; move the printer secret to a header or HMAC if the provider supports it.
- Effort: M. Owner: gh-shop-engineer.

### R9. Medium. No security headers, no origin check on state-changing routes

- Where: `app/next.config.ts` (no headers), `app/proxy.ts` (none), most routes accept JSON POST/PATCH/DELETE without checking Origin.
- Mitigation today: cookies are `SameSite=Lax`, which blocks most cross-site POSTs. `gh_guest_card` lacks `Secure`.
- Fix: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`; an Origin/Sec-Fetch-Site check for all non-GET routes; `Secure` on every cookie; `__Host-` prefix on the session cookie.
- Effort: S. Owner: gh-security (headers), gh-cto (origin helper).

### R10. Medium. Photo upload hardening

- Where: `api/book/projects/[id]/photos/route.ts`, `lib/book/service.ts` `addPhoto`, `lib/book/imageInfo.ts`.
- Good: type read from bytes, 10 MB cap, 600 px minimum, per-character cap of 4, owner check, consent required first, moderation fail-closed.
- Gaps: the whole body is read before the size check; no maximum pixel size (decompression bombs reach the image tools and the model); the server does not re-encode, so EXIF (including GPS of a child's home) is kept for 90 days unless the browser already stripped it; no per-user or per-day upload quota; unlimited projects means unlimited disk; served images lack `X-Content-Type-Options: nosniff`.
- Fix: stream with a hard byte limit, cap dimensions (for example 8000 px), re-encode server side (sharp) to strip metadata, per-user quotas, nosniff.
- Effort: M. Owner: gh-book-engineer.

### R11. Medium. Mock mode can silently disable moderation

- Where: `lib/book/config.ts` `isMockMode` (true when `OPENROUTER_API_KEY` is missing or `GREETHUB_MOCK_AI=1`), `lib/book/moderation.ts`.
- Risk: a deploy with a missing or mistyped key, or a leftover mock flag, passes every photo through "moderation" and serves placeholder art. Fail-open on the one check that stops illegal images.
- Fix: in production, mock mode must be an explicit opt-in that is refused when `VERCEL_ENV=production`; startup check; health endpoint that reports mode to the operator only.
- Effort: S. Owner: gh-cto.

### R12. Medium. Privacy duties not yet wired

- `deleteAccount` in `lib/shop/accountService.ts` carries a TODO and does not call `deleteUserBookData`, so book photos and projects survive account deletion (legal req 28).
- The CSAM hook only writes a console line (`lib/book/moderation.ts`). US providers have a reporting duty for apparent child sexual abuse material; this needs the owner's attorney (flag, not legal advice). Until then, a hit must also lock the account and preserve metadata.
- Consent log stores the raw IP and user agent with no retention rule.
- Fix and owners in 04 and 06.

### R13. Medium. `/internal/reports` fails `next build`, and is it exposed?

- Why it fails: `app/(shop)/internal/reports/page.tsx` has `export const dynamic = "force-dynamic"`. `next.config.ts` turns on `cacheComponents`, and the bundled Next docs (`node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`, section "dynamic = force-dynamic") say route segment configs like this are replaced and must be removed. It also awaits `headers()` outside a Suspense boundary, which cache components also rejects. I did not run the build (a dev server is running; rule 4), so the exact error text is not verified.
- Exposed? Not today: a failing build means this page never ships. Once fixed, it is gated by `adminAllowed` (token header, or any non-production run, or ALLOW_FAKE=1). With the R3 change (token always required in production) it is closed. It is not covered by `proxy.ts`, has no rate limit on token guesses, and shows reporter email addresses. Add `robots` noindex (already there) and keep it behind Vercel authentication or the token.
- Fix: delete the `dynamic` export, move the `headers()` read into a component inside `<Suspense>`, require the token in production. Effort: S. Owner: gh-cto.

### R14. Medium. Cart and draft input is trusted too much

- `POST /api/cart` with `restore` pushes a raw object into the cart with no schema (`lib/shop/cartService.ts` `restoreLine`). Price is recomputed server-side and quantity is clamped, so price tampering looks blocked, but arbitrary fields and size go into the store. Guest carts are unbounded per guest id, so a script can grow the database. Validate with `NewCartItemSchema` plus an id format, cap lines per cart (for example 30) and bytes per request.
- Effort: S. Owner: gh-shop-engineer.

### R15. Low. Housekeeping

- Sessions are stateless 30-day cookies with email inside; sign-out only deletes the cookie, so a stolen cookie works until it expires. Use Supabase sessions (revocable) and shorten to 7 to 14 days with sliding renewal.
- Magic-link and delete tokens are stored in plaintext; store a hash. Tokens are consumed by email scanners that prefetch links (users see "expired"); use a confirm button page.
- `originOf()` trusts `x-forwarded-host` for redirect and Stripe return URLs; use `NEXT_PUBLIC_SITE_URL`.
- Cron secret and admin token compared with `===`; use `timingSafeEqual`.
- `vitest` is listed under `dependencies` in `app/package.json`; move to dev dependencies.
- No `.github/` directory: no CI, no Dependabot, no secret scan, no CODEOWNERS.
- `npm audit`: see below.

## Dependency audit

- `app/` all dependencies: 5 high, 0 critical, 0 moderate. All five are in the lint toolchain chain `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. Dev only; not shipped.
- `app/` with `--omit=dev` (what ships): 0 vulnerabilities.
- `pipeline/`: 0 vulnerabilities, both modes.
- Next 16.4.0, React 19.3.0: no advisory reported by npm audit on the date above. No fixes applied. Recommendation: Dependabot weekly, `npm audit --omit=dev` as a CI gate at high.

## Known facts you asked me to verify

| Claim | Result |
| --- | --- |
| Guest preview limit is a cookie | True, plus an in-memory IP limit. Cookie is trivially cleared (R5). |
| Rate limits and daily spend cap reset on restart | True, and are per instance on serverless (R5). Only the preview route checks the cap. |
| Several agents used the OpenRouter key in book\.env | Not opened. Treat as exposed to agent logs; rotate (01). |
| Photo moderation and safety checks cost money and are attack surface | True. Moderation is one vision call per upload with no upload limit; the IP screen runs on chat, message, brief, notes and re-roll notes (R4). |
| `/internal/reports` fails build | True per bundled docs, cause identified, not exposed today (R13). |
| Fake providers blocked in production unless ALLOW_FAKE=1 | True for checkout, outbox, advance, devLink, admin. NOT true for fake auth itself and the Google stub (R2, R3). |
| Supabase and Stripe not wired | Stripe adapter is real code but inactive without keys; Supabase not wired (R2). |
| Repo pushed to private GitHub | Remote is `github.com/cjneale-data/greethub`. No secrets in history, so a leak via the push is not indicated. |

## Top five to fix first

1. R1 guest id takeover of carts and saved people.
2. R2 and R3 the fake-auth and flag master keys (production guards).
3. R4 and R5 unmetered model spend and the in-memory limits (persistent ledger, quotas, payment before page renders).
4. R6 rotate the OpenRouter key, per-environment keys with credit limits, secret scanning in CI.
5. R7 email endpoints (rate limits and Turnstile) plus R9 headers.

## Owner asks (things only you can do)

1. Rotate the OpenRouter key now (the one in book\.env) and set a credit limit on every new key (steps in 01).
2. Keep `GREETHUB_ALLOW_FAKE` and `GREETHUB_ALLOW_DEV_SIGNIN` unset on Vercel; turn on Deployment Protection for preview URLs.
3. Approve the free-tier quotas and the "pay before pages render" rule in 03 (this is a product and price decision).
4. Create the Cloudflare account (Turnstile, free) and approve the Vercel plan question in costs.md.
5. Ask your attorney about the apparent-CSAM reporting procedure and photo retention for logs.
6. In GitHub: enable branch protection on `main`, 2FA on the account, and Dependabot alerts.
