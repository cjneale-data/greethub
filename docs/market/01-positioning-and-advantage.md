# 01. Positioning and advantage: where GreetHub can honestly win

Owner: Head of Market Intelligence. 2026-10-11. Facts and URLs live in `00-landscape.md`; this file cites it as "00" and only adds new sources where needed. Tags: [V] primary page read, [S] secondary, [U] unverified or my arithmetic/judgement.

**Corrections 2026-10-12** (after the platform assessment in `docs/PLAN.md`): (1) Saved People is not built as described: it stores names only and cards take no photos, so "one likeness across cards and books" is a plan, not a product; the row below is downgraded. (2) Lulu accepts 24-page casewrap hardcovers (Casewrap: 24-800 pages [V] https://help.lulu.com/en/support/solutions/articles/64000255583, read 2026-10-12); the 40-page figure is Lulu's perfect-bound minimum. (3) Fit is tested by interviews plus the first paid cohort, not a 20-30-session usability round (`docs/research/README.md`). (4) Re-rolls are 3 page redraws plus 2 free sheet redos per book, not a monthly allowance.

## Bottom line

GreetHub has a real but narrow edge in the **book** line: a gift buyer who wants a recognisable likeness, a visible approval step, and a lower all-in price than the nearest photo-based competitor. It has **no proven edge in cards** as a standalone product. It is entering a category that now has a public "AI slop" backlash, a free Google substitute, and at least one strong incumbent at the same format. Today it has no real artwork to show, so every claim below is a claim about the design, not about results.

## 1. Advantages tested against what competitors actually offer

| Claimed advantage (CMO plan) | What competitors offer (evidence in 00) | Verdict |
|---|---|---|
| Approved character sheet before pages render | Imagitime shows a whole-book preview in about 2 minutes before you pay [V]; ToonyStory, SkazkaAI, Magic Story offer free previews [V]/[S]; ToonyStory says each character is "locked" [V, self-reported] | **Weak as a differentiator.** Preview-before-pay is table stakes. The unique part is the explicit approval gate on the identity sheet, tied to the refund policy. Say "you approve the character before we draw 13 pages", not "we are the only ones". Unproven until we have real output. |
| Consistent characters from photos | ToonyStory claims 9.5/10 in its own benchmark; Childbook.ai hedges; Gemini rated "weak" by a rival blog [V]/[S]; no independent test found | **Plausible, unproven.** The only way to win this claim is a public side-by-side with real pages. Do not claim superiority in ads (CMO plan already says verify). |
| Chat-guided brief | Gemini is chat-based and free [V]; print makers use forms; Cardwise has an AI Card Maker driven by a description of the recipient [V] | **Mild.** Better than form-fillers, equal to Gemini on input, but Gemini cannot print. Value is in the end-to-end product, not the chat. |
| Saved People across cards and books | Cardwise remembers relationships and dates and generates AI cards [V]; Postable keeps an address book and occasions [V]; no competitor found that reuses one illustrated likeness across cards **and** books [U] | **Strongest structural idea, but not built (2026-10-12).** Saved People holds names only and cards take no photos, so today Cardwise's relationship memory is roughly equal to ours. Do not claim it in copy until a saved character sheet is reused in a card. Retention lever, not acquisition. |
| Family-story depth (user's own details) | Template makers personalise name and traits only (Wonderbly, I See Me [V]); AI makers take a prompt. NC State: parents are uncomfortable with AI-written text; accept AI images with human-authored text [V, n=13 pairs] | **Potentially strong if the user's own words drive the story.** Risk: the story text is model-written. Reframe as "your words, our drawing." See move 4. |
| Price | Imagitime hardcover $54.99 + $9.99 = $64.98 all-in [V]; GreetHub 24pp $39 + $5.99 = $44.99, 32pp $54.99 [plan]. Hooray Heroes $39.99 sale + shipping [V]. Wonderbly about $45 + about $5 [S]. | **Honest edge vs Imagitime (about $20), parity with the template makers, not cheapest.** Cheaper options exist digitally (see 02). |
| Honest AI labelling | NC State: parents prefer a cover label; backlash is about hidden AI and photo handling [V] | **Real and timely.** Few competitors say it up front (Hooray Heroes says "no AI" instead [V]). A 90-day photo purge beats Imagitime's 12-month saved-image retention [V]. |
| Real mail, real print | Everyone prints; Wonderbly has holiday delivery complaints [S] | Parity. Becomes an advantage only if on-time delivery is evidenced. |

## 2. Disadvantages (what we cannot honestly claim)

1. **Brand trust.** Competitors carry large review stocks: Wonderbly about 84,000, Hooray Heroes about 7,500, Imagitime about 4,000 on Trustpilot [S]. GreetHub has zero. Buyers hand over a child's photo and $45-$65.
2. **No real art yet.** CX finding F-01 (S1): striped placeholders everywhere (`docs/cx/00-assessment.md`). A photo-based product with no gallery cannot compete with Imagitime's two-minute preview.
3. **Adult-only and legal limits.** Gemini API/OpenRouter terms are 18+; Lulu requires parent consent and human review of AI content; BIPA/state-law exposure on children's photos (`docs/legal/00-summary.md`). Competitors operate under similar rules but carry them with scale and lawyers. The legal controls slow the funnel (two consent boxes) where Imagitime shows a preview in two minutes.
4. **Unit economics.** Blended contribution about $15.20 per order; paid CAC about $76 in the CFO model (`finance/README.md`). My benchmark check in 02 suggests Google CAC is understated by roughly 2.6x.
5. **Print quality unproven.** 2K renders are about 234 DPI at book size (`finance/README.md`); no physical proof ordered. Lulu 24pp hardcover is confirmed (Casewrap: 24-800 pages [V], read 2026-10-12, URL in the corrections note); per one user forum post Lulu adds a blank page at each end of a hardcover [S], so check the page plan in the sandbox.
6. **Delivery promise.** Competitor times: Imagitime 8-13 days [V], Wonderbly about 11 days [S], ToonyStory 3-5 days (vendor) [V]. We have no printer-backed estimate (CX F-04).
7. **Cards are a commodity.** Hallmark mails a personalised card free via Sign & Send [V]; Moonpig advertises free shipping [V]; Postable's postage is 82c [V]. Our $2.99 postage is the highest friction in the card line.
8. **Backlash exposure.** Wired/Futurism 2026 framed AI personalised books from grandparents as "slop"; a parent said kids were "bored" [V Futurism]. Our core buyer segment B (grandparents) is exactly the named target of that coverage.

## 3. Defensibility

**Moat: low.** The pipeline (Gemini image models via OpenRouter, locked identity sheet, Lulu/Prodigi print) is available to anyone; at least a dozen entrants already do photo-to-book (00 Part A5). Google ships a free 10-page version and could add print or ordering at any time [S]. A rival can copy the approval gate in a sprint.

Candidates for a durable advantage, in order of plausibility:
1. **Saved People plus occasion reminders** (data and habit): each saved person and date raises switching cost. Needs volume and repeat purchase to matter; the CFO model assumes repeat but it is a guess.
2. **Trust assets**: reviews, real galleries, a proof-quality guarantee, and the privacy posture. Slow to build, hard to copy quickly.
3. **Occasion SEO and content**: slow (traffic mostly after day 90 per the CMO plan), but compounding.
4. **Cross-product family system** (cards + books with the same characters): nobody else found; copyable in months.
Time-limited lead: treat any advantage as a 6-12 month head start [U].

## 4. Market-fit assessment

### Segments and jobs-to-be-done
| Segment (CMO letters) | Job | Evidence it exists | Fit |
|---|---|---|---|
| A/B parents and grandparents of ages 2-9, gift occasion | "Give a keepsake that looks like my kid/grandkid" | Wonderbly 11M+ books sold [S]; Hooray Heroes 3M+ since 2013 [V]; Imagitime claims 300,000+ customers (self-reported) [V]; Wired says grandparents are a visible AI-book buyer [S] | Strongest. Also the most exposed to backlash and price discounting. |
| C thoughtful card senders | "Say it my way, mailed, without hassle" | US card market $7-8B, 6.5B cards, mostly $2-$4 (GCA via USPS, about 2019) [S]; new AI card apps (Cardwise, AI Postcard, Escargot) [V]/[S] | Weak for standalone $10.98 cards. Better as an add-on to the book buyer. |
| D couples, E teachers, F sympathy | seasonal | no evidence gathered | Unproven; keep SEO-only per the CMO plan. |

### Willingness to pay (evidence, not assumption)
- Realised prices cluster at **$30-$55 for a printed personalised book**: Wonderbly "from" $29.99-$39.99 [V], I See Me $29.99-$34.99 [V], Hooray Heroes $39.99 [V], Imagitime $54.99 plus $9.99 shipping [V], Etsy typical $45-$60 [S].
- **List prices are inflated by permanent discounting**: Hooray Heroes $59.99 shown at $39.99; Etsy "sale from $54.99 to $27.49"; Wonderbly BOGO50 and EARLY25-style codes everywhere (00). So the true ceiling for a unique AI-photo book is nearer $40-$55 than $60-$70. SkazkaAI's $69.90 hardcover is a vendor-blog figure with no sales evidence [S].
- **Digital is priced near zero**: Gemini free; AI generators $2.50-$15 per book or $10-$20 per month [V]/[S]. GreetHub's $19.99 digital book has no support in this evidence.
- Cards: $4-$7 retail for premium, $6.99 for a mailed AI card at Cardwise [V]. GreetHub $10.98 mailed has no support.
- Direct evidence of WTP for **GreetHub's** product: none. No survey or test has been run.

### Size estimates (ranges; all weak)
- US greeting cards: $7-8B, about 6.5B cards (about 2019 GCA via USPS) [S]; Moonpig Group cards revenue growing +9.4% to GBP 203.5m in FY26 [S]. The personalised/mailed/photo-illustrated slice: not found.
- Global personalised children's books: $0.70B (MarketReportsWorld, 2026) to $1.2B (Market Intelo, toddlers only, 2025); $0.73B (Business Research Insights) [S, low quality: sources conflict, scope differs]. If the US is 30-40% [U], the US pool is about $0.2-0.5B [U].
- Cumulative sales as a cross-check [U arithmetic]: Hooray Heroes 3M books x about $40 = about $120M over 13 years; Wonderbly 11M x about $30 = about $330M cumulative.
- **Implication:** the market is large enough. The CFO model's Year 1 at the CMO budget is 1,895 orders (`finance/README.md`), a rounding error against even the low end. Market size is not the constraint; **acquisition cost and trust are**.

### What would prove or disprove fit
| Test | Pass | Fail |
|---|---|---|
| 5-8 assumption interviews now (`docs/research/06`), then likeness and WTP from the first 100 paid books (sheet redo reasons, proof rating, art CSAT); usability round 1 finds problems, it does not prove fit | 60%+ say the likeness is right on first or second try; 40%+ say they would pay $39-$55 | Likeness complaints on >40%; WTP below $30 |
| Guest card preview to sign-up rate | >=7% (CMO assumption) | <3% |
| Book start to paid rate, organic traffic | >=14% sign-up to purchase (CMO assumption) | <5% |
| First 200 paid orders: reprint/refund rate | <8% | >15% (CFO allowance is a guess) |
| Physical proof of 24pp book | Passes our own and 5 outside readers' review; Lulu accepts 24pp | Print defects, page-minimum rejection |
| Paid CAC after 2 weeks of spend | <= $45 on books | >$76 sustained (does not pay back at $15.20 contribution) |
| Repeat within 6 months | >=15% | <5% |
| Post-launch parent sentiment (reviews, social) | No "AI slop" thread about GreetHub | Visible backlash tied to our disclosure or privacy |

### Verdict
**Provisional, conditional fit in books via gift-givers; no fit shown for cards as a standalone; low-to-moderate confidence (about 35-40%) [U judgement].** Demand for the category is real and large. GreetHub's differentiators are mostly copyable or unproven. The product is credible only after real art and a physical proof exist.

## 5. Ranked recommended moves

1. **Do not launch until the S1 trust gaps close** (real artwork, real legal pages, real delivery estimate; CX F-01 to F-05). Add a public gallery with 12 real samples. Owner: CX/CMO/CTO. Highest value, blocks everything.
2. **Order two physical proofs and two competitor books now** (24pp GreetHub, Imagitime hardcover, Wonderbly, one Etsy AI book; about $200 total [U]) to judge print and likeness against the nearest rival. (Lulu 24pp availability confirmed 2026-10-12.)
3. **Lead with the book as the gift product, the grandparent/parent buyer, and a fixed "arrives by" date** that beats or matches the 8-13 day norm. Cards become the add-on and repeat vehicle (Saved People, once it reuses a likeness; not built as of 2026-10-12).
4. **Make the customer's own words the story spine** and label the cover "AI-illustrated, story from your details" (or similar). This answers the NC State finding (text discomfort) and the Wired framing. Legal to approve the exact label.
5. **Fix card pricing and postage presentation** (see 02): show "mailed for you, postage included" at a single price in the $8.99-$9.99 band, or test it; incumbents mail free.
6. **Reposition or reprice the digital book** (bundle free with printed, or $9.99 or lower); $19.99 is out of line (see 02).
7. **Use the privacy advantage in copy**: 90-day purge, vendors named, no training claim only if ZDR is verified (legal item 3). Contrast with competitors only by stating our own facts, not by naming them.
8. **Do not scale paid spend until Google CPC is re-based** (benchmarks suggest about $4 not $1.60) and CAC is measured; start with organic, creators, and referral (CFO model breaks even at no paid spend by month 7).
9. **Plan holiday cut-offs from printer data**; competitors' holiday delivery failures are the top 1-star theme (Wonderbly) and an opening if we are honest and early.
10. **Run the monthly competitor report** (files 03/04) and recheck: Imagitime price/shipping, Gemini print ordering, any Cardwise-style cross-product entrant.
