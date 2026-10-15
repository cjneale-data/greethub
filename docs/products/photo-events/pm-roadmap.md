# Photo cards and events: PM roadmap

Product manager, 2026-10-14. Sources: `docs/products/photo-cards-and-events-plan.md`, `docs/PLAN.md` (B1–B12, Christmas gates), `docs/finance/photo-events-pricing.md` (CFO proposal, print costs assumed). No other wave 1 output existed yet. All targets are proposals for the owner.

**Overriding rule:** the book and folded-card launch (Nov 13 and Nov 20 gates) outranks photo cards. A contested engineer-day goes to the main launch.

## 1. Oct 24 go/no-go: Christmas 2026 photo cards

All ten must be "yes". Any "no" or "not known" = **no-go**: Phase 1 moves to Holiday 2027 and the team starts Phase 2 in January.

| # | Criterion | Owner |
|---|---|---|
| 1 | One flat 5x7 printer confirmed (envelopes, API submit, US ship); an order placed Dec 5 arrives by Dec 22 by ground; test order accepted | Fulfillment, CTO |
| 2 | CFO prices ($1.99 / $1.79 / $1.59 a card at 25 / 50 / 100, $6.99 shipping) give ≥ 25% contribution at the real print quote (CFO re-prices if print > $0.95 a card at 50) | CFO; owner approves |
| 3 | Attorney engaged and committed to written Q1–Q13 answers by Nov 13. Photo cards inherit B11: no real child's photo before them | General counsel; owner engages |
| 4 | B1 persistence on the preview, or committed by Oct 28 | CTO, Security |
| 5 | Collage engine renders 3 layouts to a 5x7 print PDF with 0.125 in bleed and a per-slot DPI check; vitest green in mock mode | Card engineer |
| 6 | Book photo intake (upload, HEIC, moderation, consent, purge) reused with no new data store | Book engineer, Privacy ops |
| 7 | CTO signs that Phase 1 fits Oct 27–Nov 21 without delaying B1–B7 or B11 | CTO, PM |
| 8 | 6 templates (front + back) designed and IP-checked | Head of Design, IP safety |
| 9 | Physical proof orderable by Nov 10, in hand by Nov 20 | Fulfillment; owner orders |
| 10 | Batch reprint and typo policy drafted (who pays for the customer's own typo x 100) | Support, GC; owner approves |

**If go, Nov 20 ship gate** (with the folded-card gate): proof in hand and judged, Q1–Q13 answered, STRICT e2e green on the photo-card path, printer sandbox routine passed. Miss = no photo cards in 2026.

**PM read:** odds are low. As of Oct 13 nothing is durable, there is no printer sandbox and no attorney. Plan for no-go; treat go as upside.

## 2. Scope

### Phase 1: holiday photo cards (soft launch, order-by Dec 5 if go; else Holiday 2027)

Invite-only (main soft-launch allowlist), cap 30 orders, lower 48, ship to me only.

| Story | Acceptance criteria |
|---|---|
| I pick one of 6 templates (1-up, 3-grid, hero + 2) for a flat 5x7 front | Loaded from the design JSON spec; screen and print PDF come from one layout module |
| I upload 1–4 photos into the slots | Book intake reused: consent tick first, moderation, HEIC, private storage, 90-day purge. Center crop with manual pan, zoom, swap |
| I'm warned about small photos | Effective DPI < 200 warns; < 150 blocks approval |
| I add a greeting and family name | 8 written greetings or my own; brand and handwriting fonts; overflow blocks approval |
| The back is simple | One fixed back: "from" block, year, optional photo |
| I approve exactly what prints | Full-size proof with bleed and safe lines; checks: year is 2026, family name spelled the same everywhere; "I checked names and dates" tick required |
| I order 25, 50 or 100, shipped to me | CFO band prices read from the price config; blank envelopes in the box; one printer order; Dec 5 cut-off from config |
| Support fixes a bad order | B7 reprint and refund work on a batch line, with audit log |

### Phase 2: save the dates (build from Jan 5, launch about Feb 2, 2027)

Starts after the Valentine's launch (about Jan 12) and its order-by (about Jan 30), so the two don't compete for engineers.
- Flat 5x7 or 4x6 postcard, 1–3 photos. *Accept:* proof checker flags a weekday that doesn't match the date and any past date.
- QR to the couple's site. *Accept:* the printed proof's QR scans to the entered, validated URL.
- CSV address import. *Accept:* column mapping, USPS validation, households, per-row fixes, saved and deletable lists, never used for marketing.
- Free recipient and return addressing; mail-for-me. *Accept:* postage at cost shown before payment; undeliverables reported per recipient.
- Digital version. *Accept:* same design as an image and a share link.
- Full CFO quantity ladder (10–300). Holiday 2027 cards reopen Oct 1 with addressing and mail-for-me.

### Phase 3: invitations and RSVP (build from Mar, launch about May 2027)

- 5x7 invitation, optional details card. *Accept:* proof checker requires date, weekday, time, venue, and an RSVP-by date before the event.
- Event page `/e/<slug>`, unlisted, optional password. *Accept:* attending, party size, meal, note; no guest account; Security's rate limits and spam checks pass.
- Host dashboard. *Accept:* counts, who hasn't answered, CSV export, reminders per the CFO's Free/Event Plus split.
- Paper, digital or both. *Accept:* one design; a printed QR replaces the paper RSVP card.
- Deletion. *Accept:* the host deletes the event and all RSVPs; retention per Privacy ops.

## 3. Dependencies

| Need | Owner | By | Blocks |
|---|---|---|---|
| B1 persistence (store, storage, RLS) | CTO, Security | Oct 28 | Everything |
| B4 card flow (approval page, `layoutCard`, real `creationId` in cart) | Card engineer | Nov 7 | Phase 1 proof and cart pattern |
| B6 print path (signed URLs, preflight, webhooks, submit) | Shop, CTO, Fulfillment | Nov 14 | Phase 1 submission to the new printer |
| B11 before real photos | Privacy ops, Book engineer, GC | Nov 13 | Any real child's photo |
| B7 ops minimum; B12 fonts in print | Shop, CX, Card engineer | Nov 20 | Phase 1 support and sign-offs |

Wave 1 outputs needed **by Oct 22**: Fulfillment printer pick (criteria 1, 9), CTO architecture (7), Design template spec (8), Book engineer intake reuse (6), CFO pricing at the real quote (2); collage engine (5) by Oct 24. **By Nov 7:** Shop batch cart with tiers only, CX editor and proof UX, Data tracking events; QA test plan by Nov 14. Security, T&S, GC, Privacy ops and IP safety gate each phase on its new data: photos (1), third-party addresses (2), public event pages and guest data (3).

## 4. Not in 2026

Mail-for-me; printed addresses; address book or contacts import; save the dates; invitations; event pages and RSVP; magnets, foil, premium paper, folded or square cards; AI backgrounds, illustrated portraits, photo ranking, the letter writer; face-aware crop; quantities other than 25/50/100; member batch discounts; Express; outside the lower 48; paid ads, creator seeding or SEO pages for photo cards; kiosk; the AI-assistant channel.

## 5. Success metrics

A phase goes public only if its primary metric and every guardrail hold over ≥ 20 orders (Phase 1) or ≥ 50 (Phases 2–3). Head of Data defines the events.

| Phase | Primary | Guardrails |
|---|---|---|
| 1 | Proof-to-order ≥ 40% of started designs | Reprint or complaint ≤ 3%; 0 reprints from a missed check; ≥ 95% delivered by Dec 23; ≤ 20 contacts per 100 orders; contribution ≥ 25% at real print cost; 0 consent, privacy or IP incidents |
| 2 | ≥ 50 orders in the first 6 weeks; mail-for-me on ≥ 15% | Import success ≥ 90% of rows; undeliverable ≤ 2%; postage collected matches postage paid within $1 an order; no addresses in logs or analytics |
| 3 | RSVP response ≥ 70% of invited guests | Abuse reports ≤ 1 per 100 events; reminder bounce ≤ 2%; enumeration test passes; guest data deleted on schedule |

**Experiment rule:** ship only if the variant beats control on its one named primary metric at the pre-set minimum detectable effect and no guardrail gets worse. At soft-launch volume most tests are underpowered; then decide on usability findings and say so.

## 6. Conflicts with the CFO proposal (owner decides)

| CFO | Roadmap | Proposed resolution |
|---|---|---|
| Free addressing on every order | Not in 2026 | Keep it as the Phase 2 price. Phase 1 blank envelopes lift a 25-card order from about $16 to about $20 contribution |
| Free AI background ($0.08) | Not in 2026 | Phase 2 at the earliest, after an eval exists |
| 10–200 in 5 bands | 25 / 50 / 100 | Phase 1 uses three CFO bands; full ladder in Phase 2 |
| Member batch discounts (10% / 15%) | None in 2026 | Memberships are off in production; revisit in Phase 2 |
| ~70% of holiday orders land Dec 1–10 | Order-by Dec 5 | Phase 1 will be small, which suits a 30-order soft launch; Holiday 2027 opens Oct 1 |

## Owner asks

Printer account and sandbox keys once Fulfillment picks; approve Phase 1 prices and the batch reprint policy; engage the attorney and add photo-card and address-data questions; order the photo-card proof; make the Oct 24 call.
