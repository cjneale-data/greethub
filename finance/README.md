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

- **CTO**: `finance/measured_costs.json` is pasted into the yellow cells on `Model Costs`: render prices (1K $0.041, 2K $0.0609, 4K $0.1233), QA $0.0025, per-unit text costs, total per SKU with 20% re-rolls (card $0.2479, 24pp book $1.2641, 32pp book $1.6357) and guest preview ($0.0689). A blank yellow cell falls back to the estimate. The 5.5% OpenRouter fee and scenario multiplier are added on top. Status labels on the sheet: MEASURED (per-call prices), EXTRAPOLATED (all per-product totals; no full 24/32-page run exists, the longest real run was 4 art pages at $0.469) and ESTIMATE (intake chat, guest intake, which the CTO has not built). The CTO totals exclude intake chat, so the computed column on the sheet runs about $0.07-0.13 higher per SKU; re-measure once Greet Guide exists.
- **Image size**: `Model Costs!B5` selects 2K (default) or 4K. 2K is about 280 DPI at card size and 234 DPI at book size, under the usual 300 DPI print norm. The CTO judges 4K (2x cost) not worth it; I have not verified that against Lulu's file validator, so order a physical proof before locking it in. At 4K the contribution per order falls from $15.20 to $14.25 and the 24pp book token cost rises from $1.26 to about $2.44 (CTO's own 4K figure: $2.31, excluding intake).
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

- **Sourced**: Stripe 2.9% + $0.30; launch month and 90-day budget (CMO); channel budgets/CPC/CTR/conversion (CMO csv, but the CMO labels every value a guess); per-call image, QA and text costs (CTO ledger, `measured_costs.json`; Eye Story ~$0.11 per 4K-class render was the earlier estimate); Sonnet token prices (list price, verify).
- **Estimates to verify**: all print and shipping costs; OpenRouter 5.5% fee; vendor plan prices (Vercel, Supabase, Resend, Sentry, Stripe Tax 0.5%); intake-chat tokens; full-book totals (extrapolated); re-roll rate (CTO planning figure 20%, small sample).
- **Pure guesses**: organic traffic and growth, referral visits, guest-try rate, sign-up/start/purchase rates for organic, product mix, repeat rate, refund/reprint rate, seasonality indices, insurance/legal/support costs, one-time costs, opening cash, scenario multipliers.
- Not modelled: income tax, sales tax (pass-through), working-capital timing of payouts, founder pay (an input, default $0).

## Verification

- LibreOffice was not available on this machine, so recalculation used the Python `formulas` engine on the saved file: 4,732 cells evaluated, 0 error values (#REF!, #DIV/0!, #NAME!, #VALUE!). The file carries no cached values, so open it in Excel (it recalculates on load) before reading it in a previewer.
- Budget test (Base, month-1 budget -> Year 1 orders / Year 1 net income): $0 -> 543 / -$5.1k; $2k -> 959 / -$24.9k; $6.5k (CMO plan) -> 1,895 / -$69.7k. Budget moves visits and orders as designed; at CMO CACs it lowers profit. (Re-run after pasting the measured CTO costs.)
- Scenario snapshot (CMO budget, 36 months): Low: no break-even, cash -$210k. Base: no break-even, cash -$122k, month-12 profit -$4.7k. High: sustained break-even month 14, cash +$81k.

## Findings the owner should see

- Paid CAC at the CMO's base assumptions is about $76. Blended contribution per order is about $15.20 (was $14.70 on my token estimates; measured costs added $0.50, +3%) and LTV about $26, so paid ads do not pay back. Cards earn $2.9-4.1 each; hardcover books $21-27.
- With no paid spend the model breaks even (sustained) in month 7; with $2k/month, month 31; with the CMO's $6.5k/month it does not within 36 months.
- Levers that matter most: paid CAC (CPC and conversion), book share of the mix and book price, repeat rate, print and shipping cost, and the marketing budget itself.
