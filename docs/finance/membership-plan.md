# GreetHub membership plan

CFO, 2026-10-14. A proposal: prices are not approved, and this is not legal advice. Costs come from `finance/measured_costs.json` and the v3 model.

## 1. Recommendation summary

- Three tiers: **Free**, **Plus** ($3.99 a month / $35.99 a year: own handwriting, saved signatures, "Use on every new card", higher AI limits, an e-card a month, drafts kept a year) and **Card Club** ($9.99 / $99: Plus plus one mailed card a month).
- These stay free: the guest preview, single cards and books, the 8 preset hands, a typed signature on any card, proofs, People, every book's 3 redraws and 2 sheet redos, and reminders.
- Own handwriting and signatures make **no model calls**, so the paywall captures value rather than saving cost. Capped AI use costs at most $3.18 a Plus member a month, under the $3.57 net price.
- Membership will not fix break-even: at 3% attach it adds about $1k a year per 1,000 customers, against a $297k funding need. Its job is order frequency, from 0.35 orders a year to 12 cards a year.
- Ship behind a flag, off until the attorney reviews it (legal 06 req 40). Plus can go first; Card Club follows once printer costs are verified.

## 2. Tiers

| | Free (account) | Plus | Card Club |
|---|---|---|---|
| Monthly / annual | $0 | 399 / 3599 cents | 999 / 9900 cents |
| Trial | none | 14 days, no card needed | none (credits cost real print) |
| Preset hands (8), typed signature per card | yes | yes | yes |
| Own-handwriting styles stored | 1 (preview only, can't print) | 3, print on cards | 3, print on cards |
| Saved signatures (typed, drawn or uploaded) | 0 | 5 | 5 |
| "Use on every new card" | no | yes | yes |
| "Write it for me" messages / month | 10 | 100 | 100 |
| Card redraws / month (signed-in card flow) | 5 | 30 | 30 |
| Page redraws per book (sheet redos stay 2) | 3 | 6 | 6 |
| Drafts kept | 90 days | 365 days | 365 days |
| E-card credits / month (no rollover) | 0 | 1 | 1 |
| Mailed-card credits / month (standard US postage included; bank up to 3) | 0 | 0 | 1 |
| Off extra mailed cards (merchandise only) | 0% | 0% | 10% |

Free accounts can upload one handwriting sheet and see it in the preview, but ordering a card in that hand needs Plus. That preview is the hook that turns Free members into Plus members. No tier discounts books: they earn $21 to $28 each, and 10% off would cost more than Plus earns.

Left out on purpose:
- **Priority print:** we don't control the printer's queue, and express shipping already exists.
- **Free book postage:** it gives up $5.99 of revenue to cover $5.50 of real shipping.
- **Gating proofs or People:** both are part of checkout, so gating them would break orders that work today.

## 3. Entitlements spec

```json
{
  "version": "2026-10-14",
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "monthlyCents": 0,
      "annualCents": 0,
      "trialDays": 0,
      "features": {
        "preset_handwriting": true,
        "typed_signature_on_card": true,
        "own_handwriting_styles": 1,
        "own_handwriting_print": false,
        "saved_signatures": 0,
        "apply_to_new_cards": false,
        "ai_message_writes_per_month": 10,
        "card_redraws_per_month": 5,
        "book_page_redraws_per_book": 3,
        "drafts_retention_days": 90,
        "digital_card_credits_per_month": 0,
        "mailed_card_credits_per_month": 0,
        "mailed_card_credit_bank_max": 0,
        "printed_card_discount_pct": 0
      }
    },
    {
      "id": "plus",
      "name": "Plus",
      "monthlyCents": 399,
      "annualCents": 3599,
      "trialDays": 14,
      "features": {
        "preset_handwriting": true,
        "typed_signature_on_card": true,
        "own_handwriting_styles": 3,
        "own_handwriting_print": true,
        "saved_signatures": 5,
        "apply_to_new_cards": true,
        "ai_message_writes_per_month": 100,
        "card_redraws_per_month": 30,
        "book_page_redraws_per_book": 6,
        "drafts_retention_days": 365,
        "digital_card_credits_per_month": 1,
        "mailed_card_credits_per_month": 0,
        "mailed_card_credit_bank_max": 0,
        "printed_card_discount_pct": 0
      }
    },
    {
      "id": "card_club",
      "name": "Card Club",
      "monthlyCents": 999,
      "annualCents": 9900,
      "trialDays": 0,
      "features": {
        "preset_handwriting": true,
        "typed_signature_on_card": true,
        "own_handwriting_styles": 3,
        "own_handwriting_print": true,
        "saved_signatures": 5,
        "apply_to_new_cards": true,
        "ai_message_writes_per_month": 100,
        "card_redraws_per_month": 30,
        "book_page_redraws_per_book": 6,
        "drafts_retention_days": 365,
        "digital_card_credits_per_month": 1,
        "mailed_card_credits_per_month": 1,
        "mailed_card_credit_bank_max": 3,
        "printed_card_discount_pct": 10
      }
    }
  ],
  "featureKeys": {
    "preset_handwriting": "The 8 preset hands on any card, for guests too. Always true; listed so nobody gates it. Card creator style picker.",
    "typed_signature_on_card": "Per-card 'type my name' signature (signature: typed), not saved. Always true. Card creator; screened like the sign-off.",
    "own_handwriting_styles": "Max own-handwriting styles a member can create (stored count). Enforced on sheet upload in lib/writing/service.ts as min(value, MAX_CUSTOM_STYLES). Styles over the limit are kept, never deleted.",
    "own_handwriting_print": "Whether a card using a custom styleId can be added to the cart or checked out. Enforced server-side at add-to-cart and checkout; the picker shows a lock. The print job never re-checks paid orders.",
    "saved_signatures": "Max saved signatures of any kind (typed style, drawn, uploaded). Enforced on create in lib/writing/service.ts as min(value, MAX_SIGNATURES), and at add-to-cart/checkout for signature: saved.",
    "apply_to_new_cards": "Whether the 'Use on every new card' default is applied. Enforced in DefaultsSchema handling (writing service) and where the card creator sets up new drafts.",
    "ai_message_writes_per_month": "'Write it for me' calls per quota period for a signed-in member. /api/card/message, counted in the durable ledger. Guests keep the existing per-IP limiter.",
    "card_redraws_per_month": "Card face re-renders per quota period in the signed-in card flow (B4, not built yet). Enforced in the card render job before dispatch.",
    "book_page_redraws_per_book": "Page redraws per book project, replacing REROLL_ALLOWANCE. Snapshotted onto the project at creation; sheet redos stay SHEET_FREE_REDOS = 2. lib/book/service.ts.",
    "drafts_retention_days": "Days from last edit before a draft expires. Drafts expiry job and the Account drafts badge. Never extends photo retention (90-day purge, legal 06).",
    "digital_card_credits_per_month": "E-cards a member can check out at $0 per quota period; no rollover. Applied at checkout to one card_digital line.",
    "mailed_card_credits_per_month": "Mailed cards a member can check out at $0 merchandise and $0 standard US postage per quota period. Express is charged. Applied at checkout to one card_mailed line.",
    "mailed_card_credit_bank_max": "Max unused mailed-card credits carried forward while the membership is active. Issued monthly, also on annual plans.",
    "printed_card_discount_pct": "Percent off the card_mailed merchandise price on lines not paid by a credit; never on postage or books. Doesn't stack with the creator code; the larger one applies."
  },
  "rules": {
    "quotaPeriod": "Paid tiers: the Stripe billing period (monthly slices for annual plans). Free: calendar month, UTC.",
    "unlimited": -1,
    "pastDueGraceDays": 7
  }
}
```

## 4. Unit economics per member per month

Costs:
- Card redraw: $0.0669 (2K render plus QA plus the 5.5% OpenRouter fee; MEASURED).
- E-card: $0.26 (MEASURED, extrapolated).
- Message write: about $0.006 (Sonnet card copy). Today it uses the knowledge base; the cost of its live IP screen was not found.
- Mailed credit: $5.31 (print $3.25, shipping $1.60, tokens and a 4% reprint allowance; ESTIMATE).
- Support: $0.10 per member (GUESS).

Usage (GUESS): 60% of e-card credits used, 8 redraws, 15 writes, 80% of mailed credits used.

| Per member per month | Plus monthly | Plus annual | Card Club monthly | Card Club annual |
|---|---:|---:|---:|---:|
| Price | $3.99 | $3.00 | $9.99 | $8.25 |
| Stripe | $0.42 | $0.11 | $0.59 | $0.26 |
| Net | $3.57 | $2.89 | $9.40 | $7.99 |
| Expected cost (AI, credits, support) | $0.90 | $0.90 | $5.15 | $5.15 |
| **Expected margin** | **$2.67 (67%)** | **$1.99 (66%)** | **$4.25 (43%)** | **$2.84 (34%)** |
| Heavy user cost (every cap used) | $3.18 | $3.18 | $8.49 | $8.49 |
| **Heavy user margin** | **$0.39** | **-$0.29** | **$0.91** | **-$0.50** |
| Break-even card redraws (other caps maxed) | 36 | 26 | 44 | 31 |

- Only heavy annual members lose money, and only up to $0.50 a month. The 30-redraw cap is below break-even on both monthly plans. If the live re-roll rate comes in near 50%, cut it to 20 before raising prices.
- Credits are issued monthly, even on annual plans, so nobody can use a year of cards and then ask for a refund.
- An extra mailed card bought at 10% off still earns about $3.65 (vs $4.45).

## 5. Effects on the existing model

- **Attach rate (GUESS):** 3% of active customers hold a paid tier (range 1% to 8%). Split 70% Plus / 30% Card Club, 30% on annual plans. Churn is 8% a month (range 5% to 12%), so members stay about 12.5 months.
- **LTV:** the subscription alone earns about $31 per Plus member and $48 per Card Club member (blended monthly and annual), against today's $26 customer LTV.
- **Blended effect:** about $86 a month per 1,000 active customers (21 x $2.47 + 9 x $3.83), roughly $1.0k a year. That is immaterial to the $297k funding need.
- **Cannibalisation:** a member who would have bought a mailed card every month anyway earns $3.19 on the credited card instead of $4.45 (-$1.26). At 0.35 orders a year almost nobody does. E-card credits displace a few $3.19 e-card sales.
- **Gating risk:** gating pays for itself unless it loses more than about 230 mailed-card sales a year per 1,000 customers. That is unmeasured, so track preview-to-cart for cards that used the own-handwriting preview.
- **Card and book contribution:** unchanged for non-members. A member's book gets 3 more redraws, at most $0.20.

**Inputs rows to add (new section 18):**
- Prices: four price inputs, trial days, trial-to-paid conversion (25%, range 10% to 40%).
- Members: attach rate, tier split, annual share, churn.
- Usage: e-card and mailed-credit use, card redraws, message writes, extra Card Club cards (0.5 a month) and the discount %.
- Costs and risks: support per member, cannibalised cards, the gating conversion penalty (0% to 3%), the bank cap, and the Stripe Billing fee (I recall 0.7% of recurring volume; not verified).

Feed them into `Forecast` rows for members by tier, subscription revenue, Stripe, credit and AI cost, and contribution, plus a `Unit Economics` block that mirrors section 4.

## 6. Rules

- **Trial:** Plus only, 14 days, once per account, no card needed, no credits. It falls back to Free unless the member adds a card, with a reminder 3 days before the end.
- **Cancellation:** two clicks, no chat or call. Access, quotas and banked credits last to the end of the period, with a "Turn it back on" button until then.
- **Downgrade:** takes effect at the end of the period. Styles and signatures over the new limit are **kept, never deleted**, and marked "Paused". They can't be printed, used as defaults or added to while over the limit, but the member can delete them. Defaults are remembered but not applied. Books keep the redraw allowance they started with. Drafts over 90 days old get 30 days' notice.
- **Banked credits:** usable until the membership ends (open question 3).
- **Existing orders:** paid orders print as approved, and the print job never checks entitlement (ownership checks stay). Lines added to the cart while the member was entitled stay purchasable.
- **Past due:** perks stay on for 7 days while Stripe retries, then Free applies.
- **Refunds:** the first charge is fully refunded within 14 days if no credit was used. After that there are no partial refunds, and access runs to the end of the period. Billing errors and legally required refunds are always paid. Orders keep the Refund & Reprint Policy, and a refunded credit-paid card returns the credit, not cash.
- **Grandfathering:** members who join before 2027-03-01 keep their price and limits while continuously subscribed. Everyone else gets 30 days' notice of a price change, effective at renewal.

## 7. Open questions for the owner

1. Do you approve the prices and names? Launch both tiers, or Plus only?
2. For the attorney: ROSCA and California auto-renewal disclosures, consent records, annual renewal reminders, and the trial wording.
3. For the attorney and finance ops: can banked credits expire when a membership ends (gift-card or unclaimed-property rules)? Is sales tax due on the fee, on redeemed cards, or both?
4. PLAN.md and B12 give own handwriting to every free account today. Do you accept charging for it? The plan and site copy would change.
5. Should the AI-assistant channel and a saved likeness for People (both post-launch) be free or Plus? I lean free for the channel and Plus for likeness.
6. Can you order printer proofs and verify prices before Card Club? The $5.31 credit cost is an estimate.
