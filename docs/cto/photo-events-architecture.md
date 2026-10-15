# Photo cards and events: architecture

Owner: CTO. Version 2026-10-14. Status: PROPOSED (wave 1). Plan: docs/products/photo-cards-and-events-plan.md.
Built on what is in the repo today: pipeline/src/layout (card PDF), app/lib/book (photos, consent, moderation, queue), app/lib/writing, app/lib/shop, app/lib/store (DocStore), app/lib/membership. `app/lib/collage/` and `app/lib/recipients/` did not exist yet when I wrote this. The interfaces in section 2 are what those two engineers should converge on.

## 1. Principles

1. **One design renders every size.** A Design stores *intent* (which photo in which slot, crop in photo space, text). The template supplies the geometry for each size. Changing 5x7 to 4x6 re-resolves the design; it does not copy it.
2. **Pure engine, impure edges.** `app/lib/collage` is pure TypeScript: no I/O, no pdf-lib. It turns `Design + Template + PrintSize + asset metadata` into a `RenderPlan` with absolute boxes in points and pixel crops. `pipeline/src/layout/flat.ts` (new, next to card.ts) turns the RenderPlan plus image bytes into a PDF. The editor preview, the DPI check and the print file all read the same plan, so what you see is what prints.
3. **Freeze at checkout.** The order points to an immutable `designVersion` and a recipient snapshot, never to the live, editable records.
4. **Same storage shape.** Every new collection is a DocStore collection (id, owner_id, refs, doc jsonb, version) that only the server can reach (RLS on, no policies), like the three existing migrations.
5. **Fakes first.** Every new adapter has a fake, so the whole flow runs with no keys and the e2e test can cover it.

## 2. Data model (interfaces to converge on)

```ts
// app/packages/shared/src/printSizes.ts  (shared: cart, pricing, collage and pipeline all read it)
type PrintSizeId = "flat_5x7" | "flat_4x6" | "flat_3_5x5";          // later: folded_5x7, square_5x5, magnet_4x6
type PrintSize = { id: PrintSizeId; trimIn: { w: number; h: number }; bleedIn: 0.125; safeIn: 0.25;
  dpi: 300; minEffectiveDpi: 200; sides: 1 | 2; envelope: "A7" | "A2" | "A1" | null };

// app/lib/collage/types.ts  (card engineer owns)
type Rect = { x: number; y: number; w: number; h: number };          // 0..1 of the TRIM box, origin top-left
type Slot =
  | { id: string; kind: "photo"; rect: Rect; rotateDeg?: number; frame?: "none" | "polaroid" | "rounded"; required: boolean }
  | { id: string; kind: "text"; rect: Rect; role: "headline" | "greeting" | "names" | "year" | "body" | "from" | "details";
      font: FontRef; sizePt: { max: number; min: number }; align: "left" | "center" | "right"; color: string; maxChars: number }
  | { id: string; kind: "art"; rect: Rect; source: "static" | "ai_backdrop" }
  | { id: string; kind: "qr"; rect: Rect };                          // Phase 2: event page or website
type FontRef = { kind: "brand"; id: string } | { kind: "handwriting"; presetId: string } | { kind: "own_handwriting" };
type Template = { id: string; version: number; product: "holiday_card" | "save_the_date" | "invitation" | "rsvp_card" | "details_card";
  name: string; sizes: PrintSizeId[]; sides: { front: Record<PrintSizeId, Slot[]>; back?: Record<PrintSizeId, Slot[]> };
  background: Record<PrintSizeId, { color?: string; assetPath?: string }>; defaults: Record<string, string> };

type PlacedPhoto = { slotId: string; photoId: string; crop: Rect /* 0..1 of the SOURCE photo */; autoCropped: boolean };
type PlacedText = { slotId: string; text: string; fontOverride?: FontRef };
type Design = { id: string; userId: string; templateId: string; templateVersion: number; sizeId: PrintSizeId;
  side: { front: { photos: PlacedPhoto[]; text: PlacedText[] }; back?: { photos: PlacedPhoto[]; text: PlacedText[] } };
  photoSetId: string; returnAddress?: Address; signatureId?: string; eventId?: string;
  version: number; frozenVersions: number[]; proofWarnings: ProofWarning[]; updatedAt: string };

// engine outputs
type ResolvedBox = { slotId: string; boxPt: Rect /* absolute points incl. bleed, PDF origin */; };
type RenderPlan = { sizeId: PrintSizeId; pagePt: { w: number; h: number }; pages: { side: "front" | "back";
  background: { color?: string; assetPath?: string };
  items: (ResolvedBox & ({ kind: "photo"; photoPath: string; cropPx: { left: number; top: number; width: number; height: number }; effectiveDpi: number }
                       | { kind: "text"; text: string; font: FontRef; sizePt: { max: number; min: number }; align: string; color: string }
                       | { kind: "image"; assetPath: string }))[] }[] };
type DpiWarning = { slotId: string; effectiveDpi: number; level: "ok" | "warn" | "block" };   // warn below 200, block below 150
export function resolveDesign(d: Design, t: Template, size: PrintSize, photos: PhotoMeta[]): { plan: RenderPlan; dpi: DpiWarning[] };
export function autoPlace(t: Template, size: PrintSize, photos: PhotoMeta[] /* incl. face boxes */): PlacedPhoto[];
```

```ts
// app/lib/recipients/types.ts  (shop engineer owns)
type Recipient = { id: string; household: string /* "The Rivera Family" */; first?: string; last?: string;
  address?: Address; email?: string; validation?: { status: "unchecked" | "valid" | "corrected" | "undeliverable"; at: string; provider: string };
  tags: string[]; source: "manual" | "csv" | "vcard" | "google"; updatedAt: string };
type RecipientList = { id: string; userId: string; name: string; recipients: Recipient[] /* max 500 */; updatedAt: string };
type RecipientSnapshot = { listId: string; takenAt: string; recipients: Pick<Recipient, "id" | "household" | "address">[] };
export function importCsv(text: string): { rows: Recipient[]; errors: { line: number; message: string }[] };
export function importVcard(text: string): { rows: Recipient[]; errors: { line: number; message: string }[] };
export interface AddressValidator { validate(a: Address): Promise<Recipient["validation"] & { corrected?: Address }> }  // fake + USPS/Lob later
```

```ts
// cart line (app/packages/shared/src/cart.ts gets a third union member; MAX_QUANTITY becomes per kind)
type PhotoCardCartItem = { kind: "photo_card"; id: string; creationId: string /* designId */; designVersion: number;
  product: Template["product"]; sizeId: PrintSizeId; quantity: number /* 10..300 */; paper: "matte" | "pearl" | "recycled";
  envelopes: "blank" | "return_address" | "addressed";
  delivery: { mode: "ship_to_me" } | { mode: "mail_for_me"; recipientListId: string; recipientIds: string[] } };
// quantity for mail_for_me = recipientIds.length + extras. Volume pricing: priceLine() reads a tier table in pricing.ts (CFO).

// events (Phase 2/3)
type Event = { id: string; userId: string; slug: string /* 10+ char random, unguessable */; kind: "save_the_date" | "wedding" | "party" | "shower" | "other";
  designId: string; title: string; startsAt: string; timezone: string; venue?: { name: string; address?: string; mapUrl?: string };
  links: { label: string; url: string }[]; passwordHash?: string; rsvp: { enabled: boolean; deadline?: string; mealChoices: string[]; maxPartyDefault: number };
  status: "draft" | "published" | "closed"; guestListId?: string };
type Guest = { id: string; eventId: string; recipientId?: string; household: string; email?: string; maxParty: number; token: string /* per-guest link */ };
type Rsvp = { id: string; eventId: string; guestId?: string; name: string; attending: "yes" | "no" | "maybe"; party: number;
  meals: string[]; note?: string; at: string; ipHash: string };
```

## 3. Storage collections and migrations

New migration `app/supabase/migrations/20261020000000_photo_events.sql`, same doc-table shape as `core_documents.sql`:

| Collection | id / owner | refs | Notes |
|---|---|---|---|
| `designs` | design id / user | `[eventId]` | Small docs; history via `frozenVersions` plus `design_versions` |
| `design_versions` | `<designId>@<v>` / user | `[designId]` | Immutable copy written at add-to-cart; orders point here |
| `photo_sets` | set id / user | `[designId]` | PhotoRecord[] + ConsentRecord, the book shapes reused; files at `private/photos/<user>/<set>/` |
| `recipient_lists` | list id / user | | PII; never logged; deleted with the account |
| `batch_jobs` | `<orderId>:<lineId>` / user | `[external ids]` | Per-line print/mail state, per-recipient sub-statuses; keeps `orders` small |
| `events` | event id / user | `[slug]` | Lookup by slug through `find({ref})` |
| `guests` | guest id / user (host) | `[eventId, token]` | |
| `rsvps` | rsvp id / host user | `[eventId, guestId]` | Owner is the host, so delete-my-data removes guests' replies too |

Templates live in code as JSON (`app/lib/collage/templates/*.json`, Design's spec). They are not a DB table: they are versioned with git and validated by a zod schema in tests. Add each collection to `Docs` and `INDEX` in `app/lib/store/docs.ts` and to the file store's DB type (an edit to a shared file, so the shop engineer or I make it in wave 2). Retention: `photo_sets` uses the 90-day purge in `book/privacy.ts` generalised over collections; recipient snapshots are scrubbed when the order closes plus the reprint window (Privacy ops sets the number).

## 4. Render path

1. **Upload** reuses the book intake: `downscale.ts` (client resize and HEIC), `imageInfo.ts`, `moderation.ts` (CSAM block, nudity, violence), the consent gate from `consent.ts` (children's photos tick). The upload service must be lifted out of the book project store into a `photo_sets` service. Moderation runs a paid vision call per photo, so mock-only until the owner sets a cap.
2. **Face boxes** for auto-crop: run on the server with sharp's attention crop (free, no model) for v1. Model-based face detection is a later eval item.
3. **Editor preview**: the browser renders `resolveDesign()` output as an HTML/CSS layer over 1200 px previews. Same plan, no PDF.
4. **Proof**: on "Review", the server builds the PDF (`pipeline/src/layout/flat.ts: layoutFlatCard(plan, loadImage) → { print.pdf, proof.jpg }`) through the existing `JobQueue`, and the customer approves the full-size proof JPEG. The proof checker (names, weekday/date, year, RSVP-before-event) runs on the text slots at the same step.
5. **Print**: one PDF per design version per size (front, plus back when it has one), with bleed/trim boxes from `common.ts addPage`. Quantity is a printer field; 150 identical cards are still one file.
6. **Envelopes**: `layoutEnvelopes(size.envelope, returnAddress, recipients?) → envelopes.pdf`, one page per recipient (addressed) or one page (return address only), using the brand or handwriting font; the member's own handwriting goes through `writing/service.renderCustom`. If the chosen printer takes address *data* instead of a PDF (Lob/PostGrid style), the adapter sends data and this step is skipped.
7. Text uses `fitText` from `common.ts`; handwriting fonts come through `resolveCardWriting`. pdf-lib embeds the full TTF subsets, so the printer never substitutes a font.

Load: a 4-photo card is about 4 sharp resizes plus one PDF, a few seconds. 200 addressed envelope pages is one PDF of mostly text. That fits `AfterResponseQueue` for v1; nothing per recipient renders photos.

## 5. Printer and mailing adapters

`PrinterAdapter` today is one job, one ship-to address. Add a sibling interface instead of bending it:

```ts
type FlatCardCapabilities = { sizes: PrintSizeId[]; doubleSided: boolean; papers: string[];
  envelopes: "none" | "blank" | "printed_return" | "printed_recipient"; addressing: "pdf" | "data" | "none";
  mailForMe: boolean; minQty: number; maxQty: number; usOnly: boolean };
interface FlatCardPrinter {
  readonly name: "prodigi" | "gooten" | "lob" | "postgrid" | "fake"; readonly fake: boolean; readonly caps: FlatCardCapabilities;
  quote(q: { sizeId: PrintSizeId; qty: number; mode: "ship_to_me" | "mail_for_me"; shipTo?: Address }): Promise<{ cents: number; postageCents: number; productionDays: number }>;
  submitBulk(job: { orderId: string; lineId: string; sizeId: PrintSizeId; qty: number; files: { front: string; back?: string; envelopes?: string };
    paper: string; shipTo: Address; email: string }): Promise<{ externalId: string }>;
  submitMailing(job: { orderId: string; lineId: string; sizeId: PrintSizeId; files: { front: string; back?: string };
    from: Address; to: { recipientId: string; address: Address }[] }): Promise<{ externalIds: Record<string, string> }>;
  status(externalId: string): Promise<PrinterStatus>;
}
```

`getAdapters()` gains `flatPrinter` and, if fulfillment picks two vendors, `mailer`, selected by env like the others. `submitMailing` must be idempotent per `(lineId, recipientId)` (use the vendor's idempotency key). Results land in `batch_jobs`. Postage is a separate checkout line passed through at cost.

## 6. Event pages and RSVP API

- `app/app/e/[slug]/page.tsx`, outside the `(shop)` group: `noindex`, no analytics with guest data, a password gate (signed cookie per event), a per-guest view through `?g=<token>`.
- `POST /api/events/[slug]/rsvp`: zod-validated, rate-limited per IP hash and per event, honeypot field, and a guest-token check when the host turns on "invited guests only". Editing a reply goes through the token.
- Host: `/api/events` (CRUD), `/api/events/[id]/guests`, `/api/events/[id]/rsvps` (+ `.csv`), `/api/events/[id]/remind` (Resend, capped per day, sent only to guests who have not replied and have an email).
- Slugs are random and unguessable; unknown, closed and wrong-password events all return the same 404 (no enumeration).
- Read the Next 16 docs in `app/node_modules/next/dist/docs` before writing the route and caching code.

## 7. Membership hooks

The flags go through `featuresFor()` / `consumeQuota()`, with new keys added to `MEMBERSHIP_SPEC` by the CFO:
`own_handwriting_print` (already exists) gates own handwriting on sign-offs and envelopes. New keys: `saved_recipient_lists` (count), `batch_discount_pct` (applied in `priceLine`), `free_event_pages` (count), and `ai_message_writes_per_month` (already exists) for the greeting and letter writer. Memberships stay off in production unless `GREETHUB_MEMBERSHIP=1`, so every hook must fall back to the free tier.

## 8. Reused vs new

**Reused:** pdf-lib layout helpers and fonts, `fitText`, handwriting and signatures, photo downscale, moderation, consent, purge, private storage and signed URLs, DocStore, JobQueue, Stripe checkout and webhooks, order state machine, Resend, the fake-adapter pattern, the cutoffs config in `fulfillmentOps.ts`.
**New:** the collage engine and templates, `layout/flat.ts` and envelopes, the print-size registry, the photo_sets service (lifted from book), recipients and import, the batch cart line and volume pricing, FlatCardPrinter and its fake, batch_jobs, events, guests, RSVP, the proof checker.

## 9. Phase 1 build plan (holiday photo card, ship-to-me)

Estimates are engineer-days with one agent per track; tracks A and B run in parallel.

| # | Work | Owner | Days | Depends |
|---|---|---|---|---|
| 1 | Print-size registry + template zod schema + 6 front/2 back templates (5x7) | Card + Design | 2 | — |
| 2 | `resolveDesign`, `autoPlace`, DPI check, unit tests | Card | 3 | 1 |
| 3 | `layout/flat.ts` + proof JPEG + golden-PDF tests (trim/bleed boxes, fonts embedded) | Card | 2 | 2 |
| 4 | photo_sets service lifted from book (upload, moderation mock, consent, purge) | Book | 3 | — |
| 5 | Migration + Docs/INDEX entries | CTO | 0.5 | — |
| 6 | Editor UI (pick template, place/swap/pan/zoom, text, warnings) | Card + CX | 5 | 2, 4 |
| 7 | Proof checker v1 (rules, no model) | Card | 1 | 2 |
| 8 | Cart line `photo_card`, quantity 10–200, volume pricing, envelope option, return address | Shop | 2 | CFO prices |
| 9 | `FlatCardPrinter` + fake + real adapter for the chosen vendor | Shop | 3 | Oct 24 vendor pick |
| 10 | Return-address envelope PDF (recipient addressing if the vendor supports it) | Card | 1.5 | 3, 9 |
| 11 | Order → render → submitBulk → tracking, batch_jobs | Shop | 2 | 3, 9 |
| 12 | E2E: upload (mock), design, proof, pay (Stripe test), fake print, tracking | QA | 2 | all |

That is about 27 engineer-days, roughly 3 calendar weeks with three parallel tracks plus a week for the sandbox print and the physical proof. Code-complete is about Nov 13 if building starts Oct 24, which leaves under 3 weeks of margin before an order-by of about Dec 5. Phase 2 (recipients import, validation, mail-for-me, QR, digital save the date) and Phase 3 (events, RSVP) reuse items 1–3 and 9 unchanged.

## 10. Risks

1. **No confirmed flat-card printer or mailer API.** Items 9–11 and the Christmas dates depend on it; the adapter interface absorbs the vendor's shape, but only a real sandbox order proves the files and the cut-offs.
2. **Photo intake is coupled to the book project store** (a per-file store read by the render worker). Lifting it into DocStore-backed `photo_sets` without breaking books is the riskiest refactor.
3. **Print fidelity between preview and PDF** (crop math, rotation, text fitting in handwriting fonts) at three sizes. Keep one RenderPlan for both, and add golden-image tests and a physical proof per size before taking orders.
