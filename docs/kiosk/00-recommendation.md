# 00. Kiosk recommendation: staged go / no-go

Owner: Kiosk Program Lead. Written 2026-10-11. Tags: [V] verified on a primary page, [S] secondary source, [U] unverified or my estimate. Every cost figure in this folder is a planning estimate unless tagged otherwise; the CSV for the CFO is `financial-inputs.csv`.

## Recommendation

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
- kiosk customers become **GreetHub account holders** at a rate that beats the online paid CAC of about $76 (`finance/README.md`). This is the real strategic upside and the least proven number in this plan.

## Honest risks, ranked

1. **Demand is unproven at GreetHub's price.** Precedent exists (Scribbler stores report about 3,000 extra cards each in a year [V], pgbuzz 2025-01-10), but at a lower price (UK suggested £3.49 [S]) and with a catalogue of ready designs, not custom AI art. Card Isle's own site now describes a design-online, pick-up-code, print-at-a-shop model [V], which hints the freestanding-kiosk model did not scale for them (inference [U]).
2. **Making a good folded 5x7 card automatically is hard.** Heavy stock, duplex registration, folding and envelope handling are where kiosk projects jam. This is a custom-engineering problem, not an integration problem.
3. **Latency.** Images take about 16 seconds each at 2K (`finance/measured_costs.json`). The pre-generated template plus personalize flow (file 04) hides most of it, but custom art will always feel slower than a rack card.
4. **Unattended payment and tax.** Stripe's unattended reader (Verifone UX700) is generally available in the US [V], but supports only Visa, Mastercard, Amex and Discover and carries its own rules. Sales tax follows the physical location.
5. **Public-device risk:** abuse, IP, privacy wipe, vandalism. Manageable, but it adds engineering that online does not need.
6. **Cash:** hardware is bought before sales. Retailer terms are unknown (no source gave revenue-share terms).

## What this folder contains

01 market and precedent, 02 product and tiers, 03 hardware BOM, 04 software architecture, 05 business model and unit economics, 06 compliance and legal, 07 R&D plan and costs, 08 financial inputs (and `financial-inputs.csv`), 09 open questions for the owner.
