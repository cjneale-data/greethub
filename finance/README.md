# GreetHub Financial Model

Files: `GreetHub_Financial_Model.xlsx` (original, untouched), `GreetHub_Financial_Model_v2.xlsx` (2026-10-11, kept for comparison) and `GreetHub_Financial_Model_v3.xlsx` (**current**, 2026-10-12). A LibreOffice lock file for the original (dated 2026-10-11 05:08) is still in the folder, so neither earlier file was overwritten. No LibreOffice process was running on 2026-10-12, so the lock is probably stale; the owner can delete it and copy v3 over the original. 36 months from launch month, default Nov 2026. Every output is a live formula. Change a blue cell and everything flows.

Colour code: blue font = input, black = formula, yellow fill = slot for CMO/CTO data. All inputs sit on `Inputs`, with two sanctioned exceptions: the scenario selector (`Scenarios!B3`) and the CTO measured-cost slots on `Model Costs`.

Status labels used in the sheets: SOURCED = from the owner brief, PLAN.md, a vendor price list or a cited benchmark. CMO PLAN = a spend decision, not evidence. The CMO csv is mostly GUESS: only the Google and Meta CPCs are sourced (secondary benchmarks), see `Inputs` column K. ESTIMATE = reasoned from public price lists or the Eye Story build, verify. GUESS = judgement, no data behind it.

## Sheets

| Sheet | What it does |
|---|---|
| Inputs | All assumptions: general, funnel, traffic, budget, repeat/refund/re-roll/payments, SKU table (prices, mix, print and shipping), CMO channel table, seasonality, scenario levers, opex lines, one-time costs. |
| Unit Economics | Per-SKU contribution margin: price + postage, refund allowance, tokens, print, shipping, reprint, Stripe (2.9% + $0.30), disputes. Also the paid-channel block (active CPC, CAC per channel), LTV and paid CAC. |
| Model Costs | Per-render and per-Sonnet-token prices (estimate / CTO measured / active), tokens per call type, calls per SKU, renders per SKU, token cost per SKU, guest preview cost. |
| Opex | Monthly cost of Vercel, Supabase, Resend, domain, Stripe Tax, monitoring, OpenRouter base, design tools, legal/LLC, insurance, support, optional pay; plus one-time launch costs. |
| Forecast | 36 monthly columns plus Year 1-3. Budget -> channel budgets -> paid visits (budget / CPC) + organic + referral -> sign-ups -> creator starts -> orders (new and repeat) -> items by SKU -> revenue -> COGS (incl. guest previews and abandoned drafts) -> marketing -> opex -> net income -> cash. |
| Scenarios | Low / Base / High selector (drives every sheet), active lever values, headline KPIs: break-even months, month 12 and 36 revenue and profit, funding need, blended CAC, LTV, LTV:CAC. |
| Dashboard | KPI block, annual table, contribution margin per SKU, six charts (revenue/profit, cash, orders, visits by source, budget, CM per SKU). |

## v3 update (2026-10-12): what changed

Saved as a new file because of the lock above. Structure and every v2 row are unchanged; three blocks were added. Recalculated in LibreOffice 26.8 headless: 8,811 formula cells, 0 error values.

| Change | Where | Why |
|---|---|---|
| CMO csv re-imported (Google CPC $1.60 to $4.14; budgets Google $800, TikTok $300, creators $1,400, SEO $1,200; total still $6.5k) | `Inputs` B57:H62, evidence in K57:K62 | CMO re-based Google CPC (market/02). Most of the csv is guessed; the label now says so. |
| Creators modelled as fixed plus per-order | `Inputs` B291:B293, `Forecast` rows 87-88 (and row 74 = budget + row 88), `Unit Economics` rows 31-34 | The $1,400 creator line stays as gifts and fees (fixed). New: 10% off plus 10% commission on the discounted merchandise subtotal of attributed new-customer orders = $4.91 per creator order. Creator contribution on a first order falls from $15.20 to $10.29; all-in creator CAC is about $99. |
| Re-roll input now reaches the measured token cost | `Model Costs` J35:J39, `Inputs` B294 | The CTO totals had 20% re-rolls baked in, so `Inputs` B34/B35 did nothing at 2K. Column J now adds (re-roll - 20%) x (renders - 1) x (render + QA). Re-roll labelled GUESS (n=10), range 20-50%. |

### Readout (Base, Market-adjusted off, core only)

- Break-even: none within 36 months. Month-36 cash -$267k (v2 -$270k). Peak funding need $297k with $30k opening cash. The CMO mix shift (less Google, more SEO) lowers paid CAC from $76 to $70 even at $4.14 Google CPC; creator discount and commission cost about $1k a year.
- Contribution per item (unchanged): digital card $3.19, mailed card $4.45, digital book $17.18, 24pp book $21.42, 32pp book $27.84; per order $15.20; LTV $26. Paid CAC $70 is 2.7x LTV, so each paid customer loses about $44.
- Re-roll 50% instead of 20%: -$2.7k of cash over 36 months (token cost is about 6% of a book's variable cost). Not a driver.
- Full book rendered before every abandoned purchase (today's build, no pay-before-render): -$9.5k over 36 months at modelled volumes. The real exposure is abuse (no per-account cap on unpaid books), which the model does not include.

| Scenario (36 months) | Break-even month | Month-36 cash | Peak funding |
|---|---:|---:|---:|
| Base, $6.5k/mo paid | none | -$267k | $297k |
| $2k/mo paid | none (first profitable month 26) | -$148k | $178k |
| $0 paid | 24 | -$95k | $134k |
| Engineering 25% cash (agents build most of it) | none | -$187k | $217k |
| Books +$5 ($44 / $54 + $5.99 postage) | none | -$248k | $278k |
| Mailed card $8.99 postage included | none | -$274k | $304k |
| Mailed card $7.99, free postage | none | -$278k | $308k |
| Digital book $9.99 | none | -$276k | $306k |
| Market-adjusted switch on | none | -$276k | $306k |
| Recommended prices (books +$5, card $8.99 incl. postage, digital book $9.99) + $0 paid + engineering 25% cash | 24 | -$13k | $54k |
| Same with $2k/mo paid | none | -$65k | $95k |
| Paid conversion x2 (Base otherwise) | 25 | -$133k | $182k |
| Low / High | none / 18 | -$359k / -$60k | $389k / $159k |

Digital-book and card price cuts assume no extra volume; the model has no price elasticity, so they show only the margin loss.

### Scale (indicative; the model is linear in demand and has no price elasticity)

- 10x paid spend ($65k/mo) with CPC 1.45x: month-36 cash -$1.6M. 100x with CPC 2x: -$14.5M. Paid acquisition loses more the more you buy, because CAC > LTV at every scale.
- 10x organic demand with $0 paid: break-even month 6, month-36 cash +$327k (+$388k with a 15% print discount). Fixed costs are small; the business scales only if demand is organic, referral or repeat.
- Print and shipping are about 80% of a printed book's variable cost; tokens about 6%. Volume print pricing and a second printer move margin; cheaper models barely do.

## v2 update (2026-10-11): what changed

v2 adds the owner's two program areas (AI-assistant channel, kiosks), the cost items found since the model was built, and a four-scenario comparison. The core model keeps its structure and row positions. Every number is still a formula off the `Inputs` sheet; blue = input, black = formula, green = link to another sheet. The scenario selector, the switches on `Scenarios` (B42:B47) and the CTO slots on `Model Costs` are the only inputs outside `Inputs`.

| New or changed | What it does |
|---|---|
| `Inputs` sections 12-17 | 12 market-adjusted overrides; 13 added opex lines; 14 added one-time costs; 15 engineering rate, core backlog, agent phases, kiosk phases; 16 kiosk operations and fleet plan; 17 agent channel. Case inputs have Low / Base / High columns and an "Active" column (H) that follows the selector. |
| `Scenarios` B42:B47 | Switches: Include Kiosk, Include Agent Channel, Market-adjusted, Include v2 cost lines, Include core launch engineering, Count agent CAC avoided. Rows 51-56 show program-inclusive KPIs for the chosen switches. |
| `R&D` | 36-month engineering cost: (a) core launch engineering from the SEC, data and CX backlogs plus a CTO placeholder, (b) agent phases P0-P4 with gates, (c) kiosk phases P0-P4 with gates G0-G3 and low / base / high. |
| `Kiosk` | Fleet by month from the gate switches and fleet plan, capex at the 10- and 100-unit price breaks, consumables, host share, payment fees, service visits, model cost read live from `Model Costs`, depreciation, contribution, net income, cash, payback and break-even cards per day. |
| `Agent Channel` | Users, active agents, cards, mailed-card margin, incremental revenue and contribution, policy-risk haircut, CAC avoided (memo), recurring costs, R&D, cash. |
| `Compare` | Monthly net income and cumulative cash for core only, core + agent, core + kiosk, everything, and the selected switches, plus the headline metrics. |
| `Opex` rows 23+ | 16 added cost lines and the one-time block. `Forecast` rows 75-76 now include them and core launch engineering (labels updated; all row numbers unchanged). |
| `Unit Economics` B5:C9, C17 | Now read the market-adjusted override when `Scenarios!B44` = 1; unchanged otherwise. |
| `Dashboard` | Core KPIs unchanged. Rows 52-60: four scenarios side by side (cumulative cash at month 12/24/36, peak funding need, break-even month, total R&D, cumulative net income) and a cumulative-cash chart. |

How the four scenarios work: `Compare` always computes all four from the gross Kiosk and Agent streams, so the Dashboard table does not depend on the include switches. The switches only decide what the "Selected" column and `Scenarios` rows 51-56 show. The Low / Base / High selector and the Market-adjusted switch apply to every column. Break-even is the existing rule (trailing-3-month net income stays at or above zero from that month on), applied to net income (kiosk net income is after depreciation and R&D, not capex). Peak funding need is opening cash minus the lowest cumulative cash.

### New assumptions and their evidence quality

| Area | Assumption | Evidence |
|---|---|---|
| Core launch engineering | 148.8 person-days (SEC must 39.5 + SEC after-launch 14.5 + data 54 + CX 30.8 + CTO 10) x 1.2 overhead x $600 = $107,100 | Ticket counts are read from the backlogs. SEC day sizes are sourced (security/costs.md). CX sizes are midpoints of the CX scale. Data days are the data doc's own midpoint. The $600 rate, the 20% overhead and the 10 CTO days are guesses (the CTO days are a placeholder; no CTO backlog with sizes exists). 100% cash share is a conservative stance: if agents build it, cash cost is lower but unmeasured. |
| Agent channel R&D | 129.5 days x $600 = $77,700 + $6,000 attorney, phases P0-P4, timing M1-M14 | Days: ESTIMATE (integrations/08). Rate and phase timing: guess. |
| Agent adoption | 150 paying users in year 1 (40 / 600), 5 cards a user a year, 60% retention, 60% incremental, $3.30 margin per mailed card, go-live month 8 | All GUESS (integrations/08 says no data exists). Margin is an ESTIMATE; the sheet adjusts it if card prices change. |
| Agent risk and CAC | 25% policy-risk probability x 100% loss = 25% haircut; CAC avoided counted at 50% and off by default | Haircut: guess. CAC link is the model's blended CAC. |
| Agent recurring cost | $300 a month (range $120-650) | ESTIMATE/GUESS (integrations/08). |
| Kiosk R&D | $561k / $1,101k / $2,248k (ties to kiosk/08 to the dollar) | UNVERIFIED estimates; person-days, rates, non-labor and contingency from the kiosk CSV. |
| Kiosk hardware | Tier B $11,970 per unit to 50 units live, then $7,528; 1.45x / 0.72x multiplier in Low / High | BOM: ESTIMATE. The multiplier is derived from the kiosk doc's 10-unit range; the kiosk doc did not apply it to fleet cash, so Low and High differ from its cumulative cash. |
| Kiosk revenue | $6.99 a card, 5 cards a kiosk a day (2 / 10), 25% host share, $262 a month fixed per kiosk, fleet 3 units from M13 and 100 by M36 | All GUESS (kiosk/08 labels every revenue assumption U). Model cost per card is live from `Model Costs` (measured $0.2479 per printed card) plus intake. |
| Gates | Kiosk G0-G3 and agent gates all default to 1 (passed) | Decision switches, not forecasts. Set kiosk G0 = 0 to see "P0 only" at $35k base. |
| Added opex | 16 monthly lines, about $27k over 36 months | Mixed: Turnstile (free tier, sourced, limits unverified), data/BI (ESTIMATE), support stages 1-2 are $0 incremental because the $25 Support line covers them (cx/02), insurance top-up (ESTIMATE, quote needed), accountant, bot-protection reserve, alerting, chat tool and trademark monitoring (GUESSED). |
| Added one-time | $14.5k: attorney top-up $8,000, trademark $1,500, DMCA agent $6, accessibility audit $2,000, pen test $3,000 | Attorney and trademark ranges are ESTIMATES from legal/00 and 04; pen test and accessibility are guesses; DMCA fee sourced. |
| Market-adjusted | Google CPC $4.14 (range $2.50-5.50); printed card $8.99 with free postage; digital book $14.99; 24pp book $44.99 and 32pp $54.99 all-in | SOURCED benchmarks from market/02 (secondary vendor blogs for CPC; competitor pages for prices). Applied as overrides, not forecasts. |

### Readout, in plain language (Base case, Market-adjusted off)

The online business loses money at the CMO's $6.5k a month budget, and it loses more now that the missing costs are in: cumulative cash at month 36 is about -$270k (was -$122k). Of that $148k change, $107k is engineering to finish the launch app, $27k is recurring tools and services, and $14.5k is one-time legal and testing. It does not break even inside 36 months. It reaches sustained break-even only with no paid marketing (month 24) or in the High scenario (month 19). The "month 7 with no paid spend" finding further down was before these costs.

| 36 months, Base | Core only | Core + agent | Core + kiosk | Everything |
|---|---:|---:|---:|---:|
| Cumulative cash, month 12 | -$168k | -$244k | -$531k | -$606k |
| Month 24 | -$227k | -$315k | -$1,177k | -$1,264k |
| Month 36 | -$270k | -$360k | -$2,028k | -$2,118k |
| Peak funding need (opening cash $30k) | $300k | $390k | $2,058k | $2,148k |
| Break-even month | none | none | none | none |
| Total R&D spend | $107k | $191k | $1,208k | $1,292k |

With Market-adjusted on, cash at month 36 is -$287k, -$378k, -$2,044k and -$2,135k; peak funding need $317k / $408k / $2,074k / $2,165k. The market prices cost more than they gain: the cheaper card and digital book lower revenue and the higher Google CPC lifts paid CAC from about $76 to about $87.

The agent channel costs about $84k to build and earns almost nothing directly: about $3k of risk-adjusted contribution in 36 months against $9k of running costs. It needs about 56,000 approved cards to repay the R&D at the modelled margin. Only the CAC-avoided argument can justify it, and that is avoided spend, not cash, so it is off by default. P0 and P1 ($34.5k plus attorney) is the price of learning whether anyone connects an assistant.

The kiosk program adds a $1.1M R&D bill and $0.94M of hardware. By month 36 the fleet earns about $41k a month of operating contribution, but cumulative cash is -$1.76M and still falling. A kiosk earns back its hardware in about 29 months at 5 cards a day, and needs 2.0 cards a day to cover cash costs and 4.4 to cover depreciation. Everything beyond P0 is gated; the model assumes every gate passes. P0 alone is about $35k.

What moves the answer most: the marketing budget and paid CAC (budget $0 / $2k / $6.5k gives month-36 cash of -$95k / -$149k / -$270k for core only), book share and price, the engineering cash share and rate, and for the kiosk the cards a day, the host share and the number of units.

What is not yet evidence: every kiosk and agent volume, the engineering days beyond the ticket counts, platform-policy risk, and most added tool prices. Re-measure after P1 (agent) and P2 (kiosk) and replace the guesses.

Not modelled in v2: income tax, working-capital timing, kiosk host fees as a flat fee, account sign-ups from kiosks (an online CAC benefit), the data backlog's after-launch tickets (DATA-101 onward), and any capitalisation of R&D (the accountant's call).

## Wiring in CTO and CMO data

- **CTO**: `finance/measured_costs.json` is pasted into the yellow cells on `Model Costs`: render prices (1K $0.041, 2K $0.0609, 4K $0.1233), QA $0.0025, per-unit text costs, total per SKU with 20% re-rolls (card $0.2479, 24pp book $1.2641, 32pp book $1.6357) and guest preview ($0.0689). A blank yellow cell falls back to the estimate. The 5.5% OpenRouter fee and scenario multiplier are added on top. Status labels on the sheet: MEASURED (per-call prices), EXTRAPOLATED (all per-product totals; no full 24/32-page run exists, the longest real run was 4 art pages at $0.469) and ESTIMATE (intake chat, guest intake, which the CTO has not built). The CTO totals exclude intake chat, so the computed column on the sheet runs about $0.07-0.13 higher per SKU; re-measure once Greet Guide exists.
- **Image size**: `Model Costs!B5` selects 2K (default) or 4K. 2K is about 280 DPI at card size and 234 DPI at book size, under the usual 300 DPI print norm. The CTO judges 4K (2x cost) not worth it; I have not verified that against Lulu's file validator, so order a physical proof before locking it in. At 4K the contribution per order falls from $15.20 to $14.25 and the 24pp book token cost rises from $1.26 to about $2.44 (CTO's own 4K figure: $2.31, excluding intake).
- **CMO**: `docs/cmo/channel-assumptions.csv` (2026-10-12 version, Google CPC $4.14) is loaded into `Inputs` section 7 B57:H62, with its `evidence` column in K57:K62. To update, paste a new csv over those rows in the same channel order. Budget share is calculated from `monthly_budget_base_usd`. Low scenario uses `cpc_high`, High uses `cpc_low`. Month-1 budget is the sum of channel budgets ($6.5k/mo = $19.5k per 90 days).

## Launch prices (inputs) and reasoning

| SKU | Price | Postage | Print + ship (est.) | Why |
|---|---|---|---|---|
| Card digital | $3.99 | none | none | Impulse buy, upsell to print |
| Card printed 5x7 | $7.99 | $2.99 | $3.25 + $1.60 | Premium cards sell $5-8; postage covers about 2x real shipping |
| Book digital | $19.99 | none | none | Anchors printed price at about half |
| Book 24pp hardcover | $39 | $5.99 | $12.50 + $5.50 | Personalised hardcovers sell about $35-45 |
| Book 32pp hardcover | $49 | $5.99 | $14.50 + $6.00 | +$10 for +8 pages keeps margin % |

Printer costs are estimates: verify against live Lulu (8.5x8.5 casewrap hardcover, 24/32pp) and Prodigi/Gelato (5x7 folded card) price calculators, US delivery, before locking prices into Stripe.

## Sensible ranges and provenance

Ranges are printed beside each input on `Inputs` (column E). Summary of what is sourced versus guessed:

- **Sourced**: Stripe 2.9% + $0.30; launch month (CMO); Google CPC $4.14 and Meta CPC $0.85 (secondary benchmarks via market/02); per-call image, QA and text costs (CTO ledger, `measured_costs.json`; Eye Story ~$0.11 per 4K-class render was the earlier estimate); Sonnet token prices (list price, verify).
- **Estimates to verify**: all print and shipping costs; OpenRouter 5.5% fee; vendor plan prices (Vercel, Supabase, Resend, Sentry, Stripe Tax 0.5%); intake-chat tokens; full-book totals (extrapolated); re-roll rate (moved to guesses below).
- **Pure guesses**: re-roll rate (20% base, test 50%: 10 first-attempt renders, 5 passed, 95% CI 24-76%); every channel CTR and conversion rate and the Pinterest, TikTok, creator and SEO CPCs (CMO csv `evidence` column); channel budgets are a CMO spend decision; creator 10% discount and 10% commission (Social proposal); organic traffic and growth, referral visits, guest-try rate, sign-up/start/purchase rates for organic, product mix, repeat rate, refund/reprint rate, seasonality indices, insurance/legal/support costs, one-time costs, opening cash, scenario multipliers.
- Not modelled: income tax, sales tax (pass-through), working-capital timing of payouts, founder pay (an input, default $0).

## Verification

- v2 (2026-10-11): recalculated headless with LibreOffice, which is present at `C:\Program Files\LibreOffice` (the original-build note below said it was not available). 8,730 formula cells, 0 error values (#REF!, #DIV/0!, #NAME?, #VALUE!). With `Scenarios!B45` and `B46` set to 0 the core reproduces the original month-36 cash of -$121,674. Tests run: include switches (the Selected column moves to Everything), marketing budget ($0, $2k, CMO plan), Low / Base / High, Market-adjusted on and off; all moved the outputs as expected. The Kiosk sheet reproduces the kiosk doc's base totals (R&D $1,101,175, fleet capex $939k, month-36 cumulative cash -$1.757M). v2 carries cached values from the recalculation.
- Original build:

- LibreOffice was not available on this machine, so recalculation used the Python `formulas` engine on the saved file: 4,732 cells evaluated, 0 error values (#REF!, #DIV/0!, #NAME!, #VALUE!). The file carries no cached values, so open it in Excel (it recalculates on load) before reading it in a previewer.
- Budget test (Base, month-1 budget -> Year 1 orders / Year 1 net income): $0 -> 543 / -$5.1k; $2k -> 959 / -$24.9k; $6.5k (CMO plan) -> 1,895 / -$69.7k. Budget moves visits and orders as designed; at CMO CACs it lowers profit. (Re-run after pasting the measured CTO costs.)
- Scenario snapshot (CMO budget, 36 months): Low: no break-even, cash -$210k. Base: no break-even, cash -$122k, month-12 profit -$4.7k. High: sustained break-even month 14, cash +$81k.

## Findings the owner should see

- Paid CAC at the CMO's base assumptions is about $76. Blended contribution per order is about $15.20 (was $14.70 on my token estimates; measured costs added $0.50, +3%) and LTV about $26, so paid ads do not pay back. Cards earn $2.9-4.1 each; hardcover books $21-27.
- With no paid spend the model breaks even (sustained) in month 7; with $2k/month, month 31; with the CMO's $6.5k/month it does not within 36 months.
- Levers that matter most: paid CAC (CPC and conversion), book share of the mix and book price, repeat rate, print and shipping cost, and the marketing budget itself.
