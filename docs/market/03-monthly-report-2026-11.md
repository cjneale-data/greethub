# Monthly competitive report: November 2026

Prepared by: Head of Market Intelligence. Period: 2026-10-12 to 2026-11-02, plus 2026 events found in this pass that the October baseline missed. Read date for all sources: 2026-11-02 unless shown. Prior report: `docs/market/03-monthly-report-2026-10.md`. Tags: [V] I fetched the primary page (the fetch tool summarises pages, so recheck exact wording before quoting in ads); [S] secondary source, competitor blog or search snippet; [U] unverified, owner-supplied or my own arithmetic. "Not found" means I looked and could not find it. Scorecard rows: `docs/market/scorecard.csv`, month `2026-11`.

**Context from the owner (2026-11-02, [U] to me):** the site is live at its production URL. No print vendor is selected. Candidates: Lulu (books), Gooten (folded 5x7, US, $1.85 + shipping from $4.99), Prodigi (US self-send SKUs GLOBAL-GRE-MOH-7X5-BLA and GLOBAL-GRE-GLOS-7X5-BLA; its Mail4Me direct-to-recipient service is UK-only), and Thanks.io and Handwrytten as possible mail-for-me routes. A Ready Cards line exists on branch `stock-templates` at the CFO's proposed $3.49 digital and $7.49 mailed + $2.99 postage ($10.48 all-in), set in `app/packages/shared/src/pricing.ts` on that branch. Prices are not approved. `docs/PLAN.md` recommends an invite-only Christmas soft launch (about 50 orders, no paid ads), a Nov 13 books go/no-go and a Nov 20 cards go/no-go.

## 1. Executive summary

1. **GreetHub's AI card is now behind the market, not just pricier.** Two small US services already turn a photo of the recipient into an illustrated, mailed card: **AI Cards** at $9.99 shipped, mailed within one business day [V], and **Pigeon Post** at $1.78 a card + $19.99 a year, first card free, 8 styles, USPS [V]. GreetHub's AI card takes no photo and costs $10.98 all-in.
2. **The two candidate mailing vendors are also competitors.** Handwrytten sells to consumers (plans $100-$382 a month) and Thanks.io sells mailed notecards from $3.04 with postage [V]. Both already offer an API and an MCP connector for Claude and other assistants [V]. That is the channel GreetHub's agent plan expects to open in 2027. Using them puts GreetHub's customer and recipient data with a company that sells the same thing.
3. **Mailed-card price floor fell.** $1.78-$4.57 all-in is now common: Pigeon Post $1.78 [V], ShipNote $1.99 [S, own blog], CardCrafter Suite via SendOutCards about $2.24 on subscription or about $4.00 pay-as-you-go [V], Thanks.io $3.04 [V], Handwrytten about $4.57 [S]. Ready Cards at $10.48 sit above all of them and above Hallmark's free Sign & Send.
4. **Book competitors did not move.** Imagitime is unchanged at $54.99 + $9.99, 8-13 days, Trustpilot 4.8 on about 3,640 [V]/[S]. It added FREESHIP for repeat orders [V]. Hooray Heroes still shows $59.99 list at $39.99 [V]. GreetHub's 24pp book stays about $20 under Imagitime all-in.
5. **The cross-product gap is still open.** I found no competitor that reuses one illustrated likeness across cards **and** books (section 3 lists the searches). It is still unbuilt at GreetHub too.
6. **The backlash has a name: "grandmaslop"** (TechRadar via Gadget Review, 2026-09-22 [S]). The coverage extends the July-August story to Gemini, Claude and ChatGPT DIY books, and the objections are privacy and "a book instead of a visit".
7. **Resolved:** Punkpost closed on 2024-07-30, not in 2026 [S]. Greetly does **not** mail cards; it is digital-only [V]. Cardwise is unchanged at $6.99 [V]. No Gemini Storybook print ordering found [S]. Confidence: moderate on prices (mostly primary pages), low on traffic and sales (still no ad or traffic tools).

## 2. What changed since last month

Only changes against the 2026-10 scorecard rows, plus 2026 events that the October baseline missed (marked "missed in Oct").

| Date | Competitor | Event | Source URL | Tag |
|---|---|---|---|---|
| 2026-05-20 (missed in Oct) | Greetly | Launch PR: AI-personalized **digital** cards, 1,000+ designs or own photo, "Genie" assistant, voice notes, group cards; founder Marc Schonberger | https://usanews.com/newsroom/greetly-reinvents-the-greeting-card-experience | [S] |
| 2026 (undated) | Greetly | Evergreen Awards "Best AI Powered Greeting Card Platform in the United States of 2026"; the page describes digital delivery by text or email only. How the award is judged and whether it costs a fee: not found | https://evergreenawards.com/awards/greetly-best-ai-powered-greeting-card-platform-in-the-united-states-of-2026 | [V] |
| 2026-07-01 (missed in Oct) | CardCrafter Suite (Sawatch Solutions LLC, Dayton OH) | Launch: AI image generators (3 styles), AI message writer, one-click hand-off to SendOutCards to print and mail | https://cms.sawatchsolutions.com/2026/07/01/introducing-cardcrafter-suite/ | [V] |
| 2026 (undated, "(c) 2026") | AI Cards (aicards.co) | Recipient photo turned into an illustrated card, $9.99 shipped, mailed within one business day | https://aicards.co/ | [V] |
| 2026 (undated) | Pigeon Post LLC (Atlanta) | Photo to illustrated card in 8 styles, $1.78 per card sent with a $19.99 a year membership, first card free, USPS First-Class | https://app.pigeon-post.ai/ | [V] |
| 2026-09-16 | birthday-cards.ai (competitor blog) | Builder switched its card tool to a newer OpenAI image model; page lists CardCrafter, ExpressWithACard, Kudoboard and says Hallmark has no AI card generator | https://www.birthday-cards.ai/ai-birthday-card-apps-to-watch | [S, competitor] |
| 2026-09-22 | Category | "Grandmaslop" coverage: grandparents making AI storybooks with Gemini, Claude, ChatGPT; parents object on privacy, fake-looking events, and "a book instead of a visit" | https://www.gadgetreview.com/grandmaslop-grandparents-are-making-ai-storybooks-of-their-grandkids-and-parents-hate-it | [S] |
| by 2026-11-02 | Imagitime | New code FREESHIP: free shipping from the second order (not seen 2026-10-11). Prices unchanged | https://www.imagitime.com/ | [V] |
| by 2026-11-02 | Hooray Heroes | Migration banner no longer seen; non-US store links are placeholders; "personalized cards" link in navigation (details not found, page returned 429) | https://www.hoorayheroes.com/ | [V] |
| 2024-07-30 (correction) | Punkpost | Closed 2024-07-30 after nine years; domain re-registered by a third party in May 2025 | https://www.shipnote.co/blog/postable-alternatives | [S, competitor blog] |

Unchanged (in the scorecard, not repeated here): Imagitime prices, shipping, delivery days and retention; Hooray Heroes prices; Cardwise $6.99 physical and $6.99 a month Gold; Gemini Storybook (no print ordering). Not rechecked this month: Wonderbly, I See Me, Moonpig, Postable's own page, Shutterfly, ToonyStory, Childbook.ai, Magic Story. They roll to December.

## 3. Competitor moves, launches, pricing, and the five new profiles

### 3.1 CardCrafter Suite (Sawatch Solutions) and SendOutCards
- **What:** AI card design studio launched 2026-07-01: three image generators (illustrative, photoreal, brand), an image editor ("fine-tune your image, or a personal photo"), and a message writer; printing and mailing go through SendOutCards, which needs a separate account [V] https://cardcraftersuite.com/home ; [V] launch post above.
- **Price:** $11.97 a month, unlimited designs. Mailed card about $2.24 with postage on a SendOutCards subscription, or about $4.00 pay-as-you-go [V, CardCrafter's own FAQ quoting SendOutCards]. The launch post also mentions bundles at "65 per month" (currency symbol missing on the page) [V, unclear].
- **Likeness:** no photo-to-illustration claim found [V]. Formats and sizes: not found.
- **SendOutCards itself:** does not publish prices; G2 says to contact the vendor [S] https://www.g2.com/products/sendoutcards/pricing . Its own home page returned only a title to the fetch tool and /pricing/ returned 404. Older forum posts give $0.62-$1.98 a card [S, undated, not used]. It runs an affiliate (distributor) plan [S] https://brigada.org/?p=17907 . A third-party review aggregator rates it 4.0 on 702 reviews (updated 2026-05-20) [S, AI-generated site] https://marlvel.ai/apps/sendoutcards . **Reading:** CardCrafter is a thin design layer on a 20-year-old mail network. It shows that "AI design + somebody else mails it" can be built by a small LLC and sold at $2-$4 a card. It is the same architecture GreetHub would have with Thanks.io or Handwrytten.

### 3.2 Silly Robot Cards (sillyrobotcards.com)
- Operated by Gleeboard Ltd (UK signals: UK Trustpilot link) [V] https://www.sillyrobotcards.com/ . AI cards from a photo and recipient details, including "birthday face swap" templates [V]. Printed cards "from $4.99", delivery extra, shown at checkout; eCards from $0.99 [V] https://www.sillyrobotcards.com/stained-glass-easter-cards . "Printed in North America", US and Canada delivery [V]. Mails to the recipient or to you [V]. Trustpilot 4.4 (site display, count not shown) [V]. A "3 cards for $10" banner appears in search titles [S] but not on the fetched page. Directory listings give conflicting prices ($1.45 and $4.50) [S, not used] and say uploaded images are deleted after 30 days [S, unverified].
- **Watch:** some of its public, indexable card pages use franchise names in their URLs (for example a "harrypotter ... hogwarts" birthday card and a "magicthegathering" one in search results) [S]. GreetHub's IP rules (`docs/legal/07-ip-safety-design.md`) forbid that. Do not copy its SEO pattern.

### 3.3 Greetly (gogreetly.com)
- Evergreen Awards 2026 "Best AI Powered Greeting Card Platform in the United States" [V]. **Does it mail? No.** The award page says cards are sent by text or email, instantly or scheduled, with "no postage" [V]. The May 2026 release calls it entirely digital [S]. AI assistant "Genie" restyles images and rewrites messages; users can upload a photo and the page claims it "preserves real facial expressions" [V]. Price not found (the site body was empty to the fetch tool); the release claims it costs less than a $6-$9 store card [S]. I found no independent coverage of the award, and the award page shows a "Nominate Now" link but no judging method [V]. Treat the award as marketing, not evidence of share.
- **Relevance:** competes with GreetHub's $3.99 digital card and $3.49 digital Ready Card, not with mailed cards.

### 3.4 Thanks.io (separated from the October grouped row)
- **Focus:** business and marketing direct mail (real estate, agencies, non-profits) [V] https://www.thanks.io/pricing .
- **Price, postage included (US):** folded notecard $3.04 pay-as-you-go, $1.83 on Business ($49 a month), $1.49 on Professional ($199 a month); 4x6 postcard $1.18 / $0.77 / $0.64 [V]. "Every per-piece price covers printing, handwriting, the physical mail piece, and postage" [V]. First Class upgrade +$0.21 on non-postcard items [V].
- **Folded format:** one folded product, the notecard, 5.5 x 8.5 in, landscape when folded, panels about 5.5 x 4.25 in; front is your design; inside is a handwriting-style font; real stamp; envelope colour fixed [V] https://help.thanks.io/sending-mail/mailer-types/notecards . **A folded 5x7 portrait card: not found.** GreetHub's 5x7 portrait layout would need a new layout for this vendor.
- **API and AI:** API and a hosted MCP server (38+ tools) on all plans; AI design studio, per-recipient AI messages, AI "house effects" on Street View photos, data products (Lead Feed at $0.10 a lead; QR scans can append email or phone to a recipient record at $0.20 a lookup) [V] pricing page; [S] https://help.thanks.io/qr-and-tracking/qr-overview/ .
- **Data-use concern:** the privacy policy (per search summary) allows sharing with "affiliates and business partners", and the terms put responsibility for recipient data on the customer [S] https://www.thanks.io/privacy ; https://www.thanks.io/terms . Its business includes lead and data-enrichment products. I could not read the policy in full; /privacy-policy returned 404.

### 3.5 Handwrytten (separated from the October grouped row)
- **Focus:** both. Consumer plans: Silver $100 a month (24 cards), Gold $200 (50), Platinum $382 (100); business plans Pro $449 a month ($1.99 a card) to Agency $2,499 ($1.19) [V] https://www.handwrytten.com/pricing/ .
- **Price:** "Cards retail at $3.75 ... Postage extra" at the USPS rate [V]; about $4.57 mailed with an 82c stamp [S, ShipNote competitor blog].
- **Formats:** "design your own" cards in flat 5x7 or folded A2 (4.25 x 5.5), portrait or landscape, full-colour front uploaded as JPEG or PNG at 300 PPI, CMYK [V] https://handwrytten.helpscoutdocs.com/article/29-past-custom-cards . **Folded 5x7: not found.**
- **API and AI:** API, CRM integrations (Salesforce, HubSpot, Shopify, Zapier), mobile apps, "use our AI to perfect your message", and a Claude MCP connector [V] https://www.handwrytten.com/ .
- **Data use:** privacy policy says it does not sell personal data and does not share order data, recipient addresses or message content "with third parties for their own marketing purposes"; it uses Google Analytics and HubSpot for its own analytics and marketing; it has DPAs with sub-processors; AI training is not mentioned [V] https://www.handwrytten.com/privacy-policy/ . The policy does not cover data it processes as a processor for customers, so GreetHub would need a separate DPA.

### 3.6 Channel conflict if Thanks.io or Handwrytten mail GreetHub cards (research, not legal advice)
1. **They sell the same job to the same people.** A GreetHub customer's card arrives in an envelope from a company with its own consumer app and its own assistant connector. A recipient who likes the card can look up the sender service.
2. **Recipient data goes to a rival.** Each mailed order gives the vendor a recipient name and address and the message text. Handwrytten's policy limits third-party marketing use [V]; Thanks.io's policy text I could not read in full, and its business includes lead and data products [V]/[S]. Neither has been asked whether it uses customer orders for its own marketing, analytics or model training.
3. **Format mismatch.** Neither showed a folded 5x7 [V]. Thanks.io prints a handwriting font inside, not GreetHub's layout; Handwrytten's custom cards are flat 5x7 or folded A2. GreetHub's card would change shape.
4. **Agent channel overlap.** Both already expose MCP tools that let an assistant send a card [V]. GreetHub's 2027 agent plan (`docs/PLAN.md`, B15.11) would enter a channel where the mailing vendor is already listed.
5. **Kids' photos.** GreetHub AI cards take no photos today and Ready Cards have none, so no child photo would go to these vendors. Keep it that way: no photo cards through them unless the attorney clears it.
**Ask for each vendor before choosing:** a signed DPA; written answers on own-use of order data, model training, retention and deletion; whether GreetHub's brand can be on the envelope; and whether a 5x7 folded portrait card is possible. Owner and attorney decide.

### 3.7 Other new card entrants found
| Name | Offer | Source / tag |
|---|---|---|
| AI Cards (aicards.co) | Recipient photo turned into an illustrated scene; $9.99 shipped; mailed within one business day; reviews, company, size and privacy terms not shown | https://aicards.co/ [V] |
| Pigeon Post (Atlanta) | $1.78 per card sent with a $19.99 a year membership, first card free; "custom illustrated from your photo, never a template"; 8 styles; USPS First-Class 3-5 business days; schedule a date | https://app.pigeon-post.ai/ [V] |
| ShipNote | $1.99 per card on 10+, postage included (own claim) | https://www.shipnote.co/blog/postable-alternatives [S, own blog] |
| MakeACard.ai | Upload 1-5 photos, AI makes a 4-page card; print or mail not found | https://makeacard.ai/ [S] |
| Greetings Island "Magic Photo" | AI cards featuring your face (printable, digital) | https://www.greetingsisland.com/blog/make-amazing-cards-using-the-ai-powered-magic-photo [S] |

### 3.8 October rechecks
- **Punkpost:** closed. Announced July 2024, last orders 2024-07-22, closed 2024-07-30; domain re-registered by someone else in May 2025; on 2026-08-31 the site showed an expired certificate and suspended hosting [S, ShipNote competitor blog; search results cite Punkpost's own social notices]. Remove from the competitor set.
- **Cardwise:** unchanged. Free: 5 AI cards, physical $6.99. Gold $6.99 a month: 50 credits, shipping included. No photo upload or likeness mentioned; no books [V] https://getcardwise.com/ .
- **Imagitime:** unchanged prices ($39.99 / $54.99, $9.99 shipping, 8-13 days, preview in 2 minutes, 12-month retention). New FREESHIP for repeat orders. Shows "1,000+ 5-star reviews" on Trustpilot and on Google; no cards [V] https://www.imagitime.com/ . Trustpilot 4.8 on about 3,640 [S] https://ca.trustpilot.com/review/imagitime.com?page=9 (snippet; Trustpilot notes the company does not invite reviews).
- **Cross-product likeness (cards + books):** searched "personalized AI character from photo same character greeting cards and storybook", "saved character / reuse your character greeting card and picture book", "personalized storybook company adds greeting cards same character", Magic Story avatar cards, and read ToonyStory's home page (books, animated video, hardcover; characters saved to the account; no cards) [V] https://toonystory.com/ . **Not found.** Nearest: Hooray Heroes customises characters "to resemble the recipients" in books [S] https://www.giftly.com/gift-card/hooray-heroes and links "personalized cards" (I could not open the cards page, 429). Next month: check whether those cards reuse the book character builder. Photo-card makers (AI Cards, Pigeon Post, Silly Robot) do not sell books [V].
- **Gemini Storybook:** no print ordering; still print or PDF from the Share menu [S] https://support.google.com/gemini/answer/16434396 .
- **Hallmark:** no AI card generator found [S, competitor blog checked Aug 2026].

## 4. Review and sentiment trends

| Competitor | Score (now / last) | Count (now / last) | New themes | Source | Tag |
|---|---|---|---|---|---|
| Imagitime | 4.8 / 4.8 | about 3,640 / about 3,640 | Praise for ease and print; keepsakes for grandchildren; "wish I'd bought hardback" | https://ca.trustpilot.com/review/imagitime.com?page=9 | [S] |
| Silly Robot Cards | 4.4 / new | not shown / new | One lost delivery, one complaint about unreliable credits (search summary) | https://www.sillyrobotcards.com/ ; https://de.trustpilot.com/review/sillyrobotcards.com | [V]/[S] |
| SendOutCards | 4.0 / new | 702 / new | "polarized" reception; exposed to AI-native rivals (AI-written review site) | https://marlvel.ai/apps/sendoutcards | [S] |
| Wonderbly, Hooray Heroes, I See Me | not rechecked | | | | |

Category sentiment: the July-August Wired/Futurism story has continued under the label "grandmaslop" (Gadget Review summarising TechRadar, 2026-09-22) [S]. The new angles: DIY books made with general assistants (Gemini, Claude, ChatGPT), images that look like photos of events that never happened, and AI books as a substitute for visits. No holiday-specific coverage found yet [S]. A broader CreativeBloq piece asks whether AI is "destroying the art and magic of children's books" (date not checked) [S] https://www.creativebloq.com/ai/ai-art/is-ai-destroying-the-art-and-magic-of-childrens-books .

## 5. Search and ad signals

- **Still not observable:** Meta Ad Library, Google Ads Transparency, Keyword Planner, traffic tools, Google Trends. October action 5 (exports from a person with access) is still open.
- **Comparison content:** card-side vendor blogs now rank each other the way book makers did in October: ShipNote ("Postable alternatives", ranks itself first), birthday-cards.ai ("apps to watch"), Heartdrop ("5 best AI greeting card makers"), Greetigram (eCards). All [S, competitor].
- **Promos seen:** Imagitime 10% email + FREESHIP on repeat orders [V]; Hooray Heroes $59.99 to $39.99 [V]; Silly Robot "20% off when you set 3 birthday reminders" and "3 cards for $10" (page titles) [S]; Pigeon Post first card free [V].

## 6. Opportunities

1. **The cross-product likeness is still unclaimed** (section 3.8). It is the one idea in the category nobody shows. It needs the book's approved character sheet to be reusable in a card; that is not built.
2. **Photo-to-card players are tiny and unproven.** AI Cards and Pigeon Post show no reviews or company scale [V]. There is room for a trusted brand, but only if the card takes a photo or reuses the book character.
3. **Privacy as a differentiator in cards too.** None of the photo-card entrants showed retention terms on their landing pages [V]. GreetHub's 90-day purge and named vendors can be stated plainly.
4. **Imagitime still has no cards** [V]. A book buyer who wants a matching card has nowhere to go.
5. **IP discipline as trust.** Some rivals index franchise-named cards [S]. Clean catalogues are safer for marketplaces, ad platforms and assistant directories.

## 7. Threats

1. **AI card commoditisation.** Photo-likeness mailed cards at $1.78-$9.99 [V] undercut and out-feature GreetHub's photo-less AI card at $10.98.
2. **Mailed-card price floor** at $2-$4.60 all-in (CardCrafter/SendOutCards, Thanks.io, Handwrytten, ShipNote) [V]/[S]; Hallmark Sign & Send free (Oct, [V]). Ready Cards at $10.48 have no feature that justifies the gap.
3. **Vendor-competitor conflict** (section 3.6) if Thanks.io or Handwrytten carry GreetHub's mail.
4. **Assistant channel already occupied** by Thanks.io and Handwrytten MCP connectors [V].
5. **Backlash continues** and now targets DIY assistant books too [S]; GreetHub's grandparent segment stays exposed.
6. **No print vendor four weeks before the PLAN's Nov 20 cards gate** (owner, [U]). Without a vendor and a proof, the Christmas window closes; Imagitime keeps shipping in 8-13 days [V].

## 8. Traction outlook (honest view, per product line)

Inputs: CFO v3 (`finance/README.md`, read 2026-11-02): contribution per item digital card $3.19, mailed card $4.45, 24pp book $21.42, 32pp $27.84; per order $15.20; LTV $26; paid CAC $70 (about $99 all-in through creators); Base case has no break-even in 36 months; $0 paid spend breaks even at month 24. Ready Cards contribution about $2.94 digital and $4.18 mailed (`docs/finance/stock-cards-pricing.md`, ESTIMATE). Photo cards about $16 / $33 / $62 per order at 25 / 50 / 100 cards (`docs/finance/photo-events-pricing.md`, ASSUMPTION). Plan: invite-only soft launch, about 50 orders, no paid ads in 2026 (`docs/PLAN.md`). My likelihood words are judgement [U]; I have no traffic, conversion or survey data, and no GreetHub order has been observed.

| Line | Competitive position | Economics | Verdict on gaining customers |
|---|---|---|---|
| **Picture books** | Best relative position. About $20 under Imagitime all-in for the same 8.5x8.5 format [V]; no competitor reuses the likeness across products. Behind on proof: no reviews against 3,640 at 4.8 [S], 10-15 minute render against a 2-minute preview, no printer chosen, no physical proof, backlash aimed at this exact buyer | Highest contribution ($21-$28 an item), still below paid CAC ($70) for one order; pays only through organic, referral or repeat | **Most likely of the four to win customers, but few, and not through paid ads.** Christmas 2026: unlikely beyond friends, family and the invite list, because the Nov 13 gate needs a printer, a sandbox run and a proof that do not exist today. Realistic 2026 result: a few dozen orders at most [U]. Real test is Q1-Q2 2027 with a gallery, reviews and a proven delivery date. |
| **AI cards (Made for you)** | Weakest. No photo input, while AI Cards ($9.99 shipped) and Pigeon Post ($1.78) turn the recipient's photo into the art [V]; Cardwise $6.99 with reminders [V]; Silly Robot from $4.99 [V]; free eCards from Hallmark+ and Greetly | $4.45 mailed, $3.19 digital; a paid customer needs about 16 mailed cards to repay a $70 CAC [U arithmetic] | **Very unlikely to gain customers on its own.** Higher price and fewer features than newer rivals. Only plausible as an add-on to a book order or once it reuses the book's approved character. Do not spend acquisition money on it. |
| **Ready Cards** | Commodity. $10.48 all-in against Hallmark Sign & Send free (plus a $5-$6 card), Moonpig about $5 with free shipping, Postable about $6.11 single, Handwrytten about $4.57, Thanks.io $3.04, ShipNote $1.99, CardCrafter via SendOutCards about $2.24-$4.00 [V]/[S]. Same art for every buyer; no likeness; the front cannot be personalised | About $4.18 mailed, $2.94 digital (ESTIMATE); no way to pay a CAC | **Unlikely to bring in new customers; can help convert visitors who are already on the site.** Its job is a fast second path for someone who bounced from the story chat, and later an easy assistant order. Price is the visible problem: $10.48 is about 2x the incumbents and 3-5x the mail services. Judge it by the PLAN's ship metric (net card orders per visitor up 8%), not by acquisition. |
| **Photo cards (holiday batch)** | Best unit economics but the most crowded field: Shutterfly from $0.81 sale and Mail For Me $1.49 (Oct, [V]), Zazzle $1.44 sale, Minted, Artifact Uprising (`03-photo-cards-and-events.md`). GreetHub has no brand, no reviews and no flat-card printer | $16-$62 contribution per order at 25-100 cards (ASSUMPTION); the only line where one order can exceed a $70 CAC | **Not a 2026 line.** The PLAN read the Oct 24 go/no-go as 1 of 10 met and planned for Holiday 2027; no flat-card printer is chosen. In 2027 it is the line whose economics could carry paid acquisition, if a printer quote supports the CFO prices and buyers accept a new brand. |

**Bottom line:** in the next 60 days GreetHub will most likely gain only invite-list customers, almost all for books, with cards as add-ons. None of the four lines has evidence it can acquire paying strangers at a cost it can afford. The books line is the only one with a defensible gap (price vs Imagitime, and the unbuilt cross-product likeness). The card lines are behind on price and, for AI cards, on features.

## 9. Recommended actions

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | Do not pick Thanks.io or Handwrytten for mail-for-me until each answers in writing: DPA, own-use of order and recipient data, model training, retention, envelope branding, 5x7 folded portrait support. Compare with Gooten and Prodigi self-send | Fulfillment + Privacy ops; owner decides; attorney reviews DPAs | before vendor choice |
| 2 | Decide AI card scope for 2026: hold it as a book add-on only, no card acquisition spend; put "reuse the approved book character in a card" on the 2027 roadmap | PM + owner | 2026-11-13 |
| 3 | Re-price or reposition Ready Cards before launch: the CFO models a postage-included mailed price in the $5.99-$7.99 band and its contribution at the chosen vendor's real cost | CFO; owner approves | before Nov 20 gate |
| 4 | Order one AI Cards card and one Pigeon Post card with a stock (non-family, non-child) adult photo or illustration to judge likeness, print and envelope | Market Intel (needs owner payment) | 2026-11-20 |
| 5 | Keep "grandmaslop" in the CMO's risk list; cover label and privacy copy from Oct action 6 still open | CMO + Legal | 2026-11-15 |
| 6 | Re-run the cross-product search monthly; open the Hooray Heroes cards page | Market Intel | next report |
| 7 | Carry forward: Imagitime and Wonderbly order (Oct action 1), ad and traffic exports (Oct action 5) | Market Intel / CMO | open |

## 10. Open questions

- **Resolved:** Is Punkpost closed? Yes, since 2024-07-30 [S]. Does Greetly mail? No, digital only [V]. Cardwise price now? $6.99, unchanged [V]. Imagitime price now? Unchanged [V]. Does any competitor reuse one likeness across cards and books? Not found [U].
- Do Hooray Heroes' "personalized cards" reuse the book character builder? (page 429)
- Do Thanks.io and Handwrytten use customer order data for their own marketing, analytics or AI training? Will they sign a DPA? (ask vendors)
- Can either vendor print a 5x7 folded portrait card with GreetHub's inside layout? (not found)
- SendOutCards current price list (not published).
- Who runs AI Cards (aicards.co), and what are its photo retention terms? (not shown)
- Is the Evergreen Award judged or paid? (not found)
- Carried from October: Imagitime traffic; Gemini print ordering (none found again); Wonderbly US shipping and cut-offs; Mixbook, Papier US, American Greetings prices; true WTP for AI-photo books (no survey yet).

## 11. Scorecard

From `docs/market/scorecard.csv` (62 rows appended for 2026-11). Main view; "new" = first observation.

| Competitor | Metric | Nov 2026 | Oct 2026 | Change |
|---|---|---|---|---|
| Imagitime | Hardcover / shipping | $54.99 / $9.99 [V] | $54.99 / $9.99 | unchanged |
| Imagitime | US delivery days | 8-13 [V] | 8-13 | unchanged |
| Imagitime | Promo | 10% email; FREESHIP repeat [V] | 10% email | changed (FREESHIP added) |
| Imagitime | Trustpilot score / count | 4.8 / about 3,640 [S] | 4.8 / about 3,640 | unchanged |
| Hooray Heroes | Shown (list) price | $39.99 ($59.99) [V] | $39.99 ($59.99) | unchanged |
| Hooray Heroes | Status | migration banner gone; cards link [V] | migrating | changed |
| Cardwise | Physical card / Gold | $6.99 / $6.99 a month [V] | $6.99 / $6.99 | unchanged |
| Gemini Storybook | Print ordering | no [S] | no [V] | unchanged |
| Punkpost | Status | closed 2024-07-30 [S] | "appears closed" [S] | resolved |
| CardCrafter Suite | Plan / mailed card | $11.97 a month / about $2.24-$4.00 [V] | | new |
| SendOutCards | Mailed card | about $2.24 sub (third-party) [S] | | new |
| Silly Robot Cards | Printed card | from $4.99 + delivery [V] | | new |
| Greetly | Mails | no, digital only [V] | | new |
| Thanks.io | Notecard incl. postage | $3.04 / $1.83 / $1.49 [V] | grouped $2.45-$4.95 [S] | new row |
| Handwrytten | Card + postage | $3.75 + USPS (about $4.57) [V]/[S] | grouped $2.45-$4.95 [S] | new row |
| AI Cards | Photo-likeness card shipped | $9.99 [V] | | new |
| Pigeon Post | Photo-illustrated card | $1.78 + $19.99 a year [V] | | new |
| ShipNote | Mailed card | $1.99 [S] | | new |
| Market | Cards + books same likeness | not found [U] | not found [U] | unchanged |
| GreetHub | Book 24pp / mailed AI card all-in | $44.99 / $10.98 | $44.99 / $10.98 | unchanged |
| GreetHub | Ready Card mailed / digital (branch, unapproved) | $10.48 / $3.49 | | new |
| GreetHub | Print vendor selected | no [U, owner] | | new |

## 12. Changes to GreetHub inputs

- **CFO / Ready Cards:** $10.48 all-in is out of line with every mailed-card benchmark found ($1.78-$6.11, Hallmark free mail). Model a postage-included price ($5.99-$7.99) at the chosen vendor's real cost before the owner approves. Source: section 3, scorecard rows 2026-11.
- **CFO / AI card:** the October $8.99 postage-included test would be only $1 under AI Cards' $9.99, for a card without the recipient's likeness, and well above Pigeon Post's $1.78 for one with it. Do not model card-led acquisition.
- **CFO / vendor costs:** if a mail-for-me vendor is used, per-card cost including postage is $1.49-$3.04 (Thanks.io notecard) or about $4.57 (Handwrytten retail) [V]/[S], against the CFO's $3.25 print + $1.60 ship estimate. Owner's Gooten figure ($1.85 + shipping from $4.99) is per shipment to one address, so mailing to a recipient costs about $6.84 a card unless batched [U arithmetic].
- **CMO:** add "grandmaslop" to backlash monitoring; do not use franchise names in card SEO (Silly Robot pattern).
- **Integrations:** the agent plan's competitive section should note Thanks.io and Handwrytten MCP connectors [V].
- **Privacy ops / Legal:** vendor DPA questions in section 3.6.
