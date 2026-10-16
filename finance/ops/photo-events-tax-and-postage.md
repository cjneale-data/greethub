# Photo cards and events: sales tax, postage and mailing-partner reconciliation

Finance ops, 2026-10-15. Wave 1 deliverable for `docs/products/photo-cards-and-events-plan.md` (section 8). Inputs: `docs/finance/photo-events-pricing.md` (CFO proposal, prices not approved), `docs/legal/03-ecommerce-tax-consumer.md`, `finance/ops/chart-of-accounts.csv`, `finance/ops/accountant-questions.md`.

This is bookkeeping and research prep. It is **not tax or legal advice**. Every taxability position below is for the owner's accountant to confirm. Labels: **[V]** verified from the source named, **[U]** unverified or my inference.

The printer and mailing partner are not chosen yet (`docs/ops/photo-events-printing.md` did not exist when I wrote this). Anything that depends on how the partner bills is written for both cases (prepaid wallet, or invoice/card on file).

## 1. What we sell, and how each part should be taxed

| Order part | Price (CFO proposal) | What it is for tax | Proposed Stripe tax code | Notes |
|---|---|---|---|---|
| Flat 5x7 cards, 4x6 postcards, envelopes included | $0.99 to $2.99 a card by band | Tangible personal property (printed goods) | `txcd_99999999` General - Tangible Goods (default) or `txcd_20090028` Printing | See 1.1 for the choice. One code for all batch print lines. |
| RSVP card, details card, premium paper | $0.40 to $0.89 a card | Part of the printed goods | Same code as the cards | Keep each as its own line so refunds and reprints split cleanly. |
| AI background, recipient and return addressing | $0 | Free | none (no line, or a $0 line) | A $0 line carries no tax. Do not invent a price for it. |
| Ship to me | $6.99 a order | Delivery charge on taxable goods | `txcd_92010001` Shipping | Passed as the Checkout shipping rate, not as a product line. |
| Mail-for-me fee | $0.99 a card | Address, stamp and mail each card: a handling/preparation charge | `txcd_92010004` Handling Charge | Do **not** merge it with postage: states treat handling more often as taxable than pure postage [U]. |
| Mail-for-me postage | at cost ($0.82 letter, $0.65 postcard, from config) | Delivery charge (USPS postage) | `txcd_92010001` Shipping | Separately stated, at cost. See section 2. |
| Event page, Free | $0 | none | none | |
| Event Plus | $14.99 a event | Online service the host uses (RSVP tool, reminders, hosting) | `txcd_10103000` SaaS - personal use (proposed) | See section 3. |
| Event Plus included free (order of 50+, members) | $0 | Bundled free with a taxable sale or a membership | none | See 3.2. |
| Member batch discount (10% / 15%) and codes | minus | Reduces the price of the print lines | applied to print lines only | Must never reach postage or the mail-for-me fee (CFO rule, and it would also shift tax). |

Stripe tax code names and definitions above are quoted from https://docs.stripe.com/tax/tax-codes (read 2026-10-15) **[V]**. Whether each is the right fit for our product is **[U]** until the accountant agrees.

### 1.1 General - Tangible Goods or Printing?

- `txcd_20090028` Printing reads: "printing ... of various articles including mailers, catalogs, letterhead, envelopes, business cards ... The end result is the transfer of tangible personal property to the customer" **[V]**. That describes custom stationery well.
- `txcd_99999999` General - Tangible Goods is the fallback Stripe recommends when nothing fits **[V]**.
- Stripe has **no physical greeting-card code**. "Greeting cards" appear only as digital codes (`txcd_10506000` to `txcd_10506002`) **[V]**.
- Some states treat printing differently from retail sales of goods (for example, printing services or printed matter rules) **[U]**. Recommendation: use the **same code as the existing folded 5x7 card** so the two card products never disagree. Whichever code the accountant picks for question 4 in `accountant-questions.md` applies here too.

### 1.2 Envelopes are part of the card

Envelopes are included in the card price and not stated separately. Keep it that way. A separately priced envelope line would add a taxability question with no benefit.

## 2. Postage passed through

### 2.1 How it looks to the customer

- **Ship to me:** one $6.99 shipping charge per order, sent as the Checkout shipping rate with `tax_code: txcd_92010001` and `tax_behavior: exclusive`.
- **Mail for me:** two separately stated lines:
  - "Postage (USPS, at cost)": qty x rate from config.
  - "Mail-for-me service": qty x $0.99.

Separate statement matters. In many states a separately stated delivery charge is treated differently from one rolled into the price. In some states a charge that is above the actual delivery cost is taxable on the excess, and a combined "shipping and handling" charge is taxable where handling is **[U, general pattern; not verified state by state]**. Showing postage at cost and the handling fee on its own line keeps the best position open in each state. Stripe Tax then applies each state's rule to each code. We do not hard-code which states tax delivery.

### 2.2 "At cost" must stay true

- The postage rate lives in config (`postageCentsConfig`). Update it **on the USPS effective date**. The CFO modelled $0.82 and $0.65 but could not confirm the July 2026 change took effect. I did not verify it either.
- If the partner charges more than the stated rate (non-machinable surcharge, weight over 1 oz, square card, a fuel or postage-handling fee), that extra is **our cost**, not postage. Book it to 5026 (below) and do not add it to the customer's postage line. If it were added to the postage line, the line would stop being "at cost".
- If the partner's postage is **cheaper** than what we charged (commercial or presort rate), the postage line is above actual cost. That can make the excess taxable in some states, and "at cost" would be untrue to the customer **[U]**. Owner and CFO decide: charge the partner's real rate, or call it "Postage" without "at cost". Flag before launch, not after.

### 2.3 Revenue or pass-through? (accountant decides)

Two ways to book postage. The CFO wants postage on its own row with an equal cost row, so the margin % is not inflated. Both options below do that.

| | A. Gross (principal) | B. Net (agent) |
|---|---|---|
| Customer postage | 4110 Postage revenue - mail for me | 2160 Postage collected for mailing (liability) |
| Partner postage bill | 5025 COGS - postage, mail for me | clears 2160 |
| Effect | Revenue and COGS both include postage | Postage never touches P&L |
| Fits when | We control the mailing and bear the risk (likely, since we choose the partner and set the price) [U] | We only pass the money through |

Sales tax does not follow this choice. How a state taxes the delivery charge does not depend on whether our books show it gross or net **[U]**. Recommendation for the model: **A (gross)**, matching how 4100 already handles book and card postage.

### 2.4 Undeliverable and returned mail

- USPS postage on a piece that is returned is spent. Decide the policy (support and CFO). Either the customer gets the card fee back but not the postage, or GreetHub absorbs it.
- Book a postage refund as 4900 Refunds, plus the matching tax refund to 2100. Book postage we absorb as 5026, not as a refund.

## 3. Digital event pages

### 3.1 Event Plus ($14.99 a event)

- **What it is:** a hosted page, an RSVP form, a host dashboard, CSV export, and up to 3 reminder emails. The host uses it like software. The guest gets nothing they keep.
- **Proposed code:** `txcd_10103000` "Software as a service (SaaS) - personal use: Cloud services software delivered over the internet ... they don't download anything ... intended for personal use" **[V wording]**.
- **Alternatives:**
  - `txcd_10701100` Website Hosting.
  - `txcd_10701300` Website Data Processing.
  - `txcd_10506002` Digital Greeting Cards - static. This one would fit only the emailed digital invitation, sold on its own.
- **States differ a lot.** Some tax SaaS and some do not, and some tax digital greeting cards differently again. `docs/legal/03` already notes that digital-goods rules vary and that Louisiana widened its base on 2025-01-01 **[S, per legal/03]**. Taxability per state is **[U]**. Let Stripe Tax decide once the code is set.
- **Sourcing:** the host's billing address. There is no shipping address on a digital-only order, so Checkout must collect a billing address, at least postal code and country. Without it Stripe falls back to less precise location data **[U]**.

### 3.2 Event Plus included free

- **With a printed order of 50+:** show it as a $0 line, or as a note only. Do **not** split the print price to "allocate" value to it. Some states have bundling rules, so if the accountant says a split is needed, this becomes a CTO/shop change **[U]**.
- **For members:** the value is part of the membership charge, and the membership already has its own tax code. That code is not in this file, and I did not check which one the membership uses. Add it to the accountant questions below.

## 4. Where tax is sourced, and why mail-for-me is the hard case

- **Ship to me:** one order, one destination, which is the buyer's ship-to address. Stripe Checkout needs that address passed to it, or collected by Checkout. Today the app does not pass ship-to addresses to Stripe (gap 6 in `finance/ops/README.md`). That gap must close before batch orders launch.
- **Mail for me:** one order and one payment, but 25 to 200 recipients in many states. A sale of goods is generally sourced to where the goods are delivered, so each recipient's state may apply **[U]** (accountant question 9 already asks this).
- **Stripe constraint:** a Tax Calculation takes **one** `customer_details.address` for the whole calculation. Line items carry no per-line address. The only per-line location field is `performance_location`, and it is for events **[V, https://docs.stripe.com/api/tax/calculations/create, read 2026-10-15]**. A Checkout Session also has one shipping address **[U, consistent with the existing card flow]**.
- **Workable approach (CTO and shop engineer to confirm):**
  1. Group recipients by destination (state + ZIP, or by full address if the accountant wants rooftop accuracy).
  2. Run one Tax Calculation per group. The lines are print, postage and the handling fee for that group's card count.
  3. Sum the groups into one PaymentIntent.
  4. After payment, record one Tax Transaction per calculation (`tax.transactions.create_from_calculation`) so the Stripe Tax report shows each state.
  5. This leaves standard Checkout for mail-for-me. Stripe Tax pricing is per transaction or per calculation, so check the cost per order before building **[U]**.
- **Simpler fallback for Phase 1, if the accountant accepts it:** ship to me only (already the Phase 1 plan). Mail-for-me arrives in Phase 2 (Jan to Mar 2027), which gives time for the accountant's answer.
- **Nexus counting:** mail-for-me spreads deliveries across many states. If each recipient's state counts the order (or each piece) as a transaction, the 200-transaction thresholds could be reached in unexpected states, especially in the December peak **[U]**. Stripe Tax threshold monitoring must be on. Stripe Tax collects only where we are registered. Unregistered states show $0 tax, and that is correct until we register.

## 5. What we pay the printer and mailing partner (buy side)

- Partner print charges may include sales tax unless we give the partner a resale or exemption certificate (question 8 in `accountant-questions.md`; owner signs). Any tax charged goes to 5040, and 5040 should reach $0 once a certificate is on file.
- USPS postage billed by the partner is not normally taxed to us **[U]**. If a partner invoice shows tax on the postage line, query it.
- **Keep the partner's per-piece detail.** For each job: our order id, the recipient's destination state and ZIP, product, postage class, postage charged, print charged, and the piece status (mailed, returned, failed). Do **not** keep recipient names or street addresses in the books (privacy rule, `docs/privacy-ops`).

## 6. Proposed accounts (for `chart-of-accounts.csv`, to add once the owner agrees)

| No. | Name | Type | Feeds from |
|---|---|---|---|
| 4011 | Sales - batch photo cards and stationery | Revenue | Batch print lines, add-ons, premium paper (after member discount) |
| 4040 | Sales - event pages (Event Plus) | Revenue | Event Plus lines |
| 4110 | Postage revenue - mail for me | Revenue | Postage lines (option A) |
| 4120 | Mail-for-me service fees | Revenue | $0.99 handling lines |
| 2160 | Postage collected for mailing | Liability | Only if option B (net) |
| 1110 | Mailing partner prepaid balance | Asset | Only if the partner bills from a wallet |
| 5006 | COGS - print, batch cards (printer or mailing partner) | COGS | Partner print and envelope charges |
| 5025 | COGS - postage, mail for me | COGS | Partner postage (option A) |
| 5026 | COGS - mailing partner handling and surcharges | COGS | Per-piece handling, addressing, surcharges, absorbed returns |
| 5027 | COGS - batch reprints | COGS | Reprints of batch orders (typo policy), kept apart from 5030 so the 4% allowance can be tested |

Ship-to-me $6.99 stays in 4100 and the box cost in 5020, as for existing products.

## 7. Reconciliation: mailing partner charges against Stripe payouts

Run this monthly, and **weekly from Nov 15 to Jan 10** (holiday peak, plus late returns). Add it to the monthly close as a new section after the Prodigi step.

### 7.1 Pull the data

1. **Stripe:**
   - balance transactions for the period: charges, refunds, disputes, fees, Stripe Tax fees;
   - the payout reconciliation report for each payout;
   - the Stripe Tax report by jurisdiction.
2. **App:** an orders export for the period, with no customer names or addresses. For each batch order, the lines with sku, qty, unit cents, discount cents, postage cents, handling cents, tax cents, delivery mode, and the partner job ids.
3. **Partner:**
   - the per-piece or per-job export for the period;
   - invoices, or the wallet ledger with top-ups and per-job debits.

### 7.2 Four matches

| # | Match | Rule | Tolerance |
|---|---|---|---|
| 1 | **Stripe to bank** | Sum of payouts dated in the month = bank deposits (1000). Payouts created but not landed go to 1200. | $0 |
| 2 | **Orders to Stripe** | For each paid batch order: order `totalCents` = Stripe charge amount. Lines + tax = total. The order's tax = the Stripe Tax transaction(s) for it. For mail-for-me, the per-group transactions must sum to the order's tax. | $0 per order |
| 3 | **Orders to partner (pieces)** | Mail-for-me: cards paid = pieces submitted = pieces mailed + returned + failed. Ship-to-me: cards paid = cards on the partner job. | 0 pieces. Any gap is a fulfillment ticket. |
| 4 | **Postage charged vs postage billed** | Per order: postage charged to the customer (4110 or 2160) vs postage the partner billed (5025). | Within $0.02 a piece. Over that, investigate (see below). |

### 7.3 Typical causes of a postage gap (for match 4)

- **USPS rate change.** Config was not updated on the effective date, or the partner moved first. Fix config. This month's gap is ours.
- **Surcharge.** Non-machinable, over 1 oz, or square card. The cost goes to 5026, and the design team checks the template weight and shape.
- **Address failure.** Pieces that were paid but not mailed: refund the customer's postage and fee (4900 and 2100), or reprint.
- **Return after mailing.** Postage spent. Apply the 2.4 policy.
- **Timing.** Paid in November, mailed in December. If on accrual, see 7.4.
- **Rate below what we charged** (commercial rates). Report to the CFO and owner, per 2.2.

### 7.4 Month-end and accrual (if the accountant picks accrual)

- **Paid but not yet mailed or shipped:** revenue goes to 2500 Deferred revenue. Postage collected for those orders is in 2500 (option A) or 2160 (option B).
- **Mailed but not yet billed by the partner:** accrue the print and postage cost to 2400.
- **Wallet partner:** 1110 at month end = the partner's reported balance. Top-ups come out of 1000. Debits go to 5006, 5025 and 5026.

### 7.5 Variance flags for the actuals-vs-model sheet

Flag if any of these happen. Use the same rule as `actuals-vs-model-template.csv`.

- Print cost per card at the median band is more than 10% over the CFO assumption (for example $0.80 at 50 cards). The CFO re-prices if 5x7 print at 50 is over $0.95.
- Partner handling per card is over $0.55.
- Reprint and typo cost is over 4% of print, addressing and shipping.
- Postage gap (match 4) is over 1% of postage charged in the month.
- Tax charged on any order is $0 when its destination is in a registered state.
- 5040 (printer tax paid) is not $0 after a resale certificate is on file.

## 8. Build asks (for other teammates; I did not change any code)

- **Shop engineer:**
  - Set `tax_code` and `tax_behavior: exclusive` on every batch line and shipping rate (codes in section 1).
  - Keep postage and the mail-for-me fee as separate lines.
  - Restrict coupons and member discounts to print products (Stripe coupon `applies_to.products`), so that postage, handling and shipping are never discounted.
  - Pass the ship-to address to Stripe.
  - Store the Stripe fee, the tax transaction ids and the partner job ids per order.
  - Build the admin export in 7.1 with no names or addresses.
- **CTO:** decide the mail-for-me payment path (Tax Calculations per destination group, then a PaymentIntent, as in section 4) before Phase 2 work starts.
- **Fulfillment:**
  - Find out whether the chosen partner bills from a wallet or by invoice.
  - Confirm it gives a per-piece export with postage, surcharges and status.
  - Find out whether it charges sales tax on print and accepts resale certificates.
  - Confirm which postage rate it applies (retail Forever or commercial).
- **CFO:** confirm option A (gross) for the model, and the postage rows to match. Decide what happens if partner postage is below the rate we charge (2.2).
- **Support and CFO:** the postage policy for returned and undeliverable mail (2.4).

## 9. New questions for the owner's accountant (add to `accountant-questions.md`)

25. **Batch printed cards:** is `txcd_20090028` Printing or `txcd_99999999` General - Tangible Goods right? Should it match the folded card code?
26. **Mail-for-me:** is separately stated postage at actual cost, plus a separate handling fee (`txcd_92010004`), the right way to set it up? In which states does a "mail it for me" fee count as a taxable service or as handling?
27. **Mail-for-me sourcing:** one payment, many recipient states. Must tax be sourced to each recipient's address? Is grouping by state and ZIP acceptable, or is full-address accuracy needed?
28. **Nexus counting:** for transaction-count nexus, is one mail-for-me order delivered into 10 states one transaction in each of those states?
29. **Postage in the books:** gross (revenue and COGS) or net (agent, liability)?
30. **Postage below cost:** if our postage line is above what the partner actually pays (commercial rates), what changes for tax and for "at cost" wording?
31. **Event Plus:** is SaaS personal use the right code, or website hosting or digital greeting card? How should "Event Plus included free" with a 50+ printed order, and with a membership, be treated? Is any allocation needed?
32. **Mailing partner:** should we give it a resale certificate? Is postage on its invoice ever taxable to us?

## 10. Owner asks (finance ops does not do these)

- Choose the mailing partner. Fund a prepaid postage wallet if the partner uses one.
- Sign resale or exemption certificates.
- Approve prices, the postage wording ("at cost"), and the returned-mail policy.
- Choose the Stripe Tax plan, and register in states as the accountant advises.
- Put sections 9 and 2.3 in front of the accountant before Phase 2 (mail-for-me), and ideally before Phase 1 launch.

## Sources

- Stripe product tax codes: https://docs.stripe.com/tax/tax-codes (and the `.md` copy), read 2026-10-15. Quoted codes: `txcd_99999999`, `txcd_20090028`, `txcd_92010000`, `txcd_92010001`, `txcd_92010004`, `txcd_10103000`, `txcd_10701100`, `txcd_10701300`, `txcd_10506000-2`, `txcd_00000000`.
- Stripe Tax Calculation API: https://docs.stripe.com/api/tax/calculations/create, read 2026-10-15. Covers one `customer_details` address per calculation, `shipping_cost.tax_code` defaulting to `txcd_92010001` in the example, and `ship_from_details`.
- State-by-state taxability of delivery, handling, printing and SaaS: **not verified** here. It is left to Stripe Tax and the accountant.
