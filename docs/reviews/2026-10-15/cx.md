# CX committee review, 2026-10-15

Head of CX. Sources: docs/PLAN.md, docs/cx/ (backlog status last re-checked against the running app 2026-10-12). I did not re-walk the app for this review, so statuses below are the 10-12 re-check plus later docs. Not verified today.

## 1. Done vs plan

Plan stop condition item 4 needs usability round 1 passed or waived in writing (CX). It has not run.

Delivered (all in docs/cx/):
- Assessment with 42 findings, with 1280 and 390 px screenshots in screens/.
- UX and UI standards, support model, quality and happiness plan, usability test plan.
- Backlog (CX-01 to CX-46) and a member portal review.
- Photo cards and events UX spec (07), proposed only, not built or walked.
- 15 help articles.

Shipped by engineers and verified 10-12:
- Skip link and `main` on every layout (CX-21).
- Branded 404 (CX-32, 404 only).
- Stale promo badge removed (CX-03, partly).
- Contrast and control-border tokens (CX-19, full).
- WCAG 2.5.3 label fixes.
- US spelling "ZIP code" (CX-29, partly).

Partly done:
- Confirmation page shows the order number (CX-12).
- Character sheet "Redo the sheet" label exists (CX-06); I have not verified that it gates anything.

Not started, all launch blockers (S1):
- CX-01 real imagery (commit d9957cc added rendered art; I have not re-verified the CX-01 acceptance).
- CX-02 placeholder legal and company text on every page.
- CX-04 server-side delivery range.
- CX-05 proof approval flow.
- CX-08 tax line.
- CX-11 cancel.
- CX-31 help and contact (no `/help`, no `/contact`; `mailto:` points to a dead domain).
- CX-34 reference codes.
- CX-44 dedication shows in the proof but is not printed.
- CX-45 no derived "delivered" status, so the survey and claim clocks never start.

## 2. Open customer-facing items

- **UX fixes:** the S1 list above. Also CX-46 (signed-in card path still hits the sign-up wall), CX-13 account wall expectation, CX-15 error summary, CX-16 long-wait pattern for renders, CX-26 one shell (creator pages lose footer and tab bar), CX-33 decline specifics.
- **Help articles:** the 15 exist, but they have no home. They need `/help` (CX-31) and search (CX-43). Articles 10, 11, 13 and 14 hold policy numbers (claim window, lost threshold, cancel cut-off, refund timing) that are still drafts. Add articles for photo cards (proof checker warnings, envelopes, postage, order-by dates) and events (RSVP, guest data) once the specs ship.
- **Videos:** none exist. I propose two short captioned screen-capture clips (making a book, reading your proof) after the proof flow is stable. Captions and transcripts are required by the standards.
- **Error codes:** CX-34 (short reference code on every error and in the support form) is not started. Without it, support cannot find the order or the failed step. It is a small ticket (S) with a large payoff.
- **Accessibility:**
  - Axe false positive on the footer logotype "hub": QA should exclude it.
  - CX-35 a11y automation is not in CI.
  - Open S2/S3 items: touch targets to 44px (CX-22), alt text for generated art (CX-24), tab bar icons (CX-28).
  - No screen-reader pass and no assistive-technology user in a test yet.
- **New animated home page:** I found no animated home page in the repo or the working tree (the last home change is d9957cc, sample art). I cannot assess it and will not guess. When it lands, I will check:
  - `prefers-reduced-motion` (CX-23 is only partly covered today).
  - Pause control for any motion over 5 seconds (WCAG 2.2.2).
  - No content that moves or appears only on scroll or hover.
  - LCP and page weight on mobile (the CX-01 target is under 1.5 MB).
  - A single persimmon call to action.
  - A 390 px walk, because animation tends to break first on small screens.
- **Photo-card editor and proof UX:** spec only (07). Risks to settle before build:
  - Tap-and-toolbar editing at 390 px.
  - The proof checker must say plain things ("May print soft") and cannot block silently.
  - The frozen proof must be what prints. Book CX-44 is the same defect, so the card proof must be tested for it from day one.
  - Guest-list CSV import needs an error table with row numbers.
  - Event pages need a guest-facing walk at 390 px with no account.
- **Support model:** a one-person shared inbox (support@, privacy@, report mailbox) at about an hour a day, Mon to Fri 9 to 5 Eastern, no phone. Agent limit is $60 per order. None of it is live. The mailboxes, SPF/DKIM/DMARC and the contact form (CX-31) do not exist, and refund and reprint authority is unapproved.

## 3. Next 30 days (priority order)

1. CX-31 `/help` and `/contact` with order-aware form, plus CX-34 reference codes (L, S). Wire the 15 articles in.
2. CX-02 real company and legal text, the CI grep for placeholders. Blocked on owner and attorney.
3. CX-05 proof approval (Seen X of N, spelling card, acknowledgement). Fix CX-44 first or hide the dedication in the proof.
4. CX-04 and CX-08 delivery range and tax line, then CX-12 and CX-11.
5. CX-45 derived "delivered" status, so the claim window and survey start.
6. CX-35 axe in CI at 1280 and 390 px, with the logotype exclusion.
7. Walk the new home page when it is available (see section 2). Re-walk the whole book flow with real imagery and re-verify CX-01, CX-06, CX-12.
8. Run usability round 1 (CX-41) on a live-adapter staging build with synthetic photos only. Needs owner budget.
9. Photo cards: CX walk of the P1 screens as each ships, not at the end.

## 4. Decisions needed

Owner:
- Approve the support budget ($10 to $50 a month plus a December contractor allowance of about $400), hours, and a named backup.
- Decide the policy numbers: claim window 30 days, lost threshold 10 days past estimate, 60-minute cancel undo, refund in 7 business days.
- Approve the $60 agent refund/reprint limit and the 1 percent goodwill budget.
- Provide real company details and mailboxes (CX-02), and set up DNS for email.
- Approve the $400 to $500 usability budget and the staging spend cap. Choose: run round 1 or waive in writing.
- Approve the 12 template covers and 6 style samples, and decide on the Eye Story (needs signed releases).
- Confirm there is no phone support at launch.
- Hold the go/no-go gate: all Must-fix tickets plus a usability round before real customers or children's photos.

Other teams:
- CTO and QA: tell me the date and state of the animated home page.
- CTO: CX-44 and CX-45.
- Card engineer: CX-46.
- CMO: update `brand/README.md` for the new tokens, the "Mum" enum value and the "Mum, You Did It" title (CX-29).
- QA: exclude the logotype from `a11y.mjs`.
