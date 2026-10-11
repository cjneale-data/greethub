# 08. Financial inputs for the CFO

Everything here is an assumption unless tagged SOURCED. Labels follow finance/README.md: SOURCED (read from a repo doc or a verified page), ESTIMATE (reasoned, verify), GUESS (no data behind it). I did not change the workbook (outside my write scope). Arithmetic is shown so the CFO can check it.

## 1. R&D cost (one-time)

Blended rate: **$600 per person-day** (GUESS; range $500 to $900). Effort from 07-backlog.md (ESTIMATE; includes build, tests, review; excludes owner and attorney time unless stated).

| Phase | Person-days | At $600 | Range ($500 to $900) |
|---|---|---|---|
| P0 new agent work (AGT-001 to 007) | 20 | $12,000 | $10,000 to $18,000 |
| P1 read and draft (AGT-010 to 019) | 37.5 | $22,500 | $18,750 to $33,750 |
| P2 approve and pay (AGT-020 to 027) | 29 | $17,400 | $14,500 to $26,100 |
| P3 rules, keys, autonomy (AGT-030 to 034) | 19 | $11,400 | $9,500 to $17,100 |
| P4 distribution (AGT-040 to 045) | 24 | $14,400 | $12,000 to $21,600 |
| **Total new work** | **129.5** | **$77,700** | **$64,750 to $116,550** |
| Optional prepaid wallet (AGT-035) | 8 | $4,800 | $4,000 to $7,200 |
| Security prerequisites already in docs/security/06-backlog.md (Groups A to C) | 37 | $22,200 | $18,500 to $33,300 |

Notes:
- The security prerequisites are not incremental to this feature: they are needed to launch at all. The CFO should confirm they are already in the one-time costs; this file does not add them again.
- If gh- agents build most of this, the cash cost is model tokens plus owner review time, not salary. I have no measurement for that, so the dollar-equivalent above is the conservative planning number (GUESS).
- Cost to learn whether anyone wants it: P0 + P1 = 57.5 days = $34,500 at $600 (range $28,750 to $51,750), plus the security prerequisites. P2 onward is gated on usage (06).
- Attorney (agent addenda, card-on-file and recurring authorization, platform agreements, children's likeness): $3,000 to $9,000 (ESTIMATE, no quote), on top of the legal budget in docs/legal/00-summary.md (about $7,000 to $27,000).
- Owner time: platform verification (OpenAI business verification, paid Claude plan to submit [V]), partner calls: not priced.

## 2. Recurring costs

| Line | Monthly | Basis |
|---|---|---|
| MCP/API compute on Vercel (extra over web) | $0 to $20 | GUESS; Fluid compute bills for active use [V Vercel docs] |
| Supabase: OAuth users count toward MAU with no separate charge [V]; audit/idempotency rows | $0 to $10 | ESTIMATE |
| Sandbox deployment and second Supabase project | $0 to $45 | GUESS (free tiers to a Pro-size project and a Vercel project) |
| Email and push for approval requests (Resend; web push free) | $0 to $10 | ESTIMATE |
| A paid Claude plan to hold the directory submission, if not already owned | $20 to $100 | GUESS (plan price not verified) |
| Monitoring and alert additions | $0 to $15 | GUESS |
| Annual policy and platform-terms review by attorney, spread monthly | $100 to $250 | GUESS ($1,200 to $3,000 a year) |
| Support time for assistant issues | $0 to $200 | GUESS; add to `Opex` support line |
| **Fixed recurring total** | **about $120 to $650 per month** | sum of ranges above, rounded |

Variable and exposure:
- **Model cost per draft** (SOURCED from docs/security/03 section 1 / finance/measured_costs.json, which the security doc cites): card front + inside at 2K $0.2225 base, $0.2479 with rerolls; guest-style 1K front $0.0689 (estimate, not run end to end). Agent adds IP-screen about $0.02 and a message-compose call $0.0054 (ESTIMATE, SEC-14 will measure). Planning cost per draft: **$0.27** if the draft is rendered at final resolution (AGT-013 decision), **$0.09** if a 1K master is approved and printed through a verified upscale.
- **Never-buy exposure cap:** agent pool of $10 per day (04, proposed) bounds worst-case leakage at about **$300 per month** if exhausted every day. Paying customers use the paid pool.
- Stripe: 2.9% + $0.30 per charge (SOURCED, finance README): on $10.98 that is **$0.62** (5.6 percent of the order). An approval-per-card flow cannot batch the fixed fee.
- Chargeback allowance (GUESS): 1.0 percent of agent orders x $15 fee + order value; refund inside the 30-minute hold: assume 3 percent of agent orders (GUESS).

## 3. Unit economics for an assistant-originated mailed card

Price: card_mailed $7.99 + $2.99 postage = **$10.98** (SOURCED, pricing.ts and finance README). Print $3.25 + ship $1.60 (ESTIMATE, README). The README states blended mailed-card contribution of **$2.9 to $4.1** after refund/reprint allowance, tokens and Stripe (SOURCED), and LTV of about $26 versus paid CAC of about $76 (SOURCED).

Agent adjustments (ESTIMATE):
- Abandoned drafts: assume 35 percent of drafts are never approved (GUESS; sensitivity 20 to 60 percent). Effective model cost per approved card = draft cost / (1 - abandon rate): $0.27 / 0.65 = **$0.42** (range $0.11 at $0.09 draft and 20 percent abandon, to $0.68 at $0.27 and 60 percent). Finance README already carries $0.25 for a card, so the increment is about **+$0.17 (range -$0.14 to +$0.43)**.
- Extra IP-screen and compose calls and notifications: about +$0.03.
- Extra chargeback/refund-in-hold allowance and support: about +$0.10 (GUESS).
- Resulting contribution per approved card: README range $2.9 to $4.1, minus about $0.30 = **$2.6 to $3.8; use Low $2.4, Base $3.3, High $4.0** (GUESS, Low below the range for stress).

## 4. Adoption and revenue scenarios (year 1 after P2 launch; all GUESS)

No data exists on how many people will connect an assistant. Early-adopter ranges only. "Paying agent users" = accounts that bought at least one card through an assistant.

| | Low | Base | High |
|---|---|---|---|
| Paying agent users | 40 | 150 | 600 |
| Cards per paying user in year 1 | 3 | 5 | 8 |
| Cards (approved, mailed) | 120 | 750 | 4,800 |
| Revenue at $10.98 | $1,318 | $8,235 | $52,704 |
| Contribution per card | $2.4 | $3.3 | $4.0 |
| Gross contribution | $288 | $2,475 | $19,200 |
| Share that is incremental (not just web orders moved) | 40% | 60% | 80% |
| Incremental contribution | $115 | $1,485 | $15,360 |
| Drafts at 65% approval | 185 | 1,154 | 7,385 |
| Draft model cost at $0.27 (already inside contribution) | $50 | $312 | $1,994 |

Reference: the workbook's Base case shows 1,895 orders in year 1 on the CMO's $6.5k a month budget (finance README). The assistant Base of 750 cards would be a large share if all cards were orders; treat it as aggressive for a launch-year feature.

Payback: $77,700 of new work at a Base incremental contribution of $1,485 a year is not recovered in 36 months. Direct margin does not justify the build on its own. What can: (a) **CAC avoided.** Paid CAC is about $76 (SOURCED). If each of 150 Base users would otherwise have cost $76 to acquire, that is $11,400 of avoided spend, but only for users who are genuinely incremental (60 percent: $6,840) (GUESS; do not book as revenue); (b) **retention.** Assume 60 percent annual retention: Base user contribution $3.3 x 5 = $16.50 in year 1, $9.90 in year 2, $5.94 in year 3 = **$32.3 over three years**, above the README LTV of about $26, with CAC near zero; (c) **option value** of platform distribution. The CFO should model the channel with CAC = 0 but a fixed R&D payback, and show the P0+P1 gate separately.

Break-even volume for the full $77,700 at $3.30 incremental per card, ignoring time: about 23,500 approved cards.

## 5. Pricing implications

- Agent buyers are likely repeat buyers (a habit like thank-you cards after meetings), which lifts LTV, but the average order is $10.98 and Stripe's $0.30 fixed fee costs 2.7 points of margin on it. Do not discount agent orders: the assistant has no price-comparison incentive, and the channel carries no CAC.
- Postage is included in `postageCents` for mailed cards; competitor reference points from docs/market/00-landscape.md: Hallmark about $5 to $6 with free "mail to them", Cardwise $6.99 mailed, Postable $3.99 + postage, Handwrytten/Scribble $2.45 to $4.95 (B2B, mostly 2023 data). A thank-you-after-meeting user may be more price-sensitive than a gift buyer. Test a lower "everyday card" SKU only after P2 data; changing prices is a one-file edit (`pricing.ts`).
- ChatGPT cannot sell digital goods or credits [V], so digital cards ($3.99) are not part of the ChatGPT revenue model.
- No subscription or prepaid bundle at launch (legal 06 item 40 and 03 here).
- Books are excluded from assistants in P1 to P3, so the higher-margin book SKUs ($39 and $49 + $5.99) are not in this model.

## 6. Cells the CFO should add to finance/GreetHub_Financial_Model.xlsx (Inputs sheet)

| Input | Base value | Range | Label |
|---|---|---|---|
| Assistant channel on/off per scenario | on from month 8 | month 6 to 12 | GUESS |
| Paying agent users, year 1 | 150 | 40 to 600 | GUESS |
| Cards per paying user per year | 5 | 3 to 8 | GUESS |
| Annual retention of agent users | 60% | 40% to 75% | GUESS |
| Draft approval rate | 65% | 40% to 80% | GUESS |
| Model cost per draft | $0.27 | $0.09 to $0.27 | ESTIMATE (SEC-14 and AGT-013 to measure) |
| Incremental share of agent orders | 60% | 40% to 80% | GUESS |
| Agent chargeback rate | 1.0% | 0.3% to 2% | GUESS |
| Refund-in-hold rate | 3% | 1% to 8% | GUESS |
| Agent CAC | $0 | $0 to $10 | GUESS (directory time and partner effort not priced) |
| One-time R&D (new work) | $77,700 | $64,750 to $116,550 | ESTIMATE |
| One-time attorney (agent items) | $6,000 | $3,000 to $9,000 | ESTIMATE |
| Monthly fixed channel opex | $300 | $120 to $650 | ESTIMATE |
| Agent-pool daily model budget cap | $10 | $5 to $25 | proposed policy |

Timing suggestion: spend P0 and P1 in months 1 to 3 after approval, P2 in months 4 to 5, P3 and P4 later; revenue starts the month after P2 ships. Model assistant revenue as flat through the year (thank-you and birthday cards are less seasonal than the Christmas, Mother's Day and Valentine's indices on the Inputs sheet) (GUESS).

## 7. What to re-measure after P1 (replace guesses)
1. Cost per draft and per approved card from `usage.cost` (SEC-14, AGT-013).
2. Draft-to-approval conversion and cards per user from the Assistants dashboard (AGT-017).
3. Share of agent buyers who were existing web customers (incrementality).
4. Support minutes per 100 assistant orders.
5. Directory listing effects on connected accounts (P4).
