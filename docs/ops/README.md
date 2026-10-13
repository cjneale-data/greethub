# Fulfillment operations

Owner: Fulfillment and Operations. Started 2026-10-12.

| File | What it is |
|---|---|
| `01-order-exception-playbook.md` | Failed submit, rejected file, late, lost, damaged, wrong address, reprint; who decides what |
| `02-preflight-and-sandbox.md` | Pre-print file checks, Lulu and Prodigi sandbox routine, physical proof checklist |
| `03-holiday-cutoffs-2026.md` | Proposed Christmas 2026 order-by dates, inputs and readiness gates |
| `04-vendor-tracking.md` | Lead times, defects, shipping cost against the model; backup printers |

Code that ops owns the numbers for: `app/lib/shop/fulfillmentOps.ts` (cutoff inputs, exception thresholds) and the read-only list at `GET /api/admin/orders/exceptions`.

Owner-only steps: printer accounts and keys, physical proofs and print-quality approval, choosing shipping tiers and a backup printer, approving customer-facing dates and policy wording.
