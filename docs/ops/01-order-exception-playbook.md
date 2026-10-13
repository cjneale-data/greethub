# Order exception playbook

Owner: Fulfillment. Version 2026-10-12. Status: written against the code as it is today, before any printer sandbox run.
Customer-facing wording lives in `docs/cx/02-support-model.md` (macros 9-14). Policy wording lives in `docs/legal/05-policies-draft.md` (Refund & Reprint, attorney draft). This file says what ops does and who decides.

## How to find exceptions

- `GET /api/admin/orders/exceptions` (open in local dev; elsewhere needs `GREETHUB_ADMIN_TOKEN` in the `x-admin-token` header). Returns printed lines that need a person, most urgent first, with a playbook section for each, plus the holiday order-by dates. Ids, states and ages only: no names, emails or addresses. Logic and thresholds: `app/lib/shop/fulfillmentOps.ts`.
- Check it every business morning, and twice a day from Black Friday to Dec 18.
- Not built yet: an alert when a line enters the list (needs the job host, SEC-21), and buttons to retry, reprint, refund or cancel. Until then every action below is done by hand in the printer dashboard, Stripe dashboard and the data store.

## Who decides

| Decision | Who | Limit |
|---|---|---|
| Retry a failed submit, fix a file and resubmit | Fulfillment | Any |
| Reprint or refund when the cause is ours, the printer's or the carrier's | Support agent | Up to $60 per order (CX 02) |
| Same, above $60, or a second reprint on one order | Owner | |
| Cancel at the printer before production | Fulfillment, on the customer's request | Only while the printer allows it |
| Delay notice under the FTC Mail Order Rule (offer wait or refund) | Fulfillment sends, Support handles replies | Must go out before the promised date passes |
| Switch an order or a SKU to the backup printer | Owner | |
| Claim against a printer for its defects or losses | Fulfillment files, Owner approves | Per printer terms (not yet read) |
| Anything that changes policy wording | Owner with attorney | |

## A1. Failed submission (paid, never reached the printer)

Signs: list code `not_submitted` (paid more than 2 h ago, no printer job) or `needs_attention` with note "We couldn't reach the print shop".
Today this is every real order: `printAssets()` sends no files, so the real adapters fail validation (PLAN, CTO). Nothing retries automatically, although the order page tells the customer "We'll try again".
1. Check the printer dashboard for a job with external id `{orderId}-{lineId}` before doing anything. Lulu submits carry no idempotency key, so a blind resubmit can print twice.
2. If no job exists, fix the cause (keys, files, address) and resubmit once.
3. If not fixed within 1 business day, email the customer with a new date. If that date is past their arrive-by date, offer wait or full refund (A3 step 3).

## A2. Rejected file

Signs: `needs_attention` with a printer state such as `REJECTED`, or a validation problem before submit.
1. Read the printer's reason. Run the preflight in `02-preflight-and-sandbox.md` on the files.
2. Our layout fault (bleed, size, page count, spine): fix the files and resubmit. The customer does nothing; do not ask them to "open the order" (the current email does; flag to Shop/CX).
3. Art fault (low resolution, text off the page): re-render or re-layout, send the customer a new proof to approve, then resubmit. The new approval restarts the Mail Order Rule clock only if the customer agrees.
4. More than 2 rejections of the same kind in a week: stop and tell the CTO; it is a pipeline bug, not an order problem.

## A3. Late

Signs: `not_shipped` (book 12 days, card 6 days since submit), `arrive_by_at_risk` (5 days or less to the arrive-by date and not shipped), `shipped_no_tracking`, or a customer asking.
1. Check the printer's job status and, if shipped, the carrier's tracking.
2. Ask the printer for a ship date (printer support ticket).
3. If we will miss the date we showed: before that date, email the customer the new date and offer the choice to wait or cancel for a full refund, with a free way to reply. Under the FTC Mail Order Rule silence is consent only for a first delay of 30 days or less; beyond that we need a yes (docs/legal/03 s3; attorney to confirm wording). Not built: the delay-notice email and the one-click cancel-and-refund link.
4. For a gift date that will be missed, the support agent may offer an express reprint now plus cancel the late job if the printer still allows it.

## A4. Lost

Signs: `shipped_check_tracking` (10 days after shipping with no delivery recorded), tracking stalled for 5 or more business days, or a customer says it never came.
Note: real orders never reach "delivered" today (PLAN, Shop engineer), so every shipped line appears here after 10 days. Check tracking; most will be fine.
1. Lost threshold (proposed, owner to set in the policy's "[N] days"): tracking stalled 7 business days, or 10 business days past the estimate with no delivery scan.
2. Customer chooses reprint (express if there is a date) or full refund including postage. Do not wait for the carrier claim.
3. File the carrier or printer claim afterwards. Record cause = carrier.

## A5. Damaged or misprinted

1. Ask for 1-2 photos including the packaging (macro 11). Photos come by email; never copy them into the repo or tickets outside the helpdesk.
2. Compare against the approved proof. Matches the proof and is undamaged: not covered (goodwill only). Damaged, defective, or differs from the proof: reprint or refund, customer's choice.
3. Record cause (printer, carrier, ours) and defect type in the vendor log (`04-vendor-tracking.md`). Printer defects go back to the printer as a reprint claim.

## A6. Wrong address

- Before submit: correct it in the order, resubmit.
- After submit, before production: Lulu holds jobs for 120 minutes (`production_delay`); cancel and resubmit with the right address within that window. Prodigi: check whether the order can still be edited or cancelled in its dashboard (not verified).
- After shipping: ask the carrier to redirect (macro 14). Customer's error is not covered by policy; a reprint at cost is the owner's call. Our or the printer's error: free reprint.
- Prevention not built: address verification at checkout (only format checks exist: ZIP pattern, no PO boxes, US only).

## A7. Reprint

1. Reprint needs the original print files. Policy draft promises artwork is kept 12 months for reprints. The 90-day purge deletes original photos only (`app/lib/book/privacy.ts`), so book files survive it; nothing deletes them at 12 months either (retention job needed). Account deletion removes book data, so no reprint is possible after the customer deletes their account. Print PDFs live on local disk today, so they are not durable until Supabase Storage (SEC-18).
2. Submit as a new job with external id `{orderId}-{lineId}-R1` (R2 for a second) so it never collides with the original, and note the reason in the order history. No code path does this yet; done by hand in the printer dashboard.
3. Use express when the customer has a date. Cost lands in the reprint allowance (CFO model: 4 percent of printed items, a guess).

## After every exception

Log: order id, line id, code, cause (ours, printer, carrier, customer), remedy, cost, days to resolve. Feeds the weekly vendor review and the CFO's reprint and refund rates. No customer names, addresses or photos in the log.
