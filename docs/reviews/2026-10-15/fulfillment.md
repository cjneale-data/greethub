# Fulfillment review, committee 2026-10-15

Inputs read: docs/PLAN.md (status 2026-10-13, B6/B7/B14, Oct 24 table), docs/ops/ (README, 01 to 04, photo-events-printing.md, photo-events-infra.md). I ran nothing new; every status below comes from those files. Nothing has touched a vendor.

## 1. Done versus plan

Plan M6 and B6/B7 ask for working printer sandboxes, print assets, Lulu cover wrap, webhooks, a derived "delivered", exception alerts, admin refund/cancel/reprint.

Done (documents and read-only code):
- Exception playbook (`docs/ops/01`, failed submit, rejected file, late, lost, damaged, wrong address, reprint, who decides).
- Pre-print checks and 7-step sandbox routine (`02`), written but never run.
- Proposed Christmas 2026 order-by dates (`03`), thresholds and read-only `GET /api/admin/orders/exceptions` (`app/lib/shop/fulfillmentOps.ts`).
- Vendor tracking sheet (`04`), empty of real data.
- Photo-card printer research (`photo-events-printing.md`, 2026-10-15), public pages only.

Not done, and the reason it matters: a paid order cannot reach a real printer. `printAssets()` returns `{}`, so every printed line goes to `needs_attention` (PLAN, Platform assessment). The Lulu cover wrap with spine is not built. The Prodigi card SKU is a placeholder. Webhooks are not registered. Real orders never reach "delivered". Lulu submit has no idempotency key, so a queue retry can print twice. These are engineering items (Shop, CTO), but they gate everything in section 2.

## 2. Vendor accounts, sandboxes, proofs

| Item | Status 2026-10-15 |
|---|---|
| Lulu account and sandbox key | None. Owner step. Adapter is unit-tested only |
| Prodigi account and sandbox key | None. Owner step. Sandbox base URL is in the adapter |
| Gooten account, API, sandbox | None. Flat-card API and sandbox not confirmed on its public page |
| Sandbox routine run (Lulu, Prodigi) | 0 of 7 steps run for either vendor |
| Physical proof, book | Not ordered. Owner step. Blocks print-quality approval (234 DPI effective-resolution concern, RGB to CMYK shift, spine/wrap) |
| Physical proof, folded card (Prodigi) | Not ordered. Also unknown whether the folded-card SKU prints in the US (pages list EU/UK origin only) |
| Physical proof, flat 5x7 photo card | Not ordered. Needs account first. Plan wants it ordered by Nov 6, in hand by Nov 20 |
| Print-quality approval | Owner only. Not given |

## 3. Cut-off dates

Proposed in `03`, not approved by the owner, not shown at checkout.
- Picture book: standard Wed Dec 2, express Thu Dec 3.
- Mailed card: standard Thu Dec 10, express Fri Dec 11.
- Basis: USPS Ground Advantage send-by Dec 17 (Dec 16 for AK/HI) minus production (book 8 business days, card 3, the card figure is a guess) minus safety.
- Unknowns that can move them: which carrier Lulu `MAIL` and Prodigi `Budget` use and whether tracked; Lulu and Prodigi 2026 holiday cut-offs (not found, check early Nov); Q4 backlog.
- Readiness gates already written: books need sandbox runs plus a physical proof by Nov 13, cards by Nov 20. Miss them and we stop promising Christmas delivery and lean on the digital book and e-card.
- Photo cards: PM recommends order-by Nov 30 ("in your hands by Dec 8") unless Gooten gives written dates that support Dec 5. Fulfillment's draft says print-ready by Dec 7 (Gooten asks for that) but also notes Dec 5 would be consistent. These two conflict with each other and with the Dec 10 card date in config. One date has to be chosen.

## 4. Gooten versus Prodigi, and Oct 24

Evidence (public pages only, no contact): Gooten is the only candidate publishing flat 5x7, matching 5.25x7.25 envelope included, US production, packs of 1 to 100, 1.5 days average production, 3 days transit. Prodigi has an existing adapter and sandbox but its flat 5x7 is a postcard product (24 to 72 hours, mostly UK/EU origin), which breaks the Dec 17 send-by if shipped transatlantic. Printify and Gelato are unverified.

Unconfirmed, and decisive: Gooten flat-card API endpoint and product id, sandbox or test-order mode, price at 25/50/100 (two public figures conflict, $1.20 and $0.35 per card on a 10-pack, both unverified), shipping cost, 2026 order-by dates, file spec and colour profile, envelope address printing (probably none, so Christmas ships blank envelopes).

Go/no-go criteria 1 (printer, API, sandbox, Dec arrival) and 9 (proof ordered by Nov 6) are "Not met". PM read: plan for no-go.

What has to happen by Oct 24, all owner-gated except the writing:
1. Owner approves contacting Gooten (and Prodigi for US origin and price) and sends or authorizes the 7-part written question list in `photo-events-printing.md` section 6. Written answers needed before the 24th.
2. Owner opens the Gooten account and sandbox (and Prodigi sandbox, Lulu sandbox).
3. Fulfillment then runs one sandbox test order through a `FlatCardPrinter` adapter (CTO/Shop write the adapter) and records the real 25/50/100 quote. Realistic only if the account exists by about Oct 20. Otherwise criterion 1 stays "not met".
4. CFO confirms 25% contribution at the real quote (criterion 2).
5. Owner decides go or no-go. If go, the proof must be ordered by Nov 6.

Fulfillment recommendation: Gooten primary for the Phase 1 ship-to-me card, Prodigi 7X5 only if US production is confirmed in writing. Do not offer mail-for-me at Christmas. Do not accept Gooten as chosen until a written answer and a sandbox order exist.

## 5. Ops processes not yet written

- Vendor contact and escalation sheet (account managers, support addresses, SLA), because no account exists.
- Lulu and Prodigi claim procedure and credit terms: "per printer terms (not yet read)" in `01`.
- Refund and reprint limit: owner has not set it; typo and goodwill rule, Support versus Ops conflict (PLAN decision 6).
- Daily and peak-season order watch (who looks at `needs_attention`, how often, alert channel). The read-only endpoint exists, no alerting is wired.
- Inbound quality control for the first order of each template (photo-card physical proof check is in a checklist only).
- Delivered-state rule: PLAN suggests N days after ship date. N is not chosen. This also drives the data-scrub promise.
- Shipping tier decision (Lulu `MAIL` and Prodigi `Budget` may lack tracking) and the phone number requirement for Lulu.
- Backup printer switch-over steps; a second printer is named in `04` but untested.
- Peak-week capacity plan and customer-facing late-order messaging templates (Support/CX).
- Gooten-specific playbook rows (partial reprint, AK/HI 7 to 12 extra days).
- Post-season data capture: actual production and transit days per order, `04` is empty.

## 6. Owner asks (consolidated)

Approve vendor contact; open Lulu, Prodigi and Gooten accounts and sandboxes and supply sandbox keys; order physical proofs (book, folded card, flat card) and approve quality; approve the Christmas cut-off dates; set the refund and reprint limit; make the Oct 24 call.
