# Vendor tracking: lead times, defects and shipping cost against the model

Owner: Fulfillment. Version 2026-10-12. No real data yet: every number below is a model input or a guess until the sandbox quotes and first live orders.

## Scorecard (fill weekly from launch; monthly review with the CFO)

| Metric | Target or model value | Source of model value | Actual |
|---|---|---|---|
| Lulu book unit cost, 24 pp / 32 pp | $12.50 / $14.50 | CFO estimate (finance model v3) | not found (needs sandbox quote) |
| Prodigi card unit cost | $3.25 | CFO estimate | not found |
| Shipping per book / card | $1.60-6.00 | CFO estimate | not found |
| Book production, submit to ship, business days | 5 (8 in Q4) | Lulu guides (see 03) | not found |
| Card production, business days | 3 | Guess | not found |
| Transit, ship to delivered, business days | 3-7 | Guess | not found |
| Paid to delivered, books | 7 calendar days is what checkout allows today | `PRICING.earliestDeliveryDays`, no data behind it | not found |
| Defect or damage rate (reprints / printed lines) | 4% | CFO guess | not found |
| Lost rate | not in model | | not found |
| Rejected files per 100 submits | 0 target | | not found |
| Percent of lines with tracking | 100% target | | not found |
| Percent of orders that met their arrive-by date | 98% target | | not found |

## What to capture per printed line (code gaps)

The order record does not hold most of this yet. Needed fields (Shop engineer, with the Supabase move): submitted at (exists), printer cost (not stored; check whether the APIs return it), shipping cost, in production at, shipped at per line (only order-level history today), delivered at (never set), carrier and tracking (exists), rejection reason, reprint of which line. Until then, export from the printer dashboards monthly and match on external id `{orderId}-{lineId}` (finance/ops close checklist does the cost side).

## Weekly review (15 minutes)

1. Exception list count by code, and oldest open item.
2. Median and 90th percentile production days per printer.
3. Defects and losses by cause (printer, carrier, ours).
4. Actual unit and shipping cost against the model; tell the CFO when any figure is more than 10% off.
5. If a printer misses production by more than 3 business days on more than 5% of lines in a week, or loses or damages 3 orders in a week: escalate to the printer and the owner, and prepare the backup (CX 02 escalation table).

## Backup printers

| Product | Primary | Backup | State |
|---|---|---|---|
| Book | Lulu | None chosen. Candidates need an 8.5 x 8.5 casewrap with API ordering; Gelato's photo books are a possible fit (not verified) | Owner decision before 10x |
| Card | Prodigi | Gelato (named in PLAN) | `PrinterAdapter` already lists "gelato"; no adapter written |

A backup is only real once it has passed the sandbox routine in `02-preflight-and-sandbox.md` and a physical proof.
