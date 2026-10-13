# 04. Software architecture

Design only; no code is written. Everything reuses the GreetHub stack in `docs/PLAN.md` (Next.js, Supabase, Stripe, the TypeScript pipeline, the `pdf-lib` layout code in `pipeline/src/layout`). Prerequisite from `docs/security/00-assessment.md`: the stand-in auth, in-memory rate limits and in-memory spend caps (R1 to R5) must be replaced by Supabase auth and a database-backed ledger before any public device exists. A kiosk is an unattended client with a card reader; it makes those weaknesses much more expensive.

## 1. Overview

```
 Customer ── touchscreen ──► Kiosk shell (Chromium kiosk mode, locked)
                                 │ loads  https://kiosk.greethub.example/k/<deviceId>  (Next.js route group, "kiosk")
                                 │ talks to ▼
 Kiosk agent (local service, Node, signed releases)  ◄── localhost API only ──┐
   - print queue + job state machine (SQLite on disk)                         │
   - printer driver adapter (CUPS/IPP, vendor SDK)                            │
   - sensors (stock, jam, door), fan/PDU control                              │
   - payment reader bridge (Stripe Terminal server-driven)                    │
   - offline template pack + font cache                                       │
   - telemetry, remote update, wipe                                           │
                                 ▼  HTTPS (outbound only), device cert + short-lived token
 GreetHub cloud: Next.js API · Supabase (auth, Postgres, storage, realtime) · pipeline worker · Stripe · device registry
```

Key decision: **web app in a locked kiosk browser plus a small native "agent" for everything the browser cannot or should not do** (printing, hardware, payment bridge, wipe). Reasons: the creation experience is the existing Next.js UI, so style recommender, Greet Guide, People, IP-safety and brand tokens are reused; the agent keeps hardware code small and independently updatable.

| Option | Verdict |
|---|---|
| Web in Chromium kiosk mode + local agent | **Chosen.** One UI codebase, instant updates, hardware isolated |
| Fully native app (Electron/Android/.NET) | Rejected for v1: duplicates UI, slower iteration |
| Tablet app (Tier A) | Android tablet in single-app mode running the same web view; the printer is driven over the network by a small relay on the printer's host, since a tablet cannot easily run a print spooler [U] |

## 2. What is reused and what is new

| Reused as is | New for kiosk |
|---|---|
| Greet Guide, brief schema, style recommender, IP-safety layer, moderation, People, saved drafts, accounts, order records, pipeline stages and cost ledger, layout code | `/k` route group with kiosk UI (large type, attract loop, timeouts), device registry and device tokens, kiosk session model, template pack builder, imposition and print job format, print agent, Stripe Terminal flow, kiosk order type and sales tax, per-device caps, device management, fleet dashboard |

The kiosk UI must follow `docs/cx/01-ux-ui-standards.md` with kiosk overrides: minimum 18 px body, 56 px touch targets, focus visible for switch/keypad users, no hover states.

## 3. Sessions and accounts

- Every interaction is a **kiosk session** row: `kiosk_session(id, device_id, started_at, expires_at, user_id null, state)`. No account required.
- **Account link:** the screen shows a QR to `https://…/k/link?code=XXXXXX`. The phone signs in (magic link or Google), the page calls `POST /api/kiosk/link {code}` and the server binds `user_id` to the session; the kiosk receives it by Supabase Realtime or 2-second polling. This is the same pattern as an OAuth device-code flow [U]. Codes are single-use, 6 to 8 characters, valid 5 minutes, rate limited per device and per IP.
- Linked sessions load the customer's People (names and relationships only; the face sheets stay server-side and are never sent to the kiosk, which gets low-res previews at most) and past cards. Adult-only rules from `docs/legal/00-summary.md` already apply to the account.
- **Phone to kiosk:** the phone's draft gets a short code; the kiosk's "I have a card" screen resolves it to the signed-in draft and approved proof. **Kiosk to phone:** the kiosk shows a QR carrying the session; the server moves the brief and drafts to the account.
- **Session end:** timeout 90 seconds of inactivity with a 15-second warning ("Still there?"), hard stop at 15 minutes, immediate "End session" button. On end: the browser profile is wiped (see 9), cookies cleared, session row closed.

## 4. Generation latency: the waiting experience and the pre-generated flow

Measured (`finance/measured_costs.json`): 2K image about 16.2 seconds average; card front plus inside is 3 calls (model sheet, front, inside) plus vision QA.

Design rules:
1. **Never make the customer wait for what they can skip.** Quick pick uses pre-generated fronts: zero image wait.
2. **Overlap waits with decisions.** For Make it yours, start the render the moment style and occasion are chosen (no refund concern: model cost is about $0.06 to $0.14 of the sale price), and let the customer write the message during it. 16 seconds disappears behind a 30-second message step. If the render finishes first, preload it behind the message screen.
3. **Honest progress:** a staged animation labeled with real stages ("Choosing colors", "Drawing Grandma", "Checking it", never invented percentages), the existing Progress component, and a time estimate. At 25 seconds show "Taking longer than usual, keep going or choose a ready-made design". At 60 seconds offer "Send this to my phone and I'll collect it later" (kiosk to phone handoff) or fall back to Quick pick.
4. **Pre-generated library (the template pack):** 60 to 120 fronts = occasions x 6 to 8 styles from the style library, each pre-rendered at 2K once, QA-checked, human-curated (cost about $0.07 per image incl fees and rerolls, so under $15 total at base; the real cost is the art direction time, 10 days in P1). Each template is stored as art plus a layout slot for the recipient name, drawn by `pdf-lib` on the device with the print fonts, so personalization is deterministic text, not generation.
5. **Make it yours** changes the front art using a template as a style reference plus a saved Person's identity sheet. Render fallback chain and cost caps are the existing server logic.
6. **Totally custom** is the slow path (40 to 90 s). It is offered with an explicit time estimate and the phone handoff. It is the path for customers who linked an account.
7. **Message generation:** Sonnet with the brief, 2 to 4 seconds, three options; if the call times out at 8 seconds, show curated messages from the knowledge base (the `card_copy` call is $0.0054 measured).
8. **Cache what repeats:** common message variants by occasion and tone cached server-side for Quick pick, and pre-warm the model route when the attract screen is touched.

Target: Quick pick 60 to 90 seconds touch-to-print-start; Make it yours about 120 seconds; Totally custom 180 seconds or deferred to phone.

## 5. Connectivity and offline

| State | Behavior |
|---|---|
| Online | Full |
| Degraded (high latency) | Skip AI image paths; Quick pick only; canned messages if the message call fails |
| Offline | Template pack, fonts and canned messages are cached locally; browsing and previewing work; **sales are disabled** (payment cannot be authorized, and Stripe's unattended mode needs connectivity [U]); screen shows "Cards are on pause, back soon" and does not take input it cannot honor |
| Print succeeded but upload of the sale record failed | Agent holds the signed order record in local storage and retries; reconciliation job in the cloud flags any gap |

Primary link wifi or Ethernet; LTE router as backup in Tier B (03). Each kiosk heartbeats every 30 seconds.

## 6. Print path and job reliability

- The cloud (not the browser) produces the **print job**: the imposed PDF (back / front / inside, 10.25 x 7.25 in), the ICC profile id, the paper profile, the job id. The browser never holds the file. The agent downloads it with the device token after the payment webhook confirms.
- **Job state machine** in the agent (persistent, survives power loss): `paid → fetched → queued → feeding → printing → folding → dispensed → confirmed` or `failed(reason)`. The agent reports each state to the cloud.
- **Charge and print consistency:** authorize the card, print, then capture only on `dispensed` confirmed by a sensor. If printing fails twice, void the authorization and show an apology with a free retry code (the CX rule: recovery before apology). If the card printed but the confirmation was lost, the customer is charged once and the job is idempotent on `job_id`.
- **Reprint** is allowed once from the same session using the stored job id; afterwards a service code is required.
- **Stock tracking:** a per-device counter of sheets and envelopes, reconciled with a low-stock sensor, blocks sale at zero or on "paper path blocked".
- **Color:** one ICC profile per printer-paper pair, produced at assembly with a spectrophotometer [U], rendering intent perceptual with black-point compensation; the profile id is part of the job. The art library is soft-proofed against each profile in P1 and any style that clips badly (saturated oranges, deep teals) gets a "kiosk-safe" prompt tweak or is hidden on that engine. Compare printed kiosk output against the online printers' output in P0 to keep the brand consistent.
- **Imposition** (new layout code, not built): one function takes `CardSpec` and produces the duplex sheet, with a border-safe variant. Reuse `layoutCard` for panel contents.

## 7. Payment flow

- **Tier B:** Stripe Terminal with the **Verifone UX700 unattended reader** (US generally available [V], https://docs.stripe.com/terminal/unattended-readers). Create the Stripe Terminal `Location` as `UNATTENDED` and `OFF_PREMISE` (fully remote) or `ON_PREMISE` (staffed store). Only Visa, Mastercard, American Express and Discover work unattended [V]. Stripe requires the mandatory disclosures, signage and a physical or digital receipt [V].
- **Tier A:** attended-style reader such as the S700 or WisePOS E (the latter reported to be discontinued in early 2027 [S]) with the server-driven integration [V: https://docs.stripe.com/terminal/payments/setup-reader/bbpos-wisepos-e]. Tap, chip and wallets work. "Tap to Pay on phone" is a phone feature for attended use and is not a kiosk answer [U].
- **Tier C:** the retailer's till takes payment against a GreetHub SKU or a code; GreetHub gets a webhook (retailer API, or a prepaid voucher model, TBD with the retailer). No GreetHub reader.
- **Receipts:** email address entered on screen or QR to a hosted receipt page; no paper receipt printed in v1 unless the retailer demands it.
- **Price display:** price and sales tax shown before the tap. Tax: see 06.
- **Fee model:** card-present rate 2.7% + 5 cents per Stripe Terminal [S: https://www.techradar.com/reviews/stripe-terminal-review, undated, verify]. For the CFO, base is 2.7% + $0.05, bad case 2.9% + $0.30.
- **PCI:** the reader encrypts the card (WisePOS E is "P2PE ready" [V]); the kiosk app never sees card numbers. The likely questionnaire is the P2PE or SAQ-lite type [U]; confirm with Stripe and a QSA only if needed. Do not log anything from the payment step.

## 8. Device management

| Need | Design |
|---|---|
| Identity | Per-device certificate and token issued at provisioning; token rotates every 24 h; revocable in the registry |
| Remote update | The agent pulls signed releases (staged rings: lab → pilot unit → fleet); the web UI updates by deploy; rollback by pinned version; updates only between 02:00 and 05:00 local when idle |
| Monitoring | Heartbeat, printer status, toner/ink and stock levels, temperature, door and tamper events, network quality, last sale; alert rules (no heartbeat 10 min, jam, low stock, 3 failed prints in 1 hour) via the existing observability stack |
| Logs | Structured logs, no customer text, names or images; 14 days retention; ship over HTTPS |
| Remote control | Soft reboot, hard reboot through the network PDU, disable selling, remote screenshot of the **attract screen only** (never during a session) |
| Fleet dashboard | New internal page: status, sales, cards per day, error rate, stock, cost per card, service tickets. Data lands in the Head of Data's Postgres analytics schema (`docs/data/02-architecture.md`) with a `device_id` dimension |
| Tools | Build vs buy: an off-the-shelf MDM or kiosk management service (about $5 to $20 per device per month [U]) for OS control, plus our own agent for the app. Decide in P1 |

## 9. Privacy wipe

- No customer photos at the kiosk (02, section 7). Text typed (names, messages) is held only in the session object in memory and server-side until the session closes or expires.
- On session end the agent restarts the kiosk browser with a fresh profile: no cookies, local storage, caches, form autofill; temp files for the print job deleted after confirmation; the print spool is purged (CUPS job history off).
- Preview images are served with `Cache-Control: no-store`.
- Guest cards are retained server-side 24 hours only for "save to my account"; unclaimed cards purge automatically. This must be added to the retention schedule in `docs/data` and `docs/legal/05` (draft policies) before launch.
- Printed output cannot be wiped; the cabinet shows a note "Your card prints the words you typed. Take it with you."
- A rear-facing service mode disables the touch UI with a physical key switch; nothing else shows admin.
- No camera, no microphone, no analytics beacons from third parties on kiosk pages; first-party events only with the rules in the data architecture.

## 10. Accessibility

- Physical: ADA 2010 reach range for an operable part is 15 in minimum to 48 in maximum above the floor (forward reach) [S: https://www.access-board.gov/ada/guides/chapter-3-operable-parts/]; obstructed-reach limits differ and I could not verify them. Put the screen, card reader, headphone jack and output slot in that band, with 30 x 48 in clear floor space [S]. Output chute at 15 to 48 in. Have an accessibility consultant review the enclosure in P3. Self-service machine rules (speech output, tactile keys) in the 2010 Standards (for example section 707 for ATMs and fare machines) may be used as a model even if not strictly applicable [U].
- Screen: tilt screen toward seated users; text size toggle (Large Type mode) at first screen; high-contrast option; 56 px targets; no timeouts shorter than 20 s without a warning and "need more time" button.
- Audio: headphone jack with a screen-reader path (spoken prompts for every control) [U, to be designed]; tactile keypad as a fallback for the touchscreen.
- WCAG 2.2 AA applies to the UI (the web assessment in `docs/legal/03` already targets it).
- Multilingual: English and Spanish at launch of the pilot; the language chips at the top of the attract screen; messages generated in the chosen language [U]; the Greet Guide supports other languages in principle but the QA and IP-safety checks must be run per language before enabling it.

## 11. Abuse prevention at a public screen

- **Moderation:** all typed text through the same moderation and IP-safety pass as the web (`docs/legal/01`, 06). Profanity and slur filter on on-screen text that will print on the card; reject or sanitize before render. The existing output vision check stays on.
- **No franchise names:** the style offer layer ("closest look") works unchanged; the kiosk never reveals the rewrite rules.
- **Cost caps per device:** a daily model spend cap per kiosk (for example $15 base, 3x normal), a per-session cap (for example 4 renders, 1 totally custom), a per-hour cap, enforced in the cloud ledger (not the device). Hit the cap and the kiosk drops to Quick pick. Alert at 70%.
- **Free preview abuse:** one preview before pay-to-print is the existing rule; at a kiosk the "preview" is full resolution on screen and non-copyable (no save, no screenshot UI). Watermark the on-screen preview until paid, as the guest proof does.
- **Bots and kiosk spoofing:** device token, mTLS and an allow-list of device IDs on kiosk routes; the web app rejects `/k` traffic without a device cert header.
- **Print abuse:** no print without payment confirmation; print job signing; rate limit failed payments per device.
- **Physical:** tamper switch, camera-free (so no CCTV obligation from us, but the host may have its own CCTV).

## 12. Cost per card and cash flow (software side)

Model cost per card sold, base about $0.20 (range $0.08 to $0.55), derived from measured per-call costs (`finance/measured_costs.json`: card front plus inside $0.2479, 2K render $0.0609, card copy $0.0054) times the 5.5% OpenRouter fee (`finance/README.md`), plus intake, plus abandoned sessions at 0.8 of a sold session. Mix assumed 50% Quick pick ($0.02), 35% Make it yours ($0.14), 15% Totally custom ($0.36). Hosting, Supabase and Vercel are largely fixed; add about $10 per device per month for allocation (05).

Cash flow: card authorization at start of print, capture at confirmed dispense, payout from Stripe in the standard schedule [U], retailer share paid monthly in arrears from net sales ex-tax. Hardware is paid before revenue (07 monthly cash profile).

## 13. Dependencies on other teams

CTO: Supabase auth and DB-backed ledger first; device registry; kiosk route group. Security: threat model for an unattended device (new item), pen-test the link and device-code endpoints. Data: new `device_id` fields and 24-hour guest retention. Legal: public-device privacy language and ADA review (06). CX: kiosk screen designs against the standards.

## 14. Status against the built app (checked 2026-10-13)

Nothing kiosk-specific exists in `app/` (no kiosk route, no `/api/kiosk`). What the web app needs first, most blocking first:

1. **Durable data and auth:** sessions, device registry, link codes and per-device ledgers need Supabase (SEC-18). Today every record is a local JSON file.
2. **A card that can be bought and printed:** the signed-in card path, approval page, full-res render, `layoutCard` call and card print PDF are not built; the print step can print a model-written message instead of the approved one (`pipeline/src/stages/copy.ts`); `messageFitted:false` is never read. A kiosk prints in front of the buyer, so all three must be fixed.
3. **Imposition for a local printer:** `layoutCard` emits two separate 5.25 x 7.25 in pages (front, inside right). A kiosk needs one duplex sheet per card (section 6). Not built.
4. **Render latency:** the guest preview is one blocking 30 to 90 second request with a fake progress bar, and live renders cannot run on Vercel without the hosted queue (SEC-21). The template pack of pre-generated fronts (section 4) does not exist.
5. **Payment:** only Stripe Checkout (web redirect) exists, and it has not run against a Stripe sandbox. No Stripe Terminal, no authorize-then-capture-on-dispense.
6. **Public-terminal abuse:** the guest cap is a cookie (wiped every kiosk session, so unlimited previews), the per-instance counter is not durable, and the rate limit keys on the left-most `x-forwarded-for` (spoofable, and one store IP would throttle a busy kiosk). Needs a device token, durable caps (SEC-10) and the moderation pass on printed text.
7. **Kiosk mode itself:** locked full-screen browser, inactivity timeout and profile wipe (sections 3 and 9), device management. None built; all P1 scope.
