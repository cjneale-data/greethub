# Data schema

Types are in `app/lib/equity/index.ts`. The dashboard Artifact stores the same shapes as documents in its shared database. Real partner data will live only in that database (private artifact) or the owner's chosen store, never in the repo.

| Collection | Doc id | Fields |
|---|---|---|
| `people` | person id | name, hourlyRate (USD, set by owner), leaver (none or a leaver type), role, userId (links a viewer to this partner; a linked viewer cannot act as anyone else) |
| `time` | entry id | personId, date, hours, category, note, paidAmount (cash pay received for these hours, default 0), status (logged, approved, rejected), approvedBy, loggedAt |
| `cash` | entry id | personId, date (when spent), amount, kind (cash, expense), reimbursed (later repaid, default 0), note, status, approvedBy |
| `resources` | entry id | personId, date, fairValue, description, status, approvedBy |
| `ideas` | idea id | authorId, title, description, date, status (proposed, adopted, shipped), unlockedDate (first adopted or shipped), scores {impact, originality, evidence}, reviewedBy, reviewNote |
| `config` | `main` | planned: the `EquityConfig` values. Not read yet; the dashboard uses `DEFAULT_CONFIG` from the module |
| `audit` | auto id | at, actor (partner acted as), viewer (signed-in user id), action, target, detail (append-only by convention; the database does not enforce it) |

Constraints: `approvedBy` must be a different person from `personId`; `reviewedBy` different from `authorId`; amounts and hours positive; dates ISO `yyyy-mm-dd`. Calculation ignores anything not approved.

Later optional evidence: `evidence` field on time entries linking to git commit hashes or session log ids (supporting only).
