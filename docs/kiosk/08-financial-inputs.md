# 08. Financial inputs for the CFO

Machine-readable twin: `docs/kiosk/financial-inputs.csv` (long format, about 286 rows, columns `section,item,detail,low,base,high,unit,confidence,note`). Confidence tags: **S** = sourced (measured or seen on a page), **U** = unverified estimate or labelled guess. Every revenue assumption is a guess. Proposed workbook treatment: a new `Kiosk` sheet driven off these inputs with its own scenario selector, kept out of the online forecast until the owner decides at the P0 gate. Kiosk cash goes below the online forecast lines; fleet hardware is capex; R&D is expense (or capitalized software, accountant's call).

How the numbers tie: the CSV is produced by one script, so phase totals, the 36-month profile and the unit economics reconcile (R&D sum of months equals phase totals in all three cases).

## 1. R&D by phase (USD)

| Phase | Months | Start | Low | Base | High | Timing within phase |
|---|---:|---|---:|---:|---:|---|
| P0 Concept validation | 3 | M1 | 20,097 | 34,615 | 65,760 | even; test hardware in month 2 |
| Gate G0 | 1 | M4 | 0 | 0 | 0 | |
| P1 Pilot prototype | 5 | M5 | 138,420 | 270,360 | 537,750 | even; prototypes month 2; pre-compliance and tooling in last 2 months |
| Gate G1 | 1 | M10 | 0 | 0 | 0 | |
| P2 Field pilot | 6 | M11 | 92,178 | 173,400 | 348,500 | even; pilot units month 2; field evaluation last 2 months |
| Gate G2 | 1 | M17 | 0 | 0 | 0 | |
| P3 Productized small batch | 6 | M18 | 186,300 | 367,200 | 767,000 | even; certification and tooling last 2 months |
| Gate G3 | 1 | M24 | 0 | 0 | 0 | |
| P4 Scale (sustaining) | 12 | M25 | 124,430 | 255,600 | 528,750 | even; tooling in M35 and M36 |
| **Total** | 36 | | **561,425** | **1,101,175** | **2,247,760** | |

Monthly timing (low, base, high, and fleet columns): `monthly_rd_cash` rows in the CSV and the table in 07 section 5. Each phase row has labor, non-labor lines and contingency rows (`rd_phase_labor`, `rd_phase_nonlabor`, `rd_phase_contingency`, `rd_phase_total`).

Person-days (base): P0 26, P1 187, P2 77 + 36 field, P3 200, P4 160 = 650 + 36 field. Rate assumptions: $850 / $1,000 / $1,200 per day, field $450 / $600 / $750, scope multipliers 0.7 / 1.0 / 1.5 (all U).

## 2. Per-unit BOM (USD, incl 5% spares; columns are quantity tiers, not scenarios, in the `bom_total` rows)

| Tier | 1 unit | 10 units | 100 units | 10 units low | 10 units high |
|---|---:|---:|---:|---:|---:|
| A tabletop | 3,453 | 2,703 | 2,179 | 1,946 | 3,919 |
| B freestanding | 21,189 | 11,970 | 7,528 | 8,618 | 17,357 |
| C countertop assisted | 5,848 | 4,557 | 3,549 | 3,281 | 6,608 |

Line items in the CSV (`bom_line`). Depreciation base: Tier B at 10-unit cost over 36 months.

## 3. Per-card consumables (USD)

| Tier | Low | Base | High |
|---|---:|---:|---:|
| A | 0.41 | 0.55 | 0.76 |
| B | 0.23 | 0.40 | 0.64 |
| C | 0.27 | 0.48 | 0.73 |

## 4. Model cost per card (USD, from `finance/measured_costs.json` plus 5.5% OpenRouter fee and intake)

| | Low | Base | High |
|---|---:|---:|---:|
| Quick pick session | 0.01 | 0.02 | 0.03 |
| Make it yours session | 0.10 | 0.14 | 0.20 |
| Totally custom session | 0.28 | 0.36 | 0.50 |
| Blended per card sold, incl abandoned sessions | 0.08 | 0.20 | 0.55 |

Mix 50 / 35 / 15; abandoned sessions at 0.8 of a sold session (U). Online comparison: card front plus inside with re-rolls $0.2479 before fee (S).

## 5. Operating costs per kiosk per month (Tier B, USD, all U)

| Item | Low (good) | Base | High (bad) |
|---|---:|---:|---:|
| Connectivity (LTE) | 0 | 25 | 40 |
| Device management and monitoring | 8 | 12 | 20 |
| Insurance allocation | 20 | 40 | 70 |
| Service visits (1.3 a month at about $100) | 60 | 128 | 240 |
| Parts and repairs | 25 | 47 | 90 |
| Software hosting allocation | 5 | 10 | 20 |
| **Total** | **118** | **262** | **480** |

Note the order: in this table the left column is the favorable one, to match the CSV's `opex_kiosk_month_tierB` rows (low value, base, high value). In the unit-economics rows, "low" means the bad case.

## 6. Revenue assumptions (all labelled guesses)

| Assumption | Low (bad) | Base | High (good) | Basis |
|---|---:|---:|---:|---|
| Price per card incl envelope (ex tax) | 5.99 | 6.99 | 7.99 | Online printed card is $7.99 + $2.99 postage |
| Cards per kiosk per day (mature) | 2 | 5 | 10 | Scribbler about 8 a day per store (S) |
| Host revenue share | 35% | 25% | 15% | No source gave terms |
| Payment fee | 2.9% + $0.30 | 2.7% + $0.05 | 2.7% + $0.05 | TechRadar, undated (S) |
| First 4 months of pilot sales | 60% of mature | | | ramp |
| Account signup rate of buyers | 5% | 15% | 30% | Not in base revenue |
| Hardware life (depreciation) | 24 months | 36 | 48 | |

## 7. Unit economics outputs (Tier B)

| | Low (bad) | Base | High (good) |
|---|---:|---:|---:|
| Contribution per card | 2.23 | 4.40 | 6.22 |
| Operating cash per kiosk per month | -345 | 407 | 1,772 |
| Net after depreciation per kiosk per month | -1,068 | 75 | 1,592 |
| Break-even cards per day, cash | 7.1 | 2.0 | 0.6 |
| Break-even cards per day, after depreciation | 17.8 | 4.4 | 1.6 |

## 8. Fleet plan (base) and cumulative cash

Units live: 3 from M13 (pilot, carried in P2 R&D), 13 at M24 (10-unit batch capex), 19 at M26, 25 at M27, 50 at M30, 75 at M33, 100 at M36. Fleet capex M24 to M36: $939k (first 50 units at the 10-unit cost, the rest at the 100-unit cost). CSV rows `fleet_low`, `fleet_base`, `fleet_high` give monthly cards, revenue, variable cost, fixed cost and operating contribution; capex is in the note field.

Cumulative cash at M36 with base R&D: -$2.28M (bad revenue), -$1.76M (base), -$0.80M (good), with troughs at -$2.28M, -$1.76M and -$1.11M (`cum_cash_36m_baseRD`). Matched cases (low R&D with bad revenue, base with base, high R&D with good revenue): -$1.74M, -$1.76M, -$1.95M.

## 9. Suggested use in the CFO model

**2026-10-13 change in workbook v3 (kiosk lead):** `Inputs` F183 (G0) = 0, so the default "Core + Kiosk" view is P0 only ($34.6k base; base-case peak funding need $297k core, $332k with P0). Phase start months moved 6 months later (D182:D186 = 7, 11, 17, 24, 31), pilot sales start 19 (B223), scale-out 30 (B224), fleet plan B226:B261 shifted 6 rows. The `Kiosk` row 47 payback flag now requires cumulative cash to have gone negative first (it read "month 1" once spending starts later). With all gates set to 1 the shifted program shows R&D $973k, capex $563k, 50 units and kiosk cash -$1.45M at M36: truncated at the horizon, not cheaper. Recalculated in LibreOffice: 8,811 formulas, 0 errors; core-only results unchanged.

1. Add the kiosk as a separate cost center with off-by-default toggle.
2. Use the base R&D profile for the funding need if the owner approves P0 only: P0 costs $35k base, the rest conditional on gates; model "P0 only" as a standard line in the online forecast's one-time costs.
3. Do not add kiosk revenue to the online forecast until P2 data replaces the guesses.
4. Track the account-signup upside separately: it affects online CAC, not kiosk P&L.
