# CTO review, committee 2026-10-15

Method: read from code on `master` (e34923e), `photo-events-wave1`, `photo-events-wave2`, `home-gallery` (diffs and file reads). I did not run lint, typecheck or vitest for this review, so every status is read from code, not from a test result. "Mock only" means the path runs with fakes or `GREETHUB_MOCK_AI=1` and has no live vendor behind it.

## 1. True build status, B1 to B14

| Item | Status | Evidence |
|---|---|---|
| B1 Persistence | Built, unproven | `app/lib/store/supabaseDocs.ts`, `adapters/real/supabaseAuth.ts`, `supabaseStorage.ts`, 3 migrations in `app/supabase/migrations/`. Never run against a real project, so RLS cross-user test and cold-start survival are unverified. DATA-001 consent and ledger tables are not in the migrations (only `content_reports`). Book projects and jobs still use the file store (`app/lib/book/store/fileStore.ts`), not Supabase. |
| B2 Cost controls | Not started for production | Reserve/settle ledger exists only in `lib/agent/memory.ts` (dev) and `pipeline/src/ledger.ts`. No Postgres ledger, no durable limiter, no Turnstile (no match in `app/`). |
| B3 Job host | Not started | `getQueue()` in `app/lib/book/queue.ts` still has `TODO(SEC-21)`: on Vercel it returns `AfterResponseQueue` (render inside the request via `after()`), locally a detached process. No durable consumer, no per-model concurrency, no printer-polling jobs. |
| B4 Account card flow | Partial, mock | `app/api/card/{message,preview}` exist. No approval page, full render job or verified `creationId` cart link found. |
| B5 Book truth | Partial, mock | Book engine (mock and live) exists. Fail-closed IP verdict per page and proof approval not confirmed in code. |
| B6 Print path | Mock only | `orderService.printAssets()` (line 107) is a stub. Lulu and Prodigi adapters exist; no signed-URL PDFs, cover wrap, or sandbox run. |
| B7 Ops minimum | Partial | `api/admin/{orders,reports}`, `fulfillmentOps.ts`. Audit log, alerts, `-R1` reprint unconfirmed. |
| B8 Measurement | Not started | No collector in `app/lib` (`safety/events.ts` is safety only). |
| B9 Done gate | Partial | Scripts in `app/tests/e2e/*.mjs`. No preview test-auth path, CI e2e job, log drain or backup drill found. |
| B10 Real art | Partial | Sample art merged (#8). Rest not checked here. |
| B11 Before real photos | Partial | `app/lib/book/consent.ts` exists. Append-only consent log not found. Attorney answers are an owner item. |
| B12 Handwriting | Built, mock | `app/lib/writing`, on master (#9). `resolveCardWriting` not wired into a print job (needs B4/B6). |
| B13 Membership | Built, off in prod | `app/lib/membership`; needs `GREETHUB_MEMBERSHIP=1`. |
| B14 Photo cards | Partial, mock | B14.1 fake `FlatCardPrinter` only (`adapters/flatCard.ts`, `fake/flatCardPrinter.ts`), no real adapter. B14.2 collage engine and tests (wave 1). B14.3 `lib/photo-sets` built on a loosened store type. B14.4 `lib/proof-check` built, no editor UI. B14.5 `lib/shop/photoCard/{cart,batchJobs,priceConfig}` built. B14.6 and B14.8 not started. B14.7 `ip-table.json` and red-team fixture extended. |

The agent channel (`app/lib/agent`, `app/api/mcp`) is a framework, dark by default, not on the launch path.

## 2. Critical path to Nov 13 (books) and Nov 20 (cards)

Four weeks to Nov 13. Needed: B1 proven live, B2, B3, B5, B6, B11, then B9 STRICT e2e.
1. Owner credentials first: Supabase project, Stripe test, Lulu sandbox, Prodigi sandbox, Resend (`docs/cto/setup-needed.md`). Without them B1, B6 and B9 cannot be proven.
2. B3 queue is the top technical risk. A 24 to 32 page render in `after()` will exceed Vercel function limits. A durable page-per-step queue must exist before B5 and B6 can be tested live.
3. B6 print PDFs from signed URLs plus Lulu cover wrap, then a physical proof. Proof must be ordered by about Nov 6.
4. Attorney answers Q1 to Q13 (owner).

Nov 20 cards ride on B4, B6 (Prodigi) and a card proof.

Top risks: (a) B3 not started; (b) B1 never exercised against real Supabase and book state still on the local file store, so a preview loses jobs on cold start; (c) no live key has run the full pipeline under a spend cap; (d) proof lead time.

Cut, in order: B14 beyond B14.1 and B14.8 (plan already says so on no-go); agent channel; B8 beyond three funnel events; B10 beyond covers and hero; Express shipping. Fallback stays: no Christmas books, cards only, digital after cut-off.

## 3. Tech debt and integration gaps

1. `photo_sets` is not in `Docs` or `INDEX` in `app/lib/store/docs.ts`; `lib/photo-sets/store.ts` casts to a `LooseDocs` type with a TODO. Add it, plus the file-store DB type.
2. Neither `batch_jobs` nor `photo_sets` has a SQL migration. `batch_jobs` is already in `Docs`/`INDEX` on wave 2, so on Supabase its reads and writes would hit a missing table. Add `gh_create_doc_table('batch_jobs')` and `('photo_sets')` in a new migration.
3. `JobQueue` has no production implementation (Inline, Recording, LocalProcess, AfterResponse). `batchJobs.ts` takes a `JobQueue`, so it inherits the gap. No retry or dead-letter.
4. Book photos are coupled to the per-file book project store. Lifting them into `photo_sets` is the riskiest refactor (per `docs/cto/photo-events-architecture.md`). `photo-sets/purge.ts` has no scheduler.
5. Two printer interfaces now (`Printer`, `FlatCardPrinter`), fakes only for flat cards. `real/stripe.ts` was touched for batch lines and is untested live.
6. Print path stub; handwriting snapshot at checkout not done.
7. Plan wants one DPI rule in one module; confirm before B14.4.
8. Commit 20857a2 allowlists a gitleaks finding; confirm the allowlist is narrow.

## 4. Merge order

All three branches fork from master e34923e. `photo-events-wave2` already contains wave 1, so it carries #12's commits.
1. #12 wave 1 (docs, collage, recipients). No file overlap with the others.
2. Wave 2 branch. If #12 is squash-merged, rebase wave 2 onto master first or it will replay #12's changes. Run app lint, typecheck and vitest after merge (not run here).
3. #13 home gallery touches only `app/app/page.tsx` and `components/shop/*`. A `git merge-tree` of wave 2 with home-gallery produced a clean tree, so the order versus wave 2 does not matter.
Expected conflicts: none in code. Possible in `docs/PLAN.md` if anything else edits it, and in `app/lib/store/docs.ts` once gap 3.1 is fixed. Ship the migration with the next Supabase push.

## 5. Decisions needed

1. Queue: Supabase table plus cron consumer, or Inngest (new vendor). I recommend the Supabase table: no new account, fits B1.
2. Oct 24 photo-card go/no-go. I agree with the PM read: plan for no-go, spend no CTO days on B14 beyond B14.1 and B14.8 until the call.
3. Spend cap and who loads keys into Vercel preview for the first live render (plan suggests about $15).
4. Move book state to Supabase before Nov 13 (recommended) or accept the file store on one worker host for the soft launch.
5. Attorney engagement date; it gates B11 and Nov 13.
