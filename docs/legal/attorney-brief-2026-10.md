# Attorney brief, October 2026

Prepared 2026-10-13 by the GreetHub legal research lead for the owner's attorney. This is research, not legal advice. It merges every open attorney question found across the repo (docs/legal, docs/data, docs/trust-safety, docs/privacy-ops, docs/research, docs/social, docs/integrations, docs/equity, docs/kiosk, docs/security, docs/support, docs/ops, finance/ops) into one deduplicated list, checked against the code as it stands on 2026-10-13.

Tags: **[V]** read on the primary source (date given); **[S]** secondary source; **[U]** unverified or my judgment. Priority: **BEFORE LAUNCH** (before any live payment or any real child's photo) or **AFTER LAUNCH** (before the named later event).

## 0. The product in one paragraph (as built, not as planned)

GreetHub sells AI-illustrated picture books (from a customer's photos and story) and greeting cards (from a typed brief, with no photos) to US adults. Photos go through OpenRouter to Google Gemini image models and to a Gemini moderation classifier, with OpenRouter's zero-data-retention flag set on photo calls. Text goes to Anthropic Claude through OpenRouter, with no ZDR flag on text-only calls. Lulu prints books and Prodigi prints cards. Stripe takes payment. **As of today the site runs on local files, with no production database. No live payment has been taken and no real child's photo has been uploaded.** The live policy pages are short stubs under a "Draft placeholder" banner. The full drafts are in `docs/legal/05-policies-draft.md`.

## 1. What already conflicts with the product (read first)

These are statements we publish or plan to publish that the product does not honor today. The attorney should see them before reviewing any wording.

| # | Statement | Where | Reality (code, 2026-10-13) |
|---|---|---|---|
| F1 | "Photos are deleted after 90 days unless you save the person" | consent box B, book photo step, draft Privacy s4 (live privacy page and FAQ corrected today) | If optional box C ("Keep my approved character") is ticked, the purge skips that book's photos with no end date. No "Saved Person" with photos exists; saved People hold names only. |
| F2 | "We email you 14 days before" deletion; Saved People kept 24 months | draft Privacy s4, s5 | Not built. |
| F3 | "Cancel from the order page until the status says In production" | draft Refund policy | No cancel button and no "In production" status. The order goes to the printer inside the payment webhook, seconds after payment. The only real window is Lulu's roughly 120-minute production delay (Prodigi's is not verified). |
| F4 | "We close accounts of repeat infringers"; counter-notices; "close the account" (AUP rule 1) | draft ToS s9, AUP | There is no repeat-infringer table, no counter-notice flow and no suspend or close action. A report can only be read and relabelled. |
| F5 | Removal requests go by email to [SUPPORT EMAIL] with the subject "Image removal" | draft ToS s9, AUP | The product uses the `/report` form and a report inbox. Corrected in 05 today. |
| F6 | "[NUMBER] free re-draws per [PERIOD]" | draft ToS s7 | Each book gets 3 page redraws and 2 sheet redos. There is no monthly allowance. Corrected in 05 today. |
| F7 | "Name and address removed after fulfillment" on account deletion | account page | The scrub waits for "delivered", and real orders never reach "delivered" (no printer reports it). |
| F8 | Consent records kept 5 years | draft Privacy s5 | Consent is stored inside the book and deleted with it. No separate log exists yet. |
| F9 | CSAM: "preserve evidence securely" (req 18) | 06 req 18 | The classifier hook discards the image and only logs. See Q16. |
| F10 | Company name, address, DMCA agent | site footer, DMCA block, every legal page | `[PLACEHOLDER]` text shows on every page. The support address `hello@greethub.example` cannot receive mail. |

## 2. Questions, BEFORE LAUNCH

### A. Children's photos and privacy (blocks the first real photo)

**Q1. Written opinion on photos of minors uploaded by adults.** Does COPPA, a state children's or teen law, or a "known child" sensitive-data rule (e.g. CO, CT, VA style) reach a parent uploading a child's photo to a general-audience, 18+ service? Is the declared age band of a depicted child ("toddler", "child") itself known-child data? Is the Gemini API term against clients "likely to be accessed by" under-18s met by an 18+ gate and adult-directed marketing? *Sources:* legal 02 s2 to s3 (FTC COPPA guide [V 2026-10-10]); data/06 s11 A2; legal 01 s2 (Gemini terms [V 2026-10-10]).

**Q2. Biometric laws and Illinois.** BIPA, Texas CUBI and Washington RCW 19.375, applied to photos sent to a generative model that makes no face template or match. The vision model writes a text description of each person (`identity.txt`). Is that description a "biometric identifier" or "information based on" one? The owner must choose between accepting Illinois with the consent flow and blocking Illinois uploads, and wants your advice. *Sources:* legal 02 s5 (CUBI [V]; BIPA [S]; Apple Photos BIPA ruling, Oct 2026 [S]).

**Q3. Box C retention (decision with the owner; the change deletes data).** Today box C keeps photos with no end date. The options are: (a) hide box C until Saved People with photos exists; (b) give it an end date, for example 24 months of inactivity with a reminder; (c) keep it and disclose it plainly. Box B ("keep a saved Person") and box C ("keep my approved character") also name different things, so pick one concept before final wording. *Sources:* privacy-ops/05 A1; book engineer and privacy ops entries in PLAN.md.

**Q4. Derived data at purge.** Purge and withdrawal delete the original photos but keep `identity.txt` (a text description of each person written from the photos) and the character model sheets. Does req 25 ("derived crops") or any biometric or children's-data rule require deleting them on the same clock? *Source:* PLAN.md book engineer.

**Q5. Final consent wording, boxes A to D.** The current text is in `app/lib/book/consent.ts`. Points to settle: name the safety check ("and checked for safety", privacy-ops/05 A13). Use the "we do not train on photos" sentence only if ZDR is confirmed on every route (it is set on photo calls; OpenRouter's ZDR coverage of the specific image models has not been re-verified). Box D offers marketing use of finished pages, but children's images need a separate signed release (legal 02 s6). Should box D exist at all for books that show children? Whether the consent works as a BIPA-grade written release.

**Q6. Consent log and retention schedule.** Confirm the following: keeping IP address and user agent in the consent log for 5 years, including after account deletion (or hashing the IP after 30 days, SEC-35); the retention values (analytics 13 months; ledger, creation facts and tickets 24 months; consent log 5 years; invoices 7 years; 90/120-day photo rule for open orders); what may lawfully remain after a deletion request (anonymised ledger, deletion log, tombstone ids) and whether that meets a de-identification standard; application-log retention (30 days). *Sources:* data/06 s11 A3 to A5, A14; legal 02 s7.

**Q7. Legal hold.** The 90-day purge and delete-my-data can erase art or photos that are the subject of an open report, a chargeback, or a CSAM preservation duty. No legal-hold flag exists. Which events must suspend deletion, and for how long? *Sources:* trust-safety/01; privacy-ops/01.

**Q8. Under-18 actual-knowledge handler.** When an account holder turns out to be a minor, what may be kept after the lockout and deletion (for example a record that blocks re-signup)? *Sources:* data/06 A9; legal 06 req 2 (not built).

**Q9. Vendor chain and DPAs.** Supabase, Vercel Pro, Resend and Stripe have click-through DPAs. Lulu and Prodigi DPAs need signing. OpenRouter has no DPA located. What written position must we hold from OpenRouter, Google and Anthropic on retention and training before the privacy wording ships? Are text-only screening calls without ZDR (they carry children's names and stories) acceptable? *Sources:* legal 02 s10; 07 q10; data/06 A10.

**Q10. Third-party data.** Recipients' names and addresses (cards mailed for the buyer), and children named in briefs: is the buyer's own representation enough, and what must the Privacy Policy say? *Sources:* data/06 A11; integrations/09 q24.

**Q11. Breach notification.** A notification matrix for likely customer states, a review of the pre-drafted notices in `docs/privacy-ops/03`, and who decides. *Source:* data/06 A13.

**Q12. Support inbox attachments.** Damage claims and removal requests will bring in photos, some of children. What retention and access rules apply? *Source:* data/06 A15.

### B. Child safety

**Q13. CSAM procedure (blocks the first real photo).** Verified 2026-10-13 at https://www.law.cornell.edu/uscode/text/18/2258A [V]: a provider must report to NCMEC's CyberTipline "as soon as reasonably possible after obtaining actual knowledge". A report is treated as a request to preserve its contents "for 1 year" (extended from 90 days by the REPORT Act, Pub. L. 118-59, 7 May 2024). Preserved material must be kept in a secure location with access limited to what is needed, consistent with the NIST Cybersecurity Framework. Fines for knowing and willful failure to report are up to $600,000 (first) and $850,000 (later) for providers under 100 million monthly users. Today the hook (`setCsamHook`, `app/lib/book/moderation.ts`) **discards** the image and logs metadata, which the owner chose in order not to store or forward such images. Questions: (a) Is a classifier flag "actual knowledge", or must a human confirm? Staff must not view the image, so who would confirm? (b) What must be preserved, where, and who may access it? (c) Who files, and what is sent? (d) Does sending the image to the classifier vendor (OpenRouter, then Google) raise any issue? (e) Account ban, and what the customer is told. A written procedure is needed before photos go live. *Sources:* legal 02 s8, 07 s5, 07 q8; data/06 A8; security/05; trust-safety/01.

### C. Copyright, trademark and DMCA

**Q14. DMCA agent and notice form.** Verified 2026-10-13 [V]: safe harbor needs a designated agent with name, address, phone and email on the site and filed with the Copyright Office (17 USC 512(c)(2), https://www.law.cornell.edu/uscode/text/17/512). The fee is $6 per designation, and a designation lasts 3 years, after which it becomes invalid (https://www.copyright.gov/dmca-directory/faq.html). Questions: whose name and address to file (the owner's, or your office as agent); the "under penalty of perjury" wording on our `/report` form; whether the form must collect identification of the copyrighted work as a separate field (512(c)(3)(A)(ii) requires it; today it is free text). Should trademark notices get their own path? *Sources:* trust-safety/01; 07 q5.

**Q15. Counter-notice and restore.** 512(g) requires prompt notice to the uploader and restoration 10 to 14 business days after a valid counter-notice unless suit is filed [V]. We delete art on removal, which makes restoration impossible. Should we hide and hold instead? What uploader notice is needed for a private, per-customer creation that is never public? Should the Terms promise counter-notices before the flow is built (F4)?

**Q16. Repeat-infringer policy.** Section 512(i)(1)(A) requires a policy that is adopted, "reasonably implemented" and communicated, for terminating repeat infringers "in appropriate circumstances" [V]. Set the threshold (for example strikes within 12 months), what counts as a strike for an automatically rewritten request, and whether the Terms can state the policy while enforcement is manual. *Sources:* 06 req 24; trust-safety/02.

**Q17. Output review duty and Lulu.** Are the automated vision check plus the customer's proof approval enough review for per-order generated content? Does Lulu's ban on "AI-generated content without meaningful human review" (legal 01 s5 [V 2026-10-10]) need written confirmation from Lulu for this product? Note that the vision check currently **fails open** when the call errors (07 s7). *Sources:* 07 q4; legal 06 req 57.

**Q18. Characters, themes and printed names.** (a) Brand or franchise names in a customer's own card message ("see you at Disneyland"): we rewrite them all today. Is that over-cautious? (b) Is a theme ("icy sisters", "wizard school") protectable when every character trait is changed? (c) Is a 6/10 look-alike score a defensible documented standard? (d) Is it fine to rewrite public figures as "someone inspired by" them? (e) Is "closest style" wording for a franchise-look request fine? *Sources:* 07 q1, q2, q6, q7; design/01.

**Q19. Customer warranties and indemnity.** Are the ToS warranties (rights to photos, parental authority, no protected characters) and the customer indemnity enforceable against consumers, including on gifts? Does an accepted rewrite make GreetHub the author of the prompt? *Sources:* 07 q3; 05 ToS s3, s13.

**Q20. Name clearance.** A knockout search for GREETHUB (classes 9, 16, 35, 41, 42), then an intent-to-use filing before ad spend. *Source:* legal 01 s6, 04 s4.

### D. Consumer, policies and commerce

**Q21. Policy pack review.** Review the Terms, Privacy, AUP and Refund drafts in `05-policies-draft.md`. Include: arbitration and class waiver; liability cap and carve-outs; governing law; state privacy rights text, response clock (we draft 45 days; internal target 30) and authorised-agent proof; acceptance records; "we don't sell or share". The live pages are stubs and must be replaced. *Sources:* legal 00 item 2; privacy-ops/01.

**Q22. Cancellation window (F3).** Pick the cut point and its wording. CX proposes a 60-minute undo window before the order is sent to the printer; the alternative is the printer's own hold. Engineering must build whichever is chosen. Until then, should the policy say plainly "orders can't be cancelled once paid; email us at once and we'll try"? *Sources:* support PLAN entry; cx/05 s4.

**Q23. Mail Order Rule and refund numbers.** Our evidence for the shown delivery date: the code defaults to 7 days with no printer data, and the rule needs a "reasonable basis" (16 CFR 435, FTC guide [V 2026-10-10]). Delay-notice wording, which is not built. The claim window (30 days), the "lost" threshold (proposed 7 business days of stalled tracking or 10 past the estimate) and the refund clock (7 working days). Holiday cut-off wording (`docs/ops/03`). *Sources:* legal 03 s3; ops/01; cx/03.

**Q24. Promises not yet built (F2, F4, F7, F8).** For each, decide whether the policy may describe it before it exists, or must drop or qualify it until it is built.

**Q25. Children's product safety.** Do CPSIA testing and tracking-label rules apply to a hardcover picture book made for a child? Get Lulu's compliance statement. *Sources:* legal 01 s5; 03 s9 [U].

**Q26. Stripe and printer acceptable-use.** Confirm that Stripe's restricted-business list and the Lulu and Prodigi content terms allow per-customer AI art showing minors' likenesses. *Source:* legal 03 s9 (gap).

**Q27. Accessibility statement.** Statement wording and the risk while WCAG 2.2 AA is still a target (axe passes locally; no external audit). *Source:* legal 03 s6.

### E. Business, tax and insurance

**Q28. Entity.** LLC or C-corp, which state, and how a dynamic-equity ledger fits each. *Sources:* legal 04; equity/05 q1.

**Q29. Sales tax before the first sale (accountant leads).** Home-state permit before the first live charge. Stripe Tax collects only where we are registered [V docs.stripe.com/tax, 2026-10-10]. The ship-to address is not yet passed to Stripe, and no product tax codes are set. Resale certificates for Lulu and Prodigi. *Source:* finance/ops/accountant-questions 1 to 10.

**Q30. Insurance.** Cyber, media/IP and general liability, with written confirmation of AI-content and biometric exclusions. *Source:* legal 04 s3; 06 req 56.

**Q31. IP assignment of the build.** Who owns code, art and docs produced by AI agents under a partner's direction? Does every partner need an IP assignment to the company before launch? *Source:* equity/05 q6, q12.

### F. Research before launch (only if usability round 1 runs before launch)

**Q32. Participant consent.** Recording consent in two-party-consent states, whether to include a release or arbitration clause, and 90-day recording retention. *Source:* research/03 q1, q4, q5.

**Q33. Adult self-photo arm.** Do BIPA, CUBI or Washington apply when an adult uploads their own face, and should residents of those states be excluded? Skip the arm without sign-off. *Source:* research/03 q2; research/01 s4b.

## 3. Questions, AFTER LAUNCH

**Q34. Marketing email (before the first commercial send).** CAN-SPAM postal address, opt-in at sign-up and guest preview, one-click unsubscribe, no open pixels in transactional email. *Sources:* legal 03 s7 [V]; data/06 A7.

**Q35. Analytics and ad tags (before any tag or paid ads).** Does first-party pseudonymous analytics need a banner? GPC handling; CIPA/wiretap theories; the server-side conversion payload (hashed email or not; is it "sharing"?). *Sources:* data/06 A1, A6; data/01 s10.

**Q36. Creators (before the first creator signs).** The creator contract and partner terms page; FTC disclosure clauses (FTC "Disclosures 101", read by Social 2026-10-12 [V]); a content release where a child is shown (other parent's consent); the proposed rule that paid ads never use a child's real face. **Accountant:** 1099 treatment of gifted books (about $20 cost) and the 10% commissions, W-9 timing, and who issues 1099s through a payout platform. *Sources:* social/02; accountant-questions 17 to 20.

**Q37. Testimonials and reviews (before the first use).** Two-box consent under the Endorsement Guides and the Consumer Reviews Rule (16 CFR 465 [V 2026-10-10]); whether "I confirm they agreed" from a customer stands in for a pictured person's consent; the withdrawal window. Research incentives and 1099s (accountant). *Sources:* research/05 q1 to q3; research/03 q3.

**Q38. Takedown of printed or shipped orders.** What, if anything, is owed when content under a valid notice has already shipped as a gift? *Source:* trust-safety/01; 07 q5.

**Q39. Data improvement tiers (before box E or F ships).** Box E/F wording; whether adult consent covers text that mentions a minor; the scrub standard; training use (recommendation: never for photo-derived or minor content); vendor output-training terms; model unwinding; CPPA automated-decision rules. *Sources:* data/06 s11 B, C (items 16 to 24).

**Q40. Occasion reminders and gift emails.** Storing a recipient's occasion date (often a child's birthday) and emailing a third-party recipient. *Sources:* data/01 s10; cx/05; growth PLAN entry.

**Q41. Upstream indemnity.** Whether to contract directly with Anthropic or Google Cloud (Vertex) for IP indemnity, given that OpenRouter caps its liability at $100 or 12 months of fees [V 2026-10-10]; whether to register sample books as compilations. *Sources:* legal 00 q10; 01 s2.

**Q42. Equity (before partners sign the contribution policy).** Equity questions 1 to 5 and 7 to 10 in `docs/equity/05`. Also: q11, how to fund the ~$54k peak (partner cash at 4x in the pie, a loan or note outside it, or an outside instrument that freezes the pie); q13, partly paid partners; q14, vesting after the freeze. Q31 above takes the IP-assignment part.

**Q43. Agent channel (before P2, early 2027 at the earliest).** AGT-001: written questions to OpenAI and Anthropic about commerce and AI-media rules, not yet sent (`docs/integrations/answers/` does not exist). Developer-agreement review (OpenAI, Anthropic, Google, Microsoft, Amazon); a Terms and Privacy agent addendum; card-on-file and merchant-initiated charges; standing rules as negative-option or auto-renewal; no stored value; children's likeness via assistants; mistaken-order refunds; meeting-derived context; whether a card message written by AI needs a disclosure. *Sources:* integrations/04 s5.6, 09 items 13, 21 to 27.

**Q44. Kiosk (only if the pilot proceeds).** See `docs/kiosk/06` s9 (location agreement, unattended payments, minors at a public device, ADA).

## 4. Closed or superseded

- **Eye Story releases** (legal 00 owner question 7, 06 req 47): withdrawn. Standing rule 5 forbids real people in samples, and the sample book is now fictional (CMO, 2026-10-12). The golden set is text-only, so it needs no releases (data/06 q25).
- **"Monthly re-roll allowance"**: does not exist. ToS s7 now states the per-book numbers.

## 5. Owner actions that are not attorney questions

Choose and engage the attorney. Form the entity and get an EIN. Fill in the company legal name and address (removes `[PLACEHOLDER]` from the footer, the DMCA block and email). Set up a real support mailbox and domain. Register the DMCA agent ($6). Register for sales tax in the home state. Sign the vendor DPAs. Bind insurance. Send the OpenRouter ZDR and DPA questions and the Lulu written-confirmation request. Approve the cut-off dates and refund limits. The "Draft placeholder" banners come off only when attorney-approved text and the real company details are in place.

## 6. Count

44 questions: **33 before launch** (Q1 to Q33; Q32 and Q33 only if usability round 1 runs before launch) and **11 after launch** (Q34 to Q44).
