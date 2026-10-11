# Security tooling costs (for the CFO)

All prices are from memory or vendor docs I could read on 2026-10-11; vendor pricing pages were not all reachable, so every figure marked "check" must be confirmed on the vendor page before it goes in the model. I did not find prices I could verify, so no number below is a quote.

| Item | Purpose | Expected cost | Status |
| --- | --- | --- | --- |
| Vercel DDoS mitigation | volumetric floods | $0 (platform-wide, all plans, per vercel.com/docs/vercel-firewall, read 2026-10-11) | verified |
| Vercel WAF custom rules, IP blocking, Attack Challenge Mode | rate limits, kill switch | $0 stated as available on all plans; rule counts and rate-limit allowance per plan not verified | check |
| Vercel Bot Protection / BotID | bot filtering | unknown (changelog says generally available; pricing not read) | check; optional |
| Vercel spend management cap | stops a denial-of-wallet bill | $0; owner setting | owner ask |
| Cloudflare Turnstile | CAPTCHA | free tier expected; plan limits not verified | check |
| Cloudflare proxy (only if attacked) | extra WAF | free plan exists; Pro tier is a monthly fee | check, deferred |
| Upstash Redis (if used for limits) | counters | free tier likely enough at launch; otherwise usage-priced, a few dollars a month | check; or use Postgres at $0 extra |
| Supabase RLS, Auth, Storage policies | data protection | $0 extra; inside the Pro plan already in the model (about $35 per month per docs/data/02-architecture.md) | in model |
| gitleaks (pre-commit and CI) | secret scanning | $0 (open source) | free |
| GitHub secret scanning with push protection on a private repo | duplicate of gitleaks | requires GitHub Advanced Security, a paid per-committer add-on; not needed | skip |
| Dependabot, `npm audit` | dependency alerts | $0 | free |
| Sentry or similar error alerts | detecting leaks and failures | free tier probably enough; not verified | optional |
| Uptime and alert email (Resend) | alerts | inside existing Resend plan | in model |
| Disposable email list (open source package) | signup filter | $0; a paid API is optional | free |
| SMS verification (held in reserve) | suspicious accounts only | per-message fee, plus fraud-pumping risk | deferred |
| Penetration test by a third party (optional) | independent check | quote needed; small shops often pay a few thousand dollars | owner decision, after launch |
| Attorney time for CSAM reporting and breach duties | legal | quote needed | owner ask |

## Model-spend exposure (what the controls cap)

- Today: no ceiling per attacker per day (see 03: about $1,150 per IP per day on chat alone at my estimated $0.02 per turn).
- With the recommended limits: free-tier pools of $5 per day (anonymous) plus $15 per day (trial) = $20 per day maximum. Budget line for the model: free-tier acquisition cost up to $600 per month at full abuse, far less in normal use; the CFO should treat the pools as a marketing budget with a hard stop. Pool sizes are config, not code.
- Per paying order: expected model cost $1.26 (24 pages) and $1.64 (32 pages) at 2K from `finance/measured_costs.json`, project hard cap $2.50 and $3.00.
- Last wall: OpenRouter key credit limits, with auto top-up off.

## One-time engineering time (days, from 06-backlog)

MUST items: roughly 28 to 35 engineer-days across agents (S=0.5, M=2, L=5 for planning). The expensive items are SEC-10 (ledger), SEC-18 (Supabase with RLS tests) and SEC-21 (production queue); the last two are already needed for launch regardless of security.
