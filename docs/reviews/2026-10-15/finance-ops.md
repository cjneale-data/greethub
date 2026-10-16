# Finance ops: committee review, 2026-10-15

Reviewer: finance ops. Based on `docs/PLAN.md` (Finance ops sections, build order B6, launch gate item 8) and `finance/ops/`. Research and bookkeeping prep, not tax or legal advice. I have not re-run anything; this is a read of files.

## Done vs plan

Plan asked for: chart of accounts, close checklist with Stripe/Lulu/Prodigi/OpenRouter/Vercel reconciliation, actuals-vs-model sheet, state tax questions for the accountant. All four exist in `finance/ops/`:

- `chart-of-accounts.csv` (57 accounts, each mapped to a v3 model row).
- `monthly-close-checklist.md` (77 lines: lock period, Stripe 7 steps, Lulu/Prodigi, OpenRouter, Vercel and other vendors, accountant pack, 10x/100x changes).
- `actuals-vs-model-template.csv` (one row per model line, variance flag rule).
- `accountant-questions.md` (24 questions: nexus, tax codes, shipping, sourcing address, resale certificates, basis, 1099s, retention).
- `photo-events-tax-and-postage.md` (added 2026-10-15): tax codes, postage at cost, mailing-partner reconciliation for photo cards and events. Prices and partner are not chosen, so it covers both billing cases.
- `README.md`: nine app data gaps, each with an owner.

Definition of done (checklist and templates exist) is met. Nothing has been exercised on real data: no live month, no sample close.

## Must exist before the first real order

| Need | State |
|---|---|
| Entity, EIN, business bank account | Not done (owner). Plan launch gate item 8. |
| Accountant engaged, questions answered | Not done (owner). Questions are ready to send. |
| Accounting system chosen and chart loaded | Not done (owner). Chart is a CSV only. |
| Sales tax registration, home state | Not done (owner, with accountant). Must precede the first live sale; Stripe Tax collects nothing where unregistered. |
| Stripe Tax turned on in live mode | Only after registration. Verify on first test-mode run. |
| Product tax codes per line | Not in app. Lines carry none today, so digital and print are taxed alike. Needs accountant answer to Q4-7, then shop engineer. |
| Ship-to address to Stripe | Not in app. Tax would use billing address; gifts to other states would be wrong. |
| Resale certificates to Lulu and Prodigi | Not done (owner, after registration). Printer-charged tax is booked to 5040 meanwhile. |
| Stripe payout reconciliation | Procedure written (checklist steps 1-7). App cannot support it yet: see gaps. |
| Tax reserve (separate bank account) | Accountant Q24; owner decides. |

## Data gaps that block reconciliation

Fixed 2026-10-12: orders now store Stripe's charged total and tax. Still open, per `finance/ops/README.md`:

1. Orders in a local JSON file, not Supabase (CTO, SEC-18).
2. No Stripe fee or charge id per order (shop engineer). Fees come from Stripe reports by hand.
3. Refunds and disputes ignored by webhooks. Books must take them from Stripe by hand (shop engineer, plan B6).
4. No printer cost per line; whether Lulu or Prodigi APIs return cost is unverified (shop engineer, fulfillment).
5. Cost ledger not durable (CTO, data).
6. No discount, creator or delivered-date fields; no admin order export.

Until 2 and 3 land, each month's close is manual and a missed refund is easy. Acceptable for a handful of launch orders, not for the holiday peak.

## Open items

- Photo cards and events: tax code choice (Printing vs General Tangible), handling vs postage, Event Plus as SaaS are all unconfirmed. Postage rates ($0.82/$0.65) not verified against USPS.
- Nexus watch: the holiday peak could cross 200 transactions in a state within a month. Register ahead in top states on the accountant's advice.
- Accrual vs cash undecided; no delivered date exists.
- Chart of accounts for photo/events lines and mailing-partner wallet not confirmed against the final partner.

## Owner actions

1. Choose an accountant; send `finance/ops/accountant-questions.md`.
2. Open business bank account; confirm Stripe live account and payout schedule.
3. Register for home-state sales tax before the first live sale; then switch on Stripe Tax live.
4. Sign resale certificates for Lulu and Prodigi.
5. Pick the accounting system; approve cash vs accrual with the accountant.
6. Decide the Stripe Tax plan (Basic vs Complete).
7. Do a test-mode close with one real test order once Supabase and fee capture land.
