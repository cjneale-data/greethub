# Research: committee review, 2026-10-15

Author: Customer Research Lead. Sources: docs/PLAN.md, docs/research/ (README, 01 to 07, photo-events-research-plan.md). Nothing below has been fielded; no real participant has been contacted.

## 1. Done vs plan

| Item | State |
|---|---|
| Round 1 usability run sheet, screener, consent form, interview guide, findings template (01, 02, 03, 06, 07) | Written. Not run. |
| Survey and NPS spec, with timing and suppression rules (04) | Spec only; not built (RES-2, RES-3, RES-6) |
| Testimonial and marketing-use consent (05) | Draft wording and consent record; not built (RES-5, CX-39) |
| Photo cards and events plan: R-PE1 survey, R-PE2 interviews, R-PE3 couples, R-PE4 usability | Proposed 2026-10-15; nothing fielded |
| `docs/research/findings/` | Not created. There are no findings yet. |
| Ticket list | RES-1 to RES-8 proposed; CX owns the backlog file and has to merge them |

Against PLAN: the done gate needs "usability round 1 passed or waived in writing by the owner". Neither has happened. M7 is open.

## 2. Scheduled and blocked

| Study | Date | Blocked on |
|---|---|---|
| R-PE1 holiday card survey (target 150 completes) | Field Oct 17 to 21, read-out Oct 22 | **Panel budget.** The owner must approve the panel, incentives and survey by **Oct 16**. No written quote or incidence check exists (cost "not found"). Without the panel the read-out is direction only, in counts like "4 of 6". |
| R-PE2 sender interviews (6) with proof-check exercise | Oct 17 to 22 | Owner recruits from their network or the panel add-on. RES-8 needs a static no-people proof mock from Design and CX copy by Oct 17. |
| Usability round 1 (5 sessions plus a pilot) | Pilot about Oct 30, sessions to **Nov 6**, retest Nov 13 | Entry criteria, none confirmed met. SEC-18 Supabase (owner credentials outstanding), live image models with a $15 owner cap, real sample art (CX-01), CX-05, CX-31, CX-46, a readable test inbox, a seeded-flaw fixture, a fictional photo kit (about $0.30, owner cap), recruiting and incentives ($60 each, $100 for the assistive-technology participant). Likely slips. Fallback: assumption interviews (06) on the same recruits, then invite-only soft launch and round 1 in January. |
| R-PE4 collage and proof usability | Nov 11 to 13 if the Oct 24 call is go, else Jan 5 to 16 | The Oct 24 decision, plus the proof page build |
| R-PE3 engaged couples | Nov 2 to Dec 12 | Owner recruiting; Phase 2 only |
| Testimonial collection | Nothing can start | No customers or orders exist. The consent record needs Supabase (SEC-18). Wording needs the attorney. The consent form (03) also needs the attorney. |

Cross-cutting risk: A1 (parents accept the AI likeness of their child) cannot be tested before launch, because participants may not upload real children. It will only be answered by the first real orders.

## 3. Customer proof marketing needs

Today there is none, and the site copy rightly runs "no testimonials until real ones exist" (cmo/site-copy.md). Competitors hold 4k to 84k reviews, so the trust gap is real (market/01, assumption A2). Marketing will want:
- Star ratings and short review quotes (first name and last initial).
- Photos of finished books and cards in hand.
- Short quotes about the recipient's reaction.
- Creator and UGC content for ads.

## 4. Gathering it ethically

1. **Real orders only.** No invented, composited or model-written reviews. A launch with fewer than 10 reviews should say so rather than fill the gap.
2. **Ask at the right time.** Per 04: the later of delivered + 5 days and the occasion date + 2 days. Never block checkout or the proof. One ask per customer per 90 days, none while a complaint is open.
3. **Two steps.** The review is submitted first. The marketing-use box is separate, unticked, optional and on the thank-you page (05 s4). A review without that consent is never used in marketing.
4. **Consent record.** One row per change with the wording version, scope (`quote_review` or `show_item`), timestamp and source. Withdrawal is honored within 5 business days, with a release register that reaches every live ad.
5. **No real child shown.** No child's face, full name, school or location in any asset, even with consent. Use the cover or the illustrated character, cropped. Likeness of any adult shown needs the customer's confirmation that the person agreed.
6. **No editing for sentiment.** Trimming is marked with an ellipsis. Anything given in return (free book, discount, creator fee) carries "Received a free product" and stays out of the organic average.
7. **Free text read by a person.** Not sent to a model without a DPA and zero retention. Research opt-in is a separate unticked box, so recruiting never uses the order list directly.
8. **Early proof before launch.** Use the adult-only soft launch and round 1 participants only if they give separate written marketing consent. Quotes from sessions are not testimonials by default.

## 5. Owner asks

- By Oct 16: approve R-PE1 panel (written quote and incidence check first), incentives and the interview recruiting.
- Round 1: set the $15 image cap and $0.30 photo kit cap, approve about $360 to $460 incentives (6 people), do the recruiting, and decide go, or waive in writing, if entry criteria slip past Nov 6.
- Attorney: the consent form (03), testimonial wording (05), and the rule on real-child likeness in marketing.
- Supabase credentials (SEC-18), which block consent storage and round 1.
