# Support: committee review, 2026-10-15

Owner: GreetHub Support Agent. Sources read: docs/PLAN.md (Support section, B7, owner asks), docs/support/ (README, macros, patterns, photo-events-faq), docs/cx/02-support-model.md (refund authority, tooling options). I did not re-verify code; status below is from the docs.

## Done vs plan

| Plan item | Status |
|---|---|
| Macros corrected to what support can really do (2, 3, 4, 5, 13, 16, 17) | Done: docs/support/macros.md. Macros 5, 13 and 16 still depend on the manual printer window. |
| Holiday replies H1 to H6 (Nov 15 to Dec 24) | Drafted, not approved. They assume the owner approves the Christmas cut-offs (docs/ops/03). |
| Help articles 01, 02, 06 to 09, 13, 14 fixed | Done (no Cancel button, no spelling-check or dedication promises). 13 and 14 say "email us fast" until the cut point is decided. |
| Internal block on every draft (facts, policy, cost, human action) | Defined in macros.md. |
| Patterns log | Predicted only. There are no live tickets, so no real counts. |
| Photo cards and events FAQ, batch reprint policy, macros | Wave 1 draft (2026-10-15). Nothing in it is live or approved. docs/ops/photo-events-printing.md did not exist when I wrote it. |
| Reply drafting for real customers | Not started: no mailbox, no `/contact`. |

## What support needs before soft launch

1. **Inbox.** There is none. `hello@greethub.example` cannot receive mail, and the confirmation email says "just reply" with no reply-to. Needs from the owner: production domain, support mailbox, reply-to, company legal name and postal address (PLAN owner ask 7). Recommendation in docs/cx/02: launch on a Google Workspace shared inbox (about $7 a month) and a Sheet of tags. Move to Help Scout (about $22 a month, with macros as saved replies) at about 60 contacts a month or the first lost thread. The PLAN text says Help Scout from launch. The owner should pick one.
2. **Contact path.** B7 includes CX-31 (help and contact) and CX-34 (error codes). A ticket form with order id and category is recommended, and `support_contact_created` needs an emitter (Head of Data).
3. **Macros loaded.** macros.md and the corrected help articles go into the chosen tool as saved replies. Nothing else blocks this once the inbox exists.
4. **Admin tools (B7).** Status: partly built, not done. There is no reprint, refund, cancel or address-change action in code, no delay-notice email, and no exception alerts. Until it ships, every remedy is a human working two vendor dashboards plus a status fix, and the $0.90 per order labor figure is low.
   - B7 acceptance is that support resolves the top 5 contact reasons without vendor dashboards.
   - Needed: admin order lookup, refund, cancel, reprint (`-R1`) with an audit log, a redraw top-up override (predicted reason 6), and the delay email.
   - B6 should also handle refund, dispute and expiry events so refunds show on the order. B7 is tight against the Oct 27 to Nov 21 fit that the CTO has not signed.
5. **Policies needing owner (and attorney) approval before they are quoted to customers.**
   - Refund & Reprint: the cut point replacing "until In production", which is a status that does not exist (undo window or printer hold; attorney and owner).
   - Reprint and typo policy: drafted, not approved, conflicts (PLAN decision 6, gate item 10).
   - Reprint copy window: 90 days from delivery (PM recommendation) versus the 12 months Support and Ops proposed. Attorney confirms in Q45.
   - ToS s9 and AUP promise repeat-infringer closure and counter-notices that do not exist. Removal requests should point to `/report`.
   - Christmas cut-offs and the order-by date (Nov 30 recommended over Dec 5).
   - Claim window (30 days) and the "lost" threshold.
6. **Refund limit question.** The current rule in docs/cx/02: the agent may reprint or refund per policy up to $60 per order. Above $60, a third remedy in 12 months, or suspected fraud goes to the owner. This is a draft, not confirmed. Owner asks: confirm $60, set support hours, and say whether batch card orders need a separate cap. A 100-card order may well exceed $60, so every batch remedy would escalate. I recommend a percentage or a higher cap for batches.
7. **Peak-season staffing.** About 30 contacts a day in December is roughly 4 hours a day. Plan for agent drafts, human approval (2 to 3 minutes each, an estimate), the H5 auto-reply and the cut-off banner on Nov 15, and delay notices sent proactively. A part-time contractor for December is about $20 to $25 an hour.

## Open items

- A digital book or e-card must be live as the after-cut-off gift, or H2 has nothing to offer.
- Contact rate, CSAT and NPS cannot be computed (no emitters). Targets: under 20 contacts per 100 orders in month 1.
- Expected top contact reasons: "where is my order" (no Delivered state, no delay email), misspelled names noticed after paying, a dedication missing from print (CX-44), cancel requests, needs-attention orders. Each has a fix owner in patterns.md.
- Sign-in links: the sender defaults to `hello@example.com` when `EMAIL_FROM` is unset, and deliverability is untested.
- Photo cards and events: the batch reprint policy, quantities (25/50/100 versus a 10-card band) and prices are all unapproved. The 90-day purge limits how long a reprint can be offered.
- Takedown and photo-removal handling sits with Trust & safety. Support only routes those requests to it.
- All sends, refunds, cancels and reprints stay human until the B7 admin actions exist. I never send anything.
