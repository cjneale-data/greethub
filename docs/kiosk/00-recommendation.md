# 00. Kiosk recommendation: staged go / no-go

Owner: Kiosk Program Lead. Written 2026-10-11. Tags: [V] verified on a primary page, [S] secondary source, [U] unverified or my estimate. Every cost figure in this folder is a planning estimate unless tagged otherwise; the CSV for the CFO is `financial-inputs.csv`.

## Update 2026-10-13: defer P0 behind a start gate

The "GO on P0 now" recommendation below is superseded. The platform assessment (`docs/PLAN.md`, Platform assessment, Kiosk) found:

- **Cash.** The CFO's recommended launch plan ($0 to $2k a month paid, agent-built engineering, new prices) needs about $54k of funding at its low point and breaks even around month 24 only at $0 paid; the base case never breaks even (`finance/README.md`, v3). P0 at $35k base is about two thirds of that need and earns nothing.
- **The app cannot carry a kiosk yet.** No kiosk code, no signed-in card path, no card print PDF wired to orders, local JSON storage, no hosted job queue, no durable spend ledger, no Stripe Terminal (04 section 14). P0's "reuse the existing app" assumption does not hold until those land.
- **The differentiator is not built.** This plan's case is the GreetHub brain (guided chat, saved People, styles, accounts). The card has no competitive edge as built (card engineer, PLAN.md), so a kiosk today would sell an ordinary card next to cheaper catalogue cards.
- **The account upside is smaller than written.** Paid CAC is about $70 against an LTV of about $26 (v3). With paid spend near $0 there is little paid CAC to avoid, so value a kiosk sign-up at its repeat contribution (about 0.7 extra orders x $15.20 = about $11 [U]), not at the CAC.

New sequence: **S0** evidence before spend (after launch, about $100 to $500 cash, no contractors; 07 section 2), then **P0 only if start gate S0 passes and the owner approves it in writing**. In finance workbook v3 the kiosk schedule now starts at M7 (May 2027) and G0 defaults to 0, so only P0 is in the default "Core + Kiosk" numbers. The licensing route (Tier D) stays the cheapest way to a counter; opening it is the owner's call.

## Recommendation (2026-10-11; superseded where the update above differs)

1. **GO on P0 only** (concept validation, about $35k base, 3 months). Borrowed tablet, an off-the-shelf printer, the existing card pipeline. It answers the questions that decide everything else: will people pay about $7 for a card at a counter, does a card print well enough on foldable stock, will a retailer say yes.
2. **NO-GO on hardware build (P1 and later) until two things are true:** (a) the online business has about 6 months of real data (it is not launched yet; the finance model shows no sustained break-even at the CMO's paid budget, `finance/README.md`), and (b) P0 passes its gate (file 07).
3. **If P0 passes, build the first pilot unit from off-the-shelf parts (Tier A/C hybrid, manual fold, clerk or shelf-stocked envelopes), not the freestanding auto-folding machine.** Prove demand at 1 to 3 sites before paying for custom feeding, folding and envelope hardware. Tier B (the freestanding unit) is only worth engineering if the pilot sells at least 5 cards a day per site.
4. **Run a licensing track in parallel.** Existing kiosk operators already sell custom cards in stores (Fujifilm Cardbored with Scribbler, Card Isle). GreetHub's differentiator is the software brain (guided chat, saved People, styles, IP safety, accounts). Licensing it to an operator is a far cheaper way to reach a counter than building hardware. Ask in P0 whether they would integrate; this is a decision for the owner (file 09).

## Why, in numbers (base case, all estimates [U] unless noted)

| Item | Low | Base | High |
|---|---:|---:|---:|
| R&D P0 to P4, 36 months (labor, prototypes, tooling, certs, pilot ops, contingency) | $561k | $1.10M | $2.25M |
| Of which P0 + P1 + P2 (everything before a productized unit) | $251k | $478k | $952k |
| Freestanding unit (Tier B) hardware cost per unit at 10 units | $8.6k | $12.0k | $17.4k |
| Contribution per card, Tier B | $2.23 | $4.40 | $6.22 |
| Cards per kiosk per day (mature) | 2 | 5 | 10 |
| Operating cash per kiosk per month | -$345 | +$407 | +$1,772 |

At the base case a 100-kiosk fleet earns about $41k a month operating contribution by month 36 and has spent about $0.94M on kiosks. Cumulative cash at month 36 is about **-$1.76M** (base R&D, base revenue), -$2.28M with weak sales, -$0.80M with strong sales. Payback on the base case lands around year 6 or later. So the kiosk is not an obvious win on its own cards. It is worth building only if one of these is true (details in file 07 section 8):

- sustained **8 or more cards a day** per kiosk across 100 or more units (annual contribution about $970k), or
- R&D comes in near the **low** case because off-the-shelf tiers are enough, or
- a host or operator **co-funds** hardware (retailer purchase, operator licence), or
- kiosk customers become **GreetHub account holders** at a rate that beats the online paid CAC of about $70 (v3; $76 in v2), or, with paid spend near $0, a repeat contribution of about $11 per account [U] (`finance/README.md`). This is the real strategic upside and the least proven number in this plan.

## Honest risks, ranked

1. **Demand is unproven at GreetHub's price.** Precedent exists (Scribbler stores report about 3,000 extra cards each in a year [V], pgbuzz 2025-01-10), but at a lower price (UK suggested £3.49 [S]) and with a catalogue of ready designs, not custom AI art. Card Isle's own site now describes a design-online, pick-up-code, print-at-a-shop model [V], which hints the freestanding-kiosk model did not scale for them (inference [U]).
2. **Making a good folded 5x7 card automatically is hard.** Heavy stock, duplex registration, folding and envelope handling are where kiosk projects jam. This is a custom-engineering problem, not an integration problem.
3. **Latency.** Images take about 16 seconds each at 2K (`finance/measured_costs.json`). The pre-generated template plus personalize flow (file 04) hides most of it, but custom art will always feel slower than a rack card.
4. **Unattended payment and tax.** Stripe's unattended reader (Verifone UX700) is generally available in the US [V], but supports only Visa, Mastercard, Amex and Discover and carries its own rules. Sales tax follows the physical location.
5. **Public-device risk:** abuse, IP, privacy wipe, vandalism. Manageable, but it adds engineering that online does not need.
6. **Cash:** hardware is bought before sales. Retailer terms are unknown (no source gave revenue-share terms).

## What this folder contains

01 market and precedent, 02 product and tiers, 03 hardware BOM, 04 software architecture, 05 business model and unit economics, 06 compliance and legal, 07 R&D plan and costs, 08 financial inputs (and `financial-inputs.csv`), 09 open questions for the owner.
