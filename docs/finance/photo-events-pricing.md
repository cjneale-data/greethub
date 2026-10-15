# Photo cards and events: pricing and unit economics

CFO, 2026-10-14. This is a proposal: no price is approved, and none of it is legal or tax advice. Printer costs are **ASSUMPTIONS** based on public POD benchmarks, because docs/ops/photo-events-printing.md does not exist yet. Replace them with fulfillment's quotes before Oct 24. Labels used below: MEASURED, EXTRAPOLATED, SOURCED, ASSUMPTION, GUESS.

## 1. Headline

- Flat 5x7 holiday card, envelope included, both sides printed: **$2.49 / $1.99 / $1.79 / $1.59 / $1.49 per card** (10 / 25 / 50 / 100 / 200+). Standard shipping to you is **$6.99** per order.
- Recipient and return addressing are **free** (Minted already includes it, so it's table stakes).
- Mail-for-me: **$0.99 per card plus postage at cost**.
- Contribution per holiday order: about **$16 at 25 cards (29%), $33 at 50 (34%), $62 at 100 (37%)**. A 50-card order earns more than one book.
- AI cost is noise: $0.07 to $0.15 per order. Margin depends on print cost, envelopes, the shipping box and the minimum order.

## 2. Price ladders (per card, merchandise only)

| Qty band | Holiday 5x7 | Save the date 5x7 | Save the date 4x6 postcard | Invitation 5x7 |
|---|---:|---:|---:|---:|
| 10-24 | $2.49 | $2.69 | $1.79 | $2.99 |
| 25-49 | $1.99 | $2.29 | $1.49 | $2.59 |
| 50-99 | $1.79 | $1.99 | $1.29 | $2.29 |
| 100-199 | $1.59 | $1.79 | $1.09 | $1.99 |
| 200-300 | $1.49 | $1.69 | $0.99 | $1.89 |

- **Pricing rule:** the band price applies to every card in the order (all-units pricing). Holiday orders go up to 200, the others to 300. The minimum is 10.
- **Envelopes:** included with every 5x7 card. A 4x6 postcard has no envelope.
- **Invitation add-ons (per card, flat):** RSVP card 3.5x5 with an A1 envelope, $0.89 (it is not stamped). Details card 4x6, $0.69.
- **Premium paper (pearl or heavy):** +$0.40 a card. Foil comes later.
- **AI-illustrated background:** free, so it sets us apart. It costs $0.08 an order.

## 3. Digital event pages

| | Free | Event Plus |
|---|---|---|
| Price | $0 | **$14.99 per event** |
| Guests | up to 75 | up to 500 (abuse cap) |
| RSVP | attending, party size, note | plus meal choices, plus-ones, custom questions |
| Reminders | none | 3 reminder emails, "who hasn't answered" |
| Other | CSV export, small "Made with GreetHub" footer | password, custom link, no footer, emailed digital invitation |
| Included free | | with a printed invitation or save the date order of 50+, and for Plus and Card Club members |

- **What it costs us:** email is about $0.0004 a send (ASSUMPTION from Resend's plan price). A 300-guest event with 4 sends comes to about $0.50, and Stripe takes $0.73, so Event Plus nets about $13.75.
- **Why there are no reminders on Free:** this keeps spam abuse down (security and trust and safety to confirm).

## 4. Delivery options

- **Ship to me:** $6.99 flat per order. One box holds all cards and envelopes, addressed or blank.
- **Mail for me:** $0.99 a card for printing the address, stamping and mailing it, plus postage at cost. Postage covers no shipping box.
  - Postage today: a Forever stamp for a 5x7 in an envelope is $0.78 (SOURCED). USPS filed to raise it to $0.82 in July 2026, and the 4x6 postcard rate goes from $0.61 to $0.65. I could not confirm the change took effect, so I modelled $0.82 and $0.65. Read postage from config, never hardcode it.
  - Limits: 1 oz only, and no square cards (both raise the price).
- **Discounts:** never apply to postage.

## 5. Cost assumptions

| Line | Value | Label |
|---|---|---|
| Flat 5x7 print + A7 envelope, 2-sided | $1.10 / $0.95 / $0.80 / $0.68 / $0.62 per card by band | ASSUMPTION (Gooten/Prodigi-class flat cards) |
| 4x6 postcard print | $0.60 / $0.50 / $0.45 / $0.40 / $0.36 | ASSUMPTION |
| RSVP card + envelope / details card | $0.40 / $0.35 | ASSUMPTION |
| Premium paper uplift | $0.20 a card | ASSUMPTION |
| Printed addressing | $0.15 an envelope ($0.05 on a postcard) | ASSUMPTION |
| Printer order handling | $1.50 an order | ASSUMPTION |
| Ship-to-me box (USPS Ground Advantage) | $6.00 / $7.00 / $8.00 / $9.50 / $11.00 | ASSUMPTION |
| Mail-for-me handling (partner) | $0.55 a card | ASSUMPTION (Lob, PostGrid, Thanks.io class) |
| Photo ranking | $0.05 (20 photos x $0.0025 vision) | MEASURED unit, EXTRAPOLATED count |
| Proof check (Sonnet + one vision pass, 2 proofs) | $0.02 | EXTRAPOLATED |
| AI background (2K render + QA, 20% re-roll, 5.5% fee) | $0.08 | EXTRAPOLATED from $0.0609 |
| Reprint and typo allowance | 4% of print, addressing and shipping | GUESS (batch typos are costly) |
| Support | $0.75 an order | GUESS |
| Stripe | 2.9% + $0.30 | SOURCED |

## 6. Unit economics per order (holiday 5x7, addressed, with AI background)

| | 25 ship | 50 ship | 100 ship | 50 mail-for-me |
|---|---:|---:|---:|---:|
| Cards | $49.75 | $89.50 | $159.00 | $89.50 |
| Shipping / mail-for-me + postage | $6.99 | $6.99 | $6.99 | $90.50 |
| **Revenue** | **$56.74** | **$96.49** | **$165.99** | **$180.00** |
| Print + envelopes | 23.75 | 40.00 | 68.00 | 40.00 |
| Addressing | 3.75 | 7.50 | 15.00 | 7.50 |
| Box shipping / partner handling | 7.00 | 8.00 | 9.50 | 27.50 |
| Postage | | | | 41.00 |
| Order handling | 1.50 | 1.50 | 1.50 | 1.50 |
| Reprint allowance | 1.44 | 2.28 | 3.76 | 3.06 |
| AI, support | 0.90 | 0.90 | 0.90 | 0.90 |
| Stripe | 1.95 | 3.10 | 5.11 | 5.52 |
| **Contribution** | **$16.45 (29%)** | **$33.21 (34%)** | **$62.22 (37%)** | **$53.02 (29%)** |

- **Other orders at 50:** a 4x6 save the date earns $33.38 (47%). An invitation with RSVP cards ($165.99) earns $78.86 (48%).
- **The 10-card minimum** earns about $9, so it still covers setup.
- **Sensitivity:** if print comes in $0.30 a card above my assumption, a 50-card order drops to about $18. Below $0.95 a card at 50, I would raise every band by $0.20.

## 7. Competitor positioning

- Minted: about $2.28 each for 50 5x7s, with free addressing (SOURCED via the plan's sources).
- Pinhole Press: $1.99. Zazzle: $1.44 to $1.99 (SOURCED via the plan's sources).
- Vistaprint (under $1), Shutterfly (list $2 to $3 with near-constant 40-60% promos) and Artifact Uprising (over $3): **not verified**. Market intel is checking these in docs/market/03.
- Digital: Paperless Post charges about $0.22 to $0.30 per premium send ($22 to $30 for 100 guests). Zola and Joy offer free RSVP with a wedding site. Evite has paid tiers (prices not verified).

**Position:** below Minted and at Zazzle, Pinhole and post-promo Shutterfly prices. AI photo picks, the proof checker and free addressing are the reasons to pay more than Vistaprint. Don't run a 50%-off promo culture. Event Plus sits under Paperless Post for any list over 60 guests.

## 8. Membership discounts

- **Batch discount:** Plus gets 10% and Card Club 15% off batch merchandise, add-ons and premium paper. It never applies to shipping, the mail-for-me fee or postage, and it doesn't stack with codes (the larger one applies).
- **Event Plus:** free for both tiers.
- **Cost at 50 holiday cards:** contribution drops from $33.21 to $24.52 (Plus) or $20.18 (Card Club).
- **Why it is still worth it:** a Card Club member who sends one batch a year saves about $13, and their membership earns $34 to $51 a year.
- **Spec:** add new keys `batch_print_discount_pct` and `event_page_plus_included` to the entitlements spec. They are separate from `printed_card_discount_pct`.

## 9. Rows the financial model needs (new Inputs section 19, "Photo and events")

- **Prices:** the 4 ladders x 5 bands, RSVP and details add-ons, premium paper, shipping, mail-for-me fee, Event Plus, the free-Event-Plus order threshold.
- **Costs:** print cost by product and band, RSVP and details print, addressing per envelope and per postcard, premium uplift, order handling, box shipping by band, mail-for-me handling, letter and postcard postage, AI per order, email per send, reprint %, support per order.
- **Mix (GUESS until data):**
  - average order of 50 holiday cards, 75 save the dates, 100 invitations
  - 70% of orders addressed, 15% mail-for-me, 20% premium paper, 40% AI background
  - 60% of invitation orders add RSVP cards, 40% add details cards
  - Event Plus on 25% of digital-only events
- **Volume and seasonality:** orders a month by product. Holiday orders run Nov 1 to Dec 10 (about 70% of them in the first two weeks of December). Save the dates peak Jan to Mar and invitations Mar to Jun.
- **Members:** share of batch orders from members, and the discount uptake.
- **Forecast rows:**
  - batch orders and cards by product
  - merchandise, add-on, shipping, mail-for-me fee and Event Plus revenue
  - **postage pass-through on its own row**, with an equal cost row so it doesn't inflate margin %
  - COGS lines and contribution
- **Unit Economics block:** mirrors section 6.

## 10. Price config (USD cents)

```json
{
  "version": "2026-10-14",
  "status": "proposal_not_approved",
  "minQty": 10,
  "bands": [10, 25, 50, 100, 200],
  "maxQty": { "holiday_flat_5x7": 200, "save_date_flat_5x7": 300, "save_date_postcard_4x6": 300, "invitation_flat_5x7": 300 },
  "pricingRule": "all_units_at_band_price",
  "unitCentsByBand": {
    "holiday_flat_5x7":       [249, 199, 179, 159, 149],
    "save_date_flat_5x7":     [269, 229, 199, 179, 169],
    "save_date_postcard_4x6": [179, 149, 129, 109,  99],
    "invitation_flat_5x7":    [299, 259, 229, 199, 189]
  },
  "envelopeIncluded": { "holiday_flat_5x7": true, "save_date_flat_5x7": true, "save_date_postcard_4x6": false, "invitation_flat_5x7": true },
  "addOnUnitCents": { "rsvp_card_3_5x5_with_envelope": 89, "details_card_4x6": 69, "premium_paper": 40, "ai_background": 0 },
  "addressing": { "recipientAddressCents": 0, "returnAddressCents": 0 },
  "delivery": {
    "ship_to_me": { "orderCents": 699 },
    "mail_for_me": { "perCardCents": 99, "postagePassThrough": true, "postageCentsConfig": { "letter_1oz": 82, "postcard": 65 }, "postageNote": "verify current USPS rate; read from config" }
  },
  "eventPage": {
    "free": { "cents": 0, "maxGuests": 75, "reminders": 0, "footer": true },
    "plus": { "cents": 1499, "maxGuests": 500, "reminders": 3, "footer": false, "freeWithPrintedOrderMinQty": 50 }
  },
  "membership": {
    "plus":      { "batch_print_discount_pct": 10, "event_page_plus_included": true },
    "card_club": { "batch_print_discount_pct": 15, "event_page_plus_included": true },
    "discountExcludes": ["ship_to_me", "mail_for_me_fee", "postage"],
    "stacksWithCodes": false
  }
}
```

## 11. Open items

- **Fulfillment:** real per-card, envelope, addressing and mail-for-me quotes at 25, 50 and 100. If 5x7 print is over $0.95 at 50, I re-price.
- **Finance ops and attorney:** whether postage pass-through is revenue or an agent pass-through, and sales tax on separately stated postage by state.
- **Owner:** approve the prices; decide whether to offer free shipping at 100+ (it costs $6.99, leaving about $55 at 100).
- **CFO, not done:** the workbook is not updated (per brief).

Sources: USPS rate reports read 2026-10-14: [The Letter Pilot](https://theletterpilot.com/guides/how-much-are-stamps), [ABC13](https://abc13.com/post/usps-forever-stamp-prices-increase-sunday-approved/19463702/), [NBC Palm Springs, 2026-07-06](https://www.nbcpalmsprings.com/2026/07/06/stamp-prices-set-to-rise-sunday-if-federal-approval-is-granted). Competitor prices: sources listed in docs/products/photo-cards-and-events-plan.md (not re-verified).
