# Photo cards and events: printing and mailing options

Owner: Fulfillment. Version 2026-10-15. Status: PROPOSED, input to the Oct 24 go/no-go. Plan: docs/products/photo-cards-and-events-plan.md (sections 3, 5, 6). Architecture: docs/cto/photo-events-architecture.md (section 5, `FlatCardPrinter`).
Research only. No account was opened, no sandbox call made, no sample ordered, no money spent. Every price below is a published list price read from a public page on 2026-10-15 unless it says otherwise. "Not found" means I looked and the page did not say.

## 1. Bottom line

1. **Primary for Phase 1 (ship-to-me, flat 5x7, envelopes included): Gooten flat cards.** It is the only candidate I found that publishes all four things we need on one page: flat 5x7, a matching 5.25x7.25 envelope included with every card, US production, and quantities of 1 to 100 with tiered pricing. It prints in the US (1.5 days average production, 3 days average transit, per its page), which fits the Dec 17 USPS send-by in docs/ops/03-holiday-cutoffs-2026.md.
2. **Backup: Prodigi, but only after one question is answered.** We already have the adapter, so it is the cheapest fallback to wire. Its flat 5x7 postcard (`GLOBAL-POST-MOH-7X5`, `GLOBAL-POST-GLOS-7X5`) is a postcard stock with optional Kraft envelopes, and only the Mohawk 7x5 is listed as shipping from the US (Prodigi page, read 2026-10-15). If a sandbox quote shows US production and a US ship cost, it is a real backup. If not, the backup is Printify (flat greeting cards, envelopes included, 1 to 1000) or Gelato, both unverified.
3. **Mail-for-me (per-recipient mailing) is not a Christmas 2026 feature.** No print-and-mail API I found sends a flat 5x7 photo card in an envelope. Lob and PostGrid mail postcards only (4x6, 6x9, 6x11). Thanks.io has a folded notecard but not a flat 5x7. This matches the plan: mail-for-me is Phase 2. For Phase 2 save the dates, the 4x6 postcard through Lob or PostGrid is a clean fit. Details in section 4.
4. **Recipient address printing on envelopes for Christmas: not available from any ship-to-me vendor I checked.** Gooten's page mentions no envelope printing. So Christmas v1 should ship blank envelopes, and the return-address and recipient-address PDFs the CTO describes (architecture section 4.6) become a "print at home" download, not a vendor feature. Confirm with Gooten support before promising anything (owner/ops ask below).
5. **Go/no-go input from Fulfillment:** printing is feasible for a ship-to-me, blank-envelope Christmas launch if a Gooten sandbox order and one physical proof pass by **Nov 6**. It is not proven today. Nothing here has been tested.

## 2. What we need (from the plan)

Flat 5x7 (and 4x6) card, 1 or 2 sided, 300 dpi with 0.125 in bleed, envelope included, 25/50/100 per order, US delivery, an API we can call from a server adapter, a sandbox, and production plus transit inside the Dec 17 send-by.

## 3. Comparison

Prices are per card, vendor list, US. "n/a" = not offered or not found.

| | Gooten flat cards | Prodigi flat postcards | Printify flat greeting cards | Gelato cards |
|---|---|---|---|---|
| Flat 5x7 | Yes (also 4x6, 4.25x5.5, 5x5; the order menu shows only 4.25x5.5 and 5x7) | Yes, 7x5 and 6x4 postcard stock (page text says 6x4/7x5, spec table says 4x6/5x7; confirm) | Yes (listing only; no detail read) | Cards in four sizes; flat 5x7 not confirmed |
| Paper | 100# Dull, 100# Uncoated, 111# Matte, 120# Silk; white | Mohawk 324gsm recycled, or 280gsm gloss laminated. Postcard stock, thicker and glossier than a card stock | Not found | Not found |
| Double-sided | Yes | Yes (front and back) | Not found | Not found |
| Envelope | White sealable, included: 5.25x7.25 for 5x7 | Optional brown Kraft, "with or without" | "Envelopes included" in the title | Envelope option exists |
| Printed address on envelope | No (not stated) | No (not stated for US) | Not found | Not found |
| Cost per card, 25 / 50 / 100 | Not published. Page shows "volume pricing starts at" 5x7 Dull: 1 card $1.75, 10-pack $12.00 ($1.20 each). Another search snippet shows $0.35 single and $2.81 per 10-pack for the same product, which conflicts; treat both as unverified. Get a real quote | From GBP 1.00 wholesale (a postcard, excl. tax and shipping). US price needs an account | From EUR 0.37 (provider dependent) | Not found, shows only at checkout |
| Pack sizes | 1, 5, 10, 25, 50, 100 | 10, 20, 50, 100, or singles | 1 to 1000 | Packs of ten for flat postcards |
| Shipping cost | "Starts at" $4.99 standard, $16.49 / $16.99 / $19.99 other tiers (page does not map them to regions) | Not found | Not found | Not found |
| Where printed | US (stated) | UK and EU; only `GLOBAL-POST-MOH-7X5` listed as also shipping from the US | Depends on provider | "Locally through partners" |
| Production time | 1.5 days avg, 3 days avg transit | 24 to 72 hours | Not found | Not found |
| API fit | Gooten general API exists; the flat-card page does not describe a flat-card API. Verify the product is in the API catalog | **Yes, and we already have an adapter** (`app/lib/adapters/index.ts`, sandbox base `api.sandbox.prodigi.com/v4.0`) | Public API exists (Printify general API), not checked for this product | Public API exists, not checked |
| Sandbox | Not found | Yes (existing sandbox base) | Not found | Not found |
| Photo quality for a family portrait | Inkjet digital on card stock; unknown colour accuracy | Probably the strongest finish (laminated gloss), but it is a postcard, not a card | Unknown | Unknown |
| Verdict | **Primary** | **Backup, conditional on US production** | Reserve | Reserve |

Sources (all read 2026-10-15): Gooten https://www.gooten.com/print-on-demand/flat-cards/ ; Prodigi https://www.prodigi.com/products/cards-and-stationery/postcards/fine-art-postcards/ and https://www.prodigi.com/products/cards-and-stationery/greetings-cards/ ; Printify https://printify.com/app/products/10717/generic-brand/flat-greeting-cards-envelopes-included (listing found by search; the page itself would not load, so only the search summary is the source); Gelato https://www.gelato.com/uk/print-on-demand/postcards and https://gelato.com/ca/products/greeting-cards (search summaries only).

Caveats on the table: the Prodigi page says Mail4Me and Mail2Me terms do not appear on it, so the fulfilment-mode wording in a search summary is not confirmed. The Prodigi greeting card pages list only EU and UK origin, so the existing folded-card SKU may already print outside the US (also flagged in 03-holiday-cutoffs-2026.md). I could not compare print quality; no samples exist and quality is an owner step.

## 4. Mailing partners (per-recipient, Phase 2 and later)

| | Lob | PostGrid | Thanks.io | Stannp |
|---|---|---|---|---|
| Products | Postcards 4x6, 6x9; letters; self-mailers (Enterprise only). No 5x7, no card with envelope | Postcards 4x6, 6x9, 6x11; letters; self-mailers (talk to sales). No 5x7, no envelope card | 4x6, 6x9, 6x11 postcards; folded Notecard; letters (handwriting style) | Postcards, letters, self-mailers. Prices did not load |
| 4x6 First Class, postage and print included | Dev $0.905; Startup $0.645 (plan $260/mo); Growth $0.615 (plan $550/mo). Rises to $0.909 / $0.649 / $0.619 on 2026-11-01 | $0.902 Starter (plan $0/mo, up to 500 mailings/mo, overage fee above) | $1.18 pay as you go; $0.77 Business ($49/mo); $0.64 Professional ($199/mo). Standard Mail is the default; First Class is +$0.05 | Not found |
| 6x9 First Class | $1.026 Dev | $1.023 | $1.65 PAYG | Not found |
| Notecard / card with envelope | n/a | n/a | $3.04 PAYG, $1.83, $1.49 (folded; the page does not say envelope is included) | n/a |
| Production time | Not stated on the page | First Class 5 to 7 business days; Standard 10 to 15 | Delivery estimate 1 to 5 business days First Class, 3 to 10 Standard | Prints and mails next business day (per its page) |
| Address handling | Data API, verification and NCOA are separate Lob products (not read) | Data API; NCOA on Enterprise | Data API | Data API |
| API | Yes, full | Yes, full | Yes, included on PAYG, pre-funded balance | Yes (not read) |
| Sandbox | "Developer" plan exists; test mode not read | Not read | Not read | Not read |

Notes:
- **Postage is bundled in these prices** (all four say print, postage and processing are included), so they are not directly comparable to a bulk card price. A bare USPS postcard stamp was reported at $0.61 for a card no larger than 4.25 x 6 in, with a proposed increase to $0.65 from July 12, 2026 that I could not confirm took effect (catdi.com, undated, via search summary). A 5x7 card in an A7 envelope is a letter, not a postcard. The plan cites $0.78 for a Forever stamp in 2025. Treat the 2026 letter rate as not verified; CFO and finance ops should check usps.com.
- **Why not mail a 5x7 through these:** Lob and PostGrid will print a 4x6 postcard from our PDF and mail it with a printed address. That works for a **4x6 save the date postcard** (Phase 2) at roughly $0.65 to $0.90 all in per recipient, versus about $2.00 or more to ship a 5x7 card plus envelope plus stamp ourselves. It does not work for a Christmas 5x7 photo card in an envelope.
- **Mail-for-me for 5x7 flat cards in envelopes:** possible only by dropshipping one single-card order per recipient through a card printer (Gooten or Prodigi singles, each with its own shipping charge, likely $5 or more each per Gooten's "starts at $4.99"). That is a poor price for guests and a large number of API jobs. I would not offer it for Christmas.
- **Legal and data:** every mailing partner receives other people's names and addresses. Data processing agreements and retention terms need Privacy ops and the attorney before Phase 2. Not reviewed here.

## 5. Recommendation

| Phase | Primary | Backup |
|---|---|---|
| Phase 1, Christmas 2026 (flat 5x7, ship to me, blank envelopes in the box) | Gooten flat cards | Prodigi `GLOBAL-POST-MOH-7X5` if US production is confirmed, else Printify or Gelato |
| Phase 2, save the dates (4x6 postcard, mail for me) | PostGrid Starter ($0 plan, $0.902, 500/mo cap, simplest) or Lob if volume passes about 500/mo | Thanks.io (cheapest per piece on its $49 plan; weaker "transactional" fit, check terms) |
| Phase 2, ship to me | Same as Phase 1 | Same as Phase 1 |

Why Gooten first: US production, envelope included, 1 to 100 packs, a stated lead time, and the rest of the stack (a printer adapter behind `FlatCardPrinter`) is the CTO's design. Why not Prodigi first: familiar adapter, but flat 5x7 there is a postcard product with UK/EU origin for most SKUs, and a transatlantic transit would break the Dec 17 send-by. Why not a mailing platform first: no 5x7 in an envelope.

Weak points of this pick, stated plainly:
1. I could not confirm Gooten has a flat-card API endpoint, a sandbox, or a stable price at 25/50/100. This is the item that decides go or no-go.
2. Inkjet on card stock is unproven for portrait skin tones and dark backgrounds. A physical proof is required.
3. A one-vendor Phase 1 has no tested second route. The Prodigi fallback needs one sandbox quote to qualify.

## 6. Test plan before the go/no-go (all sandbox or free quote; physical proofs are owner steps)

By Oct 20 (Fulfillment, no cost):
1. Ask Gooten sales or support, in writing: (a) is flat 5x7 orderable via API and what is the product id; (b) a sandbox or test-order mode; (c) price at 25, 50, 100, double-sided, matte; (d) shipping cost and service for one box of 25/50/100 to a US address; (e) 2026 Christmas order-by dates for production and shipping; (f) can envelopes be returned-address printed or recipient-addressed (and cost); (g) file spec: PDF, bleed, colour profile, whether a back side is a second PDF.
2. Ask Prodigi the same list for `GLOBAL-POST-MOH-7X5` and `GLOBAL-POST-GLOS-7X5`, plus whether US origin applies to the gloss SKU and what it quotes for US delivery.
3. If the adapter work exists in the sandbox: run a Prodigi sandbox quote and order for `GLOBAL-POST-MOH-7X5` with a mock PDF (no customer photos, a stock graphic) and record the response and the ship-from country. The existing sandbox base URL already points at `api.sandbox.prodigi.com`. Do not use real keys in docs or logs.

By Oct 24 (go/no-go):
4. Fill the table below with real answers. No answer from a vendor is a "no" for Christmas, not an assumption.

By Nov 6 (hard gate for a Christmas launch):
5. Run the sandbox order end to end through the new `FlatCardPrinter` fake, then the real sandbox.
6. Owner orders one physical proof set from the primary vendor (a 5x7 of each template family, single and double sided, one with a dark background, one with a portrait close-up) and approves print quality. Ordering and approving are owner steps.

By Nov 13: second proof only if the first fails or a template changes.

### Open questions to fill in (answers decide the pick)

| Question | Gooten | Prodigi 7X5 | Date asked | Date answered |
|---|---|---|---|---|
| Flat 5x7 via API | | | | |
| Sandbox | | | | |
| Price at 25 / 50 / 100 | | | | |
| Ship cost per box | | | | |
| US production | stated yes | to check | | |
| Dec order-by | | | | |
| Envelope addressing | | | | |

## 7. Pre-print file checks for flat cards

Reuse docs/ops/02-preflight-and-sandbox.md and apply:
- Trim 5.0 x 7.0 in; file 5.25 x 7.25 in including 0.125 bleed (the Gooten page lists this exactly; our spec matches). 4x6: 4.25 x 6.25.
- Photo slots: effective dpi 300 target; warn below 200, block below 150 (CTO). Full-bleed photos must cover the bleed.
- Safe area 0.25 in inside trim. Names, dates, QR keep out of the outer 0.25 in.
- Fonts embedded (pdf-lib full subsets, CTO). No font substitution possible.
- Colour: RGB source; vendors convert. Dark backgrounds and saturated blues shift most in conversion; that is what the physical proof checks. ICC requirements per vendor: not found, ask (question g).
- Two-sided: confirm which vendor wants front and back as separate PDFs or one two-page PDF, and the back orientation (head-to-head versus head-to-foot). Wrong orientation on the back is the commonest flat-card defect.
- QR codes: minimum 0.8 in square, black on white, test scan from the proof JPEG (Phase 2).

## 8. Batch proof and reprint process

Batch orders change the exception playbook in docs/ops/01-order-exception-playbook.md: one error is 25 to 200 cards and 6 to 20 recipients may see it. Rules for photo cards and events:

**Proof**
1. Customer approves the full-size proof JPEG of every side before payment is captured. The proof checker (names, weekday and date, year, RSVP before event) runs first; warnings must be acknowledged, not dismissed silently.
2. Show the quantity and the envelope choice next to "Approve", so the customer is approving a batch.
3. The approved design version is frozen at checkout and the order points to it (CTO principle 3). No edits after payment except through support, which creates a new version and a new proof.
4. Fulfillment checks every first-time template on a physical proof (owner step) before it is sold. After that, per-order proofs are digital only. Offer a physical proof of the actual order as a paid option for save the dates and invitations (CFO to price); do not offer it for Christmas, there is no time.
5. Before submitting to the vendor, compare the PDF page count, page size and trim/bleed boxes with the print size (existing preflight). Log the file hash with the vendor id.

**Reprint rules (drafts for the owner; refund limit is the owner's call)**
- Vendor print defect, damage, wrong item or short count: GreetHub reprints or refunds the affected cards at our cost, per the existing playbook. Fulfillment decides; claim from the vendor.
- Typo or wrong date the customer approved on the proof: customer cost. We offer the vendor-cost reprint at a discount if the owner approves a goodwill amount. Support does not decide this.
- Typo that the proof checker should have caught (date and weekday mismatch, name misspelled differently from the brief): treat as a GreetHub defect and reprint; Product/QA review the rule.
- Partial reprints: reprint the shortage only (for example 6 of 50), not the batch, when the vendor allows a smaller quantity; Gooten page lists packs from 1, so likely yes. Prodigi packs start at 10 or singles.
- Late: after the Dec cut-off the vendor and carrier are not under our control. We refund shipping and offer the digital card plus a printable gift note; do not promise a delivery date.

**Late and lost for batch orders**
- One box, one tracking number: lost box is a total loss, reprint at once, escalate to the vendor claim. Declare a stock fallback only if time allows (before Dec 14).
- Mail-for-me (Phase 2): track per recipient (`batch_jobs`, CTO section 3). A recipient-level failure (returned mail, bad address) is flagged to the host by email within 2 business days with the corrected-address form; resend is at postage and print cost.

**Addresses (for the mail-for-me and addressed-envelope cases)**
- USPS validation before checkout (CTO `AddressValidator`). Undeliverable addresses block the line item with a clear fix prompt; do not silently drop recipients.
- Recipient lists are third-party data: use only to fulfil the order, scrub after the reprint window (Privacy ops sets the number), never use for marketing, never in logs.

## 9. December 2026 cut-offs for photo cards

Source of truth stays `CHRISTMAS_2026` in `app/lib/shop/fulfillmentOps.ts` (docs/ops/03-holiday-cutoffs-2026.md). Inputs for a Gooten ship-to-me card, using the vendor's own averages:

| Input | Value | Source |
|---|---|---|
| Carrier send-by, USPS Ground Advantage, lower 48 | Dec 17 | docs/ops/03 (USPS, reported 2026-09-23); another guide reports FedEx Ground Economy Dec 15 and FedEx standard ground Dec 17 to 23 (shippypro.com 2026 guide, via search summary, read 2026-10-15) |
| Gooten production | 1.5 days average | Gooten page, 2026-10-15. Q4 backlog not stated |
| Gooten transit | 3 days average (standard) | Same |
| Safety | 3 business days (higher than a single card because a batch re-run has no time left) | Fulfillment judgement |

Proposed: print-ready, paid and submitted by **Mon Dec 7** for a Gooten standard service delivered before Dec 25, which is earlier than the Dec 10 mailed-card date in the existing config. If the owner wants **Dec 5** for the soft launch (plan), that is consistent. Gooten's own 2026 order-by table: not found; ask (question e). Prodigi's: not found. PostGrid First Class needs 5 to 7 business days production plus delivery, so a mailed postcard for Christmas would need to be ordered by about **Dec 1**; do not offer mail-for-me at Christmas anyway.

Alaska and Hawaii: tell those customers one day earlier. Gooten says AK, HI, PR and territories take 7 to 12 additional business days, so do not guarantee delivery to them for Christmas.

## 10. Vendor tracking additions (for docs/ops/04-vendor-tracking.md, owner or Fulfillment to merge)

Add these columns per vendor and per order once any batch is placed: quantity, production days, transit days, unit price at that tier, ship cost, defect count (cards), reprint count. Cost-model targets from the CFO belong in docs/finance/photo-events-pricing.md and are not copied here; compare the first real quote against it.

## 11. Owner asks

1. Approve contacting Gooten and Prodigi (sales or support, plain email) with the questions in section 6. Opening a Gooten account or sandbox is an owner step if one is required; I did not register anywhere.
2. Order one physical proof set from the chosen primary vendor by Nov 6 and approve print quality.
3. Decide the goodwill rule for approved-proof typos (section 8) and the refund limit for batch reprints.
4. If the owner agrees, do not offer mail-for-me for Christmas.

## 12. Not done, not verified

- No vendor was contacted, no account opened, no sandbox called, no sample ordered, no paid model call.
- Gooten per-card price at 25/50/100, its API and sandbox for flat cards, its Christmas cut-off: not found.
- Prodigi US price and US origin for the 5x7 SKUs: not found; its Mail4Me and Mail2Me terms do not appear on the product page.
- Printify and Gelato details come from search summaries only; the Printify page did not load content.
- Stannp prices did not load.
- USPS 2026 letter and postcard rates: not verified.
- Lob production time and sandbox: not read.
- Print quality of any vendor: not assessed.
