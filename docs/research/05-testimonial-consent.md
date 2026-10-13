# Reviews and testimonials, with consent (draft)

**Draft wording for the owner's attorney to review. Not legal advice.** Policy source: `docs/cx/03-quality-and-happiness.md` s5 and legal 06 reqs 45 and 46. This file is the exact copy, the consent record and the checks. Nothing here is built (CX-39); it needs Supabase (SEC-18) to store consent.

## 1. Who we ask, and when

- Customers who scored 9 or 10 on the post-delivery survey, with no quality ticket in the last 30 days.
- 2 days after the survey. One reminder at most, 5 days later.
- Never people who scored lower. We do not send happy people to a public site and unhappy people to a private form (no review gating). Everyone who finishes a survey can leave a review from the order page if they want to.
- Only after the gift has likely been given (same rule as the survey, `04` s2).

## 2. The ask (email)

Subject: "Would you tell others about {recipient first name}'s {book|card}?"

> Hi {first name},
>
> Thanks for the kind score. If you have a minute, a short review helps other families decide whether to trust us with their photos. Say whatever you really think.
>
> [Write a short review]   [No thanks]

"No thanks" records a decline and stops the reminder.

## 3. The review page

1. Stars, 1 to 5.
2. "Your review" (free text). Hint: "Please leave out children's names, schools and places."
3. "Name to show": first name and last initial, prefilled, editable.
4. City (optional).
5. Submit.

The review is published on our site under our rules (shown on the page): we show all genuine reviews, good and bad; we remove only personal details at the author's request, or content that breaks the posted rules, and we log why.

## 4. Marketing use: a separate step after submitting

Shown on the thank-you page, never pre-ticked, never required, never on the same screen as the review form:

- [ ] **Quote my review.** "GreetHub may quote my review, first name and last initial on its website, in emails and in ads."
- [ ] **Show my finished item.** Shown only if the first box is ticked. "GreetHub may also show a photo of my finished {book|card}. If it shows anyone's likeness, I confirm they agreed, and a parent or guardian agreed for any child."

Under the boxes: "You can change your mind any time in Account or by emailing us. We'll stop using it in new materials within 5 business days."

House rules on top of consent (proposed, owner to confirm):
- We do not show a real child's face or full name in ads, even with consent (social's proposed policy). We use the illustrated character, cropped so it is not identifiable as a specific real child, or the cover only.
- No review is written, edited for sentiment or "improved" by a person or a model. Typos stay unless the author asks.
- Any review from someone we gave something to (a creator, a free book, a discount for reviewing) carries "Received a free product" and is never mixed into the organic average.

## 5. Consent record (one row per consent change)

| Field | Notes |
|---|---|
| consent_id | |
| account_id | |
| review_id | |
| scope | `quote_review` or `show_item` (maps to the tracking plan's `consent_changed.scope = marketing_use`) |
| change | granted / withdrawn |
| wording_version | e.g. `testimonial-v0.1` |
| at | UTC timestamp |
| source | thank_you_page / account / email_request |

Event: `consent_changed` with scope `marketing_use` already exists in the tracking plan; add `wording_version` to its properties (Data). A review submission has no event today; propose `review_submitted` (stars, has_text, product, incentivized: bool) with no review text in analytics.

## 6. Before any review is used in marketing

Checklist for the CMO, every time:
1. Consent row exists, scope covers the use, not withdrawn.
2. Wording matches the review exactly (no edits beyond trimming, marked with an ellipsis).
3. No child's name, face, school or location.
4. Disclosure added if the person received anything.
5. Logged in the release register (social's register) with the date of first use, so withdrawal can reach every live ad.

Public review counts and averages appear only once there are at least 10 real reviews (cx/03 s5).

## 7. For the attorney

1. Is the two-box wording enough under the FTC endorsement guides and the consumer review rule as they stand in 2026?
2. Can a customer's "I confirm they agreed" stand in for our own consent from a pictured adult or a parent, or must we collect it directly?
3. Is 5 business days a reasonable withdrawal window for ads already scheduled?
