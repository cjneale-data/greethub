# 06. Architecture and phased roadmap

Evidence tags as in 01. Repo facts come from reading `app/lib/adapters/`, `app/packages/shared/src/`, `app/lib/intake/`, `app/lib/safety/`, `app/lib/shop/orderState.ts` and the route tree under `app/app/api/` at the current commit. No code was changed.

## 1. How it fits the current repo

```
 AI assistants (ChatGPT, Claude, Gemini, Perplexity, Copilot Studio, Alexa+, scripts)
        | MCP (Streamable HTTP, OAuth 2.1)            | REST + API key / OAuth
        v                                              v
 app/app/api/mcp/route.ts                      app/app/api/agent/v1/<tool>/route.ts
        \______________________  ____________________/
                               \/
              app/lib/agent/  (NEW)  authorize() policy engine, idempotency, service functions
                               |
     +-------------+-----------+-------------+--------------+----------------+
     |             |                         |              |                |
 shared Zod     lib/safety             lib/intake       lib/shop         adapters/
 contract       IpSafetyService        preview/render   cart/pricing/    Payments (add setup,
 (agent/*.ts)   fastScreen             queue (SEC-21)   orderService     charge, refund)
 + brief.ts     + printed-text rules   + cost ledger    orderState       Email/Notify, Storage
                                                        (existing)       Printer (existing)
                               |
        Supabase Postgres (RLS, SEC-18): agent_clients, agent_grants, agent_keys,
        approvals, standing_rules, agent_audit, idempotency_keys, cost_ledger (+agent pool)

 Human surfaces (greethub.com): consent screen, Connected assistants, approval page, activity feed
 OAuth AS: Supabase Auth OAuth server (spike) or small custom AS; discovery on auth.greethub.com
```

### 1.1 Contract: shared Zod schema
- New folder `app/packages/shared/src/agent/`: `tools.ts` (input/output Zod per tool, section 5 of 05), `errors.ts` (ToolError codes), `grants.ts` (scopes, modes, limits), `openapi.ts` (generates OpenAPI 3.1 from Zod), `toBrief.ts` (`AgentCardDraftInput` to `CreationBrief`, using `CardBriefBase`, `OCCASIONS`, `TONES`, `AddressSchema`, `missingFields`).
- Pricing reuse: `get_quote` and approval totals call `priceLine`/`computeTotals`/`PRICING` unchanged, so the CFO changes prices in one place (pricing.ts says so).
- Tests: contract snapshot test (generated JSON Schema checked in), plus a test that every tool has explicit annotations and a title (directory requirement).

### 1.2 Adapters
Existing adapter interfaces: `AuthAdapter`, `PaymentsAdapter`, `PrinterAdapter`, `EmailAdapter`, `StorageAdapter` (`app/lib/adapters/types.ts`), each with a fake and a real implementation, selected in `adapters/index.ts` (today `auth: fakeAuth` always, security R2).
- `PaymentsAdapter` gains `createSetupSession`, `chargeSavedMethod`, `refund` (03 section 5), with fakes so the sandbox and Playwright need no Stripe.
- `EmailAdapter` stays; add `NotifyAdapter` (push + email approval requests; web push first, mobile push when the Expo app exists).
- `AuthAdapter` is for GreetHub's own sessions. Agent auth is separate (`lib/agent/auth.ts`: token verify, grant load), so the fake-auth stand-in cannot leak into agent paths. Hard rule: agent routes refuse to run if `auth.name === "fake"` unless `GREETHUB_SANDBOX=1` (section 6).

### 1.3 Route namespace
- `app/app/api/agent/v1/*` REST; `app/app/api/mcp/route.ts` MCP (the Vercel `mcp-handler` `createMcpHandler` + `withMcpAuth` pattern [V] https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel); `app/app/.well-known/oauth-protected-resource/route.ts` for RFC 9728 metadata.
- Human surfaces under `app/app/(shop)/account/assistants/*` and `app/app/approve/[id]`. The approval route is excluded from agent token acceptance.
- The existing `proxy.ts` and the SEC-16 `assertSameOrigin` helper must exempt `/api/mcp` and `/api/agent/*` from cookie-based origin checks (they use bearer tokens, not cookies) while applying them to the approval POSTs.

### 1.4 Rate-limit and spend-cap services
Consumes (does not duplicate) SEC-07 `lib/security/limits.ts` and SEC-10 the persistent cost ledger with reservations. Agent additions: pool `agent`, keys with `grant_id` and `client_id`. The existing in-memory `allow()` in `lib/intake/rate-limit.ts` must not be reused (it is per instance and resets on restart; security R5).

### 1.5 Events and observability (docs/data)
Use `track()` from the data architecture (docs/data/02) with the new event names in 04 section 3.7; no free text, no addresses; `event_id` derived from request id for idempotent ingest. The cost ledger rows get `route = "agent.<tool>"` and `agent_client_id`. `ml.generation_attempts` already exists for model calls. Add a Metabase dashboard "Assistants": connected accounts, drafts per grant, draft-to-approval conversion, cost per approved card, chargebacks, injection flags (gh-data, DATA-012 pattern).

### 1.6 Safety and IP
Call `IpSafetyService.screen` / `screenBatch` for agent text (types.ts fields `card_message`, `card_idea`, `brief_field`). Pass `knownNames` = owner and recipient names. Extend `lib/safety` with an `agentPrintedTextRules()` function (URLs, phones, money requests) so printing rules live next to the IP rules.

## 2. Hosting the remote MCP server

Recommendation: **same Next.js project on Vercel, own hostname `mcp.greethub.com`**, using `mcp-handler` 2.1.1 and MCP server SDK v2 [V, Vercel docs updated 2026-09-18]. Reasons: shares the service layer, RLS-aware Supabase client and adapters; Vercel Functions with Fluid compute suit irregular MCP traffic; instant rollback and preview deployments exist [V].

Open items and cautions:
- Function duration and cost for `preview_card` long-poll (up to 20 s) on the chosen Vercel plan: not verified; check against docs/security/costs.md plan question. If limits bite, return `rendering` immediately and rely on polling.
- The AS discovery host must be reachable from Anthropic's egress `160.79.104.0/21` [V] and OpenAI's published ranges; do not block them in the Vercel Firewall or any Cloudflare rule (SEC-36). Turnstile (SEC-13) must not apply to `/api/mcp`, `/api/agent` or OAuth endpoints.
- Large work stays off the request path: the render runs in the SEC-21 queue/worker; MCP returns handles.
- Alternative if Vercel limits or MCP spec churn become painful: a small standalone service (Cloudflare Workers has first-class MCP and OAuth provider support [S Claude docs mention "Cloudflare hosting support with OAuth", V]) calling the same REST API. This is the reason the REST contract is canonical: the MCP host can move without touching business rules.
- `mcp.greethub.com` must match the product's domain for directory reviews ("the MCP server domain should match your service", Claude review criteria [V]).

## 3. Long-running render jobs

- `create_card_draft` returns a handle in under 2 seconds (validation, screening, ledger reservation, enqueue).
- `preview_card` waits up to 20 seconds on a Postgres LISTEN/Realtime channel for the job (PLAN.md already uses Supabase Realtime for progress), then returns `rendering` + `retryAfterSeconds`.
- No streaming of partial images. MCP Tasks (extension [V]) is the future-proof alternative; add when two major clients support it (monthly check).
- Notify: when ready, no push is needed (the assistant is in a live conversation). For the autonomous/scheduled path, the assistant polls. For the human, the approval request is sent only after `status = ready`.
- Failure: render failure after one auto re-roll returns `status: blocked` with a plain reason; the reserved cost is settled or released (SEC-10 flow).

## 4. Versioning and compatibility
See 05 section 10. Add a monthly compatibility check against ChatGPT developer mode, Claude custom connector, Gemini custom app and MCP Inspector (AGT-018), because client behaviors differ (ChatGPT linking via `_meta`, Claude requires HTTP 401, Gemini DCR only, Copilot needs Streamable transport).

## 5. Observability and operations
- Structured logs with `request_id`, `grant_id`, `client_id`, `tool`, `outcome`, latency; no argument values; short log retention (legal 06 item 30, 30 days).
- Metrics: tool latency p50/p95, error rate by code, render time, approval conversion, spend by pool, chargebacks.
- Alerts: extend SEC-09 with the agent list (04 section 3.7).
- Synthetic canary: daily sandbox run of the full flow with a test key; page the owner on failure.
- Runbooks: "assistant misbehaving" (pause client, revoke grants, refund holds), "platform policy change" (feature flag per client to remove tools), "leaked API key".

## 6. Developer sandbox

- A separate deployment `sandbox.greethub.com` + separate Supabase project, **no production data and no production secrets**; Stripe test mode, fake printer, deterministic mock AI that returns fixed sample images, fake email outbox visible via an API for tests.
- Test keys `ghk_test_*`; OAuth works against the sandbox AS with seeded demo account(s) (this also provides the "fully featured demo account with sample data" that OpenAI and Anthropic reviewers require [V]).
- Conflict to resolve with gh-security: SEC-02 and R3 say fake providers and mock AI must never be on in production, and `GREETHUB_ALLOW_FAKE` is a master key. The sandbox is allowed only as a distinct deployment flagged `GREETHUB_SANDBOX=1` that refuses to boot if any production secret is present, is reachable only with rate limits, and never shares the cookie domain with greethub.com. Reviewer: gh-security (AGT-016).
- Rate-limited and reset nightly.

## 7. Public developer docs outline (`docs.greethub.com` or `greethub.com/developers`)
1. What GreetHub for assistants does, with a 60-second demo.
2. Connect GreetHub to ChatGPT / Claude / Gemini / Perplexity / Copilot Studio (steps per platform, screenshots).
3. Permissions: modes, scopes, limits, what assistants cannot see.
4. Quickstart: API key, first draft in curl, in the MCP Inspector.
5. Tool reference (generated from Zod), error codes, idempotency, rate limits.
6. The approval flow and what the user sees; webhooks (P3: `order.status_changed`, `approval.decided` with HMAC signatures).
7. Sandbox and test cards.
8. Safety and privacy: what data we receive, retention, deletion.
9. Policies: acceptable use for agents, prohibited content, rate-limit and abuse handling.
10. Changelog and deprecation policy; status page; support contact.

## 8. Roadmap (effort in person-days; dependencies; gates)

Rates and totals are in 08. All numbers are my estimates [U]. "SEC" = docs/security/06-backlog.md; effort there S=0.5, M=2, L=5 days.

### P0. Prerequisites (about 57 days: 37 already planned in security, 20 new)

Security tickets that must be done first, in dependency order:
- Group A, before any public URL of any kind (including a private-beta MCP URL): SEC-01 (guest ids), SEC-02 (production env guard), SEC-03 (Google stub), SEC-04 (admin gate and build fix), SEC-16 (headers, origin helper), SEC-07 (persistent limits), SEC-08 (kill switch), SEC-18 (Supabase adapter and RLS; agent grants need real users).
- Group B, before real users can create drafts: SEC-05 and 06 (key rotation, secret scanning), SEC-10 (persistent spend ledger), SEC-11 (quotas), SEC-13 (Turnstile on sign-up and web creator), SEC-14 (measure costs, to size agent quotas), SEC-15 (email limits), SEC-21 (production queue), SEC-22 (child env allow-list), SEC-24 (cart/draft input caps).
- Group C, before money moves through the channel: SEC-12 (pay before page renders), SEC-19 (webhook hardening: unique event ids, livemode, amount mismatch), SEC-23 (deletion purge and CSAM hook), SEC-09 (alerts), SEC-25 (pre-launch penetration check including agent routes).
- Group D, before autonomy: SEC-30 (abuse scoring), SEC-31 (hashed tokens, revocable sessions), SEC-40 (admin audit).
- Sum of Group A to C estimates: about 37 person-days (A 10, B 17, C 10, from the S=0.5, M=2, L=5 convention); not new money. Group D adds about 6.

New P0 agent work: AGT-001 to AGT-007 (20 days): decision record and platform questions, shared contract, grants/audit/idempotency schema with RLS, idempotency middleware, recipient model, policy engine, audit + Connected assistants UI.

Exit criteria: contract package builds; policy engine unit tests cover the check list in 02 section 5; schema reviewed by gh-security.

### P1. Read and draft tools (37.5 days; depends on P0 Groups A and B, Supabase auth)
Deliver: OAuth AS for agents with consent screen (AGT-010), REST + MCP for tools 1 to 10 (AGT-011, 012), draft pipeline integration and previews (AGT-013), agent text safety (AGT-014), quote tool (AGT-015), sandbox (AGT-016), events (AGT-017), test matrix across clients (AGT-018), public docs v1 (AGT-019).
Exit: a tester connects Claude, ChatGPT (developer mode), Gemini and Perplexity to the sandbox and production-beta, creates a draft and sees a preview; drafts appear under Account > Drafts; quotas and kill switch work; red-team suite (partial) green; cost per draft measured.
Gate to P2: at least 25 connected beta accounts and at least 100 drafts with a measured draft-to-approval intent (users tapping "I'd approve") above 20 percent, or the owner decides to proceed anyway.

### P2. Approve-and-pay (29 days; depends on P1, SEC Group C, attorney sign-off on agent terms and card-on-file)
Deliver: approval service and page (AGT-020), stored card + off-session charge + caps + receipts + refunds (AGT-021), request_approval / cancel_order / order tools (AGT-022), recipient address confirmation flow (AGT-023), account integration (AGT-024), Radar rules (AGT-025), legal texts (AGT-026), full e2e + injection suite (AGT-027).
Exit: end-to-end test (sandbox) of 05 section 9.1 passes; refund inside hold works; chargeback evidence stored; `next build` and Playwright green; gh-security sign-off.

### P3. Standing rules, API keys, optional autonomy (19 days; depends on P2 stable 60 days, SEC Group D, attorney sign-off)
Deliver: standing rules and annual caps (AGT-030), proposal inbox and digest (AGT-031), API keys (AGT-032), autonomy gating with cooling-off, first-N, anomaly hold (AGT-033), native birthday/anniversary reminders from People (AGT-034). The prepaid wallet (AGT-035) stays out unless the owner and attorney approve.
Exit: 24-hour cooling-off enforced by test; caps hold under concurrency (50 parallel approvals never exceed cap); alert drill.

### P4. Distribution (24 days; depends on P2 minimum, written platform answers)
Deliver: ChatGPT submission package and review cycle (AGT-040), Claude directory package (AGT-041), MCP Apps preview/approve widgets (AGT-042), Alexa+ add-on (AGT-043), OpenAPI custom connector for Copilot Studio / Power Platform (AGT-044), partner outreach (AGT-045).
Exit: at least one directory listing live; monitoring of listing health metrics (Claude portal shows server health and usage after publication [V]).
Timelines: OpenAI 3 to 7 business days estimated [S]; Anthropic automated scan then Community listing, human review varies [V]; Microsoft, Google, Amazon: not found. Plan 4 to 8 weeks of calendar time for the first two listings including rework [U].

### Critical path (calendar, one engineer-equivalent per lane, [U])
P0 Group A/B: 3 to 4 weeks (already the security critical path). P0 agent work in parallel: 3 weeks. P1: 5 weeks. P2: 4 weeks (+ legal wait). P3: 3 weeks. P4: 4 to 6 weeks of mostly waiting. Total about 5 to 6 months from approval if the security backlog is on schedule.

## 9. Risks to the plan
- Supabase OAuth server may lack a needed feature (CIMD, custom scopes, revocation); fallback is a custom AS (+5 days).
- MCP spec churn: 2025-11-25 and 2026-07-28 coexist; mitigate with the REST-canonical design and a conformance test in CI.
- Directory policy outcomes (01) could force removal of payment-related tools from a listing; the default design already keeps money movement on greethub.com.
- Draft cost: if the draft must be rendered at final resolution, abandoned drafts cost about $0.25 each; quotas and the never-buy detector bound this.
