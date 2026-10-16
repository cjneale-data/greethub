# Trust and Safety: committee review, 2026-10-15

Owner: Trust and Safety Reviewer. Sources read: docs/PLAN.md (IP safety, Social, Research and M5/M7 sections), docs/trust-safety/ (01-review-playbook, 02-patterns-and-rules, photo-events-abuse), docs/social/02-creator-affiliate-program.md. I did not re-verify code; status below is from the docs. Research and process, not legal advice.

## Done vs plan

| Item | Status |
|---|---|
| Review playbook: classes, priorities, decision rules, reply drafts R1 to R6, reviewer wellbeing, daily routine | Done (docs/trust-safety/01). Replies R3, R4, R6 wait on the attorney. |
| Patterns log and rule-request loop to IP safety | Set up (02), empty: no production reports exist. Predicted gaps listed, not observed. |
| Photo cards and events abuse design (11 scenarios, prevention, report flow, queue, actions) | Written 2026-10-15, status PROPOSED. Nothing built. |
| Report form and admin page | Built and reads real data (`/internal/reports`, status PATCH needs a note, OVERDUE marked). Admin gate fixed (timing-safe token, no ALLOW_FAKE exposure). |
| Takedown workflow in the plan (M5/M7 item) | Not built. Plan wants a Supabase `reports` table, link to order, print hold, due-date alert, repeat-infringer log. |
| Photo moderation | Mock only. Fails closed, but has never seen a real photo. The CSAM hook only logs. |

## Open before soft launch (invite-only, about 50 orders)

1. **Report flow.** Form exists but: no trademark option; no "which work was copied", postal address or penalty-of-perjury wording (a valid DMCA notice needs them); footer still shows `[PLACEHOLDER]` DMCA agent text. Needs the owner's DMCA agent and a real support mailbox (CX-02, CX-31).
2. **Review queue.** Reports are rows in the JSON shop store. Not durable on Vercel, nothing links a report to an order or project, and no alert fires when `dueAt` passes. Needs Supabase (SEC-18). Until then the 48 h target depends on a person opening the page daily.
3. **Takedown handling.** Today a reviewer can only change status. Print hold, art deletion, account suspension, uploader notice and counter-notice are all manual in Stripe, Lulu and Prodigi dashboards. The only print hold is Lulu's roughly 120 minute production delay (Prodigi not verified). Hide-and-hold instead of delete, and a legal-hold flag the 90-day purge respects, are not built.
4. **Attorney items.** CSAM reporting procedure (blocks live photo moderation and the reply to any CSAM report), DMCA wording and agent, counter-notice and repeat-infringer threshold, report and evidence retention versus purge. None have an answer yet.
5. **Who covers it.** Not decided. The playbook assumes the reviewer recommends and the owner approves every remove, keep or restore. That means the owner is the on-call for P0 (same day) and P1 (24 h) during soft launch, including weekends. Owner must confirm, and arrange counselling access if harmful reports pass a handful a week.
6. **Safety gaps that will turn into reports:** vision QA passes a page when the check fails; no IP check on the model sheet; sign-off not IP-screened; short misspellings of protected names; no live harmful-content screen on book text.

Recommendation: soft launch is acceptable only if items 1 and 4 (CSAM procedure) are settled and the owner names who reads the report inbox daily. Items 2 and 3 can run manually for 50 orders if the owner accepts that.

## What social and marketing add

The product is private, so until now a report meant "someone saw a printed item". Social breaks that.

- **Creator posts (UGC).** Gifted books will appear on public accounts and may show a child's face, name, school or the book's pages. These are not GreetHub-hosted, so we cannot remove them; we can only ask the creator. Reports about them will land in our form or support. Needs a creator brief (no child's name, school or location) and a way to route "that post shows my child" to the creator.
- **Reposts and ads.** Social proposes releases that let us reuse posts, with 72 h takedown on withdrawal. That needs a release register (who, which post, expiry) and a takedown that reaches every live ad. Proposed rule that I support: paid ads never use a child's real face. No register exists yet; the plan puts it at v1.1. Not needed for soft launch because the plan holds creator seeding until Valentine's.
- **Comments on our accounts.** Need a written moderation policy: remove a child's name, school or location; send order questions to support. The owner decides who watches comments.
- **Testimonials and reviews.** Nothing collects them yet. Draft consent is in docs/research/05 and needs the attorney. A testimonial with a child's photo or name is a depicted-child case; default to text only, first name, and a way to withdraw. A fake or incentivised review is also a policy risk; disclosure rules belong to Social and the attorney.
- **Partner and affiliate content.** Disclosure misses (one fix request, then termination) are Social's check, but copycat or look-alike character art posted by a partner will be reported as copyright and trademark. Partners should show only approved sample art.
- **Community.** Plan says no open group until moderation exists. I agree.
- **Photo cards and events (later).** Event pages are the first public surface (phishing, payment scams, impersonation, doxxing). Phase 1 plan excludes event pages and mail-for-me from 2026, so these are January work, not soft launch.

## Owner asks

1. Name who reads reports daily and who is backup, including Nov and Dec weekends.
2. Appoint the attorney and give the brief: CSAM procedure, DMCA agent and form wording, counter-notice, retention. Register the DMCA agent.
3. Approve Supabase for a durable reports table and print hold.
4. Approve the rule that a reviewer recommends and the owner approves remove, keep and restore.

## Left undone

No reports reviewed (none exist). No code changes. No replies sent.
