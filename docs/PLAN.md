# GreetHub — build plan (website, business, financial model)

## Context
The Eye Story showed that one pipeline can turn family photos and a story into a print-ready book: Sonnet as art director, Gemini image models through OpenRouter, a locked identity sheet plus model sheet for consistency, and reportlab PDFs at Lulu specs (GreetHub's port builds its PDFs with pdf-lib in TypeScript). GreetHub turns that into a product anyone can use without Claude Code. People describe a card or book on the site, approve a character sheet and proofs, pay, and get it printed and shipped.

Decisions already made:
- **Stack:** Next.js (TypeScript) + Supabase + Stripe.
- **Printing:** print-on-demand APIs (Lulu for books, Prodigi or Gelato for cards).
- **Location:** new repo at `C:\Users\seejn\greethub`.
- **"Done":** the full flow works in Stripe test mode and printer sandboxes on a Vercel preview URL.

The brand kit at `Downloads\GreetHub brand kit\greethub-webkit` is the visual source of truth.

## Stop condition (definition of done)
Building stops when a new visitor on the preview URL can do all of the following without help:
1. Try the creator as a guest (one free card preview, watermarked).
2. Sign up or log in (email magic link plus Google), and the guest draft carries over to the new account.
3. Signed in, create a **card** through the guided chat, approve it, and see the proof (milestone M3b).
4. Create a **picture book** (photos → story → character sheet approval → pages → proof). The proof shows only what prints.
5. Add both to the cart, enter a shipping address, and pay with a Stripe test card.
6. Receive a confirmation email. Both orders pass the 7-step sandbox routine in `docs/ops/02` with Lulu and Prodigi, and status and tracking show on the account page.
7. Manage the account: profile, saved addresses, drafts, order history, saved "people" (names only in v1), data export, and deleting the account and its data.

The done gate is `STRICT=1 node tests/e2e/launch-flow.mjs` with 0 gaps at desktop and mobile against the deployed preview, plus `a11y.mjs` with no serious violations (QA owns it), plus usability round 1 passed or waived in writing by the owner (CX). The e2e can pass while legal gates are open, so: no live keys and no real customer photos until the before-launch items in `docs/legal/attorney-brief-2026-10.md` are answered or waived in writing by the owner. The CFO workbook (v3) and CMO pack are delivered.

## Agent organization
I act as the orchestrator (CEO). The build began with the three agents below. Since October 2026 the team is 29 agents (`.claude/agents/`: engineers, platform, data and quality, business, legal and ops), each writing only to its own folder. The CTO owns `pipeline/`, so every "pipeline owner" item in the Platform assessment is a CTO item. Human partners earn dynamic equity (`docs/equity/`); agents never do; the split freezes at the first outside financing, profit distribution or sale.

| Agent | Owns | Writes to | Depends on |
|---|---|---|---|
| **CMO** | Brand application, UX flows and wireframes, site copy, intake question design (with CTO), launch marketing plan, channel assumptions for the CFO | `docs/cmo/` | Brand kit |
| **CTO** | Architecture, the generation pipeline port, web app, payments, fulfillment, tests, deploy, mobile-app plan | `app/`, `pipeline/`, `docs/cto/` | CMO UX spec (screens), CFO prices (checkout) |
| **CFO** | Unit economics, pricing, the Excel forecast, cost of tokens per product | `finance/` | CTO's measured token costs, CMO's channel assumptions |

Sequencing (Waves 1–3 are spent; the current order is the PM build order B1–B11 under the Platform assessment):
1. **Wave 1, in parallel:**
   - CMO: UX spec, copy and marketing plan.
   - CTO: scaffold the app, then port the pipeline and **measure real cost per card and per book** across about 5 test runs of each.
   - CFO: build the workbook structure with placeholder costs.
2. **Wave 2:**
   - CTO builds the screens from the CMO spec.
   - CFO plugs in the measured token costs and the CMO's CAC and CTR assumptions, then sets launch prices.
   - CTO uses those prices in Stripe.
3. **Wave 3:** CTO handles fulfillment, the account area, e2e tests and deploy. I verify the stop condition, then the CMO does a final copy and visual QA pass on the deployed site.

## Product definition (v1)
- **Greeting card:**
  - 5×7 folded card: a front illustration, an inside message, and an optional inside illustration.
  - Illustrated from the brief; v1 cards take no photos. The book is the lead product; the card is the funnel and add-on.
  - Printed and mailed (to the buyer or straight to the recipient), or bought as a digital e-card or PDF.
  - About 3 image renders each.
  - Inside message typeset, or handwritten: in one of 8 preset hands or the member's own handwriting, with an optional signature. See "Handwriting and signatures" below.
- **Picture book:**
  - 8.5×8.5 hardcover, 24 or 32 pages, laid out as text-left / art-right spreads like the Eye Story. That layout is proven, and image models won't reliably keep text zones clear.
  - 1 to 4 main characters from photos, plus an optional pet.
  - About 14 pages of art, a model sheet, 3 free page redraws and 2 free character-sheet redos per book.

**Guest vs. account:**
- **Guest:** chat intake, one card preview (low resolution, watermarked), no account drafts (a draft is kept on this device only).
- **Account:**
  - Books (they need a photo upload and a consent record).
  - Saved drafts and saved "People" (names only in v1; a reusable likeness across cards and books is post-launch).
  - Book redraws (3 pages plus 2 sheet redos per book), high-resolution proofs, checkout, order tracking, address book, and occasion reminders (post-launch).

## Data capture: structured + unstructured
Everything the user tells the site ends up as a validated **CreationBrief** (JSON schema, Zod). Generation runs only when every required field is filled.

**Structured fields** (chips, pickers and forms, so they're cheap to validate):
- Product, occasion, and recipient name and relationship.
- Tone (funny, heartfelt, adventurous), art style (one of 26 styles in 10 categories from `docs/design/style-library.json`; the picker shows a recommended 3 and the rest by category, and each id maps to one `style` string), and reading age (books).
- Page count, characters (name, age band, role), and pronouns as the user gives them.
- Ship-to address and delivery date.

**Unstructured fields** (free text and uploads):
- The story idea or memory, inside jokes, and the message wording.
- Setting details, things to include or avoid.
- Photos of people, pets and places.

**Chat intake ("Greet Guide"):**
- A Sonnet agent with tool calls fills the brief one field at a time. It asks only for what's missing and shows a live "brief card" the user can edit directly.
- Fields can also be filled from forms, so chat is optional.
- **RAG** retrieves over:
  - (a) the product and occasion knowledge base: card and book formats, what works per occasion, sample messages, style presets, print constraints;
  - (b) the user's own saved People and past briefs, so "make one for Lee again" just works.
- Storage is Supabase pgvector. Retrieval is grounding only, never a stand-in for the required fields.
- **How broad it can be:** any occasion and any story idea, as long as the brief completes. Guardrails:
  - Content moderation on both text and images.
  - No copyrighted characters. The intake rewrites "like Meeko" to an original named character whose design differs in all four checklist groups (legal 07 s1).
  - No real public figures.
  - Photos of minors only from a signed-in adult who ticks a consent box. Photos are stored privately and purged after 90 days unless kept as a Person.

## Generation pipeline (port of `the eye story/scripts/pipeline.py` + `layout.py`)
The pipeline runs as a TypeScript worker. Jobs go through Supabase queues, or Inngest if long jobs need it. Book renders take 5–15 minutes, so progress reaches the UI over Supabase Realtime.

**Stages:**
1. **Brief → story (books).** Sonnet writes page text from the brief. The user edits and approves it.
2. **Identity sheet.** Same as `stage_sheet` (vision over the photos).
3. **Model sheet.** Same as `stage_modelsheet`. **The user approves it before any pages render.** This is the Eye Story consistency lesson. It is also the main cost guard, because a bad character costs one render instead of fourteen.
4. **Page prompts.** Same as `stage_prompts`, plus the FULL-BLEED, FRAMING and exact-count lines learned on the Eye Story.
5. **Page renders.** Same as `stage_images`, with the model sheet attached first. Keep the `IMAGE_MODELS` fallback chain and `call()` retry logic (no retry on 400; RequestException retry).
6. **Automatic QA.** A cheap vision check per page: correct number of characters, no white border, no text in the image. Auto re-roll at most once. The user gets free re-rolls up to their allowance.
7. **Layout.** Port `layout.py`: trim and bleed boxes, embedded fonts, auto-fit text, and the card layout (5×7 plus bleed). It generates the print PDF, a web preview (page-flip viewer), and a low-resolution watermarked guest proof.

Every job logs cost per call from OpenRouter usage, so the CFO's token costs are measured, not guessed.

**Measured token cost (Wave 1, `docs/cto/pipeline-costs.md`):**
- About $0.061 per 2K render and $0.123 per 4K render (nano-banana-2.1 via OpenRouter); 2K is the print default.
- A **24-page book** is about $1.10–1.26 and a **32-page book** about $1.42–1.64 (extrapolated, no full-book live run yet); a **card** is about $0.16–0.25. The earlier $2–4 / $0.30–0.60 guesses were too high.

## Architecture (CTO)
- **Front end:** Next.js App Router plus the brand kit's `tokens.css`, `components.css` and components converted to TSX. The fonts are Bricolage Grotesque and Figtree.
- **Supabase:**
  - Auth (magic link and Google; the guest session is anonymous and upgrades on sign-up).
  - Postgres tables: users, people, briefs, creations, renders, carts, orders, addresses, cost_ledger.
  - Storage, with private buckets for photos.
  - pgvector, Realtime, and Edge Functions or a worker.
- **Payments:** Stripe Checkout (hosted page) with tax and webhooks; ship-to addresses are collected on our own checkout page per printed item, not by Stripe. The order is created on `checkout.session.completed`, then submitted to the printer.
- **Fulfillment:** Lulu Print API for books, Prodigi for cards (fall back to Gelato). An adapter interface lets printers be swapped, and printer webhooks write order status and tracking back to the site.
- **Email:** Resend (confirmation, shipped, proof ready).
- **Secrets:** env vars on Vercel only. The OpenRouter key never reaches the browser, and every model call is server-side with a per-user rate limit and a spend cap.
- **Tests:** Vitest for brief validation, pricing and layout math; Playwright for the stop-condition flow.

## Milestones (each has its own check)
Status 2026-10-13: M1–M5 work in mock mode only. Nothing is durable (no Supabase) and no adapter has run against a sandbox. The working order is the PM build order (B1–B11) under the Platform assessment.
- **M1 — Scaffold.** Repo, brand tokens, the home page matching the brand-kit hero, auth, and a Vercel preview with CI required on `master`. *Done except real auth (B1) and CI enforced on GitHub.*
- **M2 — Pipeline.** A script-level card and book from a fixture brief, plus a cost report (sent to the CFO). *Done; no full live book run yet.*
- **M3 — Intake.** Chat plus form brief builder, RAG knowledge base, guest card preview. *Done in mock mode; the guest cap is per instance (B2).*
- **M3b — Account card flow.** Session-aware creator, full render job, approval page, card print PDF, add-to-cart with a real creation id. *Not built (B4).*
- **M4 — Book flow.** Photo upload with consent, story editing, character sheet approval, page progress, proof viewer, redraws, proof approval (CX-05). *Done in mock mode; the proof shows a dedication that doesn't print (B5).*
- **M5 — Commerce.** Cart, Stripe Checkout, order records, emails, refund, dispute and expiry events. *Built; never run in Stripe test mode.*
- **M6 — Fulfillment, ops and account.** Printer sandboxes (7-step routine), print assets from storage, Lulu cover wrap, webhooks and a derived "delivered", exception alerts, admin refund, cancel and reprint, help and contact, account pages, data deletion, a preview test-auth path. *Partly built (B6, B7).*
- **M7 — Done gate.** STRICT launch-flow with 0 gaps on the preview, a11y clean, usability round 1 passed or waived. QA and CX own it.
- **Not on the launch path:** the agent channel (dark, `AGENT_CHANNEL_ENABLED` off; P1 after SEC-18, SEC-07 and SEC-10, early 2027 at the earliest) and the kiosk (research only until start gate S0, `docs/kiosk/07`). The mobile plan is deferred until after launch.

## CMO deliverables (`docs/cmo/`)
- **UX spec:** guest → sign-up → create → approve → cart → checkout → track. A wireframe for each screen, using brand-kit components such as TemplateCard tilt grids, Chips for occasions, Progress for renders, and Toasts.
- **Site copy** in the brand voice ("Your card's on its way to Sam."). That covers home, product pages, pricing, FAQ, and the intake question bank.
- **12 demo templates** for the browse grid. The hero sample book is a fictional, text-described family (standing rule 5: no real people in samples). Imagery brief: `docs/cmo/templates.md` s3.
- **Launch marketing plan:**
  - Channels: Meta/Instagram, Pinterest, Google Search, TikTok, creators, holiday SEO pages.
  - Occasion calendar.
  - Budget split and expected CPC, CTR and CAC ranges, handed to the CFO.

## CFO deliverable: `finance/GreetHub_Financial_Model.xlsx`
Live formulas throughout, with assumptions in one input sheet so marketing spend visibly drives traffic and orders.

**Sheets:**
1. **Inputs:**
   - Prices per product and format.
   - Monthly marketing budget per channel, with CPC, CTR and CAC per channel.
   - Organic traffic and its growth.
   - Visitor → sign-up → creator start → purchase conversion rates.
   - Product mix, units per order, seasonality multipliers (Christmas, Mother's Day, Valentine's).
   - Re-roll rate and refund/reprint rate.
2. **Unit Economics:** for each SKU, list price minus token cost (renders × $ per render + text tokens, filled from the CTO's measured ledger), print cost (Lulu and Prodigi price sheets), shipping, Stripe fees (2.9% + $0.30) and reprint allowance, giving contribution margin.
3. **Model Costs:** a per-model price table (OpenRouter $ per image and $ per million tokens), renders per card and per book, and the cost for each guest preview. Guest previews are a cost that brings no revenue, so they need their own line.
4. **Opex:**
   - Vercel, Supabase, Resend, domain, Stripe Tax, monitoring.
   - OpenRouter base spend, design tools, legal and LLC, insurance.
   - Optional contractor or support.
5. **Forecast (36 months):** paid traffic from budget ÷ CPC, plus organic, then funnel conversions, then orders by SKU, revenue, COGS, gross profit, marketing, opex, net income and cumulative cash.
6. **Scenarios:** Low, Base and High toggles, break-even month, and CAC vs. LTV (with repeat purchase rate).
7. **Dashboard:** charts of revenue, profit, cash and orders, plus key KPIs.

Assumption cells are color-coded inputs, and every number is a formula off Inputs. The CFO checks the workbook with a recalculation pass (no #REF or #DIV/0).

## Mobile app (plan only, not built now)
The CTO writes `docs/cto/mobile-plan.md`:
- **Stack:** React Native / Expo sharing the TypeScript brief schema, the Supabase client and the API routes.
- **Features:** the brand kit's mobile TabBar with a raised Create button, camera upload, push notifications for "proof ready" and occasion reminders.
- **Purchases:** Stripe through a web checkout handoff to avoid app-store fees on physical goods.

## Things you'll need to supply during the build
The current, deduplicated list in priority order is under "Product manager: consolidated launch plan" (Owner decisions & inputs needed). The original list:
- A Supabase project.
- A Stripe account (test keys).
- A Vercel account.
- Lulu Print API sandbox and Prodigi sandbox keys.
- A Resend key.
- Google OAuth credentials (optional).

The existing OpenRouter key in `book\.env` gets copied into GreetHub's own `.env.local`, never committed. A separate OpenRouter key with a spend limit is better for the site.

## Risks to watch
- **Image model rate limits.** Nano Banana was always 429 on the Eye Story. Keep the fallback chain and queue concurrency limits.
- **Render cost runaway.** Handled by the model sheet gate, re-roll caps, the guest preview at low resolution, and per-user and global daily spend caps.
- **Children's photos.** Partly covered. Consent gate, ZDR on photo calls, self-serve delete and the purge code exist. Box C keeps photos with no end date, there is no durable consent log, the CSAM hook discards evidence that 18 USC 2258A(h) may require us to preserve, and nothing is durable until Supabase exists. No real child's photo before the attorney's written opinion and answers to Q1 to Q13 in `docs/legal/attorney-brief-2026-10.md`.
- **Print color and spec rejections.** Run the printers' file validation APIs before submitting.
- **Model-spend abuse.** Never-buy guests and free accounts. Caps are in memory per instance, and `GREETHUB_ALLOW_FAKE` acts as a master key on any deploy. Durable caps, Turnstile and SEC-02 come before any public traffic.
- **Silent model fallback and deprecation.** The image fallback chain reaches unevaluated models. Log `model_served` and baseline each fallback on the golden set.
- **No monitoring, alerts or backups** until SEC-09 and Supabase Pro (SEC-39).
- **One printer per product in December,** with no physical proof yet. A late proof or a rejected file costs the season.

## Verification
- **Per milestone:** Vitest unit tests, plus a manual walkthrough with the Chrome browser tools on the preview URL, with screenshots.
- **Done gate:** the Playwright e2e (guest → sign-up → card → book → cart → Stripe test payment → sandbox print orders → tracking on the account page → account deletion) passes against the Vercel preview.
- **Finance:** the workbook opens in Excel. Changing the marketing budget input moves traffic, orders and profit, and token costs match the CTO's measured `cost_ledger`.

## Handwriting and signatures (added 2026-10-13, owner request)
**Goal:** a card can read as if the sender wrote it. Every card gets a choice: typed or handwritten message, and none, typed or saved signature. Members set it up once in the account portal, DocuSign-style, and can have it applied to every new card.

**Membership (B13, 2026-10-14):** own-handwriting printing, saved signatures and "Use on every new card" are GreetHub Plus perks ($3.99 a month or $35.99 a year, 14-day trial with no card; `docs/finance/membership-plan.md`, `MEMBERSHIP_SPEC` in `packages/shared/src/membership.ts`, landing page `/membership`). Free accounts keep the 8 presets and a typed signature on any card. Off in production until the owner sets `GREETHUB_MEMBERSHIP=1` after attorney review; while off, everyone keeps the perks below.

**What members get** (account → Handwriting, `/account/handwriting`)
- **Preset handwriting (8), every account and guests:** Everyday, Neat print, Bubbly, Quick note, Marker, Loose scrawl, Looping cursive, Grown-up cursive. Self-hosted OFL/Apache fonts in `app/public/fonts/handwriting` (licences alongside), so the browser preview and the print PDF use the same files. One preset can be the default.
- **Own handwriting:** print a one-page template (79 boxes: A–Z, a–z, 0–9, punctuation; four black registration squares plus a small orientation mark), fill it in with a dark pen, upload a photo. The browser first shrinks the photo to 2800 px (HEIC accepted) so it fits hosted request limits. The server finds the squares and the mark, so sideways and upside-down photos also work. It then corrects perspective, drops the light-blue guides and paper, and keeps each box's ink. Text is set from those glyphs with a little size and baseline wobble. No model calls and no per-card cost. **Plus:** up to 3 styles, printed on cards. **Free:** 1 style, shown in the card preview only; ordering a card in it needs Plus.
  - Every letter (in either case) and every digit must be readable, or the sheet is refused with the list of what's missing. Blank punctuation is listed and allowed.
  - A message character the hand doesn't have (an accent, an emoji, a skipped symbol) is never invented or silently dropped. The preview warns, and print treats the message as not fitting, so the member picks a preset or edits the text.
- **Signature, three ways (saved signatures are Plus):** *choose a style* (name typed in one of 4 signature scripts), *draw* (mouse, finger or stylus), or *upload* (photo of a signature on paper; we keep only the ink). Up to 5 on Plus; one is the default. Free accounts and guests type their name on each card instead (not saved).
- **"Use on every new card" (Plus):** new cards start with the default handwriting and signature; each card can still change or turn them off.

**On every card** (card creator, Form tab and the brief card's Handwriting row): toggle "Write the message by hand", pick a style (presets for everyone, own styles for members), pick a signature (none / type my name / a saved one). The preview's inside face shows it at the print box's shape (`CARD_MESSAGE_BOX_PX`, checked against `layoutCard` in the pipeline tests), so line breaks match. With an inside drawing the print box is shorter than the preview's (known gap). Guests and free accounts get presets and a typed signature; a free account can also preview one own-handwriting style. Printing own handwriting and saved (drawn, uploaded or styled) signatures need Plus. If a member leaves Plus, styles and signatures are kept but paused.

**Data and print**
- Brief: `CardBrief.writing = { message: typed|handwritten, styleId, signature: none|typed|saved }` (`packages/shared/src/handwriting.ts`). Ids only: no images in the brief.
- Cost control: the own-handwriting preview route is rate-limited (40 a minute per member) and renders at most the print box (about 0.7 s for a 600-character message).
- Store: one `writing` document per member (migration `20261014000000_writing_profiles.sql`). Glyph sheets and signature PNGs go in the private bucket under `writing/<user>/`, served only through ownership-checked routes (`/api/account/writing/...`, `Cache-Control: private, no-store`).
- Print: `resolveCardWriting(userId, writing)` returns the font, renderer or signature for `layoutCard`. It refuses (404) a custom style or saved signature the user doesn't own, so a forged brief can't print someone else's signature. Typed signatures are screened like the sign-off. `layoutCard` embeds the handwriting TTF (or places the rendered message at 300 DPI), reserves a 0.7 in signature band, and reports `messageFitted` from the renderer too.
- Privacy: export includes the writing summary; account deletion removes the document and every private file. Signatures are used only to print the member's own cards: never as an e-signature, never shared, never used for training.

**Still to do (not launch-blocking)**
- Wire `resolveCardWriting` into the print job when B4/B6 build the real card print path (today `layoutCard` supports it and is tested). At checkout, copy the resolved style sheet and signature into the order's own files, so deleting them afterwards can't break a paid order. The handwriting fonts are traced into API functions (`outputFileTracingIncludes` in `next.config.ts`).
- Attorney question: the data export lists signatures and handwriting styles but not the images themselves ("ask support"). Is that enough for access requests on signature images?
- Trust & safety: drawn or uploaded signatures are ink-only and print only on the member's own cards. Add an image check on upload in live mode if abuse shows up.
- Phase 2: "match my handwriting" from a free-form photo (suggest the nearest preset with a vision call); a per-letter re-upload instead of a new sheet; joined-up cursive for own handwriting (needs glyph connections).
- CX: help article and short video for the template sheet; QA: add the account handwriting flow to the e2e scripts.

## Photo cards and events (added 2026-10-14, owner request)
Holiday photo cards (flat 5x7, 1 to 4 photos, batches of 10 to 200), save the dates (flat 5x7 or 4x6, QR, digital version) and invitations (5x7 suite with RSVP and details cards, plus a digital event page with RSVP). These are photo-collage products sold in batches to an address list, with AI used for photo picking, cropping, wording, proof checking and optional illustrated art. Full plan, sizes, phases and every agent's part: `docs/products/photo-cards-and-events-plan.md`. Christmas 2026 go/no-go for holiday photo cards on **Oct 24** (depends on a confirmed flat-card printer); save the dates Jan to Mar 2027; invitations Mar to Jun 2027. Build item **B14** once wave 1 reports in.

## Platform assessment — 2026-10-12
Each agent checked its own part of the build, one at a time, in this order: CTO, engineers, platform, data/quality, business, legal/ops. Every entry uses the same headings: **Built vs. needed**, **Plan changes**, **Scale adjustments**, **Easy fixes made**, **Blocked by**.


### CTO
**Built vs. needed**
- **No real persistence.** Every user, cart, order, book project, job and photo lives in JSON files on local disk (`app/lib/shop/store.ts`, `app/lib/book/store/fileStore.ts`, `LocalDiskStorage`). `live.supabase` is hard-coded `false`; no Supabase auth, table, storage or queue code exists. On a Vercel preview each instance has its own `/tmp`, so sign-in, cart and orders can vanish between requests. The definition of done cannot pass until SEC-18 (Supabase adapter with RLS) lands.
- **Paid orders cannot reach a real printer.** `printAssets()` in `app/lib/shop/orderService.ts` returns `{}`, so the real Lulu and Prodigi adapters fail file validation and every printed line goes to `needs_attention`. The cart is not linked to the creation's print PDFs. Lulu also needs one wrap cover with a spine (cover-dimensions API), which is not built; the Prodigi SKU is a placeholder.
- **Long jobs can't run on Vercel.** Book jobs and the live guest preview spawn `pipeline/node_modules/tsx` as a child process. Vercel can do neither. I fixed this for mock jobs only (below). Live AI on a deployment needs the hosted queue (SEC-21).
- **Spend caps are not durable.** The guest-preview cap is an in-memory counter per instance (`lib/intake/preview.ts`). The book cap is a per-project file ledger, checked before each attempt, so parallel renders can overshoot it. A global Postgres ledger is needed (SEC-10, DATA-006, DATA-009).
- **Printers are called inside the Stripe webhook.** `submitOrder` runs inline, so a slow print API means webhook timeouts and Stripe retries. Move it to a queued job.
- **Stripe Tax is incomplete.** Automatic tax was flagging every taxed order as a mismatch (fixed). The session still does not pass the ship-to address to Stripe, so tax would be worked out from the billing address. Verify on the first test-mode run.
- **The 90-day photo purge never runs.** The route expects `POST` with `x-cron-secret`, but Vercel Cron sends `GET` with `Authorization: Bearer CRON_SECRET`, and no cron is configured. This is a legal requirement (docs/legal/06), so it needs a fix before launch.
- **There is no single launch-flow e2e test.** `tests/e2e/card-flow.mjs` and `shop-walk.mjs` are separate scripts; neither covers the book or the whole of steps 1–7. Auth is fake only (no Google), and the production env guard (SEC-02) is missing.
- **Adapters (Stripe, Lulu, Prodigi, Resend) are written and unit-tested, but none has run against a sandbox.**

**Plan changes**
- I corrected two lines directly: the measured token costs (a book is about $1.10–1.64, not $2–4; a card about $0.16–0.25), and the Payments line (addresses are collected on our checkout page, not by Stripe).
- The wave sequencing is spent. The critical path now is: Supabase project → SEC-18 auth, store and storage → SEC-10/SEC-07 durable ledger and limits → SEC-21 queue → `printAssets` plus Lulu cover wrap → Stripe, Lulu and Prodigi sandbox runs → one Playwright spec for steps 1–7 on the preview. CX, Data and Legal items fit around that path; they do not block it.
- Pick the job host now. My recommendation is Inngest, or Supabase Queues with a small always-on worker, with one step per page. Vercel functions cannot hold a 5–15 minute render. Progress can stay on polling; Realtime is optional.
- The plan promises `docs/cto/mobile-plan.md`, but it does not exist. Defer it explicitly until after launch.
- The definition of done says "printer sandboxes". That depends on print PDFs stored at URLs the printer can fetch (signed URLs from Supabase Storage), so storage must come before M6.

**Scale adjustments**
- **10×:** the JSON store reads and rewrites the whole DB on every call and serializes all writes, so it is already a problem. Move to Postgres; it can't be tuned. Run order submission and printer polling as jobs, with webhooks as the main path and polling only as backup. Store webhook event ids in a unique-keyed table instead of a 500-item array.
- **100× (holiday peaks):** a book is 14–18 image calls. Without a global concurrency cap, Gemini image endpoints will return 429 errors and retries will burn time. Add a queue with global and per-user caps (SEC-21), a per-model token bucket, and a dispatch-time spend reservation.
- **Storage:** a book is likely 100 MB or more (2K renders plus print PDFs; estimate, not measured). Set retention for renders and PDFs, not just photos, and serve previews as downscaled WebP, not data URIs.
- **Cost:** never-buy guest previews (about $0.04–0.07 each) are the main way costs run away. Durable per-device and global caps plus Turnstile come before any marketing spend.

**Easy fixes made**
- `app/lib/env.ts`: `childProcessEnv()` allow-list (SEC-22). Spawned workers now get only OS basics, non-secret `GREETHUB_*` settings and the OpenRouter key; Stripe, session, Supabase and email secrets no longer pass through. Used in `app/lib/book/queue.ts` and `app/lib/intake/preview.ts`.
- `app/lib/book/queue.ts`: `AfterResponseQueue`. When the tsx worker can't be spawned (on Vercel), mock book jobs run in-process via Next `after()`, and live jobs fail with a clear error.
- `app/lib/shop/store.ts`: on Vercel the fake store writes to `/tmp` instead of the read-only deploy directory.
- `app/lib/adapters/types.ts`, `app/lib/adapters/real/stripe.ts`, `app/lib/shop/orderService.ts`: the amount check now compares amounts before tax, so Stripe automatic tax no longer blocks fulfilment.
- Tests: `app/tests/platform.test.ts` (new) and a tax case in `app/tests/shop/checkout-flow.test.ts`. Typecheck clean, 449/449 tests pass, `next build` passes in a scratch copy.
- `docs/cto/setup-needed.md`: corrected the out-of-date "currently stubbed" line.

**Blocked by**
- Owner: Supabase project credentials (URL, anon key, service-role key). These block persistence, real auth, storage, the queue and therefore the preview e2e.
- Owner: Stripe test keys and webhook secret, and Lulu and Prodigi sandbox keys, so the adapters can be verified.
- Owner decisions: the job host (Inngest account, or a worker host), plus the final Lulu pod package and Prodigi card SKU.

### Card engineer
**Built vs. needed**
- **There is no signed-in card path.** `/create/card` never reads the session, so a signed-in user gets the same guest locks: "Looks good", Re-roll, Save draft and "Start another card" all open the sign-up modal. Nothing builds the full card: no full-res render route, no call to `layoutCard`, no card print PDF, no approval page (UX spec section 5: Mailed/Digital, "Send it straight to Rosa", price, Add to cart, re-roll count), no add-to-cart. The cart only knows the hard-coded `demo-card-rosa`. Plan step 3 ("create a card, approve it, see the proof") cannot pass yet. This is the biggest card gap.
- **Drafts never leave the browser.** `migrateToAccount` and the Supabase draft storage throw "TODO". "Your card comes with you" is only true on the same device, and nothing appears under Account → Drafts.
- **The printed message can differ from the approved one.** `pipeline/src/stages/copy.ts` asks Sonnet to write the inside message ("use the buyer's wording if given") and prints its output, while the preview shows the customer's exact words. The print path must use `messageWording` verbatim and generate a message only when it is empty (pipeline owner).
- **Card print PDF is unchecked against Prodigi.** `layoutCard` makes two separate 5.25×7.25 in pages (front, inside right). The Prodigi 5×7 card file spec (panels, spreads, outside back) is not verified (not found in repo). A message that doesn't fit at 11 pt sets `messageFitted:false`, but nothing reads it, so text can run off the panel. Spec copy for this ("That message is a little long for the card...") is not wired.
- **The guest limit is a cookie only.** Clearing cookies or a private window gives another paid preview. The cookie is set after the render finishes, so parallel requests (up to 5 per IP per 10 minutes) each render. The rate-limit key is the left-most `x-forwarded-for`, which a client can spoof off Vercel.
- **The spec says leaving the page is safe, with a "View" toast. It isn't:** the preview is one blocking 30–90 s request, and the progress bar is fake. If the guest leaves, the render is still paid for, and the cookie may never arrive.
- Minor: the IP rewrite reads awkwardly in the brief ("A Pip (a tall skinny field mouse...) party", lib/safety). At 1280×900 the preview pane sits below the fold, so "Make my preview" is off-screen when the brief completes. The `tests/e2e/card-flow.mjs` guardrail step was stale (fixed below).

**Plan changes**
- Add an explicit milestone, "M3b: account card flow": session-aware creator, full render job (card = front plus optional inside, reusing the book job queue), approval page per UX spec section 5, `layoutCard` print PDF stored with `printAssets()` wiring, and add-to-cart with a real `creationId`. Today it is implied by step 3 but owned by no one.
- Product definition says guests get "no saved drafts", but the creator keeps a guest draft in localStorage (useful, and labeled "Draft kept on this device"). Reword to "no account drafts".
- The sign-off is now printed under the message (it was collected and dropped before). Confirm with the CMO that the default sign-off is the user's first name (intake-questions.md), which needs the session.

**Scale adjustments**
- **10×:** the in-memory guest cap, the rate limiter and the daily spend counter are per instance, so they reset on every cold start. Move them to the shared Postgres ledger (same as SEC-10). Guest previews return a base64 JPEG (~80 KB) in JSON and keep it in localStorage. Serve a signed WebP URL instead.
- **100×:** guest previews spawn one tsx process per request with a 180 s hold on a function. Route them through the same queue as books with a global image concurrency cap, and have the client poll. The live guide makes up to 4 Sonnet calls per turn with 12 turns of history. Cap tokens per session and cache the system prompt.
- **Abuse:** add Turnstile before the first preview, and a per-device plus per-IP durable guest marker. Without them, preview cost scales with traffic, not orders.

**Easy fixes made**
- `app/app/create/card/CardCreator.tsx`: a guide reply no longer overwrites form edits made while the guide was thinking. The inside of the preview shows the current message, so text edits show without a new render. "Start over" now clears the stale error, rewrite and style-offer state. The chat log scrolls to the newest turn after switching Form back to Chat.
- `app/lib/intake/draft.ts`: new `insideText()` adds the sign-off under the message (no duplicate if already there) and feeds `messageWording`; new `mergeServerDraft()`.
- `app/app/api/intake/route.ts`: live Greet Guide spend now counts toward the daily cap, and over the cap the free rule-based guide answers instead.
- `app/tests/intake-card-inside.test.ts` (new, 6 tests). `app/tests/e2e/card-flow.mjs`: guardrail step updated to the current rewrite-and-continue flow. The mock walk passes at 1280 and 390 px; I checked the screenshots.
- `app/lib/intake/pipeline-runner.mjs`, new `app/lib/intake/guest-prompt.ts`: the live guest preview passed `characters: []` to `guardLines`, so every prompt said "no people or animals" (even "a bear with soup"). It now passes the brief's real cast (characters plus pet), and with no cast it uses a neutral count line that lets the scene decide. Test: `app/tests/intake-guest-prompt.test.ts`.

**Blocked by**
- Supabase (owner credentials, then SEC-18) for account drafts and a durable guest cap; the job host decision (SEC-21) for the full card render; Prodigi card SKU and file spec for the print PDF; pipeline owner for verbatim message printing.

### Book engineer
**Built vs. needed**
- **The proof shows things the print file leaves out.** The proof viewer's cover slide shows "For {recipient}" and the dedication, and the customer edits the dedication on the proof screen. But `layoutBook` (`pipeline/src/layout/book.ts`) has no dedication field, so neither is printed. People approve words that never reach the book. Fix: print the dedication on the title page, which keeps the page count the same (pipeline owner). Until then, the proof should show only what prints.
- **Print-file problems are hidden.** `engine/live.ts` returns only `report.files`, so `layoutBook`'s `unfitted` list (text that did not fit at 12 pt) is thrown away, and the proof is approved anyway. The layout job should fail, or flag the page, when `unfitted` is non-empty. `pdfFiles` are absolute paths on a local disk, and no route serves them. In mock mode `layout()` returns `{}`, so CI never builds a book PDF. Mock mode should run `layoutBook` on the placeholder art (free).
- **Box C keeps photos forever.** The purge skips any project whose consent ticked box C. Legal req 25 allows that exception only for Saved People, and Saved People is not built. Until it is, box C should only stop the purge if the photos have been saved as a Person. This needs an owner or legal decision before we change it, because the change deletes data.
- **The purge leaves derived data behind.** Purge and consent withdrawal delete the original photos but keep `work/<id>/identity.txt` (a text description of each person written from the photos) and the model sheets. Req 25 says "derived crops". Ask legal whether the identity text counts as derived data.
- Works in mock mode, per the tests: the six steps; the consent gate before upload and before every job; the sheet approval gate before pages render; free retry of failed pages; paid re-rolls refunded when they fail; the watchdog for dead workers; the per-project spend cap (enforced on every call through the project ledger).
- There is no book e2e script (`tests/e2e/` covers only the card and shop), and the dev server was down, so I did not run the headless six-step walk.

**Plan changes**
- Step 4 lists the order as "photos → character sheet approval → story". The build, and the better order, is photos → story → character sheet → pages → proof. The sheet is drawn for the approved cast. Update the line.
- "Re-rolls (a monthly allowance)" is wrong for books. The build gives 3 page redraws per book, plus 2 free character-sheet redos. The CFO and CMO should confirm and reword it.
- Overview line 4 says "reportlab PDFs". The PDFs are built with pdf-lib in TypeScript.
- Add a book e2e script (`tests/e2e/book-flow.mjs`, mock mode, at 1280 and 390 px) to the M4 check (QA).

**Scale adjustments**
- **10×:** every progress poll (every 2 s) runs `syncProject`, which reads every job file on disk (`listByProject` scans the whole `jobs/` directory). That cost grows with total jobs times active viewers. Postgres with an index on `project_id` fixes it (SEC-18). The purge also reads every project. Make it a single indexed query on `photos.expires_at`.
- **100×:** `QUEUED_STALE_MS` is 45 s, so once a hosted queue has a backlog the watchdog fails jobs that are only waiting. With SEC-21, the queue's own state (accepted or retrying) should decide when a job is dead. Pages render one at a time (13–17 images, then QA), so a book takes 10–15 minutes. Run 3–4 pages in parallel under a global per-model cap.
- **Cost:** a whole book (about $1.10–1.64) is spent before payment, and there is no limit on books per account. Each new project gets a fresh $4 cap. Add a per-account cap on active unpaid books, plus the global ledger (SEC-10).
- The proof strip and tiles load full 2K PNGs as thumbnails. Store WebP thumbnails when each page is rendered.

**Easy fixes made**
- `app/app/api/book/privacy/purge/route.ts`: the purge now accepts Vercel Cron's `GET` with `Authorization: Bearer $CRON_SECRET`, and still accepts `POST` with `x-cron-secret`. The check is timing-safe and lives in `cronAuthorized()` in `app/lib/book/privacy.ts`. Still needed: a `crons` entry in `vercel.json` and `CRON_SECRET` set in Vercel (DevOps).
- `app/lib/book/privacy.ts`, `app/lib/book/store/types.ts`, `app/lib/book/store/fileStore.ts`: delete-my-data now also cancels running jobs and deletes the job documents (they held names, the brief and story text) and the job logs. Before, it only blanked the photo paths.
- `app/tests/book/consent.test.ts`: 2 new tests. Typecheck clean; 457/457 tests pass.

**Blocked by**
- Nothing for the fixes above. The dedication fix needs the pipeline owner, the box C and identity-text questions need the owner and legal, and moving jobs to a hosted queue waits on the CTO's SEC-21 host decision.

### Shop engineer
**Built vs. needed**
- **Orders never reach "delivered".** Neither Lulu's print-job statuses nor Prodigi's stages report delivery, and `mapPrinterState` only gets `delivered` from the fake printer. Real orders stop at "shipped" forever, so (a) the account-deletion promise in `DELETION_VENDORS` ("names and addresses are cleared after delivery") never happens, because `scrubOrder` waits for a terminal status, and (b) shipped orders are polled on every account visit for good. Fix: mark a line delivered N days after the ship date (or from carrier tracking), and scrub deleted accounts' orders on that date.
- **Account deletion left every book and photo behind** (SEC-23). The "account deleted" email said photos were removed. Fixed below; the export (`exportUserData`) still leaves out book projects and consent records (legal req 28).
- **Printer webhooks are never registered.** The Prodigi order payload has no `callbackUrl`, and nothing subscribes Lulu webhooks, so tracking depends on page-view polling. The shared secret sits in the URL query, where it ends up in access logs. Check whether Lulu and Prodigi offer signed webhooks (not verified) and use them.
- **Lost updates and double prints.** `submitOrder` and `refreshOrder` read the order, await printer calls, then overwrite the whole order, so a printer webhook that lands in between is lost. Lulu `submit` has no idempotency key (Prodigi has one), so any second `submitOrder` run (a queue retry under SEC-21) can print twice. Add a "submitting" claim with a lease before calling the printer, and look up Lulu's `external_id` before resubmitting.
- **Paid but no order, and nobody is told.** On an amount mismatch the checkout is marked `failed` and only `console.error` fires. The customer has paid and gets no email. Alert ops and refund automatically. `async_payment_failed`, `checkout.session.expired`, `charge.refunded` and `charge.dispute.created` are not handled, so refunds never show on the order and stale checkouts pile up.
- **Shipping levels clash with what we promise.** Lulu `MAIL` and Prodigi `Budget` are the cheapest tiers and may lack tracking (not verified). We promise dates and send tracking emails. Lulu's phone number falls back to `0000000000`. Fulfillment and the CFO should pick the tiers; checkout should require a phone for books if Lulu needs one.
- The PLAN lists a "proof ready" email; no template exists in `lib/shop/mail.ts`. There is no customer cancel button, though Lulu holds production for 120 minutes (`production_delay`). The CX-04 delivery range is still the browser-side `earliestDeliveryDate()`.

**Plan changes**
- Architecture, Fulfillment line: "printer webhooks write status and tracking back" is not true yet (see above). Add webhook registration and a derived "delivered" rule to M6.
- Add to M5: handle the refund, dispute, expiry and async-failure events, plus an ops alert on mismatched or failed fulfilment. Add to M6: Lulu dedupe and a submit claim before any job queue retries print calls.
- Email line: either build "proof ready" or drop it from the plan. Sends should go through a durable outbox with retry, not inline `await` calls whose failures are only logged.

**Scale adjustments**
- **10×:** every account or order page view polled each printer for every open line (fixed below with a 5-minute throttle per instance). `findCheckoutBySession` and `applyPrinterWebhook` scan every checkout and every order. In Postgres, index `checkouts.session_id` and `order_items.external_id`, and make `processed_events.id` a primary key (CTO).
- **100× (holiday peak):** run confirmation and shipped emails through a queue with an idempotency key per order and kind. Check Resend's plan quota and rate limits before Q4 (not verified). Make printer polling a scheduled job that only checks lines that haven't changed in X hours, rather than doing it on page views. Use row-level updates per order line, not whole-order overwrites.

**Easy fixes made**
- `app/lib/shop/orderService.ts`: `handlePaymentWebhook` returns 404 when the fake payments adapter is active outside dev or opt-in previews. Before this, a production deploy without Stripe keys accepted events signed with the public fake secret, so anyone could forge a "paid" event and get a free order. Also new `refreshOrderIfStale()`.
- `app/lib/shop/policies.ts`, `app/lib/shop/api.ts`: moved `fakeAllowed` so the order service can use it (`api.ts` re-exports it).
- `app/app/api/orders/route.ts`, `app/app/api/orders/[id]/route.ts`: page views use the throttled refresh.
- `app/app/api/account/delete/confirm/route.ts`: calls `deleteUserBookData` before deleting the account, and stops with an error if the book data can't be deleted.
- `app/app/api/webhooks/printer/[name]/route.ts`: Prodigi callbacks now read shipment tracking, the same way the polling adapter does.
- `app/tests/shop/checkout-flow.test.ts`: 2 tests (forged event refused in production, throttled polling). Typecheck clean; 459/459 tests pass; eslint is clean on the changed files.

**Blocked by**
- Owner: Stripe test keys, Lulu and Prodigi sandbox keys, and a Resend key to verify the adapters end to end; Supabase (SEC-18) for durable orders.

### Integrations
**Built vs. needed**
- **Nothing can connect yet, from any platform.** No OAuth authorization server exists (`TokenVerifier` is never set outside tests), no `ApiKeyStore` exists, and no grant can be created. Every real bearer token gets 401. The "connection test from a custom connector" in my definition of done cannot pass until AGT-010 (Supabase OAuth server vs a small custom AS) and AGT-003 (grants tables, which need SEC-18) land.
- **13 of 16 tools are stubs** that return `not_implemented` (drafts, people, orders, approval, pay, rules). Only `search_styles`, `get_quote` and `get_account_limits` work. No approval page exists. That is honest and safe, but the channel is a framework, not P1.
- **Idempotency runs after policy.** A retry with the same key re-runs quotas, rate limits and the text screen, so a legitimate replay can come back `quota_exceeded` instead of the original result. Move the replay lookup in front of `authorize()` (needs a `peek()` on `IdempotencyStore`).
- **The model-spend ledger has no settle step.** `CostLedger` has `reserve` and `release` only; successful reservations are never settled to actual cost or reset daily. In the memory ledger, about 40 successful drafts would close the pool until restart. Add `settle(ref, actualUsd)` and a daily window to the interface before SEC-10 implements it.
- **Owner files** (`.well-known/oauth-protected-resource`, `api/agent/v1/[tool]`, `api/mcp` routes): git shows no uncommitted changes in them today. As committed they are thin and correct. Recommended: (a) also serve the RFC 9728 path form `/.well-known/oauth-protected-resource/api/mcp`, which some clients try first; (b) `api/mcp` should check the `Origin` header (MCP spec, DNS rebinding) and answer `OPTIONS` if a browser client such as MCP Inspector is to be used; (c) there is no rewrite for `mcp.greethub.com` in `next.config.ts`, so `AGENT_MCP_RESOURCE_URL` must equal `<site>/api/mcp` until one exists; (d) add an unauthenticated per-IP limit ahead of `authenticate()`; (e) `GET /api/agent/v1/openapi.json` (AGT-011) is not built.
- `abuse.flag(..., "rate_limit")` drops a grant to require-approval for good (no 24-hour expiry) after a single rate-limit hit. The production `AbuseSignals` needs the expiry from 05 section 9.4.

**Plan changes**
- PLAN.md never mentions the agent channel. Add one line: it is dark (`AGENT_CHANNEL_ENABLED` off), not on the November launch path, and P1 starts only after SEC-18, SEC-07 and SEC-10 are live. 06 puts P1 about 5 to 6 months after approval, so early 2027 at the earliest.
- The 00/06/07 docs say "design only, no app code", but a framework was committed (4f92808). Add a status table to 06 marking each AGT ticket built, stubbed or not started.
- AGT-001 is not done: `docs/integrations/answers/` does not exist, so the written questions to OpenAI and Anthropic about commerce and AI images are not on file. Directory listing (P4) stays blocked on them. I did not re-check platform policy pages today; the last read was 2026-10-11.
- `supportedProtocolVersions` lists `2026-07-28`. I could not verify that MCP version from the repo; check it against modelcontextprotocol.io before P1.
- The homepage and `/assistants` advertise the feature as "coming soon". That is accurate, but the CMO should decide whether it belongs on the homepage at launch, since it is months away.

**Scale adjustments**
- **10×:** one tool call is about 9 store round trips (grant, kill switches, limiter, usage, ledger probe reserve and release, audit, idempotency claim and complete). Fold `authorize()` into one Postgres function, drop the probe (a read is enough), and cache kill switches for 5 to 10 s (06 allows 15 s for revoke).
- **100×:** the single `agent` spend pool is one hot row and $10/day is about 40 drafts for all users together. Size the pool per connected account with a global ceiling, and shard the counter. The duplicate-request wait loop polls the store up to 100 times; return `service_busy` with `Retry-After` instead. `preview_card` must not hold a function for 20 s; return `pending` and let the assistant poll the job queue (SEC-21). Partition `agent_audit` by month (13-month retention).

**Easy fixes made**
- `app/lib/agent/mcp/protocol.ts`: the body-size cap is checked on the body too (chunked requests skipped it); JSON-RPC batches are refused (both supported MCP versions forbid them, and a batch could run paid calls and then drop their results on a later 403); the client `x-request-id` is checked before it goes into audit rows.
- `app/lib/agent/rest.ts`: the same request-id check.
- `app/lib/agent/policy.ts`: the ledger probe key is now unique, so parallel calls can't release each other's probe.
- `app/lib/agent/dispatch.ts`: reserves the same spend estimate the policy checked, not a fixed $0.25.
- `app/lib/agent/service.ts`: `get_account_limits` reads the real pause state and reports autonomy only after cooling-off, matching policy.
- `app/tests/agent/agent.test.ts`: 2 tests. Typecheck clean; 461/461 tests pass.

**Blocked by**
- Owner: choose the OAuth authorization server (AGT-010) and provide Supabase (SEC-18). Without both, no platform can connect and the connector test cannot run. Owner and attorney: AGT-001 platform questions and agent terms before P2.

### IP safety
**Built vs. needed**
- **The output vision check fails open.** If the vision call errors or its JSON is unreadable, `qaPage` passes the page ("QA call failed; not blocking"), and the guest runner treats it as no flags. A page that was never IP-checked can reach the proof and the printer. Needed (pipeline owner): store an IP verdict per page, retry the check, and require a verdict before proof approval and print. Legal 07 said the check was "never skipped". It can be.
- **The character model sheet gets no IP control.** `pipeline/src/stages/modelsheet.ts` has no hardening lines, no sanitiser on the identity text and no vision check, but every page copies the sheet. A look-alike sheet makes every page fail, re-roll and block, so a whole book's renders are wasted. Add one vision check (about $0.01) before the customer approves the sheet.
- **Text rules hold up offline.** I ran a 57-case evasion probe (misspellings, joined words, hashtags, homoglyphs, zero-width and emoji padding, 10 languages, descriptions, slogans, styles) plus 29 benign family cases. Before my fixes the rules caught 44/57, with 1 false positive ("Ariel my niece"). After: 49/57 and 0. They still miss: short-name misspellings ("Elsaa", "Frozzen"), "Buzz Lightyaer", "Taylor Swifft" and "Tay Tay" (public figures have no fuzzy match), descriptions without a stock phrase, and "Just do it, birthday girl" (a deliberate precision choice). The live Sonnet screen covers these, but not in mock mode or when the call fails.
- **Live screen spend is uncapped.** `lib/safety/server.ts` counts Sonnet screen spend in memory only. It is not in the cost ledger or the daily guest cap, and it runs on every chat turn and draft save, for guests too.
- **Printed name fields are never screened.** `signoff` and `recipientName` count as name-like and skip the IP screen, yet the card engineer's `insideText()` now prints the sign-off. Screen the sign-off as `card_message`; the strong-names-only rule keeps "Love, Elsa" safe (intake owner).
- **Takedown is a form and an inbox, nothing more.** Reports are rows in the JSON shop store with a status field. Nothing links a report to an order or creation, nothing holds a print job, nothing tracks repeat infringers, there is no counter-notice flow and no alert when `dueAt` passes. Report PII was readable on any production preview with `GREETHUB_ALLOW_FAKE=1` (fixed below).
- **Photo moderation is mock-only.** It fails closed (good), but the classifier has never seen a real photo, and the CSAM hook only logs. Attorney procedure is still needed (legal 07 s5).

**Plan changes**
- Product definition, "rewrites 'like Meeko' to 'a friendly raccoon'": outdated. The build rewrites to an original named character whose design changes all four checklist groups (legal 07 s1).
- Pipeline step 6, Automatic QA: add the IP fields (protected character, logo, slogan, licensed merch, look-alike score of 6 or more fails), fail closed on IP, and a check on the model sheet.
- Add to M6: no print without an IP verdict on every page. Add to M5/M7: a takedown workflow with a Supabase `reports` table, a link to the order or creation, a print hold, an alert when `dueAt` passes, and a repeat-infringer log.
- CI should run `npm run eval:ip -- --mock` as its own step. Today the red-team test covers only the `mock:true` and benign cases.

**Scale adjustments**
- **Text screen:** about $0.002–0.003 per Sonnet call, on every chat turn and save. At 100× guest traffic this is a cost that scales with visitors, not orders. Cache results by a hash of the normalised text plus field, skip the model for short and name-only texts (partly done), and test a cheaper classifier for chat, keeping Sonnet for printed and prompt fields. Run the live eval on the cheaper model before switching.
- **Vision check:** about $0.01 per render, so about $0.15–0.20 per book and about $0.01 per guest preview. Each flag costs an extra render. Track `ip_output_flagged` per 1,000 renders and the re-roll cost. The threshold stays at 6 until the attorney answers (legal 07 q7).
- **Photo moderation:** one blocking 30 s call per upload, which fails closed. At holiday peaks a slow provider blocks uploads. Moderate in parallel, use a 10 s timeout with one retry, and add a second model as fallback.
- **Takedown queue:** at 100×, a single inbox misses the 48 h target. Needs the table, an SLA alert and a triage view. Data events go to a local JSONL file, which Vercel loses; send them to the collector (data owner).

**Easy fixes made**
- `app/lib/safety/fastpass.ts`: a relation right after the name ("Ariel, my niece", "Belle (our daughter)") marks a real person, but not "Elsa my daughter's favourite". "like a <known style> book/illustration/drawing" is now caught.
- `app/lib/safety/ip-table.json`: added Pato Donald, Paperino, Bob Esponja, Bob l'éponge, Pepa Pig, Тополино, Человек-паук. The ice-queen descriptor now matches "with the long ... braid".
- `app/lib/safety/reports.ts`: report admin gate uses a timing-safe token compare, and production builds always need `GREETHUB_ADMIN_TOKEN` (`ALLOW_FAKE` no longer exposes report PII). The comment in `app/(shop)/internal/reports/page.tsx` is now stale (shop owner).
- `app/tests/fixtures/ip-redteam.json`: 18 new cases (11 positive, 7 benign); 3 old cases now locked into CI. `docs/legal/07-ip-safety-design.md`: gating text, residual risks, rerun table.
- Mock eval, 215 cases: precision 100%, recall 90.7% (94.2% on the original 197, up from 92.1%), 0/65 false positives. Typecheck clean; 476/476 tests pass. No live calls.

**Blocked by**
- Nothing for the fixes above. Fail-closed vision QA and the sheet check need the pipeline owner, sign-off screening needs the intake owner, and the takedown workflow needs Supabase (SEC-18). The live eval of the new cases needs a dollar cap from the owner, and the CSAM procedure and DMCA agent need the owner's attorney.

### Security
**Built vs. needed**
- **Anyone could act as another user's guest (fixed below).** `fakeAuth.getSession` took any `gh_guest` value as an id. User ids are a hash of the email (`userIdForEmail`), so setting the cookie to a victim's id let an attacker read their cart, then sign in and pull the victim's cart, drafts and saved people (children's names and ages) into their own account via `upgradeGuest`.
- **Sessions could be forged on any deploy missing `SESSION_SECRET`** (fixed below). The fallback secret is in source. And `POST /api/auth/google` signed anyone into the shared demo account in production (fixed below).
- **`GREETHUB_ALLOW_FAKE=1` is still a master key.** With it set, any visitor gets a `devLink` that signs them in as any email, can read `/api/dev/outbox` (every magic and delete link) and can make paid orders through the fake checkout. `fakeAllowed()` and `devSigninAllowed()` don't check `VERCEL_ENV`, and mock AI (which skips photo moderation) can run in production. This is SEC-02's remaining part. It is a one-line change, but it would break any demo deploy that relies on the flag, so the owner decides.
- **Spend has no durable ceiling.** The limiter, the $25 daily cap and the guest cookie are per instance and in memory. Any client can POST from another site or curl with no cookie, so the "one free preview" is really 5 per IP per 10 minutes on each instance. Book routes (`projects`, `photos`, `generate-*`, `reroll`) have no rate limit at all. Each new project gets a fresh $4 cap, and pages render before payment.
- **No CSRF origin check** on any non-GET route. `SameSite=Lax` covers cookie-bearing POSTs, but not the cookieless paid guest routes. `originOf()` trusts `x-forwarded-host` for redirects and Stripe return URLs. Safe on Vercel, but use `NEXT_PUBLIC_SITE_URL` in production.
- **Supabase RLS doesn't exist yet,** because there is no Supabase (SEC-18). The policies are written in docs/security/04 §8. The cross-user test is the gate.
- Secret scan: no key patterns in the 587 tracked files, the git history, or the modified and untracked files, including the agent memory DBs (`ruvector.db`, `agentdb.rvf`; counts only, no values printed). No `.env` is tracked. `npm audit --omit=dev`: 0 in app and pipeline. Dev-only: 5 high in the eslint chain (`braces`). There is no `.github/` (no CI, gitleaks or Dependabot), and `vitest` is still under `dependencies`.

**Plan changes**
- Add SEC-02 (remainder), SEC-07, SEC-10, SEC-13 (Turnstile) and SEC-12 (pay before pages render) to the critical path, after SEC-18 and before any public or marketing traffic. They are the cost controls. Today they appear only in docs/security.
- "Risks to watch" should name model-spend abuse (never-buy guests and free accounts) and the fake-provider flags on Vercel.
- 06-backlog now has a status block. SEC-04 and SEC-22 are done. SEC-01, SEC-02, SEC-03, SEC-11, SEC-16 and SEC-23 are partly done.
- Ignore `ruvector.db`, `agentdb.rvf*` and `finance/.~lock.*` in `.gitignore`. They are agent memory, and a `git add .` would commit them (outside my lane: DevOps or the owner).

**Scale adjustments**
- **10×:** in-memory limits multiply with instance count. Move them to Upstash or Postgres keyed by a signed device token, a /24 or /64 network, and the account (SEC-07). Reserve spend before each call, not after success (SEC-10).
- **100× or under attack:** a botnet can drain the global daily cap in under an hour and lock out paying customers. Keep a separate pool for paid orders, add a kill switch (SEC-08) and Vercel WAF rate rules on `/api/card/preview`, `/api/intake` and `/api/auth/magic-link`. Keep the Cloudflare playbook ready (SEC-36). Magic-link and report emails need per-email limits before Resend reputation suffers (SEC-15).

**Easy fixes made**
- `app/lib/shop/session.ts`: `isValidGuestId()` (`^g_[0-9a-f]{16}$`); `sessionSecret()` refuses a missing or short secret in production (fails closed: sign-in errors, cookies read as signed out).
- `app/lib/adapters/fake/auth.ts`: bad guest ids are ignored in `getSession` and `upgradeGuest`; the Google stub refuses unless `fakeAllowed()`.
- `app/lib/intake/rate-limit.ts`: memory guard (sweeps idle keys at 10,000). `app/app/api/card/message/route.ts`: 20 per IP per 10 min. `app/app/api/card/preview/route.ts`: `Secure` on `gh_guest_card`.
- `app/next.config.ts`: HSTS, nosniff, X-Frame-Options DENY, CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`, Referrer-Policy, Permissions-Policy, no `x-powered-by`. Not checked on a live server (the dev server was down).
- `app/tests/security.test.ts` (5 tests), `docs/security/06-backlog.md` (status). Typecheck clean; 481/481 tests pass; eslint is clean on the changed files.

**Blocked by**
- Owner: confirm `SESSION_SECRET` (32+ chars) is set on every Vercel environment before the next deploy, or sign-in will fail. Keep `GREETHUB_ALLOW_FAKE` and `GREETHUB_ALLOW_DEV_SIGNIN` off and turn on Deployment Protection. Rotate the OpenRouter key and set credit limits (SEC-05). Approve pay-before-render (SEC-12) and a Cloudflare Turnstile account. Supabase credentials for SEC-18 (RLS) and SEC-07/10 (durable limits and ledger).

### DevOps
**Built vs. needed**
- **`next build` passes today** on the current working tree (scratch copy, no secrets set). Lint has 0 errors and 12 warnings, typecheck is clean, 481/481 app tests and 35/35 pipeline tests pass, and the mock IP eval runs. Before today there was no CI at all, no `vercel.json`, no `scripts/` and no `docs/devops/`. All of these exist now (below).
- **The next production deploy could not let anyone sign in, and I can't confirm `SESSION_SECRET`.** The Vercel CLI on this machine is logged in as `cjnealedev`, and that scope has no GreetHub project (7 unrelated projects). The project that built commit 0cd6c67 must be under another account or team. The build now fails in production when the secret is missing or short (below), so a bad deploy can't replace a good one.
- **`app/.env.example` has never been committed.** `app/.gitignore` has `.env*` with no `!.env.example`, so a fresh clone has no variable list. It also leaves out `SESSION_SECRET`, `CRON_SECRET`, `PRINTER_WEBHOOK_SECRET` and `GREETHUB_ADMIN_TOKEN`. `docs/devops/01-environments.md` is now the full list of names.
- **Pipeline typecheck depends on `app/node_modules`.** `app/packages/shared` imports zod, which is installed only in app. A pipeline-only CI job fails, so CI installs both. Longer term, give `packages/shared` its own deps, or use npm workspaces.
- **Preview and production cannot keep state.** Data lives in `/tmp` per instance (CTO), so the purge cron only sees one instance's `/tmp` until SEC-18. The live card preview spawns tsx, which isn't installed on Vercel (only app deps are). Live AI on a deploy waits on SEC-21.
- **Nothing is monitored.** There is no error tracking, uptime check, alert route or log retention. Webhook failures and paid-but-no-order cases only reach `console.error`.

**Plan changes**
- Architecture: add one "Environments and release" line pointing to `docs/devops/` (branch → CI → preview → merge → production; Instant Rollback; expand-then-contract migrations).
- M1 says "a Vercel preview". Make it "a Vercel preview with CI required on `master`". M7: the e2e also runs in CI against the preview URL once Supabase exists.
- LAUNCH-CHECKLIST Part 5: Root Directory `app`, with "include files outside the root directory" left on (the build reads `../scripts` and `../pipeline`). Add `CRON_SECRET` and `GREETHUB_ADMIN_TOKEN` to the secret table. Vercel crons run on production only.
- Risks to watch: add "no monitoring or alerts" (SEC-09) and "no backups until Supabase Pro" (SEC-39).

**Scale adjustments**
- **CI minutes:** one push uses about 10 runner-minutes over 4 jobs (estimate; not measured on GitHub). The private-repo free tier is about 2,000 minutes a month (not verified), which is roughly 200 pushes. Agent commits will pass that at 10×. Next steps: run `push` only on `master` plus `pull_request`, and skip build and tests for docs-only changes with `paths-ignore`.
- **Vercel builds:** every pushed branch builds a preview. At 10× agent branches, add an Ignored Build Step that skips the build unless `app/`, `pipeline/` or `scripts/` changed. I did not add it, because I couldn't confirm how it treats manual redeploys.
- **Function time:** card preview holds a function for 30–90 s (`maxDuration` 180), and books can't fit in a function at all. At 100× this is the biggest compute cost, and it hits the Fluid concurrency limits. Moving to the queue (SEC-21) fixes it.
- **Logs:** Vercel keeps runtime logs only briefly. Before launch, set up a log drain with 30-day retention and no request bodies. At 100×, sample info-level logs.
- **Backups:** Supabase Pro daily backups plus one restore drill (SEC-39). Skip PITR (about $100/mo) until a one-day loss is expensive. Don't back up photos anywhere (90-day purge).

**Easy fixes made**
- `.github/workflows/ci.yml` (new): app lint, typecheck, vitest, mock IP eval and `next build`; pipeline typecheck and tests; `npm audit --omit=dev --audit-level=high`; gitleaks CLI (redacted) on pushed commits, full history weekly. Mock mode, no secrets. Not yet run on GitHub.
- `.github/dependabot.yml`, `.github/gitleaks.toml` (new): weekly grouped npm updates, no automatic Next or React majors (SEC-33); gitleaks default rules.
- `app/vercel.json` (new): daily purge cron (`17 8 * * *`) for the book engineer's GET route. The build command runs `scripts/check-env.mjs` first.
- `scripts/check-env.mjs` (new): prints names only. It fails the production build on a missing or short `SESSION_SECRET`, and warns about `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `GREETHUB_ADMIN_TOKEN`, Stripe keys, and the fake or dev sign-in flags. Tested with dummy values.
- `scripts/scratch-build.sh` (new): runs the whole CI suite in a temp copy, without env files or the dev server. Run end to end: everything passed. `scripts/hooks/pre-commit` (new): optional gitleaks hook (SEC-06).
- `docs/devops/01-environments.md`, `02-release-and-rollback.md`, `03-monitoring-and-backups.md` (new). App typecheck clean; 481/481 tests pass.

**Blocked by**
- Owner: the Vercel login that owns the GreetHub project, to confirm `SESSION_SECRET`, `CRON_SECRET` and the other env names. Also turn on Deployment Protection, `master` branch protection with CI required, and Vercel and Stripe failure emails. Decide on uptime, Sentry and log-drain accounts. Outside my lane: `!.env.example` in `app/.gitignore` and ignoring `ruvector.db`, `agentdb.rvf*` and `finance/.~lock.*` (owner or CTO).

### QA
**Built vs. needed**
- **New `app/tests/e2e/launch-flow.mjs` runs stop-condition steps 1–7 in one session** (guest card → sign-up → book with consent and synthetic photos → cart → pay → email → tracking → account → delete), with axe on 13 screens. In mock mode it passes 16/16 checks at 1280 and 390 px. It also reports 4 **GAPs** that fail only with `STRICT=1`: the guest draft doesn't carry over; a signed-in "Looks good" still shows the sign-up wall (no account card path, so the cart card line is a stand-in `demo-card-rosa`); no sandbox print submission; the export leaves out book projects and consent (legal req 28). This is the book e2e the book engineer asked for.
- **Regression on this session's changes:** `card-flow` passes on both viewports. `shop-walk` **failed on every run** until I fixed a hydration bug (below). After the fix it passes on both viewports.
- **Shop footer bug (fixed):** `<address>` sat inside `<p>` on every shop page. React re-rendered the page on load and wiped input typed in the first moments, such as the sign-up email.
- **Flakes:** on a cold `next dev`, the first page load full-reloads while the route compiles (scripts now warm up routes first). One cold-start launch run still failed once, and I did not find the cause; 5 later runs passed. A second full pass within 10 min trips the guest-preview limit (5 per IP, 429). Next 16 keeps the previous route mounted but hidden, so tests must target `{ visible: true }`.
- **The preview URL can't be tested yet.** Sign-in and delete use the local `dev-link`. A preview needs a readable test inbox or a Supabase test-user helper. The Stripe hosted-checkout branch is written but has not been run.
- **Accessibility (`a11y.mjs`, 14 public pages × 2 viewports, axe and Tab walk):** no critical issues and no keyboard traps after the fixes. Still serious: `.gs-link` #c8441f on cream is 4.09:1 (AA needs 4.5:1; design). The card brief's "Add" buttons are labelled "Edit …" (WCAG 2.5.3; card). The `.gc-chat` log and mobile `.gb-stepnav` scroll regions can't be reached by keyboard. There is no skip link, and closing the cookie notice drops focus to `<body>`.
- **Content:** the home hero still says "Mother's Day ships free until May 4" (CMO). The card upgrade modal's "Make a free account" button opens `/login` ("Welcome back") (card).
- There is no visual regression testing, and no e2e job in CI.

**Plan changes**
- M7 and Verification: the done gate becomes `STRICT=1 node tests/e2e/launch-flow.mjs` with 0 gaps on desktop and mobile against the preview, plus `a11y.mjs` with no serious violations. QA owns it, not the CMO. CX usability sessions (docs/cx/04) stay separate and use live adapters.
- Stop condition step 4: change the order to photos → story → character sheet → pages → proof (matches the build).
- Add an M6 item: a preview test-auth path (test inbox API, or Supabase admin magic links, gated to preview only). Without it, M7 cannot run.
- "Playwright e2e" today means plain library scripts. Move to `@playwright/test` (retries, traces, `toHaveScreenshot`) once a dev dependency is approved (CTO).

**Scale adjustments**
- **Per PR:** add a CI job (DevOps) that builds, runs `next start` in mock mode with the fake/dev flags set only in CI, then runs launch-flow, card-flow, shop-walk and a11y. A production server has no compile reloads, so the flakes go away.
- **Per release:** run STRICT launch-flow on the preview, then a manual walk with real art. Add visual snapshots of about 12 key screens at 2 widths, with mock art kept deterministic.
- **More engineers:** give each creator its own spec, run them in parallel shards, and make the rate-limit window configurable for tests so suites don't trip each other.

**Easy fixes made**
- `app/components/shop/ShopShell.tsx`: `<p>` changed to `<div>` around the DMCA `<address>` (hydration bug).
- `app/components/brand/Controls.tsx`: the progressbar now has an accessible name (8 screens). `app/components/brand/TemplateCard.tsx`: a card that does nothing when clicked is no longer a nameless `<button>` (cart, checkout).
- `app/components/shop/Account.tsx` and `app/styles/components.css`: account nav links use `aria-current="page"` instead of `aria-pressed`.
- `app/tests/e2e/`: new `_lib.mjs`, `launch-flow.mjs` and `a11y.mjs`. `shop-walk.mjs` now asserts results and exits 1, uses bundled Chromium and `BASE_URL`. `card-flow.mjs` now warms up routes. Output goes to the OS temp folder, not the repo. `docs/qa/README.md` is the runbook.
- Typecheck is clean and 481/481 tests pass.

**Blocked by**
- Preview e2e: Supabase (SEC-18) plus a preview test-auth path, Stripe test keys, and Lulu and Prodigi sandbox keys (owner). Owner approval to add `@playwright/test` as a dev dependency. Nothing else for local mock runs.

### Head of Data

**Built vs. needed**
- **The app emits 4 of the 95 planned events.** Only `ip_input_rewritten`, `ip_input_blocked`, `ip_output_flagged` and `ip_output_rerolled` exist (`lib/safety/events.ts`). Their names and properties match the plan, but they go to `safety-events.jsonl` in `/tmp`, which Vercel loses, and the envelope has no `subject_id`, `creation_id`, `job_id` or `app_version`. That means no "flags per 1,000 renders" and no join to cost. The other 91, including every funnel, payment and consent event, have no emitter. No `track()`, no `/api/t`, no UTM capture (DATA-002/003/004).
- **There is no durable cost ledger.** `FileLedger` writes `cost_ledger.jsonl` into the book work dir, which `deleteUserBookData` removes (`privacy.ts:65`). Guest previews write it into a `mkdtemp` dir and delete it in `finally` (`preview.ts`). Greet Guide and safety-screen spend only go into in-memory counters. The only real cost data is `pipeline/measurements/*.jsonl` from dev runs. After launch the CFO workbook gets no measured cost per order. DATA-006 (`ml.generation_attempts`) is the fix and should land together with SEC-10.
- **No KPI dashboard exists.** `app/(shop)/internal/reports` lists takedown reports from the shop store. It reads real data, but it is not analytics, and none of D1–D12 is built. QA verdicts, prompt version, served model and the ZDR flag are still not stored with any generation (00-assessment gaps 4–5 stand).
- **The schema is sound on paper and has not been applied.** `test-schema.mjs` passes 23/23 on PGlite, and every plan event has an owner, a sensitivity class and a retention period. But no Supabase migration exists (DATA-001, blocked on SEC-18).
- Consent: boxes A–D are live in `consent.ts`. Tiers T1/T2 (boxes E/F) are correctly absent. No training on photos, faces or minors is planned, and that stays.

**Plan changes**
- PLAN "Data capture" says nothing about events or cost. Add one line: "Every model call writes a ledger row (Postgres, kept after the customer deletes their data, anonymised), and product events go through the first-party collector in `docs/data/tracking-plan.json`. No third-party analytics on creator, proof or cart pages."
- PLAN "Data capture" still says "4–6 curated presets". The code has 26 style ids (`styles.generated.ts`). The plan should point to `docs/design/style-library.json`.
- Agent API purchases were missing from the data plan (fixed below). Orders also need a `purchase_surface` (web or agent) on `payment_succeeded` and `order_created`, so agent orders show up in the CFO mix. This is an envelope change for the collector work.
- `02-architecture.md` puts Metabase ($5–10 a month) at launch. Defer it: at launch volume, one admin-gated internal page reading three SQL views (D1, D6, D10) is enough and costs $0. Owner to decide.
- Move safety events onto the collector's envelope when DATA-002 lands. Until then, add `job_id` and `creation_id` to `SafetyEvent` (IP safety owns the file).

**Scale adjustments**
- **10×:** `FileLedger.totalUsd()` re-reads the whole file on every `assertUnderCap` call, so a book costs O(n²). Keep a running total in memory (pipeline owner). The safety events use `appendFileSync` on the request path; switch them to a buffered async sink.
- **10×:** `analytics.ingest_event` does one function call per row. The collector should send `ingest_events(jsonb[])` batches of about 50. Dedupe is keyed on `(event_id, occurred_at)`, so clients must reuse `occurred_at` when they retry.
- **100×:** `purge_expired()` runs row-by-row `DELETE` on `analytics.events`. Drop whole weekly partitions instead, and keep per-row delete only for subject deletion. Replace hourly materialized-view refreshes with daily rollup tables, and point dashboards only at rollups, never at raw events.
- **100×:** the ledger becomes the largest table (about 18 rows per book). Partition it by month, keep the raw rows for 24 months, and keep the aggregates for as long as they're needed.

**Easy fixes made**
- `docs/data/tools/events-b.mjs`, `docs/data/tools/build-tracking-plan.mjs`: new events `agent_grant_changed` and `agent_tool_called` (tool enum = the 16 real agent tools, decision, reason codes, spend; never arguments), plus new KPI `A4_agent_orders`. `content_report_submitted.report_type` now matches the app (`copyright, likeness, inappropriate, other`).
- Regenerated `docs/data/tracking-plan.json`, `01-tracking-plan.md` and `03b-seed-event-definitions.sql` (95 events, 50 KPIs).
- `docs/data/tools/build-inventory.mjs`, which regenerates `data-inventory.json` and `06-data-governance.md`: added rows `agent_access` and `content_reports`, each with retention and an attorney question.
- `app/app/(shop)/internal/reports/page.tsx`: replaced the stale gating comment (flagged by IP safety).
- The schema test passes 23/23, typecheck is clean, and 481/481 tests pass.

**Blocked by**
- Supabase project (SEC-18) for DATA-001 and DATA-006. Owner decision on a BI host versus an internal page. Attorney wording for consent boxes E/F. Nothing else.

### Model evals
**Built vs. needed**
- **No change to a prompt, model or style can be checked before it ships.** Until today there was no golden set, no rubric, no scorer and no stored baseline. Data roadmap stage 1 (`docs/data/05`) is still entirely unbuilt. The only quality evidence is 10 first-attempt page renders from four dev runs. 5 of the 10 passed QA first time (95% CI 24–76%), and 3 of the 5 re-rolls came from QA bugs that have since been fixed. The cost model's 20% re-roll rate (`pipeline/scripts/cost-report.ts`) rests on that sample. Treat it as a guess.
- **The golden set can't run yet.** The identity stage (`stages/identity.ts`) always asks for "reference photos", and nothing else produces an identity sheet. Neutral, text-described casts (the only kind we may use offline, per legal 06 and data 05) have no path through the pipeline. Needed (pipeline owner): an identity sheet built from text descriptions when `photoIds` is empty, plus a `--golden` CLI mode that writes one ledger per item.
- **Automated QA is not a quality scorer.** It checks the cast count, a white border, text in the image and IP. It does not check consistency with the model sheet, anatomy, hands, teeth, framing or style fidelity, which are the things customers re-roll for. QA verdicts are only logged, not stored, so the pass rate can't be tracked over time. This adds to the fail-open problem IP safety found.
- **The image fallback chain changes quality without telling anyone.** `IMAGE_MODELS` silently falls through to two models we have never measured (all 21 image calls measured were nano-banana-2.1). A 429 storm would put unevaluated art into proofs. Prompts have no version ids (DATA-005), so we can't tell from the ledger which version produced a page.
- **No per-style data.** Every measured run used one legacy style ("watercolor"). None of the 26 styles has a quality score or a cost measured for it, so design and the CFO have nothing per style yet. golden_v0 covers 12 of the 26.

**Plan changes**
- Generation pipeline, add a step 8, "Eval gate": no change to a prompt, model, style string or the chain order merges without a golden-set run, compared with the stored baseline, that is no worse on the hard checks and on human `would_pay` (rubric in `pipeline/evals/golden-v0.json`).
- The "Measured token cost" lines: say that the re-roll rate is unmeasured (n=10) and give a range of 20–50% in the CFO sensitivity, not a single point.
- Risks to watch: add "silent model fallback and model deprecation". Each fallback model needs its own golden baseline, and `model_served` must be logged.
- Data 05 says $15–20 per full golden run. That holds for 40 cards and 8 books. golden_v0 (12 items, 16 pages) is about $2–3 at 2K (estimate). Start there.

**Scale adjustments**
- **10×:** run the golden set on every pipeline-prompt PR. At about $2–3 a run, cap it at about $50 a month and use mock mode for harness-only changes. Human scoring becomes the bottleneck. Calibrate a vision judge (about $0.003 a page) against about 300 labelled pages before it can gate anything.
- **100×:** in production, sample about 2% of pages for the judge (about $0.06 per 1,000 pages, estimate) and track user re-roll rate and first-attempt QA pass by model, style and prompt version. These come free from the ledger once DATA-006 lands. Provider changes: pin model ids, re-run the golden set when OpenRouter announces a deprecation, and keep two baselined fallbacks.

**Easy fixes made**
- `pipeline/evals/golden-v0.json` (new): 12 neutral items (8 cards, 4 books, 16 pages, 12 styles). Invented names, text-described casts, no photos. Stress tags cover a group of 4, pet only, zero cast, babies, glasses, hands, teeth and text zones. Includes the rubric: 4 hard checks, 6 dimensions scored 1–5 (consistency, anatomy, teeth, hands, framing, style fidelity) and `would_pay`.
- `pipeline/evals/score.ts` (new, offline, $0): validates the golden set against `docs/design/style-library.json`, reports first-attempt pass and cost per model and stage with Wilson 95% intervals from `measurements/`, and summarises human score files by config and by style. Spend this session: $0. Pipeline typecheck clean and 35/35 tests pass. App typecheck clean and 481/481 tests pass.

**Blocked by**
- Pipeline owner: a text-only identity path, so the golden set can render. Owner: a dollar cap (about $5) for the first baseline run, and a human scorer.

### Head of CX
**Built vs. needed**
- **A customer with a problem has nowhere to go.** There is no `/help` and no `/contact` (both 404). The footer "Contact", the Accessibility page and the order page's "Ask us about this order" all open `mailto:hello@greethub.example`, a domain that can't receive mail. The 15 help articles in `docs/cx/help-articles/` are not in the product. CX-31 (a help page that renders the articles, a contact form with an order picker, and "Get help with this order") stays S1. It is the cheapest way to cut contact rate.
- **The app still doesn't look ready to trust with a child's photo and $39.** No real art anywhere (CX-01). `[PLACEHOLDER: …]` company and DMCA text shows in every footer, and every legal page has a "Draft placeholder" banner (CX-02). Delivery dates are still worked out in the browser (CX-04). Proof approval is one checkbox with no "seen every page" check and no spelling card (CX-05). There is no cancel button (CX-11).
- **The proof shows a dedication that never prints** (book engineer). A customer approves words that never reach the book, so every one becomes a reprint claim. Until the pipeline prints it, hide it from the proof (CX-44, S1).
- **Orders never reach "delivered"** (shop engineer), so the post-delivery NPS survey, the review ask and the 30-day claim clock never start. CX metrics need the derived delivered date (CX-45).
- **A signed-in "Looks good" on a card still shows the sign-up wall** (card engineer, M3b). For a returning customer this is a dead end (CX-46).
- **The flow itself is sound.** In mock mode, `launch-flow`, `card-flow` and `shop-walk` pass at 1280 and 390 px. After the fixes below, axe on the 14 public pages reports only the footer logotype. That's a WCAG 1.4.3 exemption, and QA should exclude it.

**Plan changes**
- Milestones have no support or help item. Add CX-31 (help and contact), CX-11 (cancel) and CX-34 (error reference codes) to M6. Add CX-05 (proof approval) and CX-44 to M4.
- M7 / done gate: add "a customer can find help from any page and from an order, and the support inbox receives it", plus one moderated usability round (docs/cx/04) with live adapters before real children's photos. QA's e2e can't measure confusion.
- Stop condition: replace "the CMO does a final QA pass" with QA (e2e and axe) plus CX (usability sign-off).
- Product definition: books get 3 page redraws plus 2 free sheet redos, not "a monthly allowance". Help article 07 and the FAQ must say the same (CFO and CMO to confirm the number).
- docs/cx/05-backlog.md now has a dated status block. 00-assessment.md has a re-check section.

**Scale adjustments**
- **10× (about 19k orders a year):** at 15 contacts per 100 orders, that's about 2,900 contacts a year, roughly 30 a day in December (estimate). Help Scout from launch, not month 3. Book the December contractor. Put a holiday cut-off banner on checkout. Self-service tracking, cancel and "fix a name" pages must exist, because "Where is my order?" and "wrong name" are the top two expected reasons.
- **100×:** about 270 contacts a day at peak, so it's a team, not a person. Use a ticket form with an order id and category (no free mailbox) and a reference code on every error. Draft replies with the support agent and have a human approve them. Damage claims go through a reprint flow with a photo upload. Measure contact rate per 100 orders by reason and stage weekly; it's the product's bug report.
- **Metrics:** none of contact rate, CSAT or NPS can be computed today. `support_contact_created`, `survey_responded` and `proof_approved` have no emitter (Head of Data). Ship them with the collector (DATA-002), or the first holiday season goes unmeasured.

**Easy fixes made**
- Skip link and focus target: `app/app/layout.tsx`, `app/app/globals.css`, `app/components/shop/ShopShell.tsx`, `app/app/create/book/page.tsx`, `app/app/create/card/page.tsx`. The cookie notice returns focus to the page: `app/components/shop/CookieNotice.tsx`.
- Branded 404 with header, footer and ways out: `app/app/not-found.tsx` (new).
- Contrast: links, ghost buttons and error hints use persimmon-deep (`app/styles/tokens.css`, `app/styles/components.css`, `app/components/shop/shop.css`). Raw-HTML legal links used `className`, which HTML ignores (`app/app/(shop)/privacy|terms|accessibility/page.tsx`).
- Label matches visible text (WCAG 2.5.3): "Add" buttons (`app/components/creator/BriefCard.tsx`), logo links (`app/components/brand/Logo.tsx`, `Navigation.tsx`, `app/components/shop/ShopNav.tsx`), proof "Back" (`app/components/book/ProofStep.tsx`). The chat log and book step nav can be reached by keyboard (`CardCreator.tsx`, `app/components/book/BookCreator.tsx`).
- Copy: the stale "Mother's Day ships free until May 4" badge is removed (`app/app/page.tsx`); `/browse` has an h1 (`app/components/shop/Browse.tsx`); the card modal's "Make a free account" now opens sign-up (`CardCreator.tsx`); "ZIP code" (`app/components/shop/AddressFields.tsx`); the confirmation shows the order number and never greets by email handle (`app/components/shop/CheckoutPages.tsx`).
- CX-19 remainder (Head of Design decision, 2026-10-13): new token `--gh-control-border: #8C7B6E` (`app/styles/tokens.css`). It now draws the borders of inputs, selects, chips, checkboxes, the switch track, the dropzone, radio cards, the quantity stepper and the style tiles (`app/styles/components.css`, `app/components/shop/shop.css`, `app/components/book/book.css`, `app/components/creator/creator.css`). Twine stays on hairlines and decorative edges. Placeholders and the order timeline's to-do labels are cocoa-70. Also fixed: the legal-page "Draft placeholder" banner had cocoa-70 text on marigold (3.68:1), now cocoa. Typecheck clean, 512/512 tests pass, and `a11y.mjs` reports only the exempt logotype.
- `app/tests/e2e/launch-flow.mjs`: one URL wait now checks the pathname, because `/signup?next=/create/card` matched the old regex. Typecheck clean, 481/481 tests pass, lint clean on the changed files, and launch-flow, card-flow, shop-walk and a11y pass locally in mock mode.

**Blocked by**
- Owner: a real support mailbox and domain, the company legal name and address, and the DMCA agent (CX-02, CX-31); support hours and the refund limits (docs/cx/05, owner asks 3–5). (CX-19 was decided by the Head of Design and is applied.) Supabase (SEC-18) for a contact form that stores tickets. Nothing else for the fixes above.

### Head of Design
**Built vs. needed**
- **Every live card preview tells the model "no people or animals".** `app/lib/intake/pipeline-runner.mjs` calls `guardLines({ characters: [] })`, which adds "COUNT: no people or animals appear in this image" right after a scene such as "bear with soup" or "sleeping fox". The prompt contradicts itself, and character-led looks (Bold Cartoon Pop, the top funny pick) suffer most. Fix (card engineer): pass the brief's cast, or write a card count line that allows the scene's subjects.
- **Nothing sets type on a card front.** `layoutCard` prints the front art only. Hand-Lettered Note is a frame with an empty center ("we set the type"), and it is a top-3 card pick for heartfelt wedding, anniversary, sympathy, Valentine's and thank-you. It would print with no words. Gold & Luxe and Bold Geometric also leave an empty center. Either set a front line in the style's `card.typography` (card engineer), or stop recommending these three until that exists (PM call).
- **The picker matches the library, and the code uses the same strings.** The picker, the Greet Guide chips, the guide's style enum and the pipeline (`styleStringFor`) all read files generated from `docs/design/style-library.json`, and `--check` passes. The gaps are art and evidence, not wiring.
- **15 of 26 styles show only color swatches, including the most-recommended ones.** That includes Friendly Flat Graphic (the top book pick at every reading age), Vintage Storybook, Hand-Lettered Note and Botanical Garden. The 11 real renders appear only in the picker. Home and the 12 template covers are still striped placeholders (CX-01).
- **Consistency ratings drive book picks but are guesses.** The book score weights `bookRating` (×0.9). For all 26 styles that rating comes from one image or is an estimate, and no style has had a two-page character test. Model evals: every measured run used legacy "watercolor".
- **Prompt hygiene.** Each style's `avoid` list never reaches the image model; only `styleString` does. The free white-border QA check will probably false-fail styles with white or cream space (Minimal Line Art, Ink & Wash, Block Print on cream). This is not measured.
- **Brand kit:** tokens, type, radii, buttons and chips match the kit. The deliberate differences are CX's persimmon-deep links and the CX-19 decision below. Template tiles hard-code style labels ("Cozy gouache", "Ink and wash") that differ from the library names. Fix: derive them from `STYLE_NAMES` (`lib/shop/templates.ts`, shop/CMO).

**Plan changes**
- Done: "Data capture" now points to the 26-style library instead of "4–6 curated presets".
- Add a rule: a style is *recommended* only once it has a real sample and a two-page consistency result. Every style stays browsable. Ship with about 10 proven looks leading, not 26 equal ones.
- Adopt model evals' eval gate for style strings, with a cheaper tier: any `styleString` edit needs a per-style smoke run (one sheet plus two pages, about $0.11 at the measured $0.037 per 1K image). A full golden run is for model or chain changes.
- `03-selection-guide.md` section 3 is a hand-pasted snapshot of the scorer and will go stale. Generate it with `build-style-docs.mjs`.
- CX-01: add the 15 missing samples, the re-renders of Storybook Anime and Crayon & Pencil, and the consistency test to M4 as a design task with an owner dollar cap.

**Scale adjustments (10×: about 260 styles, 120 templates)**
- **Picker:** 10 categories can't hold 260 tiles. Add facets (product, mood, age) and search, and keep the recommended 3 on top. `picker.generated.ts` is 26 KB in the client bundle now (about 260 KB at 10×). Serve it per product from a route, or trim the fields it ships.
- **Eval cost:** a two-page smoke test of every style costs about $29 per sweep, multiplied by each model change. Tier the styles: book-eligible, recommended styles get the full consistency test; card-only styles get one sample. Hash each style string into the ledger so only changed styles re-run.
- **Art sourcing:** render each style's sample from one fixed neutral scene per product. Store WebP thumbnails. Generate template covers from each template's own brief, put them through the IP vision check, and keep an approval log (who approved, date, model). Never use customer art.
- **Drift:** `find-style.ts` keeps a hand-written keyword map, although the JSON already has `synonyms`. Generate it from the JSON. More styles bring more alias collisions: today "stitch" (an alias phrase) nearly entered a style string, and the IP test caught it.

**Easy fixes made**
- `docs/design/style-library.json`: Block Print no longer asks for a "framed composition", and Felt & Thread no longer asks for "sewn thread borders" (both fought the FULL-BLEED/no-frame guard). Soft Watercolor's guide no longer asks for a vignette. Regenerated `app/packages/shared/src/styles.generated.ts` (generated output of my tool, outside my folders), `app/lib/intake/knowledge/styles/library.generated.ts` and `docs/design/styles/{block_print,felt_thread,watercolor_wash}.md`. These two strings are unrendered and need a smoke run before launch.
- `app/components/styles/styles.css`: picker section titles use the kit's h3 (20/1.25).
- `docs/design/01-taxonomy.md`: status notes. `docs/PLAN.md`: the "Data capture" line.
- **CX-19, decided (design call):** `--gh-control-border: #8C7B6E` for input, select, chip, checkbox, switch-track and dropzone borders (4.06:1 on white, 3.77 on paper, 3.40 on cream; twine is 1.3–1.6:1, which fails WCAG 1.4.11). Twine stays for hairlines. Placeholders use cocoa-70 (6.1:1 on paper); cocoa-40 is only for disabled or decorative. Not applied: `app/styles/*.css` is outside my folders, so CX/CTO add the token and change one placeholder line, and the CMO notes the kit deviation in `brand/README.md`.
- Typecheck clean; 481/481 tests pass.

**Blocked by**
- Owner: a dollar cap (about $3.50) for the 15 missing samples, 2 re-renders and a two-page consistency test per book style. Until then, picker art and every consistency rating stay estimates. Nothing else for the fixes above.

### CMO
**Built vs. needed**
- **The site sold features that don't exist (fixed below).** FAQ, pricing, the card creator and the account page promised "re-rolls every month"; the account page showed a fake "5 of 5 left this month" bar that nothing counts. The build gives 3 page redraws plus 2 free sheet redos per book, and cards have no signed-in redraw. "Save Grandma once and she looks the same in every card" was false: Saved People holds names only and cards take no photos.
- **A real family was the planned sample.** The copy deck, UX spec, templates and the demo cart used the Eye Story as the hero book. Standing rule 5 forbids real people in samples. Withdrawn. The sample book is now a fictional, text-described family (templates.md section 3).
- **Copy written for the UK, launch in the US.** "Mum" was the first relationship chip, plus a "Mum" template, "postcode", "Couriers", "Personalised" and "fulfilment". Google keywords used "personalised". Fixed in the app and docs.
- **No real art anywhere is still the top brand gap** (CX-01, market/01). templates.md section 3 now lists every launch image (hero pile, 12 covers, sample book, 6 product-in-hand photos, occasion tiles) with spec, IP check and approval log. Under $10 of renders, but it needs an owner cap.
- **Template set doesn't fit a November launch.** One holiday card, no holiday book, and Mother's Day and wedding cards on the home grid. Add a Christmas book, a Hanukkah card and a Thanksgiving thank-you (data only). The occasion list has no Thanksgiving or Hanukkah.
- **Still open, outside my lane:** `[PLACEHOLDER]` footer and DMCA text and `hello@greethub.example` (owner); no "proof ready" email (shop); "Your card comes with you" holds only on the same device (card); "Pay when you're happy with the proof" breaks if SEC-12 (pay before pages render) is approved. Price display is the CFO's call: the mailed card shows $7.99 plus $2.99 postage, while rivals mail free.
- The home page matches the brand-kit hero (tilt pile, "Love, Maya", one persimmon accent). It differs from the UX spec in having no sample-book teaser (no art) and no FAQ strip.

**Plan changes**
- **Re-based Google CPC to the sourced $4.14 (range $2.50–5.50, market/02).** Google CAC rises from $89 to $230. I moved the $6.5k mix: Google $1,500→$800, TikTok $600→$300, creators $1,000→$1,400, SEO $600→$1,200. Blended base CAC is about $70 (guess-on-guess). The CSV now has an `evidence` column saying, for each row, which values are sourced (Google CPC, Meta CPC) and which are guessed (all conversion rates, the other CPCs). **CFO:** finance/README calls the CMO CSV "Sourced"; most of it is guessed. Re-import it.
- **Paid-spend gate added to the marketing plan.** No paid ads until there is real art, the placeholders are gone, the card account path exists, durable caps and Turnstile are live, server-side purchase and UTM events work, and the printer cut-offs are known. If that isn't met by about Nov 20, skip paid holiday spend and start paid in January.
- **Proof points cut to what's true:** "approve the look first", not "consistent"; your words lead the story (an answer to the 2026 AI-book backlash, market/03); privacy. Do not claim we're better than other AI books, and do not claim "no training" until legal confirms vendor ZDR.
- **PLAN "CMO deliverables": "The Eye Story can be the hero sample book"** conflicts with rule 5. Replace with "a fictional sample book". Also add "imagery brief" as a CMO deliverable.
- **If Lulu needs 40 pages minimum for a hardcover (unverified, market/02),** every "24 or 32 pages" line changes. Confirm before producing any creative.

**Scale adjustments**
- **10× (~$65k/mo):** expect CAC to rise 1.3–1.6× (guess); budget by marginal CAC; 20–30 new ads a week from a fixed asset kit of fictional families and product-in-hand photos; incrementality holdouts; trademark registration and consented reviews before the spend goes up.
- **100× (~$650k/mo):** add YouTube/CTV, PR, retail and occasion reminders, and use a media-mix model. December printer, support and model-rate capacity caps what spend can buy. Brand needs a partner/agency guideline (voice, AI labelling, children's-photo rules) and about 120 templates.
- Guest preview cost grows with clicks, not orders. Durable caps come before any scale.

**Easy fixes made**
- App copy: `app/app/(shop)/faq/page.tsx`, `app/app/(shop)/pricing/page.tsx`, `app/app/create/card/CardCreator.tsx`, `app/app/api/account/people/route.ts`, `app/components/shop/Account.tsx` (fake monthly counter replaced with the real per-book line; "fulfillment"), `app/app/page.tsx` (book order and heading), `app/app/layout.tsx` (meta description: cards take no photos), `app/components/shop/AddressFields.tsx`, `app/lib/shop/address.ts` (ZIP code, PO box), `app/app/(shop)/refunds/page.tsx` and `terms/page.tsx` (spelling only), `app/lib/intake/knowledge/styles/recommend-core.ts` (spelling), `app/components/shop/CartView.tsx` (demo book is fictional).
- `app/lib/intake/fields.ts`, `mock-guide.ts`, `live-guide.ts`: "Mum" → "Mom". `app/lib/shop/templates.ts`: "Mom, You Did It"; tile style labels now come from `STYLE_NAMES` (Design ask).
- Tests: `app/tests/intake-mock-guide.test.ts`, `app/tests/e2e/card-flow.mjs` (re-roll matcher). Typecheck clean; 481/481 pass. E2e not run (no dev server up).
- Docs: `docs/cmo/channel-assumptions.csv`, `marketing-plan.md` (new section 10), `site-copy.md`, `templates.md` (new section 3), `ux-spec.md`, `intake-questions.md`.

**Blocked by**
- Owner: a dollar cap (under $10) for template, hero and sample-book art; the support domain and company details for footers and email; ordering physical proofs for product photos. Nothing else for the fixes above.

### Growth
**Built vs. needed**
- **There is nothing for search to rank yet.** No occasion pages, no guides, no blog, and no `docs/growth/` folder. `/browse` filters occasions in client state, so "birthday card", "new baby" and the rest have no URL of their own. The creators are mostly client components, so a crawler sees little text on them.
- **There was no search plumbing (fixed below).** No `sitemap.xml`, no `robots.txt`, no `metadataBase`, no canonical tags, no Open Graph or share image, and no page descriptions except the root one. Every deployment, previews included, could be indexed.
- **There is no keyword evidence anywhere.** Market Intel could not open Keyword Planner, Semrush or Trends (market/00, market/03). The CSV's SEO row (CPC $0.35, CAC $33) is labelled "all guess". The "24 occasion pages" list has no search volumes behind it.
- **Marketing email doesn't exist.** `lib/shop/mail.ts` has only transactional templates (confirmed, shipped, needs attention, magic link, deletion). There is no "proof ready" email, no marketing opt-in at sign-up or guest preview, no place to store consent, no unsubscribe route, no `List-Unsubscribe` header, no suppression list, and the footer postal address is a `[PLACEHOLDER]`. CAN-SPAM (legal/03 s7) needs a postal address and a working opt-out before the first commercial send.
- **Structured data is premature.** Product schema needs real images and final prices. Organization schema needs the legal name. Both are missing. FAQ rich results are limited to a few site types (Google change, Aug 2023, from memory, not re-checked today). I left all JSON-LD out.

**Plan changes**
- **SEO cannot carry holiday 2026.** The plan expects traffic "mostly after day 90". With a November launch, organic search starts to pay around Valentine's and Mother's Day 2027. Christmas has to come from creators, Pinterest and email. Publish the Valentine's and Mother's Day pages by early December so they are indexed in time.
- **The SEO budget rises from $600 to $1,200 a month on guesses.** Before any spend, pull Keyword Planner volumes (owner export) and connect Search Console on launch day. Then rank the pages by volume × intent × whether a template exists. Every traffic estimate stays labelled until then.
- **Start with 12 good pages, not 24 thin ones.** Order: Christmas card, Christmas book, Hanukkah card, Thanksgiving thank-you, birthday card for Mom, Grandma and kids, new baby book, Valentine's, Mother's Day, sympathy (SEO only, no remarketing), and teacher thank-you. Each page gets a server-rendered occasion route with real sample art, message ideas, a starter link into `/create/card?template=` and an FAQ.
- **The welcome series promises "how re-rolls work".** Re-rolls no longer exist in that form (CMO). Replace that email with "how the proof works". Add "proof ready" to the transactional set (shop) with no promotion in it.
- **Add an email-consent milestone before any commercial send:** opt-in checkbox at sign-up and guest preview, a consent record, a one-click unsubscribe route and header, Resend suppression, and the postal address in the footer.
- **Occasion reminders store recipients' birthdays,** often children's. Data and legal should classify that field before reminders are built.

**Scale adjustments**
- **10× pages (~120):** generate them from one typed occasion × relationship data file and one page template, with `generateStaticParams` and the sitemap built from the same file. Each page needs its own art and message ideas, or it is a thin doorway page (Google's scaled-content spam policy). Run an editorial checklist plus the IP screen on every page.
- **100× pages:** use `generateSitemaps` past 50k URLs (not soon). Prune pages with no impressions after 6 months. Keep a style and voice linter in CI.
- **Email at 10×–100×:** send marketing from its own subdomain, away from magic links and receipts, with SPF, DKIM and DMARC. Bulk senders must offer one-click unsubscribe (RFC 8058) under Gmail/Yahoo rules (not re-checked today). Warm the domain up before the holidays. Send through a queue with an idempotency key, use one shared suppression list, and watch complaint rates weekly.
- **Content ops:** one writer drafts, CMO voice review, a legal check on health and sympathy pages, and a Wednesday publish slot (marketing plan s6).

**Easy fixes made**
- `app/lib/seo.ts` (new): site URL from `NEXT_PUBLIC_SITE_URL` or the Vercel production host, indexable only when `VERCEL_ENV=production`, a list of indexable pages, and `pageMetadata()` (canonical, OG, Twitter, share image).
- `app/app/robots.ts` and `app/app/sitemap.ts` (new): production allows public pages and blocks `/api/`, `/internal/`, account, cart, checkout and orders. Every other deployment blocks all crawling. The sitemap lists 6 public pages. Legal pages stay out while their draft banners are up.
- `app/app/opengraph-image.tsx` (new): a type-only brand share image, 1200×630, with no people and no AI art.
- `app/app/layout.tsx`: `metadataBase`, OG and Twitter defaults, and noindex outside production.
- Canonicals and descriptions: `app/app/page.tsx`, `app/app/(shop)/browse|faq|pricing/page.tsx`, `app/app/create/card/page.tsx`, `app/app/create/book/page.tsx`.
- noindex: `app/app/(shop)/login|signup|cart|orders|checkout/page.tsx` and `app/app/(shop)/account/layout.tsx`.
- `app/tests/seo.test.ts` (4 tests). Typecheck clean; 485/485 tests pass. `next build` passed in a scratch copy, and `next start` showed robots, sitemap, canonicals and `og:image` on each page.

**Blocked by**
- Owner: the production domain (set as `NEXT_PUBLIC_SITE_URL`, since canonicals depend on it), Search Console verification, and a Keyword Planner export. Owner cap for real art (CMO), because occasion pages and ad briefs need it. Supabase (SEC-18) to store email consent. Nothing else for the fixes above.

### Social & partnerships
**Built vs. needed**
- **No social or creator plan existed.** No `docs/social/`; the creator program was four bullets in the marketing plan. Added a channel playbook and a program spec (below).
- **Creator sales can't be tracked or paid.** No promo-code field, no code table, no discount in `computeTotals()`, no `ref`/UTM capture (DATA-003), no partner on the order, no payout view. **Do not switch on Stripe promotion codes as a shortcut:** the webhook compares Stripe's pre-tax total with our cart total (`orderService.ts`), so every discounted order would be a mismatch and never print.
- **No share flow, and that is mostly right.** Proofs and previews show children's likenesses, so no public share page should exist for a creation. Growth's OG image covers link shares. A shareable "made with GreetHub" page needs a design that hides faces and names (later, owner and legal).
- **Pinterest:** Rich Pins need product pages with price metadata and real images; neither exists. No save button (don't load pinit.js; a plain link helper is built). Private pages were pinnable (fixed below).
- **Creators can't be shown anything yet:** no real art, no physical proof, and the seeding pitch is the product itself.

**Plan changes**
- Marketing plan s5 says "seed 20 creators pre-launch". The paid-spend gate also blocks seeding, and a book seeded after about Nov 10 can't be made, posted and seen before the Christmas cut-off. Plan the first creator wave for Valentine's unless the gate clears by Nov 10.
- CFO: creators are modelled as a $1.20 CPC. Model them as fixed (gifted book about $20 COGS each, plus fees) plus per-order (10% off + 10% commission). After both, a 24-page book keeps about $14 CM and a mailed card about $2.93. $1,320 of gifts and fees a month needs about 94 creator book orders to pay back.
- Pinterest should lead holiday organic. SEO pays from about Feb 2027 (Growth), and Pinterest's 6-8 week planning window still fits Christmas if the boards start now with type-only message pins.
- Add to M6 or v1.1: promo codes in our cart, partner attribution, and a release register. Referral ("give a card, get a card") uses the same code table, so build them once.
- Proposed policy: paid ads never use a child's real face, even with a release.

**Scale adjustments**
- **10× (about 200 partners, 30+ posts a week):** spreadsheets break. Need the code table, automated attribution, monthly payouts with 30-day clawbacks, scheduled disclosure checks and a release register with expiry dates. Comment moderation needs a written policy (remove a child's name, school or location; send order questions to support).
- **100× (about 2,000 partners):** an affiliate platform (owner cost decision), fraud rules (self-referral, coupon-site leakage), tiered commission and a partner manager. Released creator posts become the main ad supply, so 72-hour takedowns must work across every live ad.
- Community: no open group until support and moderation exist. Start with an opt-in email list (needs consent storage).

**Easy fixes made**
- `app/lib/seo.ts`: `NO_PIN` and a `noPin` option on `pageMetadata()` (`<meta name="pinterest" content="nopin">`, per Pinterest help, read 2026-10-12). Applied to `app/app/create/book/page.tsx`, `app/app/create/card/page.tsx`, `app/app/(shop)/account/layout.tsx`, and the `orders`, `cart` and `checkout` pages.
- `app/lib/social.ts` (new): `trackedLink()` (UTM plus `ref`, slug-only codes) and `pinterestSaveUrl()` (no third-party script). `app/tests/social.test.ts` (5 tests).
- `docs/social/01-channel-playbook.md`, `docs/social/02-creator-affiliate-program.md` (new): rules, 90-day calendar, offer and payout math, FTC disclosure (FTC "Disclosures 101", read 2026-10-12), children and release rules, outreach script.
- Typecheck clean. 490/490 tests pass (one unexplained failure on the first run, not repeated in 4 runs).

**Blocked by**
- Nothing for the fixes above. Owner: real art and a physical proof before any outreach; the attorney for the creator contract, release and terms page; the accountant on 1099 treatment of gifts and commissions; the CFO to confirm the 10%/10% offer.

### Customer research
**Built vs. needed**
- **The riskiest assumption can't be tested before launch.** Likeness acceptance (A1: a parent accepts the AI drawing of their own child) needs a real child's photo, which sessions forbid. The only pre-launch proxy is an optional adult self-photo arm (attorney first). Plan for the first 100 paid books to answer it: sheet redo reasons, proof rating and art CSAT must be captured from day one.
- **Nothing in the app collects customer feedback.** No survey page or email, no thumbs or star widget, no review page, no testimonial consent, no research opt-in, no ticket store for support CSAT. The only signal is the book sheet verdict, kept in the project file and never emitted. On top of the known blockers (no "delivered", 4 of 95 events).
- **The tracking plan can't compute the CX targets as written.** There is no `survey_sent`, so the 25% response-rate target has no denominator. `survey_responded.nps` is required, so a CSAT-only or "didn't arrive" answer can't be logged. No `review_submitted`; `consent_changed` lacks `wording_version`.
- **Post-delivery NPS at delivered + 5 days is wrong for gifts.** A Christmas book delivered Dec 10 gets surveyed Dec 15, still wrapped. The brief stores no occasion date. Fix: survey at the later of delivered + 5 days and occasion + 2 days, with "Not given it yet? Ask me later" (docs/research/04).
- **Other unvalidated assumptions, ranked:** photo trust for a no-review brand (A2), price of $39–55 book and $10.98 card (A3, no WTP evidence), customers catching a misspelled name in the proof (A4), the 5–15 min wait with a "proof ready" email that doesn't exist (A5), the guest-to-account wall (A6), grandparents on tablets (A7). Register in `docs/research/README.md`.
- **No research instruments existed.** No screener, consent form, interview guide or findings template (now written, below). No recruiting path after launch.

**Plan changes**
- **Usability round 1: yes, before launch and before Christmas, but not on today's build.** Today it would rediscover known S1s (no art, help 404, one-checkbox proof, signed-in card dead end). Entry criteria: a preview with Supabase, Stripe test and printer sandbox; live images under an owner cap of about $15; real sample art; CX-05, CX-31 and CX-46 merged; a test inbox; a seeded-flaw fixture. Target: pilot by Oct 30, sessions by Nov 6, S1 retest by Nov 13. If it slips past Nov 6, invite-only soft launch and run the round in January (fits the CMO's paid-spend gate).
- **Run 5–8 assumption interviews now** (`docs/research/06`). They need no build and test A2, A3 and A8 while engineering catches up. Owner recruits.
- **cx/04: replace "stock photos of children" with a fictional, text-generated photo kit** (rule 5; stock licences may bar AI processing, unverified). Notes go in `docs/research/findings/`, not `docs/cx/research/`. US spelling. Full list in `docs/research/01` s2.
- **market/01's "20–30 sessions" fit test should not be a usability round.** Five sessions find problems; fit (likeness, WTP) comes from interviews plus the first paid cohort's metrics.
- **M7:** add "usability round 1 passed (cx/04 s6) or the owner signs a documented waiver" next to QA's STRICT e2e.
- **Data:** add `survey_sent`, make `nps` optional, add `survey_type` and `gift_given`, add `review_submitted`, and add `wording_version` to `consent_changed`.

**Scale adjustments**
- **Now (about 160 orders a month):** survey every delivered order, read every free-text answer, report NPS only at n ≥ 50 with an interval (about 200 delivered orders, so the holiday cohort reports in January). Panel recruiting; spreadsheets are fine.
- **10×:** build our own panel from the research opt-in (RES-4) to cut panel fees. One 5-person round per major release, per segment. A shared tag taxonomy with support. Owner decides on a research repository or unmoderated-testing tool. Enforce one research contact per person per 6 months.
- **100×:** sample NPS (about 20% of delivered orders, stratified by product, style and channel) instead of surveying everyone. Weekly NPS and CSAT with intervals by cohort. Model-assisted coding of free text only with a DPA and ZDR, checked against a human sample. A dedicated researcher, an incentive payout process (1099s, accountant), and accessibility quotas in every round.

**Easy fixes made**
- New `docs/research/`: `README.md` (rules, assumptions register, tickets RES-1 to RES-6 for the CX backlog), `01-usability-round-1.md` (run sheet, entry criteria, dates, photo kit, seeded flaw, task cards), `02-screener.md` (plus research opt-in wording), `03-participant-consent.md` (draft, attorney questions), `04-surveys-nps-csat.md` (instruments, gift timing, build and event gaps), `05-testimonial-consent.md` (draft, consent record, attorney questions), `06-interview-guide.md`, `07-findings-template.md`.
- No app code changed, so typecheck and tests were not run. Not committed (per the task).

**Blocked by**
- Running any study: Supabase (SEC-18), CX-01/05/31/46 and a preview test inbox; the owner to recruit, approve incentives (about $400–500) and set an image cap (about $15, plus about $0.30 for the photo kit); the attorney to review the consent and testimonial wording. Nothing for the docs above.

### Market intel
**Built vs. needed**
- **The book fight is with Imagitime, and today we lose on everything a buyer can see except price.** Imagitime: same 8.5×8.5 hardcover, free whole-book preview in about 2 minutes, about 3,640 Trustpilot reviews at 4.8, $64.98 all-in, 8–13 days (market/00, read 2026-10-11). We have no real art, 10–15 minute renders behind an account and two consent boxes, zero reviews, and no printer-backed date. Our $44.99 all-in ($20 less) is the only claim we can make honestly today.
- **The card has no competitive edge as built.** Cards take no photos, so it is a brief-to-illustration card at $10.98 mailed against Cardwise's AI cards at $6.99 mailed and Hallmark's free Sign & Send. Signed-in users can't finish a card, and 3 card styles print with an empty front. Treat the free guest preview as the book funnel, not as a revenue line.
- **The one structural differentiator in market/01, one likeness reused across cards and books, isn't built.** Saved People holds names only (CMO). Before launch, every moat candidate is either unbuilt (Saved People, reminders) or unearned (reviews, gallery).
- **Gaps ranked by competitive cost:** (1) real sample art and a gallery (CX-01); (2) a fast first look: show the approved character sheet within minutes, pages later, to answer Imagitime's 2-minute preview; (3) a printer-backed "arrive by". Code defaults to 7 days, faster than every rival measured (8–13), and holiday lateness is Wonderbly's top 1-star theme; (4) first-order promo codes (every rival runs 10–50% codes; Social found that Stripe codes break the amount check); (5) saved-likeness reuse in cards.
- **What is real and built:** the 90-day photo purge (versus Imagitime's 12-month retention), approval before print, and honest AI labelling. Usable in copy once legal approves the wording.

**Plan changes**
- **Lulu 24pp is confirmed.** Lulu lists "Casewrap: 24–800 pages" (help.lulu.com article 64000255583, read 2026-10-12). The 40-page figure is the paperback minimum. Drop the CMO's "if Lulu needs 40 pages" caveat. The unit cost still needs a sandbox quote.
- **Competitor research is not stale** (read 2026-10-11). I made no price refresh. Add a Black Friday promo check on about 2026-11-01, ahead of the 2026-11-10 report, plus competitors' Christmas cut-off dates, which we have not collected.
- **Product definition:** say plainly that v1 cards are illustrated from the brief with no photos. Position the book first (grandparent or parent gift) and the card as funnel and add-on.
- **SEC-12 (pay before pages render) has a market cost.** Every photo-book rival previews before payment. If it's adopted, keep a free character-sheet approval before payment so we still match them (PM/CFO).
- **Pricing (CFO, not changed here):** the v2 Market-adjusted scenario (card $8.99 postage included, digital book $14.99) is off by default, and the app still charges $10.98 and $19.99. $14.99 is still above the free-to-$15 digital band. Bundle it or price it at $9.99 or less. The $8.99 Express surcharge has no benchmark yet.
- **Fit test (market/01):** interviews plus the first 100 paid books, not a 20–30-session usability round (in line with Customer research). Confidence stays at about 35–40%, conditional on real art and preview speed.

**Scale adjustments**
- **10× (about 1,600 orders a month):** still invisible to incumbents. The pressure is Q4 codes (25–50%) and Imagitime cutting shipping, which would close most of our $20 gap. Plan a first-order offer (CFO) and build the moat early: saved likenesses reused in cards, occasion reminders, review collection from the first delivered order.
- **100× (about 16k a month):** visible. Wonderbly (owned by Penguin Random House), Shutterfly or Gemini Storybook can add photo likeness or print cheaply, and falling model costs make likeness table stakes. Win on trust assets (reviews, gallery, privacy record), print cost (Lulu volume pricing, second printer) and retention data. Book COGS of about $20 (Social) leaves about $20 of room in a price war. Don't start one.
- **Watch list for monthly reports:** Gemini print ordering, Imagitime price or AI-preview changes, any cross-product (card plus book) likeness entrant, and the AI-assistant (MCP) card channel. I have not researched competitors there yet.

**Easy fixes made**
- `docs/market/00-landscape.md`: added a build reality check (no-photo cards, Saved People names only, 7-day default, Lulu 24pp confirmed).
- `docs/market/01-positioning-and-advantage.md`: corrections note; Saved People row downgraded; Lulu risk, fit-test row and moves 2 and 3 updated.
- `docs/market/02-pricing-and-economics-benchmark.md`: status note (code and CFO v2 checked, Express and 7-day items flagged); Lulu item 6 resolved.
- `docs/market/03-monthly-report-2026-10.md`: new section 9a with corrections.
- `docs/market/scorecard.csv`: 4 rows (Lulu page range and square hardcover; GreetHub Express surcharge and 7-day default).

**Blocked by**
- Nothing for the fixes above. Owner: about $200 for competitor books (Imagitime, Wonderbly) plus our own physical proof, to judge likeness and print side by side. Keyword Planner and Meta Ad Library access for search and ad signals. Neither blocks this assessment.

### CFO
**Built vs. needed**
- **The business does not make money on paid acquisition, at any scale.** Paid CAC is about $70 (CMO csv, mostly guesses) against an LTV of $26 ($15.20 contribution per order × 1.7 orders). Each paid customer loses about $44. Base case: no break-even in 36 months, month-36 cash -$267k, peak funding need $297k. With $0 paid it breaks even in month 24 (peak need $134k). Of the base loss, $107k is launch engineering costed as cash at $600 a day.
- **The app's prices match the model** (`app/packages/shared/src/pricing.ts` = Inputs section 6: $3.99, $7.99 + $2.99, $19.99, $39 + $5.99, $49 + $5.99). Two gaps: Express ($8.99 per order) is on at checkout but has no cost in the model and no printer quote, so its margin is unknown. And `earliestDeliveryDays: 7` is unbacked.
- **Every printer cost is still my estimate** (Lulu $12.50 / $14.50 per book, Prodigi $3.25 per card, shipping $1.60–6.00). Print and shipping are about 83% of a book's variable cost and tokens about 6%. A sandbox quote matters more than any model-cost work.
- **The only measured numbers are the per-call model prices** (n=43 calls, 4 dev runs). The re-roll rate (n=10), all funnel rates, mix, repeat, refunds and every CTR and conversion are guesses. There is no production cost ledger to check against after launch (Head of Data).
- **The re-roll input did nothing at 2K** (the CTO totals had 20% built in). Fixed in v3. At 50%, cash falls only $2.7k over 36 months, so the re-roll rate is not a driver.
- **Unpaid renders:** if every abandoned book is fully rendered (today's build), cash falls $9.5k over 36 months. That is small next to the conversion cost of SEC-12. The risk is abuse: there's no per-account cap. Recommend a cap of 2 active unpaid books per account plus the global ledger (SEC-10) over pay-before-render, and keep the free character sheet.

**Plan changes**
- **Price recommendations (owner approval; app not changed):** books +$5 ($44 / $54 + $5.99), worth +$19k over 36 months. Mailed card $8.99 with postage included, to match rivals who mail free (-$7k). Digital book $9.99 or bundled (-$8k; the model has no elasticity, so this shows margin only). Express off until a printer quote exists.
- **Creators:** I confirm 10% off + 10% commission for tier-2 affiliates, which pay out only on sales: about $4.91 per order, leaving $10.29 contribution on a first order. Cap seeding gifts at about $500 a month until tracked results exist. The all-in creator CAC is about $99, which doesn't pay back on the CSV's conversion guesses.
- **Book redraws:** 3 page redraws plus 2 sheet redos cost at most about $0.33 per book (measured per-call prices). That's affordable. Use it in place of "monthly allowance".
- **CFO deliverable section:** add "every input labelled measured / sourced / estimate / guess, with n", plus a pricing-sync check between Inputs section 6 and `pricing.ts`.
- **Spend gate (CMO):** endorse it. Recommended launch plan: $0–2k a month of paid spend (SEO and affiliates), agent-built engineering (25% cash), and the price changes above. That gives break-even in month 24 with a peak need of about $54k at $0 paid, or no break-even and a peak need of about $95k at $2k a month.

**Scale adjustments**
- **10× / 100× paid spend** (CPC 1.45× / 2×): month-36 cash -$1.6M / -$14.5M. Don't scale paid spend until measured CAC is below about $26, or LTV rises (book mix, repeat, reminders).
- **10× organic demand at $0 paid:** break-even in month 6, month-36 cash +$327k (+$388k with a 15% print discount, guessed). Fixed costs are small, so margin comes from print price and organic, referral and repeat volume.
- Print: Lulu volume or enterprise pricing for unique one-off books was not found. Ask Lulu and quote a second printer before 10×. Models: halving image cost adds about $0.50 per book. It doesn't change the answer.
- Support at $0.90 per order buys about 100 hours a month per 2,500 orders (about 0.6 FTE at $22.50/h). That is enough for 15 contacts per 100 orders at about 10 minutes each, with no December peak buffer. Fulfillment ops needs a part-time person at 10× and a team plus a second printer at 100×. Tax: an accountant before 10× (nexus, 1099s for creators).

**Easy fixes made**
- `finance/GreetHub_Financial_Model_v3.xlsx` (new, current): CMO CSV re-imported with an evidence column; creators modelled as fixed plus per-order; re-roll input wired into the measured token totals and labelled GUESS (n=10). Recalculated: 8,811 formulas, 0 errors. The original and v2 are untouched (lock file present, probably stale).
- `finance/README.md`: v3 section and scenario table; the CMO CSV is no longer called "Sourced"; evidence labels corrected.

**Blocked by**
- Nothing for the fixes above. Owner: approve prices, the creator offer and the gifting cap; get Lulu and Prodigi sandbox quotes (including Express); decide whether launch engineering is paid cash or agent-built; delete the stale lock and promote v3.

### Finance ops
**Built vs. needed**
- **The order record could not support the books.** Stripe's collected tax was checked and then thrown away, so every order stored tax 0 and a pre-tax "Total paid" (`PRICING.taxRate` is 0). Fixed below. Still missing per order: the Stripe fee and charge id (`balance_transaction`), refunds and disputes (webhooks ignored), the printer's cost per line (the adapters store none; whether Lulu and Prodigi return it is not verified), a discount or creator field, and a delivered date.
- **No payout mapping, no export.** Nothing reads payouts or balance transactions, and there is no admin export of orders for a period. Every reconciliation step is a manual Stripe export plus reading a JSON file. Workable for launch month only.
- **COGS per order can't be built yet.** Model cost needs the durable ledger (Head of Data); print cost needs printer invoices matched on `fulfillment.externalId`. Until then, split OpenRouter usage by allocation and label it that way.
- **The tax address is wrong for gifts.** Ship-to addresses are not sent to Stripe (CTO), and one order can ship to several states. Lines carry no product tax code, so digital and printed goods get the same treatment, against legal/03.

**Plan changes**
- Architecture, Payments line: add "store charged total, tax, fee, charge id and refunds per order; one Stripe line per destination with a product tax code". Add the refund and dispute events to M5 (shop engineer already asked).
- Sales tax: legal/03 says "register in the home state before launch". That is an owner ask with the accountant, before the first live sale, not a build step. Stripe Tax collects only where you've registered. Turn it on in live mode only after registration, or it collects nothing.
- Chart of accounts: the model counts postage as SKU revenue and the Stripe Tax fee as opex. The books keep postage (4100) and the Tax fee (5105) separate because states tax shipping differently. The mapping to Forecast rows is in the chart file.
- CFO "Not modelled: sales tax (pass-through)": correct, but add the working-capital timing of collected tax and of payouts (2 to 7 days, not verified for this account) once actuals exist.

**Scale adjustments**
- **10×:** about 1,600 orders a month crosses 200 transactions in several states within a holiday month. Register ahead in the top states on the accountant's advice. Automate matching (charges↔orders, printer jobs↔lines, payouts↔bank) as a script with an exceptions list. Close by business day 5. Bookkeeper monthly.
- **100×:** accounting system plus a Stripe connector and bank feed, automated filing (Stripe Tax Complete or a filing service), and accrual revenue at shipment from per-line dates. The ledger and order tables need monthly partitions. Close by business day 3.
- Creators at 10×: a commission payable (2300) with 30-day clawbacks and W-9s on file before the first payout (1099 questions 17–20).

**Easy fixes made**
- `app/lib/shop/orderService.ts`: new `chargedTotals()`; orders store Stripe's charged total and tax. `app/tests/shop/checkout-flow.test.ts`: the tax case now asserts them. Typecheck clean; 490/490 tests pass.
- `finance/ops/` (new): `README.md` (data gaps by owner), `chart-of-accounts.csv`, `monthly-close-checklist.md` (Stripe, Lulu, Prodigi, OpenRouter, Vercel and other reconciliations, accountant pack), `actuals-vs-model-template.csv` (mapped to v3 Forecast rows), `accountant-questions.md` (24 questions: nexus, tax codes, sourcing, basis, 1099s).

**Blocked by**
- Nothing for the fixes above. Owner: choose an accountant and send `finance/ops/accountant-questions.md`; register for sales tax in the home state before the first live sale; resale certificates to Lulu and Prodigi; business bank account; Stripe live keys. Real reconciliation needs Supabase (SEC-18) and the first live month of data.

### Board director (equity)
**Built vs. needed**
- **Approval was not tied to identity.** The dashboard's "Acting as" picker let any viewer log as one partner and approve as another, so the "a different partner approves" rule held only in the UI. Fixed for linked viewers (below). Partners still need `people.userId` set before real use, and the database itself does not enforce who may write (append-only audit is by convention only).
- **Paid work and repaid cash were counted in full.** The module had no way to net cash pay against time or repayments against cash; the policy already said "repaid amounts are removed". Fixed: `paidAmount` and `reimbursed`. Moyer's own rule for partly paid time was not found on slicingpie.com (read 2026-10-12); flagged for the handbook and attorney.
- **Math matches the spec** (worked examples 1 to 5 reproduce). Gaps: NaN hours or amounts were summed silently; idea awards were dated at proposal, not adoption; duplicate ids passed. All fixed. Still open: one rate per person (no versioned rates), leaver rules rewrite past history, and the dashboard ignores the `config` collection.
- **The dashboard embeds a hand copy of the module.** Now checked by a test; the published artifact (claude.ai/artifact/By1Wz9YD82PDoyv39EBVDp) still runs the old copy until republished.
- **Agent-built work earns nothing.** The CFO's $600/day engineering value must never become anyone's hours; only a human's own directing and review time counts. Model and tool bills a partner pays personally are cash at 4x.
- **The $54k peak need decides the split.** Partner-funded at 4x it is up to $216k of slices, likely more than all founder time logged in year one. Outside money is a trigger event (freeze), not a pie entry. Owner and attorney decision (questions 11 to 14 added).

**Plan changes**
- PLAN.md has no equity section. Add one under Agent organization: "Human partners earn dynamic equity (docs/equity/); agents never do; split freezes at the first outside financing, profit distribution or sale."
- Things you'll need to supply: add partner names, `userId` links, fair-market rates, the signed contribution policy and the decision on how the $54k is funded.
- CFO model: launch engineering costed as cash should be split into (a) cash actually paid, (b) agent cost and (c) human hours, so the pie and the model use the same facts.
- docs/equity: spec section 9 (agent work and funding) and section 10 (known limits) added; schema now lists the new fields and marks `config` as planned.

**Scale adjustments**
- **10x contributors:** a free-form database with one approver is not enough. Need per-partner sign-in links, role rules (only the owner sets rates and leaver status), an enforced append-only audit, and monthly dated snapshots of the split signed off by all partners.
- **10x funding:** any outside round freezes the pie. Before talking to investors, have the attorney fix the conversion formula and produce a frozen, audited ledger export. Investors get a priced instrument, not slices.
- **10x time:** versioned rates (rate changes apply forward only), evidence links on time entries (commits, session ids) and a monthly approval batch instead of entry-by-entry.
- **Vesting:** after the freeze, Slicing Pie stops applying. Converted shares need ordinary vesting or repurchase terms (attorney question 14).

**Easy fixes made**
- `app/lib/equity/index.ts`: `paidAmount` and `reimbursed` netting, finite-number guards, duplicate-id warnings, idea `unlockedDate`.
- `app/tests/equity/equity.test.ts` (+4 tests), `app/tests/equity/dashboard-sync.test.ts` (new drift guard).
- `docs/equity/dashboard.html`: calc block regenerated from the module; linked viewers locked to their own partner; audit records viewer id; adopt or ship sets `unlockedDate`. Not republished.
- `docs/equity/01-model-spec.md`, `03-data-schema.md`, `04-contribution-policy.md`, `05-attorney-accountant-questions.md`.
- Equity tests 15/15; typecheck clean; full suite 495/495 (490 baseline + 5 new); eslint clean on equity files.

**Blocked by**
- Nothing for the fixes above. Owner: name partners and link their user ids, set rates, decide how the $54k is funded, take questions 11 to 14 to the attorney, approve republishing the dashboard.

### Fulfillment
**Built vs. needed**
- **No real order can print, and ops would not know.** On top of the known blockers (`printAssets()`, Lulu cover wrap, card SKU, no "delivered"), nothing retries a failed submit, though the order page says "We'll try again". The needs-attention email tells the customer to "open your order" to sort it out, but the customer can't fix a printer failure (Shop/CX to reword). Until today there was no way to see stuck or late orders (added below).
- **Remedy flow is all manual.** There is no reprint, refund, cancel or address-change action in code, no delay-notice email, and no one-click cancel-and-refund link (FTC Mail Order Rule, legal/03 s3). A reprint needs a new external id (`-R1`), or it can collide with the original. The 90-day purge keeps print files, but account deletion removes them, and files sit on local disk until SEC-18.
- **Preflight is "is there a URL".** No size, page count, resolution, safe-area, IP verdict or proof-text check runs before submit. Lulu's validation endpoints are a TODO. Checklist: `docs/ops/02`.
- **Address checks are format only** (ZIP pattern, no PO boxes, US only). No deliverability check, and no Alaska/Hawaii transit handling. Wrong-address fixes depend on Lulu's 120-minute hold; Prodigi's edit window is not verified.
- **No vendor data at all.** Cost, production days, defect and lost rates are all model guesses. Per-line shipped and delivered dates and printer cost are not stored. Scorecard: `docs/ops/04`.
- **Prodigi may print outside the US** (not found either way). If it does, every card date and the $2.99 postage line are wrong. Settle this with the card SKU.

**Plan changes**
- **Christmas 2026 order-by dates (proposed, owner approves):** book standard Dec 2, express Dec 3; card standard Dec 10, express Dec 11. Derived from USPS 2026 send-by dates (Dec 17 Ground Advantage, Dec 18 Priority, read 2026-10-12), Lulu Q4 production of 5–8 business days, and a safety margin (`docs/ops/03`).
- **Readiness gate:** if the sandbox runs plus a physical proof aren't done by Nov 13 (books) or Nov 20 (cards), don't promise Christmas delivery. Push the digital book and e-card as the after-cut-off gift. The cut-off banner turns on Nov 15, from the one config.
- Express buys about 1 day in December because production, not transit, is the bottleneck. Keep it off for the holiday (this agrees with the CFO).
- M6 should add the exception list plus alerts, a delay-notice email, reprint and cancel actions, per-line shipped and delivered timestamps, and printer cost per line. "Printer sandboxes" in the definition of done should mean the 7-step routine in `docs/ops/02`, not one submit.
- Set the policy's lost threshold "[N] days" (proposed: tracking stalled 7 business days, or 10 business days past the estimate).

**Scale adjustments**
- **10× (~1,600 orders a month, ~5k in December):** the exception list must alert, not wait to be polled. Expect 5–10 exceptions a day at peak (4% reprint guess plus late orders). That needs a part-time ops person in December, reprint, refund and cancel buttons, and a nightly printer-cost reconciliation. Ask Lulu about Q4 capacity and account management before committing volume.
- **100×:** a single printer per product is a single point of failure in December. Qualify Gelato for cards (adapter slot exists) and pick a second book printer by sandbox plus physical proof before the season, with per-SKU routing and automatic failover on rejection or backlog. Address verification (USPS or vendor API) pays for itself at this volume. International shipping changes everything: carrier dates, customs, VAT/GST and printer routing. Keep it US-only until a second printer with local labs exists.

**Easy fixes made**
- `app/lib/shop/fulfillmentOps.ts` (new): holiday cut-off config and derivation; stuck/late/lost/rejected exception detector (ids only, no customer data).
- `app/app/api/admin/orders/exceptions/route.ts` (new): read-only list behind the existing admin gate.
- `app/tests/shop/fulfillment-ops.test.ts` (new, 8 tests). Typecheck clean; 503/503 tests pass; eslint clean on the new files.
- `docs/ops/README.md`, `01-order-exception-playbook.md`, `02-preflight-and-sandbox.md`, `03-holiday-cutoffs-2026.md`, `04-vendor-tracking.md` (new).

**Blocked by**
- Owner: Lulu and Prodigi sandbox keys (quotes, shipping tiers, SKU, where cards print); a physical proof of each product; approval of the cut-off dates and the lost threshold. Engineering: `printAssets` plus storage (SEC-18) before any real print test.

### Support
**Built vs. needed**
- **Support can promise but not act.** No admin order lookup (only the ids-only exceptions list), no refund call in the Stripe adapter, no cancel, reprint, address-change or status-override action, no redraw top-up (3 per book is a constant). Every remedy within the $60 agent limit still needs the owner in the Stripe and printer dashboards, and the order status then stays wrong. Minimum before launch: lookup by email or order id with timeline, plus refund, cancel and reprint (`-R1`) buttons with an audit log (docs/cx/02 s11).
- **The cancel window the policy promises doesn't exist in practice.** The order is submitted to the printer inside the Stripe webhook, so it shows "Preparing" seconds after paying. "Cancel until the status says In production" names a status that doesn't exist. The only real window is the printer's hold (Lulu about 120 min; Prodigi unverified). Name-misspelled and cancel tickets (the top two after "where is it") hinge on this. CX's 60-minute undo window before submit (03 s2.6) is the fix.
- **Seven macros and eight help articles promised things nobody can do** (redraw top-ups, "I've paused your order", support sending a delete link, a proof spelling check, a printing dedication, a Cancel button, "monthly" redraws). Fixed below; macros 5, 13 and 16 still depend on the manual printer window.
- **The needs-attention email told customers to fix printer failures and showed raw vendor text.** Fixed below. The order page line note still shows `v.problems` (vendor text) to the customer (shop to replace with a plain line).
- **Replies go nowhere.** The confirmation email says "just reply", but there is no reply-to and `EMAIL_FROM` defaults to `hello@example.com`. With no mailbox, the draft-and-approve loop has no input at all.

**Plan changes**
- docs/legal/05 Refund & Reprint: replace "until the status says In production" with the real cut point once the undo window or printer hold is decided (attorney and owner). Help articles 13 and 14 now say "email us fast" in the meantime.
- docs/cx/02 s5: redraw top-up removed from goodwill (no tool). If the owner wants it, the book engineer adds a per-project redraw override for admins.
- docs/cx/02 s10: macros 2, 3, 4, 5, 13, 16, 17 are superseded by `docs/support/macros.md` until s11 exists. Every draft carries an internal block: order facts used, policy applied, remedy cost, what a human must do.
- M6 should list "support can refund, cancel and reprint from an admin page" next to Fulfillment's exception list. Without it the $0.90/order labor figure is low, since each manual remedy is two dashboards plus a status fix.

**Scale adjustments**
- **10× (about 30 contacts a day in December, CX estimate):** at about 8 min each, that's about 4 hours a day, beyond one owner-hour. The support agent drafts and a human approves (about 2–3 min each, estimate). Turn on the H5 peak auto-reply and the cut-off banner on Nov 15, and send H3 delay notices proactively from Fulfillment's exception list before customers write. Help Scout from launch (CX), with these macros loaded as saved replies.
- **100× (about 270 a day at peak):** about 13 human-hours a day even with drafts, so 2 people plus a contractor. Only possible with self-service tracking, cancel inside the undo window, a damage-claim form with photo upload that opens a reprint, and order lookup inside the helpdesk. Batch identical tickets (one carrier delay, one bulk H3 send) instead of one by one.
- Christmas: no new macros are needed after Dec 2 for books; most traffic will be H2 (past cut-off) and H3/H4 (late). The digital book or e-card as the after-cut-off gift must be live, or H2 has nothing to offer.

**Easy fixes made**
- `app/lib/shop/mail.ts`: the needs-attention email says it's on our side, nothing to fix, and a person will write by the end of the next business day. No raw reason. Subject "A short delay on {who}'s {item}". The unused `reason` argument was dropped (`app/lib/shop/orderService.ts`).
- `app/lib/shop/orderService.ts`: line note "We'll try again" (nothing retries) is now "We're looking into it". `app/components/shop/Orders.tsx`: needs-attention banner no longer says "we've emailed you what to do".
- Help articles 01, 02, 06, 07, 08, 09, 13, 14 in `docs/cx/help-articles/`: 3 redraws plus 2 sheet redos per book, no dedication or spelling-check promise, the real approval checkbox text, and no Cancel button. `docs/cx/02-support-model.md`: goodwill line, plus a pointer to the corrections.
- New: `docs/support/README.md`, `docs/support/macros.md` (what support can actually do, corrected macros, holiday replies H1–H6), `docs/support/patterns.md` (predicted top contact reasons).
- Typecheck clean; 503/503 tests pass; eslint shows no new warnings on the changed files.

**Blocked by**
- Owner: a real support mailbox and reply-to domain, the refund authority limits and support hours (docs/cx/02 s12), and approval of the Christmas cut-offs used in H1–H5. Engineering: the admin lookup with refund, cancel and reprint actions (shop). Nothing else for the fixes above.

### Trust & safety
**Built vs. needed**
- **A reviewer can read and relabel a report, nothing more.** No link from a report to an order or project, no admin order lookup, no hold-print, delete-art, suspend or restore action, no uploader notice, no counter-notice flow, no repeat-infringer list. Every decision is manual work in the Stripe and printer dashboards; the only print hold is Lulu's ~120-minute delay. `deleteUserBookData` deletes all of a user's books and is not a takedown tool.
- **The policies promise enforcement we can't do.** ToS s9 and the AUP say we "close accounts of repeat infringers", accept counter-notices and "close the account" for rule 1; none of that exists (req 24). They also send removal requests to `[SUPPORT EMAIL]` with subject "Image removal", while the product uses `/report` and the report inbox.
- **The DMCA form lacks elements ToS s9 lists:** no field for the copied work, no postal address or phone, and the tick box has no "under penalty of perjury" wording (attorney to word it).
- **Book text was screened for IP only (fixed below).** Story idea, dedication, roles, page text and redraw notes skipped the sensitive-content rules the card runs, so AUP rules 1–4 weren't enforced on books. Still rules only: no model-based harmful-content screen on either product.
- **Evidence versus deletion is unresolved.** The 90-day purge and delete-my-data can erase art under an open report or dispute (no legal-hold flag). Deleting on takedown makes a counter-notice restore impossible. The CSAM hook discards the image, which may conflict with a preservation duty (legal 07 s5).
- The proof page had no report link, although req 22 asks for one (fixed below). Status changes had no audit trail (fixed below).

**Plan changes**
- M5/M7 takedown item (IP safety's) should also list: `report → order/project` link, a "hidden, held" state instead of delete while a counter-notice can arrive, a legal-hold flag the purge respects, uploader notice, and a repeat-infringer table. Owner and attorney set the thresholds.
- docs/legal/05 ToS s9 and AUP "Report a problem": point to `/report` and the report inbox, and drop or qualify repeat-infringer and counter-notice promises until built (general counsel and attorney).
- docs/legal/07 s6 is accurate; add that books now get the sensitive rules and that the playbook lives in `docs/trust-safety/`.
- Add a trademark option to the form only if the attorney wants trademark notices handled apart from copyright; today it arrives as copyright or other.

**Scale adjustments**
- **Now (a few reports a month, estimate):** one reviewer, daily check, owner approves every remove. Fine.
- **10×:** the 48 h target slips without an SLA alert on `dueAt` (OVERDUE is shown only when someone looks). Add an alert, a Supabase `reports` table with class, decision and actor, and macros R1–R6. Auto-acknowledge is already built; keep removals human.
- **100×:** triage by class (P0/P1 first), auto-match `where` to an order id, auto-hold unprinted orders on P1 likeness reports, and batch identical copyright notices by work. Add an appeal path with a second reviewer. Rotate reviewers and fund counselling once harmful reports are weekly; never view suspected CSAM (playbook s1).

**Easy fixes made**
- `app/lib/book/service.ts`: book text now runs `checkSensitive` before the paid IP screen (422 `content_blocked`); grief words still pass.
- `app/lib/safety/reports.ts`, `app/lib/shop/types.ts`: append-only status `history` with a note; `reportOverdue()`. `app/app/api/admin/reports/route.ts`: `actioned`/`closed` need a note. `app/app/(shop)/internal/reports/page.tsx`: OVERDUE flag and history.
- `app/components/book/ProofStep.tsx`: "Report it" link (req 22). `app/app/api/report/route.ts`: the 429 message uses `reportInbox()`. `app/components/shop/ReportForm.tsx`: US spelling.
- `app/tests/safety.test.ts`: 2 tests. Typecheck clean; 505/505 pass; eslint has no new warnings.
- New `docs/trust-safety/01-review-playbook.md` (classes, CSAM stop, decisions, what a reviewer can really do, evidence, replies R1–R6, wellbeing) and `02-patterns-and-rules.md` (pattern log, rule requests, repeat-infringer list).

**Blocked by**
- Attorney (via owner): the CSAM procedure and preservation, DMCA agent registration, notice and counter-notice wording, repeat-infringer threshold, and report retention. Supabase (SEC-18) for a durable reports table and order link. Nothing else for the fixes above.

### Privacy ops

**Built vs. needed**
- **"Purged after 90 days unless you save the person" is not true.** Box C keeps photos forever and there is no Saved Person with photos (shop `people` are names only). The live privacy page and consent box B both make this promise. Owner/attorney: hide box C, or give it an end date, until Saved People exists.
- **The 5-year consent log doesn't exist.** Consent sits inside the book and is deleted with it. Re-consent used to overwrite the withdrawn record (fixed below). Needs an append-only consent table (DATA-001), plus attorney sign-off on keeping IP and device after an account is deleted.
- **Not built:** retention for drafts, art and print PDFs (req 27); the 14-day reminder email (`photosExpiringSoon` is never called; req 26); per-book delete; the under-18 handler (req 2); a legal-hold flag. Orders are never scrubbed (Shop engineer).
- **True today:** consent gate and wording hash, ZDR on photo calls, no tags or pixels, GPC read, self-serve delete (books included), export (now with books). Delete and purge leave `identity.txt` and model sheets (legal question still open). None of this is durable or verifiable in production until SEC-18.
- Full promise-by-promise table: `docs/privacy-ops/05-audit-2026-10-12.md`.

**Plan changes**
- "Risks to watch > Children's photos": change "Covered by ... retention limits and a deletion path" to "Partly covered. Box C retention, the consent log and the reminder email are open (privacy-ops/05 A1-A5). The privacy review needs the attorney's opinion (req 55)."
- docs/legal/05 s4 and s5 promise Saved People retention (24 months) and the 14-day email. Neither is built, so mark both as conditional. Also add "checked for safety" to the photo-use wording (A13).
- `CONSENT_TEXT.c` and box B disagree ("approved character" versus "saved Person"). Pick one concept before the attorney finalises the wording.

**Scale adjustments**
- **10×:** expect DSARs by email. Keep the request log outside the repo (privacy-ops/01 s6) and point every requester to the self-serve buttons. Set the purge cron to alert on any non-zero `verify`. Sign the DPAs before the first real photo.
- **100×:** a `privacy.deletion_requests` queue with vendor tasks (data/06 s6). The purge becomes an indexed query on `photos.expires_at` in batches, with an orphan sweep. Publish a sub-processor page with change notices. Multi-state laws (CA, VA, CO, CT, TX and others) will likely apply by then: add an authorised-agent process, an appeals process and a metrics disclosure (attorney decides which).

**Easy fixes made**
- `app/lib/book/privacy.ts`: new `exportUserBookData` (books plus every consent record, no storage paths) and `auditPhotoRetention` (read-only: overdue, box C holds, orphan files).
- `app/app/api/account/export/route.ts`: export now includes `books` (closes the e2e "export" GAP). `app/components/shop/Account.tsx`: export description updated.
- `app/app/api/book/privacy/purge/route.ts`: returns `verify` counts after each purge and logs counts only when it fails.
- `app/lib/book/types.ts`, `app/lib/book/service.ts`: `consentHistory` keeps earlier records (kept out of the browser view). `JobInput.consentId` puts the consent id on every job (req 4).
- `app/tests/book/privacy-ops.test.ts`: 5 new tests. Typecheck clean; 510/510 tests pass.
- New `docs/privacy-ops/`: README (calendar), 01 DSAR runbook, 02 purge verification, 03 incident notification, 04 vendor and DMCA tracker, 05 audit and checklist.

**Blocked by**
- Nothing for the fixes above. Box C, consent-log retention and identity text need the owner and attorney. Durable deletion and the consent table need Supabase (SEC-18). DPAs and DMCA registration need the owner.

### General counsel
**Built vs. needed**
- **Live policy pages promised a photo purge the code doesn't do (fixed in text).** Privacy and FAQ said "deleted after 90 days unless you save the person". Box C keeps photos with no end date, and no Saved Person with photos exists. The pages now describe the real behavior. Consent box B and the book photo line still say it; they need the attorney's wording (Q3, Q5).
- **The drafts (legal/05) promised things that don't exist:** cancel "until In production" (no cancel and no such status; orders reach the printer seconds after payment), counter-notices, repeat-infringer closure, account closure for AUP breaches, Saved People retention for 24 months, the 14-day email and a 5-year consent log. Each is now marked [NOT BUILT]. Account page: "name and address removed after fulfillment" never happens, because orders never reach "delivered".
- **CSAM: verified 2026-10-13 (18 USC 2258A, Cornell LII).** A report triggers a 1-year preservation duty (REPORT Act 2024), with secure storage and limited access. Our hook discards the image. This blocks real photos (Q13).
- **DMCA: verified (17 USC 512; copyright.gov FAQ).** The agent costs $6 and lapses after 3 years. Safe harbor needs a "reasonably implemented" repeat-infringer policy. The report form lacks a separate field for the copyrighted work and the perjury statement.
- **Legal prerequisites before the first live payment:** entity and EIN; home-state sales tax permit plus Stripe Tax registration, ship-to address and tax codes (Stripe collects only where we are registered); attorney-approved Terms, Privacy and Refund policies with the real company name and address (placeholders and "Draft placeholder" banners gone); a refund policy that matches the real cancel point; a reasonable basis for the delivery date shown (today a 7-day code default; Mail Order Rule); a working support mailbox; DMCA agent filed; DPAs signed; insurance bound. Before the first real child's photo: Q1 to Q13.

**Plan changes**
- Done: "Risks to watch > Children's photos" rewritten (it said "covered").
- Stop condition: add "no live keys, no real photos until the brief's before-launch items are answered or waived in writing by the owner". The e2e can pass while every legal gate is open.
- legal/00 owner question 7 and req 47 (Eye Story) are closed by rule 5. legal/05 ToS s7 now uses 3 redraws plus 2 sheet redos, and removal requests point to /report.
- Ask the Copyright Office to file the DMCA agent before launch, not "before public launch" only. Safe harbor doesn't cover notices that arrive before the filing.

**Scale adjustments**
- **10×:** about 19k orders a year still sits under most state privacy thresholds (commonly 100k consumers) [U]. Texas and Nebraska style laws reach small businesses that sell sensitive data [U], so build to the CCPA standard anyway. Sales tax nexus in several states during the holiday months (accountant). BIPA exposure is per person, so the Illinois decision matters more. IP notices need the reports table, the repeat-infringer log and the hold-not-delete flow (Q15, Q16). Raise media/IP and cyber limits.
- **100×:** an attorney on retainer, not per question. A sub-processor page, appeals and authorised-agent handling. A DSAR queue. Yearly vendor-terms review becomes quarterly.
- **International:** stay US-only. EU or UK sales bring GDPR Art. 27 representative, DPIA for children's images, VAT and SCCs (legal 02 s9). Each needs its own attorney review.

**Easy fixes made**
- `app/app/(shop)/privacy/page.tsx` and `app/app/(shop)/faq/page.tsx`: photo retention and safety-check text now matches the code; cookie list completed. Typecheck clean; 510/510 tests pass.
- `docs/legal/attorney-brief-2026-10.md` (new): 44 deduplicated questions, 33 before launch and 11 after, plus a table of 10 product-versus-policy conflicts.
- `docs/legal/05-policies-draft.md` ([NOT BUILT] marks, redraw numbers, /report, US spelling); `00-summary.md`, `02-children-photos-privacy.md` (verified 2258A), `06-product-requirements.md` (status); `docs/PLAN.md` (risk line).

**Blocked by**
- Nothing for the fixes above. Every legal answer waits on the owner choosing and engaging an attorney. Consent box B and `PHOTO_PRIVACY_LINE` wording (book engineer) wait on Q3 and Q5.

### Kiosk
**Built vs. needed**
- **No kiosk code exists, and the web app can't carry one yet.** A kiosk needs a card that can be bought and printed. Today there is no signed-in card path, no card print PDF and no durable store (CTO, Card engineer). It also needs live renders, which need the hosted queue (SEC-21). The pre-generated template pack that hides the 30–90 s render does not exist.
- **The print path:** `layoutCard` writes two separate 5.25×7.25 in pages. A counter printer needs one duplex sheet per card (not built). The print stage can print a model-written message instead of the approved one, which is worse when the buyer is standing at the printer.
- **Payment:** there is only a web redirect to Stripe Checkout, and it has never run in a sandbox. There is no Stripe Terminal and no authorize-then-capture-on-dispense step.
- **Public-terminal abuse:** the guest cap is a cookie, which a kiosk wipes every session, so previews are unlimited. The per-IP limit (5 per 10 min) would throttle a busy store on one IP. Caps need to be per device token and durable (SEC-10). Kiosk mode itself (locked browser, timeout, profile wipe, device management) is all P1 scope. Detail: `docs/kiosk/04` s14.

**Plan changes**
- **Defer. Don't fund P0 ($35k base) now.** It is about two thirds of the $54k peak need in the CFO's recommended plan, it earns nothing, and the "reuse the existing app" premise is false until the CTO critical path lands. PLAN.md has no kiosk section; add one line under Milestones: "Kiosk: research only until start gate S0 (docs/kiosk/07)."
- **New stage S0 (after launch, $100–500, no contractors):** printed-card sales and complaint data from the live store, a blind test of 5 of our own printed cards against rack cards, and an operator licensing refresh. **Start gate S0 for P0:** ≥3 months and ≥150 printed cards sold online with <5% complaints or reprints; P0 funded on top of the peak need, or 3 months of positive contribution; SEC-18/10/21 plus the card buy-and-print path live; one warm host or operator call; written owner approval.
- **The differentiator is unbuilt.** The kiosk case rests on the "GreetHub brain" (guided chat, saved People, accounts). The card has no edge yet, so a kiosk today sells an ordinary card at a counter. Fix the online card first.
- **The account upside was overstated.** It was valued at the avoided $76 CAC. With paid spend near $0 there's little CAC to avoid. About $11 of repeat contribution per sign-up [U] is fairer (about $230 a month per kiosk).
- **Licensing (Tier D) is still the cheapest route to a counter.** It's an owner conversation, not a build.

**Scale adjustments**
- **10 kiosks:** about $2.6k a month fixed (service is about half). Add refill kits stocked by hosts, remote jam and stock alerts, monthly host statements and payouts (1099s), sales tax and personal property tax in each kiosk state, and per-device ledger caps.
- **100 kiosks:** $0.56–0.94M of fleet capex is beyond our means. Scale only under lease (B), host purchase (C) or operator licence (D). Owning units with a revenue share (A) should be for the pilot only. Use a route-based service partner and two approved reader models (the WisePOS E reportedly ends in early 2027), with the host share capped at 25%.

**Easy fixes made**
- `finance/GreetHub_Financial_Model_v3.xlsx`: kiosk G0 defaults to 0 (only P0 is modelled). The schedule moves 6 months later (P0 at M7). Fleet plan and start months shifted. The Kiosk payback flag no longer reads "month 1" before any spend. Recalculated in LibreOffice: 8,811 formulas, 0 errors. Core-only results are unchanged. Base-case "Core + Kiosk" peak need is now $332k (was $2.05M with every gate passed).
- `docs/kiosk/00`, `04` (s14 built-vs-needed), `05` (CAC $70, account value, s9 scale), `07` (S0 stage and gate, schedule mapping, G1 per-device caps), `08` (workbook change log), `09` (Q1 and Q17).
- gh-cfo: finance/README.md's v2 "Core + kiosk" figures now describe the all-gates what-if only. Please refresh them; I did not edit README.

**Blocked by**
- Nothing for the fixes above. P0 waits on start gate S0. Owner: decide whether the kiosk stays research-only until S0, and whether to open a licensing conversation with an operator.

### Product manager: consolidated launch plan
**Assessment (built vs. needed)**
- **The product works end to end in mock mode and nowhere else.** 512 app tests, 35 pipeline tests and every e2e script pass locally. Nothing is durable (no Supabase), no adapter has run against a sandbox, no page shows real art, no real order has printed, and 4 of 95 events exist. The gap to launch is infrastructure, owner inputs and evidence, not features.
- **Three facts reshape the product.** Cards take no photos, so the book is the product and the card is the funnel and add-on (market intel). Saved People holds names only, so the "same Grandma everywhere" moat is post-launch. The book proof shows a dedication that never prints (fix or hide before any sale).
- **Scale for launch volume, not 10×.** At ~160 orders a month the real risks are cost abuse (in-memory caps, fake-provider flags), one printer per product in December, and a support team that can't act. Durable caps, an exception list and an admin remedy page matter more than throughput work.
- **Cut from launch:** agent channel (dark), kiosk (research only), Metabase, occasion reminders, promo codes and creator payouts, marketing email, mobile plan, Express shipping, and "26 equal styles" (lead with ~10 proven looks).
- **Conflicts resolved (owner confirms):** SEC-12 pay-before-render vs. market/CFO: no pay-before-render; cap 2 active unpaid books per account plus the global ledger, and keep the free character sheet. 3 card styles print an empty front: stop recommending them until front type exists. Box C: hide until Saved People with photos exists. Done gate: QA (STRICT e2e, axe) plus CX usability, not a CMO pass. Every "pipeline owner" item is the CTO's.

**Owner decisions & inputs needed** (in order of what they unblock)
1. **Supabase project credentials** (URL, anon key, service-role key). Unblocks B1 and with it persistence, real sign-in, guest-draft carry-over, storage and signed print URLs, RLS, the ledger, consent log, reports table and the preview e2e. Nearly every item below waits on it.
2. **Job host choice and account** (CTO: Inngest, or Supabase Queues plus a small worker). Unblocks B3: live card and book renders on a deploy, the M3b full card render, order submission outside the Stripe webhook.
3. **Lulu and Prodigi sandbox keys**, plus the Lulu pod package, Prodigi card SKU, tracked shipping tiers and where Prodigi prints. Unblocks B6, real print and ship costs (83% of a book's variable cost) and the Christmas dates.
4. **Stripe test keys and webhook secret, a Resend key, and the Vercel login that owns the project** (confirm `SESSION_SECRET`, `CRON_SECRET`, `GREETHUB_ADMIN_TOKEN`; turn on Deployment Protection and `master` protection with CI; keep fake and dev sign-in flags off). Unblocks M5 verification, email and safe deploys.
5. **Engage an attorney this week** and send `docs/legal/attorney-brief-2026-10.md` (33 before-launch questions). Unblocks real children's photos (Q1–Q13, CSAM preservation), final policies, consent wording, box C, DMCA form wording. Longest lead time on the list.
6. **OpenRouter:** rotate the key, set a credit limit, and approve one cap of about **$35** (style samples $3.50, launch art under $10, golden baseline $5, usability renders $15, live IP eval about $1). Unblocks real art (top trust gap), the first quality baseline and usability round 1.
7. **Production domain, support mailbox and reply-to, company legal name and postal address.** Unblocks placeholder-free footers and policies (CX-02), help and contact (CX-31), email sending, canonicals and CAN-SPAM.
8. **Entity and EIN, business bank, accountant** (`finance/ops/accountant-questions.md`), home-state sales tax registration, resale certificates, insurance, DMCA agent filing ($6), signed DPAs. Unblocks the first live payment (not the preview).
9. **Order a physical proof of each product by Nov 3** (plus about $200 of competitor books). Unblocks the Christmas go/no-go, product photos and creator outreach.
10. **Approve product calls** (PM recommendation): no SEC-12, unpaid-book cap instead; CFO prices (books +$5, mailed card $8.99 with postage, digital book $9.99, Express off); `docs/ops/03` cut-offs and lost threshold; hide box C; SEC-02 remainder; Turnstile account; `@playwright/test` dev dependency; internal KPI page, no Metabase; kiosk research-only until S0; refund limits and support hours.
11. **Recruit 5–8 interviewees now** and approve usability incentives (about $400–500). Unblocks research on photo trust and price, and usability round 1.
12. **Not launch-blocking:** equity partners, rates and funding of the $54k peak need; Keyword Planner export and Search Console; creator offer and gift cap; Stripe live keys at go-live.

**Build order** (B1→B3 is the critical path; B4, B5 and B10 can start now in mock mode)
- **B1 Persistence (CTO, Security).** SEC-18 auth, store and storage with RLS; DATA-001 migration incl. consent, reports and ledger tables. *Accept:* preview state survives cold starts; RLS cross-user test passes; launch-flow GAP 1 (draft carry-over) closed.
- **B2 Cost controls (Security, CTO, Data).** SEC-10 ledger with reserve and settle (DATA-006), SEC-07 durable limits, SEC-13 Turnstile, SEC-02 remainder, rate limits on book routes, 2 active unpaid books per account, IP and safety-screen spend in the ledger. *Accept:* clearing cookies yields no second preview; parallel renders can't pass a cap; ledger rows outlive account deletion.
- **B3 Job host (CTO).** SEC-21 queue, one step per page, global per-model concurrency, queue-aware watchdog, order submission and printer polling as jobs. *Accept:* a live card preview and a book render complete on the preview deploy; the Stripe webhook answers in under 2 s.
- **B4 M3b account card flow (Card engineer; CTO for the pipeline).** Session-aware creator, full render job, approval page (UX spec s5), `layoutCard` PDF checked against the Prodigi spec with message fit enforced, verbatim message printing, sign-off screened, add-to-cart with a real `creationId`. *Accept:* launch-flow GAP 2 closed; STRICT step 3 passes.
- **B5 Book truth (Book engineer; CTO for the pipeline; IP safety).** Dedication printed on the title page (hide it now, CX-44), unfitted text fails layout, mock mode builds a real PDF, fail-closed IP verdict per page plus a sheet vision check, CX-05 proof approval. *Accept:* the proof shows only what prints; no approval or print without an IP verdict on every page.
- **B6 Print path, M6 (Shop engineer, CTO, Fulfillment).** `printAssets()` from signed storage URLs, Lulu cover wrap, card SKU, preflight (`docs/ops/02`), Lulu dedupe and submit claim, registered webhooks, derived "delivered", refund, dispute and expiry events, ship-to and tax codes to Stripe, a 60-minute undo window before submit, "proof ready" email. *Accept:* the 7-step sandbox routine passes for both printers (GAP 3 closed); a print PDF exists to order the physical proof.
- **B7 Ops minimum (Shop, CX, Support, Trust & safety).** Admin order lookup with refund, cancel and reprint (`-R1`) plus audit log; exception alerts and delay email; CX-31 help and contact; CX-34 error codes; reports linked to orders, hold-not-delete, legal-hold flag the purge respects. *Accept:* support resolves the top 5 contact reasons without vendor dashboards.
- **B8 Measurement (Head of Data).** DATA-002/003/004 collector with funnel, payment, consent, proof and survey events, UTM capture, an internal page over D1, D6, D10. *Accept:* those KPIs compute from preview data; no third-party scripts on creator, proof or cart.
- **B9 Done gate (QA, DevOps).** Preview test-auth path, CI e2e job, SEC-09 monitoring, log drain, Supabase backups with one restore drill. *Accept:* STRICT launch-flow 0 gaps at desktop and mobile on the preview; a11y no serious issues; CI required on `master`.
- **B10 Real art (Head of Design, CMO; owner cap).** 15 style samples, two-page consistency test, hero, 12 covers, fictional sample book, Christmas book, Hanukkah and Thanksgiving templates, each IP-checked and logged. *Accept:* no striped placeholders; recommended styles all have a sample and a consistency result.
- **B11 Before real photos (Privacy ops, Book engineer, General counsel).** Box C hidden, append-only consent log, 14-day reminder email, CSAM preservation path per the attorney, final consent wording. *Accept:* attorney's written answers to Q1–Q13 on file.
- **B12 Handwriting and signatures (Card engineer, Shop engineer; CTO for print).** Built 2026-10-13 in mock mode: presets, own handwriting from a template sheet, signatures (style, draw, upload), defaults and apply-to-new-cards, card picker and preview, `layoutCard` support, export and deletion. *Accept:* a printed card proof shows the handwritten message and signature at the size previewed; the print job uses `resolveCardWriting` (after B4/B6) on copies taken at checkout; a print function on the preview deploy finds the handwriting fonts. CTO review 2026-10-13: ship after fixes; findings addressed.
- **After launch (Valentine's 2027):** promo codes and creator attribution, email consent and marketing email, occasion pages, Saved People with likeness, reminders, agent channel P1, kiosk S0.

**Christmas 2026 go/no-go — recommendation: invite-only soft launch; full public launch for Valentine's 2027.** Even if every owner input arrives this week, B1–B6 plus a physical proof plus an attorney opinion fit only just inside the Nov 13 gate, and the paid-spend gate (CMO/CFO) and SEO timing already push paid growth to January. Soft launch = allowlist or invite code, about 50 orders max, no paid ads or creator seeding, lower 48 only, Express off, digital book and e-card as the after-cut-off gift.
- **Oct 16:** owner items 1–4 delivered and item 5 started. Every day later comes straight off the gates below.
- **Oct 20:** item 6 cap approved (art and usability renders). **Nov 3:** physical proofs ordered (needs B6 PDFs by Oct 31). **Nov 6:** item 7 and item 8 done; usability sessions run.
- **Nov 13, books go/no-go:** B1–B7 and B11 done on the preview, STRICT e2e green, Lulu 7-step sandbox routine passed, physical proof in hand and judged, attorney answers Q1–Q13 on file. Miss any → no Christmas books; cards only.
- **Nov 15:** cut-off banner on. **Nov 20, cards go/no-go:** B4 and B6 for Prodigi, card proof in hand, live-payment prerequisites (item 8). Miss → skip Christmas entirely.
- **Order-by:** books Dec 2, cards Dec 10. **Valentine's:** public launch about Jan 12, 2027; book order-by about Jan 30 (fulfillment to confirm).
- **Soft-launch ship metrics** (decide public launch): sheet approved within 2 redos ≥80%; proof-to-order ≥50%; reprint or complaint rate <5%; contact rate ≤15 per 100 orders; guest preview spend per paid order ≤$1; no consent, privacy or IP incident.

**Plan changes** (edited directly above): Stop condition (signed-in card step, book order, 7-step sandbox, QA/CX done gate, legal gate); Agent organization (29 agents, CTO owns the pipeline, equity line, sequencing spent); Product definition (cards take no photos, book first, no account drafts for guests, 3 page redraws plus 2 sheet redos, Saved People names only); Data capture (IP rewrite to an original character); Milestones (status, M3b, M6 scope, QA-owned M7, agent channel and kiosk off the path); CMO deliverables (fictional sample book); Things to supply (points here); Risks (spend abuse and fake flags, silent model fallback, no monitoring or backups, one printer in December); Context (pdf-lib).

**Easy fixes made**
- `app/lib/intake/guest-prompt.ts`: the guest card prompt no longer tells the model to copy outfits "from the model sheet" (guests have none). Test added in `app/tests/intake-guest-prompt.test.ts`.
- `brand/README.md`: `--gh-control-border` (#8C7B6E) row and twine's new role, with the CX-19 rationale (CMO's loose end; outside my folder, flagged).
- Not done: the kiosk figures in `finance/README.md` need the CFO to read them from the v3 workbook. That is not a one-liner.

**Blocked by**
- Owner items 1–5 above, this week; everything in the build order waits on them. Nothing blocks the plan itself.
