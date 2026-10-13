# 05. Business model and unit economics

All figures are planning estimates [U] unless tagged. Full table: `financial-inputs.csv`. Online reference: printed card $7.99 + $2.99 postage, contribution $2.9 to $4.1 a card, paid CAC about $70, LTV about $26 (`finance/README.md` v3, 2026-10-12; $76 in v2).

## 1. Who buys and who hosts

| Model | Who pays for the kiosk | GreetHub earns | Retailer earns | When it fits |
|---|---|---|---|---|
| **A. Revenue share (GreetHub owns, retailer hosts)** | GreetHub (capex) | Net sales minus share | 15% to 35% of net sales [U] | Pilot and early scale; retailer has no risk |
| **B. Flat monthly fee (lease)** | Retailer pays GreetHub about $150 to $400 a month [U]; Scribbler reports about £200 a month rental [S] | Fee plus per-card licence | Keeps card revenue | Retailers who dislike sharing revenue; lowers GreetHub's risk and sales volatility |
| **C. Purchase** | Retailer buys the unit at cost plus margin | Hardware margin plus per-card licence and consumables | Keeps card revenue | Chains with capex budget; Scribbler Australia sold at about A$14,000 [S] |
| **D. Software licence** | Operator brings own hardware | A per-card or monthly fee for the "GreetHub brain" | Operator earns hardware and distribution | Fujifilm/Scribbler-type partner [V: white-label software] |

Recommendation: pilot under **A** (zero cost to the host, simple to say yes) with a clause to convert to **B** if sales are strong. Test **D** in conversations during P0; it is the cheapest route to many counters.

## 2. Unit economics per card (Tier B, base case)

Price $6.99 net of sales tax (sales tax collected on top and remitted; not revenue).

| Line | Low (bad) | Base | High (good) |
|---|---:|---:|---:|
| Price per card | 5.99 | 6.99 | 7.99 |
| Payment fee (2.7% + $0.05 base; 2.9% + $0.30 bad) | 0.47 | 0.24 | 0.27 |
| Location share (35% / 25% / 15% of net) | 2.10 | 1.75 | 1.20 |
| Consumables (03) | 0.64 | 0.40 | 0.23 |
| Model cost incl abandoned sessions (04) | 0.55 | 0.20 | 0.08 |
| **Contribution per card** | **2.23** | **4.40** | **6.22** |

Compare online printed card: price $7.99 + $2.99 postage, print and shipping $3.25 + $1.60 (`finance/README.md`), contribution about $2.9 to $4.1. The kiosk card earns similar or more because it has no shipping but gives a share to the host.

## 3. Per-kiosk monthly economics (Tier B)

| Line | Low (bad) | Base | High (good) |
|---|---:|---:|---:|
| Cards per day | 2 | 5 | 10 |
| Cards per month (30.4 days) | 61 | 152 | 304 |
| Contribution before fixed costs | 136 | 669 | 1,890 |
| Fixed: connectivity, device management, insurance share, service visits, repairs, hosting | 480 | 262 | 118 |
| **Operating cash per month** | **-345** | **+407** | **+1,772** |
| Depreciation (BOM at 10 units over 24 / 36 / 48 months) | 723 | 333 | 180 |
| **Net after depreciation** | **-1,068** | **+75** | **+1,592** |
| Break-even cards per day, cash | 7.1 | 2.0 | 0.6 |
| Break-even cards per day, after depreciation | 17.8 | 4.4 | 1.6 |

Fixed cost detail, base: connectivity $25, device management $12, insurance allocation $40, service visits $128 (1.3 visits at about $100), parts and repairs $47 (about 5% of BOM a year), software hosting allocation $10. All [U].

**Reading it:** at the base case a single kiosk covers its running costs at 2 cards a day and earns back its hardware (about $12k) in about 2.5 years at 5 a day. That is thin, and it does not include the R&D (about $1.1M base over 36 months). The bad case is not survivable: 7 cards a day just to cover cash costs.

Tier A and C are cheaper per unit but earn less per card (Tier A consumables $0.55 a card) and need staff or a till; they suit small sites with low volume and low risk.

## 4. What the R&D must be paid back by

| Fleet at month 36 | Base operating contribution | Annual |
|---|---:|---:|
| 100 kiosks at 3 cards/day | $13.9k/month | $167k |
| 100 kiosks at 5 cards/day | $40.7k/month | $488k |
| 100 kiosks at 8 cards/day | $80.8k/month | $970k |
| 100 kiosks at 10 cards/day | $107.6k/month | $1.29M |

(Contribution per card $4.40 and fixed $262 a month per kiosk, base values.) Against base R&D of $1.10M and fleet capex of $0.94M, payback inside five years needs about 8 cards a day or a much cheaper program (07 section 8).

## 5. Pilot design (1 to 3 locations)

- **Sites:** pick one of each type if possible: an independent gift shop (Tier C), a university bookstore or hospital gift shop (Tier A or B), a grocery/drugstore (only if a chain will take a free trial). Staffed sites first.
- **Terms:** free to the host for 6 months; 20% of net sales to the host from the first sale; no exclusivity; GreetHub removes the unit on 30 days notice; host keeps its own product.
- **Duration:** 6 months, covering at least one gifting peak. Start in a month with a holiday if possible (Valentine's, Mother's Day, graduation).
- **Instrumentation:** per session: path chosen, time to print, abandon step, sale, price, account link rate, reprints, jams. Events only in the allowlist of `docs/data/02-architecture.md`.
- **Success metrics (gate G2):** at least 5 cards a day per site averaged over weeks 5 to 24 and at least 8 in peak weeks; at least 15% of buyers link or create an account; print success first time at least 97% (target for a mature machine is 99%); card-stock complaint rate low; zero uncontrolled-content incidents; hosts willing to continue (at least 2 of 3 say yes to a paid term); model cost per sold card at most $0.35; mean time to repair at most 24 hours.
- **Kill criteria:** under 2 cards a day averaged over weeks 5 to 12 at the target price, or hosts refuse any revenue-share term.

## 6. Sales approach to retailers

1. **Lead with their problem, not our technology:** "Cards are your highest margin impulse item and you have limited shelf space. This adds unlimited designs and no inventory."
2. **Start with independent shops and campus stores** (a single decision maker), with a free pilot and a one-page agreement.
3. **Bring the precedent:** Scribbler stores reported about 3,000 extra cards each in a year [V pgbuzz]. Be clear that the figure belongs to another product.
4. **Show a physical card.** The sale is made on the stock and the fold; carry samples.
5. **Chains and distributors later**, with pilot data. Chains want planograms, service-level agreements, insurance certificates, vendor onboarding and a single supplier invoice, so expect 6 to 12 month cycles [U].
6. **Pitch the account upside to hosts too** (loyalty, "send it later" mail option), but keep the first conversation simple.
7. **Licence conversations** with Fujifilm/Scribbler-class operators in parallel.

## 7. Strategic value that is not in the base case

Kiosk buyers who join GreetHub (saved People, reminders) are cheaper than paid ads (online paid CAC about $70 and LTV about $26, so paid ads do not pay back at the CMO's assumptions, `finance/README.md`). At 150 cards a month per kiosk and a 15% signup rate [U guess], a kiosk adds about 22 accounts a month. If each is worth even a third of the paid CAC avoided, the kiosk looks much better. This is the most valuable thing the pilot can measure; the base financials give it zero credit.

Correction 2026-10-13: avoided CAC is cash only if paid spend is actually cut, and the CFO's recommended launch plan spends $0 to $2k a month. A fairer value is the repeat contribution a kiosk sign-up brings: about 0.7 extra orders x $15.20 = about $11 per account [U], so 22 accounts a month is worth about $230 a month per kiosk. Real, but it does not change the program total.

## 8. Risks specific to the model

Seasonality (peaks in Dec, Feb, May, June); hosts that close the shop (card unreachable); revenue-share dispute; unattended machine downtime hurting the brand; chargebacks on card-present are rarer but exist [U]; insurance (06).

## 9. Scale: what changes at 10 and 100 kiosks (added 2026-10-13, all [U])

- **10 kiosks:** about $1.3k a month of service visits and $2.6k of fixed cost in total. One contractor technician on call, pre-packed refill kits restocked by host staff, and remote stock and jam alerts so visits are planned, not reactive. A monthly host statement (sales, share, refunds) and a payout process (finance ops; 1099s for hosts). Sales tax registration in every kiosk state, plus personal property tax where the unit sits. Per-device spend caps in the cloud ledger (SEC-10), not the per-IP limits the web uses.
- **100 kiosks:** fleet capex of about $0.56M to $0.94M is beyond the company's means; only placement under model B (lease), C (host purchase) or D (operator licence) is fundable. A route-based field-service partner, a spares depot and two approved reader models (the WisePOS E is reported to end in early 2027, 04 section 7). Consumables on an annual supply contract. Host share negotiated per chain, capped at 25% (07 section 8).
- **What to change now:** plan P3 and P4 around models B, C or D, not GreetHub-owned units; treat model A (GreetHub owns, host shares) as pilot-only.
