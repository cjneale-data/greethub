# 03. Abuse and cost controls (people who burn model tokens and never buy)

## 1. Unit costs used

From `finance/measured_costs.json` (generated 2026-10-10, OpenRouter `usage.cost`, 43 calls):

| Item | USD |
| --- | --- |
| Image 1K / 2K / 4K | 0.041 / 0.0609 / 0.1233 |
| Identity (model) sheet | 0.0106 |
| QA vision per page | 0.0025 |
| Card copy (one small Sonnet call) | 0.0054 |
| Book story, 3 spreads | 0.0223 |
| Guest preview, 1K front only (estimate, not run end to end) | 0.0689 |
| Card front + inside, 2K | 0.2225 base, 0.2479 with rerolls |
| Book 24 pages, 2K | 1.0993 base, 1.2641 expected (text 0.2467, art 0.8526) |
| Book 32 pages, 2K | 1.4201 base, 1.6357 expected |

Not measured (my estimates, label them as such): one IP-screen call or one guide turn about $0.007; a chat turn can make up to 3 such calls (screen the input, guide reply, screen the patch) so I use $0.02 per turn as a conservative figure; one photo moderation call (flash-lite vision) about $0.0005; preview screening adds about $0.02. Measure these with `usage.cost` and replace the estimates (ticket SEC-14).

## 2. Max free spend per attacker per day, today

| Attack | Limit in code today | Max per day | Why |
| --- | --- | --- | --- |
| Chat flood `/api/intake` | 40 per minute per IP, in memory, no spend cap | 57,600 turns x $0.02 = about $1,150 per IP | Daily cap is not checked on this route; limit resets on restart and is per instance |
| `/api/card/message` flood | none | no ceiling (each call 1 to 2 screen calls, about $0.01 to $0.02) | no `allow()`, no cap |
| Guest previews, cookie cleared each time | 5 per 10 min per IP; cap $25 per day per instance | 720 x ($0.069 + $0.02) = $64 per IP, stopped at $25 per instance | Failed renders are not counted, so true spend can pass $25; N instances means N x $25 |
| Preview from many IPs (botnet) | cap $25 per day per instance | $25 per instance, and real customers are locked out | cap exhaustion |
| Free account, book renders | per project $4 hard cap, one active job per project, unlimited projects and accounts | one parallel project: about 180 books x $1.26 = $227 per day; ten parallel: about $2,270 | payment is only checked at checkout |
| Photo uploads | 4 per character, 10 MB, no rate limit, unlimited projects | cheap in model money ($0.012 per full project) but unbounded in disk and bandwidth | moderation is called per upload |
| Magic-link flood | none | inbox bombing and email quota, not model spend | R7 |

Headline: today there is no daily ceiling per attacker. The only hard limits are the $4 per book project and, for previews only, a $25 per instance cap that restarts to zero.

## 3. Same attacks under the recommended limits

Assumes the tiers in section 4 and the persistent ledger in section 5.

| Actor | Daily limits | Max spend per day |
| --- | --- | --- |
| Anonymous, one IP network | 20 chat turns, 2 previews (1 lifetime per device), no photos, no book | 20 x 0.02 + 2 x 0.09 = $0.58 |
| Verified free account, day 1 | 60 chat turns capped by a $0.80 per-user chat budget, 3 previews, one starter book trial (story + sheet + cover + one sample page, about $0.45) | $0.80 + $0.27 + $0.45 = $1.52 |
| Verified free account, later days | same without the book trial | $1.07 |
| One IP farming accounts | max 2 new accounts per IP network per day, each with a lifetime free budget of $2.00 | $4.00 for the account lifetimes, about $3.60 per day |
| Distributed attacker (any number of IPs and emails) | shared pools: anonymous pool $5 per day, free-trial pool $15 per day | $20 per day total, then free users see "come back tomorrow"; paying customers use a separate pool and are never starved |
| Paying customer | project cap $2.50 (24 pages; expected $1.26, 32 pages expected $1.64 so $3.00 for 32), 3 rerolls included | $10 per customer per day |

So the realistic worst case moves from "unbounded" to "$20 per day, plus whatever a paying customer's order costs".

Choices behind these numbers (for the owner to approve):
- Free users can chat, preview a card front and see a story and character sheet for a book. Full page renders ($0.85 for a 24-page book) start only after payment. This one rule removes the largest abuse (unpaid whole-book renders). If you prefer a deposit instead (for example a $1 hold) the cost-to-attacker is similar; payment is the only strong signal.
- A free account's lifetime budget of $2.00 acts as a tripwire for never-buy patterns.

## 4. Tiers

### Tier 0. Anonymous (no account)
- Turnstile (invisible) before the first chat message and before any preview.
- Signed device token cookie (`__Host-gh_dev`, HMAC, 1 year) issued on first visit; bind quotas to token + IP network. Clearing the cookie gets a new token, so also key on IP network and TLS/HTTP fingerprint (JA4 is available through Vercel's firewall fields per their docs; use as one signal, not the only one).
- Chat: rules-first screening (free); call the model screen only when rules say suspicious or at preview time. This cuts turn cost from about $0.02 toward $0.01.
- One free card-front preview per device lifetime, text only (already no photos for guests).
- No photos, no books, no message generation beyond sample messages.

### Tier 1. Verified email (free account)
- Sign-up requires Turnstile and a magic-link confirm. Confirm page needs a click (defeats mail scanners).
- Disposable domains blocked (section 6).
- 3 previews per day, 5 lifetime until the first purchase; chat budget; book trial once per account lifetime, one active project, up to 12 photos per day.
- Lifetime free budget $2.00. After that, "Make this one yours" asks for a purchase. Budget resets only when an order is paid.
- Account creation limited per IP network and per device token.

### Tier 2. Paying customer (at least one paid order)
- Raised quotas (table in 02), per-project cap $2.50 / $3.00, 3 included rerolls, extra rerolls priced (product decision).
- Separate budget pool so a free-tier attack cannot block customers.
- Refund and chargeback flags: a chargeback drops the account to Tier 1 and flags the card fingerprint (Stripe Radar data) so the same card is not reused for free credits.

## 5. Spend ledger and caps that persist

Replace the three in-memory spend counters (`lib/intake/preview.ts` `spend`, `lib/safety/server.ts` `spend`, per-project ledger file) with one Postgres table:

```
cost_ledger(id, at, user_id null, device_id null, ip_net, route, model, kind,
            est_usd, actual_usd null, status[reserved|settled|released], pool, project_id null)
```
- Reserve before the call: insert `reserved` with the worst-case estimate inside a transaction that checks the sums below; if over, refuse. Settle with `usage.cost` from the response; release on failure of a call that cost nothing. This closes the "failed renders are not counted" gap and the race between parallel requests.
- Caps checked on each reserve: per user per day and lifetime-free; per device per day; per IP network per day; per pool per day (anonymous, free-trial, paying); global per day; global per hour (3x trailing average). Per-project cap stays.
- Pools: `anon` $5, `trial` $15, `paid` set by margin (for example 30 percent of the day's revenue plus a $50 floor). All numbers are config rows, not code.
- Use the same `usage.cost` field the pipeline already records, so ledger rows reconcile against the OpenRouter activity export weekly (catches a leaked key spending outside the app: OpenRouter total minus ledger total should be near zero).
- Worker and web write the same table; the worker re-checks the cap before each paid call (the pipeline already has `assertUnderCap`; give it the user and pool).

## 6. Signals and friction

- Disposable email: block a list of throwaway domains (use an open-source list such as the `disposable-email-domains` package, review quarterly) and plus-address normalization for Gmail-style addresses (`a+1@gmail.com` and dots) so one mailbox is one account. Do not rely on blocklists alone; new domains appear daily.
- Device and network: signed device token, IP network (/24, /56), ASN class (datacenter or VPN hosting ranges get a CAPTCHA every time), user-agent sanity, Vercel/JA4 fingerprint, time-zone and language mismatch as weak signals. Never use these to decide alone, and never put the raw signals in analytics (rule 5); store hashed values with a salt that is rotated, 30-day retention.
- Phone verification is a strong barrier but adds cost and privacy burden (SMS provider, fraud pumping risk). Hold it in reserve: ask for it only after the lifetime free budget is half used on a suspicious account.
- Card on file as a signal: a $0 SetupIntent via Stripe before the book trial is an effective filter; weigh conversion cost. Option for later.
- Progressive friction (never the same wall for everyone):
  1. Normal: no friction.
  2. Score 1 to 2 (new device, datacenter IP, plus-address): Turnstile managed challenge.
  3. Score 3 to 4 (second account from same network, fast repeated previews, similar prompts): lower quotas, require email confirm again, delay the render by a short queue wait.
  4. Score 5 or more (many accounts, disposable domain, prompt-injection attempts, repeated safety blocks): hold accounts for review, rules-only chat, no model calls.
- Prompt-injection and safety-probe attempts (repeated `ip_blocked`, repeated sensitive-content blocks) count toward the score, and they cost money each time because the IP screen is a model call. Rate-limit blocked attempts harder than normal ones: after 5 blocks in an hour, stop calling the model for that identity and answer from rules only.

## 7. Detecting never-buy patterns

Compute daily from the ledger and events (kinds and counts only, no customer text; follows docs/data/06-data-governance.md):
- Cost-to-revenue per cohort: cohort by signup week; flag when cumulative free spend / paid revenue is over a threshold (for example free spend per account over $0.50 with zero orders after 7 days).
- Burn rate per identity: spend over $1.50 in 24 hours with zero orders; spend at 80 percent of lifetime free budget within one hour of signup.
- Clustering: more than 3 accounts sharing an IP network, device token or card fingerprint within 7 days; signups in bursts with sequential emails; identical or near-identical story ideas across accounts (hash of normalized text, not the text).
- Funnel shape: many previews, no cart-add, no checkout start; high re-roll rate without purchase.
- Output: a daily "top 20 spenders without orders" list in Metabase for gh-data, with auto-actions at the thresholds above (downgrade, hold, block) and a human review queue for holds.
- Review the false positive rate weekly; a wrongly blocked customer who pays is worth more than the saved $1.

## 8. Alerts

Email and phone push to the owner (Resend to a monitored address; Slack or SMS later):
- Global spend today over 50 percent, 80 percent and 100 percent of cap.
- Hourly spend over 3x the trailing 7-day hourly average.
- OpenRouter balance below $20, and key usage nearing its credit limit.
- Anonymous or trial pool exhausted before noon (attack signal).
- More than 20 new accounts from one /24 in an hour.
- Webhook failures, amount mismatches (money taken but order not made).
- OpenRouter total minus ledger total over 5 percent (leak or unmetered path).

## 9. Fairness and product wording
Messages stay in brand voice (warm, plain, no blame): "We're busy making cards right now. Your preview will be ready tomorrow, or make a free account to keep going." Never say "abuse" or "suspicious" to a customer. Provide an appeal address for held accounts.
