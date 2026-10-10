# GreetHub Financial Model

File: `GreetHub_Financial_Model.xlsx` (36 months from launch month, default Nov 2026). Every output is a live formula. Change a blue cell and everything flows.

Colour code: blue font = input, black = formula, yellow fill = slot for CMO/CTO data. All inputs sit on `Inputs`, with two sanctioned exceptions: the scenario selector (`Scenarios!B3`) and the CTO measured-cost slots on `Model Costs`.

Status labels used in the sheets: SOURCED = from the owner brief, PLAN.md or the CMO csv. ESTIMATE = reasoned from public price lists or the Eye Story build, verify. GUESS = judgement, no data behind it.

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

## Wiring in CTO and CMO data

- **CTO**: paste values from `finance/measured_costs.json` into the yellow cells on `Model Costs` (per-render price, token prices, measured total per SKU, measured guest preview cost). A blank yellow cell falls back to the estimate. Measured totals should be OpenRouter-billed cost; the 5.5% credit fee and the scenario multiplier are added on top.
- **CMO**: `docs/cmo/channel-assumptions.csv` is already loaded into `Inputs` section 7 (same columns). Paste a new csv over those rows. Budget share is calculated from `monthly_budget_base_usd`. Low scenario uses `cpc_high`, High uses `cpc_low`. Month-1 budget is the sum of channel budgets ($6.5k/mo = $19.5k per 90 days).

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

- **Sourced**: Stripe 2.9% + $0.30; launch month and 90-day budget (CMO); channel budgets/CPC/CTR/conversion (CMO csv, but the CMO labels every value a guess); render cost ~$0.11 and ~$3.50 per ~30 renders (Eye Story build); Sonnet token prices (list price, verify).
- **Estimates to verify**: all print and shipping costs; OpenRouter 5.5% fee; vendor plan prices (Vercel, Supabase, Resend, Sentry, Stripe Tax 0.5%); tokens per Sonnet call; renders per SKU; re-roll rates.
- **Pure guesses**: organic traffic and growth, referral visits, guest-try rate, sign-up/start/purchase rates for organic, product mix, repeat rate, refund/reprint rate, seasonality indices, insurance/legal/support costs, one-time costs, opening cash, scenario multipliers.
- Not modelled: income tax, sales tax (pass-through), working-capital timing of payouts, founder pay (an input, default $0).

## Verification

- LibreOffice was not available on this machine, so recalculation used the Python `formulas` engine on the saved file: 4,732 cells evaluated, 0 error values (#REF!, #DIV/0!, #NAME!, #VALUE!). The file carries no cached values, so open it in Excel (it recalculates on load) before reading it in a previewer.
- Budget test (Base, month-1 budget -> Year 1 orders / Year 1 net income): $0 -> 543 / -$5.5k; $2k -> 959 / -$25.8k; $6.5k (CMO plan) -> 1,895 / -$71.3k; $13k -> 3,247 / -$137.1k. Budget moves visits and orders as designed; at CMO CACs it lowers profit.
- Scenario snapshot (CMO budget, 36 months): Low: no break-even, cash -$214k. Base: no break-even, cash -$129k. High: sustained break-even month 18, cash +$68k.

## Findings the owner should see

- Paid CAC at the CMO's base assumptions is about $76. Blended contribution per order is about $14.70 and LTV about $25, so paid ads do not pay back. Cards earn $2.9-4.1 each; hardcover books $21-27.
- With no paid spend the model breaks even (sustained) in month 7; with $2k/month, month 36; with the CMO's $6.5k/month it does not within 36 months.
- Levers that matter most: paid CAC (CPC and conversion), book share of the mix and book price, repeat rate, print and shipping cost, and the marketing budget itself.
