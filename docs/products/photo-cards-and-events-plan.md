# Photo cards and events: holiday photo cards, save the dates, invitations

Owner request, 2026-10-14. Status: plan, wave 1 started (each agent's first deliverable is listed in section 8).
Sources for market facts are listed at the end; agents verify and extend them in their own docs.

## 1. Why these three, and why they're different

Everything GreetHub sells today is one card, or one book, for one person, drawn by AI from a story. These three products are the opposite on almost every axis:

| | Today's cards and books | Holiday photo cards, save the dates, invitations |
|---|---|---|
| Picture | AI illustration from a brief | Mostly **the customer's own photos**, in a designed layout (collage) |
| Quantity | 1 (sometimes a few) | **25 to 200 identical cards** per order |
| Recipients | One person | **A list**: family, friends, wedding guests |
| Format | Folded 5x7 card, hardcover book | Mostly **flat 5x7 cards** (one or two sided), plus small inserts |
| Deadline | Birthday or occasion | **Hard, seasonal**: mid-December for holidays, 6 to 8 months before a wedding for save the dates, 6 to 8 weeks before for invitations |
| What makes it good | The art and the words | **Photo quality, layout, typography, no typos in names and dates**, envelopes and addressing |
| Digital | E-card | **Event page with RSVP** is now expected for invitations (Paperless Post, Evite, Zola) |

So the work is mostly new product plumbing (photo layouts, batch quantities, address lists, envelopes, RSVPs), with AI used where it removes effort: picking and cropping photos, writing the greeting or the annual letter, catching typos and date mistakes, optional illustrated backgrounds and an optional illustrated family portrait.

## 2. How people make these today (and what that means for us)

**Holiday photo cards.** Families pick 1 to 4 photos from the year, choose a template on Minted, Shutterfly, Artifact Uprising, Zazzle, Vistaprint or Canva, add "Merry Christmas from the Riveras" and the year, and order 25 to 150. The standard is a **flat 5x7 card** (A7, envelopes included), often double sided with more photos or a short letter on the back; foil and premium paper are the upsell. Typical price is roughly **$1.50 to $3 per card** before postage (single listings: Zazzle around $1.44 to $1.99, Pinhole Press $1.99; one reviewer paid $2.28 each for 50 Minted 5x7s). Minted now includes **free recipient address printing** on envelopes, so addressing is table stakes. Postage is a real cost to the sender: a Forever stamp is $0.78 in 2025; square cards cost more.
*For us:* flat 5x7 first, photo layouts with 1 to 4 photos plus a back side, quantity pricing, envelopes always included, return address and recipient address printing, and a hard order-by date. "Mail them for me" (we address, stamp and mail each card) is the convenience leap over ship-to-me.

**Save the dates.** Couples send them 4 to 8 months before the wedding (6 to 12 for destination weddings). Formats: **5x7 or 4x6 flat card or postcard**, and **magnets** (about 3x5 to 4x6, kept on the fridge). Usually one engagement photo or a small collage, names, date, city, and the wedding website (now often a QR code). Many couples also send a digital version.
*For us:* flat 5x7 and 4x6 postcard first, magnet as a later printer-dependent add-on, QR to the couple's website or our event page, digital save the date with the same design.

**Invitations.** The suite is a **5x7 invitation** (A7 envelope), an **RSVP card** (3.5x5 or 4x6, sometimes a postcard) and a **details card** (about 4x6), sent 6 to 8 weeks out; casual events (birthdays, showers, parties) skip the suite. Digital invitations with **RSVP tracking** have taken a large share: Paperless Post charges per guest (about $0.22 to $0.30 per premium send), Evite has a free ad-supported tier and paid tiers by guest count, Zola bundles RSVP with its wedding website.
*For us:* a 5x7 invitation with optional RSVP and details cards, and from day one a **digital event page with RSVP** (guest list, meal choice, plus-ones, reminders), which also replaces the paper RSVP card for most people.

## 3. Product scope and sizes (v1 unless marked later)

| Product | Print sizes | Sides | Photos | Batch | Extras |
|---|---|---|---|---|---|
| Holiday photo card (Christmas, Hanukkah, New Year, "Season's greetings") | Flat 5x7 (A7 env.). Later: folded 5x7, 5x5 square | 1 or 2 | 1 to 4 front, up to 6 back | 10 to 200 | Year-in-review letter on back; return address; recipient addressing; mail-for-me |
| Save the date | Flat 5x7, flat 4x6 postcard. Later: 4x6 magnet | 1 or 2 | 1 to 3 | 10 to 300 | QR to website or event page; digital version |
| Invitation (wedding, birthday, shower, party, graduation, holiday party) | Flat 5x7 invitation; RSVP 3.5x5 (A1/A2 env.) or 4x6 postcard; details 4x6 | 1 or 2 | 0 to 3 | 10 to 300 | Digital event page + RSVP; meal choices; reminders |

Print spec for every flat card: 300 DPI, 0.125 in bleed, 0.25 in safe area, PDF from the pipeline (same `layout` module as today's card). Paper and finish options (matte, pearl, recycled; foil later) depend on the printer (section 6).

## 4. How GreetHub does it

**4.1 Photo collage editor (new core).** A template is a layout of **slots** (photo, text, art) on a page of a given size. v1 layouts: one full-bleed photo, 2-up, 3-grid, 4-grid, hero plus two, polaroid stack; back side: photo strip, letter, "from" block. The editor:
- auto-places photos (faces kept in frame: face or attention-based crop), lets people pan/zoom and swap, and **warns when a photo is too small for print** (effective DPI per slot below ~200);
- sets text in the brand fonts and in the **8 handwriting styles** (and the member's own handwriting and signature, Plus perk) for the sign-off;
- offers designed backgrounds and, optionally, an **AI-illustrated border or backdrop** in one of our 27 styles (the existing pipeline; one render, ~$0.06);
- optionally an **illustrated family portrait** from photos (the book likeness pipeline; consent rules as books). Later phase.

**4.2 Photos.** Reuse the book photo pipeline: private storage, upload with downscale and HEIC, moderation (CSAM block, nudity, violence), **consent tick for photos of children**, and the 90-day purge after the order is final. Holiday cards are full of children: the attorney questions on minors' photos (B11) apply here too.

**4.3 AI help (where it saves effort, never where it risks the order).**
- "Pick my best photos": rank uploads by sharpness, faces, eyes open; suggest a layout.
- Greeting and annual-letter writer (the existing "Write it for me", with the membership quota).
- **Proof checker**: names spelled consistently, date matches the day of the week ("Saturday, June 14, 2027"), venue and time present, RSVP-by date before the event, year on holiday cards. Shown as warnings before approval.
- Optional AI background art and illustrated portrait (above).

**4.4 Address book and recipients (new core).** Import from CSV, Google Contacts, Apple vCard; household names ("The Riveras"); USPS address validation; per-list and per-recipient edits; save lists ("Holiday 2026", "Wedding guests"). Uses: printed **recipient addresses on envelopes**, **return address** on the back flap, **mail-for-me** drop-ship to each recipient, and the **guest list** for RSVPs. Personal data of third parties: strict privacy handling (section 7).

**4.5 Batch orders and delivery.** Cart lines get a quantity (10 to 300) with volume pricing. Two delivery modes:
- **Ship to me**: all cards and blank or addressed envelopes in one box (one printer order).
- **Mail for me**: we print, address, stamp and mail each card (one printer job per recipient, or a mailing partner). Postage passed through at cost.
Order-by dates are enforced per mode and product, with a visible countdown in December.

**4.6 Digital event page and RSVP (invitations, save the dates).** Each event gets a page (`greethub.com/e/<slug>`, unlisted, optional password): the design, details, map link, registry/website links, RSVP form (attending, party size, meal choice, note), and a host dashboard (responses, export CSV, reminder emails, "who hasn't answered"). Invitations can be paper, digital, or both from the same design; RSVP cards can point to the page by QR.

**4.7 Membership tie-in.** Card Club and Plus perks extend naturally: own handwriting on envelopes and sign-offs, saved address lists, a member discount on batch orders (CFO to set), free digital event pages for members.

## 5. Phases and dates

Christmas 2026 is the hard one: the launch plan already gates cards on Nov 20 and order-by Dec 10. Holiday photo cards are only worth attempting if a flat-card printer is confirmed by **Oct 24**.

- **Phase 0, now to Oct 24: decide.** Printer capability (flat 5x7, envelopes, addressing, per-recipient mailing, Christmas cut-offs), pricing, legal on minors' photos and address data, template set, architecture. **Go/no-go for Christmas 2026 on Oct 24.**
- **Phase 1, holiday photo cards (Christmas 2026 if go, else Holiday 2027).** Flat 5x7, 1 to 4 photo layouts plus back, quantity 10 to 200, envelopes, return address, **ship to me only**, recipient addressing if the printer supports it. Soft launch, order-by about Dec 5.
- **Phase 2, Jan to Mar 2027: save the dates.** Peak wedding planning season. Flat 5x7 and 4x6, QR, digital save the date, address book with import, **mail for me**.
- **Phase 3, Mar to Jun 2027: invitations.** 5x7 suite with RSVP and details cards, digital event page with RSVP, guest list, reminders. Party and shower invitations at the same time (shorter lead times, digital-first).
- **Later:** magnets, foil, folded holiday cards, illustrated family portraits, the AI-assistant channel ("send our holiday cards to the usual list"), kiosk photo cards.

## 6. Printing and mailing (the biggest unknown)

Today: Prodigi (folded 5x7 cards) and Lulu (books). Needed: **flat 5x7 and 4x6 cards with envelopes, optional printed addresses, and either one bulk box or per-recipient mailing.** Candidates to check: Prodigi's flat card and postcard SKUs; Gooten flat cards; mailing platforms with print-and-mail APIs (Lob, PostGrid, Thanks.io: postcards, notecards, US/Canada addresses, postage included). Fulfillment and the CTO compare quality, cost per card at 25/50/100, envelope and addressing support, per-recipient mailing cost, API fit, proof turnaround and December cut-offs, and recommend a primary and a backup by Oct 24.

## 7. Risks

- **Christmas timing**: a new printer integration plus a collage editor in six weeks is aggressive; Phase 1 is deliberately small and ship-to-me.
- **Typos at scale**: a wrong date on 150 save the dates is a disaster. Proof checker, a forced full-size proof, and a reprint policy specific to batch orders.
- **Third-party personal data**: address books and guest lists are other people's data; minimal retention, clear deletion, never used for marketing, no selling, export on request.
- **Children's photos**: the same consent and attorney gating as books.
- **Abuse**: invitations and event pages as spam or phishing vehicles; RSVP form spam; offensive photos.
- **Margin**: postage and envelopes on low-price cards; quantity pricing must cover per-order setup and proofs.

## 8. Who does what (wave 1 started 2026-10-14)

Each agent writes its first deliverable to its own file (no shared-file edits in wave 1, so work runs in parallel without conflicts). Engineers build in new folders only.

| Agent | Part in the project | Wave 1 deliverable |
|---|---|---|
| **Product manager** | One roadmap, acceptance criteria, phase gates, Oct 24 go/no-go criteria | `docs/products/photo-events/pm-roadmap.md` |
| **CTO** | Architecture: data model (template, slot, design, recipient list, batch order, event, RSVP), render path, printer/mailing adapters, sequencing | `docs/cto/photo-events-architecture.md` |
| **Head of Design** | Layout templates, sizes, typography (incl. handwriting fonts), back sides, suite coordination, print specs | `docs/design/photo-events-templates.md` + template JSON spec |
| **Card engineer** | Collage layout engine: slots, auto-crop, DPI check, render to print PDF at each size | `app/lib/collage/` (new, with tests) |
| **Book engineer** | Reuse of photo intake (upload, consent, moderation, purge) for photo cards; illustrated family portrait feasibility | `docs/book/photo-intake-reuse.md` |
| **Shop engineer** | Address book, CSV/vCard import, validation, batch quantities, envelopes, ship-to-me vs mail-for-me in cart and checkout | `app/lib/recipients/` (new, with tests) + `docs/shop/batch-orders.md` |
| **Integrations** | Google/Apple contacts import (OAuth scopes), event page links, later the AI-assistant channel | `docs/integrations/contacts-import.md` |
| **Fulfillment** | Printer and mailing-partner comparison, envelopes, addressing, December cut-offs, proof and reprint process for batches | `docs/ops/photo-events-printing.md` |
| **CFO** | Quantity pricing, unit economics per card and per order, postage pass-through, member discounts | `docs/finance/photo-events-pricing.md` |
| **Finance ops** | Sales tax on printed cards and postage, mailing-partner reconciliation | `finance/ops/photo-events-tax-and-postage.md` |
| **Market intel** | Teardown of Minted, Shutterfly, Artifact Uprising, Zazzle, Vistaprint, Canva, Zola, Paperless Post, Evite: formats, prices, features, gaps | `docs/market/03-photo-cards-and-events.md` |
| **Customer research** | Interview and survey plan: recent holiday-card senders and engaged couples | `docs/research/photo-events-research-plan.md` |
| **Head of CX** | UX of the collage editor, address import, proofing, RSVP host dashboard; accessibility | `docs/cx/07-photo-events-ux.md` |
| **CMO** | Positioning, product names, template themes, seasonal campaign | `docs/cmo/photo-events-positioning.md` |
| **Growth** | SEO and landing pages ("Christmas photo cards", "save the dates", "wedding invitations"), email timing | `docs/growth/photo-events-seo.md` |
| **Social & partnerships** | Pinterest and Instagram plan for holiday and wedding season; wedding-planner and photographer partnerships | `docs/social/photo-events-plan.md` |
| **General counsel** | Minors' photos, third-party address and guest data, USPS mail rules, event-page terms; attorney questions | `docs/legal/photo-events-legal.md` |
| **Privacy ops** | Retention and deletion for photos, address books, guest lists, RSVPs; export | `docs/privacy-ops/photo-events-data.md` |
| **Security** | Address-book PII protection, upload abuse, RSVP/event page spam and enumeration, rate limits | `docs/security/photo-events-threats.md` |
| **IP safety** | Photo moderation thresholds, logos and characters in uploaded photos, template originality | `docs/legal/photo-events-ip.md` |
| **Trust & safety** | Abuse of invitations and event pages (spam, phishing, harassment), report flow | `docs/trust-safety/photo-events-abuse.md` |
| **Head of Data** | Events and KPIs (photos per order, proof edits, batch size, RSVP rate), consent tiers for guest data | `docs/data/photo-events-tracking.md` |
| **Model evals** | Evals for photo ranking, auto-crop, proof checker, AI backgrounds | `docs/evals/photo-events-evals.md` |
| **QA** | Test plan: collage rendering at every size, batch checkout, addressing, RSVP flows | `docs/qa/photo-events-test-plan.md` |
| **DevOps** | Image processing load (batch renders), storage growth, email deliverability for RSVPs and reminders | `docs/ops/photo-events-infra.md` |
| **Support** | FAQ, order-by dates, batch typo and reprint policy drafts, macros | `docs/support/photo-events-faq.md` |
| **Kiosk lead** | Whether in-store holiday photo cards fit the kiosk concept (research only) | `docs/kiosk/photo-cards-fit.md` |
| **Board director** | No wave 1 work; log contributed time as usual | none |

**Wave 2** (after the Oct 24 decision): engineers build Phase 1 against the CTO's architecture and the design spec; the PM merges wave 1 outputs into the build order in docs/PLAN.md.

## Sources

- 5x7 standard and holiday card pricing: [Printkeg 5x7 guide](https://www.printkeg.com/blogs/tips/5x7-photo-greeting-cards-for-photographers), [Zazzle listing](https://www.zazzle.com/256197044102531608), [Pinhole Press](https://www.pinholepress.com/jingle-baby-announcement), [Printkeg holiday cards](https://www.printkeg.com/products/holiday-cards)
- Minted addressing, foil and postage: [Business Wire, Nov 2025](https://www.businesswire.com/news/home/20251125728710/en), [Minted postage guide 2025](https://www.minted.com/lp/holiday-card-postage-rates), [Minted foil](https://cf.minted.com/foil-pressed-holiday-cards), [The Penny Hoarder](https://www.thepennyhoarder.com/save-money/holiday-greeting-cards/)
- Save the dates: [Zola](https://zola.com/expert-advice/topic/invites-paper/save-the-dates), [GotPrint](https://blog.gotprint.com/?p=8182), [PaperDirect](https://www.paperdirect.com/blog/2012/04/save-the-date-postcards-vs-save-the-date-magnets/), [Vistaprint magnets](https://www.vistaprint.com/stationery/save-the-date-magnets)
- Invitation suites: [Shutterfly envelope sizes](https://www.shutterfly.com/ideas/envelope-sizes/), [The Knot](https://www.theknot.com/content/our-top-wedding-invitation-tips), [CatPrint](https://blog.catprint.com/post/cheat-sheet-common-wedding-suite-sizes), [Paperlust](https://paperlust.co/blog/?p=11538)
- Digital invitations and RSVP: [Carly: Evite vs Paperless Post](https://www.usecarly.com/blog/evite-vs-paperless-post/), [RSVPify](https://rsvpify.com/top-paperless-post-alternatives/), [Joy](https://withjoy.com/blog/12-best-paperless-post-alternatives/)
- Print and mail APIs: [Thanks.io](https://www.thanks.io/), [Thanks.io FAQ](https://thanks.io/faq/how-does-thanks-io-work), [Thanks.io comparison](https://thanks.io/compare), [Gooten flat cards](https://www.gooten.com/print-on-demand/flat-cards/), [TOG flat cards](https://TOG.ink/Flat-Cards/index.cat)
