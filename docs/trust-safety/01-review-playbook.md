# 01. Content report review playbook

Owner: Trust & Safety. Written 2026-10-12 against the code as it is today. Research and process, not legal advice. Anything marked **[ATTORNEY]** waits on the owner's attorney before we rely on it.

## 0. What can be reported, given how the product works

Creations are private. There is no public gallery, no share page and no public profile. So a report almost always comes from someone who saw a **printed item or a photo of one** (a recipient, a relative, a rights holder who saw a social post), or from the **customer about their own order**. That shapes everything below: "remove" mostly means *delete stored art, stop unprinted orders, refuse reprints*, not "unpublish a page".

## 1. Hard stop: suspected child sexual abuse material

If a report, link or attachment might contain sexual content involving a minor:
1. **Do not open, download, forward, screenshot or describe the image.** Not to the team, not to an agent, not in a ticket.
2. Set the report to `in_review` with the note "Escalated to owner, CSAM procedure". Write nothing else about the content.
3. Tell the owner the same day. The owner follows the reporting procedure the attorney sets (docs/legal/07 s5, req 18). That procedure does not exist yet **[ATTORNEY]**.
4. Do not reply to the reporter beyond the automatic confirmation until the owner says so.

The upload classifier's hook (`setCsamHook` in `app/lib/book/moderation.ts`) only logs today and discards the image. Whether we must preserve it instead is an open attorney question.

## 2. Classify

| Class | Form choice it usually arrives as | Priority | First reply |
|---|---|---|---|
| CSAM suspected | any | P0, same day | none (s1) |
| Depicted person or child, intimate or non-consensual image | `likeness` | P1, within 24 h | within 24 h |
| Copyright (DMCA) | `copyright` | P2 | within 48 h |
| Trademark | `copyright` or `other` (there is no trademark option) | P2 | within 48 h |
| Harmful (hate, harassment, violence, sexual content about adults) | `inappropriate` | P1 if a real person is targeted, else P2 | within 48 h |
| Other (order problems, quality, spam) | `other` | P3, hand to support | within 48 h |

Re-classify freely. The form's `kind` is the reporter's guess. Record the class you decide in the status note ("class: trademark").

## 3. Decide

Every decision is one of: **remove**, **keep** (no action), **restore** (after a counter-notice), or **need more information**. Write the decision and one line of reasoning in the status note. `PATCH /api/admin/reports` now refuses `actioned` or `closed` without a note, and keeps a history.

**Remove, keep and restore are irreversible or customer-facing. Recommend them; the owner approves them** until the attorney signs off a written policy.

### Depicted person or child
- The reporter says a picture shows them or their child without permission. We cannot verify identity or settle custody between relatives. **Do not ask for ID documents or more photos of the child.**
- Recommended default while the order is unprinted: hold it and ask the customer (uploader) to confirm they have permission (ToS s3(b)). If they can't, delete the project's photos and art and cancel the unprinted order with a full refund (ToS s5).
- Already printed or shipped: we can delete stored art and refuse reprints. We cannot recall a gift. **[ATTORNEY]** what else, if anything, is owed.
- Intimate images or deepfakes (AUP rule 2): remove without waiting for the uploader. Flag the account for owner review.

### Copyright
- A valid notice needs every element in ToS s9. Our form collects a signature, the good-faith tick, where it is and an email. It does **not** collect: which work was copied (only free text in "What is the problem?"), a postal address or phone, or the "under penalty of perjury" wording. If elements are missing, send reply R3. **[ATTORNEY]** confirm the elements and the form wording.
- Most copyright reports will be about a look-alike character. Check the order's story text and pages against the IP table (docs/legal/07). If the art is a look-alike, recommend remove, and log the pattern (02-patterns-and-rules.md) so IP safety adds a rule.
- Counter-notice and restore: not built. If we delete the art on removal, we cannot restore it. **[ATTORNEY]** whether to hide-and-hold instead of deleting while a counter-notice window is open.

### Trademark
- A brand name or logo on a card or book. Check whether the customer typed it (card message printed verbatim) or the model drew it. Recommend remove for logos; for a plain mention in a message, see attorney question 1 in docs/legal/07 s10.

### Harmful content
- Our product is private, so this is usually "someone sent me a card that is cruel or threatening". Recommend remove plus account review. Threats of violence or self-harm: the owner decides whether to contact authorities. We don't make that call.

## 4. What a reviewer can actually do today

Honest list, so nobody promises more than exists:
- **See** reports at `/internal/reports` (admin token outside local dev), with OVERDUE marked and the status history.
- **Change status** with a note (`PATCH /api/admin/reports`, body `{ id, status, note }`).
- **Nothing else in the app.** There is no admin order lookup, no link from a report to an order or project, no "hold print" or "delete art" button, no account suspension, no repeat-infringer list, no uploader notification and no counter-notice flow. Each of these is manual work by the owner in the Stripe, Lulu or Prodigi dashboards and the store, and the only print hold is Lulu's roughly 120-minute production delay (Prodigi not verified).
- `deleteUserBookData` deletes **all** of a user's book data. It is a privacy tool, not a takedown tool. Don't use it to remove one book.

## 5. Evidence and privacy

- Keep: the report row, the decision note and history, and order or project **ids**. Never copy customer images, photos or page art into the repo, a ticket, an email, an agent prompt or analytics (standing rule 5).
- Refer to a page by project id and page id, not by describing the child.
- The team-notice email carries the reporter's text, which may describe a child. Keep the report inbox access to the owner and the reviewer. Retention for reports is an open attorney question (docs/data `content_reports` row).
- Conflict to settle **[ATTORNEY]**: the 90-day purge and delete-my-data can erase art that is the subject of an open report or dispute. We have no legal-hold flag.

## 6. Reply drafts

Placeholders in [brackets]. First names, plain words, one exclamation mark at most. Every reply is reviewed by a person before sending. Replies marked **[ATTORNEY]** are not sent until the attorney approves the wording.

**R1. Need more information (any class)**
> Hi [first name], thanks for writing to us about [reference]. To find what you're describing, could you send the order number, or tell us where you saw it and roughly when? You don't need to send any photos. We'll pick it up as soon as we hear back.
> GreetHub

**R2. Likeness, acted on**
> Hi [first name], thank you for telling us. We've removed the pictures you described from our systems and stopped any copies that hadn't been printed yet. If anything was already printed and sent before your report, we can't get that back, but we won't print it again. If you see it anywhere else, reply here and we'll look again.
> GreetHub

**R3. Copyright notice incomplete [ATTORNEY]**
> Hi [first name], thanks for your notice ([reference]). To act on a copyright notice we need a few more details: [list the missing items, for example "which of your works you believe was copied" or "a postal address or phone number"], and a statement, under penalty of perjury, that the information is accurate and you are the owner or authorized to act for the owner. Reply here with those and we'll pick it straight back up.
> GreetHub

**R4. Copyright or trademark, removed [ATTORNEY]**
> Hi [first name], thanks for your notice ([reference]). We've removed the material you identified and won't print it again.
> GreetHub

**R5. No action**
> Hi [first name], thanks for writing to us about [reference]. We looked at [what we checked] and didn't find [reason in one plain line], so we haven't removed anything. If we've missed something, reply with more detail and we'll look again.
> GreetHub

**R6. To the customer whose content was removed [ATTORNEY]**
> Hi [first name], we've had a report about [book or card title] and we've [removed it / paused the order]. [For copyright: If you believe this was a mistake, you can send us a counter-notice; here's what it needs: ...] [If the order was refunded: You'll see a full refund of [amount] on your card within [N] days.] Reply here if you have questions.
> GreetHub

## 7. Reviewer wellbeing

Most reports will be ordinary. Some will describe harm to children or cruel messages. Rules:
- Never view suspected CSAM (s1). Text-first review: read the report, then look at art only when the decision needs it, at thumbnail size.
- Stop after any distressing item and take a break before the next one. Don't review harmful reports late at night.
- At more than a handful of harmful reports a week, the owner should arrange access to counselling for whoever reviews, and rotate reviewers.

## 8. Daily routine

1. Open `/internal/reports`. Handle anything OVERDUE first, then P0/P1, then oldest first.
2. Move each new report to `in_review` with the class in the note.
3. Send the first reply within the target. Recommend the action to the owner.
4. After the owner acts, set `actioned` or `closed` with the decision note.
5. Add any repeat or new pattern to `02-patterns-and-rules.md`.
