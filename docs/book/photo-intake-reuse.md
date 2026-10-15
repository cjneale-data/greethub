# Photo intake reuse for photo cards and events

Owner: Book engineer. Version 2026-10-15. Status: PROPOSED (wave 1, plan section 8).
Inputs: docs/products/photo-cards-and-events-plan.md (4.1, 4.2, 7), docs/cto/photo-events-architecture.md (sections 3, 4, 9 item 4, 10 risk 2), the code in app/lib/book/, app/app/api/book/, app/lib/collage/ (card engineer, untracked on master today) and pipeline/src/.
Not legal advice. Everything marked **Attorney** needs the owner's attorney.

## 1. Summary

- About 80% of the book photo intake carries over unchanged: browser downscale and HEIC (`downscale.ts`), byte sniffing (`imageInfo.ts`), moderation with the CSAM halt (`moderation.ts`), private storage (`storage.ts`), the consent record shape and hash (`consent.ts`), the purge and audit (`privacy.ts`) and the cron auth.
- What does not carry over is the **coupling to the book project**: photos hang off `BookProject.photos`, belong to a `characterId`, are capped at 4 per character, live under `books/<user>/<project>/photos/`, and the purge, delete and export functions iterate `d.projects` only.
- Plan: lift the per-photo work into one shared function (`ingestPhoto`), keep books on their current store, and add a `photo_sets` service for designs. Books then call the same function, so there is one moderation and one storage path, without moving book data (this is the low-risk answer to CTO risk 2).
- Four things change in substance for photo cards: **print resolution** (the 1600 px cap is too small for a full-bleed 5x7), **consent wording** (photos are printed as photos and mailed to other people, not turned into illustrations), **retention of derived copies** (the print PDF *is* the photos), and **many photos uploaded at once**.
- Illustrated family portrait: feasible with the existing likeness pipeline (identity sheet, model sheet, one render); the hard limits are likeness with 4 or more faces in one image and the attorney gate on minors. Later phase, as the plan says. Section 9.

## 2. What exists today, and what each piece needs

| Concern | File and function | Reuse as is? | Change for photo cards |
|---|---|---|---|
| Pick, HEIC convert, EXIF orientation, downscale, JPEG re-encode (browser) | `app/lib/book/downscale.ts` `prepareImage(file)` | Yes, with options | Take `{ maxEdge, minShortEdge, maxInputBytes, quality }`. Books keep 1600 / 600 / 10 MB / 0.85. Photo cards: 3000 / 800 / 25 MB / 0.88 (section 4.1). Error copy "with one clear face" is book-specific; pass messages in. |
| Type and size from bytes (server) | `app/lib/book/imageInfo.ts` `readImageInfo`, `extFor` | Yes | None. |
| Size, type, min edge, moderation, store, record | `app/lib/book/service.ts` `addPhoto` | Partly | Split into a shared `ingestPhoto` (checks, moderation, `putPrivate`) plus the book-only part (character check, 4-per-character cap, lock after sheet). Section 3. |
| Moderation, CSAM halt, mock markers | `app/lib/book/moderation.ts` `moderatePhoto`, `interpret`, `setCsamHook` | Yes | The logo and costume *warning* text in `addPhoto` ("we'll draw the clothing plain") is wrong for a printed photo; photo cards need their own copy or no warning (IP safety decides). Prompt says "family gift-book service"; make the product a parameter. Section 6. |
| Private storage | `app/lib/book/storage.ts` `LocalDiskStorage`, `getBookStorage` | Yes | Path prefix moves from `books/<user>/<project>/photos/` to `photo-sets/<user>/<set>/photos/` (CTO says `private/photos/<user>/<set>/`; any prefix works, it must be one prefix the audit can walk). The Supabase adapter replaces this for both. |
| Serving a photo to its owner | `service.ts` `readPhoto` + `app/app/api/book/projects/[id]/photos/[photoId]/route.ts` | Pattern only | New ownership-checked route for set photos and their previews. |
| Consent text, version, hash, record | `app/lib/book/consent.ts` `CONSENT_TEXT`, `consentHash`, `buildConsentRecord`, `consentValid`, `consentCovers` | Shape yes, text no | Add a photo-card wording variant with its own version; `consentHash(variant)`; `characterLabels` becomes optional. Section 5. |
| Consent gate | `consent.ts` `evaluateConsentGate(brief, photos, boxes)` | No | It is per character. Photo cards need `evaluateSetGate(set)`: valid consent, 1 to N photos, then the collage's `checkDesign` for required slots and DPI. |
| Recording and withdrawing consent | `service.ts` `recordConsent`, `withdrawConsent`; `app/app/api/book/projects/[id]/consent/route.ts` | Logic yes | Same logic on a photo set. IP from `x-forwarded-for`, UA trimmed to 300, as today. |
| 90-day purge | `app/lib/book/privacy.ts` `purgeExpiredPhotos`, `photosExpiringSoon`, `PURGE_REMINDER_DAYS` | Logic yes | Generalise over "photo holders" (books and sets); add derived files (previews, proof JPEG, print PDF). Section 7. |
| Purge verification | `privacy.ts` `auditPhotoRetention` | Logic yes | Walks only `storage/books`; must walk the set prefix too. |
| Delete my data | `privacy.ts` `deleteUserBookData`; `app/app/api/book/privacy/delete-my-data/route.ts` | Pattern | Add `deleteUserPhotoSets` (sets, photos, previews, designs, design versions, render outputs). Account deletion calls both. |
| Export my data | `privacy.ts` `exportUserBookData` | Pattern | Add `exportUserPhotoSets` (photo metadata and consent records, no storage paths). |
| Cron | `privacy.ts` `cronAuthorized`; `app/app/api/book/privacy/purge/route.ts` | Yes | The one daily route calls both purges, so there is one job to monitor. |
| Focus point for auto-crop | `app/lib/collage/place.ts` `analyzePhoto` (sharp attention, no face model) | Yes | Run once at upload, store `focusX`, `focusY`, `focusSource` on the photo record so the editor never re-reads bytes. |
| Mock mode | `app/lib/book/config.ts` `isMockMode` | Yes | Moderation stays mock until the owner sets a cap (CTO section 4.1). |

## 3. The shared intake function and the photo_sets service

### 3.1 `ingestPhoto` (shared, pure of book types)

```ts
type StoredPhoto = { id: string; path: string; previewPath?: string; contentType: string; bytes: number;
  width: number; height: number; createdAt: string; consentId: string; expiresAt: string;
  focus?: { x: number; y: number; source: "attention" | "center" } };
type IntakeLimits = { maxBytes: number; minShortEdge: number; product: "book" | "photo_card" };
async function ingestPhoto(d: { storage; mock: boolean; now }, input: { userId: string; ownerId: string; prefix: string;
  data: Uint8Array; consentId: string; limits: IntakeLimits }): Promise<{ photo: StoredPhoto; warnings: ModerationWarning[] }>;
```

Order is the same as `addPhoto` today and must stay that way: byte cap, `readImageInfo`, min short edge, `moderatePhoto` (halt and unavailable fail closed, nothing stored), then a server re-encode, then `putPrivate`. Book `PhotoRecord` becomes `StoredPhoto & { characterId }`, so no book data changes shape.

Two additions for both products:
- **Server re-encode with sharp** (`.rotate()` then JPEG; sharp drops EXIF by default). The browser canvas already strips EXIF and GPS, but a client that skips `prepareImage` can post a raw phone photo with location data. Today that would be stored as is.
- **Preview** at 1200 px long edge, stored next to the original with the same `expiresAt` (legal req 25 names thumbnails and derived crops).

### 3.2 `photo_sets` service (new; CTO section 3 collection)

```ts
type PhotoSet = { id: string; userId: string; designIds: string[]; photos: StoredPhoto[]; consent?: ConsentRecord;
  consentHistory?: ConsentRecord[]; createdAt: string; updatedAt: string; hold?: { orderId: string; until?: string }[] };
createPhotoSet(d, userId) / recordSetConsent(d, userId, setId, { boxes, ip, userAgent })
addSetPhoto(d, userId, setId, data) / removeSetPhoto(...) / readSetPhoto(..., "original" | "preview")
withdrawSetConsent(...) / attachDesign(d, userId, setId, designId) / evaluateSetGate(set)
```

- One set per design by default; a suite (save the date, invitation, RSVP card) can share one set through `designIds`.
- `withdrawSetConsent` deletes every photo and preview and marks designs that used them as needing photos; orders already sent to print cannot be recalled (same as books).
- DocStore updates may run the updater more than once on a version conflict (`app/lib/store/docs.ts` header). Pushes into `photos` and `consent.photoIds` must be idempotent (skip if the id is already there). The book `addPhoto` pushes without a check; that is safe on today's file store only, and must be fixed before books move to DocStore.
- Routes (new folder, not in my write lane; the CTO or owner decides where): `POST /api/photo-sets`, `/[id]/consent`, `/[id]/photos`, `/[id]/photos/[photoId]?v=preview`. Reuse `route()` from `app/app/api/book/_lib/handler.ts` or lift it to a shared place.

## 4. 1 to 10 photos per design

### 4.1 Print resolution

Flat 5x7 with bleed is 7.25 x 5.25 in. At 300 DPI a full-bleed photo needs about 2175 x 1575 px.

| Source long edge | Full-bleed 5x7, landscape photo on landscape card | Same photo on a portrait card | Verdict |
|---|---|---|---|
| 1600 px (book cap today) | about 220 DPI | about 165 DPI (warn) | Too small; any zoom drops below the collage's `DPI_WARN` of 200 |
| 3000 px (proposed) | about 410 DPI | about 310 DPI | Covers full bleed with room to zoom |

A 3000 x 2250 JPEG at quality 0.88 is usually 1.5 to 3 MB (estimate, not measured on our encoder). Because of that size, the browser should re-encode at 0.8 if the blob is over 4 MB, and the server cap for photo cards stays at 10 MB post-downscale. Vercel caps a function request body at about 4.5 MB (from memory of https://vercel.com/docs/functions/limitations, not re-read today); our multipart upload route sits under that cap, so the longer-term path is a signed direct upload to the private bucket followed by a server `finalize` step that runs the same checks and moderation. **CTO/DevOps** decision.

The 600 px minimum short edge stays a hard floor for books. For photo cards I propose 800 px as the hard floor, with the real judgement left to `photoQuality` per slot (a small photo is fine in a 4-grid, not as the hero).

### 4.2 Many photos at once

- `MAX_PHOTOS_PER_SET = 20` uploads (lets "pick my best photos" choose and lets people swap), up to 10 placed (template-defined: 1 to 4 front, up to 6 back). Bounds moderation spend at 20 calls per set. The PM confirms the numbers.
- Browser: multi-select; `prepareImage` runs **one file at a time** (a 48 MP photo decodes to about 190 MB of RGBA; several at once can crash iOS Safari), uploads run up to 3 at a time, each tile has its own progress and its own error, and one bad photo never fails the batch.
- Server: per-user upload rate limit (security owns the number); a 503 from moderation shows "try again" on that tile only.
- `analyzePhoto` runs at upload so `autoPlace` has focus points as soon as the last upload lands.
- The step reuses `PhotosStep.tsx` patterns (consent first, then the drop zone, the privacy line), not the component itself, which is built around characters.

## 5. Consent for photo cards

Today's wording (`CONSENT_TEXT`, version `2026-10-v2`) is written for illustration: box B says photos go to AI image services and reach printers "only as finished artwork", box C keeps a character, box D allows showing pages as examples. None of that is true or useful for a photo card.

Proposed variant `photo_card` with version `2026-10-pc1` (draft for the **Attorney**):
- **A (required):** unchanged (parent or guardian of every child shown, permission of every adult, 18 or older).
- **B (required):** "GreetHub keeps these photos private, runs an automated safety check on each one, and prints them on the cards I order. The print partner receives them inside the print file. If I choose mail-for-me or an event page, the people on my list will see them. Photos are deleted after [N] days."
- **B-ai (required only when the customer turns on an AI feature):** "Send my photos to AI services to [pick my best photos | draw a family portrait]." Shown at the moment of use, logged as its own record.
- **C:** drop for v1 (no saved photo library yet).
- **D:** do not offer. Real family photos, often of children, should never become marketing samples.

The safety check is itself a vision call to an AI service through OpenRouter (`moderatePhoto`, ZDR routed). B has to say so in plain words; the attorney decides how.

**Attorney** questions that are new with photo cards (add to B11 in the attorney brief):
1. Mail-for-me prints a child's photo and mails it to third-party addresses on the parent's instruction. Is box A enough?
2. Event pages show the design (with children's photos) on an unlisted URL. Is noindex plus an optional password enough, and should children's photos default to password-on?
3. Face *detection* for auto-crop (a later eval item) is not face recognition, but legal req 10 and the BIPA question (req 55) should be answered before any face model is used. v1 uses sharp attention only, which is not a face model.

## 6. Moderation

- Same hard blocks (sexual, minor_sexual with halt, graphic violence), same fail-closed behaviour, same mock markers (`GH_TEST_MODERATION:<kind>`), one call per photo. Quantity does not multiply it: 150 printed copies of one design is still one check per photo.
- Policy differences to settle (**Trust & safety, IP safety**): a bath-time baby photo printed and mailed to 100 people is a different case from a private reference photo for an illustration. The current prompt lists it as "not minor_sexual", which is right, but the "sexual" (nudity) flag may block it. Logos and licensed costumes print as is on a photo card, so the book's "we'll draw it plain" warning does not apply; personal holiday cards with a child in a costume are likely fine, but that is IP safety's call (docs/legal/photo-events-ip.md).
- Spend: mock only until the owner sets a cap (CTO section 4.1). I made no paid calls for this note.

## 7. Retention, purge, delete and export

### 7.1 The derived-copy problem (needs a decision)

For a book, the print PDF contains illustrations. For a photo card, the **print PDF, the proof JPEG, the editor previews and any event-page image contain the customer's photos**. Legal req 25 requires purging "original photos, thumbnails, derived crops and CDN copies", while req 27 lists "order art 12 months". For photo cards those two rules collide. Proposal for **Privacy ops** and the **Attorney**:
- One clock per set: `expiresAt = max(upload + 90 days, order closed + reprint window)`, held by `hold` entries while a frozen `design_version` is in an unshipped order (otherwise the render step finds no photos).
- On expiry, delete originals, previews, proof JPEGs and print PDFs together. Reprints after that require a re-upload.
- Fulfillment confirms how long the chosen printer or mailer keeps print files (vendor terms), and that goes in the privacy policy.
- The plan text says "90-day purge after the order is final"; the book code counts 90 days from upload. Pick one rule for both products.

### 7.2 Code changes

- `purgeExpiredPhotos` becomes a loop over `PhotoHolder`s (`{ list(), expired(now), remove(holder, ids) }`), with the book store and the set store as the two holders. Deletion log lines stay ids and counts only.
- `photosExpiringSoon` returns sets too; the 14-day reminder copy for sets is "reorder or download before [date]", not "save as Person".
- `auditPhotoRetention` walks both prefixes and counts derived files.
- `deleteUserPhotoSets(d, userId)` removes sets, photos, previews, designs, design versions, proof and print files, and cancels queued renders. Recipient lists and RSVPs belong to the shop engineer's and privacy ops' delete paths.
- `exportUserPhotoSets(d, userId)`: photo metadata (no paths), consent records, design ids.

## 8. Batch orders

- Intake is per design, not per copy: one set, one consent, one moderation per photo, whatever the quantity or delivery mode.
- At add-to-cart the frozen `design_version` points at photo ids; the set gets a `hold` for that order so the purge cannot delete them before the print file is built.
- One print file per design version and size (CTO 4.5), so 150 cards add no photo storage.
- Several designs in one cart each keep their own set; a suite shares one.
- Withdrawal after checkout but before print: cancel the line (shop engineer decides the refund rule). After print submission: cannot recall, same as books.

## 9. Illustrated family portrait: feasibility

**What exists.** `pipeline/src/run.ts` `runCard` already does photos to identity sheet (`stages/identity.ts`, vision on the reference photos), then a model sheet (`stages/modelsheet.ts`), an approval gate (`approveModelSheet`), and renders (`stages/render.ts`) that attach the model sheet plus each present character's first photo at 768 px. A portrait is that flow with one "page": the whole family, posed, in one of the 27 approved styles. The book's character-sheet approval UI (`SheetStep.tsx`) is the approval step.

**Build.** A `portrait` run mode in the pipeline (one page, no story or copy stage), a `portrait` job kind in `app/lib/book/queue.ts` (or the hosted queue), an approval screen with redo, and the result placed into an `art` slot (`source: "ai_backdrop"`-style, a new `ai_portrait` source) by the collage engine. Roughly 4 to 6 engineer-days after the collage editor exists.

**Cost per attempt** (estimate from `FALLBACK_PRICES` in `pipeline/src/models.ts`, not measured): identity sheet about $0.01 to $0.03, model sheet render about $0.10 at 2K, portrait render about $0.10 at 2K, plus at most one automatic IP re-roll. Call it **$0.20 to $0.35 per attempt**, so 2 free redos cost up to about $1. The CFO prices it as a paid add-on.

**Print.** A 2K render (2048 px long edge) on a full-bleed 5x7 is about 280 DPI; 4K is available on the first two models in `IMAGE_MODELS`. Fine.

**Limits and risks.**
1. **Likeness with many people.** Books rarely put more than 2 or 3 characters in one image. A family portrait is 3 to 6 people plus pets in one frame; image models lose likeness and mix features as the count grows. Needs an eval set with fictional reference people before any promise (**Model evals**). Suggest capping at 6 subjects and showing the approval gate every time.
2. **Consent and minors.** Same as books: box A, plus B-ai for sending photos to image models. Inherits the B11 attorney gate.
3. **IP.** Same style library and `sanitizeImagePrompt`; no named artists or studios (docs/legal/07).
4. **Expectations.** "Looks like us" is harder for a single portrait than across a book, where the story carries it. Copy should say "an illustrated portrait inspired by your photos".

**Verdict.** Feasible on today's pipeline; not for Christmas 2026. Do it after Phase 1, behind an eval pass. No paid calls made for this assessment.

## 10. Proposed wave 2 sequence (CTO item 4, 3 days)

1. Extract `ingestPhoto` and `StoredPhoto`; book `addPhoto` calls it. All existing book tests (`app/tests/book/consent.test.ts`, `jobs.test.ts`, `privacy-ops.test.ts`, `stepper.test.ts`) must pass unchanged. Add the server re-encode and preview.
2. `prepareImage` options; photo-card limits.
3. Consent variant and `consentHash(variant)`; tests that the book hash does not change.
4. `photo_sets` service, routes, idempotent updaters; mock-mode tests with 10 and 20 uploads, moderation markers, withdrawal.
5. Generalised purge, audit, delete and export over both holders; tests with frozen-version holds.

## 11. Asks

- **CTO:** where the shared module lives (I propose `app/lib/photos/`, outside my current write lane); signed direct upload vs multipart; the `photo_sets` migration and DocStore entries (CTO item 5).
- **Privacy ops / Attorney:** the retention rule in 7.1; consent variant wording; questions in section 5.
- **Trust & safety, IP safety:** nudity-of-infants and logo/costume policy for printed photos.
- **Security:** upload rate limits per user and per set.
- **PM:** upload cap (20) and placed cap (10).
- **Owner:** a dollar cap before any live moderation or portrait test; choice of attorney for the B11 questions.

## Sources

- Code read 2026-10-15 at commit e34923e plus untracked `app/lib/collage/`: files named above.
- docs/legal/06-product-requirements.md, reqs 10, 25, 27, 30, 55 (read 2026-10-15).
- Vercel function body limit: https://vercel.com/docs/functions/limitations (not re-read today; verify).
