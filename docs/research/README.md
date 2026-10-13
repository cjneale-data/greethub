# Customer research

Owner: Customer Research Lead. Started 2026-10-12. This folder holds research plans, instruments (screeners, consent forms, scripts, surveys) and, once studies run, findings. It builds on the CX docs and does not replace them:

- `docs/cx/04-usability-test-plan.md` stays the master moderator guide. `01-usability-round-1.md` here is the run sheet for the first round and lists the changes it makes to 04.
- `docs/cx/03-quality-and-happiness.md` sections 3 to 5 stay the source for widgets, NPS and reviews. `04-surveys-nps-csat.md` and `05-testimonial-consent.md` here are the exact instruments and the timing rules, with the gaps found on 2026-10-12.

## Files

| File | What it is | Status |
|---|---|---|
| `01-usability-round-1.md` | Run sheet for usability round 1: entry criteria, build, schedule, photo kit, seeded flaw, budget, task cards (US spelling) | Plan ready; not run |
| `02-screener.md` | Recruiting screener for adults 18+ | Ready; owner recruits |
| `03-participant-consent.md` | Plain-language consent form for sessions and interviews | Draft; **attorney review needed** |
| `04-surveys-nps-csat.md` | Post-delivery survey, support CSAT, proof rating, timing and suppression rules, event gaps | Spec ready; not built |
| `05-testimonial-consent.md` | Review ask, separate marketing-use consent wording, consent record fields, withdrawal | Draft; **attorney review needed** |
| `06-interview-guide.md` | 30-minute assumption interviews (no product needed) | Ready |
| `07-findings-template.md` | Session notes, synthesis and ticket format | Ready |
| `findings/` | Created when the first study runs. P1 to P5 ids only, no names, no recordings, no photos | Not created yet |

## Rules for every study

1. Adults 18+ only. No child participants, ever. Children are never on camera.
2. No participant uploads a photo of a real child, including their own. Use the fictional photo kit (`01` section 4).
3. Notes use participant ids (P1, P2 ...). Names, emails and recordings live in the owner's private storage, never in this repo, never in analytics, never sent to a model.
4. Free text from surveys and sessions is read by a person. It is not sent to a model unless a data-processing agreement and zero-data-retention are confirmed (cx/03 s7).
5. One research contact per person per 6 months, one survey per customer per 90 days, none while a complaint is open.
6. Nobody contacts real people for research without the owner's go-ahead. Recruiting, paying incentives and signing panel contracts are owner tasks.

## Riskiest unvalidated assumptions (2026-10-12)

Ranked by (how much the business depends on it) x (how little evidence we have). Evidence column cites what exists today.

| # | Assumption | Evidence today | How we test it | When |
|---|---|---|---|---|
| A1 | Parents and grandparents accept the AI likeness of their child on the first or second sheet | None. No real art in the product; 10 measured renders, 5 passed QA first time (model evals); every consistency rating is a guess (design) | Cannot be tested in sessions, because participants may not upload real children. Proxy: optional adult self-photo arm (01 s4b, attorney first). Real test: sheet redo rate (Q4) and proof rating on the first 100 paid books | Proxy pre-launch; real at launch |
| A2 | A stranger will upload a child's photo to a new AI site with zero reviews | Market/01: competitors hold 4k to 84k reviews; 2026 "AI slop" press names grandparents; NC State n=13 pairs | Interviews (06), usability trust questions, consent-modal drop-off (`consent_modal_shown` vs `consent_recorded`) | Interviews now; funnel at launch |
| A3 | People will pay $39 to $55 for the book and $10.98 for a mailed card | Market/01: no WTP evidence for GreetHub; mailed card price has no support; digital $19.99 has none | Interviews (06 s4, Van Westendorp-lite), usability wrap-up, cart abandonment by price | Now and at launch |
| A4 | Customers look at every proof page and catch a misspelled name | None; refund policy depends on it; proof is one checkbox today (CX-05) | Seeded flaw in usability round 1 (target 3 of 5 catch it) | Round 1 |
| A5 | A 5 to 15 minute render wait is fine if we say "you can leave, we'll email you" | None; the "proof ready" email does not exist (CMO, shop) | Round 1 with live adapters; abandonment during render at launch | Round 1 |
| A6 | Guests accept the account wall after a free card preview (CFO 25% preview-to-account) | None; signed-in "Looks good" still dead-ends (CX-46) | Round 1 task 1; funnel B-series at launch | Round 1 |
| A7 | Grandparents on a tablet can finish a book unaided | None | Round 1 participant 3 | Round 1 |
| A8 | Buyers trust "your words, our drawing" when the story text is model-written | NC State (parents uneasy with AI text) | Interviews; round 1 reaction to the story step | Now |
| A9 | Saved People drives repeat purchase | None; Saved People holds names only (CMO) | Post-launch: repeat within 90 days (R1) | After launch |

A1 is the riskiest and the one research before launch can least answer. Plan for it to be answered by the first real orders, and make those orders easy to read (sheet verdict reasons, proof rating, post-delivery art CSAT).

## Tickets proposed for the CX backlog (`docs/cx/05-backlog.md`, CX owns the file)

| Id (proposed) | Ticket | Severity | Depends on |
|---|---|---|---|
| RES-1 | Usability round 1 on the first live-adapter preview (01). Needs a seeded-flaw fixture, a readable test inbox, fictional photo kit, about $15 image cap | S1 (launch gate) | SEC-18, CX-01, CX-05, CX-31, CX-46 |
| RES-2 | Survey timing: send at the later of delivered + 5 days and the occasion's date + 2 days; "Not given it yet?" snooze (04 s2) | S2 | CX-45, CX-38 |
| RES-3 | Tracking plan: add `survey_sent`, make `survey_responded.nps` optional, add `survey_type` (04 s5) | S2 | Data (DATA-002) |
| RES-4 | Research opt-in: separate unticked checkbox on the order confirmation page, stored with wording version (02 s3) | S3 | SEC-18 |
| RES-5 | Testimonial consent record and withdrawal (05), as part of CX-39 | S2 | SEC-18, attorney |
| RES-6 | Card preview thumbs reason chips mapped to the `rating_submitted` enum (04 s4) | S3 | CX-38 |
