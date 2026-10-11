# 03. Agent-initiated purchases: what is real, and how GreetHub should take payment

Evidence tags as in 01. The requirement from the owner: the card is paid for inside GreetHub, never inside the AI platform's billing.

## 1. Decision

Use **GreetHub's own Stripe account, a stored card, and human approval on greethub.com by default**. Do not build on agentic-commerce protocols now. Add autonomy only after the user opts in on the web. No prepaid wallet at launch.

Why this is also what the platforms require:
- ChatGPT: commerce for physical goods only, no credits or subscriptions, external checkout on the merchant's domain, nothing embedded, no direct links to checkout pages [V] https://developers.openai.com/apps-sdk/app-submission-guidelines .
- Claude directory: no software that executes financial transactions for users without written permission [V] https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy . If GreetHub's MCP tools never move money in the default mode (they only create an approval request, and the human pays on greethub.com), the listing risk is much smaller. Autonomy tools are hidden unless the user enabled them, and not exposed to Claude listings until Anthropic agrees in writing.
- MCP elicitation spec: servers must not collect payment credentials through form mode; payments use URL mode, out of band [V] https://modelcontextprotocol.io/specification/latest/client/elicitation .
- Gemini: manual confirmation for write actions anyway [V].

## 2. The agentic commerce landscape (what is real now)

| Standard / product | What it is | Status (evidence) | Fit for GreetHub | Decision |
|---|---|---|---|---|
| **ACP** (Agentic Commerce Protocol, OpenAI + Stripe) | Open standard (Apache 2.0) for agents and merchants to coordinate checkout and pass payment credentials; merchant stays merchant of record; to appear in ChatGPT you apply through OpenAI, listing is not automatic. ChatGPT is the first agent platform; Stripe the first processor | [V] https://www.agenticcommerce.dev/ . Instant Checkout reported scaled back March 2026 with under 30 merchants live; ACP continues [S]; OpenAI policy still says Instant Checkout is a beta for select partners [V] | Built around catalog feeds and inventory; personalised, render-on-demand cards do not fit; ChatGPT policy needs physical goods | Do not build. Re-check quarterly |
| **Stripe Agentic Commerce Suite** | Seller-side: upload a product catalog feed (product daily, inventory and price every 15 minutes), enable sales on named agents ("Request connection"), receive normal `checkout.session.completed`. Supports UCP or ACP. Available in the US, Canada and many European countries | [V] https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail . "Agents" side (embedding commerce into an AI interface) is private preview with a waitlist [V] https://docs.stripe.com/agentic-commerce | Retail catalog model; a generic "mailed card" SKU could be listed but without the personalised creation, so it would just be a link back to GreetHub | Later experiment only: list generic SKUs to get discovered, send the buyer to the creator |
| **Shared Payment Tokens (SPT)** | Stripe's scoped payment credential issued by an agent platform to a seller for one purchase | Referenced in Stripe's agentic docs [V]; detail page not readable in this fetch (index only) | Only relevant if an agent platform holds the buyer's card and pays GreetHub as a seller | Not needed; GreetHub keeps the buyer's own card |
| **Link Agent Wallet** (Stripe) | The customer's agent requests a **spend request** for a purchase; the customer approves; Link returns a one-time-use credential the agent uses to pay anywhere online. US and Canada customers | [V] https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet | This is buyer-side. If a customer uses it, their agent pays GreetHub's normal web checkout like any shopper. GreetHub does nothing special, except not blocking such browsers with bot checks on checkout | No work. Note for SEC-13: Turnstile on checkout may block agentic browsers; decide deliberately |
| **UCP** (Universal Commerce Protocol, Google, Shopify, Stripe, Etsy and others) | Open standard (Apache 2.0) for discovery through checkout; builds on REST, JSON-RPC, AP2, A2A, MCP; "expanding beyond retail" | [V] https://ucp.dev/ . Which agent surfaces support it: not stated on the page | Retail-shaped; watch for Gemini/AI Mode surfaces | Watch |
| **AP2** (Agent Payments Protocol, Google) | Spec for verifiable user mandates (intent and cart) so payments by agents are provable; reportedly donated to FIDO governance; v0.2 April 2026 | [S] https://www.paz.ai/glossary/agent-payments-protocol-ap2 , https://eco.com/support/en/articles/14845479-ap2-agent-payments-protocol-explained . Spec and governance effort, not a product that a small merchant integrates | Concept maps directly onto our grant object (an "intent mandate" is a signed spending limit). Keep the grant model exportable | Design for compatibility, do not build |
| **Visa Intelligent Commerce / Trusted Agent Protocol** | Network-level agent tokens and agent verification | Trusted Agent Protocol live since Oct 2025 [S]; Intelligent Commerce Connect in pilot; Agentic Directory announced June 2026 [S] https://usa.visa.com/about-visa/newsroom/press-releases.releaseid.22491.html | Reaches merchants through acquirers/Stripe, not by direct integration | Nothing to do now |
| **Mastercard Agent Pay** | Agentic tokens on existing tokenization; "agent started this transaction" probability score in U.S. testing | [S] https://www.mastercard.com/us/en/news-and-trends/press/2026/september/new-trust-and-intelligence-services.html (search result); general availability for U.S. merchants not stated | Same | Nothing to do now |
| **x402 / Machine Payments Protocol (MPP)** | HTTP 402 micropayments in USDC (x402, now under a Linux Foundation x402 Foundation) or rail-agnostic MPP (Stripe/Tempo) for agents paying APIs | Stripe supports both; Bernstein: MPP did $5,000 in first-week volume, x402 about $25M over 30 days [S] https://www.theblock.co/post/394615/circle-coinbase-seen-as-best-proxies-for-stablecoin-upside-as-agentic-payments-emerge-bernstein-says . Stripe lists them for "monetize your API" [V] | Wrong shape: consumer physical goods at $10.98, tax and refunds, no stablecoin users | Not now |
| **Amazon Wallet via Alexa+** | In-conversation checkout brand add-on | Mentioned in secondary coverage only [S] https://forkast.news/amazon-adopts-mcp-for-alexa-closing-the-smart-home-agent-commerce-loop/ | Evaluate in P4 when reading Alexa's Payments docs | Later |

Bottom line: what is **real and available now** is ordinary Stripe card payments (SetupIntent, off-session charges, Checkout) and MCP. What is **emerging or pilot** is every agent-specific payment protocol. Nothing in that column is needed for GreetHub to deliver "agent drafts, human approves, card is mailed, paid inside GreetHub".

## 3. Recommended payment flow

### 3.1 One-time setup (on greethub.com, never in the assistant)

1. User adds a card on the web: Stripe `SetupIntent` via Stripe Elements or a Checkout Session in `setup` mode. Card data never touches the assistant, MCP, or GreetHub servers (PCI scope stays at SAQ A; consistent with ChatGPT's ban on collecting PCI data [V]).
2. User ticks a mandate-style consent line, stored with version, time, IP and the card last4 (same pattern as the legal consent log, legal 06 item 4): "I authorize GreetHub to charge this card for cards I approve myself, and, if I turn it on, for cards my connected assistant sends within the limits I set. I can change limits or revoke at any time." Wording to the attorney (04).
3. User sets monthly cap and per-card cap (defaults $50 / $15, proposed). Caps are enforced by GreetHub; Stripe does not know them.

### 3.2 Default: draft, approve, pay, send (human in the loop)

```
Assistant                GreetHub (MCP/API)                 Human on greethub.com
   | create_card_draft ------->|                                  |
   |<-- draft_id, status ------|  (IP-safety, render job)         |
   | preview_card ------------>|                                  |
   |<-- preview image, text ---|                                  |
   | request_approval -------->| creates approval (48h expiry)    |
   |<-- approval_id, "sent" ---|--- push / email "Approve $10.98 card to Priya?" -->|
   |                           |<-- opens approval page (signed-in session) ---------|
   |                           |    sees exact image, printed text, recipient, address, price, tax
   |                           |<-- confirms address (first time), taps Approve & Pay |
   |                           | off-session PaymentIntent (idempotency key = approval id)
   |                           | webhook -> order -> 30-min hold -> printer submit
   | track_order ------------->|                                  |
```

Rules:
- The approval endpoint accepts only a human web session (cookie) with CSRF protection and a short-lived signed approval token; it rejects OAuth agent tokens and API keys. An agent cannot approve its own request.
- `GET` of the approval link never approves (email scanners prefetch links; docs/security R15 says the same for magic links). Approval is a `POST` after a click.
- The price shown is computed server-side with the existing `priceLine`/`computeTotals` (packages/shared/src/cart.ts) and `PRICING` so the agent channel can never undercut web prices, and tax is computed at payment (Stripe Tax, legal 06 item 34). The charge amount is fixed at approval time and compared to the quote; mismatch aborts.
- Strong customer authentication: US off-session charges usually succeed, but if the issuer demands authentication the PaymentIntent returns `requires_action`; the approval page then completes it on-session. [U, Stripe docs for save-and-reuse were not readable in this fetch; confirm in the sandbox.]
- Receipts and the proof-approval evidence (page hashes, timestamp, account id, IP, approval click) are stored exactly as for web orders (legal 06 item 32, 39). The approval page carries the same consent text: "I have reviewed and approve this proof..." and the AI-illustrated statement (legal 06 item 12).
- Refund and reprint policy link on the approval page and in the receipt (legal 06 item 38).

### 3.3 Optional: autonomy inside limits

Requires the user to enable `send_auto` on the web (02), complete a 24-hour cooling-off, pick an allowlist of recipients, and accept a stronger consent line. Then `approve_and_pay` may charge the stored card without a click if all of these hold:
- recipient is on the allowlist, address already confirmed, and at least N=3 earlier human-approved cards went to that recipient (first-N rule),
- amount within per-card cap, month-to-date + this card within monthly cap, year-to-date within annual cap, count within `maxCardsPerMonth`,
- text passes the stricter autonomous content rules (no URLs, phone numbers, money or gift requests, no new proper nouns beyond the recipient name; 04),
- no anomaly flag (burst, new client IP network, spend velocity, prior declined approvals).

Every autonomous order enters a **30-minute hold** before printer submission, with a push "Sent: thank-you card to Priya, $10.98. Undo". `cancel_order` and the push both cancel it, and the card is refunded in full. The hold doubles as the chargeback and fraud buffer. (Does the existing order state machine allow a hold before printer submission? To confirm in lib/shop/orderState.ts, AGT-022.)

### 3.4 Stored card vs prepaid wallet

| | Stored card, per-order charge (recommended) | Prepaid wallet / credits |
|---|---|---|
| ChatGPT policy | Fine (physical goods, external) | Banned: "tokens, and credits are not allowed" [V] |
| Legal | Standard card-on-file with consent | Stored value: possible state money-transmitter, unclaimed property and gift-card rules; legal 06 item 40 already says no gift cards/subscriptions without attorney review |
| Fees | $0.30 + 2.9% per charge, about $0.62 on $10.98 | Fee paid once on top-up, lower per card; but refund and breakage liability |
| Spend control | Caps enforced by GreetHub | Natural hard cap (balance) |
| Verdict | Launch | Revisit after P3 with the attorney, web-only top-up, never in an assistant |

A prepaid balance does give the best hard stop against runaway spend. The stored-card design reproduces that with explicit caps, and lets the owner avoid a regulatory project.

### 3.5 Digital items and books

`card_digital` ($3.99) and `book_digital` ($19.99) are digital goods: disallowed for purchase initiated through ChatGPT [V]. Policy: in P2 the agent channel sells **mailed cards only** (`card_mailed`). Books are excluded from agents in P1 to P3 (a book needs a human-approved model sheet by design, PLAN.md, and costs $44.99 to $54.99). Digital cards can be offered on Claude/Gemini connectors later if the attorney and platform terms allow (09).

## 4. Fraud and chargebacks specific to agents

- Stripe Radar rules for off-session charges on agent-created orders: block when the card was added less than 24 hours ago and the first order is an agent order above $15; review when shipping to an address in a different state from billing for the first order.
- Chargebacks on agent orders: because the approval page logs a human click, evidence is strong for default-mode orders. Autonomous orders have weaker evidence (consent text, activity feed emails, 30-minute undo window). Chargeback on an autonomous order drops the account to approval-only and flags the card fingerprint (docs/security/03 tier rules).
- Card testing: draft creation is free to the card but costs model money; approvals require a signed-in human session. There is no unauthenticated path that charges a card.
- Idempotency: Stripe idempotency key `agent-approval-<approval_id>`; printer `PrintJob.lineId` unique per line (types.ts) so retries cannot double-print.

## 5. Adapter changes (for 06)

`PaymentsAdapter` today has `createCheckoutSession` and `parseWebhook` (app/lib/adapters/types.ts). Add, with fake implementations for tests and the sandbox:
- `createSetupSession(userId, returnUrl)`: card save (web).
- `chargeSavedMethod({ customerId, paymentMethodId, amountCents, currency, description, idempotencyKey, metadata })`: off-session PaymentIntent, returns `succeeded | requires_action | failed`.
- `refund({ paymentIntentId, amountCents, idempotencyKey })`.
- Webhooks: handle `payment_intent.succeeded` / `payment_intent.payment_failed` with `metadata.approvalId`; reuse the verified signature path (stripeSignature.ts) and the SEC-19 unique event-id insert, `livemode` check and amount-mismatch alert before shipping this.

## 6. Sources

[V] https://docs.stripe.com/agentic-commerce ; https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet ; https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail ; https://www.agenticcommerce.dev/ ; https://ucp.dev/ ; https://developers.openai.com/apps-sdk/app-submission-guidelines ; https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy ; https://modelcontextprotocol.io/specification/latest/client/elicitation (all read 2026-10-11). [S]: AP2, Visa, Mastercard, x402 summaries and Instant Checkout status from search results listed above. The Stripe shared-payment-tokens page returned only an index and the save-and-reuse page only an index: those two details are [U].
