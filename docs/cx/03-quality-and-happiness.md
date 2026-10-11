# Quality and happiness: how we measure and protect it

Owner: Head of Customer Experience. Coordinated with `docs/data/` (tracking plan `01-tracking-plan.md`, KPIs `04-kpis-and-dashboards.md`, governance `06-data-governance.md`); with legal (`docs/legal/05-policies-draft.md`, `06-product-requirements.md`); with the CFO (`finance/README.md`).

Happiness here means four things, in this order: the customer is not surprised, what arrives looks like what they approved, a problem is fixed fast, and they would do it again.

## 1. Proof-approval flow (the most important screen in the product)

The proof is where we agree with the customer what will be printed. The refund policy excludes anything visible in an approved proof, so the flow must make it hard to approve by accident and easy to catch a mistake. It also has to stay short, or people will click through anyway.

### Today (assessment F-05)

The book proof has a spread viewer and one checkbox ("I've looked at every page and I'm happy to print it") that works without looking at anything. Title and dedication are editable. The price shown excludes postage. There is no AI line, no refund link, no delivery estimate, no spelling check. The card flow has "Looks good", "Change something", "Re-roll" and a preview-only guest state.

### Target flow, book (six moves, about 5 minutes)

1. **Look.** One spread per screen with a counter that tracks pages actually opened: "Seen 9 of 13." Next and Back buttons, thumbnail strip, swipe, keyboard arrows. Zoom on every page. Pages not yet seen show a small dot. Fix-it controls sit beside each spread: "Redraw this page (3 left)" and "Edit the words".
2. **Spelling check card** (appears after the last page is opened, or any time from a link at the top). A short list in the customer's own words: "People: Lee, Grandpa Joe. Pet: Biscuit. Title: Lee and the Night Woods. Dedication: For Lee. Recipient: Lee." Each line is editable in place. Header: "Check the spelling of every name. We print what you see." This is the single most useful defence against the misspelled-name tickets (macros 5 and 6).
3. **Delivery and price summary** inside the same panel: "Hardcover 8.5 × 8.5 in, 24 pages. $39.00 + $5.99 postage. Estimated tax at checkout. Arrives {date_range} to {address_or_choose}." AI line: "The art is AI-illustrated."
4. **Acknowledgement** (verbatim legal text, legal 06 req 39): checkbox "I have reviewed and approve this proof. I understand it's made just for me and the Refund & Reprint Policy applies." with the policy link. Unticked by default. Enabled only after all pages are seen (the counter says why: "Look at 4 more pages to approve"). A skip route exists for accessibility and for repeat orders: "I've looked at it elsewhere", which still records that fewer pages were opened.
5. **Approve.** Button "Approve and add to cart." On click: store timestamp, account id, IP, the hash of every page and the text of the spelling card (legal 06 req 32), generate print files, show "Approved. Your print files are ready."
6. **Safety net after paying.** A configurable **60-minute undo window** after payment before the job is submitted to the printer, with "Change or cancel until {time}" on the confirmation page and email. The window is short enough to keep delivery dates, long enough to catch the immediate "wait, that name is wrong" cases that are otherwise our most common post-print complaint. CTO and printers must confirm this fits (the refund policy already says cancel until "In production"; CX-11 builds the button). If the window is not feasible, say so plainly and rely on steps 1 to 5.

### Target flow, card

Guest: preview only (watermark, low res); "Looks good" and "Change something" stay. For signed-in customers: full-size proof, front and inside flip, spelling card for recipient name and message, acknowledgement, same summary and undo window. Digital cards: the same proof, no delivery line.

### Proof email

The "proof ready" email (transactional only; no promotions, legal 06 req 41) says: "Your book for {recipient} is ready to look through. It takes about 5 minutes. Nothing prints or is charged until you approve." with a single button. A reminder at 3 days if the proof is not approved ("Your book is waiting"), one only; a second at 14 days that mentions the 90-day photo purge (legal requires the 14-day purge reminder, req 26).

### Measures

Proof approval rate, first-pass approval rate, redraw per proof, time on proof, misspelling tickets per 100 books (target under 1), approved-then-complained rate (target under 3 percent). See the metrics table.

## 2. Failure-recovery UX for failed renders

Principle: a failure costs us tokens, never the customer. Payment is after approval, so a failed render never involves money; the risk is lost trust and a lost customer.

| Failure | What the customer sees | What happens automatically | Support |
|---|---|---|---|
| Guest preview fails | "That one didn't draw. Nothing was used from your free preview. Try again." Retry button; the free preview is not consumed | Retry once with the fallback model chain; log | None unless 3 in a row |
| Character sheet fails | Inline panel: "We couldn't draw the characters this time. Your photos and answers are safe." [Try again] | Auto-retry once; if the first photo is likely at fault (moderation, too small, no face), say which and offer to swap the photo | Alert after 2 failures |
| One page fails or QA flags it twice | Tile "Page 7 needs another try" + Try again; the rest of the book continues | Auto re-roll once (already designed); then offer "Skip for now, we'll redraw it free" | Alert if over 20 percent of pages fail |
| Whole job fails | "Drawing stopped. Your finished pages are kept. [Pick up where we left off]" and an email "We're finishing your book" | Auto-resume once; if it fails again page the CTO; support macro 1 | CTO on-call, business hours |
| Render exceeds 15 minutes | Copy changes to "Taking longer than usual. Your pages are safe." | Alert support at 30 minutes; email customer with the new estimate | P1 |
| Moderation blocks a photo or text | Plain reason without accusation: "We can't use this photo (it may not be a clear photo of a person). Try a different one." | Block, quarantine, log | Only if customer writes in; CSAM follows the legal procedure, never a normal reply |
| Upload fails (size, type, network) | Specific line ("That file is HEIC and too large; we'll shrink it") and per-file retry; other files keep uploading | Client resizing and HEIC conversion already exist | None |
| Payment declined | Current copy plus specific reason (expired, security code, funds, bank check); cart and proof persist | Stripe handles retries | None |
| Printer rejects the order | Customer sees "Preparing" with no change; email only if we cannot resolve in 24 hours: "We hit a snag printing {item}. We're fixing it; new date {date}." | Re-submit; fall back to the second printer; alert CTO | P1 |
| Late shipment | Delay email with new date and one-click cancel/refund (legal 06 req 37) | Automatic when promised date is missed | P1 |
| Lost or damaged in transit | Order page "Something wrong? Tell us" opens the claim form with photo upload | Support macros 10 and 11 | P2 |

Rules for every failure: say what is safe; say what we are doing; give one button; say when they will hear from us; never leave a spinner that does nothing; every failure has a reference code (CX-34); every failure is logged with the same code so support can find it.

## 3. In-product feedback widgets

Light, optional, never blocking, and respectful of the rule that no third-party scripts run on creator, proof, cart or account pages (legal 06 req 44, data tracking plan). Use first-party components and the existing `rating_submitted` event.

| Moment | Widget | Question | Event data |
|---|---|---|---|
| Guest card preview ready | Thumbs up/down, small | "Is this close to what you pictured?" Down opens 4 reason chips (style, face, words, other) + free text | `rating_submitted` target=preview |
| Character sheet | Per character "Looks right / Something's off" (exists) | The existing verdict; log the reasons | sheet verdict, redo count |
| Each redrawn page | Thumbs on the new version | "Better?" | `rating_submitted` target=page |
| Proof, after approving | One 5-star tap plus optional line | "How happy are you with this book?" | `rating_submitted` target=proof |
| Order confirmation | None. This is a moment for reassurance, not a survey | | |
| Order page after delivered | Banner "How did it go?" opens the 2-question survey (same as the email) | NPS, "Anything we should fix?" | `survey_responded` |
| Help article footer | "Did this help? Yes / No" | No opens the contact form prefilled with the article name | article id, helpful |
| Any page | Persistent "Help" link (header and footer), not a floating bubble | | |

Rules: ask once per action; never show two prompts on the same screen; a dismissed prompt stays dismissed for 30 days; free text is never sent to third parties; never ask at a moment of stress (right after an error). Reasons use the data team's enum so dashboards can split by model, style and prompt version (`reason_codes` in `survey_responded`).

## 4. NPS and CSAT timing

| Measure | When | Channel | Question | Notes |
|---|---|---|---|---|
| **Post-delivery survey** (NPS plus two CSAT items) | **5 days after the carrier reports delivered** (matches `survey_responded` in the data tracking plan) | Email with a one-click 0 to 10 row, then a short page; mirrored in-product banner on the order page | "How likely are you to recommend GreetHub to a friend?" 0 to 10. Then: "How happy are you with the print quality?" 1 to 5. "How happy are you with the artwork?" 1 to 5. Optional: reasons (chips), free text, "Would you order again?" | Gifts: the buyer is the customer; the recipient is not surveyed |
| **Support CSAT** | When a ticket is resolved, in the closing email | Email | "Did we sort it out? Yes / Mostly / No" (record as 5 / 3 / 1) with a free line | A "No" reopens the ticket and pings the support lead |
| **Proof satisfaction** | Right after approval | In-product (above) | One tap | Predicts complaints; track against the 30-day complaint rate |
| **Day-30 repeat nudge** | Not a survey | Transactional-adjacent email only with marketing consent | | Marketing is separate and opt-in (legal 06 req 41, 42) |

Not before delivery: an NPS ask on a gift that has not arrived measures the carrier, not us. Not more than one survey per customer per 90 days. A customer with an open complaint is not surveyed. NPS is reported with its sample size and not published as a headline under 50 responses.

Handling: a score of 0 to 6 triggers a personal reply within 2 business days (not a form letter). A 9 to 10 gets the review and testimonial ask (next section). Data lands in `survey_responded`, so quality dashboards (Q6) and the repeat-rate KPIs can join it to the creation, style, model and prompt version.

## 5. Reviews and testimonials, with consent

Legal constraints (legal 06 reqs 45 and 46): no fake or AI-written reviews; samples labelled; no sentiment filtering or deletion of genuine reviews; creator disclosures; no children's images unless the parent consents.

**Ask.** Only customers who scored 9 or 10 in NPS and have not had a quality ticket in 30 days. Email 2 days after the survey. One reminder maximum. Subject: "Would you tell others about {recipient}'s {item}?" Two buttons: "Write a short review" (opens the review page on our site or the review platform) and "No thanks".

**Collect.** A review is the customer's own words, plus a star rating, a first name and an initial (never a child's name), city optional. Reviews are not edited except to remove personal data on the author's request or content that breaks the rules; the reason for any removal is logged. Show all genuine reviews, positive and negative; reply publicly to the negative ones.

**Consent for marketing use** (a separate step, never combined with the review itself):
1. Plain checkbox: "GreetHub may quote my review and first name on its website and in ads." Unticked by default.
2. A second, separate checkbox only if we want to show a photo of their finished book: "...and show a photo of my finished book. I confirm anyone shown has agreed, and a parent or guardian has agreed for any child." Unticked by default.
3. Timestamped consent record with the exact wording version; withdrawable at any time by email or in Account; withdrawal removes the item from future materials within 5 business days.
4. Children: never show a child's face or full name from a customer's book without written parent or guardian consent. When in doubt, use the AI-illustrated character, not a photo.

**Surface.** Real reviews on the pricing page and product pages once there are at least 10, with a visible count, average, and date. Until then say nothing; the CMO's rule ("no testimonials until real ones exist") stands.

**Third-party review sites.** Set up a profile only when we can reply within 2 business days; link to it from the thank-you email, with no review gating (no sending unhappy customers elsewhere; that violates platform rules and consumer-protection guidance).

## 6. "Make it right" guarantee and reprint rules

### The promise (customer-facing words)

> **Our promise.** Nothing prints until you've approved it. If it arrives damaged, misprinted, lost, or not like the proof you approved, we'll reprint it or refund you, your choice, and you don't need to send it back. If it's right but not what you hoped, tell us. We'll try to make it right.

This stays inside the legal draft (`docs/legal/05-policies-draft.md`, Refund & Reprint Policy). It adds no new right, so no extra legal exposure. Goodwill remains discretionary.

### Rules

| Case | Remedy | Customer's choice? | Cost to us (24-page book, from CFO inputs) |
|---|---|---|---|
| Cancel before production | Full refund incl. postage | n/a | Tokens sunk (about $1.26 for a book, $0.25 card); Stripe fee not returned (about $0.30 plus 2.9 percent) |
| Damaged, defective, misprinted, torn or missing pages | Reprint or refund | Yes | Reprint: print $12.50 plus ship $5.50 = $18 for a 24-page book; $4.85 for a card; plus a small token amount if art must be re-rendered. Refund: the price and postage paid |
| Damaged in transit | Reprint or refund | Yes | Same; claim against carrier where possible |
| Doesn't match the approved proof | Reprint or refund | Yes | Same; also investigate the printer or file problem |
| Lost (after {lost_days} days past estimate) | Reprint or refund | Yes | Same |
| Late | Tell the new date; wait or cancel for full refund | Yes | Refund only |
| Error visible in the approved proof (misspelled name, odd hand, likeness) | Not covered; **goodwill at the agent's discretion**: top-up redraws, 20 percent discount on a corrected copy, or, rarely, a free corrected copy with owner approval | No | Up to the discount; a free corrected book is about $18 |
| Digital item faulty | Fix, then refund if not fixed | | Small |
| Wrong address the customer gave | Not covered; help redirect; discounted reship as goodwill | | Up to $18 |
| Claim window | {30} days from delivery (draft) | | |

Hard rules for agents: never ask a customer to send back a book worth less than the return postage; never argue about whether something was visible in the proof until the customer's problem has been acknowledged and a path offered; always give both choices (reprint or refund) before asking which; decide within 1 business day of getting photos; if the same account has had three remedies in 12 months, the owner reviews (not to refuse, to learn what is happening).

### Reconciliation with the CFO's assumptions (`finance/README.md`, `Inputs`)

| Item | Legal draft | CFO model | CX position | Action |
|---|---|---|---|---|
| Refund rate | Full refund on cancel, late (customer choice), non-shipment; refund as one choice for defects | 3 percent of revenue (GUESS), token cost sunk | Plausible if most defect claimants choose reprint; if they choose refund the rate rises. Pre-production cancellations are cheap (tokens plus Stripe fee) | CFO: keep 3 percent; model Stripe fee on refunds as non-returned |
| Reprint rate | Reprint or refund for defect, transit damage, mismatch, lost | 4 percent of printed items (GUESS), at print plus shipping cost | Consistent. Combined remedy rate 7 percent of printed items means about 1 in 14 items; printers advertise defect rates well under 2 percent, carriers lose or damage 1 to 2 percent, so 7 percent leaves room for mismatch claims | Hold 7 percent as the ceiling; alarm at 5 percent in any month |
| Goodwill (discount, extra redraws, rare free reprint) | Discretionary, not a right | Not modelled | Real cost; I budget 1 percent of revenue | CFO: add a goodwill line, 1 percent of revenue, to Inputs section 5 |
| Re-roll allowance | Within allowance; "monthly" | 20 percent extra renders; token cost $0.06 per 2K render | 5 free redraws per month plus 2 free sheet redos and free redraws for pages we flag is affordable: worst-case redraw cost per active user per month about $0.30 | Keep; Data tracks Q3 and Q4 against 20 percent |
| Support labour | n/a | $25 per month plus $0.90 per order | Holds up to about 27 contacts per 100 orders (02 doc section 8) | Revisit at 600 orders per month |
| Claim window and "lost" days | [30] and [N] days | n/a | I recommend 30 days after delivery and lost = 10 days past the estimate (standard) | Owner and attorney to confirm; fill both into the policy, macros and articles |
| Cancel point | Until "In production" [confirm timing with printers] | n/a | A 60-minute undo window before submission makes the policy simple to say and enforce | CTO and printers to confirm |
| Proof evidence | Approval hash stored (legal 06 req 32) | n/a | Needed to defend "visible in approved proof" decisions and chargebacks | CTO: CX-05 |

One discrepancy worth flagging: the CFO's reprint line is priced per printed item, but a reprint of a book may also need re-rendering pages (if the cause is a file defect). Assume 10 percent of reprints need a partial re-render at about $0.50; immaterial, but the Reprint cost per SKU should include the print file regeneration.

### Remedy budget (what I will manage against)

Total remedy cost (refunds, reprints, goodwill) at or below **8 percent of printed-item revenue** (3 + 4 + 1). If it exceeds 8 percent for a month, the weekly review goes to root causes first: printer defect, prompt or model change, unclear proof, or a spike from one campaign.

## 7. Metrics and targets

Definitions follow the data team's KPI catalogue (`docs/data/04-kpis-and-dashboards.md`; ids in brackets). Targets are for the first 90 days after launch; I have no actuals yet, so they are my starting commitments, to be reset after 100 orders. All figures are medians unless stated. The mock environment cannot measure latency; the render times below are from the CTO's measured per-call latency (about 16 s per 2K image) plus queueing.

| Metric | Definition | Target (first 90 days) | Alarm | Source |
|---|---|---|---|---|
| **Time to first preview** (guest card) | `creator_start` to `guest_preview_rendered` | p50 under 60 s, p90 under 120 s | p90 over 180 s | Time to proof (04 doc) |
| **Time to character sheet** (book) | `photos confirmed` to sheet ready | p50 under 90 s, p90 under 3 min | p90 over 5 min | Q-series |
| **Time to full proof** (book) | `render started` to last page done | p50 under 8 min, p90 under 15 min | p90 over 20 min | Time to proof |
| **Guest preview to account** | `signup_complete` / `guest_preview_rendered` | 25 percent | below 12 percent | B-series funnel |
| **Brief to proof completion** | creations with proof / `brief_completed` | 70 percent | below 50 percent | B5 |
| **Proof approval rate** | creations with `proof_approved` / creations with proof viewed [B5_proof_approval] | 65 percent | below 45 percent | B5 |
| **First-pass approval** | approved with no redraw and no sheet redo [Q7_approval_without_reroll] | 45 percent | below 30 percent | Q7 |
| **Sheet redo rate** | sheet versions beyond first / creations [Q4] | under 35 percent of books | over 50 percent | Q4 (best upstream predictor) |
| **Re-roll rate** | user re-rolls / art pages shown [Q3] | 20 percent (CFO planning figure) | over 35 percent or under 5 percent (people not looking) | Q3 |
| **Auto re-roll rate** | pages auto-redone / pages [Q2] | under 15 percent | over 25 percent | Q2 |
| **Proof to cart** | `cart_item_added` / `proof_approved` [C2] | 90 percent | below 75 percent | C2 |
| **Cart to purchase** | purchase / checkout_start | 60 percent | below 40 percent | funnel |
| **Contact rate** | support tickets per 100 orders [S1_contact_rate] | under 20, then under 15 | over 27 (labour model breaks) | S1 |
| **First response time** | `first_response_minutes` [S2] | median under 6 business hours, 90 percent in SLA | below 80 percent in SLA | support_ticket_resolved |
| **One-contact resolution** | tickets solved in one agent reply plus confirmation | 70 percent | below 50 percent | ticket tags |
| **CSAT (support)** | share Yes or Mostly (4 to 5) | 90 percent | below 80 percent | `support_ticket_resolved.csat` |
| **CSAT (print quality)** | share 4 to 5 on the post-delivery item | 90 percent | below 80 percent | `survey_responded` |
| **CSAT (art quality)** | share 4 to 5 | 85 percent | below 75 percent | `survey_responded` |
| **NPS** | (9 to 10 minus 0 to 6) / n, post-delivery | 50 or higher, shown only when n at least 50 | below 30 | `survey_responded` |
| **Survey response rate** | responses / sent | 25 percent | below 12 percent | |
| **Remedy rate** | reprints + refunds (excluding pre-production cancels) per 100 printed items [F3] | at or under 7; alarm at 5 for investigation | over 8 | F3 |
| **Remedy cost** | refunds, reprints, goodwill / revenue | at or under 8 percent | over 10 percent | CFO line |
| **Misspelling tickets** | per 100 books | under 1 | over 2 | tagged |
| **On-time delivery** | delivered by promised date [F1] | 95 percent | below 90 percent | F1 |
| **Orders needing attention** | printer rejects or stuck jobs / orders [F2, F4] | under 3 percent | over 6 percent | F2 |
| **Repeat purchase within 90 days** | customers with a second order within 90 days / customers with a first | 12 percent (the CFO's 0.35 orders per customer per year implies about 9 percent of customers a quarter; I aim higher because books and cards are occasion-driven) | below 6 percent | R1 repeat rate |
| **Successful orders per week** | the data team's north star (`NSM_funnel`): delivered, no refund, reprint or quality ticket within 30 days | growth week on week; at least 90 percent of paid orders | below 85 percent | NSM_funnel |
| **Review score** | average star rating, with count | 4.6 or higher | below 4.3 | review page |
| **Deletion and takedown SLA** | removal actioned within 48 hours; deletion confirmed within 30 days [P1] | 100 percent | any miss | P1 |

How we protect them (the levers, in priority order): (1) character sheet approval before pages (exists); (2) the proof flow above; (3) automatic QA tuned on actual defects (Data's roadmap `05-model-improvement-roadmap.md`); (4) clear delivery estimates; (5) fast, kind support; (6) the undo window; (7) the weekly review that turns top causes into backlog tickets.

### Ownership with the data team

- **Event names:** use those in `01-tracking-plan.md` (`rating_submitted`, `survey_responded`, `support_contact_created`, `support_ticket_resolved`, `content_report_submitted`, `proof_viewed`, `proof_approved`). I request two additions: `proof_page_seen` (count of distinct pages opened before approval) and `proof_spelling_edited` (the spelling card changed a field). Both are first-party and anonymous, with no photos or names in the payload.
- **Support taxonomy:** align the helpdesk categories to the data enum: order_status, quality, refund, billing, account, privacy_request, takedown, bug, other, with my sub-tags (cause, remedy) as a second field. Stage when contacted uses the data enum (pre_purchase, creating, proof, post_payment, fulfillment, delivered).
- **Dashboards:** CX owns D9 (support and refunds) and the weekly quality review; the data team builds it. Link every quality-coded ticket to the creation's prompt version and model, so quality complaints can be traced to a change.
- **Privacy:** the helpdesk body text stays in the helpdesk (data plan). Surveys carry no photos. Free text is reviewed by a human and never sent to a model without a data-processing agreement.

## 8. Cadence

- **Daily (10 minutes):** inbox zero, any P0 or P1, any render alert.
- **Weekly (30 minutes):** metrics table, top 5 ticket causes, one fix per cause, update macros and articles, add tickets to the CTO's backlog, review every remedy given.
- **Monthly:** targets versus actuals, remedy budget, NPS verbatims read aloud, usability session (04 doc) if any big change shipped.
- **After every incident:** a five-line note: what happened, who was affected, what we did, what we change, whether we owe customers an email.
