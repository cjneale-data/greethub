# Agent channel (MCP + agent API): framework status, build order, open decisions

Plan lives in docs/integrations (00 to 09). This note only records what code exists, what is stubbed, and the order to finish. Nothing here changes the plan; ticket IDs are the AGT/SEC IDs from docs/integrations/07-backlog.md and docs/security/06-backlog.md.

## What exists (framework, off by default)

The whole channel is dark unless `AGENT_CHANNEL_ENABLED=1`. Outside development, tests and the sandbox flag, the routes answer 503 because no production persistence exists (deliberate: the in-memory limiter and ledger must never guard real money, security R5).

| Piece | Path | State |
|---|---|---|
| Contract: 16 tool input schemas (Zod), annotations, scopes, grant limits, ToolError codes | `app/packages/shared/src/agent/` | Real. Outputs are untyped JSON (permissive `outputSchema`); `toBrief()` and OpenAPI generation not written (AGT-002) |
| MCP server (Streamable HTTP, stateless, JSON-RPC: initialize, ping, tools/list, tools/call) | `app/lib/agent/mcp/`, `app/app/api/mcp/route.ts` | Real, hand-rolled, no new dependency. Scope-filtered deterministic `tools/list`; 401/403 with `WWW-Authenticate`; ChatGPT `_meta` + `securitySchemes` on tools |
| REST surface `POST /api/agent/v1/<tool>` | `app/lib/agent/rest.ts`, `app/app/api/agent/v1/[tool]/route.ts` | Real, bearer only, never reads cookies. OpenAPI JSON not served yet (AGT-011) |
| Auth: bearer parse, API keys (HMAC-hashed, `ghk_` format), grant loaded fresh each call, fake-auth guard | `app/lib/agent/auth.ts`, `keys.ts` | Hooks real. `TokenVerifier` and `ApiKeyStore` have no production implementation (AGT-010, AGT-003) |
| OAuth discovery: protected resource metadata (RFC 9728) | `app/lib/agent/oauth-metadata.ts`, `app/app/.well-known/oauth-protected-resource/` | Real. Lists no authorization server until `AGENT_AUTH_ISSUER` set. AS metadata, authorize, token, register, revoke, consent page not built (AGT-010) |
| Policy engine `authorize()`, the 8 ordered checks of docs/integrations/02 section 5 | `app/lib/agent/policy.ts` | Real and table-tested. Needs `PolicyFacts` (quote, recipient) from stores that do not exist yet; without a quote, spend tools are refused (safe default) |
| Spend limits: per-card, monthly, cards per month, product allowlist, first-N, allowlist, cooling-off, anomaly flag | policy.ts | Real logic. Annual cap is in the grant type but not yet enforced (needs settled-spend data, AGT-021) |
| Rate limiting, model-spend pool, kill switches, abuse flags, audit, idempotency | `app/lib/agent/deps.ts` (interfaces), `memory.ts` (dev impls), `idempotency.ts`, `registry.ts` | Interfaces real; only in-memory impls. Production versions: SEC-07 limiter, SEC-10 cost ledger, AGT-003 tables |
| Text safety for assistant text (links, contact, money request, QR, injection phrases, IP fast pass) | `app/lib/agent/safety.ts` | Rules layer only; no model call. Belongs next to IP rules long term (AGT-014, gh-ip-safety) |
| Service handlers | `app/lib/agent/service.ts` | Real: `search_styles`, `get_quote` (uses `computeTotals`), `get_account_limits`. All others return `not_implemented` naming their ticket |
| Config / env | `app/lib/agent/config.ts` | Real. Env names in docs/cto/setup-needed.md |
| Tests | `app/tests/agent/agent.test.ts` (26) | Pass with the rest of the suite (435) |

Also touched: `app/proxy.ts` matcher now skips `/.well-known` (no guest cookie on discovery).

## Build order (maps to docs/integrations/07-backlog.md)

1. Owner decisions in "Open decisions" below, especially AGT-001 and the AS choice. Nothing past step 3 should start without them.
2. Prerequisites outside this channel: SEC-18 real accounts and Supabase auth adapter (agent routes refuse the fake auth in production), SEC-07 shared limiter, SEC-10 persistent cost ledger with reservations, SEC-21 render queue.
3. AGT-003 migrations (grants, clients, keys, approvals, audit append-only, idempotency, RLS tests). Then swap `memory.ts` deps for Postgres ones in `registry.ts`.
4. AGT-010 spike then authorization server (this is the long pole: 6 days, needs the Supabase OAuth server findings). Implement `TokenVerifier`, consent page, revocation, CIMD/DCR.
5. AGT-005 recipients + AGT-013 draft pipeline and preview, then AGT-015 quote parity (finish `resolveFacts`, `list_people`, `create_card_draft`, `preview_card`). Preview-fidelity decision gates cost per draft.
6. AGT-014 safety corpus, AGT-007 audit/Connected assistants UI, AGT-012 conformance with MCP Inspector and the client matrix (AGT-018).
7. P2: AGT-020 approval page (human session only, agent tokens rejected), AGT-021 stored card, AGT-022/023, AGT-025/026. P3 autonomy and rules last, behind the attorney gate.

## Open decisions (owner or other teams)

- Go/no-go and gating, $600/day planning rate (09 items 1 to 4). Agent model-spend pool default is $10/day in code (`AGENT_DAILY_MODEL_BUDGET_USD`).
- Default limits ($15 per card, $50 per month, $120 per year, 6 cards, first 3 per recipient, 24 h cooling-off). Coded as the proposed defaults in `GrantLimitsSchema`.
- Supabase OAuth server vs custom AS (AGT-010 spike). Whether `mcp-handler` 2.x can serve both protocol versions; if yes we may replace `lib/agent/mcp/protocol.ts`, keeping `dispatch.ts`.
- Protocol versions served: coded as 2026-07-28 and 2025-11-25 (from 06). Not verified against a live client; `ttlMs`/`cacheScope` caching fields on `tools/list` were left out until the spec text is checked.
- Preview fidelity (draft at final resolution vs verified upscale) decides cost per draft; the policy's draft cost estimate is a placeholder $0.25.
- Vercel function duration for the 20 second `preview_card` wait; hostname `mcp.greethub.com` and the issuer domain.
- Sandbox deployment policy (09 item 33): `GREETHUB_SANDBOX=1` currently enables memory deps and the fake-auth bypass; it must never be set where production secrets exist.
- Known gaps to resolve in review: a replayed idempotent request is re-authorized, so a replay at the daily draft limit is denied instead of replayed; the model-budget probe in policy and the real reservation in dispatch are two calls, not one atomic step (fine for the in-memory dev ledger, the SEC-10 ledger should expose a single reserve-with-check).
