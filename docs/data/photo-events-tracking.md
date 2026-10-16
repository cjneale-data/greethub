# Photo cards and events: tracking, KPIs and consent tiers

Owner: Head of Data. Version 2026-10-15. Status: PROPOSED (wave 1). Nothing in this file is in `tracking-plan.json` yet.

Read for this: `docs/products/photo-cards-and-events-plan.md` (s4, s7, s8), `docs/products/photo-events/pm-roadmap.md` (s2, s5), `docs/cto/photo-events-architecture.md` (s2, s3, s6), `docs/finance/photo-events-pricing.md` (s5, s9), `docs/cx/07-photo-events-ux.md` (s2, s4), `app/lib/collage/types.ts`, `app/lib/recipients/types.ts`, and the existing data docs `01-tracking-plan.md`, `04-kpis-and-dashboards.md`, `06-data-governance.md`. All earlier rules still apply: server-side first, no free text or identifiers in properties, every event has an owner, class, tier and retention, and deletion reaches every row.

Phase tags follow the PM roadmap: **P1** holiday photo card (ship to me), **P2** save the dates, addresses, mail-for-me, **P3** invitations, event pages, RSVP.

## 1. What is new about the data here

1. **Third-party personal data.** Recipient lists and guest lists are about people who never signed up and never agreed to anything. The customer gives them to us so we can do one job. That data stays in the service stores (`recipient_lists`, `guests`, `rsvps`) and **never enters analytics, ml, marketing, ad audiences or email lists**. Analytics sees only counts.
2. **Guests act without an account.** An RSVP comes from a person with no `subject_id` and, by design, no cookie. Guest-side events are recorded on the server and keyed to the **host's** `subject_id` plus an opaque `event_page_id`. So when the host deletes the event or the account, `privacy.delete_subject()` removes the analytics rows too, as the CTO's ownership model already does for the `rsvps` store.
3. **Batch numbers.** One order line is 10 to 300 cards. Cards and orders are different units. Every KPI below says which one it counts.
4. **Even more children's photos.** Photo intake is reused from books (`photo_upload_started`, `photo_uploaded`, `photo_upload_blocked`, `photo_deleted`, `photo_purge_run`), with the same C4 and Never rules. No photo, crop, face box or thumbnail ever goes into an event.

## 2. Classes and tiers added for this project

### 2.1 New sensitivity class

| Class | Name | Examples | Analytics/ml? |
|---|---|---|---|
| **C2-TP** | Third-party personal data | recipient household names, first and last names, postal addresses, guest emails, RSVP names, RSVP notes, meal picks, party size per guest, per-guest tokens, event slugs, event titles, venue names and addresses, host-written meal choice labels, IP hash on the RSVP form | **no, never** |

C2-TP sits beside C2 and C3, but no consent the customer gives can move it into T1 or T2, because the data subject is someone else. The guest's own RSVP note is guest-written text (C3 in form, C2-TP in kind). It is never a T1 sample.

### 2.2 Consent tiers for guest and recipient data

| Tier | What it covers | Who can grant it | Use |
|---|---|---|---|
| **G0 Service only** (always, and the only tier) | Storing the list or RSVP, printing addresses, sending to the mailer, address validation through the validator vendor, reminder emails the host sends, host CSV export | Implied by the customer's request; the host confirms "I have permission to use these addresses" at import (attorney to word this) | Doing the job, support on that order, deletion, abuse checks on that event |
| **G-never** | Marketing to recipients or guests, adding them to any GreetHub list, lookalike or custom ad audiences, enrichment, resale or sharing, cross-customer matching ("3 customers know this address"), training or evals, appearing in analytics in any form | No one. Not the host, not the guest, not a membership | Blocked by design: the stores are server-only (RLS on, no policies), analytics ingest rejects the property names in s6, and the ml schema has no column that could hold them |

Things that follow from G-never:
- **No growth loop from guests.** An event page or RSVP confirmation never asks the guest to sign up, never sets a marketing cookie and never collects a guest email for us. The "Made with GreetHub" footer on Free event pages is a plain link with `utm_source=event_page` and no guest data; it counts as `referral` in `A2_channel_mix`. If a guest later signs up on their own, nothing links them back to the guest record.
- **Reminder and RSVP emails are transactional for the host**, not marketing. They go only to guests the host added, only from that host's event, are capped per day (CTO s6) and carry a one-click "stop emails about this event" link. `email_sent` records `audience: guest` and a template id, never the address.
- **Suppression list.** When a guest stops emails, we keep a salted hash of the address scoped to that event, so the host can't re-add them. It's a C2-TP record kept until the event is deleted. Whether we need a global "never email me from GreetHub" list kept longer is an ATTORNEY question (CAN-SPAM).
- **Customer's own content stays on the customer tiers.** The greeting and the year-in-review letter are the customer's text (C3). They can become T1 samples only after the T1 scrub, and the scrub must remove any recipient or child names. Holiday letters are full of children's names, so they get the stricter "minors-possible" flag and are **not T2-eligible** (same gate as books).
- **Photos and faces.** The v1 auto-crop uses sharp's attention (saliency) crop, which stores nothing about faces. If a model-based face detector is added later (CTO s4.2, plan s4.3 "faces kept in frame", "eyes open" ranking), its output is face geometry, class C5: compute it in memory for the crop, never store it, never log it, never measure it in analytics. That change needs the attorney first (biometric laws such as Illinois BIPA, Texas CUBI). ATTORNEY.

### 2.3 Retention for the new stores (proposal; Privacy ops sets the numbers)

| Data | Class | Proposed retention | Deletion path |
|---|---|---|---|
| Photo sets | C4 | Existing 90-day purge after the order is final; unordered drafts 30 days | `purgeExpiredPhotos` generalised (CTO s3) |
| Recipient lists (saved address book) | C2-TP | Until the customer deletes the list or the account; lists not used in 24 months are deleted after a 30-day email notice | list delete, `delete_subject` |
| Recipient snapshot on an order | C2-TP | Order delivered + 60 days (reprint window), then scrubbed to counts | retention job |
| Mailer per-recipient status | C2-TP | Same as the snapshot; afterwards only counts survive in `batch_jobs` | retention job; request vendor deletion |
| Events, guests, RSVPs | C2-TP | Event date + 90 days, then deleted (host is warned 14 days before and can export); a deleted event goes at once | event delete, retention job, `delete_subject` |
| RSVP form IP hash | C2-TP | 30 days (rate limits and abuse only) | retention job |
| Analytics events in this file | C0/C1 | Behaviour 395 days, system 730 days, as today | `retention_days` per event |

## 3. Events

Columns: **Src** server, worker, webhook or client. **Ret** retention in days. All behaviour events are **C1** at tier **T0** unless the row says otherwise. No property holds a name, address, email, slug, title, text, file name or meal label.

### 3.1 Existing events to extend (no new event)

| Event | Change |
|---|---|
| `creator_started`, `template_clicked`, `cart_item_added`, `cart_item_removed`, `order_created`, `proof_approved`, `proof_viewed` | `product` enum gains `photo_card`, `save_the_date`, `invitation`, `rsvp_card`, `details_card` (matching `Template.product`) |
| `cart_item_added`, `order_created` | Add `quantity|int` (cards on the line), `size_id|enum(flat_5x7,flat_4x6,flat_3_5x5)`, `envelopes|enum(blank,return_address,addressed)`, `delivery_mode|enum(ship_to_me,mail_for_me)`, `paper|enum(matte,pearl,recycled)`, `price_band|enum(cfo bands)`, `has_ai_background|bool` |
| `photo_upload_started`, `photo_uploaded`, `photo_upload_blocked`, `photo_deleted` | Add `context|enum(book,photo_card)`; photo_card uploads carry `design_id` in `creation_id` |
| `consent_recorded` | Add box `recipient_permission` (host confirms permission to use the addresses) |
| `reprint_created`, `refund_issued` | `reason_code` gains `customer_typo`, `checker_missed`, `address_error_customer`, `undeliverable` |
| `email_sent` | Add `audience|enum(customer,guest)`; guest sends carry `event_page_id`, never the address |
| `page_viewed` | `page_type` gains `photo_editor`. Event pages (`/e/...`) **never** run the client collector |
| `content_report_submitted` | `target|enum` gains `event_page` |

### 3.2 New events

| Event | Ph | Src | Owner | Ret | Trigger | Properties | KPIs |
|---|---|---|---|---|---|---|---|
| `design_started` | P1 | server | Card eng | 395 | A Design is created from a template | `product`, `template_id`, `template_version|int`, `size_id`, `entry|enum(gallery,seo,reorder,account,membership)` | PE6, R4 |
| `design_template_changed` | P1 | server | Card eng | 395 | Customer switches template or size on an existing design | `from_template_id`, `to_template_id`, `size_changed|bool`, `photos_kept|int` | PE19 |
| `photos_auto_placed` | P1 | server | Card eng | 395 | `autoPlace()` fills the slots | `photo_slots|int`, `photos_available|int`, `slots_filled|int`, `crop_method|enum(center,attention,face_model)` | PE1, PE19 |
| `design_edit_session_ended` | P1 | server | Card eng | 395 | Editor autosave closes a session (idle 30 min or Review pressed). One row a session, not one a click | `photos_swapped|int`, `crops_adjusted|int`, `text_slots_edited|int`, `font_changes|int`, `auto_crops_kept|int`, `duration_s|int`, `ended_by|enum(review,idle,exit)` | PE19, Q9 |
| `photo_quality_flagged` | P1 | server | Card eng | 395 | `photoQuality()` returns a non-ok slot at Review. Enum mirrors `QualityLevel` in `app/lib/collage/types.ts` (the CTO doc's `warn/block` names differ; the code wins) | `level|enum(low,too_low)`, `dpi_bucket|enum(lt150,150_199)`, `slot_role|enum(hero,secondary,back)` | PE7 |
| `proof_check_completed` | P1 | server | Card eng | 395 | Proof checker runs on Review (rules in P1, model later) | `checker_version`, `warnings|int`, `codes|array<enum(name_mismatch,year_wrong,weekday_mismatch,past_date,rsvp_after_event,venue_missing,time_missing,text_overflow,dpi_block)>`, `uses_model|bool`, `cost_usd|decimal` | PE3, U1 |
| `proof_warning_resolved` | P1 | client→server | Card eng | 395 | Customer presses "Fix it" or "It's right" on a warning (CX s4) | `code|enum(above)`, `action|enum(fixed,dismissed)` | PE3, PE13 |
| `proof_revision_made` | P1 | server | Card eng | 395 | Design changes after its first proof was shown. Counts what changed, not the text | `revision_no|int`, `changed|array<enum(photo,crop,text,template,size,back)>`, `triggered_by|enum(checker_warning,own_review,support)` | PE2 |
| `proof_typo_attested` | P1 | server | Card eng | 730 | Customer ticks "I checked names and dates" | `warnings_open|int`, `dismissed|int` | PE13 |
| `recipient_list_created` | P2 | server | Shop eng | 395 | New list saved | `source|enum(manual,csv,vcard,google)` | PE8 |
| `recipient_import_previewed` | P2 | server | Shop eng | 395 | Import parsed and preview shown (`ImportPreview`) | `source`, `rows|int`, `ok|int`, `error|int`, `duplicate|int`, `skipped|int`, `columns_mapped_auto|bool` | PE8 |
| `recipient_import_completed` | P2 | server | Shop eng | 395 | Customer confirms the import | `source`, `rows_saved|int`, `rows_fixed_by_hand|int`, `list_size|int` | PE8 |
| `address_validation_completed` | P2 | worker | Shop eng | 730 | Validator run over a list or order snapshot | `checked|int`, `valid|int`, `corrected|int`, `undeliverable|int`, `provider|enum(fake,usps,lob,postgrid)`, `cost_usd|decimal` | PE9, U5 |
| `recipient_list_deleted` | P2 | server | Shop eng | 730 | List deleted by customer or retention job | `by|enum(customer,retention,account_deletion)`, `list_age_days|int` | P1, PE18 |
| `mailing_status_summarized` | P2 | webhook | Fulfillment | 730 | Mailer reports per-recipient states; we store counts per order line | `line_qty|int`, `in_production|int`, `mailed|int`, `delivered|int`, `returned|int`, `undeliverable|int` | PE9, F1 |
| `postage_reconciled` | P2 | batch | Finance ops | 730 | Mailer invoice matched to postage collected on the order | `collected_cents|int`, `paid_cents|int`, `diff_cents|int` | PE21 |
| `event_page_created` | P3 (P2 for save the dates) | server | Card eng | 395 | Host creates an event page | `event_kind|enum(save_the_date,wedding,party,shower,other)`, `plan|enum(free,event_plus,included)`, `has_password|bool`, `invited_only|bool`, `meal_choices|int`, `has_rsvp_deadline|bool`, `lead_days|int` (event date minus today) | PE12 |
| `event_page_published` | P3 | server | Card eng | 395 | Status draft → published | `guests_invited|int`, `paper_too|bool` | PE5 |
| `event_page_viewed` | P3 | server | Card eng | 395 | Server render of `/e/[slug]` that passes the password gate. No cookie, no IP, no user agent kept | `via|enum(guest_link,open_link,qr)`, `is_host|bool` | PE5 |
| `rsvp_submitted` | P3 | server | Card eng | 395 | Valid RSVP stored | `attending|enum(yes,no,maybe)`, `party_size|int`, `has_meal|bool`, `has_note|bool`, `via|enum(guest_link,open_link,qr)`, `days_before_deadline|int`, `after_reminder|bool` | PE5 |
| `rsvp_changed` | P3 | server | Card eng | 395 | Guest edits a reply through their token | `attending_changed|bool`, `party_size_delta|int` | PE5 |
| `rsvp_blocked` | P3 | server | Security | 730 | RSVP rejected | `reason|enum(rate_limit,honeypot,not_invited,closed,wrong_password,validation)` | PE16 |
| `event_reminder_sent` | P3 | worker | Card eng | 730 | Host sends a reminder | `recipients|int`, `bounced|int` (filled later by Resend webhook), `reminder_no|int` | PE17 |
| `event_page_closed` | P3 | server | Card eng | 395 | RSVPs closed by host or deadline | `by|enum(host,deadline)`, `invited|int`, `responded|int`, `yes|int`, `no|int` | PE5 |
| `event_page_deleted` | P3 | server | Privacy ops | 730 | Event and its guests and RSVPs deleted | `by|enum(host,retention,account_deletion,trust_safety)`, `guests_deleted|int`, `rsvps_deleted|int`, `days_after_event|int` | PE18 |

`array<enum>` is new to the build script. If the owner prefers flat properties, replace each array with `has_<code>` booleans.

Attorney flags on events: `recipient_permission` wording (consent_recorded); whether counts of a host's guests (for example `guests_invited`) are themselves personal data of the host under state privacy laws (my read: yes, treat as C1 and delete with the host, as above).

## 4. KPIs

All KPIs read from the events above plus `payment_succeeded` and fulfilment events. **There is no real data yet:** nothing is built, and every target is the PM's proposal or a guess. "Order" means a paid order containing a photo-events line. "Line" means one product line on it.

| ID | KPI | Definition | Unit | Target / guardrail | Phase |
|---|---|---|---|---|---|
| **PE1** | Photos per order | median and p90 of distinct photos placed in the approved design version (front + back), from `proof_approved` joined to the last `photos_auto_placed` / `design_edit_session_ended` | photos / line | none; feeds storage and moderation cost | P1 |
| **PE2** | Proof edits | mean `proof_revision_made` per approved design; share of approved designs with 0 revisions | revisions / design | watch; a rise after a template change means a template problem | P1 |
| **PE3** | Checker catch and fix rate | warnings per design by code; share `fixed` vs `dismissed` | % | watch per code; a code dismissed > 80% is noisy and gets reviewed by Model evals | P1 |
| **PE4** | Batch size | median and distribution of `quantity` per line by product and band; cards per order | cards / line | CFO guess: 50 holiday, 75 save the date, 100 invitation | P1 |
| **PE5** | RSVP response rate | for closed events with a guest list: `responded / invited`; for open-link events also `rsvp_submitted / distinct guest_link views` | % of invited guests | **≥ 70%** (P3 primary) | P3 |
| **PE6** | Proof-to-order | paid photo-events lines / `design_started` in the same cohort, 14-day window | % of started designs | **≥ 40%** (P1 primary) | P1 |
| **PE7** | Low-resolution rate | designs with any `photo_quality_flagged` level `low`; share `too_low` (blocks approval) | % of designs | watch; > 20% means intake guidance must change | P1 |
| **PE8** | Import success | `rows_saved / rows` in `recipient_import_*` | % of rows | **≥ 90%** | P2 |
| **PE9** | Undeliverable rate | `(undeliverable + returned) / mailed` | % of mailed cards | **≤ 2%** | P2 |
| **PE10** | Mail-for-me share | lines with `delivery_mode = mail_for_me` | % of lines | **≥ 15%** (P2 primary pair); CFO guess 15% | P2 |
| **PE11** | Addressed share | lines with `envelopes = addressed` | % of lines | CFO guess 70% | P2 |
| **PE12** | Event Plus attach | events with `plan = event_plus` among digital-only events | % of events | CFO guess 25% | P3 |
| **PE13** | Typo reprints | `reprint_created` with `customer_typo` or `checker_missed` / lines | % of lines | **0 from `checker_missed`**; reprint or complaint ≤ 3% overall | P1 |
| **PE14** | Holiday on-time | lines delivered by Dec 23 / holiday lines ordered by the cut-off | % of lines | **≥ 95%** | P1 |
| **PE15** | Contribution per order | revenue − print − envelopes − shipping − AI − Stripe − reprint allowance − support, postage excluded both sides | $ and % | **≥ 25%** at real print cost | P1 |
| **PE16** | Abuse | `content_report_submitted` on event pages per 100 published events; `rsvp_blocked` per 100 RSVPs | rate | **≤ 1 report / 100 events** | P3 |
| **PE17** | Reminder bounce | `bounced / recipients` on `event_reminder_sent` | % | **≤ 2%** | P3 |
| **PE18** | Guest data on schedule | events past date + 90 days with no `event_page_deleted`; lists past their retention with no delete | count | **0** (dashboard D10) | P2, P3 |
| **PE19** | Auto-place acceptance | `auto_crops_kept / slots_filled`; template switches per design | % | watch; feeds the crop eval | P1 |
| **PE20** | Contacts per 100 orders | `support_contact_created` on photo-events orders | per 100 | **≤ 20** | P1 |
| **PE21** | Postage match | orders with abs(`diff_cents`) > 100 | count | **0** (within $1 an order) | P2 |

Phase gates (PM s5): a phase goes public only after ≥ 20 orders (P1) or ≥ 50 (P2, P3). Below that, report counts and say the numbers are not yet reliable. At a 30-order soft launch, PE6 has a 95% interval of roughly ±17 points, so "40%" can't be told apart from 25% or 55%. Decide on usability findings and say so, as the PM's experiment rule asks.

Dashboard: add a "Photo and events" tab to D2 (funnel) and D5 (fulfilment), and put PE18 on D10 (privacy health). No tile may show a slug, title or any guest or recipient field.

## 5. Inputs for the CFO model (Inputs section 19)

Each GUESS row in `docs/finance/photo-events-pricing.md` s9 gets replaced by a measured value once the gate in s4 is met. Until then the CFO's guesses stand.

| CFO input | Measured by | Source | Replace when |
|---|---|---|---|
| Average cards per order by product | PE4 | `order_created.quantity` | ≥ 20 paid lines of that product |
| Addressed share / mail-for-me share / premium paper share / AI background share | PE11, PE10, `paper`, `has_ai_background` | `order_created` | ≥ 20 lines |
| RSVP and details card attach | lines of `rsvp_card` / `details_card` per invitation order | `order_created` | ≥ 20 invitation orders |
| Event Plus on digital-only events | PE12 | `event_page_created.plan` | ≥ 50 events |
| Holiday order timing (share Dec 1–10) | `payment_succeeded` by day | commerce | after the season |
| Reprint and typo allowance (4% GUESS) | PE13 plus `reprint_created.extra_cost_cents` | fulfilment | ≥ 50 lines |
| Support per order ($0.75 GUESS) | PE20 x CX cost per contact | support | ≥ 20 orders |
| Photo ranking, proof check, AI background cost | `cost_usd` on `proof_check_completed`, generation events | OpenRouter `usage.cost` | first 20 real runs (mock runs excluded) |
| Email per send | `event_reminder_sent.recipients` x Resend invoice | finance ops | first invoice |
| Print, addressing and postage per card | printer and mailer invoices, `postage_reconciled` | finance ops | first invoice |
| Proof-to-order (conversion) | PE6 | as defined | ≥ 20 orders |

Hand-off: every month Head of Data sends the CFO one CSV (`metric, product, value, n, window, status MEASURED|GUESS`). If n is below the gate, the row stays GUESS.

## 6. Guardrails for the build script and ingest (wave 2)

- **Deny-list additions** (property names rejected): `household`, `recipient`, `guest_name`, `guest_email`, `address`, `street`, `city`, `postal`, `slug`, `token`, `event_title`, `venue`, `meal`, `meal_choice`, `note`, `rsvp_name`, `greeting`, `letter`, `face`, `bbox`. Counts like `meal_choices|int` and booleans like `has_meal` are allowed by name in an explicit allowlist.
- `event_page_id` and `design_id` are internal opaque ids. The public slug and guest tokens are access credentials and never appear in analytics, logs or error reports (Security to confirm the logger redacts `/e/` paths and `?g=`).
- `/e/[slug]` loads no third-party script, no `gh_aid` cookie, no client collector.
- Per-recipient or per-guest events are not allowed. Every guest- or recipient-related event is an aggregate or keyed to the host.

## 7. What I could not settle

- `array<enum>` support in `tools/build-tracking-plan.mjs`, and adding these events to `events-b.mjs`, the schema seed and `data-inventory.json`. This task allowed only this file, so `tracking-plan.json` is unchanged and `test-schema.mjs` was not run against these events.
- Retention numbers in s2.3 are proposals. Privacy ops owns them (`docs/privacy-ops/photo-events-data.md` did not exist on 2026-10-15).
- No legal doc for this project existed yet (`docs/legal/photo-events-legal.md` not found). Attorney items: the recipient-permission wording; the guest suppression list; whether a host's guest counts are the host's personal data; any face detection.
