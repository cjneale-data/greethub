# Finance operations

Bookkeeping structure, reconciliation and actuals versus the model. Finance ops prepares; it never moves money or files anything.

| File | What it is |
|---|---|
| `chart-of-accounts.csv` | Accounts, what feeds each one, and the `GreetHub_Financial_Model_v3.xlsx` row it maps to. |
| `monthly-close-checklist.md` | Close steps and reconciliation for Stripe, Lulu, Prodigi, OpenRouter, Vercel and other vendors, plus the accountant pack and the 10x/100x changes. |
| `actuals-vs-model-template.csv` | One row per model line with a variance flag rule. Copy it to `actuals-YYYY-MM.csv` each month. |
| `accountant-questions.md` | Sales tax registration, revenue basis, 1099 and records questions for the owner's accountant. |

## What the app gives bookkeeping today (2026-10-12)

Have:
- An order per paid Stripe Checkout session, with `paymentIntentId`, `stripeSessionId`, per-line sku, product and postage cents, and the printer's external id per printed line.
- From 2026-10-12, `order.totals.taxCents` and `totalCents` hold what Stripe charged, including automatic tax. Before this change, the tax was checked and then thrown away, so tax was always 0 (`app/lib/shop/orderService.ts`, `chargedTotals`).

Missing (owners in brackets):
1. Durable store: orders live in a JSON file (Supabase, SEC-18) [CTO].
2. Stripe fee and charge id per order: read `balance_transaction` on the charge [shop engineer].
3. Refunds and disputes: `charge.refunded` and `charge.dispute.*` are ignored, so the order never shows them [shop engineer].
4. Printer cost per line: the Lulu and Prodigi adapters store no cost. Whether their APIs return it is not verified [shop engineer, fulfillment].
5. Durable cost ledger with an order or creation id, kept after customer deletion [CTO, Head of Data].
6. Tax address: ship-to addresses are not sent to Stripe, and lines carry no product tax code [shop engineer, after the accountant answers questions 4-7].
7. Discount or promo field and creator attribution on the order [shop engineer, social].
8. Delivered or shipped date per line for accrual and the 30-day refund window [shop engineer].
9. An admin export of orders for a period (CSV, no customer names or addresses) [shop engineer].
