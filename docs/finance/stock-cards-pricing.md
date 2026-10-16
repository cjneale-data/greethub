# Stock cards: pricing and unit economics

CFO, 2026-10-16. A proposal: no price is approved, and none of it is legal or tax advice. Labels: MEASURED (pipeline ledger), SOURCED (a repo file or config), ESTIMATE (derived by me from those), GUESS (no data).

## 1. Recommendation

| | AI card today | Stock card | Discount |
|---|---|---|---|
| Digital | $3.99 SOURCED (`packages/shared/src/pricing.ts` card_digital) | **$3.49** ESTIMATE | -$0.50, -12.5% |
| Mailed, merchandise | $7.99 SOURCED (card_mailed) | **$7.49** ESTIMATE | -$0.50, -6.3% |
| Mailed postage | $2.99 SOURCED | $2.99, unchanged | none |
| Mailed, all-in | $10.98 SOURCED (7.99 + 2.99) | $10.48 | -4.6% |

Reasoning:
- The generation step we skip costs $0.2479 per printed card (MEASURED/extrapolated, `finance/measured_costs.json`, 3 renders, 20% re-rolls). A discount that gives back that saving would be $0.25. I recommend $0.50, twice the saving, because a stock card is a less personal product and the discount has to be visible on the page. A $0.25 gap ($3.74) is too small to read as a deal.
- Same dollar gap on both formats keeps the pricing page simple. It is a bigger percent on digital, where the price is lowest. The digital gap is the one to test (section 6).
- Do not go lower: Stripe is 2.9% + $0.30 (SOURCED, PLAN section on unit economics) and a digital card keeps only about $3 at $3.49.
- Print, postage and fulfilment are identical to the AI card: the same 5x7 folded card, same printer, same $2.99 postage line. Printer costs are still unverified ESTIMATES (finance/README.md); nothing here changes that.

## 2. Unit economics per card

Existing contribution per item: digital $3.19, mailed $4.45 (SOURCED, finance/README.md). Digital cost stack at $3.99: Stripe $0.42 + AI $0.25 + other $0.14 (the $0.14 is the remainder, ESTIMATE; I have not itemised it).

| Per card | AI digital | Stock digital | AI mailed | Stock mailed |
|---|---|---|---|---|
| Revenue (merchandise) | $3.99 | $3.49 | $7.99 | $7.49 |
| Generation (2K, re-rolls) | $0.25 MEASURED | $0 | $0.25 MEASURED | $0 |
| Guest preview, avoided | $0.07 per preview, ESTIMATE | $0 | same | $0 |
| Stripe change | base | -$0.01 | base | -$0.01 |
| **Contribution** | **$3.19** | **about $2.94** ESTIMATE | **$4.45** | **about $4.18** ESTIMATE |
| vs AI card | | -$0.25 (-8%) | | -$0.27 (-6%) |

- Tokens saved: the full $0.2479 (3 renders, QA, copy, prompts). A stock card still has an optional message edit. If the customer uses "Write it for me", that is one card_copy call, $0.0054 MEASURED. Handwriting and signatures make no model calls (membership-plan.md), so stock cards cost the same to personalise as AI cards.
- The discount is $0.25 more than the saving, so each stock card earns about $0.25 to $0.27 less than the AI card. That is the price of the cheaper-looking product.
- A stock card also avoids the guest-preview spend on shoppers who leave ($0.0689 per preview, ESTIMATE, not run end to end). Not counted above, so the table is conservative.

## 3. One-time catalog cost

Generating a design costs what an AI card costs. Per design: front only $0.1624, front plus inside $0.2479 (both extrapolated from MEASURED unit costs, 2K, 20% re-rolls).

| Catalog size | Front only | Front plus inside | With picking, 3 candidates per keeper (ESTIMATE) |
|---|---|---|---|
| 25 designs | $4.06 | $6.20 | $18.60 |
| 50 designs | $8.12 | $12.40 | $37.19 |
| 100 designs | $16.24 | $24.79 | $74.37 |
| 250 designs | $40.60 | $61.98 | $185.93 |

- The picking column assumes a human or QA gate keeps one in three; that rate is a GUESS. Even 250 curated designs cost under $190, which is far below one paid-ad customer ($70 CAC, SOURCED finance/README.md). Cost is not the constraint. Curation time, style variety and IP review are.
- Each design is generated once and sold unlimited times, so catalog cost per sale falls to near zero after about 60 sales at $0.25 saved per sale ($0.2479 / $0.25 on one design, ESTIMATE of payback).
- Rule 6 and legal/07 apply: no named artists, brands or characters in catalog prompts. IP Safety should review every design before it goes live. This is engineering, not legal advice.
- Money rule: I did no paid calls. Generation of the catalog needs an owner-approved dollar cap; I suggest $100 for the first 100 designs.

## 4. Member perks and prices

Membership prices stay as in docs/finance/membership-plan.md (Plus $3.99 / $35.99, Card Club $9.99 / $99; SOURCED, still unapproved).
- **Own handwriting and saved signatures on stock cards**: Plus and Card Club, as for AI cards. Free accounts can preview but not print. No model call, so no added cost.
- **E-card credit (1 a month)**: make it redeemable on stock cards first. A stock digital card costs us roughly $0.14 to $0.25 less than an AI one, so the credit costs less. ESTIMATE.
- **Mailed credit (Card Club)**: redeemable on stock or AI. Cost to us is print plus postage either way; stock saves $0.25.
- **10% off extra mailed cards (Card Club)**: apply to merchandise only, off the stock price ($0.75 on $7.49). Stacking with a pack discount is not allowed. Contribution on a Card Club stock mailed card is then about $3.43, still above Stripe plus print. ESTIMATE.
- No separate membership discount on stock digital cards: at $3.49 there is no room.

## 5. Margin and cannibalisation

- Stock cards are cheaper to make but earn $0.25 to $0.27 less each. If every AI card buyer switched, card contribution would fall 6% to 8%. That is the worst case, not a forecast.
- A stock card pays for itself if it brings in more than about 8% extra digital orders or 6% extra mailed orders (0.25 / 2.94; 0.27 / 4.18). Candidates for the extra volume: buyers who find a custom brief too slow, "send a thank you to X" through the future assistant, the agent channel (finance/README.md, GUESS 5 cards a user a year), and repeat orders.
- Share of AI buyers who switch: GUESS. I model 30% (range 10% to 60%). The sheet has no cannibalisation row yet; I have not added one because there are no conversion data.
- Card margin is small in the model anyway. At $15.20 per order and $70 CAC (SOURCED), break-even does not move on cards. Books, not stock cards, decide the funding need ($297k, membership-plan.md). Stock cards are a conversion and frequency play.
- The assistant use case lowers support and token risk: no generation means a stock-card agent order has a fixed, small cost, so an agent spending limit can be set in plain dollars.

## 6. Multi-card packs

Worth testing, but not at launch.
- **Why**: thank-you cards are bought in sets (after a birthday, a wedding or a baby); this is reasoning, not data. A pack saves one Stripe fixed fee ($0.30 per order) across several cards: about $0.24 a card at 5 cards (ESTIMATE).
- **Proposal, phase 2**: 5-packs only, same design or mixed, sent to different recipients with per-card postage unchanged. Digital 5-pack $15.99 (-8.4% vs $17.45); mailed 5-pack $33.49 merchandise (-10.6% vs $37.45).
- **Contribution** (ESTIMATE): digital about $2.91 a card; mailed about $3.63 a card, after the discount and the shared Stripe fee.
- **Do not**: stack packs with Card Club's 10%, or add 10-packs until pack uptake is measured. A pack is a bet that buyers send more cards, not a way to give margin away.

## 7. What to measure

1. Stock share of card orders, and AI card orders before and after launch (cannibalisation).
2. Net card orders per visitor, stock plus AI, against the same week a month earlier. Break-even is +6% to +8%.
3. Stock to AI upgrade rate ("make it personal").
4. Message edit rate and "Write it for me" use on stock cards (token cost, $0.0054 per use).
5. Digital versus mailed split, and mailed attach on stock cards.
6. Handwriting and signature use on stock cards, and Free-to-Plus conversion from the preview hook.
7. Repeat orders in 90 days (the real purpose), and pack uptake once packs exist.
8. Catalog: sales per design, designs with zero sales after 60 days, and generation spend against the cap.
9. Refund and reprint rate by design (QA and print cropping).

## 8. Owner asks and gaps

- Approve the stock price points ($3.49 / $7.49), a catalog generation cap (suggest $100), and whether the packs wait for phase 2.
- Fulfillment: confirm the stock card prints on the same stock and at the same cost as the AI card.
- Shop engineer: add `card_digital_stock` and `card_mailed_stock` to `PRICING.skus`. I did not edit code (outside my lane).
- Not done: the Excel model (no stock-card row yet), any paid call, committing this file.
