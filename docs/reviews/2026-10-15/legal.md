# Legal committee review, 2026-10-15

General Counsel (research). This is research for the owner and the owner's attorney, not legal advice. Sources: `docs/PLAN.md`, `docs/legal/*` (00-07, photo-events-legal, photo-events-ip, attorney-brief-2026-10). Tags: [V] verified on primary source in the cited file, [S] secondary, [U] my judgment. I did not re-read vendor terms or statutes today; confidence is as tagged in those files.

## 1. Done versus plan

| Plan item | Status | Evidence |
|---|---|---|
| Legal research pack (IP, children's photos, e-commerce/tax, business setup) | Done | `docs/legal/01` to `04`, read 2026-10-10 |
| Product requirements for engineering | Done, partly unbuilt | `06` (about 56 reqs). Unbuilt: durable consent log (req 28), CSAM evidence preservation (req 18), box C limit to Saved People (req 25), under-18 handler (req 2) |
| IP-safety design, red-team set | Done | `07`, 18 new cases in CI; live eval needs an owner dollar cap |
| Policy drafts (Terms, Privacy, AUP, Refund) | Drafted, not published | `05`; live pages are stubs under a "Draft placeholder" banner |
| Merged attorney brief | Done (Q1 to Q44) | `attorney-brief-2026-10.md`, 2026-10-13 |
| Photo cards and events legal review | Done (Q45 to Q66 drafted) | `photo-events-legal.md`, `photo-events-ip.md` |
| Go/no-go criterion 3: attorney engaged, Q1 to Q13 answered by Nov 13 | NOT MET | No attorney engaged (PLAN, Oct 24 table) |
| No live keys and no real child photos until Q1 to Q13 answered or waived in writing | Holding | No production DB, no live payment, no real photo |

Not done: brief itself not edited to include Q45 to Q66 (the owner sends both files together). No legal re-read of vendor terms this cycle (OpenRouter, Google, Anthropic, Lulu, Prodigi, Stripe, Supabase, Vercel); next re-read due before any live key.

Published statements the product does not honor (brief s1, F1 to F10, checked against code 2026-10-13): box C keeps photos forever versus "deleted after 90 days"; no cancel button; no repeat-infringer or counter-notice flow; no separate consent log; CSAM hook discards the image; `[PLACEHOLDER]` company, DMCA and support text on every page. A PLAN fix made the purge route accept Vercel Cron GET, but the `vercel.json` cron and `CRON_SECRET` are still pending (DevOps).

## 2. Consolidated attorney brief outline, ranked by what gates a date

Rank A: gates the first real child's photo, and so any live book (Nov 13 target in PLAN).
1. Q1 Written opinion: COPPA, state children's and "known child" laws for an adult uploading a child's photo to an 18+ service (the gate for everything else).
2. Q13 CSAM procedure: 18 USC 2258A report "as soon as reasonably possible" [V 2026-10-13], what to preserve (F9), who files, counsel on evidence handling.
3. Q2 Biometric laws (BIPA, CUBI, Washington) for photos sent to a model; is `identity.txt` a biometric identifier? Includes whether to block Illinois. Face-based photo ranking held until answered.
4. Q3 Box C retention (owner and attorney; the change deletes data) and Q4 derived data at purge (`identity.txt`, model sheets). Q46 extends Q4: frozen print PDFs versus the 90-day clock (PLAN recommends 90 days from delivery).
5. Q5 Final consent wording, boxes A to D (the "we do not train" sentence only if ZDR is confirmed end to end). Q47: is the uploader's tick enough for other families' children? Q19 warranties and indemnity (consumers, gifts).
6. Q6 Consent log retention; Q7 legal hold (purge versus open report, chargeback or CSAM duty); Q8 under-18 actual-knowledge handler.
7. Q9 Vendor chain and DPAs (OpenRouter has no DPA located; Lulu and Prodigi unsigned; written ZDR position from OpenRouter, Google, Anthropic). Q54 DPA terms for any print-and-mail or address vendor.
8. Q10 Third-party data (recipients, children named in briefs); Q11 breach-notification matrix; Q12 support-inbox attachments.

Rank B: gates the first live payment and public pages (before the first sale).
9. Q21 Policy pack review (Terms, Privacy, AUP, Refund: arbitration, liability cap, state rights, response clock); Q24 promises not yet built (F2, F4, F7, F8); Q22 cancellation cut point (CX proposes 60-minute undo; unbuilt); Q23 Mail Order Rule delivery claims and delay notice [V 16 CFR 435].
10. Q14 to Q16 DMCA agent, counter-notice and restore, repeat-infringer policy (safe harbor needs a registered agent [V 17 USC 512]); Q17 output-review duty and Lulu's "meaningful human review" rule; Q18 characters and brand names in customer text; Q26 Stripe, Lulu, Prodigi acceptable-use for minors' likenesses.
11. Q29 Sales tax permit before the first charge (accountant leads); Q28 entity; Q30 insurance (get AI-content and biometric exclusions in writing); Q31 IP assignment from partners; Q20 trademark knockout and intent-to-use before ad spend.
12. Q25 CPSIA for a children's hardcover (Lulu statement); Q27 accessibility statement wording while WCAG 2.2 AA is only a target.
13. Q45 and Q60 for photo cards: mailing a child's photo to many third parties; are personalised cards exempt from return rights in any shipped-to state [U, not researched]. Q59 typo policy and whether "we check names and dates" creates a duty. These gate Phase 1 photo cards, not books.

Rank C: gates a later phase.
14. Phase 2, mail-for-me and CSV import (build from Jan 5, launch about Feb 2, 2027): Q48 business versus service provider and s 7012(h); Q49 recipient access and deletion; Q50 hashed suppression list; Q51 First-Class requirement [U]; Q52 postage and money transmission; Q53 harassing mail duties; Q61 Google Contacts Limited Use; Q62 import notice to customers.
15. Phase 3, event pages and RSVP (build from March, launch about May 2027): Q55 gifts and registries; Q56 children's names on pages; Q57 dietary data as sensitive data; Q58 deletion versus a guest's request; Q63 guest notice and hashed IP; Q64 reminder email and CAN-SPAM; Q65 host/guest terms; Q66 TCPA before SMS.
16. After launch, named triggers: Q34 marketing email (before first commercial send); Q35 analytics and ad tags (before any tag or paid ads); Q36 creators; Q37 testimonials; Q38 takedown of shipped orders; Q39 data-improvement tiers (before box E or F); Q40 occasion reminders; Q41 upstream indemnity; Q42 equity; Q43 agent channel (before P2 integrations); Q44 kiosk. Q32 and Q33 only if usability round 1 runs pre-launch.

Count: 66 questions in total (Q1 to Q44 in the brief, Q45 to Q66 in `photo-events-legal.md`). Realistic first-meeting set: items 1 to 8 plus 9 and 10. Item 13 is needed only if the photo-card Phase 1 goes ahead.

## 3. Policies and pages unwritten or needing review

| Item | State | Needs |
|---|---|---|
| Terms of Service | Draft in `05`; live page is a stub | Attorney review (Q21); fill brackets; remove untrue promises (F3, F4, F6) |
| Privacy Policy | Draft; live stub; retention table has brackets | Q5, Q6, Q21; state rights text and response clock; recipients and guests section for Phases 2 and 3 |
| Acceptable Use Policy | Draft | Extend for events (no ads, payments, solicitation) and mail-for-me; Trust and Safety writes the extension |
| Refund and cancellation policy | Draft; cancel sentence is untrue today | Q22, Q23; reprint and typo policy (plan decision 6, not yet owner-approved) |
| DMCA / takedown page | Placeholder agent | Register agent ($6), counter-notice flow, repeat-infringer policy |
| Marketing email consent / CAN-SPAM | Not written | Opt-in wording at sign-up and guest preview, postal address, one-click unsubscribe, no open pixels in transactional mail (Q34 [V legal 03 s7]); I have not verified the 16 CFR 316.3 primary-purpose test |
| Event reminder emails | Not written | Q64; per-guest stop link |
| Social and creator rules | Not written | Contract, FTC disclosure clauses (Q36), release where a child appears |
| Testimonials and reviews | Not written | Two-box consent, 16 CFR 465 (Q37); no real customer or child in samples |
| Partner / mailer terms | Not obtained | Class of mail and retention in writing (Q51, Q54); not opened by me |
| Accessibility statement | Not written | Q27 |
| Host and guest terms, recipient suppression notice | Not written | Q65, Q50 |
| Membership (GreetHub Plus) terms | Not reviewed | Auto-renew and free-trial rules; keep `GREETHUB_MEMBERSHIP` off until reviewed (PLAN B13). State auto-renewal law not researched [U] |
| Footer, DMCA block, support address | `[PLACEHOLDER]` and `hello@greethub.example` | Owner supplies legal name, address, real mailbox (F10) |

## 4. Owner actions

1. Choose and engage an attorney by about Oct 24 so Q1 to Q13 can be answered by Nov 13; send both `attorney-brief-2026-10.md` and `photo-events-legal.md`. Or waive in writing, knowing why.
2. Decide: box C (hide, or end-date it); reprint copies on the 90-day clock (recommended) or 12 months disclosed; recipient retention numbers; mail-for-me abuse limits; guest list off by default; no payments on event pages; face ranking held.
3. Form the entity, get an EIN, and supply the company legal name and address.
4. Open a real support mailbox and domain; register the DMCA agent.
5. Register for sales tax in the home state before the first live charge.
6. Sign vendor DPAs (Lulu, Prodigi, any mailer); send OpenRouter the ZDR/DPA request and Lulu the written-confirmation request.
7. Bind insurance with exclusions confirmed in writing.
8. Approve the cancellation cut point, refund limits and reprint policy.
9. Give a dollar cap if you want the live IP red-team eval; otherwise it stays unrun.
10. Do not set `GREETHUB_MEMBERSHIP=1` or take any live key or real child photo before the above.

Needed from teammates: DevOps (cron entry, `CRON_SECRET`); CTO and Privacy ops (durable consent log, CSAM preservation, purge of `identity.txt`, legal-hold flag); Shop engineer (cancel window, export of consent and projects); Trust and Safety (event and mail AUP).
