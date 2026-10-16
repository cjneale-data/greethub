# Stock cards: architecture (CTO, 2026-10-16)

Owner request: pre-generated cards for standard uses (thank you, birthday, ...). No AI at purchase. Customer edits the inside message. Members can add handwriting and a signature. Priced a little under AI cards. Later, an assistant picks one for "send a thank you to X". Sending must be very easy.

## 1. Findings that shape the design (read from code, 2026-10-16)
- `app/lib/shop/templates.ts` holds 12 marketing *templates* (cover art only, link to `/create/card?template=`). They are not stock cards: no inside text, no print art. Keep them; stock cards are a new catalog.
- Cart and pricing live in `app/packages/shared/src/cart.ts`: `CardCartItem` = `{creationId, format: mailed|digital, mailTo}`; `itemSku()` maps to `card_mailed` / `card_digital` in `PRICING.skus`. `priceLine`, `computeTotals`, checkout lines, order items and the order state machine all key off `creationId` + sku.
- `printAssets()` in `app/lib/shop/orderService.ts` is a TODO stub returning `{}`. No print PDF is stored per creation yet, for AI cards or any other. Stock cards depend on the same missing piece (see step 3).
- `layoutCard()` lives in `pipeline/src/layout/card.ts` (5x7 + bleed, front page then inside page, `CardWritingSpec`). Nothing in `app/` calls it yet.
- `resolveCardWriting(userId|null, CardWriting)` is ownership-checked and guest-safe; `writingOrderBlock()` (Plus gate for own handwriting and saved signatures) exists but nothing in cart or checkout calls it yet.
- Agent tools (`packages/shared/src/agent/tools.ts`) exist as specs; handlers in `lib/agent/service.ts` are stubs (AGT-013, AGT-020). `create_card_draft` is flagged `spendsModelMoney`.
- `Docs` registry (`lib/store/docs.ts`) is the single place for collections; each is a Supabase table with the same shape (`id, owner_id, refs, doc jsonb, version`).

## 2. Data model
Catalog is **content shipped in the repo**, not DB rows (about 40 cards at launch, reviewed by the owner before merge). Source: `app/lib/stock/catalog.ts` + art in `app/public/stock/<id>-{400,800,1600}.webp` and print masters in storage (`stock/<id>/front-print.png`, 1575x2175 at 300 DPI). Later move to a `stock_cards` collection if a non-developer needs to edit.

```ts
StockCard = { id, title, occasion, tone, styleId, altText,
  defaultMessage,            // pre-written inside text (<= the fit limit for the default font)
  messageSuggestions?: string[], // 2-3 alternates, one tap
  frontArt: { preview: string, print: string }, // print = storage key, never a public URL
  insideLayout: "message" | "message_art", insideArt?: string,
  status: "live" | "hidden", addedAt, ipReviewed: true } // ipReviewed gate (docs/legal/07)
```
Per-order customization is a **creation record**, new Docs collection `stock_creations` (owner = user, id `sc_<ulid>`):
```ts
StockCreation = { id, userId, stockId, message, writing?: CardWriting, // writing = same schema resolveCardWriting takes
  signOff?: string, status: "draft"|"ready"|"ordered", printKey?: string, messageFitted: boolean,
  screening: { ok: boolean, at }, createdAt, updatedAt }
```
Becomes a normal creation: its `id` is the `creationId` in the cart. Cart, checkout, order items and state machine stay unchanged. Add one optional field `source?: "ai"|"stock"` to `OrderItem` and `CardCartItem` (default "ai") so reports and support can split the two.

## 3. SKU and pricing hook
- `PRICING.skus` gets `stock_card_mailed` and `stock_card_digital` (owner sets numbers; suggest 100-200 cents under the AI card: AI is 799 mailed / 399 digital, so a starting point of 599 / 299; CFO to confirm, it is a price approval for the owner). Postage unchanged (299).
- `itemSku()` returns the stock SKU when `item.source === "stock"`. `sameLine`, `priceLine`, `describeItem` need that one branch; every other shared path reads sku generically. Add the SKUs to `Sku` type, Stripe line descriptions and tax code (same print code as cards).
- Server recomputes price from the SKU, never from the client (already the rule in `checkoutService`).

## 4. Rendering
- Front art is **pre-rendered once** by the design pipeline and approved (same gate as `docs/design/site-art`). No model call at purchase; mock mode needs no changes.
- At "ready" (add to cart) the server builds the print PDF: `resolveCardWriting(userId, writing)` then `layoutCard({title, message, frontArt: <print master>, writing})`. Output stored at `creations/<userId>/<id>/card.pdf`, key saved as `printKey`. This also gives `printAssets()` something to resolve for stock cards, and is the same hook the AI card needs.
- `layoutCard` lives in `pipeline/`; app imports it through a thin `app/lib/stock/render.ts` (same pattern the Vercel preview code uses for card previews, #19). Guest/preview PNG uses `guestProof`-style watermark.
- Message fit: `messageFitted` comes back from `layoutCard`; if false, the UI blocks "add to cart" and shows the character budget. Client shows live count against a fixed limit (about 420 characters, tuned by test).
- Screening: reuse `checkText` (writing) and `lib/safety` text screen on the message and sign-off before `ready`, server-side. Rejected text returns the plain "try a softer wording" message; nothing is logged with message content.

## 5. Handwriting and signature (members)
- Same `CardWriting` object as AI cards. Presets and typed signature are free for everyone; own handwriting and saved signatures need Plus via `writingOrderBlock()`.
- **Call `writingOrderBlock` in the stock cart-add route and again in checkout** (today nothing calls it, B4 gap). Paid orders are not re-checked at print.
- Guest sees the Plus perk in place on the editor (upsell, not a wall).

## 6. Digital vs mailed
- Digital: no printing. Sends an email (Resend) to the recipient with a link to a view page rendering front + inside from the same record; `StockCreation.status` -> ordered on payment. A `sentTo` hash, never plain email in logs.
- Mailed: `mailTo: "buyer" | "recipient"`. Existing Prodigi card path via `cardPrinter` with `printKey` PDF.

## 7. Recipient address and Saved People
- Reuse `people` (name, relationship, ageBand) and `addresses`. "Send to Sam" picks a Person, then the saved address, else one inline address form saved back to the person.
- Agent-added addresses stay `unconfirmed` until the owner confirms on the site (existing rule). Children: stock cards to a child recipient go to the parent address the buyer enters; no child data beyond first name.
- One page flow: pick card, edit message, pick person, pay. Target: three screens. Remember last sign-off and writing choice per user.

## 8. Agent tool mapping
No new tool needed for v1.
- `search_styles` extended to `search_cards` results (or new read tool `find_stock_cards`, scope `cards:read`, args `{occasion, tone?, recipientPersonId?}`; returns id, title, preview URL, default message).
- `create_card_draft` gets optional `stockId` + `message`. With `stockId` it makes a `StockCreation`, **no `spendsModelMoney`**, so it skips the spend gate in `policy.ts` and the model ledger. Policy must derive that from args, not the static tool flag (small change in `authorize`).
- `get_quote` / `preview_card` / `request_approval` unchanged: approval is always the user's (`cards:request_send`); `approve_and_pay` (phase 3) only inside the user's limits. Text args go through `screenAgentText`.

## 9. Migrations and registry
- `supabase/migrations/20261017000000_stock_creations.sql`: same table shape as memberships (id, owner_id, refs, doc, version, RLS on, revoke from anon, authenticated).
- `lib/store/docs.ts`: add `stock_creations: StockCreation` to `Docs` and an `INDEX` entry (`owner: d.userId`). Add to the delete-account sweep and data export (`removeByOwner`).
- Storage bucket path for print PDFs follows the privacy purge rules; messages count as customer content.

## 10. Test plan
Vitest: pricing (stock vs AI, quantity, postage), `itemSku` branch, cart merge rule, message fit limit, screening rejects, `writingOrderBlock` for guest/free/Plus, ownership (user B cannot use user A's signature), order state path unchanged, account deletion removes creations, policy skips spend gate for stock. Playwright (gh-qa): browse, edit message, add, checkout in fake mode, order visible. Print file check: PDF is 2 pages at 5x7 + bleed.

## 11. Build sequence
| # | Step | Size | Mock mode now? |
|---|------|------|---|
| 1 | Catalog type + 6 placeholder cards + browse page `/cards` | M | yes |
| 2 | `stock_creations` collection, migration, service, screening, fit | M | yes |
| 3 | Print PDF render + store + `printAssets()` for creations (shared with AI cards) | L | yes (fake printer) |
| 4 | SKUs, `source` field, pricing + checkout branch, tests | S | yes |
| 5 | Editor page with message, suggestions, handwriting and signature, Plus gate | M | yes |
| 6 | Saved People send flow, digital email view | M | yes |
| 7 | Agent: `find_stock_cards`, `stockId` on `create_card_draft`, policy tweak | S | stubs until AGT-013 |
| 8 | Real art for about 40 cards (design pipeline), IP review | L | no, needs model spend or an artist; owner sets a cap |
| 9 | Price numbers, real Prodigi submission | S | owner approval and Prodigi key |

Open owner asks: stock card prices; art budget (about $0.25 per 2K front, so 40 cards is roughly $10 with retries); who approves the catalog.
