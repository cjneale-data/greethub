# Photo cards and events: data retention, deletion, export and vendors

Owner: Privacy and Compliance Operations. Version 2026-10-15. Status: PROPOSED (wave 1). Research and engineering, not legal advice; every **ATTORNEY** item needs the owner's attorney, every **OWNER** item needs the owner's decision.

Inputs read: docs/products/photo-cards-and-events-plan.md (s4, s7, s8), docs/cto/photo-events-architecture.md (s2, s3, s6), docs/data/06-data-governance.md s4 and s6, docs/legal/06-product-requirements.md req 25 to 29, the privacy-ops runbooks 01 to 05, and the uncommitted code in `app/lib/recipients/` and `app/lib/collage/`. Not found at the time of writing (so not reflected here): docs/legal/photo-events-legal.md, docs/security/photo-events-threats.md, docs/data/photo-events-tracking.md, docs/ops/photo-events-printing.md, docs/book/photo-intake-reuse.md, docs/shop/batch-orders.md, docs/integrations/contacts-import.md. Re-check this file against them in wave 2.

## 1. What is new, and why it is different

Books and today's cards hold the customer's data plus photos of their family. Photo events add **other people's data at volume**: an address book of up to 1,000 households per list (`MAX_LIST_SIZE`, `app/lib/recipients/list.ts:6`), guest lists, guests' email addresses, and RSVP replies written by guests who never agreed to our terms. Those people cannot see or manage what we hold. So the defaults are: collect the minimum, keep it only as long as the job needs, never use it for anything else (no marketing, no analytics, no sale, no model training), and delete it with the customer's account.

| Data | Whose | Class (data/06 s2 style) | Collection (CTO s3) |
|---|---|---|---|
| Uploaded photos for collages (often children) | customer's family | C4 | `photo_sets` + `private/photos/<user>/<set>/` |
| Designs and frozen design versions (text such as "Love, Mia and Leo", return address) | customer, family first names | C2 | `designs`, `design_versions` |
| Print PDF and proof JPEG of a photo card | customer's family (full-resolution photos inside) | C4 | render output, printer copy |
| Address book: household names, people's names, postal address, optional email | third parties | C2 (third party) | `recipient_lists` |
| Recipient snapshot frozen on an order; per-recipient mailing status | third parties | C2 (third party) | order line + `batch_jobs` |
| Envelope PDF / addressed proof | third parties | C2 (third party) | render output, printer copy |
| Event (title, date, venue, links, password hash) | customer | C2 | `events` |
| Guest list (household, email, party size, per-guest token) | third parties | C2 (third party) | `guests` |
| RSVP (name, attending, party, meal choices, note, IP hash) | third parties | C2 (third party); meal and note may hold health hints | `rsvps` |
| Contacts-import OAuth token (Google) | customer | secret | not designed yet (Integrations) |

## 2. Retention and deletion schedule

Numbers below are my proposals for the owner and attorney to confirm (**OWNER/ATTORNEY**). They are aligned with data/06 s4 where an existing rule fits, and shorter where third-party data is involved. "Closed" for an order is defined in 2.1 because audit A4 showed printers never report `delivered`.

### 2.1 Definitions

- **Order closed** = the earliest of: printer reports delivered; 21 days after the printer reports shipped (ship to me); 30 days after the mailer reports the last piece mailed (mail for me; First-Class mail has no delivery scan); or refund/cancel final. The shop engineer sets this in one place so `scrubOrder` stops waiting forever (fixes A4 for batch orders).
- **Reprint window** = 30 days after order closed. Batch typo reprints (Support's policy) must be requested inside it.
- **Event date** = `Event.startsAt` in the event's timezone.

### 2.2 Schedule

| Data | Keep | Then | Mechanism (to build in wave 2) |
|---|---|---|---|
| Collage photos (originals, thumbnails, 1200 px previews, auto-crop results) | Same as book photos: 90 days from upload, extended to order closed + 30 days if later, hard cap 120 days | Hard delete objects and records; deletion log row (ids and counts only) | `purgeExpiredPhotos` generalised over `photo_sets` (CTO s3); same daily cron |
| Print PDF and proof JPEG of a photo card | **With the photos**, not the 12-month order-art rule. They are the photos at 300 DPI, so keeping them 12 months would break the 90-day promise | Hard delete | same purge job, keyed on the design version's photo set. **OWNER**: a reprint after the window means re-uploading |
| Face boxes / attention-crop data | With the photos | Delete | stored inside the photo record, goes with it |
| Unordered designs (drafts) | 12 months from last edit (data/06 drafts rule); photos inside still go at 90 days and the slots show empty | Delete | retention job |
| Frozen design versions on orders | Order closed + reprint window; then text and return address scrubbed, template id and size kept for order facts | Scrub | order scrub |
| Saved address book (`recipient_lists`) | Until the customer deletes it, deletes the account, or 24 months with no edit and no order using it (30-day reminder email first) | Hard delete list | user action; inactivity job; account delete |
| Lists made only for one order (not saved) | Until the order is closed + reprint window | Hard delete | order scrub |
| Recipient snapshot and envelope PDF | Order closed + reprint window (≈ 60 days max from mailing) | Remove names, addresses, emails; keep counts, recipient ids and per-recipient status codes | order scrub; request printer/mailer deletion |
| Returned / undeliverable flags | On the saved recipient until edited or deleted | Delete with the recipient | user action |
| Address validation results | Status, provider and date only; never the raw vendor response | Delete with the recipient | n/a |
| Raw CSV / vCard import files and Google contact payloads | **Not stored.** Parsed in memory; the preview is returned to the browser and never saved; only rows the customer commits are kept | n/a | route design (wave 2) |
| Google contacts OAuth token | For the import session only; revoked when the import finishes or after 1 hour | Revoke and delete | Integrations |
| Event page (public view) | Open until the host closes it or event date + 30 days | Page returns the same 404 as unknown slugs; guest tokens stop working | event close job |
| Guests and RSVPs | Event date + 120 days; host gets an email 14 days before with a CSV export link | Hard delete; event keeps response counts only | retention job |
| `Rsvp.ipHash` | Until the page closes (only for rate limits and spam) | Set to null | event close job |
| Event record (title, venue, links) | 12 months after event date, or with the account | Delete | retention job |
| Unpublished draft events | 12 months from last edit | Delete | retention job |
| RSVP reminder emails (Resend) | Resend's sent-mail log retention (confirm, 04) | Vendor expiry | n/a |
| Consent record for children's photos in a photo set | 5 years (data/06 consent ledger rule), no photos inside | Delete row | consent ledger (DATA-001); today it dies with the set, audit A3 repeats |
| Abuse reports about an event page | 5 years after close (data/06 takedown rule) | Delete | Trust & safety |
| Analytics | No recipient, guest or RSVP identifiers ever; counts only (`recipient_count`, `rsvp_yes_count`) | n/a | Head of Data to confirm in photo-events-tracking.md |
| Logs | No request bodies or query strings from `/api/recipients*`, `/api/events/*`, `/e/*` | 30-day platform expiry | Security / DevOps |

Legal hold (audit A9) applies to all rows above: an open takedown, abuse report or law-enforcement request on an event or design pauses its deletion. The flag does not exist yet; it must before mail-for-me or event pages ship.

## 3. How this joins the existing processes

### 3.1 Delete account and delete-my-data (01 s4)

`POST /api/account/delete/confirm` today runs `deleteUserBookData` then `deleteAccount`. Add one step between them, `deletePhotoEventsData(userId)`, that removes, in this order:

1. Events: set `closed` first so `/e/<slug>` 404s at once, then delete guests, RSVPs and the event.
2. Recipient lists (all, saved and per-order), unless a list is frozen on an open order (see 3.3).
3. Designs and design versions not on an open order; photo sets and their files; render outputs.
4. `batch_jobs` personal fields for closed orders.
5. Writes one `deletions.jsonl` line per collection with counts only.

Because `rsvps` and `guests` are owned by the host (CTO s3), the host's deletion takes the guests' replies with it. That is intended, and the deletion confirmation email should say "your events, guest lists and replies were deleted".

Per-item deletes the UI must offer (req 28 "delete any time"): delete a photo, a design, one recipient, a whole list, an event (with its guests and replies), and one RSVP (host). Each calls the same code as the account delete, scoped.

### 3.2 Requests from people who are not our customers

Recipients and guests will write in ("take me off your list", "delete my RSVP"). We hold their data for the customer, so (**ATTORNEY**: confirm whether we are the customer's service provider for this data, and what that means for answering third parties directly):

| Requester | Path |
|---|---|
| Guest, event still open | Self-serve: the per-guest link offers "Change or remove my reply". Remove deletes the RSVP row; the host sees "a reply was removed". |
| Guest, page closed, or no link | Email to the privacy address. Verify by replying to the guest email on file for that event (we never search by name). With owner approval, delete their RSVP and guest row; tell the host only that one guest asked to be removed. |
| Recipient in someone's address book | Verify control of the postal address or email (reply from the email on the record, or a code mailed to the address; **OWNER** choose). With owner approval, privacy ops looks up the normalised `addressKey` across lists, removes matching entries, and records a hashed key in a do-not-mail list so the next import flags it. Never tell the requester who had them on a list. |
| Recipient or guest asks what we hold | Give them only their own rows (household, address, email, RSVP), never the host's list. |

Log every one of these in the 01 s6 request log with type `third_party`.

### 3.3 Things that pause a deletion

- A batch in print or a mail-for-me run in progress cannot be recalled (same as books, 01 s5). The snapshot stays until the order closes + reprint window, then the scrub runs even if the account is gone.
- Legal hold (above), chargeback on the order, open abuse report on the event.

### 3.4 Purge verification (02)

Extend the cron's `verify` object (counts only) and the monthly sample:

| New check | Pass when |
|---|---|
| `photoSetsOverdue` | 0 photos in `photo_sets` past their date |
| `printFilesOverdue` | 0 photo-card print PDFs or proofs whose photo set is purged |
| `snapshotsOverdue` | 0 orders closed + 30 days still holding names or addresses |
| `eventsOverdue` | 0 pages open past event date + 30 days; 0 guests/RSVPs past event date + 120 days |
| `listsInactiveOverdue` | 0 lists past 24 months idle (after reminder) |
| `orphanFiles` | also counts files under `private/photos/` with no `photo_sets` record |

Monthly sample: add five purged photo sets, five scrubbed batch orders (snapshot empty, status codes kept), five closed events (page 404s, no guests after 120 days).

### 3.5 Incidents (03)

Treat an exposed address book, guest list or RSVP set as a privacy incident even though the people are not customers. A guessable event slug, a guest token in a logged URL, or a mailer sending a card to the wrong household are the likely forms. Whether names, addresses and emails of non-customers trigger state breach notice, and whether we or our customer notifies them, is **ATTORNEY**. A leaked collage photo of a child is the highest severity, same as books.

## 4. Export (access requests)

Add to `GET /api/account/export` (A6 limits apply: images listed, not embedded):

| Section | Contents | Format |
|---|---|---|
| `photoSets` | photo ids, upload and delete-by dates, consent records | JSON |
| `designs` | template, size, text, return address, version history, proof warnings | JSON |
| `recipientLists` | every list and recipient | JSON **and** a CSV per list in the same columns the importer reads, so the list is portable |
| `batchOrders` | quantity, delivery mode, per-recipient status by recipient id | JSON |
| `events` | event details, guests, RSVPs | JSON and the same RSVP CSV the host dashboard offers |

No storage paths, tokens, password hashes or IP hashes in the export (05 Part B item 5). Guest and recipient access requests get only their own rows (3.2).

## 5. Vendor data agreements: mailing partner and others

Fulfillment chooses the flat-card printer and mailer by Oct 24 (plan s6; candidates Prodigi flat cards, Gooten, Lob, PostGrid, Thanks.io). I have not read any of their terms this session (no web reads); everything below is what we must **get confirmed in writing before the first real order**. Signing is an **OWNER** action.

| Vendor role | Receives | Must have before go-live |
|---|---|---|
| Flat-card printer, ship to me | print PDF (children's photos), customer ship-to | DPA; deletion of print files and ship-to after fulfilment within a stated number of days; no use of images for anything else; sub-processor list |
| Mailing partner, mail for me | print PDF, return address, **each recipient's name and address** | All of the above, plus: service-provider terms that forbid selling, sharing, or using recipient addresses for their own marketing or list-building; address data deleted after mailing (number of days, and whether a deletion API exists); whether they run NCOA or address updates and what they keep; US-only processing; breach notice to us within 72 hours; per-recipient idempotency so a retry never mails twice |
| Address validation (USPS API, or the mailer's) | recipient addresses | Terms on retention and reuse of submitted addresses |
| Google People API (contacts import) | customer's contacts, read only | Google API Services User Data Policy (Limited Use) compliance; OAuth verification for the contacts scope; Integrations to confirm scope and tier |
| Resend | guest emails, RSVP reminders | Existing Resend DPA (not yet accepted, 04); send as transactional only, never create audience contacts for guests; unsubscribe per event |

When the vendor is chosen, these must change together (I cannot edit them in this wave): the 04 vendor table, data/06 s7, `DELETION_VENDORS` in `app/lib/shop/policies.ts` (today it promises printers clear addresses "after delivery", which is A4 again), and consent box B wording in `CONSENT_TEXT.b`, which names "Lulu, Prodigi". A new photo recipient bumps `CONSENT_WORDING_VERSION` and re-prompts everyone; that is intended.

## 6. Gaps found in the wave 1 code and design

| # | Where | Gap | Fix and owner |
|---|---|---|---|
| G1 | `app/lib/recipients/validate.ts:29, 65, 95, 118`; `types.ts:48` | A recipient's **phone number** is kept on the stored address. Mailing a card does not need it. | Shop engineer: drop phone when `purpose` is `"mail"`; keep it only for the customer's own ship-to. |
| G2 | CTO s2 `Rsvp.ipHash` | Not specified how it is hashed; a plain hash of an IPv4 address is reversible. | Security: keyed HMAC with a per-event salt; null at page close (2.2). |
| G3 | CTO s6 `?g=<token>` | Per-guest tokens in URLs can leak through referrers and access logs. | Security: `Referrer-Policy: no-referrer` on `/e/*`, no query strings in logs. |
| G4 | CTO s2 `Rsvp.note`, `mealChoices` | Free-text notes and meal choices invite allergy and health details from guests. | CX: fixed host-defined meal list, short note with "please don't include health details". **ATTORNEY**: whether state consumer-health-data laws reach these fields. |
| G5 | CTO s3 `recipient_lists` "deleted with the account" | No rule for lists the customer forgets about. | Inactivity rule in 2.2. |
| G6 | `app/lib/book/privacy.ts` (`purgeExpiredPhotos`, `auditPhotoRetention`) | Coupled to the book store; photo-card print PDFs are not photos to it. | Book engineer (photo-intake reuse) and CTO: generalise, include print files. |
| G7 | `scrubOrder` (A4) | Batch snapshots would stay forever for the same reason book ship-to does. | Shop engineer: "order closed" rule in 2.1. |
| G8 | No legal-hold flag (A9) | Event pages are an abuse vector; deletion could erase evidence. | Trust & safety + CTO, before mail-for-me or event pages ship. |

Good already: `app/lib/recipients/` is pure (no I/O, no logging, `normalize.ts:3`); the vCard parser drops phones, photos, birthdays and notes (`vcard.ts:8`); import previews are not persisted by the library (`list.ts` `buildPreview`); CTO s3 puts every new collection under RLS with no policies and s6 keeps analytics off event pages.

## 7. Owner and attorney asks

1. **OWNER/ATTORNEY**: confirm the numbers in 2.2, especially print PDFs going with the photos, guests/RSVPs at event + 120 days, lists at 24 months idle.
2. **ATTORNEY**: our role for third-party address and guest data, how we answer recipients and guests directly, and breach-notice duties for non-customers.
3. **ATTORNEY**: privacy policy text for address books, mail for me, event pages and RSVPs (none exists in docs/legal/05 today).
4. **OWNER**: sign the chosen printer's and mailer's DPA after the confirmations in s5; choose how a recipient proves control of an address (3.2).
