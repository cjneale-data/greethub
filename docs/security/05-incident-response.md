# 05. Incident response

Owner is the incident commander until someone else is named. Keep this page printed or in the password manager notes. Phone and email contacts are added by the owner (owner ask). Keep a running timeline (time, action, who) in a private doc during any incident. Do not paste secrets or customer content into chat, tickets or this timeline.

Severity: S1 = money or children's data at risk right now. S2 = degraded service or confirmed abuse. S3 = suspicious, no impact yet.

## A. Key leak runbook (any API key, token or secret)

Goal: stop use within 15 minutes, then clean up.

1. Contain (first 15 minutes)
   - OpenRouter: dashboard, disable the key (do not just lower the limit), then create a replacement with a credit limit. Check Activity for calls you do not recognize and note the time range and total.
   - Stripe: roll the secret key (and webhook signing secret if exposed). Dashboard, Developers, API keys. Review recent payments and payouts.
   - Supabase: rotate the service role key and JWT secret if exposed (all sessions end; accept it). Rotate the database password.
   - Resend, Lulu, Prodigi: revoke and reissue; check sent mail log and print orders for anything not yours.
   - Vercel: update the env var for the right environment, redeploy. Revoke any Vercel token too.
   - `SESSION_SECRET` exposed: replace and redeploy (all users sign out, fine).
   - `PRINTER_WEBHOOK_SECRET` or `GREETHUB_CRON_SECRET`: replace in Vercel and in the provider or cron config.
2. Find the cause
   - Search repo and history with gitleaks; search chat or agent transcripts on the machine; check where the value was last used. If it is in git history of a pushed branch: the key is burned regardless of deleting the commit; rewrite history only after rotation, and only if the owner agrees (history rewrite of a pushed repo is the owner's call).
   - If it was posted in a public place, assume it was scraped within minutes.
3. Assess damage
   - Spend: compare OpenRouter total to the app ledger for the window (03, alert on mismatch). The gap is the leak's cost. Ask OpenRouter support about the charges if large.
   - Data: if a Supabase or storage key leaked, check access logs for reads of the photo bucket. If children's photos may have been accessed, S1: bring in the attorney for notification duties (US state breach laws; not legal advice).
4. Recover and prevent
   - Confirm the old key now fails, the new one works, the limit is set, the alert is on.
   - Add the pattern to the gitleaks config; add a test or lint if it was a code path (for example logging an env object).
   - Write a short post-incident note: what happened, time to contain, cost, fix.

## B. DoS or traffic flood runbook

Signals: Vercel Firewall traffic spike, function invocation spike, p95 latency up, 429 spike, spend alert, owner email from Vercel about usage.

1. Triage (5 minutes): Is it requests to static pages (cheap), to `/api/*` (costly), or to model routes (spend)? Open the Firewall tab, Live traffic, group by path, IP, ASN, user agent.
2. If model routes: flip `ai_mode` to `degraded` or `off` (kill switch in 02) first. Money matters more than features.
3. Add a WAF rule: block or rate-limit the offending path, ASN, country or user-agent pattern. IP blocking rules for the worst IPs.
4. If broad: turn on Attack Challenge Mode (Vercel, Firewall, Attack Mode). Real users see a short check; bots fail. Leave it on until traffic is normal for an hour.
5. Protect the wallet: confirm the Vercel spend limit is set and not hit; confirm the OpenRouter key limit; if the bill is growing fast, pause the project's production deployment as a last resort (website shows a maintenance page; the owner decides).
6. Communicate: status line on the home page ("We're a little busy. Orders already placed are safe.") and an email to anyone with an order in flight if checkout was down.
7. After: add the rule permanently, record the cost, adjust limits. If Vercel tools were not enough, plan the Cloudflare option (02).

## C. Abuse runbook (token burning, free-account farming, safety abuse)

Signals: daily "top spenders without orders" list, pool exhausted early, many accounts from one network, spike in blocked IP-safety attempts.

1. Identify: pull the ledger by user, device, IP network for the last 24 hours. Group.
2. Contain: lower the pool cap for the affected tier; hold or block the accounts; rate-limit the network at the WAF; raise friction (Turnstile always on for the tier).
3. Check for a bypass: does the traffic use a route without limits (compare route list in 04)? A hole beats a bot; fix the hole first.
4. Never punish a paying customer on a heuristic alone. Holds on accounts with orders go to human review within one business day.
5. Safety abuse: repeated attempts to generate sexual content, protected characters or real people: block the account, keep metadata (counts, kinds), not the content, unless counsel says otherwise.
6. Suspected CSAM upload: stop, do not view, do not forward, lock the account, preserve metadata, follow the attorney-approved procedure (NCMEC CyberTipline reporting duty for US providers is an open legal item). This is S1.
7. Report: weekly note with spend by tier, accounts actioned, false positives, and limit changes.

## D. Other incidents (short checklists)

- Account takeover report: revoke the user's sessions, force re-login, review the last 30 days of orders and address changes, hold shipments with changed addresses.
- Customer data request or breach suspicion: attorney first; do not delete evidence; keep the timeline.
- Payment mismatch (money taken, no order): reconcile Stripe events against orders daily; refund manually if the order cannot be created; alert exists in 03.
- Takedown or content report: follow `docs/legal/07-ip-safety-design.md` section 8; the 48 hour target applies.

## E. Preparation checklist (done before launch)

- [ ] Kill switch built and tested (SEC-08).
- [ ] Alerts firing to a monitored inbox and phone (SEC-09).
- [ ] Vercel spend limit and OpenRouter key limits set (owner).
- [ ] Break-glass list: where each secret is rotated, with login paths (no values).
- [ ] A drill: rotate the dev key and flip the kill switch in staging once.
- [ ] Contact sheet: attorney, Stripe support, OpenRouter support, Vercel support, Supabase support.
