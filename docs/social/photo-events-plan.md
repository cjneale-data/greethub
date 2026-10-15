# Photo cards and events: Pinterest, Instagram and partnerships

Owner: Social and Creator Partnerships Lead. Written 2026-10-15. PROPOSED, nothing here is approved. Built on docs/products/photo-cards-and-events-plan.md (section 8), docs/products/photo-events/pm-roadmap.md, docs/cmo/photo-events-positioning.md, docs/finance/photo-events-pricing.md (CFO proposal, print costs assumed), docs/social/01-channel-playbook.md and docs/social/02-creator-affiliate-program.md. Market intel's teardown (docs/market/03-photo-cards-and-events.md) is **not found**, so nothing below compares us with a named competitor. Research only, not legal advice; attorney items are marked **[ATTORNEY]**. Numbers are GUESS unless a source is given.

## 0. Rules for this project (on top of 01 section 0 and 02)

1. **Promise only what the phase ships** (CMO ground rule). Phase 1 (Christmas 2026, if go) is invite-only, 30-order cap, ship to me, no addressing, no mail-for-me, no AI photo picks, no creators, no SEO (PM). So **no public social for photo cards in 2026**. Addressing and mail-for-me copy waits for Phase 2 to ship; event pages and RSVP copy waits for Phase 3.
2. **No real people in our sample cards** (standing rule 5). Photo cards need photos, so our own posts use one of these, in this order:
   a. **No-face samples (default):** photo slots filled with hands and rings, a couple seen from behind at a distance, pets, places, table settings, a decorated tree. Shot or licensed by us, labelled "Sample".
   b. **Licensed stock with model releases** or **AI-generated fictional people labelled "Sample"**: both conflict with rule 5 as written or raise AI-label questions. **Owner decides** before any face appears.
   Never a child's face in a photo-card sample, ever, even a fictional or stock one.
3. **No customer or partner wedding photos on our channels.** A real wedding photo carries the photographer's copyright plus every identifiable person's likeness (couple, guests, children in the party). We do not reshare them in 2027. Revisit only with a release that covers every identifiable adult, no children, and the photographer's license **[ATTORNEY]**.
4. **Claims.** "Checked before it prints" means only the checks that exist in that phase (weekday matches date, past dates, name spelled the same, year, DPI). Never "no typos guaranteed" or "error-free". Prices only after the owner approves them, read from config, never typed into a caption weeks ahead.
5. **IP.** Sample photos carry no logos, team jerseys, character sweaters or recognizable venues. Theme names come from docs/design (Paper Pines, Golden Hour, and so on). No "in the style of" anyone.
6. **Third-party data.** Guest lists, addresses and RSVPs never feed marketing, retargeting, lookalike audiences or partner reports. Event page footers carry a campaign-level UTM only (`utm_campaign=event-footer`), never an event, host or guest identifier.
7. **Comments.** Hide and DM anyone who posts a wedding date with a venue, a home address or a child's name. Order and proof questions go to support.
8. Links built with `trackedLink()` (app/lib/social.ts). Arrival capture (DATA-003) is still not built, so attribution is code-first.

## 1. Season map

| Window | Holiday photo cards | Save the dates | Invitations, party invites, event pages |
|---|---|---|---|
| Oct 15 to Dec 31, 2026 | Nothing public (go or no-go). If go, invite-only email (CMO) | Private prep: boards built as secret, sample shoot, pin templates | Nothing |
| Jan 4 to Feb 1, 2027 | Nothing | Pre-launch: wording and timing pins, building-it Reels (mock mode). Engagement season, Dec to Feb (commonly cited, **not verified**) | Nothing |
| Feb 2 to Apr 30 | Nothing | Launch and main push. Addressing and mail-for-me posts once shipped | Teaser only after Phase 3 date is firm |
| May 1 to Jul 31 | Nothing; family photographer outreach Jul | Steady, lower | Launch: invitations, event pages; party, shower and graduation invites |
| Aug 1 to Sep 30 | Pre-season pins go live (holiday planning on Pinterest starts early: **GUESS**, check Pinterest Trends) | Steady | Steady |
| Oct 1 to order-by, 2027 | Reopen Oct 1 (PM): full push, order-by countdown | Low | Holiday party invites |

## 2. Pinterest (priority 1 for this project)

Why: weddings and holiday cards are planning searches, and pins keep earning for months. A pin needs weeks to surface (GUESS), so pins go up 4 to 8 weeks before each launch, linking to the waitlist or a Growth guide until the product page exists.

**Boards** (built as secret now, made public on the launch day of the product they show):

| Board | Public from | Pin types |
|---|---|---|
| Save the Date Ideas | Feb 2, 2027 | Sample cards by theme (Golden Hour, Modern Calendar, Garden Letterpress), 5x7 and 4x6 |
| Save the Date Wording | Jan 4, 2027 | Type-only wording pins ("Save the date for our wedding, June 12, 2027, Asheville"), fictional names |
| Wedding Stationery Timeline | Jan 4, 2027 | Type-only: when to send save the dates (4 to 8 months, 6 to 12 destination), invitations (6 to 8 weeks), RSVP-by date. Source: the plan's section 2 sources |
| Wedding Invitation Wording | Phase 3 launch (about May 2027) | Type-only wording; Classic Garden and Evening Deco suites |
| Party and Shower Invitations | Phase 3 launch | Confetti Party samples, birthday and shower wording |
| Christmas Photo Card Ideas | Aug 2027 | No-face samples: layouts 1 to 4 photos, Paper Pines, Red Wool, Snow Day, Merry and Bright |
| Holiday Card Wording and Letters | Aug 2027 (wording pins can go live in Nov 2026 on the existing "What to write in a card" board, linking to today's cards) | Greetings, year-in-review letter starters |
| Hanukkah and New Year Cards | Aug 2027 | Eight Nights, Midnight Confetti samples |

**Cadence (GUESS, fits one person batching on Mondays):** 10 project pins a week from Jan 4, 2027, on top of the 10 a week in 01. Wedding peak Feb to Apr: 15 a week. Holiday 2027, Aug to Sep: 10 a week; Oct 1 to order-by: 15 a week.

**Formats:** flat-lay of a printed sample on paper (CMO "paper on a table"), close-up of the back with the "from" block, a 3-frame "photo in, proof, printed card" pin, and the stationery timeline as an infographic. Fresh image per pin.

**Product pins:** product Rich Pins need product pages with price and availability metadata (01 section 2). Growth owns those pages; apply only after real prices are approved and the pages carry Product schema. The `nopin` meta stays on the photo editor, proof, cart, address book and **all event pages** (`/e/<slug>`): an event page shows a couple's date and venue and must never be pinnable. **Ask for the CTO:** add `nopin` and `noindex` to `/e/*`.

**Paid Pinterest:** none until the CMO's CAC gate passes and Growth has sourced CPCs for wedding terms (CMO section 5; none sourced).

## 3. Instagram (priority 2)

Formats that sell the one thing we do differently, the checks:
- **Reel, "Your date, checked twice" (15 to 20 s):** screen capture in mock mode, fictional couple. Type "Saturday, June 13, 2027", the checker flags that June 13, 2027 is a Sunday, fix, approve. Only once the Phase 2 checker exists. (Verify the weekday in the real build before posting.)
- **Reel, photo in to printed card:** upload no-face sample photos, pick a layout, the DPI warning on a small photo, then the printed card in hand. Needs a physical proof (owner orders).
- **Carousels:** 6 wording ideas per slide set (save the dates, invitations, holiday greetings); "how far ahead to send" timeline; "what goes on a details card".
- **Reel, the host dashboard (Phase 3):** "38 yes, 6 no, 21 haven't answered" with fictional guest names (CMO line).
- **Stories:** order-by countdowns, dates read from config; links to the product page.

**Cadence (GUESS):** pre-launch Jan 2027: 1 Reel a week. Feb to Apr: 2 Reels and 1 carousel a week for save the dates. May to Jun: same for invitations and party invites. Holiday 2027 from Oct 1: 2 Reels, 1 carousel, daily Stories in the final 10 days before order-by.

**Paid partnership label** on any partner post we boost, and boosting only with a release that covers paid use (02 section 6). Under rule 0.3, no boosted post with a real wedding photo in 2027.

## 4. 2026 actions (whatever Oct 24 decides)

- No public photo-card pins, Reels or partner contact. An invite-only, 30-order test should not draw demand we can't fill or promise December delivery we haven't proven.
- Holiday wording pins (type only) go on the existing "What to write in a card" board and link to today's card pages, as in 01.
- Build secret boards and pin templates; plan a no-face sample shoot for Dec (owner approves the cost and the sample-photo rule in 0.2).
- If no-go: the CMO's waitlist line only. No tease on social.

## 5. Wedding planner and photographer partnerships

### 5.1 Who and why

| Partner | What they get from us | What we get |
|---|---|---|
| **Wedding planners and coordinators** (US, independent or small firms) | Fewer stationery mistakes on their clients' events (proof checker), one RSVP list from paper and digital, a client discount, a commission | Couples at exactly the save-the-date and invitation moments |
| **Wedding and engagement photographers** | A place to send clients who ask "where do I print these", an optional photo credit on the card back, a client discount, a commission | The engagement photo session is the save-the-date trigger |
| **Family photographers** (Holiday 2027 only) | Same, for fall mini sessions | The holiday card trigger |

Pilot: **10 planners and 10 wedding photographers**, contacted from Feb 2, 2027, only after a physical save-the-date proof exists and has been judged. Family photographers: outreach Jul 2027, only if Holiday 2027 is confirmed.

### 5.2 Offer (CFO to confirm; same structure as 02 so one code table serves both)

- **Client code:** 10% off printed merchandise and add-ons (cards, RSVP and details cards, premium paper). Never on shipping, the mail-for-me fee or postage. No stacking with member discounts or other codes; the larger applies (CFO section 8).
- **Commission:** 10% of merchandise after the discount, on save the dates and invitations.
- **Event Plus free** on any referred order with a printed save the date or invitation, at any quantity (today it is free from 50 cards, CFO section 3). Cost to us is near zero (about $0.50 of email for a 300-guest event, CFO), but it forgoes $14.99 where the couple would have paid.
- **Holiday cards (2027):** codes valid on 50 cards or more only, 10% off and **5%** commission (math below).
- **Sample kit:** one set of printed samples (fictional designs, no faces, 10 cards across 3 themes) plus a one-page partner sheet. About $15 each with shipping (GUESS from the CFO's assumed $0.80 a card print and $7 box). 20 partners: about $300. **Owner approves.**
- **No flat fees** in the pilot. Planners and photographers are businesses who refer per client, not audiences who post.

**Payout math** (CFO section 6 contribution at 50 cards; discount and commission as above; Stripe saving ignored, so slightly conservative):

| Order (50 cards) | Merchandise | Contribution before | 10% off | Commission | Contribution after | Partner earns |
|---|---:|---:|---:|---:|---:|---:|
| Save the date 4x6 | $64.50 | $33.38 | $6.45 | $5.81 (10%) | **$21.12** | $5.81 |
| Invitation 5x7 + RSVP cards | $159.00 | $78.86 | $15.90 | $14.31 (10%) | **$48.65** | $14.31 |
| Holiday 5x7 | $89.50 | $33.21 | $8.95 | $4.03 (5%) | **$20.23** | $4.03 |
| Holiday 5x7 at 25 (for comparison, 10% and 10%) | $49.75 | $16.45 | $4.98 | $4.48 | $6.99 | not offered |

- One couple who orders both at 50 earns the partner about **$20** and leaves us about **$70** of contribution. That is small money for a planner. The pitch is time saved and fewer client mistakes; the commission is a thank-you, and we say so honestly.
- At 25 holiday cards, 10% plus 10% would take 58% of the contribution. Hence the 50-card floor and 5% on holiday.
- If fulfillment's real print quote is $0.30 a card above the CFO's assumption, the 50 save-the-date row drops by about $15 and the offer needs re-checking.

### 5.3 Attribution (wedding orders are months apart)

- Code entered at checkout wins; else the last `ref` click within 30 days (02 section 5). One partner per order.
- **Event-linked attribution (new, proposed):** a save the date and the invitations come 3 to 6 months apart, beyond any 30-day window. When a partner code is used on a save-the-date order, the partner is stored on that couple's event, and an invitation order for the same event within 12 months credits the same partner. **Ask for the CTO and shop engineer:** `partner_id` on the event record as well as the order.
- No commission on a partner's own orders, on refunded or disputed orders, or on codes found on coupon and deal sites (we may void those). A reprint for our error does not claw back commission; a refund does.

### 5.4 Photo credit and copyright

- **Credit line:** an optional "Photo: {Studio name}" in small type on the card back, and on the event page. The customer controls it. When a couple arrives through a photographer's link it is prefilled on, and they can remove it in one tap. We never print it without the customer seeing it on the proof.
- On the event page the studio link carries `rel="sponsored"` when the studio is a paid partner (compensated link). **Ask for the CTO.**
- **Print rights:** the photographer usually owns the copyright in engagement photos and gives the couple a print release. Our upload step should state that the customer has the right to print the photos they upload **[ATTORNEY: wording, and whether our terms and DMCA path cover photographer claims]**. Partner photographers confirm in the partner terms that their standard client release allows printing at GreetHub.
- Partners do not send us client photos. Couples upload their own through the normal flow (consent, moderation, 90-day purge per docs/legal/06).

### 5.5 Disclosure rules (FTC; 02 section 3 applies in full)

Source: FTC, "Disclosures 101 for Social Media Influencers", https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers (read 2026-10-12, via 02). Endorsement Guides 16 CFR Part 255 and the Reviews and Testimonials Rule 16 CFR Part 465 (legal/03 section 2; not re-fetched today).
- **Posts:** any partner post, story, blog or newsletter that mentions GreetHub says "I earn a commission" or "Ad" in the post itself, near the link or code. Platform paid-partnership labels as well, never instead.
- **One-to-one recommendations:** planners tell each client, in writing (welcome packet, email or vendor list), that they earn a referral commission from GreetHub. We require this in the partner terms, stricter than social-media guidance strictly covers. **[ATTORNEY: whether state rules or planner association codes add anything; not researched.]**
- **Vendor lists:** a planner's "preferred vendors" page marks GreetHub as a paid referral.
- No payment tied to a positive review. Partners may not post reviews of GreetHub as if they were customers unless they disclose the relationship.
- Monitoring and enforcement as 02: checked within 72 hours, one fix request, second miss ends the agreement.

### 5.6 Children and partner content

- A partner post about GreetHub must not show any child who is not the partner's own. A family photographer may not use a client's child in a post that promotes GreetHub, even with the client's OK, because that post is our advertising. No-face samples or the partner's own work without children only.
- Flower girls and ring bearers count: no children in wedding-partner posts about GreetHub.
- Nothing in a post may show a couple's full address, a child's name, school or town.

### 5.7 Data partners never get

Partners see a monthly report of: order date, product, quantity band, merchandise net, commission, status. They never get a couple's name, address, photos, guest list, RSVPs or event page link from us. A planner who wants to see RSVPs must be invited by the couple as a co-host. **Not built; ask for the PM** (Phase 3 or later, host-controlled, revocable).

### 5.8 Release rules (reuse by GreetHub)

- Default: we do not reuse partner content in 2027 (rule 0.3).
- If the owner later allows it: a signed release per 02 section 6, plus the photographer's license for the specific images, plus releases from every identifiable adult, no children, 12 months organic, paid as a separate box and fee, takedown within 72 hours on withdrawal. **[ATTORNEY]**

### 5.9 Partner terms checklist (for the attorney; not drafted as a contract)

Code and commission rates, payable products, attribution and event-linking, 30-day hold after shipping, $25 minimum, W-9 before first payout, clawbacks, coupon-site voiding, disclosure duties (posts and one-to-one), the children rule (5.6), no client photos sent to us, print-release warranty (photographers), no use of GreetHub marks beyond the supplied kit, no claims beyond the supplied sheet, termination, US partners only.

## 6. Outreach

- **Public business contact paths only:** the contact form or business email on the partner's own website, the email button on a business profile, a listed studio manager. No personal emails found elsewhere, no scraping directories, no messaging through wedding marketplace inboxes (their terms on solicitation **not checked**, so we stay off them).
- **Commercial email law:** cold business email still needs our physical postal address, a working opt-out and an honest subject line (CAN-SPAM). **[ATTORNEY: confirm; and the owner needs a business mailing address before outreach]**
- One message, one follow-up after 7 days, then stop. Log opt-outs and never contact again.
- Shortlist rules: US, actively booking, own website, no history of undisclosed sponsorships, no franchise-themed work as a speciality. **No list of real businesses is in this repo**; the list is built in Feb 2027 by hand and stored outside git if it holds individuals' names (owner decides where).

**Planner script**
> Hi {first name}, I'm {sender} at GreetHub. We print save the dates and invitations from a couple's own photos, and before anything prints we check the details: a date that doesn't match its weekday, a name spelled two ways, a missing RSVP-by date. Replies from paper and digital land in one list. I'd like to send you a sample set. If it fits your clients, they'd get 10% off and you'd get 10% of the order, which we'd ask you to mention to them. Want the samples?

**Wedding photographer script**
> Hi {first name}, I'm {sender} at GreetHub. Couples often ask where to print their engagement photos as save the dates. We do that, check the date and names before printing, and the couple can add a small "Photo: {studio}" credit on the back. I'd like to send you a sample set. Your clients would get 10% off and you'd earn 10% of their order, disclosed. Interested?

**Family photographer script (Jul 2027, only if Holiday 2027 is confirmed)**
> Hi {first name}, I'm {sender} at GreetHub. After fall sessions, families need holiday cards. We print them from their photos with envelopes included and check the names and the year before printing. Families get 10% off orders of 50 or more and you'd earn 5%. Can I send a sample set?

(Prices and percentages in scripts are placeholders until the owner approves them.)

## 7. Measures (once DATA-003 lands; until then, codes only)

Pin saves and outbound clicks per board; Reel completion and profile taps; partner codes redeemed per partner; orders and contribution per partner; event-linked invitation orders; disclosure compliance rate; time to fix a disclosure; release register count (expected zero in 2027). No guest or recipient data in any of these.

## 8. Asks

**Owner:** approve the offer (10/10 wedding, 10/5 holiday with a 50-card floor, free Event Plus on referred printed orders); sample kit budget (about $300 for 20); the sample-photo rule (0.2 a vs b); physical proofs of a save the date before outreach; attorney review of partner terms, disclosure for one-to-one referrals, print-release wording, CAN-SPAM; a business mailing address; a payout service (none chosen).
**CFO:** confirm payout math against real print quotes; model partners as per-order cost plus a fixed kit line.
**CTO / shop engineer:** `nopin` and `noindex` on `/e/*`; `partner_id` on events for event-linked attribution; code table and checkout field (02 section 8, still not built); credit line slot on card backs and event pages with `rel="sponsored"`.
**Design:** a back-side slot for "Photo: {studio}"; pin and Reel templates for photo-card samples.
**Growth:** product pages with Product schema before product pins; timeline and wording guides to link pins to.
**PM:** co-host access for planners (later phase).
**GC:** the [ATTORNEY] items above.

Not done: no real partner list, no Pinterest Trends search data, no check of Pinterest or Meta AI-label rules (gap from 01), no check of wedding marketplace solicitation terms, FTC page not re-fetched today.
