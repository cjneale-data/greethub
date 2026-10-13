# Creator and affiliate program spec

Owner: Social and Creator Partnerships Lead. Written 2026-10-12. Research and engineering only, not legal advice: the contract, release and tax treatment need the owner's attorney and accountant before the first creator signs.

## 1. What the program is

Two tiers, one contract template:
- **Seeded creators (tier 1):** micro creators (5k-100k) in parenting, gifting, grandparent, bookish and teacher niches. They get one free book (made from their own story and their own family photos) and, optionally, a flat fee. They post honestly, with disclosure, and get a personal code and link.
- **Affiliates (tier 2):** anyone approved through an application form (bloggers, gift-guide sites, teachers' newsletters). No free product; code, link and commission only.

## 2. Offer and payout math

Inputs: Unit Economics sheet, `finance/GreetHub_Financial_Model_v2.xlsx` (Base, read 2026-10-12). Contribution margin (CM) per item before marketing: digital card $3.19, mailed card $4.45, 24-page book $21.42, 32-page book $27.84. Proposed offer (marketing plan s3; CFO to confirm): 10% off for the audience, 10% commission on the merchandise subtotal after discount, excluding postage and tax.

| Item | List | 10% off | Commission (10% of net) | CM after both |
|---|---:|---:|---:|---:|
| Digital card | $3.99 | $0.40 | $0.36 | about $2.43 |
| Mailed card | $7.99 | $0.80 | $0.72 | about $2.93 |
| Book, 24 pages | $39.00 | $3.90 | $3.51 | about $14.01 |
| Book, 32 pages | $49.00 | $4.90 | $4.41 | about $18.53 |

(Stripe fees fall slightly with the lower price; ignored, so these are a little conservative.)

- **Gifted book cost:** about $20 per creator (tokens $1.33 + print $12.50 + shipping $5.50 + reprint allowance $0.72, model estimates), plus about $0.05-1.64 of previews and redraws. 20 seeded creators is about $420 of COGS.
- **$1,400 a month creator line (CMO):** for example 20 gifted books ($420) plus about 6 flat fees at $150 ($900, guess) = $1,320. Commission and discount are per-order costs paid out of margin, not from this line.
- **Break-even:** the fixed $1,320 needs about 94 creator-attributed 24-page book orders a month to pay back from the $14 CM, or about 14 new customers at the CSV's $94 creator CAC. The CSV models creators as a CPC ($1.20/click), which doesn't fit gifts, fees and commission. **CFO:** model creators as fixed (gifts + fees) plus per-order (discount + commission).
- **Cards:** commission on a mailed card is $0.72; keep it, it costs little, but don't recruit card-only affiliates.
- **Stacking:** one code per order, no stacking with any first-order offer (CMO s8). Never a fake "was" price.

## 3. FTC disclosure rules (built into the contract and the brief)

Source: FTC, "Disclosures 101 for Social Media Influencers", https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers (read 2026-10-12). Also the Endorsement Guides, 16 CFR Part 255, and the Consumer Reviews and Testimonials Rule, 16 CFR Part 465 (legal/03 section 2).
- Disclose in the post itself: "Ad", "Sponsored" or "GreetHub sent me this book for free". Not only in the bio, not behind "more", not buried in hashtags. A free book alone counts as a material connection.
- Video: say it out loud and show it on screen. Live: repeat it. The platform's paid-partnership label is used as well, never instead.
- Affiliate links and codes: say "I earn a commission" near the link.
- No scripted claims we can't support (see the playbook's claims rule). Creators may say what they liked and what they didn't. We never make payment depend on a positive review (Part 465).
- Employees, relatives and anyone paid must disclose the connection on any review.
- **Monitoring:** we check every post within 72 hours. A missing disclosure gets one request to fix within 48 hours; a second miss ends the agreement and voids unpaid commission.

## 4. Children and photos (docs/legal/06 applies)

- A creator may make a book only of their own family, as the parent or legal guardian, through the normal consent flow (boxes A-D). We never receive their photos outside the product.
- A creator may show their child in their own post; that is their choice. We never ask for it, and the brief offers a no-face option (hands holding the book, page close-ups without faces, the child's illustrated character only with the parent's OK).
- Posts must not show the child's full name, school, town or birthday. The brief says so.
- The 90-day photo purge and delete-my-data apply to creators like any customer.

## 5. Tracking links and codes

- Link: `trackedLink(path, { channel: "creator", campaign, ref: code })` in `app/lib/social.ts` (built, tested). Codes are slugs (`cozy-shelf`), never a child's name.
- **Not built:** capture of `ref`/UTM on arrival and first-touch storage (DATA-003); a discount-code field and code table; commission attribution on the order; a partner payout report. See section 8.
- Attribution rule (proposed): code entered at checkout wins; else last `ref` click within 30 days. One partner per order.

## 6. Content release (reuse by GreetHub)

No GreetHub reshare, repost, whitelisting or Spark Ad without a signed release that states:
- which posts, which uses (organic reshare; paid ads as a separate checkbox and fee), which platforms, and the term (proposed 12 months organic, 90 days paid);
- that any child shown is the signer's own, with the other parent's consent where required (attorney to word);
- that the creator can withdraw consent and we take the content down from our accounts and stop ads within 72 hours;
- no editing that changes meaning, no new claims added, disclosure kept on whitelisted ads.
Proposed policy, stricter than the law asks: paid ads never use a child's real face, even with a release. Use hands, book pages and illustrated characters only.

## 7. Payouts

- Pay monthly, for orders shipped more than 30 days earlier and not refunded or disputed (orders can't reach "delivered" yet; shop engineer finding). Minimum payout $25.
- Pay by a payout service chosen by the owner (none chosen; no new paid service in this spec). Collect a W-9 before the first payment. Gifted books and fees may be reportable income for the creator; the 1099 threshold and treatment are for the accountant (not verified here).
- Creators in other countries: not at launch (tax forms and FTC jurisdiction differ).

## 8. What the product needs (for the CTO, shop and data owners)

1. Arrival capture of `ref` and `utm_*` into a first-party, consent-aware attribution record (DATA-003). No third-party pixels on creator, proof or cart pages.
2. A promo code field in the cart, a `codes` table (code, partner, percent, start, end, max uses), and discounts applied in `computeTotals()`. **Do not turn on Stripe promotion codes:** the webhook compares Stripe's pre-tax total with our cart total (`lib/shop/orderService.ts`), so a Stripe-side discount would mark every discounted order as an amount mismatch and nothing would print.
3. `partner_id` and `discount_cents` on the order; a monthly payout view (partner, orders, net, clawbacks).
4. An application form and a partner terms page (attorney).

## 9. Outreach

- Contact only through public business paths: the "email" button or business email in the creator's profile, a listed management contact, or a platform creator marketplace. No personal emails found elsewhere, no DMs to private accounts, no scraping.
- No outreach until real art and a physical proof exist (the pitch shows the product).
- First-touch script (one message, one follow-up after 7 days, then stop):

> Hi {first name}, I'm {sender} from GreetHub. We make picture books from a parent's own story and photos, and you approve how everyone looks before we print. I'd love to send you one free, made with your family, for an honest post. If you post, we ask you to say we sent it, and you'd get a code for 10% off for your followers plus 10% on sales. No pressure on what you say. Want the details?

- Shortlist criteria: US audience, 5k-100k followers, engagement checked by hand, no history of undisclosed sponsorships, no franchise-character content as a theme. A list of real creators is not in this repo yet.

## 10. Scale notes

- 10× (about 200 partners): spreadsheet tracking breaks. Need the code table, automated attribution, a payout run with clawbacks, disclosure checks on a schedule, and a release register (who, which post, uses, expiry).
- 100× (about 2,000 partners): an affiliate network or platform (owner decision and cost), fraud rules (self-referral, coupon-site leakage, code sharing on deal sites), tiered commissions, and a part-time partner manager. Content supply then comes mostly from released creator posts, so the release register and takedown path become critical.
