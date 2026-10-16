# CFO committee review, 2026-10-15

Sources read: docs/PLAN.md (owner list at lines 1100-1114, Oct 24 table at 247), finance/README.md, finance/GreetHub_Financial_Model_v3.xlsx (cached values; I did not recalculate today), docs/finance/*, docs/legal/00 and 04, docs/ops/photo-events-printing.md, docs/research/01. Labels: SOURCED, ESTIMATE, GUESS, UNKNOWN. This is finance research, not legal or tax advice.

## 1. Done vs plan

| Plan item | Status | Evidence |
|---|---|---|
| Workbook v3 (core, R&D, Kiosk, Agent, Compare) | Done, 2026-10-12 | 8,811 formulas, 0 errors at that time. Not re-run today. |
| Pricing proposals: membership, photo cards and events | Done as documents only | docs/finance/membership-plan.md, photo-events-pricing.md |
| Finance ops (chart of accounts, close checklist, accountant questions, photo-event tax and postage) | Done | finance/ops/ |
| Model wired to photo cards, events, membership | NOT done | Both docs list the "Inputs rows to add" but nothing is in the workbook |
| CTO measured costs pasted in | Done | `Model Costs`; totals are still extrapolated (no full 24/32-page live run exists) |
| Real print and ship costs | NOT done | Still ESTIMATES; no Lulu/Prodigi/Gooten quote or sandbox call |
| Oct 24 photo-card go/no-go | PM read: 1 met, 7 not met, 2 unknown | Criterion 2 (25% contribution at a real quote) is mine and is UNKNOWN |

Base case, v3, no paid-spend change (Base, core only): no break-even in 36 months; month-36 cash -$267k; peak funding need $297k on $30k opening cash (GUESS). Paid CAC $70 against LTV $26 (each paid customer loses about $44). Contribution per order $15.20.

What drives it: print and shipping (about 80% of a printed book's variable cost), paid CAC, the $107k of core engineering carried as 100% cash (rate and overhead are GUESSES), and the marketing budget. Tokens are about 6%.

Cases that matter: $0 paid breaks even at month 24 (cash -$95k); recommended prices plus $0 paid plus 25% cash engineering reaches month 24 and -$13k, peak need $54k (the number the PM quotes). That case rests on three unapproved prices and an unmeasured engineering cash share.

## 2. Cash and spend the owner is asked to approve

Amounts are what the docs state or what the model carries. Only the OpenRouter and DMCA figures are firm.

| # | Spend | Amount | Label | What it unblocks |
|---|---|---|---|---|
| 1 | OpenRouter, one cap (style samples $3.50, launch art <$10, golden baseline $5, usability renders $15, IP eval ~$1) | $35 | PLAN item 6 (estimate) | Real art on home/picker, first quality baseline, usability round 1 |
| 2 | Usability and survey participants (5-8 people) | $400-500 per PLAN; $50-90 each via a panel per docs/cx/04, so $250-720 | ESTIMATE | Usability round 1, photo-trust and price research. No separate survey-panel figure exists: UNKNOWN |
| 3 | Physical proofs, one per product, plus about $200 of competitor books | Model carries $1,500 for proofs and launch assets; real proof cost UNKNOWN until a printer quote | GUESS | Christmas go/no-go, product photos, creator outreach. Photo-card proof must be ordered by Nov 6 |
| 4 | Attorney, launch package | Legal estimate $7,000-27,000 excluding insurance (docs/legal/00). Model carries $12,000 ($4,000 base + $8,000 top-up) | ESTIMATE (legal marks them [U]) | Real children's photos (Q1-Q13), policies, consent wording, vendor DPAs. Longest lead time |
| 5 | Trademark knockout and filing | $2,000 in model (legal range $1,000-4,500) | ESTIMATE | Brand spend, creator outreach |
| 6 | Vercel Pro, Supabase Pro, Resend | About $100 a month at launch volume (model: $26 + $53 + $20) | ESTIMATE; I did not re-read vendor price pages today | Persistence (B1), log drains, backups, email. Nothing real runs without Supabase |
| 7 | Insurance (cyber, media/IP, GL) | Model $383 a month, about $4,600 a year; legal range $2,500-8,000 | ESTIMATE, quote needed | Real photos stored, partner contracts |
| 8 | DMCA agent, domain, mailbox, LLC filing | $6, about $20 a year, $0-12 a month, state fee UNKNOWN | SOURCED / UNKNOWN | Placeholder-free footers, takedown safe harbour |
| 9 | Accountant and sales-tax set-up | $500-2,000 once, $100 a month | ESTIMATE | First live payment, Stripe Tax |
| 10 | Gooten account, sandbox and test order (photo cards) | UNKNOWN | UNKNOWN | Criteria 1, 2, 9 of the Oct 24 gate |

Total before the first live order, using model figures: about $35 + $450 + $1,500 + $12,000 + $2,000 + $2,000 (accountant, entity, domain, mailbox: GUESS) = about **$18k**, plus about **$480 a month** of Vercel, Supabase, Resend and insurance. Using the legal range's high end the attorney line alone could reach $27k, so **plan $18k-35k and treat $30k opening cash as already spoken for.** Not in the total: engineering ($107k modelled), item 10, and any bank, state or EIN fees.

Cash-free but gating: the owner's time to engage an attorney this week; nothing here is approved by me.

## 3. Pricing and marketing

Pricing items outstanding (owner approval needed on all):
- **Core prices.** Recommended: books +$5 ($44 / $54 all-in with postage), mailed card $8.99 with postage included, digital book $9.99, Express off. Market intel (market/03) calls the current $10.98 mailed card and $19.99 digital book out of line. The model has no price elasticity, so it shows margin only.
- **Photo-card configuration.** My ladder runs 10 to 200 cards; the PM roadmap sells 25 / 50 / 100 for 2026 and adds 10 later (PLAN decision 3). I agree with 25 / 50 / 100: the 10-card order earns about $9. I still need to cut my ladder to three rows and put prices in a config file, not code.
- **Printer cost is ASSUMED.** Gooten flat-card list prices are from public pages; no quote. The gate needs 25% contribution at the real quote. At my assumptions a 25-card order is 29%, 50 is 34%, 100 is 37%. If print runs $0.30 a card higher, a 50-card order falls to about $18 (about 19%), below the gate. Rule: raise every band $0.20 if print at 50 is above $0.95 a card.
- **Order-by date.** The PM proposes Nov 30; this shrinks Dec demand (I estimated about 70% of orders arrive Dec 1-10). Not modelled.
- **Stale competitor figures (PLAN decision 5).** In docs/finance/photo-events-pricing.md section 7 I cite Minted at about $2.28 a card and Paperless Post at $0.22-0.30; the PM says Minted $2.28 and Vistaprint $59.95 are Nov 2022 and Paperless Post is now $0.85 Premium (Oct 2026). My doc labels them "SOURCED via the plan" and does not date them. I will mark them dated or drop them; I did not edit them in this review. No public comparison before Market intel refreshes (Oct 22).
- **Membership.** Prices ($3.99 / $9.99) unapproved; needs attorney on auto-renewal and credit expiry; adds about $1k a year per 1,000 customers, so it is not a break-even lever. Card Club mailed credit cost ($5.31) is an ESTIMATE awaiting a printer quote.
- **Postage.** Modelled $0.82 stamp and $0.65 postcard; I could not confirm the July 2026 increase. Read from config.

Soft-launch marketing budget (my recommendation):
- PLAN: invite-only, about 50 orders, no paid ads, no creator seeding, lower 48, Express off. So **paid budget for the soft launch is $0.** The CMO's $6.5k a month does not apply until the public launch (about Jan 12, 2027), and my base case says it should not apply then either at the current CAC.
- At about $15 contribution per order, 50 orders earn about $750 against about $480 a month fixed running cost. The soft launch is a test, not a profit source.
- Public launch: if the owner wants any paid spend, cap at **$2k a month** with a stop rule (pause if blended CAC above $35 after 60 days). At $2k the model still shows no break-even (month-36 cash -$148k). The only break-even routes are $0 paid, organic demand, better print cost, or a higher conversion rate. Conversion x2 gives month 25.
- Creator gift and discount cap: UNKNOWN, owner has not set one. Social's offer costs about $4.91 per attributed order plus a $1,400 fixed line in the model.

## 4. What the model still lacks

1. **Photo cards and events**: no SKUs, price bands, Gooten costs, envelope, shipping box, mail-for-me, Event Plus, sales tax by state, or the Dec seasonality. docs/finance/photo-events-pricing.md section 9 lists the rows; none are built.
2. **Membership** section 18 (attach, churn, credits, Stripe Billing fee, which I recalled as 0.7% and did not verify).
3. **Real printer costs.** Every print and shipping input is an ESTIMATE. This is the largest uncertainty in the whole model.
4. **Soft-launch timeline.** The model starts Nov 2026 with full funnel; the plan is invite-only, 50 orders, public Jan 2027, books gated on Nov 13. Needs a launch-month shift and an orders cap.
5. **Price elasticity, income tax, working-capital timing of payouts, founder pay, and sales tax as a pass-through** are not modelled.
6. **Abuse cost.** Unpaid book renders are modelled only as a normal abandonment rate (-$9.5k over 36 months). Real exposure from missing durable per-account caps is not.
7. **Actuals.** finance/ops has an actuals-vs-model template; no actuals exist, because nothing has been sold. The first useful re-calibration is the first Lulu/Prodigi quote and the first full live book run.
8. **Funding picture.** Opening cash $30k is a GUESS; the owner has not stated capital or whether the $54k to $297k need would be self-funded. PLAN item 12 lists equity and funding as not launch-blocking, but it decides how many of the above can be paid.
9. **Housekeeping.** finance/README.md says v3 is current but the original file has a stale lock; the README's kiosk figures were flagged by the PM as needing a check against v3. Not done today.

## Asks
- Owner: approve #1 now ($35, Oct 20 date); decide the attorney and give a quote budget; order proofs by Nov 3 (cards by Nov 6); open the Gooten account; approve or reject the three recommended prices; state opening capital.
- Fulfillment: Gooten and Prodigi quotes for 25 / 50 / 100 flat 5x7 with envelope.
- Market intel (Oct 22): refresh Minted, Vistaprint and Paperless Post figures.
- Support/Legal: confirm the reprint window (90 days proposed) so I can set the reprint allowance.
