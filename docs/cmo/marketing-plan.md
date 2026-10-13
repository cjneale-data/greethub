# GreetHub marketing plan (launch + first 90 days)

Owner: CMO. Feeds the CFO via `channel-assumptions.csv`. All numbers marked (guess) are my estimates with no measured source; none are quoted from a study. Replace them with measured data after the first 2 weeks of spend.

**Revised 2026-10-12** after the platform assessment (docs/PLAN.md) and the market baseline (docs/market/02, read 2026-10-11): Google CPC re-based to a sourced benchmark, budget mix moved toward creators and SEO, paid spend gated on launch readiness (section 5), proof points cut back to what the build does, US spelling in keywords. Each CSV row now has an `evidence` column.

## 1. Positioning

**One line:** GreetHub makes cards and picture books that sound like you and look like the person they're for, drawn from your story and photos, printed and mailed.

**Category:** custom, personal, mailed. Not e-cards, not template greeting cards, not generic AI art.

**Promise:** "Cards that sound like you." You say it your way, you see it before it prints, nothing is final until you approve.

**Why us (proof points to lead with)**
1. You approve how everyone looks before any page is drawn, and every page is drawn from that approved sheet. Say "approve first", not "perfectly consistent": consistency is unmeasured (model evals, 2026-10-12) and no independent test exists (market/01). No superiority claims against other AI books until a public side-by-side exists.
2. Your words are the story. The customer's own memory and wording lead; AI draws. This answers the 2026 parent backlash against AI books (Futurism 2026-08-04, via market/03).
3. One conversation, then done: the Greet Guide asks only what's missing.
4. Real product, real mail: hardcover books, folded cards, mailed straight to the recipient.
5. Honest: we say the art is AI, and you see the proof first.
6. Private by default: photos deleted after 90 days, never sold. Claim "not used to train models" only after legal confirms zero data retention with each model vendor.

Not a proof point yet: Saved People keeps names and details only. Cards do not use photos, so "Grandma looks like Grandma in every card" is not true; it was removed from the site on 2026-10-12.

**Against:** (do not name competitors in ad copy)
- Mass-market card shops: fast but generic, no story.
- Photo-book builders: you do the layout work, no illustrated story.
- Other AI storybook tools: weaker identity consistency, no mailed greeting-card line (my read; verify before using in claims).

**Voice in market:** warm, plain, first names, a little wry. No "revolutionary", no "AI-powered" as the headline. AI is a feature mentioned in the body and FAQ, not the hook.

**Pricing posture:** the book is the lead product and the gift moment; the card is the free-preview hook and the repeat product. Prices from the CFO. Market read (market/02): the 24pp book at $44.99 all-in sits about $20 under the nearest photo-based rival, so lead with it. The mailed card at $7.99 plus $2.99 postage ($10.98) is $3-6 above incumbents who mail free; no card-only paid ads until the CFO decides on one postage-included price (the market suggests testing $8.99). Do not market the $3.99 digital card or the $19.99 digital book.

## 2. Audience segments

| # | Segment | Who | Trigger | Product | Message | Primary channels |
|---|---|---|---|---|---|---|
| A | Parents and grandparents of young kids | 28-55, kids 2-9 | Birthday, new baby, school starts, bedtime | Book | "A book starring your kid. Real photos in, hardcover out." | Meta/IG, Pinterest, creators |
| B | Grandparent gifters | 55-75, buys for grandkids | Christmas, birthdays, Grandparents' Day | Book, card | "A story starring the grandkids, mailed to their door." | Meta (Facebook feed), Google Search |
| C | Thoughtful card senders | 25-45, send 6+ cards a year | Birthdays, thank-yous, sympathy | Card | "A card that sounds like you, in about ten minutes." | Google, Pinterest, SEO |
| D | Couples | 25-40 | Anniversary, Valentine's, wedding gifts | Card, book | "Your story as a picture book." | Instagram, Pinterest, creators |
| E | Teachers, coaches, small teams | Any | End of year, thanks | Card | "Thanks that doesn't look like a template." | Google, TikTok, SEO |
| F | Sympathy and get-well senders | 35-70 | A death or illness | Card | "Say it gently. We'll help with the words." | SEO, Google (no paid social remarketing on these) |

Launch focus: A, B, C (largest sizes, strongest occasion rhythm). D and E seasonal. F: SEO only and careful tone.

Sensitive-targeting rules: no ad targeting based on kids' photos or health topics; use contextual and interest targeting; no retargeting on sympathy pages.

## 3. Channels

CPC, CTR and conversion numbers are in `channel-assumptions.csv` (all guesses).

### Meta / Instagram (core paid)
- Format: 15-25 second vertical video showing the process (photos in, character sheet, book flip) and static carousels of finished books/cards. Always show the product in hand.
- Creative angles: (1) "Kid + their book" reveal; (2) "Grandma gets the book"; (3) "Card in ten minutes" screen capture; (4) occasion hooks.
- Audience: broad with interest layers; lookalikes from purchasers after 100+ purchases; retargeting guest-preview users and cart abandoners.
- Landing: guest card creator or a book page with sample; UTM per ad set.
- Cadence: 3-5 new creatives a week in a test-and-kill loop; scale winners 20% every 3 days.

### Pinterest
- Evergreen pins for each occasion and for "personalized picture book" ideas; 10 pins per week at launch, link to occasion landing pages (same as SEO pages).
- Promoted pins on the 6 largest occasions; Pinterest is a planning platform, so start spend 6 to 8 weeks before the occasion.

### Google Search
- Start with exact/phrase match on high-intent terms: custom picture book, personalized children's book, personalized picture book, custom birthday card, anniversary book. US spelling only (the launch is US). Negative keywords: free, template, printable, coloring, pdf. Bid only on terms whose landing page shows real sample art.
- Separate campaigns by product, with occasion ad groups. Responsive search ads using the site copy.
- Brand campaign protects the name from day one (small).

### TikTok
- Organic first (founder-led process videos, "AI drew my niece into a book", before/after). Paid via Spark Ads on the winners.
- Low direct conversion expected; used for creative discovery and for reuse of winning hooks on Meta.

### Creators and affiliates
- Micro creators (5k-100k) in parenting, gifting, bookish, grandparent and teacher niches.
- Offer: free book in return for an honest post plus a code; 10% off for their audience and 10% commission (guess; CFO to confirm in the model).
- Contracts must require disclosure, and no photos of children unless the creator is the parent and consents.
- Whitelist best posts for Meta/TikTok ads.

### Occasion SEO
- A landing page for each occasion and each relationship ("birthday card for mom", "new baby book gift"), with a live starter flow, sample templates, message ideas and FAQs. 24 pages in the first 90 days, plus 8 blog guides ("what to write in a sympathy card").
- Internal link from templates and the calendar. Schema: Product, FAQ.
- Expect slow ramp: traffic mostly after day 90 (guess).

### Owned and referral
- Email: welcome series for guests who made a preview (3 emails: your preview, how re-rolls work, occasion reminders). Post-purchase: proof, shipped, delivered, "make another".
- Occasion reminders (later step) are the repeat engine: save a birthday, get a nudge 14 days before.
- Referral (v1.1): "Give a card, get a card."

## 4. Occasion calendar

Print lead times matter: set mailed cut-off dates from the printer data (CTO). Placeholders below use general US dates.

| Month | Occasion | Marketing start | Notes |
|---|---|---|---|
| Jan | New Year, birthdays, thank-you cards after holidays | Dec 26 | Post-holiday "thank-you" push; promos soft |
| Feb | Valentine's Day (Feb 14), Galentine's | Jan 10 | Couples and friends; digital cards for last-minute |
| Mar | International Women's Day, spring birthdays | Feb 20 | Light |
| Apr | Easter, graduation announcements start | Mar 15 | |
| May | Mother's Day (2nd Sun), teacher appreciation, graduation | Apr 1 | One of the two biggest cards peaks; book gifts for moms |
| Jun | Father's Day (3rd Sun), graduation, weddings | May 10 | Dad: funny tone |
| Jul | Summer birthdays, anniversaries | Jun 15 | Quiet; test creatives |
| Aug | Back to school, Grandparents' Day prep | Jul 20 | Teacher and starting-school books |
| Sep | Grandparents' Day (Sun after Labor Day) | Aug 15 | Book gifting from grandkids' parents |
| Oct | Halloween, early holiday | Sep 20 | Light; holiday pre-orders |
| Nov | Thanksgiving, Christmas book gifting | Oct 15 | Book gift-giving ramps; cut-offs early |
| Dec | Christmas, Hanukkah, New Year | Nov 1 | Biggest peak for books; shipping cut-off banners |

Evergreen year-round: birthdays (about 1 in 12 people per month), thank-you, new baby, sympathy, get well, wedding, anniversaries.

## 5. First 90 days

**Assumption:** public launch around early November 2026, subject to the CTO build finishing (the plan's stop condition). If launch slips, shift the whole table and keep the relative order. Updated 2026-10-12.

**Paid-spend gate (added 2026-10-12).** No paid ads, creator seeding or waitlist promise until all of these are true: (1) real art on Home, the 12 template tiles and one fictional sample book (templates.md section 3); (2) the `[PLACEHOLDER]` company text and draft banners are gone from every page; (3) a signed-in card can be approved and added to the cart (card M3b); (4) durable spend caps and Turnstile are live (SEC-07, SEC-10, SEC-13), because every ad click can trigger a paid guest preview; (5) server-side purchase events and UTM capture work (DATA-002/003/004); (6) the printer's holiday cut-off dates are known. Until then: organic only (founder posts, SEO pages drafted, Pinterest boards built). If the gate is not met by about Nov 20, skip paid holiday acquisition and start paid in January for Valentine's. A missed Christmas delivery costs more trust than the sales are worth.

### Pre-launch (weeks -4 to 0)
- Build the waitlist page ("Be first to make a book"), promise 1 free card preview on launch (cost: guest preview render, in CFO model).
- Produce 12 template covers and one fictional sample book (no real families; standing rule 5). Spec in templates.md section 3.
- Seed 20 creators with the product (free books) and capture their content.
- Set up first-party analytics and UTM capture (Head of Data collector), then server-side purchase events to Meta, Google and Pinterest. Ad pixels only on marketing pages, with consent; none on creator, photo, proof or cart pages.
- Write and schedule 10 organic pins, 10 TikToks, 4 emails.
- Outputs: 300 to 500 waitlist (guess, not a commitment).

### Days 1-30 (Nov): learn and prove
- Spend: lowest tier of the table below. Meta test: 12 creatives x 3 audiences. Google brand + 15 exact keywords. Pinterest: 6 holiday boards.
- Launch email to waitlist, a small founder post.
- Holiday push: "Christmas book, ordered by {cut-off date}" banner, with the printer's real cut-off.
- KPIs: guest preview rate (visitors who start the creator) >= 15% (guess), preview-to-sign-up >= 20%, sign-up to purchase >= 10%.
- Decision at day 30: kill creatives below 50% of median CTR; keep top 2 channels by CAC.

### Days 31-60 (Dec): scale the winners
- Shift 60% of paid to the best two channels by CAC. Retargeting live on guest previews and cart abandoners.
- First 12 SEO occasion pages live; 6 more published.
- Creators: first 8 posts live; whitelist the top 3.
- Gift-card / "send it digitally" last-minute push in the final week before Christmas.
- Day 60 check: blended CAC vs first-order contribution margin from the CFO. If CAC is over 2x first-order margin on cards, shift mix toward books and reduce card-only paid ads.

### Days 61-90 (Jan-Feb): retain and prepare Valentine's
- Post-holiday thank-you push, then Valentine's (start Jan 10).
- Email: reminders for saved birthdays; "make another" to buyers 30 days after delivery.
- Review: top 5 pages by revenue; drop bottom channels; set Q2 plan around Mother's Day (start April 1).
- Day 90 deliverable to the CEO and CFO: a one-page report with actual vs assumed CPC, CTR, conversion, CAC by channel, to be dropped into the CSV.

### Weekly rhythm
Mon creative review; Tue new ads live; Wed SEO page publish; Thu creator check-in; Fri report to CFO sheet.

## 6. Budget split

Base monthly spend, USD (guess; set by me for a bootstrap launch; the CFO can scale). Month 1 is 4,500, month 2 is 6,500, month 3 is 8,500. 90-day total 19,500. Mix revised 2026-10-12: Google cut after the CPC re-base, TikTok cut (highest CAC), creators and SEO raised. Month 1 starts only once the paid-spend gate in section 5 is met.

| Channel | % of paid | Steady monthly (base) | Month 1 | Month 2 | Month 3 | 90-day |
|---|---|---|---|---|---|---|
| Meta / Instagram | 31% | 2,000 | 1,400 | 2,000 | 2,600 | 6,000 |
| Creators / affiliate | 22% | 1,400 | 1,000 | 1,400 | 1,800 | 4,200 |
| Occasion SEO / content | 18% | 1,200 | 850 | 1,200 | 1,550 | 3,600 |
| Google Search | 12% | 800 | 550 | 800 | 1,050 | 2,400 |
| Pinterest | 12% | 800 | 500 | 800 | 1,100 | 2,400 |
| TikTok | 5% | 300 | 200 | 300 | 400 | 900 |
| **Total** | 100% | **6,500** | **4,500** | **6,500** | **8,500** | **19,500** |

(Rows sum: month 1 1,400+1,000+850+550+500+200 = 4,500; month 2 6,500; month 3 2,600+1,800+1,550+1,050+1,100+400 = 8,500.)

Not in this table (CFO owns): print and fulfilment, token costs, tools. Creator product costs (free books) are COGS but should be counted in the creator line when modelling; I budgeted fee-equivalent in the 1,000.

## 7. Expected funnel and honest caveats

- Using the CSV base values (2026-10-12), channel CAC is about 33 USD for SEO (from month 4), 61 Pinterest, 87 Meta, 94 creators, 167 TikTok and 230 Google (sourced CPC, guessed conversion), calculated as cpc / (visitor to sign-up x sign-up to purchase). Spreading the 6,500 steady budget by those CACs buys about 92 customers a month, a blended CAC of about 70 USD (guess-on-guess; the CFO should recompute from the CSV). With the old mix, the Google re-base alone would have lifted blended CAC to about 87.
- Blended first-order contribution is about $15 (market/02, from the CFO model). No paid channel pays back on the first order. Paid spend is a measurement budget until repeat rate and book share are measured.
- A single card at a modest price will not pay back at that CAC. Paid acquisition works only if (a) buyers add a book or multiple cards, (b) repeat rate is meaningful (occasion reminders), or (c) organic and creator share grows. The CFO's Scenarios sheet should test: average order value, repeat purchases within 12 months, and the share of buyers from SEO and referral.
- Practical consequence: lead paid ads with the book (higher order value), and use the card as the free preview hook and repeat product.
- All of these will change by an order of magnitude with real creative. Treat the first 30 days as measurement.

## 8. Tracking and reporting

- Events: those in `ux-spec.md` section 12, with `utm_source`, `utm_medium`, `utm_campaign`, `channel` stored on the user at sign-up (first-touch) and on the order (last-touch).
- Weekly dashboard: spend, clicks, CPC, CTR, guest previews, sign-ups, purchases, AOV, CAC by channel, re-roll usage, refunds/reprints.
- Privacy: consent banner for ad pixels; no third-party pixel on creator, photo, proof, cart or checkout pages (Head of Data rule); server-side events only for purchase, with no names, photos or brief text. Today the app emits 4 of 95 planned events and has no UTM capture, so this report cannot be produced yet (PLAN.md, Head of Data, 2026-10-12).

## 9. Risks (marketing)

- Platform ad policy on "AI-generated images of children": plan creatives around finished products and adults' hands; check each platform's current policy before spend (not verified).
- Seasonality: Nov-Dec dominates; launch in Nov means reduced learning time before the peak. Start tests in October if possible with the waitlist.
- Printer cut-offs decide holiday messaging; do not advertise delivery dates that the CTO cannot hold.
- Character likeness complaints: lead with the approval step in ads and copy.
- AI-book backlash: summer 2026 coverage of grandparents gifting AI books (market/03). Grandparents are segment B. Lead with "your words, your approval, private photos", label the art as AI plainly, and use the cover label legal approves.
- Product format: one unverified source says Lulu hardcovers need 40 pages minimum (market/02). If the 24pp hardcover does not exist, every "24 or 32 pages" line in copy and ads changes. Confirm before producing creative.
- Promotions are everywhere (BOGO, 25-50% off, market/02). Plan one first-order offer with the CFO; never show fake "was" prices.

## 10. At 10x and 100x spend

**10x (about $65k a month, roughly 900 customers a month at today's guessed CAC):**
- CAC rises with spend: assume 1.3-1.6x on Meta and Google once the cheapest audiences are used (guess). Budget by marginal CAC per channel, not blended.
- Creative volume becomes the constraint: 20-30 new ads a week. That needs a fixed asset kit (approved fictional families, product-in-hand photos, real proof pages) and a brand review checklist; creators supply most of it under a whitelisting contract.
- Measurement: geo or audience holdouts to test incrementality, plus the first-party collector and server-side conversions. Without them, 10x spend is unmanaged.
- Guest previews scale with clicks, not orders (about $0.05-0.07 each, CTO). Durable caps and Turnstile are a precondition.
- Brand: register the trademark before scaling (legal), collect consented reviews from the first 500 orders, and publish a public gallery of about 50 fictional samples.

**100x (about $650k a month):**
- Search and social saturate for a niche product. Add YouTube or CTV, podcasts, gift-guide PR and retail, and treat occasion reminders as a channel of their own. Use a media-mix model.
- December carries most book demand: printer capacity, support staffing (CX) and image-model rate limits (CTO) cap what spend can buy. Agree a printer capacity plan before committing Q4 budget.
- Brand system: a full guideline for partners and agencies (voice, art direction, AI labelling, children's-photo rules), a template library of about 120 (Design scale plan), and localized copy if the US-only scope widens.

