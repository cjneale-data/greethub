# Surveys, NPS and CSAT: instruments and timing

Source of truth for what is asked and when: `docs/cx/03-quality-and-happiness.md` sections 3 and 4. This file adds the exact instruments, fixes the timing for gifts, and lists what the build and the tracking plan are missing (checked 2026-10-12).

## 1. Principles

1. **Never blocks a purchase.** No survey, rating or prompt on cart, checkout or payment pages, or between "Approve" and the cart. Every prompt can be closed with one tap and is never required to continue.
2. **First-party only.** No third-party survey scripts on creator, proof, cart or account pages (legal 06 req 44). The survey page and email links are ours.
3. **One question at a time is fine; one survey per 90 days per customer.** No survey while a ticket is open.
4. **Gifts measure the gift, not the carrier.** Ask after the gift has likely been given (s2).

## 2. Post-delivery survey timing (changed)

cx/03 says 5 days after the carrier reports delivered. For gifts that is often before the gift is given. A Christmas book delivered on Dec 10 would be surveyed on Dec 15, when it's still wrapped. That measures print and delivery, not the reaction that drives NPS and repeat orders.

**Rule:**
- `send_at = max(delivered_at + 5 days, occasion_date + 2 days)`, capped at `delivered_at + 30 days`.
- Occasion date: Christmas Dec 25, Valentine's Feb 14, Mother's Day and Father's Day by year, Hanukkah by year. Other occasions have no date today (the brief doesn't ask), so they use delivered + 5. A future "When's the big day?" field would close the gap (product decision, optional).
- Email carries a second button, **"Not given it yet? Ask me later"**, which moves `send_at` by 14 days, once.
- **Cards mailed straight to the recipient:** the buyer never sees the print. Ask "Did {recipient first name} get it?" (Yes / Not sure / No), skip print CSAT, keep NPS and art CSAT. A "No" opens the order help page, not a survey.
- **Digital items:** 3 days after the download link was first opened.
- **One survey per order**, not per item.

**Prerequisite:** orders must reach `delivered`. Today they stop at `shipped` (CX-45). Until the printers' delivered webhooks are mapped, derive delivered = shipped + carrier estimate + 3 days and mark it `derived`.

## 3. Instruments

### 3a. Post-delivery survey (email, one-click start)

Subject: "How did {recipient first name}'s {book|card} go?"
Body: "Hi {customer first name}, we hope it landed well. One quick question:"

1. **How likely are you to recommend GreetHub to a friend?** 0 to 10 (each number is a link; one click records it and opens the page).
2. **How happy are you with the artwork?** 1 to 5.
3. **How happy are you with the print quality?** 1 to 5 (hidden for cards mailed direct).
4. **What stood out?** Chips, pick any: Art / Looked like them / Print quality / Story / Arrived on time / Late / Price / Something else. (Maps to the `reason_codes` enum.)
5. **Anything we should fix?** Optional free text. Hint: "Please don't include children's names or other private details."
6. **Would you make another?** Yes / Maybe / No.

Thank-you page: "Thanks, {first name}." If NPS 0 to 6: "Someone from our team will reply personally within 2 business days." If NPS 9 to 10 and no quality ticket in 30 days: nothing more here; the review ask comes 2 days later by email (05).

Mirrored as a dismissible banner on the order page once the survey is due. Answering in one place closes it in the other.

### 3b. Support CSAT (closing email)
"Did we sort it out?" Yes / Mostly / No (stored 5 / 3 / 1) plus an optional line. "No" reopens the ticket.

### 3c. Proof rating (after approval, before the cart)
Not on the cart page (principle 1). Show it on the approval confirmation ("Approved. Your print files are ready."), next to the "Go to cart" button, never in its way: "How happy are you with this book?" 5 stars, optional line. Skippable; the button works without it.

### 3d. Guest card preview thumbs
"Is this close to what you pictured?" Thumbs up / down. Down shows chips mapped to the `rating_submitted` enum: Style → `style_off`; Face or people → `likeness_off`; Words in the picture → `text_in_image`; Wrong number of people → `wrong_count`; Other → `other`. (cx/03 lists "style, face, words, other"; use the enum so dashboards can split by model, style and prompt version.)

### 3e. Help article footer
"Did this help?" Yes / No. No opens the contact form with the article name filled in.

## 4. Reporting

- NPS = % 9 to 10 minus % 0 to 6, with n and a 90% interval. Not shown as a headline until n is at least 50 (cx/03). At the CFO's base case (about 1,895 orders in year 1) and a 25% response rate, that takes about 200 delivered orders, so expect the first reportable NPS in January for the holiday cohort.
- Split by product, style, model, prompt version, channel and holiday vs non-holiday. Holiday buyers answer later and differently; do not compare a December cohort with a March one without saying so.
- Read every free-text answer while volume allows (under about 300 a month). Tag with the support taxonomy.

## 5. What's missing in the build and the plan (2026-10-12)

| Gap | Where | Owner | Fix |
|---|---|---|---|
| Orders never reach delivered, so no survey can fire | `lib/shop/orderState.ts`, printer webhooks | Shop | CX-45 |
| No survey page, email template, send queue, 90-day suppression list or open-ticket check | `lib/shop/mail.ts` has transactional emails only | Shop, CX | CX-38 |
| No `survey_sent` event, so the 25% response-rate target can't be computed | `docs/data/tracking-plan.json` | Data | Add `survey_sent` (order_id, survey_type, send_reason: due / snoozed) |
| `survey_responded.nps` is required, so a CSAT-only or "didn't arrive" response can't be logged | tracking plan | Data | Make `nps` optional; add `survey_type` enum (post_delivery, support, proof, research) and `gift_given` (yes / not_yet / unknown) |
| No rating or thumbs widget anywhere; only the book sheet verdict collects feedback, stored in the project file, not emitted | `components/book`, `CardCreator.tsx` | Book, card | CX-38 |
| No support ticket store, so support CSAT has nowhere to land | no helpdesk | CX, owner | CX-31 and a helpdesk decision |
| No email-marketing or research opt-in storage | no Supabase | Shop | SEC-18, then RES-4 |
