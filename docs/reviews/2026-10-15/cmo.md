# CMO review, 2026-10-15

Read: PLAN.md (B1-B14, Christmas go/no-go, Things to supply, CMO/Growth/Social sections), docs/cmo/*, brand/README.md, docs/social/*, docs/growth/*, app/public. Labels: SOURCED = cited in docs/market; GUESS = mine, unverified. All sizes S (under 1 day), M (1-3 days), L (3+ days) of writing/production, not engineering.

## 1. Done vs. plan

| Plan item | Status |
|---|---|
| Brand kit applied, voice rules | Done (brand/README.md, site copy follows it) |
| Site copy: home, card, book, pricing, FAQ, empty states, errors, microcopy | Done, in docs/cmo/site-copy.md and mostly in app. Needs a price re-check (CFO proposals: books +$5, mailed card $8.99, digital book $9.99 are not approved) |
| UX spec, intake question bank | Done (ux-spec.md, intake-questions.md) |
| 12 templates, 26 style presets | Specified (templates.md). Only 1 template render exists (big-birthday-1200.webp); 26 style sample JPGs now exist in app/public/styles (not yet reviewed by me against the brand or IP log) |
| Real-artwork brief (B10) | Specified (templates.md s3). NOT produced: hero, 12 covers, sample book, product-in-hand photos. Blocked on owner cap (~$35 total ask, B10 share under $10) |
| Marketing plan, paid-spend gate, budget split | Done and re-based 2026-10-12. Gate is not met; paid is January by default |
| channel-assumptions.csv | 6 rows. Only Google CPC ($4.14) and Meta CPC (~$0.87) are SOURCED-secondary; every CTR and conversion rate is GUESS. Blended CAC ~$70 is a guess on a guess |
| Membership landing page (B13) | Copy done (membership-landing.md), claims checked 2026-10-14. Stays off until GREETHUB_MEMBERSHIP=1 and attorney review |
| Photo cards and events positioning (B14) | Done (photo-events-positioning.md): names, 12 themes, campaigns, email timing. Prices are CFO proposals, not approved |
| Transactional emails | Drafted: order confirmed, proof ready, shipped, plus 4 optional (site-copy s7). Not wired (Resend key, domain, B1 missing) |
| Marketing/lifecycle emails, SEO pages, social posts, ads briefs, press, referral | Planned as bullets only. Almost no finished copy. This is the gap the owner is asking about |

Not done in my lane: Black Friday competitor promo check (due ~Nov 1, Market intel owns the data; I need the output). Stale competitor prices (Minted, Vistaprint Nov 2022; Paperless Post out of date) must be labelled dated or removed from any public line (decision 5).

## 2. Inventory of missing marketing assets

Owner column = who writes (agent role). "Now" = can start today; "Blocked" = needs the owner decision named. Everything here is draft copy; nothing publishes until its gate clears.

### A. Site copy and landing pages
| Asset | Owner | Size | Depends on | Status |
|---|---|---|---|---|
| 12 occasion pages (Christmas card, Christmas book, Hanukkah card, Thanksgiving thank-you, birthday Mom/Grandma/kids, new baby, Valentine's, Mother's Day, sympathy, teacher): H1, 150-250 words, 10 message ideas, FAQ, meta | Growth, CMO voice review | L (12 x S/M) | Real art per page; Keyword Planner export for ordering | Draft text: now. Publish: blocked on art (cap) and domain |
| Christmas cut-off banner and cut-off copy (Nov 15), "order by" strings from config | CMO | S | Owner approves cut-offs (book Dec 2, card Dec 10 proposed; photo cards Nov 30 vs Dec 5, decision 4) | Blocked on owner |
| After-cut-off gift copy: digital book and e-card | CMO | S | Digital book $9.99 approved; product live | Blocked on price |
| Sample-book page and flip-viewer captions (fictional family) | CMO | M | Sample book render (cap) | Blocked on cap |
| Waitlist / invite-code landing page and thank-you page | CMO | S | Soft-launch mechanism (allowlist vs code), consent record | Now (copy); build waits on B1 |
| Help center articles (how the proof works, order-by dates, photos and privacy, reprints) | CMO with Support/CX | M | Policies approved (reprint window, decision 6) | Mostly now; privacy article waits for attorney wording |
| Trust page: "what happens to your photos" in plain words | CMO with Privacy ops | S | Attorney answers Q1-Q13, 90-day purge confirmed | Blocked on attorney |
| /membership, /photo-cards, /assistants refresh against final prices | CMO | S | Price approval | Blocked on owner |
| About / founder story, footer, company details, support address | CMO | S | Legal name, postal address, domain, mailbox (owner input 7) | Blocked on owner |

### B. Launch and lifecycle emails (all marketing sends need consent record, one-click unsubscribe, postal address, own sending subdomain, from B1/Resend; none exist yet)
| Email | Trigger and timing | Size | Notes |
|---|---|---|---|
| Invite / soft-launch invite | Owner sends to allowlist, ~Nov 2-6 (GUESS date) | S | Plain text, from a person |
| Welcome 1: "Your preview" | On guest preview with opt-in; immediate | S | |
| Welcome 2: "How the proof works" (replaces dead "re-rolls" email) | +2 days | S | |
| Welcome 3: occasions you might be planning | +6 days | S | Needs reminder data classification (children's birthdays) before saving dates |
| Abandoned draft / cart | +1h and +24h; one only after that | S | Pixel/consent rules in marketing-plan s5 |
| Proof ready, order confirmed, shipped | Transactional | Done | Wire only |
| Delivered, then "make another" | Delivered +2d for cards; survey = later of delivered +5d and occasion +2d (CX) | S | |
| Late / needs-attention / delay notice | Event-driven (Support owns macros) | S | Transactional, no promotion |
| Review/testimonial request | After delivered and gift opened; consent line for quotes | S | Customer research owns script |
| Christmas order-by series (Nov 20 open, Dec 1, last-3-days, cut-off day) | Dates read from config, never typed | M | Photo-card series already drafted (photo-events-positioning s6) |
| Win-back (60-90 days, one send) | Post-holiday, Jan 10 | S | |
| Birthday/occasion reminders (14 days before) | Engine for repeat | M | Cut from launch; attorney/Data first |
| Valentine's and Mother's Day campaigns (start Jan 10 / Apr 1) | Calendar | M each | |
| Plus trial: day 1, day 10, trial-ending, cancelled | Per trial state | M | Blocked until membership is on |
| Account deleted, data export ready | Transactional | S | Drafted |

Subtotal: roughly 14 emails to write, M overall (~3 days). Can start now. Sending is blocked on owner input 7, Resend key, and B1.

### C. Social post series (all organic; no paid until gate clears)
| Channel | Series | Size | Notes |
|---|---|---|---|
| Pinterest | 6 holiday boards, 60 type-only message pins (no kid faces, no AI art needed), then 12 Valentine's pins by Dec 15 | M | Lead holiday channel; 6-8 week window means start now. Rich Pins need product pages with real images |
| Instagram | 12-post launch grid, 8 reels scripts: "make a card in 2 minutes", behind-the-proof, "write 3 lines, get a book" | M | Fictional families only; no real customer content |
| TikTok | 10 scripts (founder voice, screen recordings, proof walk-through) | M | Organic only; paid CAC is the worst row (GUESS) |
| Facebook | 6 evergreen posts for grandparent audience | S | Low priority |
| Seasonal arcs | Thanksgiving thank-you (Nov), Christmas, Hanukkah (Dec), New Year, Valentine's (Jan 10), Mother's Day (Apr 1), Father's Day, grad, back to school | L total | One content calendar, S each season |
| Community | Reply/moderation macros (no child names, schools) | S | Social owns |

### D. Ads briefs (build only; do not run before the gate)
Meta (12 concepts x 3 audiences per plan), Pinterest promoted pins, Google (brand + 15 exact terms, ad copy, negatives), TikTok Spark brief, retargeting set, Christmas last-week digital-gift ad. Size M for all, ~2 days. Starts now as text; creative blocked on art. Rule: no real child's face in any ad.

### E. Press / PR
Founder story and 1-page fact sheet (S), press kit with fictional sample book (M, blocked on art), 3 pitch angles: AI done honestly / privacy for kids' photos / handwriting (S), list of 30 parenting, gift and local outlets (S, uses web research), HARO-style responses for gift-guide season (ongoing). Pitching before Nov 13 go/no-go would overpromise: hold until the soft launch has shipped real orders. GUESS: gift guides close early-to-mid November for Christmas, so 2026 coverage is unlikely; aim at Valentine's.

### F. Referral
"Give a card, get a card" program copy, share page text, email, terms (M). Blocked: needs promo-code table and partner attribution (shop engineer), cut from launch scope. Creator program is specified (docs/social/02) but seeding is gated; first wave for Valentine's unless the gate clears by Nov 10.

### G. Partnerships
Outreach scripts for creators (done in social/02), pitch decks for: photographers and planners (weddings 2027), preschools/teachers (teacher thank-you), family and new-baby bloggers, gift-shop and retail (kiosk is research-only). Size M. Blocked on a proof in hand and real art.

### H. Brand assets
| Asset | Owner | Size | Depends on |
|---|---|---|---|
| Hero pile, 12 template covers, occasion tiles | Design, CMO review | M | Cap |
| Sample book (6 spreads) | Pipeline, CMO review | M | Cap, text-only identity path |
| 6 product-in-hand photos | Owner orders proofs, CMO shot list | M | Proofs by Nov 3 |
| Social templates (Canva-style, brand tokens), pin and story templates | Design | M | None |
| Email template shell (header, button, footer) | CMO / Shop | S | Domain |
| Style guide v1 for partners (voice, AI labelling, children's rules) | CMO | S | None |
| Trademark search and filing for GreetHub | Owner + attorney | S | Attorney (not mine to do) |
| Share image variants, favicon set, app icons | Design | S | None |
| AI-labelling line ("illustrated with AI, written from your words") | CMO with Legal | S | Attorney review |
| Review of 26 style samples against brand and IP | CMO | S | Now |

### I. Photo cards and events
Holiday 2026 email, in-app banner and help article (S, drafted outline), 6 holiday theme cards copy (done), Gooten order-by copy (blocked decision 4), Phase 2 save-the-date and invitation pages (wait for Feb/May, no work now), wedding Pinterest boards (M, can start), landing page waitlist line on no-go (S, drafted, owner to approve). Photo cards stay 30 orders; do not market them beyond the email.

## 3. Recommended order, next 30 days (soft launch: invite-only, no paid, no creator seeding)

Week 1 (Oct 15-21): review the 26 style samples (S); finalise the invite email and waitlist/invite-code page copy; write welcome 1-3 and abandoned-cart; start Pinterest boards (30 type-only pins); occasion page drafts for Christmas card, Christmas book, Hanukkah, Thanksgiving. Ask owner for the art cap, domain, mailbox, attorney. Inputs from Market intel: Black Friday check.
Week 2 (Oct 22-28): finish all 12 occasion page drafts; cut-off banner copy ready for approval (Oct 24 go/no-go decides photo-card copy); Christmas email series; Instagram grid and TikTok scripts; email shell. Render hero + 12 covers the day a cap is set.
Week 3 (Oct 29-Nov 4): sample book render and CMO review; product-in-hand shot list ready for the proofs arriving Nov 3; help articles; 6 more Pinterest boards. Pin and publish type-only pages only.
Week 4 (Nov 5-14): invites out (~Nov 2-6 if B1-B6 hold); delivered/make-another and review request emails; press fact sheet; Valentine's pages published by early December so they index; Nov 13 gate decides whether Christmas books are promised.
Order principle: copy that needs no art and no decision first; art next; anything that talks to customers last. Christmas 2026 revenue from marketing is a stretch in any case (SEO pays from ~Feb 2027, Growth).

## 4. Risks and decisions needed from the owner

Risks
- Art cap not set: the whole page and press side stays empty. Top trust gap in market/CX.
- Gate dates: if B1-B6, proof and attorney are late, Christmas books are not sold and every holiday asset becomes a January asset.
- CAC is a guess: only two CPCs are sourced; conversion is untested for a $45 book needing photo upload and consent. Do not let the CFO treat the CSV as sourced.
- Over-promising on AI and privacy: no "no training" claim until vendor ZDR is confirmed; no "better than other AI books" claim.
- Email: no consent, unsubscribe or domain exists; sending marketing before they do breaks CAN-SPAM/Gmail rules.
- A Lulu 40-page minimum (unverified, market/02) would change every "24 or 32 pages" line; confirm before creative production.
- Kids' faces: pinned/ad/social policy is "none"; creators need written releases.

Decisions / asks (owner)
1. Art spend cap (suggest ~$35 total, B10 share under $10) and OpenRouter limit.
2. Production domain, support mailbox, company legal name and postal address.
3. Approve prices (books +$5, card $8.99 with postage, digital book $9.99, photo cards $1.99/$1.79/$1.59) and Christmas cut-offs; photo-card order-by Nov 30 vs Dec 5.
4. Soft-launch mechanism (allowlist vs code) and whether email capture is allowed on a waitlist page.
5. Order physical proofs by Nov 3 (product-in-hand photos).
6. Keyword Planner export and Search Console access.
7. Engage an attorney (AI label, photo wording, sympathy page, membership, trademark).
8. Approve fictional-only sample policy and no-kid-faces-in-ads rule.

Needed from teammates: Design for art; Shop for email wiring, consent store, promo codes; Market intel for Black Friday and cut-off dates; CFO for approved prices; Support for macros.

Numbers: nothing here is a new figure. All CAC/CPC are as in the CSV (see Section 1 for sourced vs guessed). Dates for invites and gift-guide closes are guesses.
