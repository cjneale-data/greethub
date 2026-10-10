# GreetHub — build plan (website, business, financial model)

## Context
The Eye Story showed that one pipeline can turn family photos and a story into a print-ready book: Sonnet as art director, Gemini image models through OpenRouter, a locked identity sheet plus model sheet for consistency, and reportlab PDFs at Lulu specs. GreetHub turns that into a product anyone can use without Claude Code. People describe a card or book on the site, approve a character sheet and proofs, pay, and get it printed and shipped.

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
3. Create a **card** through the guided chat, approve it, and see the proof.
4. Create a **picture book** (photos → character sheet approval → story → pages → proof).
5. Add both to the cart, enter a shipping address, and pay with a Stripe test card.
6. Receive a confirmation email. The order is submitted to the Lulu and Prodigi sandboxes, and status and tracking show on the account page.
7. Manage the account: profile, saved addresses, drafts, order history, saved "people" (characters), and deleting the account and its data.

An automated Playwright end-to-end test runs steps 1–7 and must pass on the deployed preview. The CTO agent's work is finished when it does. The CFO workbook and CMO pack must also be delivered.

## Agent organization
I act as the orchestrator (CEO). I spawn three agents with the Agent tool, give each a brief and a deliverables contract, review what comes back, and pass outputs between them. Each agent writes into its own folder of the repo so they don't collide.

| Agent | Owns | Writes to | Depends on |
|---|---|---|---|
| **CMO** | Brand application, UX flows and wireframes, site copy, intake question design (with CTO), launch marketing plan, channel assumptions for the CFO | `docs/cmo/` | Brand kit |
| **CTO** | Architecture, the generation pipeline port, web app, payments, fulfillment, tests, deploy, mobile-app plan | `app/`, `pipeline/`, `docs/cto/` | CMO UX spec (screens), CFO prices (checkout) |
| **CFO** | Unit economics, pricing, the Excel forecast, cost of tokens per product | `finance/` | CTO's measured token costs, CMO's channel assumptions |

Sequencing:
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
  - Printed and mailed (to the buyer or straight to the recipient), or bought as a digital e-card or PDF.
  - About 3 image renders each.
- **Picture book:**
  - 8.5×8.5 hardcover, 24 or 32 pages, laid out as text-left / art-right spreads like the Eye Story. That layout is proven, and image models won't reliably keep text zones clear.
  - 1 to 4 main characters from photos, plus an optional pet.
  - About 14 pages of art, a model sheet, and re-rolls.

**Guest vs. account:**
- **Guest:** chat intake, one card preview (low resolution, watermarked), no saved drafts.
- **Account:**
  - Books (they need a photo upload and a consent record).
  - Saved drafts and saved "People" (reusable character sheets, so Grandma looks the same in every card).
  - Re-rolls (a monthly allowance), high-resolution proofs, checkout, order tracking, address book, and occasion reminders (a later step).

## Data capture: structured + unstructured
Everything the user tells the site ends up as a validated **CreationBrief** (JSON schema, Zod). Generation runs only when every required field is filled.

**Structured fields** (chips, pickers and forms, so they're cheap to validate):
- Product, occasion, and recipient name and relationship.
- Tone (funny, heartfelt, adventurous), art style (4–6 curated presets that map to `style` strings like the Eye Story's), and reading age (books).
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
  - No copyrighted characters. The intake rewrites "like Meeko" to "a friendly raccoon".
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

**Expected token cost to verify in Wave 1:**
- The Eye Story spent about $3.50 across about 30 renders, so roughly $0.11 per 4K render.
- A **book** works out to about $2–4 and a **card** to about $0.30–0.60.

## Architecture (CTO)
- **Front end:** Next.js App Router plus the brand kit's `tokens.css`, `components.css` and components converted to TSX. The fonts are Bricolage Grotesque and Figtree.
- **Supabase:**
  - Auth (magic link and Google; the guest session is anonymous and upgrades on sign-up).
  - Postgres tables: users, people, briefs, creations, renders, carts, orders, addresses, cost_ledger.
  - Storage, with private buckets for photos.
  - pgvector, Realtime, and Edge Functions or a worker.
- **Payments:** Stripe Checkout with shipping collection, tax, and webhooks. The order is created on `checkout.session.completed`, then submitted to the printer.
- **Fulfillment:** Lulu Print API for books, Prodigi for cards (fall back to Gelato). An adapter interface lets printers be swapped, and printer webhooks write order status and tracking back to the site.
- **Email:** Resend (confirmation, shipped, proof ready).
- **Secrets:** env vars on Vercel only. The OpenRouter key never reaches the browser, and every model call is server-side with a per-user rate limit and a spend cap.
- **Tests:** Vitest for brief validation, pricing and layout math; Playwright for the stop-condition flow.

## Milestones (each has its own check)
1. **M1 — Scaffold.** Repo, brand tokens, the home page matching the brand-kit hero, auth, and a Vercel preview.
2. **M2 — Pipeline.** A script-level card and book from a fixture brief, plus a cost report (sent to the CFO).
3. **M3 — Intake.** Chat plus form brief builder, RAG knowledge base, guest card preview.
4. **M4 — Book flow.** Photo upload with consent, model sheet approval, story editing, page progress, proof viewer, re-roll.
5. **M5 — Commerce.** Cart, Stripe Checkout, order records, emails.
6. **M6 — Fulfillment and account.** Printer sandboxes, tracking, account pages, data deletion.
7. **M7 — Done gate.** The Playwright e2e passes on the preview URL and the CMO does a final QA pass.

## CMO deliverables (`docs/cmo/`)
- **UX spec:** guest → sign-up → create → approve → cart → checkout → track. A wireframe for each screen, using brand-kit components such as TemplateCard tilt grids, Chips for occasions, Progress for renders, and Toasts.
- **Site copy** in the brand voice ("Your card's on its way to Sam."). That covers home, product pages, pricing, FAQ, and the intake question bank.
- **12 demo templates** for the browse grid. The Eye Story can be the hero sample book, with the family's OK.
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
I'll pause and ask for each when it's reached:
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
- **Children's photos.** Covered by consent, private storage, retention limits and a deletion path. Before going live, the legal pages need a real privacy review (COPPA).
- **Print color and spec rejections.** Run the printers' file validation APIs before submitting.

## Verification
- **Per milestone:** Vitest unit tests, plus a manual walkthrough with the Chrome browser tools on the preview URL, with screenshots.
- **Done gate:** the Playwright e2e (guest → sign-up → card → book → cart → Stripe test payment → sandbox print orders → tracking on the account page → account deletion) passes against the Vercel preview.
- **Finance:** the workbook opens in Excel. Changing the marketing budget input moves traffic, orders and profit, and token costs match the CTO's measured `cost_ledger`.
