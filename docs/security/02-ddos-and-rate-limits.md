# 02. DDoS, traffic floods and rate limits

## What the app does today

- `lib/intake/rate-limit.ts`: in-memory sliding window per process. Resets on restart; each serverless instance has its own copy, so the real limit multiplies with instances.
- Client IP is `x-forwarded-for` first value, fallback `"local"` (shared bucket). On Vercel the platform sets this header; do not trust it on any other host.
- Limits that exist: intake 40 per minute, preview 5 per 10 minutes, report 8 per 10 minutes, styles/offer 60 per minute. Everything else has none: card/message, magic-link, cart, book routes, uploads, account routes, checkout.
- `proxy.ts` matcher excludes `/api`, so API routes get no edge logic.
- Long work: preview spawns a child process per request (`maxDuration = 180`); book jobs spawn a detached worker per job (`lib/book/queue.ts`). There is no queue depth cap, so a flood can spawn processes until the host runs out of memory.

## Layers (cheapest first)

### Layer 1. Vercel platform (free, on by default)
- Vercel states DDoS mitigation applies to all plans and all deployments with no setup, and the WAF is available on all plans (read 2026-10-11: vercel.com/docs/vercel-firewall). Volumetric L3/L4 floods are handled here.
- Use Vercel's own limits as budget guards too: set a spend management cap in the Vercel account (see costs.md) so a flood cannot create an unbounded function-invocation bill. This is the DDoS risk that matters for a small shop: the "denial of wallet".

### Layer 2. Vercel WAF custom rules (owner clicks, gh-devops writes the rules)
Rules to create in the project Firewall tab (rate limiting is a WAF custom-rule action; plan limits on rule counts and rate-limit availability are not verified, check the plan page before relying on them):
1. Rate limit `POST /api/auth/magic-link`: 5 per minute per IP, 429.
2. Rate limit `POST /api/intake` and `/api/card/*`: 30 per minute per IP; challenge above.
3. Rate limit `/api/book/*`: 60 per minute per IP; `/api/book/projects/*/photos`: 20 per minute.
4. Rate limit `/api/report`: 6 per hour per IP.
5. Block requests with a body over 1 MB to everything except the photo route (4.5 MB is the platform body limit for functions; photos are already downscaled in the browser).
6. Challenge (or deny) known bad ASN lists and Tor exits for `/api/*` if abuse appears (use the IP reputation data in the Vercel managed rules if the plan includes them).
7. Attack Challenge Mode: a one-click switch that challenges all visitors. It is the DoS kill switch; know where it is (runbook in 05).
8. Honeypot path rule (Vercel has a guide: vercel.com/kb/guide/how-to-build-a-honeypot-with-vercel-web-application-firewall): hidden links that only bots follow, auto-block those IPs.

### Layer 3. Bot protection and CAPTCHA
- Vercel Bot Protection exists (changelog says generally available). Pricing and plan not verified: check before relying on it.
- Cloudflare Turnstile on: sign-up and magic-link, first chat message and preview request for anonymous visitors, report form, checkout. Free for the usual use; plan details not verified (the docs page only links to a Plans page). Verify server side with the secret key on every protected route, once per action, with a short-lived signed result cookie so real users are not asked again every call.
- Optional Cloudflare in front of Vercel (proxy mode): gives Cloudflare WAF, rate limiting and Bot Fight Mode on the free plan, but stacking a proxy in front of Vercel can interfere with Vercel's own firewall and IP attribution (the real client IP then arrives in `CF-Connecting-IP`); check Vercel's current guidance first (not verified). Recommendation: do not add Cloudflare as a proxy at launch. Use Vercel WAF plus Turnstile. Revisit if you are attacked and Vercel's tools are not enough (the move is a DNS change; Cloudflare's free plan can take over in an hour).

### Layer 4. In-app limits (the part that survives a bypass)
Implement one small module, `app/lib/security/limits.ts`, used by every route, backed by the database (Supabase table with atomic increment) or Upstash Redis (free tier, millisecond latency; see costs.md). Interface: `limit({ key, max, windowSec })`. Keys combine route, signed device id, user id (if any) and IP network (/24 for IPv4, /56 for IPv6) so no single signal decides alone.

Per-route proposal (per day unless stated):

| Route | Anonymous | Verified email | Paying customer |
| --- | --- | --- | --- |
| `POST /api/auth/magic-link` | 5 per hour per IP, 3 per hour per email | same | same |
| `POST /api/intake` (chat turn) | 20 | 60 | 200 |
| `POST /api/card/message` | 5 | 20 | 60 |
| `POST /api/card/preview` | 1 lifetime per device, 2 per IP network | 3 (5 lifetime until first purchase) | 20 |
| `POST /api/book/projects` (create) | not allowed | 2 open, 3 per day | 10 open |
| photo upload | not allowed | 12 per day per account, 30 per project | 60 |
| `start-render` | n/a | after payment or deposit only | 3 per day |
| `reroll` | n/a | per project allowance (3) | 3 per project, 10 per day |
| `POST /api/report` | 3 per hour per IP | 6 per hour | 6 per hour |
| all other `/api/*` | 120 per minute per IP | 300 per minute | 300 per minute |

Return `429` with `Retry-After`. Never reveal which signal tripped it.

### Layer 5. Queue and compute caps
- Global cap on concurrent live jobs (start with 5) and a queue depth cap (200); beyond that return a friendly "busy, we'll email you" and enqueue nothing.
- Per-user concurrency of 1 active job (exists per project; add per user).
- Job timeout and stuck-job reaper: a job in `running` for over 30 minutes is failed, spend reconciled from the ledger, `activeJobId` cleared (today a dead worker leaves a project locked forever).
- Production queue must not be a detached local process (does not exist on Vercel). Use Inngest or a Supabase-queue consumer with concurrency limits, retries with backoff and a dead-letter state.
- Preview rendering should also go through the queue (currently runs inline for up to 180 seconds, holding a function slot per request: cheap to exhaust).
- Cap the preview child process count per instance (for example 2).

### Layer 6. Static and cheap pages
Marketing pages should be statically cached at the edge so floods on them cost nothing. Only `/api/*`, create flows and account pages need compute. `cacheComponents` is already on; keep those routes prerendered.

### Layer 7. Kill switch
A single database flag read by the limits module and the ledger, flippable from an admin page or a Vercel env var toggle plus redeploy (the env var is slower, so prefer the flag):
- `ai_mode`: `live` | `degraded` (rules-only chat, mock-free messages, no new previews) | `off` (all model routes return a friendly "we are catching up" message).
- Triggers to flip automatically: daily global spend over cap, hourly spend over 3x trailing average, OpenRouter returns 402 or 429 repeatedly, error rate over 20 percent.
- Paying customers' in-flight jobs finish unless `off`.

## Testing the limits (gh-security acceptance)
Scripted test with `k6` or a Node loop against a staging URL (mock AI on): confirm 429 at each threshold, confirm counters survive a redeploy, confirm a cleared cookie does not reset the preview limit, confirm a flood of 1,000 requests on `/api/intake` spends $0 in mock mode and trips the WAF in live mode.
