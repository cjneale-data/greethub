# 03. Incident notification steps (privacy)

Status 2026-10-12. This is the privacy track that runs alongside technical containment in docs/security/05-incident-response.md and the severity scale in docs/data/06 s9. It is engineering and operations guidance, not legal advice: **who must be notified, when and how is decided by the owner's attorney**. US state breach laws differ by state and by data type; we do not pick deadlines ourselves.

## 1. Triggers

Any of: a customer photo, child's name, address or email reachable by someone who should not have it; a public bucket or leaked service key; customer data in logs, analytics or a ticket; a vendor telling us it retained or trained on photos; wrong-user data in an export or email; a purge or deletion that did not happen (S3).

## 2. First hour (privacy lead's part)

1. Open a private incident log (facts, UTC times, who did what). No customer content in it; ids only.
2. Tell the owner immediately. The owner names the incident lead (default CTO).
3. **Legal hold:** if evidence may be destroyed by the 90-day purge or a pending deletion, ask the owner to approve pausing the purge cron for the affected scope (today: disable the cron entry; there is no per-project hold flag, see audit A9). Write down what was paused and when.
4. Snapshot the relevant logs before they expire (Vercel keeps runtime logs briefly; see PLAN DevOps).
5. Do not contact customers, regulators or the press yet.

## 3. Scope (first 24 hours)

Answer in the incident log, with counts:
- What data classes (data/06 s2): photos of children, names, addresses, emails, payment (Stripe holds card data, not us).
- How many people, which states they live in (from ship-to or billing state), date range.
- Was it accessed or only exposed? What evidence?
- Which vendors are involved, and do their DPAs require them to notify us, or us them (04)?

## 4. Decide (owner and attorney)

Bring the attorney: the scope answers, the timeline, and the draft notices below. The attorney decides whether notice is required for individuals, state attorneys general or regulators, card brands (via Stripe), and insurers, and the deadlines. Notify the cyber insurer per the policy once bound (legal/06 req 56).

## 5. Pre-drafted notice (attorney to finalise before any send)

Plain, first names, no exclamation marks. Placeholders in brackets.

> Subject: Something happened with your GreetHub data
>
> Hi [first name],
>
> On [date] we found that [what happened, one sentence]. It involved [what data, plain words]. It did not involve your payment card, which Stripe holds.
>
> What we have done: [fix]. What you can do: [specific steps, or "nothing is needed"]. You can delete your photos or your whole account any time under Account.
>
> If you have questions, reply to this email or write to [privacy email]. We're sorry.
>
> [Name], GreetHub, [postal address]

Send from the transactional sender, one person per email, never with other recipients visible. Record each send (count, date) in the incident log.

## 6. After

- Post-incident review within 5 business days (data/06 s9).
- Update 05 (audit) with the control that failed and its fix.
- If photos were exposed, review whether the 90-day promise and box C wording still hold, with the attorney.
- Yearly tabletop: one children's-photo exposure, one PII-in-logs case.
