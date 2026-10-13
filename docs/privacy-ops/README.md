# Privacy operations

Owner of this folder: Privacy and Compliance Operations. Research and engineering, not legal advice. Anything marked **ATTORNEY** needs the owner's attorney before it is relied on.

Mission: make the privacy promises true in practice, and keep proof that they are.

| File | What it is | Use it when |
|---|---|---|
| [01-dsar-runbook.md](01-dsar-runbook.md) | Access, export, correction and deletion requests, end to end | A customer asks for their data or asks us to delete it (in the app or by email) |
| [02-purge-verification.md](02-purge-verification.md) | Checks that the 90-day photo purge and deletions really happened | Daily (automatic), monthly (manual sample), after any restore |
| [03-incident-notification.md](03-incident-notification.md) | Privacy steps inside an incident: scope, hold, who to tell, records | Any suspected exposure of customer data or children's photos |
| [04-vendor-agreements.md](04-vendor-agreements.md) | DPA, sub-processor and renewal tracker, including the DMCA agent | Monthly review; before adding a vendor; renewal dates |
| [05-audit-2026-10-12.md](05-audit-2026-10-12.md) | Audit of code against the privacy promises, with file references, and the recurring audit checklist | Planning fixes; before launch; each quarter |

Related, owned by other teams (read, do not edit here):
- docs/legal/02-children-photos-privacy.md, 05-policies-draft.md, 06-product-requirements.md (the requirements, "req N" below)
- docs/data/06-data-governance.md (classes, retention schedule, deletion propagation design for Supabase, incident severity)
- docs/security/05-incident-response.md (technical containment)
- docs/cx/02-support-model.md (who answers customer email)

## Standing rules for anyone running these runbooks

1. Never delete customer data without a documented request (ticket or in-app request record) **and** the owner's approval for anything outside the self-serve buttons. The self-serve flows are the customer's own action and need no approval.
2. Never copy customer photos, children's names or addresses into tickets, chat tools, analytics, logs or this repo. Refer to ids.
3. Every request and every manual deletion gets a line in the request log (01, section 6). Counts and ids only.
4. If a request involves a child under 18 as the account holder, a legal hold, a takedown, a law-enforcement request or suspected CSAM, stop and escalate to the owner. Do not improvise.

## Calendar

| When | What | Who |
|---|---|---|
| Daily 08:17 UTC | Purge cron runs and returns `verify` counts (02) | automatic; DevOps alert on non-zero |
| Weekly | Open requests older than 20 days | Privacy ops |
| Monthly, first Monday | Purge sample check (02 s3), request log review, vendor sub-processor notices (04) | Privacy ops |
| Quarterly | Audit checklist (05 part B); access review (data/06 s5) | Privacy ops, CTO |
| Yearly | Policy and vendor terms review (req 53); tabletop exercise (03) | Owner, attorney |
| Every 3 years from registration | DMCA designated agent renewal (04) | Owner |
