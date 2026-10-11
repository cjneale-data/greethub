# 00. Recommendation: letting customers use their own AI assistant to order GreetHub cards

Author: Integrations Architect. Date: 2026-10-11. Scope: research and design only (no app code, no paid model calls). Evidence tags: [V] primary page read on 2026-10-11, [S] secondary or search-result summary, [U] unverified or my estimate. "Not found" means I looked and did not find it. Companion files: 01 platforms, 02 auth, 03 payments, 04 safety/privacy/legal, 05 tool spec, 06 architecture and roadmap, 07 backlog, 08 financial inputs, 09 open questions.

## Is it an MCP service?

Yes, but MCP is the front door, not the whole building. Build three things, in this order of importance:

1. **One canonical GreetHub agent API** (`/api/agent/v1`, Zod schemas in `packages/shared` as the contract, OpenAPI generated from them). Every rule lives here: scopes, caps, recipient checks, idempotency, IP-safety, audit. MCP and everything else are thin skins on it.
2. **A remote MCP server** (Streamable HTTP, OAuth 2.1) over the same service functions. This is the only integration surface that ChatGPT, Claude, Gemini, Perplexity, Copilot Studio and Alexa+ all consume today. [V] ChatGPT apps, [V] Claude connectors, [V] Gemini custom apps, [V] Copilot Studio, [V] Alexa+ MCP toolkit, [S] Perplexity.
3. **A GreetHub-hosted approval page** (plus push and email) where the human sees the exact card, recipient and price and pays. This is not optional decoration. It is the payment and consent surface, and it is what keeps GreetHub compliant with platform rules, because ChatGPT bans credits and digital goods and embedded third-party checkout, and Claude's directory bars software that executes financial transactions without written permission (details in 01 and 03).

Corrections to the working assumption:
- An OpenAPI "actions" description is low value for ChatGPT today: current ChatGPT docs describe MCP-based apps, and I found nothing current on GPT Actions (not found). OpenAPI is still worth generating because it is nearly free from the Zod contract and Copilot Studio custom connectors, Power Platform, Zapier/Make and Shortcuts consume it [V Copilot Studio].
- App/widget UI (MCP Apps extension) is a nice preview display on Claude, ChatGPT and Alexa+ [V], but it must not be the approval surface. Put "Approve" on a greethub.com page. Widgets are phase 4.
- Siri is not MCP. iOS 27 Siri uses App Intents [S MacSparky]; that needs a native iOS app GreetHub does not have. Near-term Siri/voice route: the user's ChatGPT/Claude/Gemini app on the phone, or an iOS Shortcut calling the REST API with a personal key.
- Agentic commerce protocols (ACP, UCP, AP2, Visa/Mastercard agent tokens, x402/MPP) are real but built for catalog retail and API micropayments, still pilot or limited, and none is needed to make this work. Do not build on them now (03).

## What to build, in order

| Phase | What | Person-days (06) | Gate to start |
|---|---|---|---|
| P0 | Security prerequisites (SEC list below) plus agent identity, grants, policy engine, recipient model, audit | 37 (already in security backlog) + 20 new | Owner approves this plan; attorney engaged |
| P1 | OAuth for agents, REST + MCP read/draft tools, draft previews, sandbox, public dev docs | 37.5 | P0 done; Supabase auth live |
| P2 | Approve-and-pay: approval page, stored card, off-session charge, caps, cancel/track | 29 | P1 shows real use; attorney review of agent terms |
| P3 | Standing rules, proposal inbox, API keys, optional autonomy | 19 | P2 stable for 60 days; abuse scoring live (SEC-30) |
| P4 | Directory listings (ChatGPT, Claude), MCP Apps widgets, Alexa+, Copilot connector | 24 | Written platform confirmations (below) |

Incremental build about 130 person-days (about $65k to $117k at a $500 to $900 day, 08). Stop after P1 if connected-account demand is nil.

## Defaults that make it safe

- **Human approval by default.** Agent drafts, GreetHub shows the preview, the human approves and pays on greethub.com (push, email, or link). Autonomous sending is a separate opt-in made on the web, never by a tool call, limited by per-card cap, monthly and annual caps, a recipient allowlist and a 24-hour cooling-off.
- **Pay with a stored card, not a wallet.** Stripe SetupIntent plus off-session charge, with GreetHub-side caps. No prepaid balance at launch: stored value needs attorney review (legal 06 item 40 spirit) and ChatGPT bans in-app credits [V].
- **Agents never see addresses.** `list_people` returns names and a "has confirmed address" flag. New addresses are confirmed by the owner on the approval page. This cuts the data-leak and send-to-attacker legs of a prompt-injection attack.
- **No photo tools at all.** Children's likeness only through saved People the owner marked agent-usable on the web, and not in P1 (04, legal 02).
- **GreetHub gets only the brief the agent chooses to pass.** No calendar access, no attendee lists, no meeting titles required. Server-side redaction strips emails, phones and URLs.

## Security tickets that must be done first (from docs/security/06-backlog.md)

Before any public MCP URL: SEC-01, 02, 03, 04, 16, 18 (real auth and RLS), 07, 08. Before drafts are open to real users: SEC-05, 06, 10, 11, 13, 14, 15, 21, 22, 24. Before payments: SEC-12, 19, 23, 25, 09. Before autonomy: SEC-30, 31, 40.

## Biggest risks

1. **Platform policy mismatch** (highest). ChatGPT permits commerce for physical goods only and bars credits [V]; Claude's directory policy bars software that executes financial transactions and AI image generation services unless Anthropic agrees in writing [V]. GreetHub is both a purchase and an AI-art generator. Custom/developer-mode connections work regardless; directory reach does not until confirmed. Ask in writing before spending on P4.
2. **Prompt-injection spend and spam.** Mitigated by approval-by-default and the design in 04, but drafts cost real model money (about $0.07 to $0.25 each, 03 security doc), so draft quotas are mandatory.
3. **Demand is unproven and the direct margin is small** (about $3 to $4 per mailed card, finance README). The case is distribution without CAC and repeat use, not margin. Gate P2+ on P1 usage.

## Decisions the owner must make (full list in 09)

Approve the phase gates and budget; approve stored card over wallet; approve "children's likeness never via agents in P1"; authorize written questions to OpenAI and Anthropic about commerce and AI-art policy; engage the attorney on agent terms and recurring authorization.
