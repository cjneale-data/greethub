# Monthly close checklist

Owner of the close: the owner (or bookkeeper once hired). Finance ops prepares; nobody here moves money or files anything. Target: books closed by business day 10 of the next month (business day 5 from 10x volume, see "Scale" below). Accounts: `chart-of-accounts.csv`. Variances: `actuals-vs-model-template.csv`.

Basis: until the accountant decides (see `accountant-questions.md`), keep the order data needed for both cash basis and accrual (revenue at shipment). Do not pick one here.

**Status of the data (2026-10-12):** the app stores orders in a local JSON file, not Postgres. It does not store Stripe fees, charge ids or refunds, and printer costs are not on the order. The cost ledger is not durable. So steps marked **(manual)** below are manual exports until the app gaps in `README.md` are closed.

## Day 1-2: lock the period

- [ ] Note the period (calendar month, UTC). Stripe reports default to UTC; set the Stripe account timezone once and never change it.
- [ ] Export orders created in the period: id, createdAt, paymentIntentId, stripeSessionId, items (sku, quantity, productCents, postageCents, printed, fulfillment printer and externalId, status), totals (subtotal, postage, method, tax, total). **(manual: no export route yet)**
- [ ] Export from Stripe (Dashboard > Reports): Balance summary, Payout reconciliation, itemized balance changes, Stripe Tax report by jurisdiction, disputes list. **(manual)**
- [ ] Download vendor invoices: Lulu, Prodigi, OpenRouter (credit purchases and usage/activity export), Vercel, Supabase, Resend, ad platforms.

## Stripe

1. **Charges to orders.** Every `succeeded` charge in Stripe has one GreetHub order (match on `payment_intent` = `order.paymentIntentId`). List charges with no order (paid but not fulfilled: today's amount-mismatch path marks the checkout `failed` and only logs) and orders with no charge (should not exist outside fake mode). Each unmatched charge is a refund-or-fulfil decision for the owner.
2. **Amounts.** For each matched pair: Stripe amount = `order.totals.totalCents`, Stripe tax = `order.totals.taxCents`. Orders created before 2026-10-12 kept tax 0 and the pre-tax total; use Stripe's numbers for those.
3. **Revenue split.** Book product lines to 4000-4030 by sku, postage and express to 4100, tax to 2100 by state (from the Stripe Tax report, not from orders).
4. **Fees.** Stripe fees from the balance report to 5100 (the app does not store per-order fees). Stripe Tax fees to 5105. Check: effective fee rate close to 2.9% + $0.30 per charge (Inputs B40-B41).
5. **Refunds and disputes.** From Stripe, not the app (the app ignores `charge.refunded` and `charge.dispute.created`). Refund product part to 4900, refunded tax back out of 2100, open disputes to 2200, lost disputes to 4950 plus fee to 5110. Match each refund to an order id and a reason (CX reason code) by hand.
6. **Payouts.** Each payout in the Payout reconciliation report equals the sum of its balance transactions (charges minus refunds minus fees, plus or minus adjustments). Each payout matches one bank deposit in 1000 by amount and arrival date. Payouts in transit at month end go to 1200.
7. **Clearing account.** 1010 Stripe balance at month end equals Stripe's ending balance (Balance summary). Difference = 0, or explain.

## Lulu (books) and Prodigi (cards)

1. Export each printer's jobs or invoices for the period (Lulu print jobs with cost; Prodigi orders with charges). **Whether the APIs return per-job cost was not verified**; the adapters do not read it.
2. Match each job to an order line on the printer's external reference (`fulfillment.externalId`, and the line id we send as the external reference). Every printed order line has exactly one job; a second job on the same line is a reprint (5030) or a double print (raise with fulfillment; see the shop engineer's "double prints" finding).
3. Book print to 5000/5005, shipping to 5020, any sales tax the printer charged to 5040 (should be 0 once resale certificates are on file; if not, ask the printer to refund it).
4. Jobs shipped in the period but not yet invoiced: accrue to 2400.
5. Per-unit check against the model: print and shipping per 24pp book, 32pp book and card versus `Inputs` section 6. These are estimates, so the first month's actuals replace them (send to the CFO).
6. Orders whose line is still `submitted` or `in_production` more than 10 days after payment: list for fulfillment ops.

## OpenRouter (models)

1. Credit purchases in the period: amount and fee. Purchase to 1020, purchase fee to 5230.
2. Usage in the period from OpenRouter's activity export, split into: paid orders (5200), guest previews (5210), abandoned drafts and safety screens (5220), development and evals (6060). **Until the cost ledger is durable (Postgres, kept after customer deletion), this split is an allocation**: dev and eval runs by date and key, the rest pro rata to the model's r62-r64 shares. Write "allocated" in the variance sheet.
3. 1020 at month end equals the OpenRouter credit balance shown in the account. Note the balance for the owner (low credit stops generation).

## Vercel, Supabase, Resend and other subscriptions

1. Each invoice to its 6xxx account. Annual plans to 1030 and spread monthly.
2. Usage-billed services whose invoice arrives after month end: accrue an estimate to 2400 and reverse next month.
3. Compare each to the `Opex` sheet line. Any new vendor not on the sheet goes to the CFO.

## Bank and owner

1. Reconcile 1000 to the bank statement line by line.
2. Owner money in or out: contribution (3000), loan (2900) or draw (3100). Ask the owner if unclear; do not guess.
3. Personal spend on the business account or business spend on a personal card: list for the owner and accountant.

## Sales tax

1. Stripe Tax report: tax collected by state and jurisdiction equals the 2100 sub-accounts.
2. Any tax collected where GreetHub is not registered: should not happen if Stripe Tax registrations match real registrations. Flag to owner and accountant.
3. Stripe Tax threshold monitoring: list states marked near or over threshold. Registration is an **owner ask**, with the accountant.
4. Filing calendar: list returns due next month per registered state (owner or filing service files; we never file).

## Model and close

1. Fill `actuals-vs-model-template.csv` for the month (copy the template; one file per month, e.g. `actuals-2026-11.csv`). Model values from `GreetHub_Financial_Model_v3.xlsx` Forecast column for that month, Base scenario.
2. Write a three-line variance note: the biggest variance, its cause, and whether the model input should change (CFO decides).
3. Owner reviews and signs off. Lock the period in the accounting system (when one exists).

## Accountant handoff pack (monthly; quarterly at launch volume)

- Trial balance and P&L, balance sheet.
- Stripe Payout reconciliation and Tax reports; bank statements.
- Printer invoices with the order match list; vendor invoices.
- Open items: unmatched charges, open disputes, accruals, owner questions.
- No customer names, addresses or photos in the pack. Order ids only (docs/legal/06).

## Scale

- **10x (about 1,600 orders a month):** manual matching breaks. Needs: an order export route or Postgres views, per-order Stripe fee and charge id stored from `balance_transaction`, refund and dispute webhooks writing to the order, printer cost stored per line, and the durable cost ledger. Then steps Stripe 1-5 and printer 2-5 become a script with an exceptions list. Close by business day 5. Bookkeeper monthly.
- **100x (about 16,000 a month):** a bank feed and a Stripe connector into an accounting system, and automated sales tax filing (Stripe Tax Complete or a filing service; owner decides). Daily payout-to-bank match, weekly printer match. Close by business day 3. Revenue recognition at shipment needs "delivered" or "shipped" dates per line; today orders stop at "shipped".
