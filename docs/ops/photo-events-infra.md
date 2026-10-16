# Photo cards and events: infrastructure

Owner: DevOps. Written 2026-10-15 (wave 1). Inputs: docs/products/photo-cards-and-events-plan.md, docs/cto/photo-events-architecture.md, docs/devops/03-monitoring-and-backups.md, docs/finance/photo-events-pricing.md, app/lib/collage/render.ts, app/lib/book/queue.ts, app/lib/adapters/real/resend.ts.
Vendor limits were read on 2026-10-15 from the URLs in "Sources". Anything marked ASSUMPTION is my estimate, not a measurement. No load test was run.

## 1. Image processing load (batch renders)

**What a render costs.** The CTO's render path is one design to one RenderPlan to one PDF, however many copies are ordered. A 200-card order is still one PDF per side. Nothing renders per recipient except the addressed-envelope PDF, which is mostly text. So "batch" load is about how many designs get proofed, not how many cards are printed.

Per design (5x7 flat, 300 DPI, 0.125 in bleed = 1575 x 2175 px, about 3.4 MP):
- Decode up to 4 uploaded photos (downscaled client-side; a 12 MP original is about 48 MB raw RGBA in sharp), crop and resize each into its slot, composite the side as a PNG (about 14 MB raw), embed in the PDF, make a proof JPEG. ASSUMPTION: 2 to 6 s of CPU for a 4-photo double-sided card, peak memory under 400 MB. The CTO's estimate ("a few seconds") agrees. Needs a measurement on a preview before launch (action 1 below).
- Re-renders happen at every "Review", after every edit once proofing is on, and once more at order time. ASSUMPTION: 3 to 5 renders per paid order, more for people who fiddle. Preview in the editor is browser-side (HTML/CSS over 1200 px previews) and costs the server nothing.

**Peak concurrency.** Plan for the December 1 to 5 rush, when most orders land: ASSUMPTION 300 paid photo-card orders in the peak week, 40 percent of them in the last 2 days, 4 renders each, so about 200 renders a day at peak, with bursts of 5 to 10 at once on an evening. That is small for Vercel (auto-scales to 30,000 concurrent) and small for sharp. The limit that bites is not CPU, it is the points below.

**Findings that matter**
1. `AfterResponseQueue` (app/lib/book/queue.ts) only runs **mock** jobs and throws for live ones, and its file stores live in one instance's `/tmp`. A real flat-card render is not a model call, but it will take the same code path unless the CTO adds a render job type that is allowed in production. Until the hosted queue (SEC-21) exists, **the proof and print render must run inside the request** (or `after()` with state in Supabase, not `/tmp`). Items 4 and 5 of the CTO's build plan (photo_sets in DocStore, migration) are therefore on the critical path for DevOps too.
2. Vercel request and response bodies are capped at **4.5 MB** (413 FUNCTION_PAYLOAD_TOO_LARGE). Photo uploads must go **straight to Supabase Storage with signed upload URLs**, never through a route handler. Print PDFs, proof JPEGs and envelope PDFs above 4.5 MB must be handed out as **signed URLs**, not streamed from a route. A 200-page envelope PDF and a double-sided photo PDF will both exceed this.
3. Fonts: `render.ts` documents that librsvg only sees system fonts, so `text: "none"` plus pdf-lib vector text is the only print-safe mode. Keep that as the only mode the print path may use, and add a test that fails if the print path ever passes "svg".
4. Run sharp with limited concurrency in a function (`sharp.concurrency(1)`, `sharp.cache(false)`) so two renders on one fluid-compute instance do not both hold 14 MB canvases plus decoded photos near the 2 GB default. Set an upload cap (pixels and bytes) at intake; reject decompression bombs with `limitInputPixels`.
5. A reprint or retry must not re-render if a frozen `design_versions` PDF already exists. Cache by `<designId>@<version>@<size>`; the RenderPlan is deterministic, so this is safe and cheap.

## 2. Vercel function limits that apply

| Limit | Value (docs read 2026-10-15) | What it means here |
|---|---|---|
| Max duration, Hobby | 300 s default and max | Fine for a render; Hobby is not for production anyway (commercial use, no log drains) |
| Max duration, Pro | 300 s default, 800 s max, 1800 s beta | Render routes: set `export const maxDuration = 60` on proof and print routes (not 180 like `card/preview`), so a stuck render fails and alerts instead of burning money |
| Memory | 2 GB default; Pro max 4 GB / 2 vCPU | Default is enough for the estimate above; raise to 4 GB only if the measurement says so |
| Bundle size | 250 MB uncompressed | sharp's native binary plus pdf-lib plus the brand and handwriting TTFs must fit. Check the traced size of the render route in a scratch build; use `outputFileTracingIncludes` for fonts, not `vercel.json` includeFiles (not supported in Next.js) |
| Request/response body | 4.5 MB | See finding 2 |
| File descriptors | 1,024 shared across concurrent executions | A batch that opens many files or sockets at once (per-recipient mailing calls) must be throttled, for example 5 at a time |
| Cost model | Active CPU plus provisioned memory time; waiting on I/O is free | Renders are CPU-bound so they bill; mailer and printer calls mostly wait and are cheap |
| Region | `iad1` by default | Keep functions near the Supabase region; set it explicitly in `app/vercel.json` when Supabase exists |

**Long work does not belong in a request.** Anything that loops over recipients (submitMailing for 200 people, address validation for 500 rows, reminder emails for 300 guests) must be a job that processes in chunks with state saved after each chunk, so a timeout resumes rather than restarts. This needs the hosted queue or a cron-driven worker; `app/vercel.json` currently has one cron (the purge). Cron routes should be added there by DevOps when the routes exist: reminder sweep (hourly), batch_jobs status poll (every 30 min in December), RSVP-deadline close (daily).

## 3. Storage growth and cost

Sizes (ASSUMPTION, to be replaced by measurement): photo after client downscale 2 to 3 MB; print PDF 1 to 3 MB per side (JPEG-embedded at 300 DPI); proof JPEG 0.3 to 0.8 MB; envelope PDF 0.1 to 0.5 MB.

Per design, 4 photos, double-sided, one proof per render, 4 renders kept: about 12 MB photos + 5 MB PDFs + 3 MB proofs = **about 20 MB**. Cap it: keep only proofs of the last 2 renders and the frozen PDF of each frozen version.

| Scenario | Designs | Storage held at once | Notes |
|---|---|---|---|
| Phase 1 soft launch (Christmas) | 300 orders, 600 designs started | about 12 GB | purge at 90 days after order final |
| Year 1, all three products | 2,000 orders, 5,000 designs | about 50 GB peak if drafts are kept 90 days | abandoned drafts are most of the bytes |
| Event pages | small: a design image plus RSVPs (rows) | negligible | RSVP data is DB rows, not files |

**Cost.** Supabase Pro includes **100 GB storage** (about $0.0213 per GB-month beyond) and **250 GB uncached plus 250 GB cached egress** shared across services ($0.09 and $0.03 per GB over). Year 1 fits inside the included amounts. Egress is the one to watch: every editor preview load re-reads 1200 px previews, and the printer pulls each PDF once. ASSUMPTION: 20 MB of egress per design view session, 10,000 sessions a month is 200 GB, close to the uncached limit. Generate the 1200 px preview once at upload, store it, and serve it with a long signed-URL life and cache headers (cached egress is a third of the price). Image transformation is billed separately and unpriced on the pages I read; do not use it, resize with sharp at upload.

**Growth controls**
- Draft purge: unpaid designs and their photos deleted after 30 days of inactivity (owner and Privacy ops to confirm the number); paid orders after the 90-day purge, which the CTO is generalising over collections.
- Supabase backups do not cover Storage buckets (docs/devops/03); do not back up customer photos elsewhere. Frozen print PDFs can be rebuilt from the RenderPlan while the photos exist, so a reprint inside the window is safe and after it needs the customer to re-upload. Ask Fulfillment whether the reprint window is longer than the photo purge; if it is, keep the **print PDF** (no raw photos) until the window ends and tell Privacy ops, since a print PDF of children is still children's photos.
- Alert at 70 percent of included storage and egress (section 5).

## 4. Email deliverability: RSVPs, reminders, invitations

**Provider.** Resend is already the adapter (`app/lib/adapters/real/resend.ts`, domain not yet verified, per docs/devops/01). Read 2026-10-15: Free is 3,000 mails a month **with a hard 100 a day limit** and 3 domains; Pro is $20 for 50,000 or $35 for 100,000 a month with no daily limit; no dedicated IP on either; marketing broadcasts are priced by contact count and are a different product. **The free tier cannot send a 300-guest reminder in one day**, so Pro is required before the first event page goes live. Volume check from docs/finance/photo-events-pricing.md: a 300-guest event with 4 sends is 1,200 mails; 40 such events a month is 48,000, so the $20 tier is the floor and $35 comes quickly. The CFO's $0.0004 a send is consistent with the $20 tier at full use.

**Two sending subdomains, not the root.** Resend recommends sending from subdomains to isolate reputation (read 2026-10-15). Guest mail goes to people who never signed up with GreetHub and who may mark it as spam; order receipts must not share that fate.
- `mail.<domain>`: order, shipping and account mail (existing flows).
- `events.<domain>`: invitations, RSVP confirmations, host notifications, reminders.
- The registered domain is **not found** in the repo or docs; the owner must supply it (ask 1). Use the same registrar for all DNS and keep the root for the website and for the DMARC policy.

**DNS to publish, per subdomain** (Resend's domain page gives the exact values after you add the domain; I could not read record details from the intro page, so confirm in the dashboard):
- **SPF** (TXT) and the **return-path** record Resend asks for, so SPF aligns with the From domain.
- **DKIM** (CNAME or TXT) records, enabled and verified in Resend.
- **DMARC** (TXT at `_dmarc.<domain>`): start `v=DMARC1; p=none; rua=mailto:<alert inbox>` for 2 to 4 weeks, read the aggregate reports, fix any sender that fails, then move to `p=quarantine`, later `p=reject`. Alignment must pass for both subdomains.
- **Do not** add a second SPF record on a name that has one; merge includes (a common cause of silent failure).
- Only enable open and click tracking on `events.` if the owner wants it; the privacy default is off (guest data, standing rule 5). Tracking links also look like phishing to filters.

**Mailbox-provider rules.** Gmail and Yahoo have required SPF, DKIM and DMARC for bulk senders since 2024, with one-click unsubscribe for marketing mail and a low spam-complaint rate. I could not re-read Google's page this session (the fetch failed), so treat the details as unverified and re-check the current thresholds before launch. We will be far below any bulk volume, but all three records should be in place anyway, and reminders to guests are the mail most likely to be reported as spam.

**Content and flow rules that protect deliverability**
1. **From** is GreetHub's verified address with the host's name in the display name ("Anna and Sam via GreetHub"). Never send From the host's own address. **Reply-To** is the host's email, only if the host opted in. The current adapter does not support `reply_to` or custom headers (its body has `from`, `to`, `subject`, `text`, `html`, `tags` only). Ask for an adapter change (ask for the shop engineer): `replyTo` and `headers` (List-Unsubscribe and `List-Unsubscribe-Post`).
2. Every guest email has a **footer unsubscribe** that stops all further mail from that event to that address and records a **suppression** (hashed address) so a host cannot re-add it. Required for reminders; confirmations to an RSVP the guest just submitted are transactional.
3. **Bounce and complaint handling**: add a Resend webhook route for bounced and complained events; suppress on hard bounce and on complaint; show the host "undeliverable" next to the guest; stop reminders to that address. Verify the webhook signature. Do not log the address; log the guest id.
4. **Throttle**: reminders go out in batches (for example 50 a minute) and are capped per event per day, as the CTO specified. A sudden 300-mail burst from a new domain is what gets a new domain throttled.
5. **Warm-up**: the new `events.` subdomain has no reputation. Send real traffic ramped over about 2 weeks before the first wedding season: host test sends, then small events first. Do not buy a list or import marketing contacts to "warm" it.
6. **Abuse**: the invitation form lets a stranger make GreetHub mail a third party. Per-account daily send cap, per-event guest cap (300 as designed), no free-text links in the first invite from a brand-new unpaid account, and Trust and Safety's report link in every guest mail. A phishing wave from one account can burn the whole domain's reputation. Coordinate with Security and Trust and Safety (their wave 1 files).
7. Plain text part always included (the adapter sends `text`; keep it). Keep HTML light; invitation art is linked as an image from the event page, not attached; no photos of children inside the email body, link to the event page instead.
8. Seed testing: before launch send to a Gmail, Outlook, Yahoo and iCloud inbox the owner controls, and check headers for SPF, DKIM and DMARC pass and the spam folder. A free seed-test site can help; none chosen.
9. One monitored inbox for `abuse@` and `postmaster@` on the sending domains.

## 5. Monitoring additions for this project

These extend the nine signals in docs/devops/03-monitoring-and-backups.md. Alerts go to the same owner address; every alert names a runbook. Counts and ids only, no names, addresses or photo filenames.

| Signal | Source | Alert | Needs |
|---|---|---|---|
| Render time and failures | Timing log line per render (design id, size, ms, ok) | p95 over 30 s, or any failure streak of 3; 5xx on proof routes | App adds one structured log line |
| Render memory | Vercel function metrics | Peak memory over 1.5 GB | Pro plan metrics |
| Function timeouts | Vercel logs, 504 FUNCTION_INVOCATION_TIMEOUT | Any on proof, print or remind routes | Log drain (Pro) |
| Payload errors | 413 FUNCTION_PAYLOAD_TOO_LARGE | Any (means an upload went through a route) | Log drain |
| Storage used | Supabase dashboard | 70 and 90 percent of 100 GB | Owner enables usage alerts |
| Egress used | Supabase dashboard | 70 percent of 250 GB uncached | Owner enables usage alerts |
| Photo and draft purge | Purge cron result | No success in 26 h; any photo past retention | Existing signal 7 |
| Email send failures | Resend dashboard and webhook | Bounce rate over 4 percent or complaint rate over 0.1 percent on `events.` in a day | Webhook route |
| Email volume vs plan | Resend usage | 80 percent of monthly plan; any day near a cap | Owner enables |
| Reminder sweep | Cron result | No success in 2 hours (hourly cron) | Cron route |
| DMARC reports | `rua` mailbox, weekly | Any source failing alignment | Free report reader (owner picks) |
| RSVP errors | Logs for `/api/events/*/rsvp` | 5xx over 2 percent in 10 min; rate-limit blocks spike (spam wave) | Existing signals 1 and 2 |
| Batch print/mail jobs | `batch_jobs` | Any job `submitted` over 3 days or `needs_attention`; any recipient sub-status failed after retries | Supabase; extends signal 8 |
| December countdown | Fulfillment order-by dates | Daily digest from Dec 1 of orders not yet rendered or submitted | Fulfillment cutoffs config |

Deliverability dashboard: Resend's own dashboard is the source of truth for sends, bounces and complaints. The cron digest should include yesterday's counts (sent, bounced, complained) so the owner sees a trend without logging in.

## 6. Pre-launch checklist and owner asks

**DevOps will do once a branch with the routes exists** (not done now; no routes exist yet)
1. Measure a 4-photo double-sided render on a Vercel preview (time, peak memory, bundle size, PDF size) and replace the ASSUMPTION numbers above. Test with the fake adapters; no paid calls.
2. Add the three cron entries and `maxDuration` guidance to `app/vercel.json` and the CI size check for the render function bundle.
3. Add the DNS record list for the chosen domain to docs/devops/01-environments.md and a deliverability runbook (bounce spike, blocklist, domain throttled) to docs/devops.

**Needs the owner**
1. Tell me the registered domain and who controls its DNS; approve using two subdomains (`mail.` and `events.`).
2. Resend: create the account, add both domains, publish the DNS records, and upgrade to Pro ($20 a month) before the first event page launches; I can supply the record checklist. Not before the Oct 24 decision for Christmas, since holiday photo cards need no RSVP mail.
3. Vercel Pro plan (needed for log drains, 800 s max duration and function metrics) and Supabase Pro, both already in the model; turn on Supabase usage and spend alerts and Vercel's spend cap.
4. Pick the DMARC report reader and the `abuse@`/`postmaster@` inbox.
5. Confirm draft retention (suggested 30 days) with Privacy ops and the attorney.

**Needs teammates**
- CTO and Shop engineer: a render job type allowed on production (not mock-only), photo_sets in Supabase not `/tmp`, signed-URL uploads and downloads, `replyTo` and `headers` in the email adapter, a Resend webhook route, suppression storage.
- Security and Trust and Safety: per-account send caps and the guest-mail report link.
- Fulfillment: reprint window length versus photo purge.

**Not verified in this document:** all timings and sizes (estimates), Google's current sender thresholds, Resend's exact DNS record values, Supabase upload size limit and image transformation pricing.

## Sources (read 2026-10-15)

- Vercel Functions limits: https://vercel.com/docs/functions/limitations
- Supabase Storage pricing: https://supabase.com/docs/guides/storage/management/pricing
- Supabase egress: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Resend pricing: https://resend.com/pricing
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Google sender requirements (https://support.google.com/a/answer/81126): fetch failed, not read.
