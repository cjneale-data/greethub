# Book engineering review, 2026-10-15

Scope: docs/PLAN.md (B5, B11, Nov 13 gate), `app/lib/book/`, `app/app/create/book/`, `app/components/book/`. Read by inspection and grep; I did not run lint, typecheck or tests today, so test status below is the plan's last reported figure (457/457), not mine.

## B5 Book truth

| Item | State | Evidence |
|---|---|---|
| Six-step flow, sheet approval gate, free page retries, paid re-roll refunds, watchdog | Built (mock) | `lib/book/service.ts`, `stepper.ts`, tests in `app/tests/book/` |
| Proof shows only what prints (CX-44) | Missing | `components/book/ProofStep.tsx` lines 15, 27, 137 still show and edit a dedication on the cover page, and the plan says it does not print |
| Dedication printed on title page | Missing | needs the pipeline layout (CTO) plus a proof change |
| Unfitted text fails layout | Not verified in the book path | no fit check found in `lib/book/engine/` |
| Mock mode builds a real PDF | Missing | `engine/mock.ts:145` returns `{}` with the comment "no PDFs in mock mode" |
| Fail-closed IP verdict per page | Partial | live path calls `renderPage(..., { visionQa: true })` (`engine/live.ts:139`); brief text is screened (`service.ts:101`). I found no per-page verdict stored and no gate on approval or print for it |
| Sheet vision check | Not found | |
| CX-05 proof approval | Built (mock) | `approve-proof` action with an acknowledgement |

Acceptance ("no approval or print without an IP verdict on every page") is not met.

## photo_sets follow-up (B14.3)

- `app/lib/photo-sets/` has constants, types and a `SetStore` interface with an in-memory store. git status is clean for it, so it is committed; the plan table (line 255) still calls it uncommitted, so that line is stale.
- Nothing under `lib/book`, `app/create/book` or `api/book` imports it. The book flow has not been moved onto it, and no purge, export or delete covers sets.
- Not verified: whether the set store has a file or Supabase backend.

## Consent and purge

| Item | State |
|---|---|
| Consent boxes A to D, version hash, gate before upload and before each job | Built (`consent.ts`) |
| Withdrawal, delete-my-data, export | Built for book projects (`privacy.ts`); the account export still omits book projects and consent (legal req 28; Shop to wire in) |
| 90-day purge | Code built; cron route accepts GET with a Bearer secret; `app/vercel.json` has a daily entry. Not verified in a deployed environment |
| 14-day reminder | `photosExpiringSoon` exists. No email job sends it |
| Box C | Purge skips any project with box C ticked (`privacy.ts:16`), which keeps photos with no end date. Owner decision pending ("hide box C") |
| Durable append-only consent log | Missing. Consent lives on the project record |
| Derived data on purge | `identity.txt` and model sheets survive; legal question open |
| CSAM preservation path | Missing; needs the attorney |
| Persistence | Everything is file-store or `/tmp`. The purge only sees one instance. It all waits on B1 |

## Open items

| Priority | Item | Size |
|---|---|---|
| P0 | Hide the dedication from the proof now (CX-44) | S |
| P0 | Per-page IP verdict stored and enforced at approve and print; sheet vision check | M |
| P0 | Store move to Supabase behind the existing store interface (B1, CTO leads) | L |
| P1 | Real mock PDF and a text-fit failure (also needed so B6 has a print PDF by Oct 31) | M |
| P1 | Append-only consent log table; hide box C; make the purge ignore box C unless the photos are a Person | M |
| P1 | Reminder email job (14 days) | S |
| P1 | Book route rate limits and the 2 active unpaid books per account (B2) | S to M |
| P2 | Move the book flow onto `photo-sets` and extend purge, export and delete to cover it | M |
| P2 | Move the worker to a hosted queue (B3; CTO's call) | L |
| P2 | Index-based progress poll and purge query (follows Supabase) | S |

## Risks to the Nov 13 books gate

1. B1 is on the critical path and is not mine. Book purge, consent and project state mean nothing on a preview until it lands. Every day of slip comes off the gate.
2. B5 and B6 are tied. The mock PDF and the fit check must exist before Oct 31, or the physical-proof order on Nov 3 slips.
3. The IP verdict gate touches the pipeline (CTO) and IP safety. Three teams on one acceptance line is a scheduling risk.
4. B11 cannot finish without the attorney's Q1 to Q13 answers. No attorney is engaged (plan line 252). That alone can fail the gate.
5. Live image calls are not exercised. B5 is mock-only, so the first real-art run may find layout or timing problems late. It needs the owner's image cap (about $15).
6. The `/tmp` store loses state on a cold start, so the purge cannot be proven on a deploy.

## Needs from others

- CTO: B1 timing, the layout/PDF seam for the dedication and fit check, the queue decision.
- IP safety: per-page verdict shape and the sheet check.
- Owner: box C decision, image cap, attorney.
- Shop engineer: add book projects and consent to the export.
