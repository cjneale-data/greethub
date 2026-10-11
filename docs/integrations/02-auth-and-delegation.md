# 02. Authentication and delegation: linking a GreetHub account to an agent and limiting what it may do

Evidence tags as in 01. Everything under "Proposed" is a design recommendation, not a researched fact. Prerequisite: real accounts (SEC-18) and the production auth guards (SEC-01, 02, 03). Today the app uses a stand-in cookie auth (docs/security/00-assessment.md R1, R2); no agent token may ever be issued against it.

## 1. Who is who

| Role | Who | Notes |
|---|---|---|
| Resource owner | The GreetHub customer | Signs in with the normal GreetHub login (magic link or Google) |
| Agent client | ChatGPT, Claude, Gemini, Perplexity, Copilot, a script | Identified by OAuth `client_id` (a CIMD URL, a DCR-issued id, or a GreetHub-issued id) |
| Authorization server (AS) | GreetHub | Supabase Auth can act as an OAuth 2.1/OIDC provider with DCR for MCP clients and PKCE; the consent screen is ours to build; token lifetimes and revocation are not stated on the page; CIMD not mentioned [V] https://supabase.com/docs/guides/auth/oauth-server . Spike needed (AGT-010): confirm CIMD, scopes beyond openid/email/profile, refresh rotation, revocation, JWT audience from `resource`. Fallback: a small purpose-built AS in the Next app. |
| Resource server | `/api/mcp` and `/api/agent/v1/*` | Validates every token: signature, `iss`, `aud` (must equal the MCP URL), `exp`, scopes, grant still active |

The MCP spec requires the resource server to accept only tokens issued for it, and forbids token passthrough [V]. GreetHub never forwards the agent's token to Stripe, printers or model vendors.

## 2. OAuth for interactive assistants (ChatGPT, Claude, Gemini, Perplexity, Copilot)

Requirements, with sources:
- Authorization code flow with PKCE S256, `resource` parameter in authorization and token requests, RFC 9728 protected resource metadata, RFC 8414 AS metadata advertising `code_challenge_methods_supported: ["S256"]`, `authorization_response_iss_parameter_supported: true` (so ChatGPT can use its stable redirect URI). [V] MCP authorization spec; [V] OpenAI auth page.
- 401 on unauthenticated MCP requests with `WWW-Authenticate: Bearer resource_metadata="https://mcp.greethub.com/.well-known/oauth-protected-resource"` and a `scope` hint; Claude ignores the header on a 200. [V] Claude auth page.
- `resource` in the metadata must equal the URL the user typed, including path (Claude) [V]. Serve the MCP endpoint and AS discovery on hosts reachable from the platforms' egress ranges (Anthropic `160.79.104.0/21` [V]); do not put a WAF rule in front of the AS that blocks them. Do not require Turnstile on OAuth or MCP endpoints; bots are the intended callers and quotas replace the CAPTCHA.
- Client registration: support **CIMD first** (ChatGPT prefers it; Claude uses it if the AS advertises it and `none` as a token auth method), **DCR as fallback** (Gemini and Copilot Studio use DCR, with manual credentials as the other option [V]). DCR creates a client per connection (Claude warns of very large client counts [V]); rate-limit `/register` and expire unused clients after 30 days. CIMD fetching is an SSRF risk (the AS fetches an unknown URL): block private IP ranges, cap size, follow no redirects to private space, per MCP security best practices [V].
- Exact redirect URI matching only (ChatGPT: `https://chatgpt.com/connector_platform_oauth_redirect` [V]; Claude hosted: `https://claude.ai/api/mcp/auth_callback`, Claude Code loopback any port [V]).
- Endpoints must answer within 10 seconds (Claude) [V].

### Client trust tiers (proposed)

| Tier | Client | Max grantable mode |
|---|---|---|
| Known | Allowlist of well-known platform client ids/CIMD domains (ChatGPT, Claude, Gemini, Perplexity, Microsoft, Amazon) that GreetHub verified | send_with_approval; autonomous only if the user opts in on the web (P3) |
| Registered | Developer-registered clients (via a developer console, P3+) | send_with_approval |
| Unknown | Anything that arrives through DCR/CIMD without being on the allowlist | draft_only plus approval requests, never autonomous; consent page shows a bold "unverified app" notice with the redirect host |

The consent screen always shows: the client name and domain, the redirect host, the permission mode, plain-language limits, what the app can and cannot see (e.g. "cannot see saved addresses or photos"), and a Revoke explanation. It is served with `frame-ancestors 'none'` and CSRF protection, per the MCP security guidance for consent pages [V].

### Token lifetimes (proposed)
- Access token: 60 minutes, JWT, `aud` = MCP resource URL, carries `sub`, `client_id`, `grant_id`, `scope`. Claude refreshes up to 5 minutes before expiry and on a 401 [V].
- Refresh token: rotating (required for public clients per the MCP spec; Claude expects `invalid_grant` on dead tokens [V]); idle expiry 30 days, absolute 180 days for draft/approval grants.
- Autonomous grants: absolute 90 days, then re-consent on the web (step-up).
- Authorization code: 60 seconds, single use.
- Server loads current grant limits from the database on every call. Limits are never trusted from the token, so a change or revoke takes effect immediately. Revocation: RFC 7009 endpoint plus the "Connected assistants" page; revoking kills refresh tokens, access tokens (check `grant.revoked_at` on each request, cached at most 15 seconds), pending approvals created by that grant (optional checkbox), and standing rules owned by that grant.

### Scopes (proposed)

| Scope | Allows | Tools |
|---|---|---|
| `cards:read` | Styles, People names, orders, limits | search_styles, list_people, get_quote, get_account_limits, list_orders, track_order |
| `cards:draft` | Create and revise drafts (spends model money, no purchase) | create_card_draft, revise_card_draft, preview_card, add_person |
| `cards:request_send` | Ask the human to approve and pay | request_approval, cancel_order (own pending) |
| `cards:send_auto` | Pay within grant limits without a per-card human click | approve_and_pay |
| `rules:manage` (P3) | Propose standing rules (human confirms on web) | propose_standing_rule, list_standing_rules, pause_standing_rule |

Scopes are minimal by default: the initial `WWW-Authenticate` challenge asks for `cards:read cards:draft cards:request_send`; `cards:send_auto` is only ever obtained through a step-up consent that the user starts on greethub.com, not by a client request. This matches the MCP scope-minimization guidance and the `insufficient_scope` 403 step-up flow [V]. tools/list returns only tools the token's scopes allow (spec permits this) [V]; this also keeps Claude reviewers and ChatGPT annotation checks simple.

## 3. Grant modes (what the user picks on the consent screen)

| Mode | What happens | Default |
|---|---|---|
| Draft only | Agent creates drafts and previews. Nothing is bought. User finishes on greethub.com | |
| Draft and ask me (`send_with_approval`) | Agent drafts, then requests approval. Human approves and pays on greethub.com via push, email or link | **Default and recommended** |
| Send within limits (`autonomous`) | Agent may approve and pay itself for allowlisted recipients inside caps. Opt-in only, made on the web, with a 24-hour cooling-off before it first works | Off |

Grant limits object stored in GreetHub (columns in AGT-003), shown and editable on the account page at any time:

```json
{
  "grantId": "grt_...", "userId": "...", "clientId": "https://claude.ai/...",
  "mode": "send_with_approval",
  "limits": {
    "perCardCents": 1500,
    "monthlyCents": 5000,
    "annualCents": 12000,
    "maxCardsPerMonth": 6,
    "maxDraftsPerDay": 10,
    "newRecipientsPerDay": 3,
    "recipientAllowlist": ["per_..."],
    "occasionAllowlist": ["thank_you", "birthday"],
    "requireApprovalFirstNPerRecipient": 3,
    "productAllowlist": ["card_mailed"]
  },
  "createdAt": "...", "expiresAt": "...", "revokedAt": null, "autonomyEnabledAt": null
}
```

Defaults (all proposed, owner to confirm): per card $15 (a mailed card is $10.98 including postage; room for Express $8.99 is not included, so express is blocked for agents), monthly $50, annual $120 for autonomy, max 6 cards a month, books excluded from agents in P1 to P3 (a book is $44.99 to $54.99 and takes a model-sheet approval, which is a human step by design, PLAN.md), digital SKUs excluded from the ChatGPT client (platform rule, 01).

## 4. Per-agent API keys for headless agents and scripts

Why: ChatGPT cannot use API keys [V], but other headless agents can: calendar bots, Zapier/Make/n8n, iOS Shortcuts for a Siri-style voice trigger, Copilot Studio (API key supported, header form) [V], Perplexity (API key option) [S], Claude static headers (beta, limited orgs) [V].

Proposed design:
- Keys are created by a signed-in user on greethub.com ("Settings > Connected assistants > Create a key"), named, with the same grant limits object as OAuth. One key = one grant = one agent identity.
- Format `ghk_live_<32 random bytes base64url>` / `ghk_test_...` for the sandbox. Shown once, stored as SHA-256 hash with a short prefix for lookup, never logged. Sent as `Authorization: Bearer ghk_...` (never in a URL or query string, which Copilot Studio's UI would otherwise allow [V]).
- Keys default to `draft_only` plus approval requests. A key cannot be granted `cards:send_auto` until the user completes the same step-up consent and 24-hour cooling-off as OAuth.
- Expiry default 1 year; optional IP allowlist; last-used timestamp and IP network shown; rotation by creating a second key then deleting the first; one-tap revoke; keys appear in the same activity feed and kill switch.
- Keys cannot call the human approval endpoints (they are a different surface, 03).
- Leaked-key handling: enable GitHub secret scanning partner format (prefix `ghk_`) later; rate-limit failed auth by IP network; alert on first use from a new ASN [U].

## 5. Limiting what an agent may do: the policy engine

A single server-side function `authorize(ctx, tool, args)` runs before every tool (AGT-006). Inputs: grant, client tier, user state, global kill switch. It returns allow, require_approval, or deny with an error code from 05.

Checks in order:
1. Kill switches: global `ai_mode` (SEC-08), agent-channel pause, user's "pause all assistants".
2. Scope for the tool; grant not expired or revoked; user account in good standing (not held by abuse score, SEC-30).
3. Quotas and rate limits (SEC-07): per grant, per client, per user, per IP network. Proposed: reads 120/min, writes 20/min, drafts 10/day and 60/month per grant on the free tier, approvals requested 20/day.
4. Spend: reserve against the cost ledger (SEC-10) before any model call, pool `agent`; a separate budget pool so agent traffic cannot starve web customers (and vice versa). Draft cost is real money: a 2K card front plus inside costs about $0.22 to $0.25 (docs/security/03 section 1).
5. Money: per-card cap, monthly and annual caps (sum of settled plus pending), card count, product allowlist, shipping method.
6. Recipient rules (04 section 3): recipient must be a saved Person of this user; address must be confirmed; allowlist; velocity.
7. Content rules: IP-safety screen, sensitive-content rules, URL/phone/money-request blocklist on printed text.
8. Mode: if mode is not autonomous, or the recipient is new, or it is among the first N for this recipient, or any anomaly flag is set, return `require_approval`, which makes `approve_and_pay` fail with `approval_required` and points to `request_approval`.

Every decision (allow, deny, require_approval) is written to the audit log with reason codes (04 section 6).

## 6. What the user sees and controls

- **Connected assistants** page: each grant with client name, mode, last activity, month-to-date spend vs cap, edit limits, revoke. Global "Pause all assistants" button.
- **Activity feed** (also emailed weekly): time, assistant, action, card thumbnail, recipient first name, amount, result.
- **Notifications:** every new connection (email), every approval request (push or email), every autonomous send (push, with a 30-minute undo hold, 04), every cap reaching 80 percent.
- **One-tap revoke** from the push notification and from any email footer ("Not you? Revoke this assistant").

## 7. Open technical points (AGT-010 spike)

1. Supabase OAuth server fit: CIMD, custom scopes, per-grant claims, rotating refresh tokens, revocation endpoint, custom domain on the AS issuer so Claude's single `authorization_servers` entry is stable.
2. How the MCP resource server learns `grant_id` (custom claim vs introspection).
3. Whether `mcp-handler` 2.x can serve 2025-11-25 clients (Alexa+) alongside 2026-07-28 [01].
4. ChatGPT's linking UI requires `_meta["mcp/www_authenticate"]` on a tool error plus `securitySchemes` per tool [V]; Claude requires a real HTTP 401. Implement both.
