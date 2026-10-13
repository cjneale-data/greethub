# Christmas 2026 order-by dates

Owner: Fulfillment. Version 2026-10-12. Status: PROPOSED. Owner approves before they are shown to customers.
Source of truth in code: `CHRISTMAS_2026` in `app/lib/shop/fulfillmentOps.ts` (dates are derived from the inputs below; change the inputs, not the dates). Exposed at `/api/admin/orders/exceptions` as `cutoffs`. Not yet shown on checkout (Shop/CX to wire a banner).

## Dates (delivery to the lower 48 before Dec 25)

| Product | Standard | Express |
|---|---|---|
| Picture book | Wed Dec 2 | Thu Dec 3 |
| Mailed card | Thu Dec 10 | Fri Dec 11 |
| Digital card or book | Any time; delivered by email | |

Method: order-by = carrier send-by date, minus printer production, minus safety, in business days.

| Input | Book | Card | Source |
|---|---|---|---|
| Carrier send-by, standard | Dec 17 | Dec 17 | USPS 2026 Ground Advantage, lower 48 (reported 2026-09-23 by valueaddedresource.net and local news citing https://www.usps.com/holiday/holiday-shipping-dates.htm, read 2026-10-12) |
| Carrier send-by, express | Dec 18 | Dec 18 | USPS 2026 Priority Mail (same sources) |
| Production, business days | 8 | 3 | Book: Lulu says hardcovers about 5 business days, 5-8 in Q4 (https://www.thetilt.com/wp-content/uploads/2024/06/lulu-getting-started.pdf; https://blog.lulu.com/5-ways-to-get-your-lulu-xpress-shopify-store-ready-for-the-holidays, undated; read 2026-10-12). Card: GUESS, no Prodigi figure found |
| Safety, business days | 3 | 2 | No sandbox run, first season |

Alaska and Hawaii: USPS Ground Advantage send-by is Dec 16; tell those customers one day earlier, or (simpler) publish the dates above as lower-48 only.

## What is not known (each can move the dates)

- Which carrier and service Lulu `MAIL` and Prodigi `Budget` actually use, and whether they are tracked. If `MAIL` is media or bulk mail, standard book dates move earlier by about a week. Sandbox quote answers this.
- Lulu's and Prodigi's own 2026 holiday cut-offs: not found. Check their help centres in early November.
- Where Prodigi prints the chosen card SKU. If outside the US, card dates are wrong by a week or more.
- Lulu Q4 backlog. Lulu's 2022 support note says production slows with volume and holidays.

## Readiness call

Express buys one day for Christmas because printer production, not transit, is the bottleneck. It does not justify $8.99 as a "get it by Christmas" upsell; keep it off (CFO already recommends off until a quote exists).

As of today no real order has printed. If the sandbox runs and a physical proof are not done by **Nov 13**, do not promise Christmas delivery for books at all: show "Order by Dec 2; delivery before Christmas is likely but not guaranteed" or sell books as "arrives after the holidays, with a printable gift note for the day". Cards follow the same rule with a **Nov 20** gate. The digital book and e-card are the fallback gift after the cut-off: show them on checkout once a cut-off passes.

## Where the dates must appear (once approved)

Checkout banner, cart, the help article on shipping, the FAQ, holiday landing pages, and marketing email. Every place reads the same config. Turn the banner on from Nov 15 (or launch day if later).

## After the season

Record actual production days and transit days per order (`04-vendor-tracking.md`) and reset the inputs for Valentine's Day 2027 and Mother's Day 2027 from real data.
