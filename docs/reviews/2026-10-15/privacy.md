# Privacy and compliance: committee review, 2026-10-15

Research and engineering, not legal advice. Sources: docs/PLAN.md, docs/privacy-ops/ (01 to 05, photo-events-data.md), and spot checks of `app/lib/book/privacy.ts`, `app/lib/shop/policies.ts` and `app/vercel.json`. I did not re-run the audit; verdicts below are from the 2026-10-12 audit plus today's spot checks.

## 1. Done versus plan

Delivered (docs/privacy-ops/):
- Runbooks: 01 access/deletion, 02 purge verification, 03 incident notification, 04 vendor and renewal tracker, README with calendar.
- 05 audit of 15 promises against code, plus a 10-point quarterly checklist.
- photo-events-data.md: retention, deletion, export and vendor rules for photo cards and events (status PROPOSED, wave 1).

Fixed in code since the audit (per PLAN): purge cron accepts Vercel `GET` with bearer secret and a `crons` entry now exists in `app/vercel.json`; consent history kept on re-consent; `consentId` on every job; export includes books and consent records; delete-my-data cancels jobs and removes job docs and logs.

Not done: no real deletion or export run against production (nothing durable until Supabase, SEC-18); purge verification has never run on real data; no request log in use; the audit has not been re-run against wave 2 code.

## 2. Open items

**Retention decisions in conflict (owner decides)**
- Box C ("keep my approved character") still stops the purge forever (`privacy.ts:17,39,105`), and Saved People with photos does not exist. The 90-day promise is untrue for those books (A1).
- PLAN decision 6: Support and Ops want a 12-month reprint window; Privacy ops and Legal say the frozen print PDF is the child's photo and goes at 90 days. PLAN recommends 90 days from delivery.
- Photo events doc proposes "order closed + 30 days, hard cap 120 days" for photo sets; that is looser than the 90-day line in PLAN and in consent box B. Align one number or change the consent wording.
- Drafts and art kept 12 months and consent records 5 years are promised in the draft policy but have no job and no durable table (A2, A3).
- Identity text and model sheets survive the purge (A8); legal question open.

**Consent wording (attorney)**: box B names vendors and must add "checked for safety" (A13); boxes E/F (data tiers) have no wording; "we do not train" must not publish until vendors confirm in writing (A15). Any wording change bumps `CONSENT_WORDING_VERSION` and re-prompts everyone.

**Vendor agreements (owner signs)**: no DPA accepted or on file for Supabase, Vercel, Stripe, Resend, Lulu, Prodigi, OpenRouter. No written ZDR or no-training statement from OpenRouter, Google or Anthropic. DMCA agent not registered (footer still a placeholder); three-year renewal cannot be calendared until it is. ZDR re-test not run. Gooten, the mailer and address-validation vendors have not been read; terms are needed before the first real order.

**DELETION_VENDORS (`app/lib/shop/policies.ts:10`)**: still promises names and addresses are cleared "after delivery", but real printers never report `delivered` (A4). Photo events proposes a defined "order closed" (earliest of delivered, 21 days after shipped, 30 days after last mailed); shop engineer must build it. The list also needs the new vendors (mailer, flat-card printer, address validation) and the Google contacts import before they go live.

**Marketing email consent**: no opt-in, no consent store, no unsubscribe route or header, no suppression list, postal address placeholder (PLAN, Growth). CAN-SPAM blocks any commercial send. Transactional email only until built. Guest emails must never become Resend audience contacts.

**New data stores from photo cards and events** (all depend on Supabase and are unbuilt or uncommitted): `photo_sets`, designs and frozen versions, print PDFs and proofs (the photo at 300 DPI), `recipient_lists` (third-party names and addresses, cap 500; my doc says 1,000 and must be corrected), `batch_jobs`, `events`, `guests`, `rsvps`. Needed before ship: `deletePhotoEventsData` in account delete, expanded export, four new `verify` counts, a do-not-mail list, legal-hold flag (A9, still absent), third-party request path (guests and recipients never agreed to our terms), logs that omit `/api/recipients*`, `/api/events/*`, `/e/*` bodies. Attorney Q45 to Q66 cover whether we are a service provider for this data and breach-notice duties.

## 3. What gates a launch (privacy side)

Books and cards, November 2026:
1. Supabase live with durable deletion and consent tables (A14, A3); purge run and verified on it.
2. Owner decision on box C and the reprint window; code matches the chosen number.
3. Attorney's written opinion and answers to Q1 to Q13 before any real child's photo (PLAN).
4. DPAs and ZDR statements on file for photo-touching vendors (OpenRouter, Lulu, Prodigi, Supabase); until then no "we do not train" claim.
5. DMCA agent registered; footer and Terms updated.
6. `delivered` / order-closed rule so the deletion email is true (A4).
7. Under-18 account handler and per-book delete (A10, A7); 14-day expiry email (A5) or the promise removed from the policy.
8. Log drain with 30-day retention, no bodies.

Photo cards and events (Phase 1 about Nov 21, later phases 2027) additionally: items in section 2 above built and checked, mailer terms signed, attorney answers on third-party data. Phase 1 public only if 0 privacy incidents over 20 orders.

## 4. Owner asks
Pick box C and reprint-window rules; sign DPAs; register DMCA agent; engage attorney (Q1 to Q13, Q45 to Q66); approve the retention numbers in photo-events-data.md; fund Supabase (SEC-18).
