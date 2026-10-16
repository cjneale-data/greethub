# Integrations review, 2026-10-15

Owner: gh-integrations. Sources: docs/PLAN.md, docs/integrations/00-09 and contacts-import.md, code in app/lib/agent, app/app/api/agent, app/app/api/mcp. I did not run tests or re-read platform policy pages today (last read 2026-10-11).

## Verdict
The agent channel is a built but dark framework. It is NOT on the November 2026 launch path. P1 starts only after SEC-18, SEC-07 and SEC-10, so early 2027 at the earliest.

## Done vs plan (06 roadmap, 07 backlog: P0 20d, P1 37.5d, P2 29d, P3 19d, P4 24d)
- Planning set 00-09 written: recommendation, platform landscape, auth, payments, safety/legal, tool spec (16 tools), architecture, backlog (AGT-001..), financial inputs, open questions.
- P0/P1 code framework committed (4f92808), flagged off by AGENT_CHANNEL_ENABLED: auth, keys, idempotency, policy (caps, ledger, pause), safety, memory, dispatch, service, registry, REST dispatcher, MCP protocol and tools, oauth metadata. Earlier hardening fixes are listed in PLAN.md (Integrations section); unit tests for the agent code were passing at that time (461/461 total). Not re-run today.
- Not built: AGT-002 shared contract package (packages/shared/src/agent*), openapi.json (AGT-011), approval page (P2), sandbox, developer docs, async preview job pattern.

## Status by item
- Agent API (/api/agent/v1/[tool]): framework only, dark. Needs Supabase (SEC-18) for real grants, audit and spend ledger.
- MCP server (/api/mcp): thin, correct, dark. Open fixes: RFC 9728 path-form metadata, Origin check and OPTIONS, no mcp.greethub.com rewrite, no per-IP limit before authenticate(). supportedProtocolVersions lists 2026-07-28, unverified against modelcontextprotocol.io.
- OAuth: protected-resource metadata exists. No authorization server chosen (AGT-010 spike: Supabase OAuth server vs custom). No platform can connect, so no connector test has been run. Definition of done is NOT met.
- Directory listings: none submitted, none allowed to be assumed. AGT-001 not done: docs/integrations/answers/ does not exist, so the written questions to OpenAI and Anthropic (mcp-review@anthropic.com) are unsent or unfiled. P4 is blocked on them. OpenAI "no direct checkout link" rule and Anthropic Directory Policy 4A/4B are the open risks.

## Launch path
- On: nothing from this channel.
- Off: agent API, MCP, OAuth, approval page, directory listings, assistant ordering, wallet (optional AGT-035, not recommended).
- Gate to continue past P1: 25 connected beta accounts and 100 drafts (09 item 1).

## Contacts import (contacts-import.md, PROPOSED)
- Phase 1 (Christmas 2026): CSV and vCard only, in app/lib/recipients (shop engineer). No live contacts integration. This is the only part on the launch path.
- Phase 2 (Jan to Mar 2027): Google People import (contacts.readonly, incremental consent) only if Phase 1 shows demand and the owner accepts Google OAuth verification (scope class unverified). Request: ImportPreview["source"] must accept "google".
- Apple: vCard export only. Agents never see addresses.

## Economics
About $3.3 contribution per card; the P0+P1 build (about $34,500 at $600/day) does not pay back from margin inside 36 months. Judge it on CAC avoided and connected-account growth (09 item 3).

## Owner actions
1. Approve or edit the 09 defaults (go/no-go for P0+P1, $10/day agent model pool, default limits).
2. Send the platform questions (09 items 15-16) and file answers in docs/integrations/answers/.
3. Engage the attorney: agent terms addendum, card-on-file, autonomy, children's likeness via assistants (items 21-27).
4. Open platform developer accounts (item 20).
5. Choose the OAuth authorization server (AGT-010) and provide Supabase (SEC-18).
6. Decide whether to approve Google contacts verification after Phase 1 data.

## Needs from teammates
- gh-security: SEC-18, SEC-07, SEC-10, sandbox policy vs fake-provider rule.
- gh-shop-engineer: orderState cancel/defer, "google" import source.
- gh-cto: AGT-002 contract package. gh-devops: Vercel limits for the 20 s preview wait.

## Open policy questions
09 items 13-19, 28-35 are unresolved. Changes in OpenAI/Anthropic directory rules since 2026-10-11 are unchecked.
