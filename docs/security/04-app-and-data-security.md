# 04. App and data security

## 1. Route inventory (every file under `app/app/api/`)

Legend: Auth = who may call. Lim = rate limit in code today. CAP = daily spend cap checked. Notes list gaps; fixes are in 06.

| Route | Auth | Lim | Notes |
| --- | --- | --- | --- |
| `auth/magic-link` POST | none | none | email bombing (R7); no Turnstile |
| `auth/google` POST | none | none | fake sign-in as shared demo user in prod (R2) |
| `auth/callback` GET | token | none | token single use, 15 min; consumed by mail scanners; guest merge bug (R1) |
| `auth/session` GET, `auth/signout` POST | cookie | none | session endpoint exposes which adapters are fake: remove in prod |
| `intake` POST | none | 40/min/IP, memory | model calls; no cap (R4) |
| `card/message` POST | none | none | model screen calls; no cap |
| `card/preview` POST | none (guest ok) | 5/10min/IP + cookie | CAP yes (memory); spawns child process |
| `styles/offer` POST | none | 60/min/IP | rules only, free |
| `report` POST | none | 8/10min/IP | sends two emails; honeypot present; reporter email from body |
| `cart` GET/POST/PATCH/DELETE | guest or user | none | guest id unvalidated (R1); `restore` unvalidated (R14) |
| `checkout` POST | signed in | none | prices from server cart (good); no Origin check |
| `checkout/session` GET | signed in | none | owner check (good) |
| `checkout/fake` GET/POST | signed in + `fakeAllowed` | none | free orders if ALLOW_FAKE (R3) |
| `webhooks/stripe` POST | HMAC | none | raw body, signature, tolerance, event-id idempotency (good) |
| `webhooks/printer/[name]` POST | shared secret in query | none | secret in URL; 503 in prod if unset (good) |
| `orders` GET, `orders/[id]` GET | signed in | none | owner filtered; GET triggers `refreshOrder` calls to printers (cost/DoS amplifier: cap) |
| `orders/[id]/advance` POST | `fakeAllowed` | none | local only |
| `account/*` (profile, addresses, people, drafts, export, delete) | signed in | none | owner scoped by `userId`; `drafts.brief` is `z.unknown()` with no size cap |
| `account/delete` + `confirm` | signed in; token | none | two-step with 15 min token (good); does not purge book data (R12) |
| `book/session` GET | none | none | harmless |
| `book/dev-session` POST/DELETE | `devSigninAllowed` | none | R3 |
| `book/projects` GET/POST | signed in | none | create runs a model screen |
| `book/projects/[id]` GET/PUT/DELETE | owner | none | `mustOwn` returns 404 for others (good) |
| `book/projects/[id]/consent` POST | owner | none | stores raw IP + UA |
| `book/projects/[id]/photos` POST, `[photoId]` GET/DELETE | owner | none | see section 3 |
| `book/projects/[id]/[action]` POST | owner | none | one active job per project; $4 per project |
| `book/projects/[id]/assets/[name]` GET | owner | none | name regex `^[A-Za-z0-9_.-]+$`, no leading dot, extension allow-list: no traversal; CSP header set (good) |
| `book/projects/[id]/cart-item` GET | owner | none | fine |
| `book/privacy/purge` POST | `x-cron-secret` | none | closed in prod if secret unset (good); use `timingSafeEqual` |
| `book/privacy/delete-my-data` POST | owner | none | not called by account delete |
| `admin/reports` GET/PATCH | token or dev gate | none | R3, R13 |
| `dev/outbox` GET | `fakeAllowed` | none | R3 |

Summary of pattern: object-level authorization is done well in the book service (`mustOwn` on every action) and in account/order helpers (userId in every lookup). No IDOR was found in book, order or account routes. The IDOR is in the guest identity (R1).

## 2. Authentication, sessions and cookies

- Today: HMAC-signed cookie (`gh_session`, HttpOnly, SameSite=Lax, Secure in production, 30 days). HMAC compare uses `timingSafeEqual` (good). Weaknesses: default secret, no revocation, no rotation of secret (key id), email in the cookie, no re-auth for sensitive actions.
- Target with Supabase Auth: short access token, refresh rotation, server-side session revocation, cookie names `__Host-` prefixed, `Secure`, `HttpOnly`, `SameSite=Lax`. Re-authenticate (fresh magic link within 10 minutes) for: account deletion, email change, export.
- Magic links: store only a hash of the token; one use; 15 minutes; confirm page with a button so scanners cannot consume it; bind to a short-lived cookie set when the link was requested (stops login CSRF and links opened on another device unless the user chooses).
- Google sign-in: use Supabase OAuth with PKCE; validate `state`; restrict redirect URLs to the production domain and the preview pattern.
- Age gate: under-18 lockout is on the checklist; enforce server side at account creation (acceptance record exists).
- Admin: do not build admin as a flag on the public site. Use a separate allow-list (Supabase user with `role=admin` claim set only by SQL, MFA required) or keep the admin page out of production and use the Supabase dashboard until volume needs it.

## 3. Uploads and files (children's photos)

Current controls (good): consent boxes before upload; type from bytes; 10 MB; 600 px minimum; 4 per character; owner path `books/<userId>/<projectId>/photos/<id>.<ext>`; storage root check prevents `..`; moderation before storage, fail-closed; 90-day purge; deletion logs hold ids and counts only.

Add:
1. Stream with hard byte limit instead of `req.formData()` then size check.
2. Max dimensions (for example 8000 px long edge) and max pixels (for example 40 megapixels) before any decode.
3. Re-encode with `sharp` to a fresh JPEG: strips EXIF/GPS, kills polyglot payloads, normalizes orientation. Keep the original only if a legal reason exists (none identified).
4. `X-Content-Type-Options: nosniff` and `Content-Disposition: inline` on photo and asset responses; keep `Cache-Control: private`.
5. Signed URLs in Supabase Storage with 60 second expiry for any browser fetch; bucket private; no public listing.
6. Per-user upload quotas (02) and per-user storage ceiling (for example 200 MB free tier).
7. Virus scanning is low value for re-encoded images; skip.
8. SSRF and path traversal: no route fetches a user-supplied URL (grep found fetch calls only to openrouter.ai, api.stripe.com, Lulu, Prodigi, Resend with fixed hosts; `LULU_API_BASE` and `PRODIGI_API_BASE` come from env, keep them out of any user path). Report `where` field is text only. The `[name]` and `[action]` params are matched against allow-lists. No traversal found.
9. The model providers: OpenRouter requests carry `provider.zdr = true` (zero data retention) for images (good); keep a test that fails if any photo-bearing call omits it. Photos never go to `:free` models (comment in moderation.ts; add a code assertion).

## 4. Content safety endpoints are attack surface

- Moderation and IP screening are model calls triggered by anonymous or free users. Treat them as paid APIs: same limits and ledger as generation (03).
- Fail closed for photos (good). For text, fail to rules-only (current behavior falls back to rules when the model errors; keep).
- Prompt injection: customer text is placed into model prompts. `lib/safety/hardening.ts` and the output screens exist; add tests that user text cannot change the system prompt role or request URLs, and that model output is schema-validated (Zod) before use (partially done). Never give the model tools or secrets.
- Suspected CSAM: halt, do not store, lock the account, preserve metadata, report per the attorney's procedure (open item, R12). Do not let a human reviewer view images unless counsel says how.

## 5. Webhook handling

- Stripe: keep raw body; reject if `livemode` mismatches `VERCEL_ENV`; unique index on `stripe_event_id`; insert-then-process in one transaction; return 2xx fast and do slow work (emails, printer submit) from a queue; alert on `amount_mismatch` with a manual refund runbook; subscribe only to the events used.
- Printer: move the secret into a header; verify provider HMAC if available; ignore status moves backwards (state machine already helps); cap body size.
- Clock: tolerance 300 seconds is right.

## 6. Cross-site and browser protections

Headers to add in `next.config.ts` `headers()` (gh-security owns this file's headers):
- `Content-Security-Policy`: `default-src 'self'; img-src 'self' data: blob: https://*.supabase.co; script-src 'self' 'nonce-...' https://challenges.cloudflare.com https://js.stripe.com; frame-src https://challenges.cloudflare.com https://js.stripe.com; connect-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Start in report-only for a week, because Next inline scripts need nonces (read `node_modules/next/dist/docs` CSP guide before writing it; Next here is newer than my training).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (add `preload` after the owner is sure).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` (photos are uploaded files, not camera streams; relax only if a camera feature ships).
- Origin check helper `assertSameOrigin(req)` used by every non-GET route: compare `Origin` (or `Sec-Fetch-Site`) to the site origin; reject mismatches with 403. Keep webhooks exempt (they use signatures).
- CORS: none needed; do not add `Access-Control-Allow-Origin: *` anywhere.
- Cookies: every cookie `Secure` in production, `HttpOnly` unless the client must read it; fix `gh_guest_card`.
- Clickjacking: `frame-ancestors 'none'`.
- Output encoding: React escapes by default; grep found no `dangerouslySetInnerHTML` use in route code (not exhaustive for components: ticket SEC-17 greps all components). SVG assets are served with a restrictive CSP (good); never inline user-supplied SVG.

## 7. Logging and privacy

- Never log: photos, story text, names of children, emails, IPs together with content. Current logs: `console.error` of error messages only, `[fake email] to=...` only in fake mode. Add a logger wrapper that redacts emails and keys.
- Consent log keeps IP and UA for evidence: hash the IP with a rotating salt after 30 days or document the legal basis; ask the attorney.
- Analytics events carry kinds and counts only (`lib/safety/events.ts` follows this). Keep it that way.
- Vercel log drains: avoid sending request bodies.

## 8. Supabase and row-level security plan

Principles: RLS enabled on every table in every exposed schema; default deny; the browser (anon and authenticated roles) gets only what it needs; money, ledger and safety tables are server-only (service role); the service role key never reaches the browser; storage paths carry the owner id.

Existing: `docs/data/03-schema.sql` already enables RLS on analytics/privacy tables with no permissive policies (service role and owner only), schemas are not exposed in PostgREST. Extend the same pattern to product tables.

Tables and policies (proposal; gh-cto writes migrations, gh-security reviews):

| Table | Browser (authenticated) | Server only |
| --- | --- | --- |
| `profiles(id = auth.uid())` | select/update own row, columns limited (no role column) | role changes |
| `people` | select/insert/update/delete where `user_id = auth.uid()` | |
| `drafts` | same owner rule | |
| `projects` | select own; insert via server only (to apply quotas); no direct update | all writes through API with ledger checks |
| `photos` (metadata) | select own | insert/delete (moderation first) |
| `consent_log` | select own | insert (append-only: no update or delete grants, even to service role through a trigger) |
| `jobs` | select own (progress) | writes |
| `cost_ledger` | none | all |
| `orders`, `order_items` | select own | all writes (webhook) |
| `checkouts` | none | all |
| `addresses` | owner rule; encrypt line fields at column level if budget allows | |
| `content_reports` | none (insert via API with Turnstile) | read by admin role |
| `safety_events`, `abuse_scores`, `device_signals` | none | all |
| `rate_limits` | none | all |

Rules:
- Use `(select auth.uid())` inside policies for planner caching; index every `user_id` column.
- No `using (true)` policies. No policies that reference `user_metadata` (user-editable); use `app_metadata` or a roles table.
- Views that bypass RLS: create them `with (security_invoker = true)`.
- Storage: bucket `book-photos` private; policy `(storage.foldername(name))[1] = auth.uid()::text` for select; inserts only via server (to run moderation); delete via purge job. Rendered outputs bucket private, signed URLs only.
- Functions: `security definer` functions pin `search_path` and are not exposed to anon; revoke `execute` from `public`.
- Tests: pgTAP or a script that signs in as user A and proves it cannot read, update or delete user B's rows in each table, and that anon reads nothing. Run in CI against a throwaway Supabase branch.
- Backups: Supabase Pro daily backups; test one restore before launch (cost in costs.md; plan details not verified).
- Admin access to production data: individual accounts, MFA, no shared password; the service role key lives only in Vercel Production and the worker.

## 9. Account takeover and fraud around payments
- Stripe Radar rules (3-D Secure on first order), block disposable emails at checkout, require a shipping name match for cards over a threshold (owner decides), review address changes after a payment.
- Refund abuse: free reprint requests need an order and photo of the defect; limit one per order.
- Gift-card or credit features, if ever added, need their own review.
