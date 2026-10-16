# Photo cards and events: threats and controls

Owner: Security. Version 2026-10-15. Status: wave 1 deliverable (plan section 8).
Read: docs/products/photo-cards-and-events-plan.md, docs/cto/photo-events-architecture.md, app/lib/recipients/*, app/lib/book/service.ts (addPhoto), app/lib/collage/place.ts, app/lib/intake/rate-limit.ts, docs/security/06-backlog.md.
This is engineering, not legal advice. Items marked **[attorney]** need the owner's attorney.

Priority: **P0** = before the feature takes real customer data; **P1** = before the phase that uses it launches; **P2** = first 60 days after.
Phase map: Phase 1 (holiday cards, ship-to-me) needs sections 2 and 6. Address book (section 1, 3) is Phase 2. Events and RSVP (sections 4, 5) are Phase 3.

## 0. What the attacker wants here

1. **Address lists**: up to 25 lists x 1,000 recipients per account (`MAX_LISTS_PER_USER`, `MAX_LIST_SIZE` in `app/lib/recipients/list.ts`). Names, home addresses and emails of people who never signed up. A leak is a breach notice, not an embarrassment.
2. **Photos of children** with EXIF location in the file.
3. **A free mail relay**: reminder emails and digital save the dates sent from greethub.com to imported lists.
4. **A free phishing host**: an unlisted page on our domain with host-chosen links.
5. **Cost**: paid moderation per photo, address-validation calls per row, Resend volume, postage on stolen cards.
6. **Downtime**: big CSV/vCard bodies, decompression-bomb images, RSVP floods.

## 1. Address-book PII (recipient_lists, guests, rsvps, recipient snapshots)

1. **P0. Server-only tables.** `recipient_lists`, `guests`, `rsvps`, `batch_jobs`, `events` follow the DocStore shape: RLS on, **no policies**, reached only with the service role from server code. Add a migration test that fails if any of these tables has a policy or a grant to `anon`/`authenticated`. Never read them from the browser Supabase client.
2. **P0. Ownership on every call (IDOR).** Because RLS is bypassed by the service role, every route must load by id and compare `owner_id` to the session user, returning the same 404 for "not yours" and "does not exist". Put this in one helper (`mustOwnList`, `mustOwnEvent`, like `mustOwn` in book/service.ts) and unit test the not-yours path for each route: lists, recipients, import commit, export, events, guests, rsvps, rsvps.csv, remind.
3. **P0. No PII in logs, errors, analytics or model calls.** Import errors return row numbers and field names, never cell values, in server logs. Sentry/Vercel log scrubbing for `householdName`, `names`, `address`, `email`, `note`. Analytics get counts only (rows imported, list size bucket). Recipient lists are never sent to OpenRouter (the greeting writer and proof checker see only the card's own text slots).
4. **P1. Encrypt the document body at the application layer** for `recipient_lists`, `guests` and `rsvps`: AES-256-GCM on the `doc` jsonb, key from `RECIPIENTS_DATA_KEY` (one per environment, never shared with preview), key id stored with each row so the key can rotate. Supabase disk encryption covers a stolen disk, not a leaked service key, a SQL-console slip or a backup download; this does. Dedupe and validation run on the decrypted copy in memory. Cost is small at 1,000 rows per list.
5. **P1. Recipient snapshot scrub.** The order's snapshot keeps id, household and address only (architecture section 2). Scrub it when the order closes plus the reprint window (Privacy ops sets the days). Mailing vendor gets addresses only for the lines being mailed.
6. **P1. Delete with the account and on request**: lists, guests, RSVPs (owner is the host), snapshots after the reprint window, storage exports. Add to the existing delete-my-data path with a test. Backups age out on Supabase's schedule; record that window in the privacy notice. **[attorney]** third-party data in backups and on vendor systems.
7. **P1. Export only to the owner, only on request.** `exportCsv` responses: `Content-Disposition: attachment`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, re-authentication if the session is older than 24 hours. Rate limit in section 6. No email attachments of lists.
8. **P1. Vendors are data processors.** Address validation (USPS/Lob/PostGrid), mailing partner and Resend each get the minimum fields. DPA in place before real data. **[attorney]**
9. **P1. Google Contacts import**: `contacts.readonly` scope only, one-shot import, do not store the refresh token, discard the access token after the import request. Same parser limits as files (section 3).
10. **P2. Agent and MCP channel** ("send to the usual list"): recipient lists are not readable by agent tokens by default; a separate scope, and the agent sees list names and counts, not addresses.
11. **P2. Address validation cost cap.** Validate on demand or at checkout, not on every keystroke or preview; cap calls per user per day (section 6); cache results by `addressKey`.

## 2. Photo upload abuse (photo_sets)

1. **P0. Reuse the book order of checks**: size cap (10 MB, `MAX_PHOTO_BYTES`) and magic-byte type check (`readImageInfo`) and count cap all run **before** the paid moderation call, as `addPhoto` does today. Keep that order in the lifted `photo_sets` service and test it.
2. **P0. Count and storage caps.** Per photo set: 20 uploads (front 4 + back 6 + spares). Per user: 10 open photo sets, 500 MB of originals. Per day: 60 uploads per user, 20 per guest device if guests can upload at all. Recommend **no guest uploads for photo cards**: require a signed-in, email-verified account before the first upload.
3. **P0. Strip metadata on the server.** `addPhoto` stores the uploaded bytes as is (book/service.ts, `putPrivate(rel, input.data, ...)`), so EXIF GPS and device data survive whenever the client resize is skipped. Re-encode on the server (sharp `.rotate()` then output without `withMetadata`) before storing. A child's photo with home coordinates is the worst case in this product.
4. **P0. Decompression bombs.** `app/lib/collage/place.ts` opens images with `limitInputPixels: 100_000_000` (about 400 MB RGBA). Lower to 50,000,000 (covers 48 MP phones), set the same limit everywhere sharp opens customer bytes, and run `metadata()` first to reject before decode. Add a test with a small-file, huge-dimension PNG.
5. **P0. Moderation spend.** Moderation is a paid vision call per photo: mock only until the owner sets a cap (standing rule 2). Then a per-user daily moderation budget and a global daily budget in the durable spend store (03-abuse-and-cost-controls.md), with the kill switch returning 503 "photo checks paused".
6. **P1. Storage paths and URLs.** Files under `private/photos/<user>/<set>/`, ids generated server side, never a client-supplied path or name. Signed read URLs expire in 10 minutes or less and are never put in event pages; event pages show the rendered card JPEG, not originals.
7. **P1. Orphan purge.** Photos in sets with no order are purged on the 90-day rule; photos not attached to any design after 7 days go sooner.
8. **P1. Consent gate** for photos of children applies before the first upload, as in books. **[attorney]** B11.

## 3. CSV and vCard parsers (app/lib/recipients/csv.ts, vcard.ts)

Good already: row cap 1,000, `cleanText` strips control characters and caps cell length, phone numbers are never imported, vCard keeps FN/N/ADR/EMAIL only, export guards `= + - @ tab CR`.

1. **P0. Cap the request body before it is read.** `MAX_IMPORT_BYTES` is checked on `text.length` after the whole body is in memory, and vCard allows `MAX_IMPORT_BYTES * 5` (about 5 MB of UTF-16 units, up to 15 MB of bytes). The route must reject on `Content-Length` over 1 MB (CSV) or 5 MB (vCard) and also stop a streamed body at that byte count, before `req.text()`. Check against the Next 16 route handler docs in `app/node_modules/next/dist/docs`.
2. **P0. Cap total cells, not only rows.** A 1 MB file of one row with 500,000 empty cells, or a vCard with 1,000,000 short lines, passes the row caps. Reject a CSV record with more than 100 cells and a vCard file with more than 50,000 lines or 20,000 `BEGIN:VCARD` blocks (contacts without an address are counted for this cap; today only contacts with an address count against `MAX_IMPORT_ROWS`).
3. **P0. Formula injection on every CSV we produce, not just address export.** The RSVP export (`/api/events/[id]/rsvps.csv`) is worse than the address export: guest names and notes are typed by **anonymous strangers**, and the host opens them in Excel. Move `safeCell` into `app/lib/security/csv.ts`, use it for every CSV the app emits, and test with `=HYPERLINK(...)`, `+1+1`, `-2`, `@SUM`, a leading tab, a leading CR and a leading space followed by `=`.
4. **P1. Round-trip note.** Import strips our own `'` guard (`rowToCandidate`), so stored values may begin with `=`. That is safe only because every export re-guards. Add a test that `exportCsv(importCsv(x))` keeps the guard.
5. **P1. Outputs other than CSV.** Imported names reach envelope PDFs, the host dashboard and event pages. React escaping covers HTML; never render them with `dangerouslySetInnerHTML`, in email HTML without escaping, or in a `mailto:`/URL without encoding.
6. **P1. Regex cost.** `parseOneLineAddress` regexes run on `cleanText`-capped parts (500 chars, whitespace collapsed), which bounds backtracking. Keep the cap if the code changes; add a 1,000-row worst-case timing test (under 1 second).
7. **P1. Parse on the server only, in the request**, with a 5-second budget; no worker queue for imports, no temp files on disk.
8. **P2. Encoding.** Files that are not UTF-8 (Windows-1252 from old Excel) should show "re-save as UTF-8" rather than be silently mangled into wrong envelope names.

## 4. Event pages (app/app/e/[slug]) and enumeration

1. **P0. Slugs: 128 bits, not 10 characters.** Use 22 base62 characters from `crypto.randomBytes` (the architecture says "10+ char"; make it 22). Guest tokens: 128 bits, stored as SHA-256 hashes in `guests.refs`, compared on the hash, so a database read does not hand out edit links.
2. **P0. One answer for every miss.** Unknown slug, draft, closed, suspended and wrong password all return the same 404 page, same status, same headers. Unknown guest token falls back to the public view (or 404 when invited-only), with no "invalid token" message.
3. **P0. Do not leak slugs and tokens.** `Referrer-Policy: no-referrer` on `/e/*` (host links point at registries and maps). On the first visit with `?g=<token>`, set an HttpOnly cookie and redirect to the clean URL. `X-Robots-Tag: noindex, nofollow` header plus the meta tag. `Cache-Control: private, no-store` on any per-guest or password-gated response; the page must render dynamically, never from a shared cache.
4. **P0. Password gate.** Hash with scrypt or argon2 (not plain SHA). Signed cookie per event: HttpOnly, Secure, SameSite=Lax, path `/e/<slug>`, 30-day expiry, includes a password version so changing the password logs everyone out. Rate limit attempts (section 6).
5. **P0. Host-chosen content is text only.** Title, venue, details: plain text with length caps, no HTML or Markdown links. `links[]`: `https:` only, max 6, show the domain beside the label, `rel="noopener noreferrer nofollow ugc"`, open in a new tab. Map links built by us from the address. No file uploads besides the design.
6. **P1. Publishing gate.** Only signed-in, email-verified hosts can publish; new accounts (under 24 hours, no paid order) get a cap of 1 published event and 50 guests until they pay or age. Trust & safety owns the policy (docs/trust-safety/photo-events-abuse.md); this is the technical hook.
7. **P1. Report and suspend.** A "Report this page" link on every event page; `status: "suspended"` set by admin returns the same 404; a global `GREETHUB_EVENTS_OFF=1` kill switch for all event pages and RSVP posts.
8. **P1. Security headers on /e/** match the site CSP (next.config.ts), with `frame-ancestors 'none'` so pages cannot be framed for phishing.
9. **P2. Link reputation.** Check host links against Google Safe Browsing (free tier) at publish time and daily.

## 5. RSVP and reminder spam

1. **P0. RSVP POST validation** (zod): `attending` enum, `party` 1 to `maxParty` (hard ceiling 10), each meal in the event's `mealChoices`, name 1 to 100 chars, note up to 500, no URLs in name. Reject extra fields.
2. **P0. Bot friction.** Honeypot field (already planned) plus Cloudflare Turnstile on open RSVPs (no guest token). Invited-guests-only events skip the CAPTCHA because the token is the proof. An `Origin` header check on the POST (same origin only).
3. **P0. Volume caps per event.** Open events: at most 2x the guest count or 300 RSVPs, whichever is lower, then "the host is no longer taking replies online". One reply per guest token (edits replace it). Host is not emailed per reply; a daily digest, so a flood cannot mail-bomb the host.
4. **P0. IP hashing done right.** `Rsvp.ipHash` must be an HMAC with a server secret that rotates monthly, not a plain hash: the IPv4 space is small enough to reverse a plain SHA-256. Keep it 30 days, then drop the field. **[attorney]** whether a keyed IP hash is personal data under state privacy laws.
5. **P0. Reminders are not a mail relay.** `/api/events/[id]/remind`: fixed template with the host's name and the event link only, no free-text body (or a 200-char note with links stripped); only guests who have not replied and have an email; at most 3 reminders per event in total and 1 per day; `List-Unsubscribe` header and a one-click opt-out that suppresses that address for that host; bounces and complaints suppress the address for everyone.
6. **P1. Digital save the dates and invitations by email** are the bigger relay risk (a whole imported list in one click). Per account: 100 sends per day for accounts under 7 days or without a paid order, 500 per day after; global daily cap with alerting on Resend complaint rate above 0.1%. Send from a dedicated subdomain (for example `events.greethub.com`) so event mail reputation cannot hurt order and receipt mail. **[attorney]** CAN-SPAM classification of host-triggered invitations.
7. **P1. Abuse signals to Trust & safety**: many events from one account, many reports, high bounce rate, links on lists, guest names containing URLs.

## 6. Rate limits

Today's limiter (`app/lib/intake/rate-limit.ts`) is an in-memory `Map`: it resets on every deploy and is per-instance on Vercel, so it does not hold against a real attacker. Every limit below depends on backlog **SEC-07** (durable limits module in `app/lib/security/limits.ts`). Until SEC-07 ships, these features do not take public traffic. Keys: user id when signed in, otherwise IP /24 (IPv4) or /56 (IPv6) plus device cookie. All return 429 with `Retry-After`.

| # | Route or action | Limit | Key |
|---|---|---|---|
| 1 | Photo upload (photo_sets) | 20 / 10 min, 60 / day | user |
| 2 | Moderation calls | per-user and global daily budget (owner sets $) | user, global |
| 3 | CSV / vCard import preview | 10 / hour, 30 / day | user |
| 4 | Import commit | 10 / hour | user |
| 5 | Address list export (CSV) | 10 / hour | user |
| 6 | Address validation (paid) | 1,000 addresses / day per user, global daily cap | user, global |
| 7 | Google Contacts import | 3 / hour | user |
| 8 | Event create / publish | 10 / day (1 published for new accounts, item 4.6) | user |
| 9 | Event page view | 120 / min | IP network |
| 10 | Event password attempts | 5 / 15 min per event per IP network, 50 / hour per event | event + IP, event |
| 11 | Slug misses (404 on /e/*) | 30 / 10 min, then challenge | IP network |
| 12 | RSVP POST | 5 / 10 min per IP network per event, 60 / hour per event, plus cap in 5.3 | event + IP, event |
| 13 | RSVP CSV export | 20 / hour | user |
| 14 | Reminders | 1 / day per event, 3 total (5.5) | event |
| 15 | Invitation / save-the-date email sends | 100 or 500 / day (5.6), global cap | user, global |
| 16 | Mail-for-me checkout | 3 orders / day per new account; Stripe Radar on | user, card |

## 7. Other items

1. **P1. Mail-for-me fraud.** Stolen cards buy postage to many addresses, or cards to a harassment target. Stripe Radar rules for new accounts with large mail-for-me lines, a delay before submitting the first mail-for-me order of a new account (for example 2 hours), and T&S review over 200 recipients for accounts with no history.
2. **P1. Frozen versions are immutable.** `design_versions` and recipient snapshots are written once at add-to-cart; the update path refuses writes to them (test it). The print file is built from the frozen version, never the live design.
3. **P1. QR codes** encode only our event URL or a host URL that passed item 4.5; the QR target is shown in text beside the proof so a typo-squatted or swapped link is visible before printing.
4. **P2. Pen test** of `/e/*` and the import routes before Phase 3 launch, scoped to this document.

## 8. Asks

- **CTO**: SEC-07 durable limiter before Phase 2/3; migration test for no-policy tables (1.1); slug and token length (4.1) in the architecture doc; app-layer encryption design (1.4).
- **Shop engineer**: body-size and cell caps (3.1, 3.2); ownership helper (1.2); `safeCell` moved to `app/lib/security/csv.ts` (3.3), which I can write on request.
- **Book engineer**: server-side re-encode to strip EXIF (2.3); pixel limit (2.4); order of checks kept in photo_sets (2.1).
- **Privacy ops**: snapshot scrub window, backup window wording (1.5, 1.6).
- **Trust & safety**: publishing gate and report flow (4.6, 4.7, 5.7).
- **Owner**: moderation and address-validation spend caps; Turnstile and Safe Browsing accounts (free tiers); a sending subdomain in Resend; attorney questions marked **[attorney]** (third-party data retention, vendor DPAs, keyed IP hash as personal data, CAN-SPAM for invitations, B11 minors' photos).
