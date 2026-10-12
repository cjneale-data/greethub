# Data schema

Types are in `app/lib/equity/index.ts`. The dashboard Artifact stores the same shapes as documents in its shared database. Real partner data will live only in that database (private artifact) or the owner's chosen store, never in the repo.

| Collection | Doc id | Fields |
|---|---|---|
| `people` | person id | name, hourlyRate (USD, set by owner), leaver (none or a leaver type), role |
| `time` | entry id | personId, date, hours, category, note, status (logged, approved, rejected), approvedBy, loggedAt |
| `cash` | entry id | personId, date, amount, kind (cash, expense), note, status, approvedBy |
| `resources` | entry id | personId, date, fairValue, description, status, approvedBy |
| `ideas` | idea id | authorId, title, description, date, status (proposed, adopted, shipped), scores {impact, originality, evidence}, reviewedBy, reviewNote |
| `config` | `main` | the `EquityConfig` values (multipliers, caps, weights, leaver rules) |
| `audit` | auto id | at, actor, action, target, detail (append-only record of approvals and edits) |

Constraints: `approvedBy` must be a different person from `personId`; `reviewedBy` different from `authorId`; amounts and hours positive; dates ISO `yyyy-mm-dd`. Calculation ignores anything not approved.

Later optional evidence: `evidence` field on time entries linking to git commit hashes or session log ids (supporting only).
