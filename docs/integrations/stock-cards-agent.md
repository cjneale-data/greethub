# Stock cards in the agent channel (design, 2026-10-16)

Status: design only. Owner request: "send a thank you to Priya" should pick a pre-generated stock card, not generate one. Builds on 05-tool-spec.md. Stock catalog, stock price and member-handwriting wiring are owned by the stock-templates work; names below are proposals to match to that code. No stock-card pricing doc was found in docs/ today ("not found").

## 1. Tool design: two new tools, existing approval path
Add to `packages/shared/src/agent/tools.ts` (TOOL_META) and `lib/agent/service.ts`; do not overload `create_card_draft` (it spends model money, stock does not).

| Tool | Scope | readOnly | destructive | idempotencyKey |
|---|---|---|---|---|
| `list_stock_cards` | cards:read | true | false | no |
| `create_stock_card_draft` | cards:draft | false | false | yes |

Everything after the draft is unchanged: `preview_card`, `get_quote`, `request_approval`, `track_order`, `cancel_order`, and P3 `approve_and_pay`. A stock draft is a normal Draft (`origin: assistant`, `source: "stock"`), so the approval page, caps and ledger need no second path. It reserves no model money, so it skips policy step 4 and is not counted against `maxDraftsPerDay` model-cost logic (it still counts toward a separate, larger `stockDraftsPerDay`, default 20).

## 2. What the assistant can and cannot choose
`list_stock_cards { occasion?, tone?, query?(<=80), limit? 1..12 }` returns `{ cards: [{ stockId, name, occasion, tone, blurb, thumbnailUrl, priceCents, supportsHandwriting }] }`. Only published, IP-reviewed templates; never a franchise name in `query` echoes (same rule as `search_styles`).
`create_stock_card_draft { idempotencyKey, stockId, recipient: PersonRef, message: {mode, text?, memory?}, writing?: {message: "typed"|"handwritten", signature: "none"|"typed"|"saved"}, mailTo? }`
- Can choose: template (from list), message text, typed or handwritten, signature on or off, recipient (by `personId`).
- Cannot choose: art, layout, price, paper, shipping method, quantity above 1, a custom hand or signature id (no `styleId` field; the server resolves the member's default), addresses, photos.
- Occasion and tone are not arguments on create; they are filters on list. The template fixes them.

## 3. Picking a template
The tool description says only: "Use list_stock_cards first, then pick one." Selection is the assistant's, but the server narrows it: list is ranked by exact occasion match, then tone, then `popularity`; with no match it returns the nearest `just_because`/`thank_you` cards plus `notes: ["no exact match"]`, and the assistant may offer `create_card_draft` instead (custom, costs model money, slower; see 05 section 5.6). Sympathy and get-well are listed but flagged `sensitive: true`; the assistant is told to confirm tone with the user (04 sensitive rules).

## 4. Message drafting limits
- Same pipeline as 05 section 4. `as_written` max 1200 chars is too long for stock layouts: each template returns `maxChars` (inside box); over it is `validation_failed` with the budget, never silent truncation.
- `compose` is the default when no text: one small copy call (about $0.0054), the only model money a stock card uses, reserved in the ledger.
- Screened as in 05: URLs, phone numbers, money requests, protected names, injection patterns (content_blocked, injection flag, 24 h require-approval). Untrusted calendar or email text may only enter as `memory` (300 chars), never copied into `text` without the user seeing it.
- Handwritten messages: a character the hand lacks returns `validation_failed` naming the character (PLAN.md handwriting rule); assistant must edit text.

## 5. Member handwriting and signature
- `writing` accepted only if the grant owner is a member (Plus) for saved signature or own handwriting; preset hands (8) and a typed signature work for any account. Otherwise `scope_insufficient` with "Handwriting and saved signatures are a Plus feature" (one sentence, no upsell push).
- If omitted and the member has "Use on every new card", the member's defaults apply (`resolveCardWriting`); the assistant is told in the response (`writing: {resolved: ...}`) but never receives ids of signature images or glyph sheets. It cannot upload, draw or change a signature.
- Signature is the member's own, applied only to their own cards. The approval page shows the exact rendered inside text and signature; the member approves what will print.

## 6. Approval page and spending limits
Unchanged flow (05 section 6, 02 section 5): draft, `preview_card`, `request_approval`, human approves and pays on greethub.com, address confirmed there. Per-card, monthly, annual, cards-per-month and recipient caps apply to the stock quote exactly as to custom cards (policy step 5). Product allowlist: add `stock_card_mailed` beside `card_mailed`; a grant without it gets `scope_insufficient`. The approval page shows "Ready-made card" and the template name so the owner can tell it from a custom card. Autonomy (`approve_and_pay`) stays P3 and opt-in; stock cards do not get a lower bar (first N to a recipient, allowlist, 30 minute hold all apply).

## 7. Price disclosure
`list_stock_cards` and `get_quote` (`product: "stock_card_mailed"`) return `priceCents`; the server computes it with the same `priceLine`/`computeTotals` and a stock entry in `PRICING` (owner approves the price, not the assistant or this doc). The assistant is told, in `create_stock_card_draft` output `quote`, the total including postage and `taxEstimated: true`, and must state it before `request_approval` (tool description: "Tell the user the price before asking for approval"). Price can never be passed in; mismatch at approval aborts (03).

## 8. Idempotency
Same rules as 05: `idempotencyKey` (<=80) plus hash of the arguments; replay returns the same `draftId` with `replayed: true`; same key, different arguments is `idempotency_conflict`. `request_approval` stays idempotent on `draftId`, so one stock draft yields one approval and one order. Template unpublished between list and create returns `not_found` with a one-line "pick another" message.

## 9. Stays gated
- Batch ("thank you to the whole team"): still out of scope; three drafts per request, approval each (05 section 8).
- Addresses: the assistant never sees them; an address it adds via `add_person` is unconfirmed and cannot be mailed to until the owner confirms on the web. Digital and express stock cards are not offered to assistants.
- Minors as recipients, photos, likeness: not available (stock cards have none).

## 10. While the agent channel is off
`AGENT_CHANNEL_ENABLED` is unset in production: `/api/agent/v1/*` and `/api/mcp` answer 503, so these tools do not exist for any assistant and nothing changes for customers. Build the two tools and tests (idempotency, scope, product allowlist, over-length message, non-member handwriting) behind the same flag, in-memory deps in tests only. The stock catalog and web ordering ship first; the agent tools are P1 work (after SEC-18, SEC-07, SEC-10; early 2027 at the earliest). Until then a user asking an assistant for a card gets nothing from GreetHub; the web stock-card flow is the only path.

## Open questions for the owner
1. Stock card price and whether free-tier postage rules differ (needs approval before `PRICING` entry).
2. Should members' defaults auto-apply to assistant orders, or require the assistant to ask each time? (Proposed: apply, show on approval page.)
3. Attorney: does a handwriting or signature applied by an assistant-initiated order change the signature-use position in Q43 (agent channel) and the handwriting question in PLAN.md?
