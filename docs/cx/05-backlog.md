# CX backlog for the CTO

Owner: Head of Customer Experience. Sizes: **S** under 0.5 day, **M** 0.5 to 2 days, **L** 2 to 5 days, **XL** over 5 days (split it). References: F-xx = findings in `00-assessment.md`; Standards = `01-ux-ui-standards.md`; Support = `02-support-model.md`; Quality = `03-quality-and-happiness.md`.

All UI tickets are done only when they meet the "definition of done for a screen" in the standards (390 and 1280 widths, all states, keyboard and axe pass, US spelling).

## Status, re-checked against the running app 2026-10-12 (mock mode, 1280 and 390 px, axe)

- **Done:** CX-21 skip link and `main` target on every layout (Progress name was done by QA). CX-32 404 only (branded, header, footer, ways out; 500, offline and expired-link pages still open). CX-03 stale Mother's Day badge removed (the dated promo config is still open). CX-19 in full: persimmon-deep links and ghost buttons, plus `--gh-control-border` #8C7B6E on every control border and cocoa-70 placeholders (Head of Design decision, 2026-10-13). The legal-page banner contrast is fixed too. WCAG 2.5.3 label fixes: brief "Add" buttons, logo links, proof "Back".
- **Partly done:** CX-12 confirmation now shows the order number and never greets by email handle (the summary, delivery range and "what happens next" lines are still open). CX-06 has a "Redo the sheet" label, but I did not verify that the gating works. CX-29: "ZIP code" is done; "Mum" is still an intake enum value and the "Mum, You Did It" template title is unchanged (card engineer and CMO).
- **Not started (still S1):** CX-01 real imagery, CX-02 placeholder legal and company text (footer and DMCA block show `[PLACEHOLDER]` on every page, and legal pages show a "Draft placeholder" banner), CX-04 server-side delivery range, CX-05 proof "Seen X of N" and spelling card, CX-08 tax line, CX-09 AiNote, CX-11 cancel, CX-31 help and contact (no `/help` or `/contact`; every contact path is `mailto:hello@greethub.example`, a domain that cannot receive mail), CX-34 reference codes.
- **New, from other teams' findings:** CX-44 (S1) the proof shows the dedication, but the print file leaves it out (book engineer). Until it prints, hide it from the proof. CX-45 (S1) a derived "delivered" status. Real orders stop at "shipped", so the post-delivery survey (Quality s4) and the claim-window clock never start (shop engineer). CX-46 (S2) a signed-in card path. "Looks good" still shows the sign-up wall after sign-in (card engineer, M3b).
- **Axe false positive:** the footer logotype "hub" (#EE5A36 on cream, 2.86:1) is a logotype, which WCAG 1.4.3 exempts. QA should exclude it from `a11y.mjs`.

## Must-fix before launch

### CX-01 Real product imagery (F-01, F-17) | L | CMO + CX
Replace all striped placeholders with real art: 12 template covers, one sample spread per art style (same scene in six styles), hero cards, the Eye Story sample book (only after signed releases, legal 06 req 47), "AI-illustrated" label on each.
Acceptance:
- Home, browse and the book style picker show real generated images, not stripes or flat swatches.
- Each style tile has an alt text describing the picture; every image carries or sits next to the AI label.
- No image is a real person's photo unless a signed release exists.
- Page weight of home under 1.5 MB on mobile (responsive images, lazy loading).

### CX-02 Remove placeholder legal and company text (F-02) | M | CTO + owner + attorney
Acceptance:
- No customer-visible string contains "[", "placeholder", "draft", "docs/legal", ".example", or a version label like "2026-10-draft-1" (add a CI grep).
- Footer shows real legal name, postal address, support email on every page (legal 06 req 50).
- Terms, Privacy, Acceptable Use, Refund & Reprint, Accessibility pages render the attorney-approved text.
- Report content is a form (reason, link or order number, "this involves a child", email, optional photo), sends to the monitored mailbox, shows "We aim to reply within 48 hours", and fires `content_report_submitted`.
- DMCA agent details present.

### CX-03 Remove stale promo and unproven claims (F-03) | S | CMO + CTO
Acceptance:
- Promo badge is driven by a config with start and end dates and defaults to hidden.
- No "free shipping" text unless the price config says so.
- A claims-file check: every number or promise on the site (delivery days, "free", "ships") links to an evidence entry (legal 06 req 13).

### CX-04 Delivery estimate from real data, carried end to end (F-04) | L | CTO
Acceptance:
- Estimate is a date range ("Arrives Oct 21 to 25") computed server-side from printer production plus carrier time per shipping method; the browser-side `earliestDeliveryDate()` is removed.
- Shown in cart, checkout (per recipient), confirmation page, confirmation email, order page, shipped email; stored on the order as the promised date (legal 06 req 36).
- Dates in plain format ("Oct 25"), never ISO.
- "By a date" refuses unreachable dates with a clear message before payment.
- If an estimate moves, send the delay email with one-click cancel and refund (legal 06 req 37).
- Express shows its range.

### CX-05 Proof approval flow (F-05) | L | CTO + CX
As designed in Quality section 1.
Acceptance:
- A "Seen X of N" counter; approval enabled only when all pages (or the card's two sides) have been opened; the reason is shown beside the disabled button.
- Spelling card listing every name, title, dedication and recipient, editable in place; edits update the proof.
- Verbatim acknowledgement text from legal 06 req 39 with a working Refund & Reprint link; unticked by default.
- Summary shows price, postage, "plus tax", delivery range, and "The art is AI-illustrated."
- On approval, store timestamp, account id, IP, page hashes, spelling-card contents (legal 06 req 32).
- Events `proof_viewed`, `proof_page_seen`, `proof_spelling_edited`, `proof_approved` fire with no personal data.
- Keyboard arrows move between pages; swipe on touch; zoom on every page.
- The card flow gets the same acknowledgement and spelling card.

### CX-06 Character sheet verdict must matter (F-06) | S | CTO
Acceptance:
- If any character is marked "Something's off", the primary button becomes "Redo the sheet" and the note field is focused; "Looks right, draw the book" is disabled with the reason beside it.
- All characters "Looks right" required to draw.
- Verdicts and notes are logged for Data (Q4).

### CX-07 Consent screen refinements (F-07) | M | CTO + CX
Acceptance:
- Two required boxes remain verbatim (attorney); the "What happens to your photos" expander lists the five points; the privacy link opens the real Privacy page section.
- "Withdraw consent and delete photos" uses the branded modal, not `window.confirm`.
- "Delete all my photos for this book" visible at all times on the Photos step, with the 90-day deletion date shown.
- The dev sign-in toast and "Demo mode" badge cannot render when `GREETHUB_MOCK_AI` is off (test).

### CX-08 Price and tax clarity (F-08) | M | CTO
Acceptance:
- Every price line reads "Book $39.00 + $5.99 postage".
- "Standard (included)" is replaced with "Standard postage" and the amount; Express shows price and range.
- Cart and checkout show estimated tax once the address is known (Stripe Tax preview) or the line "Plus sales tax, shown before you pay" with the final figure on the last step; no screen shows a "Total" that later changes without saying so.
- Book proof shows price plus postage.
- Pricing page states estimated delivery range and redraw allowance.

### CX-09 Shared AI note (F-09) | S | CTO
Acceptance: an `AiNote` component ("The art is AI-illustrated.") appears on the book proof, confirmation, order page, browse, and in order emails; Playwright asserts it on each.

### CX-11 Cancel from the order page (F-11) | M | CTO
Acceptance:
- "Cancel order" visible while the order is Paid or Preparing (before production, and during the undo window if built); confirm modal states the refund amount and "within 7 business days".
- After production starts the button is replaced by "Get help with this order" and a sentence explaining why.
- Cancel calls Stripe refund and the printer cancel API, updates status, sends an email, fires an event, and appears in the admin log.

### CX-12 Confirmation page (F-12) | S | CTO
Acceptance:
- Greeting uses the first name only if known; otherwise "Thanks. We're on it." Never an email handle.
- Shows order number, items with recipients, total paid, delivery range, and three "what happens next" lines.
- One primary action ("Track this order"); a "Change or cancel until {time}" line when the undo window exists.
- Confirmation email carries the same content.

### CX-13 Account wall expectation (F-13) | S | CTO + CMO
Acceptance: the book form's first panel says a free account is needed for photos and answers are kept; a "Sign in" link at the top; the gate message is the one in the UX spec; answers survive sign-in.

### CX-14 Step names and current-step style (F-14) | S | CTO
Acceptance: steps are Idea, Photos, Story, Characters, Pages, Proof, panel headings match; the active chip uses the same selected style on every step (step 1 included); `aria-current="step"` set.

### CX-15 Error messages and summary (F-15) | M | CTO + CX
Acceptance:
- Every validation message says what to do (copy list supplied by CX in the ticket); none repeats a label or says only "Required".
- Submit with errors moves focus to an error summary with links; fields have `aria-invalid` and `aria-describedby`; summary is `role=alert`.
- Applies to brief, consent, checkout, account, report and contact forms.

### CX-16 Long-wait pattern for renders (F-16) | M | CTO
Acceptance:
- Estimate in words from rolling median ("About 8 minutes"), the "We'll email you when it's ready" line shown with the address, tiles open large on tap.
- At 15 minutes the copy changes and a Contact link appears; at 30 minutes an alert goes to the support inbox and the customer is emailed.
- The proof-ready email is sent and tested; a reminder email at 3 days and the purge reminder at 14 days exist.
- Returning customers resume at the correct step; Drafts shows "Drawing" or "Ready to review".

### CX-19 Colour contrast token fixes (F-19, F-20, F-22, F-23) | M | CTO + CMO sign-off
Acceptance:
- Add `--gh-control-border #8C7B6E` and use it for inputs, selects, chips, checkboxes, switch tracks, dropzones; twine stays for hairlines.
- Placeholders use cocoa-70; cocoa-40 is used only for disabled and decorative.
- Links and ghost buttons on cream or tinted fills use persimmon-deep.
- No text under 24px bold sits on `#EE5A36`.
- A contrast test in CI checks every token pair listed in the standards; axe reports zero contrast violations on home, browse, creator, cart, checkout, account.
(CMO: this changes a brand-kit token's use; I am approving it as UX owner and ask the CMO to update `brand/README.md`.)

### CX-20 Visible focus (F-21) | S | CTO
Acceptance: global `:focus-visible { outline: 3px solid #C8441F; outline-offset: 2px; }`; the 4px tint ring kept as decoration; focus is never clipped or hidden under sticky bars (`scroll-margin`); recorded keyboard walk of home, creator, checkout.

### CX-21 Landmarks, skip link, semantics (F-24, F-25) | M | CTO
Acceptance:
- "Skip to content" first in the tab order on every layout; `main` landmark present.
- Single-select chips are `radiogroup` with arrow keys; filters are not tabs; Chat/Form are real tabs with panels.
- `Progress` has an accessible name; action toasts persist until dismissed.
- Screen reader pass (VoiceOver + NVDA) on the card, book and checkout flows; results recorded in the Accessibility page.

### CX-26 One shell for all pages (F-30, F-42) | M | CTO
Acceptance:
- Card and book creators use the same header and footer as shop pages (cart icon included); the header collapses to logo, cart, menu at 390px; no two-row wrapped nav.
- Checkout may use a reduced header but keeps the footer.
- Mobile creators and checkout hide the tab bar and show a sticky bottom action bar.

### CX-25 One persimmon moment (F-29) | S | CTO + CMO
Acceptance: header "Start a card" is cocoa except on the logged-out home; every page has at most one persimmon primary; a visual regression screenshot of the 10 main pages is reviewed by CX.

### CX-29 US spelling and words (F-35, F-36) | S | CMO + CTO
Acceptance: "Mom", "Personalized", "ZIP code", State dropdown of states, "×" in dimensions, "Add another card or book" in the cart; a lint grep for "Mum", "Personalised", "Postcode", "colour", "recognise" across `app/` and `docs/cmo/` passes.

### CX-31 Support path in the product (F-38) | L | CTO + CX
Acceptance:
- `/help` shows the 15 articles from `docs/cx/help-articles/` (rendered from markdown) with search and "Did this help?"; a "Help" link in header and footer.
- `/contact` form: topic, order picker (for signed-in users), message, up to 3 photos (10 MB each), email; emails to `support@`, creates a ticket id, shows the SLA ("We'll reply by {time}"), sends the auto-reply.
- "Get help with this order" button on the order page opens the form prefilled.
- Footer "Contact" opens the form (with a visible support email as well).
- Event `support_contact_created` fires (category and stage from the data enum).
- The admin view described in Support section 11 exists (lookup, timeline, refund, reprint, cancel, resend email, lock or delete).

### CX-32 Branded 404, 500, offline, expired link (F-39) | S | CTO
Acceptance: on-brand pages with header, footer, a way home and a way to get help; error pages show a reference code (CX-34); expired sign-in link has "Send a new one".

### CX-33 Payment decline specifics and cart survival (F-40) | M | CTO
Acceptance: Stripe decline codes map to plain messages (expired, security code, funds, bank check, generic); cart, address and approved proof persist after a decline, tab close and 3-D Secure failure; the fake payment screen is unreachable when Stripe keys are set (test).

### CX-34 Reference codes for errors and support (F-41) | S | CTO
Acceptance: every system error toast and error page shows "Ref GH-XXXX"; the code appears in server logs and in the contact form's prefilled message; no personal data in the code.

### CX-35 Accessibility automation (all F-19 to F-28) | M | CTO
Acceptance: axe-core runs in the Playwright e2e on 12 pages at 390 and 1280; the build fails on serious or critical violations; reports saved as artifacts.

### CX-36 Template, style and product copy sweep | S | CMO
Acceptance: all 12 template titles, style names and the new copy reviewed against the voice; "Mum, You Did It" renamed; one exclamation mark maximum per screen verified.

## After launch (first 30 to 90 days)

### CX-10 Gift handling (F-10) | L
Gift message printed on a card insert or packing slip; no price on the packing slip; optional email to the recipient "Something's on its way"; address collected from the recipient by link. Acceptance: tested with 3 gift orders; consent for emailing a third party reviewed by the attorney (data plan flags recipient data).

### CX-17 Style picker and "kept on device" note polish (F-17) | S
Acceptance: the note is small grey helper text, not a badge; style tiles show real samples (depends on CX-01).

### CX-18 Empty states with next actions (F-18) | S
Acceptance: cart, drafts, orders, people, filters and search follow the empty-state pattern in the standards.

### CX-22 Touch targets to 44px (F-26) | S
Acceptance: header actions, footer links and inline text links in lists have a 44px hit area on coarse pointers; measured by a script in CI.

### CX-23 Reduced motion coverage (F-27) | S
Acceptance: card flip, TemplateCard tilt hover and toast animations respect `prefers-reduced-motion`; verified by a Playwright run with the media feature on.

### CX-24 Alt text for generated art (F-28) | M
Acceptance: each page's one-line scene description (from the page prompt) is stored and used as alt; proof tiles and thumbnails use it.

### CX-27 Browse nav and orphan button (F-31) | S
Acceptance: only the current section is highlighted; "Start from a blank page" is a full-width tile or button row aligned with the grid.

### CX-28 Mobile tab bar icons (F-32) | S
Acceptance: four line icons plus the raised Create button, active tab has a bar and label, 48px hit areas, safe-area padding.

### CX-30 Account polish (F-37) | S
Acceptance: "Email me when a proof is ready" becomes a plain sentence; version labels are hidden unless they are real; People, Drafts and Addresses empty states done.

### CX-37 Undo window before printing | L
60 minutes (configurable) between payment and submission to the printer, "Change or cancel until {time}" on the confirmation and email; the order enters "Preparing" and cancel stays enabled. Acceptance: printer sandbox submission occurs after the window; delivery estimate includes it; edit-name flow creates a new proof; the refund policy text is updated to match.

### CX-38 Feedback widgets and surveys (Quality sections 3 and 4) | M
Previews, pages, proof ratings, post-delivery survey 5 days after delivery, support CSAT in the closing email, help-article "Did this help?". Acceptance: first-party only; events per the tracking plan; no widget on cart or checkout pages; dismissals persist 30 days.

### CX-39 Reviews and testimonial consent (Quality section 5) | M
Review collection page, consent boxes (separate and unticked), consent record, withdrawal path, public display after 10 reviews. Acceptance: legal sign-off; no editing of reviews except on author request or rule breaks (logged).

### CX-40 Render time estimate from live data | M
Rolling median per product and per size shown to customers; alert when p90 passes targets. Acceptance: estimate within 30 percent of actual on 80 percent of books.

### CX-41 Usability test round 1 and fixes | M
Run the plan in `04-usability-test-plan.md`; create tickets from the findings; retest after S1 fixes.

### CX-42 Photo tips in the upload step | S
Inline tips and a quality check on upload (face visible and large enough) with a friendly "this photo may not work well" message. Acceptance: a bad-photo fixture triggers the message; no face recognition, only a quality check that does not identify anyone (legal 06 req 10).

### CX-43 Help center search and article analytics | S
Search over articles; log queries with no result to refine content.

## Needs from the owner

Decisions and inputs to unblock launch.

1. **Budget.** A monthly support budget (suggest $10 to $50 per month at launch: Workspace seat about $7, optional Help Scout $22 from month 3 to 6) and a December contractor allowance (about $400 for 10 hours a week for 4 weeks, optional).
2. **Real company details.** Legal name, postal address, support email (`support@`), privacy email (`privacy@`), report mailbox, DMCA agent. Set up SPF, DKIM and DMARC on the sending domain so sign-in and shipping emails land in inboxes.
3. **Support hours.** Approve Mon to Fri 9 to 5 Eastern, closed on U.S. federal holidays, with the seasonal weekend checks described in Support. Name a backup person with inbox access.
4. **Policy numbers.** The claim window (draft says 30 days), "lost" threshold (recommend 10 days past the estimate), cancel cut-off (recommend 60-minute undo window), refund timing (7 business days). Attorney to confirm and finalise the Refund & Reprint Policy so the pages, macros and articles use the same numbers.
5. **Refund and reprint authority.** Approve my limits: agents decide up to $60 per order; owner above that, for repeat claimants and suspected fraud. Approve the goodwill budget of 1 percent of revenue (CFO to add the line).
6. **Photo-related legal items.** Sign-off on the consent wording, the 90-day purge, vendor zero-data-retention status (docs/legal/06 req 8), and the CSAM procedure. Until these are done, only synthetic photos can be used in testing and demos.
7. **Brand token change.** (Done 2026-10-13: the Head of Design approved the tokens and they are applied. The CMO still needs to update `brand/README.md`.) Approve the two accessibility tokens (`--gh-control-border`, placeholder colour) and the cocoa header CTA; the CMO updates `brand/README.md`.
8. **Sample content.** Approve generating and publishing the 12 template covers and 6 style samples; decide whether the Eye Story goes live (needs signed releases).
9. **Testing.** Approve a $400 to $500 usability test budget (recruitment incentives plus panel fees) and a live-adapter staging environment with a small image-model spend cap for it.
10. **Phone number.** Confirm there is none at launch (recommended), and say so in the FAQ.
11. **Launch go or no-go gate.** I recommend all Must-fix tickets above plus a passing usability round (04 doc) before real customers or real children's photos.
