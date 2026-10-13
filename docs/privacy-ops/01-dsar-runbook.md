# 01. Data access and deletion requests (DSAR) runbook

Status 2026-10-12. Research and engineering, not legal advice. Response deadlines and identity rules are **ATTORNEY** items (legal/05 Privacy s6 says "[45] days"; data/06 s6 sets an internal target of 30 days).

Two states exist and this runbook covers both:
- **Today (pre-Supabase):** shop data in a JSON file (`app/lib/shop/db.ts`), books in the file store (`app/lib/book/store/fileStore.ts`), photos on local disk (`app/lib/book/storage.ts`). On Vercel these live in one instance's `/tmp`, so they are not durable and the runbook is mostly for local and preview use.
- **After SEC-18 (Supabase):** the `privacy.delete_subject()` design in docs/data/06 s6. Steps marked **[S]** apply only then.

## 1. Intake

| Channel | What happens |
|---|---|
| Account > Download my data | Self-serve. `GET /api/account/export` returns profile, addresses, drafts, saved people, cart, orders, and (since 2026-10-12) `books` with every consent record. No ticket needed. |
| Account > Delete account | Self-serve. Emailed link, then `POST /api/account/delete/confirm`, which runs `deleteUserBookData` then `deleteAccount`. No ticket needed. |
| Book > withdraw consent | Self-serve. `withdrawConsent` deletes that book's photos and stamps the consent record. |
| Email to the privacy address, support ticket, letter | Manual. Follow sections 2 to 5. |
| Request about a child, from someone who is not the account holder (for example the other parent) | Manual and **escalate to owner**. Treat as a takedown or photo-removal request (docs/legal/06 req 22). |
| Someone says the account holder is under 18 | **Escalate to owner** (req 2). No actual-knowledge handler exists in code (not found). |

Log the request (section 6) the same day. Acknowledge within 10 days (**ATTORNEY**: confirm which state clocks apply; CCPA thresholds may not apply yet).

## 2. Verify identity

- Email requests: reply only to the email on the account, and ask the requester to confirm from that address, or to sign in and use the self-serve button. That is the preferred path: it proves control of the account and leaves an app record.
- Never ask for ID documents or photos of children to "prove" anything.
- If the requester cannot reach the account email, escalate to owner. Do not delete or export on a phone call or a different email.
- Authorised agents (CCPA-style): **ATTORNEY** for the proof required.

## 3. Access / export

1. Ask the customer to use Account > Download my data. If they cannot, the owner runs the same export for them (**owner approval**, because it sends personal data by email): send it only to the verified address, as an attachment, never in the body.
2. What the export holds today: `exportUserData` (shop) plus `exportUserBookData` (books: brief, story, proof text, photo details with upload and delete-by dates, artwork page count, consent records including IP and device).
3. What it does not hold yet, and must say so in the reply if asked:
   - Photo and artwork image files (listed, not embedded). The customer can view and download pages in the proof viewer. **Gap**, see audit A6.
   - Email history held by Resend, payment records held by Stripe, print records held by Lulu/Prodigi.
   - **[S]** analytics events and ml rows by `subject_id` (data/06 s6 "Export").
4. Correction requests: profile, addresses and people are editable in Account. Book text is editable until the story is approved; after approval, a new book is needed. Order addresses after payment: support process (docs/ops/01).

## 4. Deletion

### 4.1 What the self-serve delete removes today

| Data | Where | Removed by | Verified by |
|---|---|---|---|
| Book projects, photos, renders, print PDFs, job documents and logs | book store, local storage | `deleteUserBookData` (`app/lib/book/privacy.ts`) | test `consent.test.ts` "delete-my-data ..." ; 02 s4 |
| Profile, addresses, drafts, people, cart, tokens, unfinished checkouts | shop DB | `deleteAccount` (`app/lib/shop/accountService.ts`) | test `checkout-flow.test.ts` |
| Orders | shop DB | flagged `accountDeleted`; scrubbed only if the order is terminal | **Gap**: real orders never reach `delivered`, so names and addresses stay (audit A4) |
| Consent records | inside the book project | deleted with the project | **Gap vs policy**: legal/05 s5 and data/06 say keep 5 years (audit A3) |
| Deletion log | `logs/deletions.jsonl` | kept; project id and counts, no personal data | n/a |

### 4.2 Vendor propagation (manual today, tasks in **[S]**)

The account page lists these from `DELETION_VENDORS` (`app/lib/shop/policies.ts`). For each deleted account, within the deadline:

| Vendor | Action | Today |
|---|---|---|
| Resend | Delete the contact (if any audience is used) and add the address to suppression only if marketing exists. Sent-mail logs expire on Resend's schedule (**confirm retention** in 04). | Manual; no audience exists yet, so usually nothing to do |
| Stripe | Delete saved payment methods and the Customer object if one exists; payments and invoices stay (tax). | Manual in Stripe dashboard (owner) |
| Lulu, Prodigi | After the order closes, ask for deletion of ship-to and print files per DPA. | Manual; DPAs not signed (04) |
| OpenRouter and model providers | Nothing to request if ZDR held on every photo call (`live.ts` sends `provider.zdr: true`). Keep the written confirmation on file. | Confirmation not on file (04) |
| Vercel logs | Expire on plan retention. Nothing to request. | n/a |
| Backups **[S]** | Expire within the published window; replay tombstones after any restore. | No backups exist yet |

### 4.3 Manual deletion on an emailed request

Only after sections 1 and 2, and with **owner approval** recorded in the log:
1. Prefer sending the customer the self-serve link (Account > Delete account). Done when they click.
2. If the owner approves an operator-run delete: run the same functions the app runs (`deleteUserBookData`, then `deleteAccount`) for the verified user id, from a server context with access to the data store. Do not hand-edit JSON or delete folders. **[S]**: `select privacy.delete_subject(...)` by the `privacy_admin` role.
3. Run the vendor steps in 4.2.
4. Verify (02 s4) and send the confirmation email (the app sends `accountDeleted` on self-serve; for manual runs, send the same template text).

### 4.4 Partial requests

- "Delete my photos only": the customer can delete each photo in the book's photo step, or withdraw consent for the book. Photos are locked once characters are drawn; then withdrawal is the path.
- "Delete one book": **not built** (no DELETE on `/api/book/projects/[id]`). Until it is, owner-approved manual run, or the whole-account delete. Audit A7.
- "Stop using my pages as examples" (box D): no code uses box D yet; record the request, nothing else to do.

## 5. Things that block or pause a request

- Open order in print: tell the customer the order will still print and ship; ship-to stays until the order closes (legal/05 s4 "printed books cannot be recalled").
- Open takedown, chargeback, legal hold or CSAM preservation: **escalate to owner**; a legal-hold flag does not exist in code (docs/PLAN.md Trust & safety). Do not delete until the owner and attorney say so.
- Tax and payment records: retained by law; say so in the reply.

## 6. Request log

Until a `privacy.deletion_requests` table exists **[S]**, keep a private log outside the repo (owner's choice of tool) with one row per request:

`request_id | received (UTC) | channel | type (access/delete/correct/withdraw) | user id (not email) | verified how | owner approval (y/n, date) | vendor steps done | verified (02) | closed (UTC) | days open | notes (no personal data)`

Monthly: count requests by type and days open; anything over 20 days is reported to the owner.
