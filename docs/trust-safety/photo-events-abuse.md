# Photo cards and events: abuse, reports, review queue and actions

Owner: Trust & Safety. Version 2026-10-15, wave 1. Status: PROPOSED.
Plan: docs/products/photo-cards-and-events-plan.md (s4.6, s7, s8). Built on docs/trust-safety/01-review-playbook.md and 02-patterns-and-rules.md, the AUP in docs/legal/05-policies-draft.md, and the event design in docs/cto/photo-events-architecture.md s6.
Research and process, not legal advice. **[ATTORNEY]** marks anything that waits on the owner's attorney. **[OWNER]** marks a decision only the owner can make. Nothing here has been built; every "the reviewer can" below is a requirement, not a feature.

## 0. What changes

The playbook (01 s0) rests on "creations are private". Photo cards and events break that in three ways:

1. **Event pages are the first GreetHub surface people outside the customer can open.** Unlisted and noindexed, but anyone with the link (or the QR on a printed card) reaches it, and links travel.
2. **GreetHub sends mail and email on the host's behalf to a list of people who never signed up with us.** Reminder emails come from our domain; mail-for-me puts our cards in strangers' mailboxes. Abuse there damages our sender reputation and our name, not just the host's.
3. **One bad photo becomes 25 to 300 printed copies.** A harmful single card hurts one person; a harmful batch order is a mailing.

So "remove" now also means *hide a live page, stop reminder emails, and hold a batch before it prints*, all of which must be fast and reversible.

## 1. Abuse scenarios

| # | Scenario | Vehicle | Who is harmed | Likelihood at launch | Severity |
|---|---|---|---|---|---|
| A1 | **Phishing page**: event page whose link or text sends guests to a fake sign-in, fake delivery-fee or fake "confirm your seat" page | Event page links, RSVP note, details text, QR on print | Guests | Medium (free pages for members make it cheap) | High |
| A2 | **Payment scam**: "RSVP requires a $40 deposit to this payment handle", fake wedding or memorial fundraiser, fake registry link | Event page text and links | Guests | Medium | High |
| A3 | **Impersonation**: a page posing as a real couple's wedding or a real family's party, to collect money or to mock them | Event page, invitation | The impersonated people, guests | Low | High |
| A4 | **Spam relay**: pages used as ad landing pages; reminder emails used to mail many addresses a host typed or imported | Reminders, guest list import | Recipients, our email domain | Medium | Medium (High for deliverability) |
| A5 | **RSVP form spam**: bots filling RSVP notes with links or junk on someone else's event | RSVP form | Host | High (any public form gets this) | Low |
| A6 | **Harassment by invitation**: an "event" made to shame or target a person (mock memorial for a living person, "divorce party" naming an ex, invitations sent to someone who asked for no contact) | Event page, printed invitation, mail-for-me | Named or targeted person | Low | High |
| A7 | **Doxxing or luring**: a page that publishes a private person's home address or schedule, or a fake event used to get someone to a place | Event details, map link | Targeted person | Low | Very high (physical safety) |
| A8 | **Unwanted mail**: mail-for-me to people who don't want contact from the sender, or to a list bought or scraped | Mail-for-me, address import | Recipients | Low to medium | Medium |
| A9 | **Offensive photo in a batch order**: hate symbols, nudity, gore, a photo meant to humiliate someone, photos of other people's children without permission | Card front/back, event page header | Recipients, people pictured | Low | High (multiplied by quantity) |
| A10 | **Children's photos on an event page**: a birthday page with a child's photo, name, age, school and address open to anyone with the link | Event page | The child | Medium (normal, well-meant use) | Medium |
| A11 | **Protected characters or logos in uploaded photos** (a character costume, a team logo across the front of 150 cards) | Batch photo card | Rights holder | Medium | Low to medium; owned by IP safety (docs/legal/photo-events-ip.md) |

A10 and A11 are mostly ordinary customers, not abusers. They need defaults and gentle warnings, not punishment.

## 2. Prevention: what should stop most of this before a report

Requests to other teams (I write only here; see s9). Each row names the scenario it addresses.

**Event page content**
- **Links**: `https` only; at most 5 links per page; no URL shorteners or raw IP addresses; links rendered with the destination domain visible next to the label ("Registry, example-registry.com"). A link-reputation check on save is worth evaluating; I have not verified the cost or terms of any provider. (A1, A2, A4)
- **No payment fields.** No "pay to RSVP", no amount fields, no payment-handle field. Text containing a payment handle or "deposit/fee to RSVP" wording gets a soft warning to the host and a flag to the queue. Gift and registry links stay allowed. (A2)
- **Plain text only** in details and RSVP notes; links in guest RSVP notes are shown as text, never clickable, and never emailed to the host as links. (A1, A5)
- **Address and map**: show the venue map link only to guests past the password or with a guest token when the host turns on "invited guests only"; default the street address to hidden on pages with no password. Warn the host when the venue looks like a home address. (A7, A10)
- **Children on pages**: when a page photo has a child (moderation already detects faces; age is the consent tick's question, not a classifier's), nudge the host to add a password and not to list school or full birth date. Never block. (A10)
- **Photos on pages** go through the same moderation as uploads (CSAM block, nudity, violence). (A9)

**Accounts and volume**
- Event pages for accounts that have **a verified email**, and the first page for a free account capped at a small guest count (CTO/Security to set the number) until the account has a paid order. (A1, A2, A4)
- Reminder emails: fixed GreetHub template, host's first name and event title, host free text limited to a short line with no links, capped per event per day (CTO s6 already caps), sent only to guests the host added, and **every reminder carries "Report this" and "Stop emails about this event"**. (A4, A6, A8)
- Guest-list imports above a size threshold on a new account, or with a high bounce rate on first send, pause reminders and flag the queue. (A4)
- RSVP form: rate limits, honeypot and guest-token mode are in the CTO design; Security owns the numbers. (A5)

**Batch orders**
- Moderation runs on every photo at upload (existing pipeline) **and again on the final rendered front and back** at proof time, because text and photos combine (a harmless photo plus a cruel caption). (A9)
- The card text (greeting, letter, sign-off, return address block) goes through the harmful-content screen that card messages use. The existing gap that sign-offs are not screened (02, known gaps) must be closed for batch cards. (A6, A9)
- Any flag on a batch order **holds it before submission to the printer** and puts it in the queue. A held order is not cancelled; the customer sees "We're checking your order, usually within a day". (A9)
- Mail-for-me: a GreetHub-wide **"don't mail me" list** (a recipient can ask us to stop all mail-for-me to their address). Matching addresses are dropped from future batches and the sender is told how many were skipped, not which. **[ATTORNEY]** whether keeping such a list is required, allowed, and how long. (A6, A8)

## 3. Report flow

### Entry points
| Where | What the reporter sees | Prefilled |
|---|---|---|
| Footer of every event page: "Report this page" | The /report form | `kind: event`, the event slug as reference |
| Every reminder email: "Report this" and "Stop emails about this event" | Report: the /report form. Stop: one click, confirmation page, no sign-in | Event id and guest token (stop is not a report, but 3+ stops on one event raise a flag) |
| Printed cards and invitations (mail-for-me only): small back-of-card line "Didn't expect this? greethub.com/report" | /report form | Nothing; reporter types the order code printed next to it. **[OWNER]** and CMO: whether this line goes on cards; it is ugly but it is the only way a recipient of unwanted mail can reach us |
| RSVP host dashboard: "Report spam" on a reply | Marks the reply spam, hides it, no form | Event id, RSVP id |
| Support inbox | Support hands any abuse email to T&S with the event or order reference | |

### Form changes (shop engineer owns `ReportForm.tsx` and `lib/shop/types.ts`)
Today `kind` is `copyright | likeness | inappropriate | other`. Add:
- `event`: "A GreetHub event page or invitation", with a sub-choice: *it looks like a scam or asks for money*, *it pretends to be someone*, *it targets or harasses someone*, *it shows my address or my child*, *it's spam*, *something else*.
- `unwanted_mail`: "I got cards or emails I don't want", with a link to the stop page.
Keep: no photo upload on the form; never ask a reporter to send images.

### Automatic reply
Same as today (confirmation email with reference). Add for `event` reports: "If you entered a password or payment details on that page, change the password and contact your bank. We'll look at the page right away." This line is safety advice, not legal advice; CX to confirm wording.

## 4. Classify and prioritize

Extends the table in 01 s2. CSAM procedure (01 s1) is unchanged and overrides everything: if a report about an event page or batch might involve sexual content of a minor, do not open the page or photos, escalate to the owner the same day, write nothing about the content.

| Class | Typical source | Priority | First action target | First reply |
|---|---|---|---|---|
| CSAM suspected | any | P0 | Owner same day | none (01 s1) |
| Luring or doxxing (A7), threat of violence | `event` (targets / shows my address) | P0 | Hide page within 4 h of report, owner told immediately | within 4 h |
| Phishing or payment scam on a live page (A1, A2) | `event` (scam), link flag | P1 | Hide page and stop reminders within 4 h | within 24 h |
| Harassment or impersonation (A3, A6) | `event`, `inappropriate` | P1 | Hide page / hold batch within 24 h | within 24 h |
| Offensive photo in a batch, not yet printed (A9) | auto-flag | P1 | Decide before the order-by date; within 24 h in December | to customer within 24 h |
| Offensive photo, already mailed (A9) | `inappropriate`, `unwanted_mail` | P2 | Refuse reprints, account review | within 48 h |
| Child's details on a page, reported by a parent (A10) | `event` (my child), `likeness` | P1 | Hide page, ask host | within 24 h |
| Spam relay (A4) | flags, stops, bounces | P2 | Pause reminders | within 48 h |
| Unwanted mail (A8) | `unwanted_mail` | P2 | Add to don't-mail list | within 48 h |
| RSVP spam (A5) | host "Report spam" | P3 | Automatic hide; reviewer looks only at patterns | none |
| IP in photos (A11) | `copyright` | P2 | Per 01 s3 and IP safety's thresholds | within 48 h |

The 4-hour targets are tighter than the 48-hour mission because the harm is live and ongoing. **[OWNER]** confirm someone can meet a 4-hour target, including weekends in December and wedding season; if not, the auto-hide rule in s5 carries the load.

## 5. Review queue

### What one queue item must show (CTO/Security to build into `/internal/reports` or a sibling page)
- Report row(s) as today, plus **all reports and flags for the same event or order grouped together**, with a count.
- Event: id, slug, created date, host account id and account age, whether the host has a paid order, password on/off, guest count, reminders sent, stops, bounces, the list of link domains (domains only), and a thumbnail of the page header image **only on click**.
- Batch order: order id, quantity, delivery mode, print status and the printer cut-off time, the moderation verdicts per photo and per rendered side, the text-screen verdict, and the proof thumbnail on click.
- Never shown: guest names, emails or addresses, RSVP contents beyond a count. The reviewer does not need them to decide, and they are third-party data (plan s7).

### Auto-flags (put an item in the queue without a report)
- Link domain fails a reputation check, or is a shortener or IP.
- Payment wording in page text.
- 3 or more "stop emails" on one event, or bounce rate above Security's threshold.
- Moderation or text-screen flag on any batch order or page image.
- New account (under 7 days, no paid order) creating more than 2 event pages or importing more than the cap.

### Auto-hide (reversible, before human review)
Proposed: an event page is **hidden automatically** (guests see "This page isn't available right now", same as the 404 the CTO design uses) and reminders pause when any of:
- 2 or more independent reports of `event` scam or targets/address within 24 h;
- a link-reputation failure on a page from an account with no paid order.
Batch orders with any moderation flag are always held (s2).
**[OWNER]** approve the auto-hide rule. It is reversible, but it is a customer-facing action taken without a person, so it needs the owner's yes before it is switched on.

### Reviewer steps
1. Text first: read the report and the flags; open thumbnails only if the decision needs them (01 s7).
2. Classify (s4) and write the class in the note.
3. Choose an action from s6 within the reviewer's authority, or recommend one to the owner.
4. Send the reply draft (s7) after a person reads it.
5. Log the pattern in 02-patterns-and-rules.md (ids and one line only).

## 6. Actions

| Action | Reversible | Who decides (until an attorney-approved written policy exists) | Built today |
|---|---|---|---|
| Hide event page | Yes | Reviewer, once the owner approves this table | No |
| Pause reminder emails for an event | Yes | Reviewer | No |
| Hide a single RSVP reply | Yes | Host (dashboard) or reviewer | No |
| Hold a batch order before printing | Yes, until the printer cut-off | Reviewer | No (Lulu has a ~120 min delay; flat-card printer not chosen) |
| Ask the host or customer to fix something (remove a link, add a password, swap a photo) | Yes | Reviewer | No (manual email) |
| Unhide / release | n/a | Reviewer, with a note | No |
| Add an address to the don't-mail list | Yes (on request) | Reviewer | No |
| Delete event page and its photos | **No** | Owner | No |
| Cancel and refund a batch order | **No** | Owner | Manual in Stripe |
| Refuse reprints of a design | Yes | Owner | No |
| Suspend or close an account; block event pages for an account | Partly | Owner | No (AUP notes this is manual) |
| Report to a phishing or abuse service, a platform, or authorities | **No** | Owner, following the attorney's procedure | No |
| Preserve evidence of a removed scam page | n/a | Owner | No legal-hold flag (01 s5) |

Rule of thumb: **hide and hold first, delete later**. Deleting a scam page also deletes the evidence and blocks a restore if we got it wrong. Delete only after the owner approves and the attorney's retention answer is in.

### Decision guidance
- **Phishing or payment scam**: hide, pause reminders, recommend account suspension. Do not contact guests ourselves until the owner and attorney say what we may send; recommend to the owner a short notice to guests who opened the page if we can tell. **[ATTORNEY]** whether a notice is owed or advisable.
- **Impersonation**: if the reporter says they are the impersonated couple or family, hide first; we can't verify identity and don't ask for ID. Ask the host for an explanation; restore only if the reporter withdraws or the owner decides.
- **Harassment by invitation**: hide or hold, recommend account review. A threat or a lure (A7): owner decides on authorities the same day.
- **Offensive photo, not printed**: hold and ask the customer to replace the photo (R10). If it is a clear AUP rule 1 to 3 breach, recommend cancel and refund plus account review.
  - Common false positives to clear quickly: swimsuits and bath-time baby photos (nudity flag; if a child, apply the consent rules and **do not** look closer than the thumbnail; if it might be sexual, it is P0 and the CSAM procedure applies), Halloween costumes and stage makeup (violence flag), hunting or fishing trophies (violence flag), military uniforms, tattoos. Hunting photos on holiday cards are legitimate customer content; IP safety and Design should set whether they pass.
- **Offensive photo, already mailed**: we can't recall mail. Refuse reprints, account review, reply to the reporter honestly (R5 or R12).
- **Child's details on a page, parent reports**: hide, ask the host to remove the child or add a password. If the reporter is the other parent in a dispute, we don't settle custody (01 s3); keep it hidden until the host and reporter agree or the owner decides.
- **Spam relay**: pause reminders, cap the account, ask the host where the list came from. Repeat: recommend blocking event pages for the account.

## 7. Reply drafts

Same rules as 01 s6: placeholders in [brackets], first names, plain words, at most one exclamation mark, a person reads every reply before it goes. **[ATTORNEY]** on anything that admits or promises more than the facts.

**R7. To a reporter, event page hidden**
> Hi [first name], thank you for telling us about this page ([reference]). We've taken it down while we look into it, and we've stopped any emails about it. If you typed a password or payment details on a page it linked to, please change that password and talk to your bank. Reply here if there's anything else we should know.
> GreetHub

**R8. To a host, page hidden [ATTORNEY]**
> Hi [first name], we've had a report about your event page "[event title]" and we've hidden it for now while we check. [What we need: for example "Could you remove the link to [domain]? Links that ask guests to sign in or pay can't go on GreetHub pages."] Once that's done, reply here and we'll look again, usually within a day. Your guest list and replies are safe in the meantime.
> GreetHub

**R9. To a guest, emails stopped**
> Hi [first name], you won't get any more emails from us about "[event title]". If you'd also like us to tell the host, or if this invitation upset you, reply here and we'll take a look.
> GreetHub

**R10. To a customer, batch order on hold**
> Hi [first name], we're holding your order of [quantity] [product] before it prints because one of the photos needs a second look: [the side and slot, for example "the top-left photo on the front"]. Could you swap it for another one in your project? Your order-by date is still [date], so there's time. If you think we've got this wrong, reply and a person will check it today.
> GreetHub

**R11. To a recipient, added to the don't-mail list [ATTORNEY]**
> Hi [first name], we've added your address to our list so that no one can send you cards through GreetHub's mailing service. If anyone tries, we'll leave you out and won't tell them why. If you change your mind, reply here.
> GreetHub

**R12. To a reporter, offensive card already mailed**
> Hi [first name], I'm sorry you received this. The cards had already been mailed before your report, so we can't take them back, but we've stopped any reprints and we're reviewing the account that sent them. Thank you for telling us.
> GreetHub

## 8. Patterns to watch and feed into rules

Add rows to 02-patterns-and-rules.md as these appear (ids and one line only):
- Link domains that recur across reported pages → Security's link blocklist.
- Page wording that recurs in scams ("deposit to RSVP", "verify your seat") → the payment-wording flag.
- Photo flag types that are mostly false positives → IP safety's moderation thresholds (docs/legal/photo-events-ip.md).
- Logos and costumes that recur in batch photos → IP safety's photo rules.
- Accounts with more than one upheld action → the repeat-infringer table in 02 (after owner confirmation).
Metrics for Head of Data (counts only, no content): reports per 1,000 event pages, auto-hide rate and how many were released on review, time to first action by class, batch holds per 1,000 orders and false-positive share, stops per 1,000 reminders.

## 9. What I need from teammates

| Team | Ask |
|---|---|
| CTO / Security | Link rules, payment-wording flag, auto-flags and auto-hide in s5, reversible hide/pause/hold controls with an audit log, queue fields in s5, "stop emails" endpoint, don't-mail list check in mail-for-me |
| Shop engineer | `event` and `unwanted_mail` report kinds with sub-choices; prefill from event page and email links; batch hold state before printer submission |
| IP safety | Moderation thresholds for batch photos and rendered sides; second moderation pass at proof; false-positive guidance (s6) |
| Card engineer / intake | Harmful-content screen on greetings, letters and sign-offs for batch cards |
| Head of CX / Design | "Report this page" in the event footer; host warnings (home address, child on an open page, payment wording); held-order message |
| CMO | Whether the "Didn't expect this?" line goes on mail-for-me cards |
| DevOps | Bounce and complaint tracking for reminder emails, so spam relay is visible |
| Fulfillment | Whether the chosen flat-card printer and mailing partner offer a hold or cancel window, and how long |
| General counsel | The attorney questions below in the legal brief |

## 10. Attorney questions [ATTORNEY]

1. Our liability for third-party content on event pages, and whether a notice-and-takedown process is required or simply advisable for non-copyright complaints.
2. Whether reminder and "you're invited" emails sent on a host's behalf are commercial or transactional, and what unsubscribe and sender-identification rules apply.
3. Whether we may, must, or should keep a don't-mail list of third-party addresses, and for how long.
4. Evidence retention for removed scam or harassment pages versus the 90-day purge and delete-my-data.
5. Whether we owe or should send a notice to guests of a page found to be phishing.
6. The procedure for law-enforcement requests about a host, and for reporting threats or luring.
7. Event terms: what the host promises about content, links and guests' data (to go in the event-page terms the general counsel is drafting).

## 11. Owner asks [OWNER]

- Approve the action table in s6 (which reversible actions a reviewer may take without asking).
- Approve or reject auto-hide (s5).
- Confirm who covers the 4-hour targets for P0 and P1 event reports, including December weekends.
- Decide whether the "Didn't expect this?" line goes on mail-for-me cards.
- Choose and brief the attorney on s10.
