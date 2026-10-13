# 02. Purge and deletion verification

Status 2026-10-12. Proves that the 90-day photo purge (legal/06 req 25) and customer deletions (req 28) actually removed what we say they remove. Never deletes anything itself.

## 1. What runs

| Job | Code | Schedule | Output |
|---|---|---|---|
| 90-day photo purge | `purgeExpiredPhotos` in `app/lib/book/privacy.ts`, called by `app/app/api/book/privacy/purge/route.ts` | Vercel Cron daily `17 8 * * *` (`app/vercel.json`), GET with `Authorization: Bearer $CRON_SECRET` | `{ photosDeleted, projectsTouched, verify }` and a row per project in `logs/deletions.jsonl` |
| Purge verification | `auditPhotoRetention` in the same file, run by the same route right after the purge (added 2026-10-12) | same | `verify: { overdue, keptByBoxC, orphanFiles }` (counts only); `console.error("photo purge verification failed", ...)` when `overdue` or `orphanFiles` is non-zero |
| 14-day reminder email (req 26) | `photosExpiringSoon` exists | **not scheduled; no email template** | none. Gap, audit A5 |

## 2. Daily check (automatic once DevOps wires the alert)

Pass when the cron returned 200 and `verify.overdue = 0` and `verify.orphanFiles = 0`.

- `overdue > 0` after a purge means a photo past its date is still on record: the store update failed, or the purge crashed part way. Re-run the cron once (POST with `x-cron-secret`, or wait a day). If still non-zero, open an S3 incident (03) and tell the book engineer.
- `orphanFiles > 0` means a photo file exists in storage that no book points to (an upload whose project update failed, or a delete that removed the record but not the file). Do **not** delete by hand. Report the count to the owner and the book engineer; an orphan sweep needs an owner decision (audit A8).
- `keptByBoxC` is informational: photos older than 90 days kept only because box C was ticked. Today that is every box C photo, forever, which is audit A1.

Known limit: on Vercel the data is in one instance's `/tmp`, so the cron sees only the instance it lands on. Until SEC-18 the daily check proves nothing about production. Record "not verifiable" rather than "pass".

## 3. Monthly manual sample (first Monday)

1. Read the last 30 cron responses (Vercel cron log or log drain). Count days with a 200. Target 30 of 30.
2. Pick five project ids from `deletions.jsonl` lines with `reason: "retention_90_days"` from the past month. For each, confirm through the app's store (not by browsing files) that the project's `photos` array is empty or holds only photos younger than 90 days, and that no file exists under `storage/books/<user>/<project>/photos/` older than 90 days.
3. Pick up to five `reason: "user_request"` lines. Confirm the project id no longer exists, its `work/<id>` folder is gone, and no job document names it.
4. **[S]** After Supabase: run `select count(*) from photos where expires_at < now() and deleted_at is null` (expect 0, excluding approved Saved People), and the tombstone checks in data/06 s10 (D10 dashboard).
5. Record the result in the request log's monthly line: date, checks run, pass/fail, follow-ups.

## 4. Verifying one deletion request

For a request in the 01 log:
1. `exportUserBookData` for the user id returns `[]`; `exportUserData` returns `profile: null`.
2. No `storage/books/<userId>/` folder remains (or it is empty).
3. Orders for the user are `accountDeleted: true`; note which are not yet `scrubbed` (audit A4) and the date they should be.
4. Vendor steps in 01 s4.2 are ticked.
5. Mark the request verified with the date.

## 5. What the purge does not remove today (known gaps)

| Left behind | Where | Why it matters | Status |
|---|---|---|---|
| `identity.txt` (text description of each person written from the photos) and the character model sheet images | `work/<projectId>/` | Req 25 says "derived crops"; arguably derived personal data | Legal question, owner decision (PLAN Book engineer). Not changed here. |
| Photos under box C | storage | Kept forever; Saved People with photos is not built | Owner decision (audit A1) |
| Job documents' `input.photoPaths` | `jobs/` | Paths only, no image data | Acceptable |
| Generated art and print PDFs | `work/<projectId>/` | No 12-month retention job exists (req 27) | Gap, audit A2 |
