# Batch orders: quantities, volume pricing, envelopes, addressing, ship-to-me vs mail-for-me

Shop engineer, 2026-10-15. Status: PLAN for wave 2. Nothing here is built outside `app/lib/recipients/` (code and tests exist) and no existing file was edited. Inputs: `docs/products/photo-cards-and-events-plan.md` (4.4, 4.5), `docs/cto/photo-events-architecture.md` (sections 2, 3, 5, 7), `docs/finance/photo-events-pricing.md` (CFO proposal, **not approved**, print costs assumed), `docs/products/photo-events/pm-roadmap.md`, `docs/security/photo-events-threats.md`, `docs/privacy-ops/photo-events-data.md`.

Not legal or tax advice. Sales tax on postage and the postage pass-through treatment are open with finance ops and the attorney.

## 1. What exists today (read from the repo)

- `packages/shared/src/cart.ts`: `CartItem = CardCartItem | BookCartItem`; `MAX_QUANTITY = 10` for every kind; `priceLine(item)` is `(unit + addon) * q` with `postageCents` per unit from `PRICING.skus`; `sameLine` merges identical lines; `computeTotals` adds one express surcharge per order; tax is a 0 placeholder.
- `lib/shop/checkoutService.ts`: `CheckoutInputSchema` takes `shipments: Record<cartItemId, address>` and validates each printed item with `validateAddress` (PO boxes refused, US only). `buildCheckoutLines` emits a product line and a postage line per item. `PendingCheckout.shipTo` is one address per item.
- `lib/shop/types.ts`: `OrderItem` has `shipTo?: Address`, one `fulfillment` (printer, externalId), `quantity`, `productCents`, `postageCents`. `Order.totals` has subtotal, postage, method, tax, total.
- `lib/shop/orderService.ts`: `toOrderItem`, `createOrderFromCheckout`, `submitOrder` (one printer job per item), `scrubOrder` (waits for the order to close), `applyPrinterWebhook` (finds an order by `fulfillment.externalId`).
- `lib/adapters/types.ts` `PrinterAdapter`: one job, one ship-to address. The CTO adds a sibling `FlatCardPrinter` (section 5 of the architecture) rather than bending it.
- `lib/shop/fulfillmentOps.ts`: holiday cutoffs by kind and shipping method.

## 2. What `app/lib/recipients/` gives the shop (built, 44 tests)

| Need | Function | Notes |
|---|---|---|
| Parse a pasted or uploaded list | `importCsv(text, {existing})`, `importVCard(text, {existing})` | Return an `ImportPreview`: per-row `ok / error / duplicate / skipped`, row numbers, cleaned draft, plain-language errors and warnings. Nothing is saved. |
| Save the good rows | `commitImport(list, preview, {keepDuplicateRows, onlyRows})` | Re-validates every row from its fields (the preview travels through the browser), forces `source`, replaces a bad or taken id, re-checks duplicates against the list as it is now, enforces the 500 cap. |
| Edit by hand | `addRecipient`, `updateRecipient`, `removeRecipients`, `newList`, `renameList` | A move clears the postal check; an unchanged address keeps it. Duplicates (same mailbox however typed) refused unless `allowDuplicate`. |
| Freeze at checkout | `snapshotRecipients(list, ids, {maxRecipients})` | Returns `RecipientSnapshot` (id, household line, address only: no email, names, tags). Fails with lists of `missing`, `invalid`, `undeliverable`. |
| Scrub after close + reprint window | `scrubSnapshot(snapshot)` | Keeps ids and country for audit, empties names and addresses. |
| Envelope text | `formatEnvelope`, `formatReturnAddress`, `formatAddressBlock`, `blockText` | `standard` (as typed, handwriting-friendly) and `usps` (Publication 28 style for a mail partner). Warns on long lines (A7 area: about 40 characters, 6 lines). |
| Export | `exportCsv(recipients)` | Formula guard (`= + - @` tab CR), BOM, CRLF. Re-import strips the guard, and `exportCsv` re-adds it (tested round trip). |
| Size gates | `importSizeError(bytes, kind)` | The route calls this with `Content-Length` / `file.size` **before** reading the body; the importers call it again on the text (bytes, not characters). Also: 1,000 rows, 100 cells per CSV record, 50,000 vCard lines, 20,000 vCard blocks. |

Data minimization built in: phone numbers are never imported, stored or exported; vCard keeps only FN, N, ADR and EMAIL; the model has no phone field. Emails are optional (for digital save the dates and reminders later).

Decisions where the sources disagree:
1. **List cap is 500** (CTO section 2). The security doc quotes 1,000; if security wants 1,000 it is one constant (`MAX_LIST_SIZE`). 500 is above the largest order (300).
2. `RecipientList.userId` (not `ownerId`) so the DocStore owner index reads the same field name as orders and checkouts.
3. Types follow the CTO sketch with two deliberate differences: `householdName` and `names[]` instead of `household/first/last` (the envelope line is what we print; people are for guest counts), and `address` is required (an entry without a mailing address cannot be on a list; digital-only guests arrive in Phase 3 via `Guest`).
4. The CTO `validation` field is kept (`unchecked | valid | corrected | undeliverable`, with `at` and `provider`). Nothing sets it yet; the `AddressValidator` interface and its fake belong in `lib/adapters/` in wave 2 (section 8).

## 3. Batch quantities

- A new cart union member `photo_card` (CTO section 2): `creationId` = design id, `designVersion`, `product`, `sizeId`, `quantity`, `paper`, `envelopes`, `delivery`.
- **Quantity is per kind.** `MAX_QUANTITY = 10` stays for cards and books (books are one-off gifts; the cap limits abuse). New constants in `cart.ts` or `pricing.ts`: `BATCH_MIN = 10`, and `maxQty` per product from the CFO config (holiday 200, others 300). PM roadmap Phase 1 allows only 25 / 50 / 100: enforce it with a Phase 1 allow-list in config (`phase1Quantities`), not in code paths.
- **Mail-for-me quantity is derived**: `recipientIds.length + extras`, where extras is 0 to 20 (cards the sender keeps). The server recomputes it; the client's number is never trusted.
- `sameLine` for batch lines: same `creationId`, `designVersion`, `sizeId`, `paper`, `envelopes` and delivery mode. Mail-for-me lines never merge (different recipient sets); ship-to-me lines merge by adding quantity up to the max.
- **Freeze at add-to-cart**: write `design_versions/<designId>@<v>` (CTO section 3). The cart line stores `designVersion`; editing the design afterwards creates version v+1 and the cart line keeps showing v until the customer re-adds. Cart shows a "Changed since you added it. Update?" notice.
- Proof gate: a batch line is `needsAttention` until the full-size proof is approved and the "I checked names and dates" tick is stored with the version (PM Phase 1 criteria). The existing `proofApproved` checkout flag stays; for batch lines it is also stored per line.

## 4. Volume pricing hook-up

Prices stay only in `packages/shared/src/pricing.ts`. Proposal for its shape, copied from the CFO config in section 10 of the pricing doc (values to change only when the owner approves them):

```ts
PRICING.batch = {
  minQty: 10, bands: [10, 25, 50, 100, 200],             // band starts
  pricingRule: "all_units_at_band_price",
  unitCentsByBand: { holiday_flat_5x7: [249,199,179,159,149], ... },
  maxQty: { ... }, envelopeIncluded: { ... },
  addOnUnitCents: { premium_paper: 40, rsvp_card: 89, details_card: 69, ai_background: 0 },
  delivery: { ship_to_me: { orderCents: 699 }, mail_for_me: { perCardCents: 99, postage: { letter_1oz: 82, postcard: 65 } } },
  discountExcludes: ["ship_to_me", "mail_for_me_fee", "postage"],
}
```

- `priceBatchLine(item, {memberDiscountPct})` (new, in `cart.ts`, pure): pick the band by quantity, unit = `unitCentsByBand[product][band]`, merchandise = `unit * qty` plus add-ons per card (premium paper) plus RSVP/details add-ons. **All-units pricing** means the unit price steps down at 25, 50, 100, 200, so the total is not monotonic around a boundary (24 cards cost more than 25 at the holiday ladder: 24 x 2.49 = 59.76 vs 25 x 1.99 = 49.75). Show a hint in the cart ("Add 1 more and pay less") and test that the cart never quotes a higher total for a higher quantity of the same card in the UI hint logic; whether to auto-bump is a product decision for the owner.
- Return shape extends `LinePrice` with `bandIndex`, `unitCents`, `deliveryCents` (ship-to-me is per **order**, mail-for-me fee is per card) and `postageCents` (mail-for-me only, **pass-through**, never discounted, own line). Fold per-order ship-to-me into `computeTotals` once per order (like `methodCents`), not per line.
- **Member discount** (CFO section 8: Plus 10%, Card Club 15%, merchandise, add-ons and paper only; never shipping, mail-for-me fee, postage; no stacking with codes). Memberships are off in production unless `GREETHUB_MEMBERSHIP=1`, and the PM roadmap defers batch discounts to Phase 2. So: `priceBatchLine` takes `memberDiscountPct` as an argument, default 0; the checkout service resolves it from `featuresFor()` (key `batch_print_discount_pct`, the CFO's name; the CTO called it `batch_discount_pct`: one of them must be fixed in `MEMBERSHIP_SPEC`) and falls back to 0 when memberships are off.
- **Postage is read from config, never hardcoded** (CFO: USPS $0.82 / $0.65 not confirmed). At checkout the line shows "Postage, at cost" with the number from config. Reconciliation against the partner's invoice is finance ops'.
- Rounding: integer cents, discount applied to the merchandise subtotal of the line (not per card) and rounded once, half up.
- Tax: still the placeholder (`taxRate: 0`, "worked out at payment"). Postage is a separate line so state rules can be applied later (open item).

## 5. Envelopes

CFO: envelopes included with every 5x7 card; a 4x6 postcard has none; recipient and return addressing free (PM: Phase 1 is blank envelopes only, addressing from Phase 2). `envelopes` on the line is `blank | return_address | addressed`:

| Option | Needs | PDF / data |
|---|---|---|
| `blank` | nothing | none |
| `return_address` | `returnAddress` (one `Address`, validated like a ship-to but PO boxes allowed) | one-page envelope PDF via `formatReturnAddress`, or data to the printer |
| `addressed` | return address + a list or the mail-for-me recipients | one page per recipient via `formatEnvelope` (`standard` style for our own handwriting-font PDF; `usps` style when the printer or mailer takes text blocks) |

- Mail-for-me **always** implies addressed (the mailer prints the address); the option is fixed and not shown.
- `addressed` with ship-to-me: the customer picks recipients from a list; the snapshot is taken at checkout like mail-for-me, and the envelope PDF goes into the same printer order. The cart line stores `recipientListId` and `recipientIds` for this mode too (the CTO's `delivery` union carries them only for `mail_for_me`; add `envelopeRecipients` to `photo_card` or widen the union in wave 2).
- Envelope line warnings (long line, more than 6 lines) are shown in the recipient list and again in the cart summary; they are warnings, not blocks, except a blank required line.
- The member's own handwriting on envelopes goes through `writing/service.renderCustom` behind `own_handwriting_print` (CTO section 7). That is the card engineer's `layoutEnvelopes`; the shop only passes the font choice.

## 6. Return and recipient addressing

- **Return address**: stored on the Design (`returnAddress`, CTO). The shop prefills it from the account's default saved address (`SavedAddress`). It is printed on the back flap by default and is not the ship-to address. Both are shown in the cart so they cannot be confused.
- **Recipient address** is `Recipient.address` from the list, always US in Phase 1 and 2 (`PRICING.shipCountries`). For a letter (card in an envelope) PO boxes are allowed; for a parcel to the buyer they are not (`purpose: "mail" | "ship"` in `validateRecipient`).
- The household line (`householdName`) is what prints first; it equals `address.name`. A mistyped household is the customer's own typo, covered by the proof-and-reprint policy (Support/GC draft).
- **USPS validation** (CTO `AddressValidator`) is not built: a fake that marks `valid` and one that echoes a correction come first (`lib/adapters/`), the real USPS or mailer provider later. Rules: `corrected` addresses are shown to the customer to accept; `undeliverable` blocks that recipient at checkout (`snapshotRecipients` refuses them) with a plain message and a link to fix it.

## 7. Ship-to-me vs mail-for-me in cart and checkout

| | Ship to me | Mail for me |
|---|---|---|
| What happens | One printer order, one box to the buyer with cards (and blank, return-address or addressed envelopes) | One mailing per recipient; we print, address, stamp and mail |
| Price lines | Cards (band price x qty) + add-ons + **$6.99 per order** | Cards + add-ons + **$0.99 per card** fee + **postage at cost** (separate line) |
| Quantity | Customer's number (10 to max) | Recipients + extras |
| Address needed | One ship-to (existing `validateAddress`, no PO box) | Return address + recipient snapshot; no ship-to unless extras are sent to the buyer |
| Order-by date | Product cutoff + shipping days (`fulfillmentOps.ts`) | Later: add the mail days and the partner's print days; a visible countdown in December (plan 4.5) |
| Printer interface | `FlatCardPrinter.submitBulk` | `FlatCardPrinter.submitMailing` (idempotent per `lineId + recipientId`) |
| Status | one line status | `batch_jobs/<orderId>:<lineId>` with a per-recipient status map; the line status is the roll-up |
| Phase | 1 | 2 (not in 2026 per PM roadmap) |

Cart UI (spec for the CX/UI work, not built): a delivery switch on the line; "Ship to me" shows the ship-to form; "Mail for me" shows the list picker with a count, a warning count of fixable addresses, the postage line and a "Replace postage estimate with real cost at mailing" note. Extras stepper only in mail-for-me. The totals block shows cards, add-ons, delivery, postage, discount (member), tax placeholder, total.

Checkout input (`CheckoutInputSchema`) additions: `shipments` stays for books and cards; batch lines carry `delivery` inside the cart line (server-side), so the client sends only `returnAddress` per batch line and the ship-to for ship-to-me lines. The server loads the list by id **owned by the session user** and takes the snapshot (security P0: `mustOwnList`, same 404 for not-yours and not-found; unit test the not-yours path).

## 8. What changes in existing code (plan only, nothing edited)

Owner of each file in brackets; the CTO and CFO touch the shared files.

1. `packages/shared/src/cart.ts` [shop + CTO]: add `NewPhotoCardItemSchema` to the discriminated union; per-kind `maxQuantity(item)` replacing `MAX_QUANTITY` in `priceLine`, `addToCart`, `setQuantity`, `sameLine`, `describeItem`, `itemSku`/`isPrinted` (batch lines are printed; `itemSku` becomes `lineKey`); add `priceBatchLine`; make `computeTotals` charge ship-to-me once per order and keep postage separate. Existing card/book tests (`tests/shop/pricing-cart.test.ts`) must pass unchanged.
2. `packages/shared/src/pricing.ts` [CFO]: add `PRICING.batch` (section 4) once the owner approves; add the entitlements keys to `MEMBERSHIP_SPEC` (`batch_print_discount_pct`, `event_page_plus_included`).
3. `lib/shop/types.ts` [shop]: `OrderItem` gets optional `batch?: { sizeId, designVersion, delivery: "ship_to_me" | "mail_for_me", envelopes, recipientCount, extras, snapshot?: RecipientSnapshot (id, household, address) , returnAddress?: Address }`; `PendingCheckout.shipTo` stays keyed by item id; add `recipientSnapshots: Record<itemId, RecipientSnapshot>`. `OrderItem.fulfillment.printer` union gains the flat-card vendor name. Keep order docs small: per-recipient state lives in `batch_jobs`.
4. `lib/shop/checkoutService.ts` [shop]: `CheckoutInputSchema` gets `returnAddresses` per batch line; `startCheckout` takes snapshots (`snapshotRecipients`, `maxRecipients` = line max), recomputes quantity from the snapshot, rejects a stale `designVersion`, rejects unapproved proofs, and builds lines: card line, add-on lines, `delivery_ship_to_me` (qty 1) or `mail_for_me_fee` (qty = recipients) and `postage` (at cost). `buildCheckoutLines` currently assumes postage per unit from `PRICING.skus`; batch lines need their own branch.
5. `lib/shop/orderService.ts` [shop]: `toOrderItem` copies the batch block; `submitOrder` branches on `batch` to the `FlatCardPrinter`; `applyPrinterWebhook` looks up per-recipient external ids via `batch_jobs`; `scrubOrder` additionally calls `scrubSnapshot` and the envelope PDF deletion at order closed + reprint window; the **closed** definition (CFO/privacy: delivered, or 21 days after shipped for ship-to-me, or 30 days after last piece mailed) is set in one function so batch orders can close (audit A4).
6. `lib/shop/accountService.ts` [shop]: `exportUserData` adds the user's lists (CSV-safe, list and recipient counts plus the data) and `deleteAccount` deletes `recipient_lists` and scrubs batch order snapshots after close (privacy ops 118+). Neither may log recipient values.
7. `lib/store/docs.ts` [CTO/shop, wave 2]: add `recipient_lists` and `batch_jobs` collections (owner = `userId`; refs). RLS: server only, as the other tables.
8. `lib/adapters/` [shop]: `FlatCardPrinter` interface + fake (`fake` first, real vendor after Oct 24), `AddressValidator` interface + fake. `getAdapters()` gains `flatPrinter` and `addressValidator`. Fakes keep the whole flow testable.
9. API routes [shop], new under `app/api/account/recipients/` (lists CRUD, import preview, import commit, export, per-recipient edit) and `app/api/cart` (batch line add/update): each starts with an ownership check, a rate limit (security table: preview 10/hour, commit 10/hour, export 10/hour), `importSizeError` on `Content-Length` before reading, `Cache-Control: no-store` and `attachment` on export, and returns row numbers and field names, never cell values, in errors and logs.
10. `lib/shop/fulfillmentOps.ts` [shop]: cutoffs per photo-card product and delivery mode; mail-for-me adds the mailer's print and mail days. Numbers from fulfillment's `docs/ops/photo-events-printing.md` (not found when this was written).
11. `components/shop/` [shop + CX]: batch line editor, list manager, import preview (row table with per-row fixes, duplicates tick), postage line, "changed since you added it" notice.

## 9. Tests to add in wave 2

Cart: per-kind max, band boundaries (9 rejected, 10, 24, 25, 49, 50, 99, 100, 199, 200, 201 for holiday), all-units step, member discount only on merchandise, postage and fees untouched, discount off when memberships are off. Checkout: snapshot taken and frozen (later list edit does not change the order), undeliverable and missing recipients refused, not-your-list returns the same 404, extras bounds, stale design version, unapproved proof. Orders: bulk and mailing submit through the fake, idempotent resubmit, per-recipient status roll-up, scrub removes every address, account deletion removes lists. Webhooks: duplicate event ignored, out-of-order printer status. Cart-to-tracking-to-deletion fake-pay walk covering a 50-card ship-to-me line and a mail-for-me line.

## 10. Open items

- **Owner**: approve prices, postage pass-through wording, whether 24 cards should cost the 25-card price (all-units step), free shipping at 100+, and whether Phase 1 really offers only 25/50/100.
- **CFO**: add `PRICING.batch`; reconcile `batch_print_discount_pct` vs the CTO's `batch_discount_pct`.
- **CTO**: widen `delivery` so ship-to-me can carry a recipient list for addressed envelopes; add `recipient_lists` and `batch_jobs` to `docs.ts` and the migration; confirm the 500 cap.
- **Security**: confirm 500 vs 1,000 list size; move `safeCell` to `app/lib/security/csv.ts` so the RSVP export shares it (their request touches `lib/security/`, outside my folders; the function is in `app/lib/recipients/csv.ts` as `exportCsv`'s helper and needs exporting when that file exists).
- **Fulfillment**: printer quotes, envelope and addressing support, mailer partner, cutoffs.
- **General counsel and privacy ops**: retention numbers (closed + 30 days), third-party address data notices, attorney review of mailing other people's addresses.
- **Not built**: USPS validation (fake and real), all routes, UI, migration, order and cart changes above.
