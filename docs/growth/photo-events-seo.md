# Photo cards and events: SEO, landing pages, email timing

Growth, 2026-10-15. PROPOSED, wave 1. Built on docs/products/photo-cards-and-events-plan.md (section 8), docs/products/photo-events/pm-roadmap.md, docs/cmo/photo-events-positioning.md, docs/cmo/marketing-plan.md (Occasion SEO, section 3) and docs/legal/03-ecommerce-tax-consumer.md section 7 (CAN-SPAM). Not legal advice.

**Labels used in this doc.** SOURCED = a third-party figure I found, with URL and date read, not re-checked in Keyword Planner. GUESS = my estimate, no data behind it. NOT FOUND = I looked and found nothing usable. Every volume and traffic number here is one of these three. Nothing here is from Keyword Planner or Search Console, because GreetHub has neither yet (PLAN.md growth section, market/03).

## 1. Constraints that shape everything

1. **No domain yet.** The launch checklist still lists "Buy a domain" (LAUNCH-CHECKLIST.md Part 3), and PLAN.md lists the production domain and Search Console as owner asks. Ranking clocks start at the first crawl of the real domain, not at the day we write a page.
2. **No SEO for photo cards in 2026.** The PM roadmap puts "paid ads, creator seeding or SEO pages for photo cards" out of Phase 1 scope (pm-roadmap section "out of scope"). Holiday 2026, if go, is a 30-order invite-only test. So this plan publishes nothing indexable for photo cards in 2026. If the owner approves the CMO's no-go waitlist line, it lives on the existing cards page, not on a new indexed page.
3. **Copy only what ships.** CMO ground rule: no "free addressing", "mail for me", "AI picks your photos" or member discounts on a page until built. Landing pages below mark which phase each claim needs.
4. **Sample art is fictional only** (standing rule 5): every hero and template tile uses fictional families and couples, labelled "Sample". No children's likenesses from customers, ever.
5. **Event pages stay out of search.** `/e/<slug>` pages hold guests' names and a couple's date and venue. They must be `noindex, nofollow`, excluded from `sitemap.ts`, and disallowed in `robots.ts`. This is a request to the CTO and Shop engineer (I don't write app code); it protects guests and avoids thin duplicate pages competing with our real landing pages.

## 2. What ranking will realistically look like

Evidence: Ahrefs, "How long does it take to rank in Google?", published 2025-05-15, read 2026-10-15 (https://ahrefs.com/blog/how-long-does-it-take-to-rank/). SOURCED: of 2M English pages created in October 2023, **6.11%** reached the top 10 for any keyword within a year (1.74% in a 1M random-URL sample); the average #1 page is **about 5 years old**; 72.9% of top-10 pages are over 3 years old; high-volume terms take longer than low-volume ones. The study also notes that high-domain-rating sites rank far better than low-rating ones. A brand-new domain has a rating of zero.

The head terms are held by Minted, Shutterfly, Zazzle, Vistaprint, Zola, The Knot and Paperless Post, with years of links (positioning doc, competitor table). So, GUESS, applied to a new domain with no links:

| Keyword type | Example | Realistic outcome |
|---|---|---|
| Head commercial | christmas photo cards, wedding invitations, save the dates | **Not page 1 in 2027.** Possibly never without links and brand searches. Write the pages anyway (they convert visitors from other channels and earn long-tail queries), but plan no traffic from the head term itself. |
| Mid-tail commercial | hanukkah photo cards, save the date postcards, wedding invitations with rsvp website | Page 2 to 3 within 6 to 12 months; page 1 for a few by the second season. |
| Long-tail informational | when to send save the dates, christmas card wording for family, what day of the week is [date] | Page 1 possible in 3 to 9 months for the least contested. Most of our photo-events organic traffic in 2027 comes from these. |
| Brand + product | greethub photo cards, greethub save the date | Day one, once indexed. Tiny until the brand has awareness. |

**The seasonal consequence.** A page has to be indexed and aging months before its season. Christmas card searches spike in late November and December (SOURCED, RankHero shows "merry christmas card" at 33,100 average monthly global searches with a December 2025 peak of 368,000, read 2026-10-15, https://www.rankhero.com/keywords/merry-christmas-card; Etsy-oriented tool, global, not US Google). Engagement and the first wedding planning wave sit in December to February (SOURCED: December is the top proposal month, about 16 to 21% of proposals depending on study; roughly 40 to 47% of engagements fall between Thanksgiving and Valentine's Day, The Knot via https://www.theknot.com/content/popular-day-to-get-engaged and https://digimarcon.com/new-national-analysis-reveals-when-americans-are-most-likely-to-get-engaged-and-when-wedding-planning-peaks, both read 2026-10-15; I did not open The Knot's study itself).

So:
- **Holiday 2027 pages publish by June 2027** to have 4 to 6 months of age by the November peak.
- **Save-the-date pages publish with the Feb 2, 2027 launch** but will earn almost nothing that season. Their real first season is Dec 2027 to Mar 2028. Phase 2's first season runs on email, Pinterest and partner referrals (Social), not search.
- **Invitation pages publish with the May 2027 launch**; wedding invitation lead time (6 to 8 weeks before the wedding) makes demand steadier through the year, so they have a fair chance by autumn 2027.

## 3. Keyword targets

Volumes are mostly NOT FOUND: Keyword Planner is needed. The two SOURCED figures below come from a summary of a Semrush competitor page that I could not open myself (the page returned 404 on 2026-10-15), so treat them as order-of-magnitude only.

- "wedding invitations": about 190,500 US monthly, CPC about $2.76; "save the date cards": about 112,100, CPC about $3.14. SOURCED-UNVERIFIED (search summary of ko.semrush.com/website/basicinvite.com/overview, 2026-10-15; page not reachable). RankHero shows "wedding invitations" at 368,000 global with difficulty 52/100 (https://www.rankhero.com/keywords/wedding-invitations, read 2026-10-15, data dated 2026-01-17).
- "family photo christmas": 5,400 monthly; "message on christmas card": 27,100. SOURCED, undated, tool not named (https://buildthekeyword.substack.com/p/hilarious-christmas-card-family-photo, read 2026-10-15).
- "christmas photo cards": NOT FOUND.

Priority = intent x our chance x whether the product ships it. P1 = write first.

### 3.1 Holiday photo cards (pages live by June 2027, for Holiday 2027 opening Oct 1)

| Pri | Keyword (US spelling) | Intent | Page | Volume |
|---|---|---|---|---|
| P1 | christmas photo cards | buy | /holiday-photo-cards/christmas | NOT FOUND (head term) |
| P1 | holiday photo cards | buy | /holiday-photo-cards (hub) | NOT FOUND |
| P1 | christmas card wording for family / what to write in a family christmas card | info | /guides/christmas-card-wording | related "message on christmas card" 27,100 SOURCED |
| P1 | when to mail christmas cards [year] / christmas card mailing deadline | info | /guides/when-to-send-christmas-cards | NOT FOUND |
| P2 | hanukkah photo cards | buy | /holiday-photo-cards/hanukkah | NOT FOUND |
| P2 | new year photo cards / new years cards with photos | buy | /holiday-photo-cards/new-year | NOT FOUND |
| P2 | christmas card with multiple photos / photo collage christmas card | buy | /holiday-photo-cards/collage | NOT FOUND |
| P2 | family photo christmas card | buy | /holiday-photo-cards/christmas (section) | 5,400 SOURCED |
| P2 | christmas letter ideas / year in review letter | info | /guides/holiday-letter | NOT FOUND; links to back-side letter layout. The letter writer is Phase 2+, so the guide cannot promise it before then |
| P3 | non religious holiday cards / season's greetings photo cards | buy | /holiday-photo-cards/seasons-greetings | NOT FOUND |
| P3 | how many christmas cards to order | info | /guides/how-many-holiday-cards (count helper) | NOT FOUND |
| P3 | christmas card photo ideas | info | /guides/holiday-card-photo-ideas | NOT FOUND; fictional sample photos only |

### 3.2 Save the dates (publish Feb 2, 2027; first real season Dec 2027)

| Pri | Keyword | Intent | Page | Volume |
|---|---|---|---|---|
| P1 | save the dates / save the date cards | buy | /save-the-dates | 112,100 SOURCED-UNVERIFIED |
| P1 | when to send save the dates | info | /guides/when-to-send-save-the-dates | NOT FOUND |
| P1 | save the date wording | info | /guides/save-the-date-wording | NOT FOUND |
| P2 | save the date postcards | buy | /save-the-dates/postcards | NOT FOUND |
| P2 | photo save the dates / save the date with photo | buy | /save-the-dates (section) | NOT FOUND |
| P2 | save the date with qr code | buy | /save-the-dates/qr-code | NOT FOUND |
| P2 | destination wedding save the dates | buy + info | /save-the-dates/destination | NOT FOUND; 9 to 12 month timing |
| P3 | save the date etiquette (who gets one, plus-ones) | info | /guides/save-the-date-etiquette | NOT FOUND |
| Later | save the date magnets | buy | only when magnets ship | NOT FOUND |

### 3.3 Invitations and event pages (publish with the May 2027 launch)

| Pri | Keyword | Intent | Page | Volume |
|---|---|---|---|---|
| P1 | wedding invitations | buy | /invitations/wedding | 190,500 SOURCED-UNVERIFIED |
| P1 | wedding invitation wording | info | /guides/wedding-invitation-wording | NOT FOUND |
| P1 | when to send wedding invitations | info | /guides/when-to-send-wedding-invitations | NOT FOUND |
| P1 | wedding rsvp website / online rsvp for wedding | buy | /event-pages | NOT FOUND; free page up to 75 guests is a CFO proposal, not approved |
| P2 | wedding invitations with rsvp cards / rsvp card wording | buy + info | /invitations/wedding (section) + /guides/rsvp-wording | NOT FOUND |
| P2 | birthday party invitations with rsvp | buy | /invitations/birthday | NOT FOUND |
| P2 | baby shower invitations / bridal shower invitations | buy | /invitations/shower | NOT FOUND |
| P2 | graduation party invitations | buy | /invitations/graduation (publish by Mar 2027 for May to June parties) | NOT FOUND |
| P3 | rsvp by date how far before wedding | info | /guides/rsvp-deadline | NOT FOUND |
| P3 | holiday party invitations | buy | /invitations/holiday-party (Holiday 2027) | NOT FOUND |

### 3.4 Small tools that can earn links (our best shot as a new domain)

GUESS: a useful free tool earns links faster than a product page. Each one ties to a real product strength (the proof checker).

1. **"What day of the week is [date]?" checker** at /tools/day-of-week. Couples check that "Saturday, June 12, 2027" is really a Saturday. The same logic as the proof checker. Pages per year (e.g. /tools/day-of-week/2027) only if they carry real content; no thin auto-generated date pages.
2. **Save-the-date and invitation timeline calculator**: enter the wedding date (and "destination"), get send-by and order-by dates. Feeds the email opt-in in section 5 if the visitor chooses.
3. **Holiday card mailing deadline page** for each year: order-by dates read from our config (CMO rule), plus a link to USPS's official holiday shipping dates. Never type a USPS date ourselves; link to the source.

These need Card or Shop engineer time. Listed as asks, not built.

## 4. Landing page template

Same pattern as the occasion pages in the marketing plan, so the engineers build one template.

- **H1 and lede from the CMO** (positioning section 2), e.g. Holiday Photo Cards: "Your year, on *one card.*"
- **Title tag:** "[Keyword] with your photos | GreetHub", under 60 characters. Meta description states price only after the owner approves it ("From $1.59 a card, envelopes included" is a CFO proposal).
- **Above the fold:** 3 to 6 theme tiles (Design's 12 themes, sample art), "Start with your photos" button into the creator.
- **Body, in order:** how it works (3 steps); "Checked before it prints" (the read-back and weekday check, CMO proof point 1); sizes, paper, envelopes; price ladder (once approved); order-by dates (from config); a short wording section with 6 to 10 examples (this is where the long-tail traffic lands); FAQ (5 to 8 real questions from Support's photo-events FAQ).
- **Schema:** Product with Offer only once prices are approved and match checkout. FAQPage markup is fine but don't count on the rich result: Google limited FAQ rich results to well-known authoritative government and health sites in August 2023 (from my knowledge, not re-checked today).
- **Internal links:** hub to child pages; guides to the matching product page; save-the-date pages to the paired invitation theme (CMO pairing line); existing birthday and thank-you occasion pages to the matching invitation page.
- **Sitemap and robots:** add the new public pages to the indexable list in `app/lib/seo.ts` when each one ships (Card or Shop engineer, not me). `/e/` stays out (section 1, point 5).
- **No competitor names** in page copy or ads (CMO). Comparison pages wait for market/03 and a physical proof.

## 5. Email timing for each season

Extends the CMO table (positioning section 6). Rules from docs/legal/03 section 7 and the plan:
- Marketing emails go only to people who opted in to marketing. Every one has a postal address, an honest subject and a one-click unsubscribe. The company postal address is still an owner ask.
- **Address books and guest lists are never a marketing audience** (plan section 7). A guest who RSVPs is not a lead.
- Transactional mail (proof ready, shipped, RSVP reminders sent by the host) carries no promotion, or it becomes commercial.
- Every date in an email comes from the order-by config, never typed by hand, and every order-by email states the arrival window (CMO, CX).
- Send marketing from a separate subdomain and warm it up first (PLAN.md growth section). For Holiday 2027, warm-up starts by **early September 2027**.

### 5.1 Holiday 2026 (only if Oct 24 is go)

Invite-only test to the allowlist and waitlist. Use the CMO schedule unchanged: Nov 20 open; Dec 1 "Order by Dec 5 for Christmas"; Dec 4 "Tomorrow is the last day"; Dec 5 morning "Last day". A draft left for 24 hours gets one reminder. After Dec 5, one New Year card note. That's 4 sends plus 1 reminder. I add nothing. If no-go: no emails about photo cards.

### 5.2 Holiday 2027 (opens Oct 1, 2027)

| When | Email | Audience |
|---|---|---|
| Sep 15 | "Holiday photo cards open Oct 1" (only if a waitlist exists) | Waitlist |
| Oct 1 | Open: themes, price, envelopes included | Opted-in customers + waitlist |
| Nov 1 | "Pick your photos this weekend" + photo tips guide | Opted-in, not yet ordered |
| Nov 15 | Peak lead time; the order-by date and arrival window | Opted-in, not yet ordered |
| Order-by minus 5, minus 1, day of | Deadline sequence | Opted-in, not yet ordered; stop the moment they order |
| Draft left 24 h | One reminder (transactional-style, no promo) | Draft owner |
| Dec 27 | New Year cards, if the order-by still allows delivery | Opted-in |
| Following Sep 15 | "Last year's list and photos" reorder note. The list itself is purged or kept only per the privacy-ops retention rule, so the email must not promise saved photos | Last year's buyers who opted in |

Cap: at most 6 holiday marketing emails per person per season (GUESS, to keep complaint rates low on a young sending domain).

### 5.3 Save the dates (from Feb 2, 2027)

| Trigger | Email |
|---|---|
| Launch, Feb 2, 2027 | One announcement to opted-in customers. Engagement season is already ending; don't over-send |
| Couple gave a wedding date: 8 months before (12 if destination) | "Time for save the dates" |
| 6 months before (9 if destination) | Last nudge. Then stop |
| Order shipped | Transactional only. A "your invitations, same design" note goes as a separate marketing email 2 weeks later, opted-in only |
| Dec 26, 2027 to Jan 31, 2028 | Engagement-season send: one email to opted-in customers, plus a Pinterest/partner push (Social). First season search can help |

### 5.4 Invitations and event pages (from May 2027)

| Trigger | Email |
|---|---|
| Launch, May 2027 | One announcement. Party and shower invitations lead, because their lead times are short |
| Wedding date known: about 14 weeks before | "Time to order invitations" (mail 6 to 8 weeks out, plus print and ship) |
| RSVP-by date | Reminder to the **host only**; host chooses whether to remind guests. No promotion in either |
| Event over + 7 days | Thank-you card offer to the host (opted-in only); this links the event products back to the core card business |

## 6. Editorial calendar (publish dates, Wednesdays per the marketing plan's weekly rhythm)

| Publish by | Pages | Why then |
|---|---|---|
| Now to Jan 2027 | Nothing indexed for photo events. Draft copy for 3.2 P1 pages | PM scope; domain and Search Console first |
| Feb 2, 2027 | /save-the-dates, /guides/when-to-send-save-the-dates, /guides/save-the-date-wording, /tools/day-of-week | Phase 2 launch; start aging for Dec 2027 |
| Mar 2027 | /save-the-dates/postcards, /save-the-dates/qr-code, /save-the-dates/destination, /invitations/graduation (only if Phase 3 is on track for May; otherwise hold) | Graduation parties are May to June |
| May 2027 | /invitations/wedding, /event-pages, /guides/wedding-invitation-wording, /guides/when-to-send-wedding-invitations, /invitations/birthday, /invitations/shower | Phase 3 launch |
| Jun 2027 | /holiday-photo-cards hub, /christmas, /guides/christmas-card-wording, /guides/when-to-send-christmas-cards | 5 months of age before the November peak |
| Jul to Aug 2027 | /hanukkah, /new-year, /collage, /guides/holiday-letter, timeline calculator | Second wave of holiday pages |
| Sep 2027 | /seasons-greetings, /guides/how-many-holiday-cards, /invitations/holiday-party, refresh 2027 order-by dates | Before Oct 1 open |
| Every Jan | Update year-specific titles and dates ("2028") on deadline pages | Searchers add the year |

Hanukkah 2027 starts around early December (date to confirm from a calendar source before the page goes up), so the Hanukkah order-by may be earlier than Christmas. Fulfillment owns the cut-off.

## 7. Traffic estimates (all GUESS)

Organic sessions to photo-events pages, assuming the domain is live and in Search Console by Jan 2027 and the pages ship on the calendar above. No keyword data behind these; replace them with Search Console data after 90 days.

| Period | Organic sessions (GUESS range) | Mostly from |
|---|---|---|
| Feb to Apr 2027 | 0 to 300 total | Brand searches, day-of-week tool |
| May to Sep 2027 | 300 to 2,500 total | Wording and timing guides, mid-tail invitations |
| Oct to Dec 2027 (holiday) | 500 to 5,000 total | Holiday wording and deadline guides; little from "christmas photo cards" itself |
| Dec 2027 to Mar 2028 (engagement season) | 1,000 to 8,000 total | Save-the-date guides and mid-tail pages in their second year |

Conversion of these visitors is NOT FOUND for us; Head of Data should add photo-events organic sessions and organic-attributed orders to the KPI dashboard (docs/data/04).

## 8. Asks

**Owner:** buy the domain and set `NEXT_PUBLIC_SITE_URL`; verify Search Console on launch day; a Keyword Planner export for every keyword in section 3 (US, 12 months); approve prices before any page or email shows them; the company postal address for email footers; approve or decline the no-go waitlist line.

**CTO / Shop engineer:** `/e/` noindex, out of sitemap, disallowed in robots; add new pages to `app/lib/seo.ts` as they ship; build the day-of-week tool and timeline calculator (section 3.4).

**Head of Data:** organic sessions and conversions by page group; wedding date capture with marketing consent, so the save-the-date and invitation emails can fire.

**Social:** carry the first save-the-date season (Feb to Apr 2027) on Pinterest and partners, since search won't.

**Support:** FAQ answers for the landing pages. **Design:** sample art with fictional people for every page hero and tile.

## Sources (all read 2026-10-15)

- Ahrefs, How long does it take to rank in Google?, 2025-05-15: https://ahrefs.com/blog/how-long-does-it-take-to-rank/
- RankHero, merry christmas card: https://www.rankhero.com/keywords/merry-christmas-card
- RankHero, wedding invitations: https://www.rankhero.com/keywords/wedding-invitations
- Build The Keyword, family photo christmas etc.: https://buildthekeyword.substack.com/p/hilarious-christmas-card-family-photo
- Semrush competitor page for basicinvite.com (seen only in a search summary; 404 when fetched): https://ko.semrush.com/website/basicinvite.com/overview
- The Knot, popular day to get engaged: https://www.theknot.com/content/popular-day-to-get-engaged
- DigiMarCon summary of a national engagement analysis, Dec 2025: https://digimarcon.com/new-national-analysis-reveals-when-americans-are-most-likely-to-get-engaged-and-when-wedding-planning-peaks
- FTC CAN-SPAM guide, via docs/legal/03 section 7: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
