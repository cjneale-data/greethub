# 01. Tracking plan

Owner: Head of Data. Machine-readable twin: `tracking-plan.json` (the build script `tools/build-tracking-plan.mjs` generates both this event catalogue and the JSON from `tools/events-a.mjs` and `tools/events-b.mjs`, and fails on any violation of the rules below). Date: 2026-10-10.

Scope: 95 events (92 at launch, 3 after), only 11 fired from the browser. Everything that can be recorded on the server is recorded on the server. This replaces the 13-event list in `docs/cmo/ux-spec.md` section 12 (mapping at the end of this file).

## 1. Principles

1. **Server-side first.** The browser is untrusted, blocked by extensions, and sits on pages that show children's names. A fact is client-side only if it happens purely in the browser (page view, banner choice, viewing time, rating click).
2. **Every event has a sensitivity class** (C0 to C5, section 3) and a minimum consent tier (T0 to T2). The ingest function rejects events whose name is not in `analytics.event_definitions`, and the table has a CHECK that only C0/C1 can be stored.
3. **No free text, no content, no identifiers in properties.** Lengths, flags, controlled reason codes and enumerated values only. The build script rejects property names such as email, name, address, phone, ip, filename, caption, zip, transcript.
4. **One fact, one event, one owner.** Counts of purchases come from `payment_succeeded` (Stripe webhook) and nothing else. Page views never imply funnel steps.
5. **Deletion must reach every event.** Every row carries `subject_id` or `anonymous_id` linked to one, so `privacy.delete_subject()` can remove it (03-schema.sql).
6. **Events feed named KPIs.** No event without a KPI in section 8 of `04-kpis-and-dashboards.md`.

## 2. Naming conventions

| Item | Rule | Example |
|---|---|---|
| Event name | `snake_case`, object then past-tense verb, no vendor or UI words | `model_sheet_approved` |
| Property | `snake_case`, unit suffix, booleans `is_/has_`, ids end `_id` and are opaque | `cost_usd`, `latency_ms`, `has_note` |
| Money | customer money in integer cents (`_cents`), model cost in decimal USD (`_usd`) from OpenRouter `usage.cost` | `total_cents` |
| Time | UTC ISO-8601 `occurred_at` (when it happened), `received_at` (collector) | |
| Enums | lower_snake_case closed lists; unknown values rejected | `charge: free_redo` |
| Versioning | `schema_version` per event; additive = same version, rename/semantic change = bump and dual-write 90 days | |
| Dedupe | `event_id` UUIDv7 generated where the fact happens; webhook events use the Stripe/printer event id hashed to a UUID | |
| Page ids | `p1..pN`, `cover`, `back`, `card_front`, `card_inside` as in `PAGE_ID` | |

## 3. Sensitivity classes

| Class | Name | Examples | Allowed in analytics/ml? |
|---|---|---|---|
| C0 | System/operational | job ids, model names, cost, latency, status codes, printer states | yes |
| C1 | Pseudonymous behaviour | event stream keyed by subject_id/anonymous_id, enumerated brief choices, order facts without identifiers | yes |
| C2 | Personal identifiers | email, name, address, phone, IP, user agent, character first names, recipient names | no |
| C3 | User-authored or user-derived text | story idea, memory, inside jokes, card message, chat turns, free-text feedback, story text with names | only ml.text_samples (T1+, scrubbed) |
| C4 | Likeness (restricted) | uploaded photos, identity sheets, model sheets, any generated art derived from a photo of a person, anything depicting a minor | no |
| C5 | Prohibited: never collected or derived | face embeddings, face geometry, face-match results, age/gender/ethnicity inference from images, EXIF GPS, card numbers, session replay of creator pages, keystroke capture | no |

Every property inherits class C1 unless the event is C0. Class C2-C5 data never enters an event.

## 4. Consent tiers and gating

| Tier | Name | What is collected | UI |
|---|---|---|---|
| T0 | Operational (always on) | C0 and C1 events in the tracking plan; cost/latency/QA logs; order and fulfilment facts; consent and deletion ledgers; enumerated brief choices and counts/lengths of free text; reason-code feedback tied to a generation | none beyond the privacy notice; honour account-level analytics opt-out and GPC for any third-party tool |
| T1 | Help improve GreetHub (opt-in) | scrubbed story/message text and edit before/after pairs (ml.text_samples); free-text feedback after PII scrub; chat user turns after PII scrub; used for: prompt design, evals, quality scorer for TEXT, recommendations | Settings toggle plus one unticked line at proof approval; wording to attorney |
| T2 | Allow training use (opt-in, blocked) | only items passing every gate in ml.training_candidates: T2 consent + legal sign-off + PII scan + moderation clean + NOT photo-derived + NOT likeness + NOT minors-possible | not shown at launch |
| T-never | Never collected or used for training | nothing | n/a |

Gating in code (03-schema.sql `analytics.ingest_event`): events with `min_consent_tier` above the subject's tier are dropped at the collector, not stored. The full tier policy is in `06-data-governance.md` and the training-eligibility gates in `05-model-improvement-roadmap.md`.

Client collector rules:
- No cookie or request to any analytics endpoint until the banner allows it, except the first-party strictly operational fields (CSRF/session cookie already required by auth). GPC signal is treated as "reject" for marketing and for any third-party tool.
- On `creator`, `proof`, `cart`, `checkout`, `account` pages no third-party script loads at all (legal 06 req 44). The first-party collector there sends only the allowlisted client events (page_viewed with coarse page_type, proof_viewed, rating_submitted, cart_viewed).
- No session replay, heatmaps with DOM text capture, autocapture of clicks/inputs, or form field value capture, anywhere.

## 5. Identity and stitching

| Id | What | Lifetime | Where |
|---|---|---|---|
| `anonymous_id` | random UUID, first-party cookie `gh_aid`, set only once analytics is allowed | 365 days | events, sessions |
| `session_id` | UUID, 30 minute inactivity | session | events, sessions |
| `subject_id` | random UUID minted for each Supabase user (anonymous or real) in `privacy.subjects` | until deletion | events, facts, ml |
| `auth_user_id` | Supabase uid | until deletion | `privacy.subjects` only |

Stitching rules (all in SQL: `privacy.link_anonymous`, `privacy.merge_subjects`):
1. Guest opens the creator: Supabase anonymous sign-in gives an auth uid; the server creates a `subject_id` (guest) and links the current `anonymous_id`.
2. Guest signs up: the anonymous user is upgraded in place (PLAN.md), same uid, same subject; `is_guest` becomes false, `signup_completed` fires with `guest_draft_carried`. Earlier events already carry the subject.
3. Guest logs into an existing account: `merge_subjects(guest, existing)` retargets all rows, then deletes the guest subject.
4. Pre-subject client events (landing page views) carry only `anonymous_id`; they are back-filled with `subject_id` when the link is made.
5. No fingerprinting, no IP matching, no cross-device guessing. Cross-device exists only through login.
6. Marketing attribution: first-touch is written once to the subject at signup (`attribution_captured`, `signup_completed.first_touch_channel`); last-touch is read from the session at `payment_succeeded`. UTM keys are an allowlist; ad click ids are not stored.

## 6. Server-side vs client-side

| Where | Events | Why |
|---|---|---|
| Client (11) | `page_viewed`, `consent_banner_decided`, `template_clicked`, `signup_prompt_shown`, `signup_started`, `consent_modal_shown`, `photo_upload_started`, `rating_submitted`, `proof_viewed`, `proof_link_opened`, `cart_viewed` | purely browser facts |
| Server route | brief, auth, consent, photo, story, sheet, reroll, proof approval, cart, checkout, support, privacy | validated, trusted, immune to ad blockers |
| Worker | generation, render, QA, spend cap, layout, fulfilment submission | the cost and quality system of record |
| Webhook | payment, refund, dispute, printer status, email unsubscribe | the source of truth is the vendor |
| Batch | abandoned-brief/sheet derivations, retention job, training registry | computed, never emitted by the app |

Client transport: `POST /api/t` with a batch of up to 20 events, validated by the same plan JSON, dropped if the visitor has not allowed analytics. The Next.js route handler is the only receiver; no third-party SDK is required at launch (02-architecture.md).

## 7. Property-level privacy rules (enforced by the build script and ingest)

- Never a property: email, any name (user, recipient, character), address (state and country allowed), phone, IP, user agent string, file name, EXIF, free text, prompt text, chat text, story text, URL path or query beyond the UTM allowlist.
- Declared age bands (`baby`..`senior`, `pet`) are user-entered brief fields, recorded as enumerated values for purge and consent logic; they are never inferred from an image and never joined to any image-derived attribute.
- Sizes are bucketed (`bytes_bucket`, `megapixel_bucket`). No image hash or perceptual hash of an upload is stored in analytics.
- `prompt_version_id` identifies a template (no user data). A hash of a rendered prompt exists only in `ml.generation_attempts.prompt_sha256` and is nulled on deletion.
- Reason codes are controlled lists. If the UI has a free-text box the event records `has_note`/`has_free_text` only.

## 8. Event catalogue (generated)

### Acquisition and visit

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `page_viewed` | client | C1 / T0 | CMO | 395 d | A1_visitors, A2_channel_mix, B1_visitor_to_signup | launch |
| `attribution_captured` | server | C1 / T0 | CMO | 395 d | A2_channel_mix, U6_cac_by_channel | launch |
| `consent_banner_decided` | client | C1 / T0 | CTO | 1825 d | P3_consent_coverage | launch |
| `template_clicked` | client | C1 / T0 | CMO | 395 d | A3_template_ctr, R4_template_popularity | launch |
| `creator_started` | server | C1 / T0 | CTO | 395 d | B2_signup_to_start, C1_start_to_purchase, A3_guest_try_rate | launch |

**`page_viewed`** - Route change on any page once analytics is allowed. On pages that show photos or children's names only the first-party collector runs, never third-party tags.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_type` | enum (home, template_gallery, template_detail, product_card, product_book, pricing, faq, seo_occasion, creator, proof, cart, checkout, account, legal, other) | R | Coarse page class, never the raw URL path |
| `template_id` | string | O | Template slug when page_type is template_detail |
| `occasion` | enum (brief.OCCASIONS) | O | Occasion for SEO/occasion pages |
| `referrer_host` | string | O | Host only, no path or query |
| `utm_source` | string | O | Lower-cased, max 40 chars |
| `utm_medium` | string | O |  |
| `utm_campaign` | string | O |  |
| `utm_content` | string | O |  |
| `channel` | enum (meta, pinterest, google_search, tiktok, creator, seo, email, direct, referral, other) | O | Derived from utm/referrer using the CMO CSV channel names |
| `is_entrance` | bool | R | First page of the session |
| `viewport_class` | enum (mobile, tablet, desktop) | R |  |
| `lcp_ms` | int | O | Largest contentful paint |

Note: Query strings are stripped to the allowlisted utm_* keys. Ad click ids (fbclid, gclid) are never stored in analytics tables.

**`attribution_captured`** - First request of a new anonymous_id carrying utm/referrer data; writes first_touch on the session and later on the user.

| Property | Type | Req | Notes |
|---|---|---|---|
| `channel` | enum (channels) | R |  |
| `utm_source` | string | O |  |
| `utm_medium` | string | O |  |
| `utm_campaign` | string | O |  |
| `utm_content` | string | O |  |
| `landing_page_type` | string | R |  |
| `referrer_host` | string | O |  |

**`consent_banner_decided`** - User accepts, rejects or customises the privacy banner on marketing pages, or a Global Privacy Control signal is detected.

| Property | Type | Req | Notes |
|---|---|---|---|
| `analytics_choice` | enum (accept, reject, default) | R |  |
| `marketing_choice` | enum (accept, reject, default) | R |  |
| `gpc_detected` | bool | R |  |
| `banner_version` | string | R |  |

ATTORNEY: Whether first-party operational analytics needs a banner choice at all; GPC handling; equal-weight buttons (legal 06 req 43).

**`template_clicked`** - User clicks a template card in the gallery or on an SEO page.

| Property | Type | Req | Notes |
|---|---|---|---|
| `template_id` | string | R |  |
| `product` | enum (card, book) | R |  |
| `occasion` | enum (brief.OCCASIONS) | O |  |
| `position` | int | O | Grid position |
| `surface` | enum (home, gallery, seo, account) | R |  |

**`creator_started`** - A draft/creation is created (guest or account) and the first intake step renders.

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `entry` | enum (hero_cta, template, seo, saved_person, reorder, account, resume_draft) | R |  |
| `template_id` | string | O |  |
| `is_guest` | bool | R |  |
| `occasion` | enum (brief.OCCASIONS) | O | Prefilled by entry, if known |

### Guest preview

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `guest_preview_requested` | server | C1 / T0 | CTO | 395 d | A3_guest_try_rate, U2_guest_preview_cost | launch |
| `guest_preview_rendered` | worker | C1 / T0 | CTO | 395 d | U2_guest_preview_cost, A3_guest_try_rate | launch |
| `guest_preview_failed` | worker | C1 / T0 | CTO | 395 d | Q5_generation_failure, U2_guest_preview_cost | launch |
| `signup_prompt_shown` | client | C1 / T0 | CMO | 395 d | B1_visitor_to_signup | launch |

**`guest_preview_requested`** - Guest hits POST /api/card/preview (before rate-limit and spend-cap checks).

| Property | Type | Req | Notes |
|---|---|---|---|
| `occasion` | enum (brief.OCCASIONS) | R |  |
| `tone` | enum (brief.TONES) | R |  |
| `art_style` | enum (art_style_ids) | R |  |
| `inside_illustration` | bool | O |  |
| `rate_limited` | bool | R |  |
| `spend_cap_blocked` | bool | R |  |

**`guest_preview_rendered`** - Guest preview image returned to the browser (real or mock).

| Property | Type | Req | Notes |
|---|---|---|---|
| `cost_usd` | decimal | R | From OpenRouter usage.cost |
| `latency_ms` | int | R |  |
| `model_served` | string | R |  |
| `image_size` | enum (1K, 2K, 4K) | R |  |
| `mock` | bool | R |  |
| `prompt_version_id` | string | R |  |
| `qa_pass` | bool | O |  |

**`guest_preview_failed`** - Preview pipeline failed or was blocked.

| Property | Type | Req | Notes |
|---|---|---|---|
| `reason` | enum (model_error, timeout, moderation, rate_limit, spend_cap, other) | R |  |
| `cost_usd` | decimal | O | Spend before failure |
| `latency_ms` | int | O |  |

**`signup_prompt_shown`** - Upgrade prompt (save, photos, high-res) becomes visible to a guest.

| Property | Type | Req | Notes |
|---|---|---|---|
| `trigger_reason` | enum (save_draft, add_photos, hires_proof, reroll, checkout, manual) | R |  |
| `after_preview` | bool | R |  |

### Sign-up and login

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `signup_started` | client | C1 / T0 | CTO | 395 d | B1_visitor_to_signup | launch |
| `signup_completed` | server | C1 / T0 | CTO | 395 d | B1_visitor_to_signup, B2_signup_to_start, NSM_funnel | launch |
| `login_completed` | server | C1 / T0 | CTO | 395 d | R1_repeat_rate | launch |
| `auth_failed` | server | C0 / T0 | CTO | 730 d | B1_visitor_to_signup | launch |
| `age_gate_failed` | server | C0 / T0 | CTO | 730 d | P1_deletion_sla | launch |

**`signup_started`** - User submits the sign-up form or starts Google OAuth.

| Property | Type | Req | Notes |
|---|---|---|---|
| `method` | enum (magic_link, google) | R |  |
| `from` | enum (prompt, header, checkout, creator, other) | R |  |

**`signup_completed`** - Account created and age confirmation + policy acceptance stored (legal 06 req 1, 51). Triggers identity stitching (privacy.link_anonymous).

| Property | Type | Req | Notes |
|---|---|---|---|
| `method` | enum (magic_link, google) | R |  |
| `age_confirmed` | bool | R |  |
| `terms_version` | string | R |  |
| `privacy_version` | string | R |  |
| `guest_draft_carried` | bool | R |  |
| `marketing_email_opt_in` | bool | R |  |
| `first_touch_channel` | string | O |  |

**`login_completed`** - Existing user authenticated.

| Property | Type | Req | Notes |
|---|---|---|---|
| `method` | enum (magic_link, google) | R |  |
| `merged_guest_draft` | bool | R |  |
| `days_since_last_login` | int | O |  |

**`auth_failed`** - Magic link expired/used, OAuth error.

| Property | Type | Req | Notes |
|---|---|---|---|
| `method` | enum (magic_link, google) | R |  |
| `reason` | enum (expired, used, denied, error) | R |  |

**`age_gate_failed`** - 18+ box not ticked at sign-up, or a user states they are under 18 (actual-knowledge handler, legal 06 req 2).

| Property | Type | Req | Notes |
|---|---|---|---|
| `reason` | enum (unticked, self_declared_minor, support_reported) | R |  |
| `account_locked` | bool | R |  |

ATTORNEY: Actual-knowledge handling and what, if anything, may be kept after lockout.

### Brief and Greet Guide chat

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `brief_started` | server | C1 / T0 | CTO | 395 d | B3_brief_completion | launch |
| `brief_field_completed` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, R4_template_popularity | launch |
| `brief_field_edited` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, Q9_intake_friction | launch |
| `brief_completed` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, C6_mix, R4_template_popularity, U1_cost_per_creation | launch |
| `brief_abandoned` | batch | C1 / T0 | Data | 395 d | B3_brief_completion, U3_abandoned_draft_cost | launch |
| `chat_session_started` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, U1_cost_per_creation | launch |
| `chat_turn_completed` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, U1_cost_per_creation, Q9_intake_friction | launch |
| `chat_guardrail_triggered` | server | C1 / T0 | CTO | 365 d | Q9_intake_friction, P5_moderation_rate | launch |
| `draft_saved` | server | C1 / T0 | CTO | 395 d | B3_brief_completion | launch |

**`brief_started`** - First brief field saved for a creation.

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `mode` | enum (chat, form, mixed) | R |  |
| `is_guest` | bool | R |  |

**`brief_field_completed`** - A required or optional brief field becomes valid for the first time (server-validated).

| Property | Type | Req | Notes |
|---|---|---|---|
| `field_key` | enum (brief_field_keys) | R | Structured field name, never its value for free-text fields |
| `value_enum` | string | O | Value only for enumerated fields (occasion, tone, art_style, reading_age, page_count, age_band) |
| `value_chars` | int | O | Length only, for free-text fields |
| `source` | enum (chat, form, template, people, rag) | R | Matches CardDraft FieldSource |
| `seconds_since_brief_start` | int | R |  |
| `order_index` | int | R | Nth field completed |

Note: Recipient name, relationship text, character names, story idea, memory, inside jokes, message wording, include/avoid are free text: only value_chars is recorded.

**`brief_field_edited`** - User changes a previously completed field (brief card edit or chat correction).

| Property | Type | Req | Notes |
|---|---|---|---|
| `field_key` | enum (brief_field_keys) | R |  |
| `source` | enum (chat, form, template, people, rag) | R |  |
| `edit_count_for_field` | int | R |  |
| `chars_delta` | int | O |  |

**`brief_completed`** - missingFields(draft) returns empty; creation becomes generation-ready.

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `occasion` | enum (brief.OCCASIONS) | R |  |
| `tone` | enum (brief.TONES) | R |  |
| `art_style` | enum (art_style_ids) | R |  |
| `reading_age` | enum (0-2, 3-5, 6-8) | O |  |
| `page_count` | enum (24, 32) | O |  |
| `character_count` | int | R |  |
| `has_pet` | bool | R |  |
| `uses_saved_person` | bool | R |  |
| `inside_illustration` | bool | O |  |
| `delivery` | enum (print_mail, ecard, pdf) | O |  |
| `source_mix_chat` | int | R |  |
| `source_mix_form` | int | R |  |
| `source_mix_template` | int | R |  |
| `story_idea_chars` | int | O |  |
| `message_chars` | int | O |  |
| `duration_s` | int | R |  |
| `chat_turns` | int | R |  |
| `planned_renders` | int | R | From plannedRenders() |
| `planned_cost_usd` | decimal | O |  |

**`brief_abandoned`** - Derived nightly: creation with no activity for 24 h before brief_completed. Not a client event.

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `last_field_key` | enum (brief_field_keys) | O |  |
| `fields_completed` | int | R |  |
| `had_chat` | bool | R |  |
| `intake_cost_usd` | decimal | R |  |
| `is_guest` | bool | R |  |

**`chat_session_started`** - Greet Guide session opens; AI disclosure shown (legal 06 req 12).

| Property | Type | Req | Notes |
|---|---|---|---|
| `ai_disclosure_shown` | bool | R |  |
| `model` | string | R |  |
| `prompt_version_id` | string | R |  |
| `is_guest` | bool | R |  |
| `mock` | bool | R |  |

**`chat_turn_completed`** - One user message plus guide reply (POST /api/intake) finishes.

| Property | Type | Req | Notes |
|---|---|---|---|
| `turn_index` | int | R |  |
| `user_chars` | int | R | Length of the user message only |
| `reply_chars` | int | R |  |
| `tool_calls` | int | R |  |
| `fields_patched` | int | R |  |
| `quick_reply_used` | bool | R |  |
| `prompt_tokens` | int | O |  |
| `completion_tokens` | int | O |  |
| `cost_usd` | decimal | R |  |
| `latency_ms` | int | R |  |
| `model` | string | R |  |
| `prompt_version_id` | string | R |  |
| `guardrail_hit` | enum (none, sensitive, public_figure, copyright_rewrite, photo_guest, other) | R |  |
| `retrieval_used` | bool | O |  |
| `retrieval_hit_ids` | string[] | O | Knowledge-base doc ids only |

Note: Message text is never an event property. Chat transcripts live only in the operational draft record under the draft retention rule.

**`chat_guardrail_triggered`** - Rule-based or model moderation blocks or rewrites chat/brief text.

| Property | Type | Req | Notes |
|---|---|---|---|
| `guardrail` | enum (sensitive, public_figure, copyright_rewrite, photo_guest, moderation_model) | R |  |
| `action` | enum (blocked, rewritten, warned) | R |  |
| `surface` | enum (chat, form, story, message) | R |  |

ATTORNEY: Retention of the flagged text itself (not stored here); moderation log retention is 12 months in legal 02 s7.

**`draft_saved`** - Account draft persisted (explicit save or autosave milestone).

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `fields_completed` | int | R |  |
| `autosave` | bool | R |  |

### Consent

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `consent_modal_shown` | client | C1 / T0 | CTO | 1825 d | P3_consent_coverage | launch |
| `consent_recorded` | server | C1 / T0 | CTO | 1825 d | P3_consent_coverage, P4_tier_mix | launch |
| `consent_changed` | server | C1 / T0 | CTO | 1825 d | P3_consent_coverage, P4_tier_mix | launch |
| `policy_accepted` | server | C1 / T0 | CTO | 1825 d | P3_consent_coverage | launch |

**`consent_modal_shown`** - Photo-consent modal opens before the first upload.

| Property | Type | Req | Notes |
|---|---|---|---|
| `wording_version` | string | R |  |
| `reason` | enum (first_upload, wording_changed, reprompt) | R |  |

**`consent_recorded`** - ConsentRecord written (privacy.consent_records). Properties are flags only; IP and UA stay in the consent ledger.

| Property | Type | Req | Notes |
|---|---|---|---|
| `consent_id` | string | R |  |
| `wording_version` | string | R |  |
| `box_a` | bool | R |  |
| `box_b` | bool | R |  |
| `box_c_keep_person` | bool | R |  |
| `box_d_marketing` | bool | R |  |
| `box_e_improve` | bool | R | Proposed T1 opt-in |
| `box_f_training` | bool | R | Proposed T2 opt-in; UI hidden until legal sign-off |
| `photo_count` | int | R |  |

ATTORNEY: Final wording of boxes A-F; whether box E/F consent can be given by an adult for content that depicts a minor.

**`consent_changed`** - User toggles improvement/training/marketing/keep-person consent in Settings, or withdraws consent.

| Property | Type | Req | Notes |
|---|---|---|---|
| `consent_id` | string | R |  |
| `change` | enum (granted, withdrawn) | R |  |
| `scope` | enum (improve, training, keep_person, marketing_use, photos_all, email_marketing) | R |  |
| `new_tier` | enum (T0, T1, T2) | R |  |

Note: Withdrawal triggers deletion tasks for the affected scope (see 06-data-governance).

**`policy_accepted`** - Terms/Privacy acceptance recorded at signup or checkout (legal 06 req 51).

| Property | Type | Req | Notes |
|---|---|---|---|
| `terms_version` | string | R |  |
| `privacy_version` | string | R |  |
| `context` | enum (signup, checkout, reprompt) | R |  |

### Photos

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `photo_upload_started` | client | C1 / T0 | CTO | 395 d | B3_brief_completion, P3_consent_coverage | launch |
| `photo_uploaded` | server | C1 / T0 | CTO | 395 d | B3_brief_completion, P2_photo_purge_ontime | launch |
| `photo_upload_blocked` | server | C0 / T0 | CTO | 365 d | P5_moderation_rate, Q9_intake_friction | launch |
| `photo_deleted` | server | C1 / T0 | CTO | 395 d | P2_photo_purge_ontime | launch |
| `photo_purge_run` | worker | C0 / T0 | CTO | 730 d | P2_photo_purge_ontime | launch |
| `saved_person_changed` | server | C1 / T0 | CTO | 395 d | R1_repeat_rate, R3_saved_person_rate | launch |

**`photo_upload_started`** - User picks files in the upload step (after the consent gate passes).

| Property | Type | Req | Notes |
|---|---|---|---|
| `file_count` | int | R |  |
| `character_role` | enum (human, pet, place) | R |  |
| `consent_id` | string | R |  |

Note: No client-side face detection, no EXIF, no filenames, no image-derived signal of any kind (biometric risk, legal 02 s5).

**`photo_uploaded`** - Photo stored in private storage after moderation passes.

| Property | Type | Req | Notes |
|---|---|---|---|
| `photo_id` | string | R | Opaque id |
| `consent_id` | string | R |  |
| `character_role` | enum (human, pet, place) | R |  |
| `age_band` | enum (brief.AGE_BANDS) | R | Declared by the user, never inferred from the image |
| `bytes_bucket` | enum (lt_1mb, 1_3mb, 3_8mb, gt_8mb) | R |  |
| `megapixel_bucket` | enum (lt_1, 1_4, 4_12, gt_12) | R |  |
| `content_type` | enum (jpeg, png, webp, heic) | R |  |
| `expires_at` | timestamp | R | Purge date (90 days) |
| `keep_person` | bool | R |  |

ATTORNEY: Whether the declared age_band of a depicted child is itself 'known child' data under state law; kept only for purge scheduling and consent coverage.

**`photo_upload_blocked`** - Upload rejected: size, type, no consent id, rate limit, or moderation block. CSAM hits are NOT logged here (separate restricted safety log).

| Property | Type | Req | Notes |
|---|---|---|---|
| `reason` | enum (size, type, dimensions, no_consent, moderation_block, rate_limit) | R |  |
| `character_role` | enum (human, pet, place) | O |  |

ATTORNEY: CSAM procedure and evidence preservation must live outside analytics (legal 02 s8, 06 req 18).

**`photo_deleted`** - A photo is removed (user, purge job, deletion flow, consent withdrawal).

| Property | Type | Req | Notes |
|---|---|---|---|
| `photo_id` | string | R |  |
| `reason` | enum (user, retention_90d, guest_expiry, account_deletion, consent_withdrawn, moderation) | R |  |
| `age_days` | int | R |  |

**`photo_purge_run`** - Daily purge job finishes (legal 06 req 25).

| Property | Type | Req | Notes |
|---|---|---|---|
| `photos_deleted` | int | R |  |
| `projects_touched` | int | R |  |
| `overdue_count` | int | R | Photos past expires_at that were not deleted |
| `duration_ms` | int | R |  |
| `reminders_sent` | int | R |  |

**`saved_person_changed`** - Saved Person created, reused in a creation, deleted or expired.

| Property | Type | Req | Notes |
|---|---|---|---|
| `action` | enum (created, reused, deleted, expired) | R |  |
| `age_band` | enum (brief.AGE_BANDS) | R |  |
| `uses_count` | int | O |  |

### Story

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `story_generated` | worker | C1 / T0 | CTO | 395 d | U1_cost_per_creation, Q5_generation_failure | launch |
| `story_edited` | server | C1 / T0 | CTO | 395 d | Q10_story_edit_rate, Q6_user_rating | launch |
| `story_approved` | server | C1 / T0 | CTO | 395 d | B4_sheet_approval, Q10_story_edit_rate | launch |

**`story_generated`** - Story job succeeds (book) or card copy generated.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `kind` | enum (book_story, card_copy) | R |  |
| `spread_count` | int | O |  |
| `total_words` | int | O |  |
| `cost_usd` | decimal | R |  |
| `latency_ms` | int | R |  |
| `model_served` | string | R |  |
| `prompt_version_id` | string | R |  |
| `attempt_count` | int | R |  |

**`story_edited`** - User saves changes to a story page, title, dedication or card message.

| Property | Type | Req | Notes |
|---|---|---|---|
| `target` | enum (story_page, title, dedication, card_message) | R |  |
| `page_index` | int | O |  |
| `chars_before` | int | R |  |
| `chars_after` | int | R |  |
| `edit_distance_ratio` | decimal | R | 0 unchanged, 1 rewritten; computed server-side, text discarded |
| `edit_kind` | enum (minor, moderate, rewrite, delete, add) | R |  |
| `source_job_id` | string | O |  |

Note: Edit text diffs are stored only under T1 consent, in ml.text_samples, scrubbed.

**`story_approved`** - User approves the story.

| Property | Type | Req | Notes |
|---|---|---|---|
| `edited_page_count` | int | R |  |
| `total_pages` | int | R |  |
| `regenerations` | int | R |  |
| `seconds_in_step` | int | R |  |

### Model sheet

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `model_sheet_generated` | worker | C1 / T0 | CTO | 395 d | B4_sheet_approval, U1_cost_per_creation, Q4_sheet_redo_rate | launch |
| `model_sheet_redo_requested` | server | C1 / T0 | CTO | 395 d | Q4_sheet_redo_rate, Q3_reroll_rate | launch |
| `model_sheet_approved` | server | C1 / T0 | CTO | 395 d | B4_sheet_approval, Q4_sheet_redo_rate | launch |
| `model_sheet_abandoned` | batch | C1 / T0 | Data | 395 d | B4_sheet_approval, U3_abandoned_draft_cost | launch |

**`model_sheet_generated`** - Sheet job succeeds (a version is added).

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `version_index` | int | R |  |
| `character_count` | int | R |  |
| `cost_usd` | decimal | R |  |
| `latency_ms` | int | R |  |
| `model_served` | string | R |  |
| `image_size` | enum (1K, 2K, 4K) | R |  |
| `prompt_version_id` | string | R |  |
| `zdr_requested` | bool | R |  |
| `uses_saved_person` | bool | R |  |
| `qa_pass` | bool | O |  |

**`model_sheet_redo_requested`** - User asks to redo the model sheet (free redo or paid reroll).

| Property | Type | Req | Notes |
|---|---|---|---|
| `version_index` | int | R |  |
| `charge` | enum (free_redo, reroll) | R |  |
| `reason_codes` | enum[] (likeness_off, age_off, hair, clothes, style_off, wrong_count, pet_off, other) | O | Controlled list shown as chips |
| `has_note` | bool | R | Whether a free-text note was typed; text not recorded |
| `characters_flagged` | int | R |  |

Note: Reason 'likeness_off' is feedback about a generated drawing, not a face measurement.

**`model_sheet_approved`** - User approves the model sheet; page rendering becomes allowed.

| Property | Type | Req | Notes |
|---|---|---|---|
| `approved_version_index` | int | R |  |
| `versions_generated` | int | R |  |
| `free_redos_used` | int | R |  |
| `paid_rerolls_used` | int | R |  |
| `seconds_in_step` | int | R |  |
| `kept_as_person` | bool | R |  |

**`model_sheet_abandoned`** - Derived: sheet generated, no approval or redo within 7 days.

| Property | Type | Req | Notes |
|---|---|---|---|
| `versions_generated` | int | R |  |
| `cost_usd` | decimal | R |  |

### Rendering

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `render_job_queued` | server | C0 / T0 | CTO | 730 d | Q5_generation_failure, U7_spend_vs_cap | launch |
| `render_job_finished` | worker | C0 / T0 | CTO | 730 d | Q5_generation_failure, U1_cost_per_creation, U7_spend_vs_cap | launch |
| `generation_attempted` | worker | C0 / T0 | Data | 730 d | U1_cost_per_creation, U4_cost_per_call, Q5_generation_failure | launch |
| `page_render_finished` | worker | C1 / T0 | CTO | 395 d | Q1_first_pass_qa, Q2_auto_reroll_rate, Q5_generation_failure | launch |
| `spend_cap_hit` | server | C0 / T0 | CFO | 730 d | U7_spend_vs_cap | launch |

**`render_job_queued`** - Job document created.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `kind` | enum (story, sheet, pages, reroll, layout) | R |  |
| `pages_planned` | int | O |  |
| `est_cost_usd` | decimal | O |  |
| `queue_depth` | int | O |  |
| `mock` | bool | R |  |

**`render_job_finished`** - Job reaches succeeded, failed or cancelled.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `kind` | enum (story, sheet, pages, reroll, layout) | R |  |
| `status` | enum (succeeded, failed, cancelled) | R |  |
| `queue_wait_ms` | int | R |  |
| `run_ms` | int | R |  |
| `pages_done` | int | O |  |
| `pages_failed` | int | O |  |
| `cost_usd` | decimal | R |  |
| `error_class` | enum (none, fatal, spend_cap, moderation, model_unavailable, timeout, heartbeat_lost, other) | R |  |
| `charge_refunded` | bool | O |  |

**`generation_attempted`** - One model call attempt finishes. Mirrors a ledger row; the system of record is ml.generation_attempts and this event exists for funnel joins.

| Property | Type | Req | Notes |
|---|---|---|---|
| `attempt_id` | string | R |  |
| `job_id` | string | O |  |
| `stage` | enum (identity, modelsheet, story, card_copy, prompts, render, qa, intake) | R |  |
| `label` | string | R | Page id such as p3 or cover |
| `kind` | enum (text, image) | R |  |
| `model_requested` | string | R |  |
| `model_served` | string | R |  |
| `fallback_used` | bool | R |  |
| `attempt` | int | R |  |
| `status` | enum (ok, http_error, network_error, no_image, mock, blocked) | R |  |
| `http_status` | int | O |  |
| `image_size` | enum (1K, 2K, 4K) | O |  |
| `prompt_version_id` | string | R |  |
| `prompt_tokens` | int | O |  |
| `completion_tokens` | int | O |  |
| `image_tokens` | int | O |  |
| `cost_usd` | decimal | R |  |
| `cost_source` | enum (openrouter_usage, computed, none) | R |  |
| `latency_ms` | int | R |  |
| `zdr_requested` | bool | O |  |
| `experiment_key` | string | O |  |
| `experiment_variant` | string | O |  |

**`page_render_finished`** - A page reaches done or failed after any automatic retries.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `page_id` | string | R |  |
| `page_kind` | enum (cover, spread, back, card_front, card_inside) | R |  |
| `status` | enum (done, failed) | R |  |
| `attempts` | int | R |  |
| `auto_rerolls` | int | R |  |
| `character_count_expected` | int | R |  |
| `final_qa_pass` | bool | O |  |
| `cost_usd` | decimal | R |  |

**`spend_cap_hit`** - A call is blocked by the per-job, per-user or daily USD cap.

| Property | Type | Req | Notes |
|---|---|---|---|
| `cap_scope` | enum (job, user, daily, global_test) | R |  |
| `cap_usd` | decimal | R |  |
| `spent_usd` | decimal | R |  |
| `purpose` | enum (guest_preview, intake_chat, book_render, card_render, qa, story, other) | R |  |

### QA

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `qa_evaluated` | worker | C0 / T0 | CTO | 730 d | Q1_first_pass_qa, Q2_auto_reroll_rate, U4_cost_per_call | launch |
| `auto_reroll_triggered` | worker | C0 / T0 | CTO | 730 d | Q2_auto_reroll_rate, U1_cost_per_creation | launch |

**`qa_evaluated`** - One QA evaluation of a rendered image completes (local border check, vision count/text check, later a learned scorer).

| Property | Type | Req | Notes |
|---|---|---|---|
| `attempt_id` | string | R | The render attempt being judged |
| `page_id` | string | R |  |
| `evaluator` | enum (local_border, vision_count, scorer, human) | R |  |
| `evaluator_version` | string | R |  |
| `pass` | bool | R |  |
| `score` | decimal | O |  |
| `expected_count` | int | O |  |
| `character_count` | int | O |  |
| `white_border` | bool | O |  |
| `text_in_image` | bool | O |  |
| `notes_code` | enum (none, count_mismatch, white_border, text_present, unparseable, call_failed, other) | R | Controlled vocabulary; free-text notes are discarded |
| `cost_usd` | decimal | R |  |
| `led_to_auto_reroll` | bool | R |  |

**`auto_reroll_triggered`** - QA failure causes the one allowed automatic re-render.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `reason` | enum (count_mismatch, white_border, text_present, moderation, character_logo) | R |  |
| `cost_wasted_usd` | decimal | R | Cost of the failed attempt |

### Re-rolls, versions and ratings

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `reroll_requested` | server | C1 / T0 | CTO | 395 d | Q3_reroll_rate, U1_cost_per_creation | launch |
| `reroll_completed` | worker | C1 / T0 | CTO | 395 d | Q3_reroll_rate, Q5_generation_failure | launch |
| `page_version_selected` | server | C1 / T0 | CTO | 395 d | Q6_user_rating, Q3_reroll_rate | launch |
| `rating_submitted` | client | C1 / T0 | CMO | 395 d | Q6_user_rating | launch |

**`reroll_requested`** - User requests a new version of a page or the front of a card.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `page_kind` | enum (cover, spread, back, card_front, card_inside) | R |  |
| `version_index` | int | R | Version being replaced |
| `charge` | enum (allowance, paid_extra, free_qa_fail) | R |  |
| `rerolls_used_total` | int | R |  |
| `rerolls_left` | int | R |  |
| `reason_codes` | enum[] (wrong_count, likeness_off, style_off, text_in_image, cropped, odd_anatomy, bad_scene, colours, other) | O |  |
| `has_note` | bool | R |  |

**`reroll_completed`** - Reroll job finishes.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `new_version_index` | int | R |  |
| `status` | enum (done, failed) | R |  |
| `cost_usd` | decimal | R |  |
| `charge_refunded` | bool | R |  |

**`page_version_selected`** - User switches the current version of a page (for example back to an earlier one).

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `from_version` | int | R |  |
| `to_version` | int | R |  |
| `versions_available` | int | R |  |

Note: Feeds ml.preference_pairs (chosen vs rejected attempt ids). No image content involved.

**`rating_submitted`** - Thumb or star on a model sheet, page, story or the finished proof.

| Property | Type | Req | Notes |
|---|---|---|---|
| `target_type` | enum (model_sheet, page, story, card_front, card_message, proof) | R |  |
| `target_id` | string | O |  |
| `signal` | enum (thumbs, stars) | R |  |
| `value` | int | R |  |
| `reason_codes` | enum[] (likeness_off, wrong_count, style_off, text_in_image, story_flat, love_it, other) | O |  |
| `has_free_text` | bool | R |  |

Note: Free text itself is not an event property; stored in ml.text_samples only for T1+ consent.

### Proof

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `proof_viewed` | client | C1 / T0 | CMO | 395 d | C2_proof_to_cart | launch |
| `layout_job_finished` | worker | C0 / T0 | CTO | 730 d | F4_print_reject_rate, Q5_generation_failure | launch |
| `proof_approved` | server | C1 / T0 | CTO | 395 d | B5_proof_approval, Q7_approval_without_reroll, U1_cost_per_creation, NSM_funnel | launch |
| `proof_link_opened` | client | C1 / T0 | CMO | 395 d | C2_proof_to_cart | launch |

**`proof_viewed`** - Proof viewer opens.

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `pages_viewed` | int | O | Updated on leave |
| `seconds_viewed` | int | O |  |
| `device` | enum (mobile, tablet, desktop) | R |  |

**`layout_job_finished`** - Print PDFs and preview generated.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job_id` | string | R |  |
| `status` | enum (succeeded, failed) | R |  |
| `run_ms` | int | R |  |
| `validator_errors` | int | O | Printer file validation |
| `pages` | int | R |  |

**`proof_approved`** - User approves the proof (stores page hashes for evidence, legal 06 req 32).

| Property | Type | Req | Notes |
|---|---|---|---|
| `product` | enum (card, book) | R |  |
| `rerolls_used` | int | R |  |
| `sheet_redos_used` | int | R |  |
| `pages_with_reroll` | int | R |  |
| `story_edits` | int | R |  |
| `digital_copy` | bool | R |  |
| `seconds_since_brief_completed` | int | R |  |
| `total_cost_usd` | decimal | R |  |

**`proof_link_opened`** - User arrives from a 'proof ready' email link. Replaces the open-pixel event proof_email_open.

| Property | Type | Req | Notes |
|---|---|---|---|
| `email_kind` | enum (proof_ready, order_confirmation, shipped, reminder) | R |  |

ATTORNEY: Recommend no open-tracking pixels in transactional email; confirm.

### Cart, checkout and payment

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `cart_item_added` | server | C1 / T0 | CTO | 395 d | C2_proof_to_cart, C4_aov, C6_mix | launch |
| `cart_viewed` | client | C1 / T0 | CMO | 395 d | C2_cart_to_checkout | launch |
| `cart_item_removed` | server | C1 / T0 | CTO | 395 d | C2_cart_to_checkout | launch |
| `checkout_started` | server | C1 / T0 | CTO | 395 d | C2_cart_to_checkout, C3_checkout_to_paid | launch |
| `checkout_consent_given` | server | C1 / T0 | CTO | 1825 d | P3_consent_coverage | launch |
| `payment_succeeded` | webhook | C1 / T0 | CTO | 395 d | NSM_funnel, C1_start_to_purchase, C4_aov, C5_items_per_order, C6_mix, U6_cac_by_channel, U8_contribution_margin | launch |
| `payment_failed` | webhook | C1 / T0 | CTO | 395 d | C3_checkout_to_paid | launch |
| `order_created` | server | C1 / T0 | CTO | 395 d | NSM_funnel | launch |
| `refund_issued` | webhook | C1 / T0 | CFO | 395 d | F3_refund_reprint_rate, NSM_funnel, U8_contribution_margin | launch |
| `dispute_opened` | webhook | C1 / T0 | CFO | 395 d | F3_refund_reprint_rate, U8_contribution_margin | launch |

**`cart_item_added`** - Item added to cart.

| Property | Type | Req | Notes |
|---|---|---|---|
| `sku` | enum (card_digital, card_mailed, book_digital, book_24, book_32) | R |  |
| `product` | enum (card, book) | R |  |
| `price_cents` | int | R |  |
| `postage_cents` | int | R |  |
| `quantity` | int | R |  |
| `cart_items_total` | int | R |  |
| `cart_value_cents` | int | R |  |

**`cart_viewed`** - Cart page rendered.

| Property | Type | Req | Notes |
|---|---|---|---|
| `items` | int | R |  |
| `cart_value_cents` | int | R |  |

**`cart_item_removed`** - Item removed.

| Property | Type | Req | Notes |
|---|---|---|---|
| `sku` | enum (skus) | R |  |
| `reason` | enum (user, expired, invalid) | R |  |

**`checkout_started`** - Pending checkout created and Stripe session opened.

| Property | Type | Req | Notes |
|---|---|---|---|
| `checkout_id` | string | R |  |
| `items` | int | R |  |
| `subtotal_cents` | int | R |  |
| `shipping_method` | enum (standard, express) | R |  |
| `has_printed` | bool | R |  |
| `ship_country` | enum (US) | O |  |
| `ship_state` | string | O | US state code only |
| `proof_consent_given` | bool | R |  |

**`checkout_consent_given`** - Proof approval + refund policy acceptance at checkout (legal 06 req 39).

| Property | Type | Req | Notes |
|---|---|---|---|
| `policy_version` | string | R |  |
| `proof_approved` | bool | R |  |
| `items` | int | R |  |

**`payment_succeeded`** - Stripe checkout.session.completed processed (idempotent via processedEvents). The only source for purchase counts and for ad-platform conversion sending.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `checkout_id` | string | R |  |
| `total_cents` | int | R |  |
| `subtotal_cents` | int | R |  |
| `postage_cents` | int | R |  |
| `shipping_method_cents` | int | R |  |
| `tax_cents` | int | R |  |
| `currency` | enum (usd) | R |  |
| `items` | int | R |  |
| `skus` | enum[] (skus) | R |  |
| `has_printed` | bool | R |  |
| `is_first_order` | bool | R |  |
| `channel_first_touch` | string | O |  |
| `channel_last_touch` | string | O |  |
| `utm_campaign_last` | string | O |  |
| `stripe_fee_cents` | int | O |  |

ATTORNEY: What may be sent to ad platforms server-side (value, currency, event_id only vs hashed email); sale/share classification.

**`payment_failed`** - Stripe reports a failed or expired session/payment intent.

| Property | Type | Req | Notes |
|---|---|---|---|
| `checkout_id` | string | R |  |
| `reason` | enum (declined, expired, cancelled, fraud_block, error) | R |  |
| `total_cents` | int | R |  |

**`order_created`** - Order record created from a completed checkout (one per order).

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `items` | int | R |  |
| `promised_delivery_date` | date | O |  |
| `printer_by_item` | string[] | O |  |

**`refund_issued`** - Refund created in Stripe or via admin.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `refund_cents` | int | R |  |
| `full` | bool | R |  |
| `reason_code` | enum (quality_failed_proof, print_defect, late_delivery, duplicate, customer_remorse, fraud, other) | R |  |
| `days_since_order` | int | R |  |

**`dispute_opened`** - Stripe dispute created.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `amount_cents` | int | R |  |
| `reason` | string | O | Stripe reason code |

### Fulfilment

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `fulfillment_submitted` | worker | C0 / T0 | CTO | 395 d | F4_print_reject_rate, F1_on_time_delivery | launch |
| `fulfillment_status_changed` | webhook | C0 / T0 | CTO | 395 d | F1_on_time_delivery, F2_needs_attention_rate | launch |
| `order_shipped` | webhook | C0 / T0 | CTO | 395 d | F1_on_time_delivery, U5_print_ship_cost | launch |
| `order_delivered` | webhook | C0 / T0 | CTO | 395 d | F1_on_time_delivery, NSM_funnel | launch |
| `fulfillment_needs_attention` | webhook | C0 / T0 | CTO | 395 d | F2_needs_attention_rate, F4_print_reject_rate | launch |
| `reprint_created` | server | C1 / T0 | CFO | 395 d | F3_refund_reprint_rate, U8_contribution_margin | launch |
| `delay_notice_sent` | server | C0 / T0 | CTO | 395 d | F1_on_time_delivery | launch |

**`fulfillment_submitted`** - Order item submitted to Lulu/Prodigi.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `order_item_id` | string | R |  |
| `printer` | enum (lulu, prodigi, gelato) | R |  |
| `sku` | enum (skus) | R |  |
| `validation_errors` | int | R |  |
| `submit_latency_ms` | int | R |  |
| `attempt` | int | R |  |

**`fulfillment_status_changed`** - Printer webhook or poll moves an item/order along the state machine (orderState.ts).

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `order_item_id` | string | R |  |
| `printer` | enum (lulu, prodigi, gelato) | R |  |
| `from_status` | enum (order_statuses) | R |  |
| `to_status` | enum (order_statuses) | R |  |
| `raw_state` | string | O | Printer's own state name |
| `hours_in_prev_status` | decimal | O |  |

**`order_shipped`** - First shipped status per item.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `order_item_id` | string | R |  |
| `carrier` | string | O |  |
| `days_since_payment` | decimal | R |  |
| `print_cost_cents` | int | O | Actual from printer |
| `ship_cost_cents` | int | O | Actual from printer |

**`order_delivered`** - Delivered status.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `days_since_payment` | decimal | R |  |
| `on_time` | bool | O | Against promised_delivery_date |
| `days_late` | int | O |  |

**`fulfillment_needs_attention`** - Item enters needs_attention (reject, error, hold).

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `order_item_id` | string | R |  |
| `printer` | enum (lulu, prodigi, gelato) | R |  |
| `reason_code` | enum (file_rejected, address_invalid, out_of_stock, printer_error, delay, other) | R |  |

**`reprint_created`** - Reprint/reship created for an item.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `order_item_id` | string | R |  |
| `reason_code` | enum (print_defect, damaged, lost, quality_failed_proof, address_error, other) | R |  |
| `extra_cost_cents` | int | O |  |

**`delay_notice_sent`** - Late-delivery notice sent (legal 06 req 37).

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `days_late_projected` | int | R |  |
| `cancel_offered` | bool | R |  |

### Post-purchase and lifecycle

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `email_sent` | server | C0 / T0 | CTO | 730 d | P2_photo_purge_ontime, R3_reminder_opt_in | launch |
| `email_unsubscribed` | webhook | C1 / T0 | CMO | 1825 d | R3_reminder_opt_in | launch |
| `survey_responded` | server | C1 / T0 | CX | 395 d | Q6_user_rating, R1_repeat_rate, NSM_funnel | launch |
| `reminder_opt_in_changed` | server | C1 / T0 | CMO | 395 d | R3_reminder_opt_in, R1_repeat_rate | post_launch |
| `reorder_started` | server | C1 / T0 | CMO | 395 d | R1_repeat_rate | launch |
| `digital_delivery_completed` | server | C1 / T0 | CTO | 395 d | NSM_funnel, C6_mix | launch |

**`email_sent`** - Any email handed to Resend.

| Property | Type | Req | Notes |
|---|---|---|---|
| `email_kind` | enum (magic_link, order_confirmation, proof_ready, shipped, delay_notice, purge_reminder, deletion_confirmation, marketing) | R |  |
| `provider_status` | enum (accepted, failed) | R |  |
| `class` | enum (transactional, marketing) | R |  |

**`email_unsubscribed`** - One-click unsubscribe or Resend suppression webhook.

| Property | Type | Req | Notes |
|---|---|---|---|
| `list` | enum (marketing, reminders) | R |  |

**`survey_responded`** - Post-delivery survey submitted (sent 5 days after delivered).

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `nps` | int | R | 0-10 |
| `csat_print_quality` | int | O | 1-5 |
| `csat_art_quality` | int | O | 1-5 |
| `reason_codes` | enum[] (art_quality, likeness, print_quality, late, price, story, love_it, other) | O |  |
| `has_free_text` | bool | R |  |
| `would_reorder` | bool | O |  |

**`reminder_opt_in_changed`** - User adds/removes an occasion reminder.

| Property | Type | Req | Notes |
|---|---|---|---|
| `action` | enum (added, removed) | R |  |
| `occasion` | enum (brief.OCCASIONS) | R |  |
| `days_ahead` | int | O |  |

ATTORNEY: Reminders store a recipient's occasion date; confirm treatment of third-party (recipient) data.

**`reorder_started`** - User starts a creation from a past order or saved Person.

| Property | Type | Req | Notes |
|---|---|---|---|
| `source` | enum (order, saved_person, reminder_email) | R |  |
| `product` | enum (card, book) | R |  |
| `days_since_last_order` | int | O |  |

**`digital_delivery_completed`** - Digital card/book downloaded or e-card sent.

| Property | Type | Req | Notes |
|---|---|---|---|
| `order_id` | string | R |  |
| `sku` | enum (skus) | R |  |
| `channel` | enum (download, email, link) | R |  |

### Support

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `support_contact_created` | server | C1 / T0 | CX | 395 d | S1_contact_rate, NSM_funnel | launch |
| `support_ticket_resolved` | server | C1 / T0 | CX | 395 d | S2_first_response, F3_refund_reprint_rate | launch |
| `content_report_submitted` | server | C1 / T0 | CX | 365 d | P5_moderation_rate, P1_deletion_sla | launch |

**`support_contact_created`** - Support form, email or chat creates a ticket. The ticket body stays in the helpdesk.

| Property | Type | Req | Notes |
|---|---|---|---|
| `ticket_id` | string | R |  |
| `channel` | enum (form, email, chat, social) | R |  |
| `category` | enum (order_status, quality, refund, billing, account, privacy_request, takedown, bug, other) | R |  |
| `order_id` | string | O |  |
| `stage_when_contacted` | enum (pre_purchase, creating, proof, post_payment, fulfillment, delivered) | R |  |

**`support_ticket_resolved`** - Ticket closed.

| Property | Type | Req | Notes |
|---|---|---|---|
| `ticket_id` | string | R |  |
| `first_response_minutes` | int | R |  |
| `resolution_hours` | decimal | R |  |
| `resolution` | enum (info, reprint, refund, fix_bug, no_action, escalated_legal) | R |  |
| `csat` | int | O | 1-5 |

**`content_report_submitted`** - 'Report content / remove a photo of me or my child' form submitted (legal 06 req 22).

| Property | Type | Req | Notes |
|---|---|---|---|
| `report_type` | enum (copyright, likeness, inappropriate, other) | R | Matches app/lib/safety/reports.ts kind |
| `is_about_minor` | bool | O |  |
| `source_page` | enum (footer, proof, account, email) | R |  |

ATTORNEY: Takedown/removal SLA (48 h target) and evidence handling.

### Privacy operations

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `data_export_requested` | server | C1 / T0 | CTO | 1825 d | P1_deletion_sla | launch |
| `deletion_requested` | server | C1 / T0 | CTO | 1825 d | P1_deletion_sla | launch |
| `deletion_completed` | worker | C0 / T0 | Data | 1825 d | P1_deletion_sla | launch |
| `retention_job_run` | batch | C0 / T0 | Data | 730 d | P2_photo_purge_ontime | launch |
| `training_candidate_registered` | batch | C0 / T1 | Data | 1825 d | P4_tier_mix | post_launch |

**`data_export_requested`** - User requests 'download my data'.

| Property | Type | Req | Notes |
|---|---|---|---|
| `request_id` | string | R |  |
| `channel` | enum (self_service, email, support) | R |  |
| `includes_analytics` | bool | R |  |

**`deletion_requested`** - Delete-my-data or delete-account confirmed (after magic-link confirmation).

| Property | Type | Req | Notes |
|---|---|---|---|
| `request_id` | string | R |  |
| `kind` | enum (account, data_only, consent_withdrawal, underage_lockout) | R |  |
| `channel` | enum (self_service, email, support, system) | R |  |
| `open_orders` | int | R |  |
| `account_age_days` | int | R |  |

Note: Recorded in privacy.deletion_log without a subject id; no event row survives the deletion it describes (delete_subject removes it).

**`deletion_completed`** - All privacy.deletion_tasks for the request left 'pending'.

| Property | Type | Req | Notes |
|---|---|---|---|
| `request_id` | string | R |  |
| `duration_hours` | decimal | R |  |
| `tasks_total` | int | R |  |
| `tasks_retained_by_law` | int | R |  |
| `tasks_failed` | int | R |  |
| `datasets_flagged` | int | R |  |

**`retention_job_run`** - Nightly privacy.purge_expired() finishes.

| Property | Type | Req | Notes |
|---|---|---|---|
| `job` | enum (events_purge, guest_expiry, consent_purge, ledger_strip, text_samples_purge) | R |  |
| `rows_affected` | int | R |  |
| `duration_ms` | int | R |  |
| `overdue_rows` | int | R |  |

**`training_candidate_registered`** - A row enters ml.training_candidates (default status 'quarantined').

| Property | Type | Req | Notes |
|---|---|---|---|
| `modality` | enum (text_story, text_message, text_prompt, image_art, qa_label, preference_pair) | R |  |
| `content_class` | enum (C1, C3, C4) | R |  |
| `status` | enum (quarantined, eligible, excluded) | R |  |
| `gate_failed` | enum[] (no_t2_consent, no_signoff, likeness, photo_derived, minors_possible, pii_scan, moderation) | O |  |

### Safety and moderation

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `text_moderation_result` | server | C0 / T0 | CTO | 365 d | P5_moderation_rate | launch |
| `output_check_result` | worker | C0 / T0 | CTO | 365 d | P5_moderation_rate, Q1_first_pass_qa | launch |
| `ip_input_rewritten` | server | C0 / T0 | CTO | 365 d | P5_moderation_rate | launch |
| `ip_input_blocked` | server | C0 / T0 | CTO | 365 d | P5_moderation_rate, Q9_intake_friction | launch |
| `ip_output_flagged` | worker | C0 / T0 | CTO | 365 d | P5_moderation_rate, Q1_first_pass_qa | launch |
| `ip_output_rerolled` | worker | C0 / T0 | CTO | 365 d | P5_moderation_rate, Q2_auto_reroll_rate | launch |

**`text_moderation_result`** - Moderation runs on a brief, story, chat message or name field.

| Property | Type | Req | Notes |
|---|---|---|---|
| `surface` | enum (chat, brief_field, story, message, name_field, feedback) | R |  |
| `result` | enum (pass, block, rewrite) | R |  |
| `category` | enum (none, sexual, violence, hate, self_harm, minor_safety, public_figure, copyright, other) | R |  |
| `engine` | enum (rules, model) | R |  |

**`output_check_result`** - Character/logo/celebrity vision check on a rendered page (legal 06 req 19).

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `result` | enum (pass, rerolled, blocked) | R |  |
| `category` | enum (none, copyright_character, logo, celebrity) | R |  |

**`ip_input_rewritten`** - IP-safety screening rewrote customer text so a protected character, brand, franchise or slogan became an original idea (docs/legal/07).

| Property | Type | Req | Notes |
|---|---|---|---|
| `surface` | enum (chat, card_message, story_idea, character_note, photo_caption, reroll_note, brief_field, story_text, image_prompt) | R | Where the text was typed or produced |
| `detected_count` | int | R | Number of items found |
| `detected_kinds` | string[] | R | Kinds only: character, brand, slogan, person, franchise |
| `engine` | enum (rules, model) | R |  |
| `changed_chars` | int | R | Length of the text before minus after, absolute value |

**`ip_input_blocked`** - IP-safety screening refused customer text (for example a real public figure) and asked for a different direction.

| Property | Type | Req | Notes |
|---|---|---|---|
| `surface` | enum (chat, card_message, story_idea, character_note, photo_caption, reroll_note, brief_field, story_text, image_prompt) | R |  |
| `detected_count` | int | R |  |
| `detected_kinds` | string[] | R | Kinds only |
| `engine` | enum (rules, model) | R |  |

**`ip_output_flagged`** - Output vision check flagged a rendered page (recognisable protected character, logo, slogan, licensed merchandise or high look-alike risk) or Sonnet-written story text was flagged.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `flags` | string[] | R | Closed list: protected_character, logo, slogan, licensed_merch, lookalike_risk, story_text |
| `lookalike_risk` | int | O | 0-10 score from the vision check |
| `is_final` | bool | R | True when the page was blocked after the re-roll |

**`ip_output_rerolled`** - A flagged page was automatically re-rolled once with a hardened prompt.

| Property | Type | Req | Notes |
|---|---|---|---|
| `page_id` | string | R |  |
| `flags` | string[] | R | Same closed list as ip_output_flagged |
| `passed_after_reroll` | bool | R |  |
| `cost_usd` | decimal | O | Extra spend of the re-roll and its check |

### agent

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `agent_grant_changed` | server | C1 / T0 | CTO | 395 d | A4_agent_orders | launch |
| `agent_tool_called` | server | C1 / T0 | CTO | 395 d | A4_agent_orders, U7_spend_vs_cap | launch |

**`agent_grant_changed`** - A user connects, pauses, resumes or revokes an AI assistant's delegated access (OAuth grant).

| Property | Type | Req | Notes |
|---|---|---|---|
| `client_kind` | enum (chatgpt, claude, gemini, other) | R | Mapped from the OAuth client id, never the raw id |
| `action` | enum (connected, paused, resumed, revoked, expired) | R |  |
| `scopes` | string[] | O | Granted scopes, e.g. cards:read |

**`agent_tool_called`** - Once per agent tool call after the policy decision (same point as the agent AuditLog row). Never the arguments; the audit log keeps only their digest.

| Property | Type | Req | Notes |
|---|---|---|---|
| `tool` | enum (search_styles, list_people, add_person, get_quote, get_account_limits, create_card_draft, revise_card_draft, preview_card, list_orders, track_order, request_approval, cancel_order, approve_and_pay, propose_standing_rule, list_standing_rules, pause_standing_rule) | R |  |
| `client_kind` | enum (chatgpt, claude, gemini, other) | R |  |
| `decision` | enum (allow, deny, require_approval) | R |  |
| `reason_codes` | string[] | O | Policy reason codes only |
| `spend_reserved_usd` | decimal | O | Model spend reserved for this call |

### Experiments

| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |
|---|---|---|---|---|---|---|
| `experiment_assigned` | server | C1 / T0 | Data | 395 d | Q1_first_pass_qa, B3_brief_completion | post_launch |

**`experiment_assigned`** - A unit is first bucketed into an experiment.

| Property | Type | Req | Notes |
|---|---|---|---|
| `experiment_key` | string | R |  |
| `variant` | string | R |  |
| `unit` | enum (subject, creation, session) | R |  |


## 9. Mapping from the 13 events in docs/cmo/ux-spec.md section 12

| ux-spec event | This plan |
|---|---|
| `view_home` | `page_viewed` |
| `template_click` | `template_clicked` |
| `creator_start` | `creator_started` |
| `signup_complete` | `signup_completed` |
| `brief_complete` | `brief_completed` |
| `book_sheet_approved` | `model_sheet_approved` |
| `reroll_used` | `reroll_requested` |
| `proof_email_open` | `proof_link_opened` |
| `add_to_cart` | `cart_item_added` |
| `checkout_start` | `checkout_started` |
| `purchase` | `payment_succeeded` |
| `guest_preview_rendered` | `guest_preview_rendered` (unchanged name, now server/worker with cost) |
| `signup_prompt_shown` | `signup_prompt_shown` (unchanged) |

Deliberate departures: `proof_email_open` is replaced by `proof_link_opened` (click, not an open pixel); `purchase` is sourced only from the Stripe webhook.

## 10. Items flagged for attorney review in this file
- `consent_banner_decided`: Whether first-party operational analytics needs a banner choice at all; GPC handling; equal-weight buttons (legal 06 req 43).
- `age_gate_failed`: Actual-knowledge handling and what, if anything, may be kept after lockout.
- `chat_guardrail_triggered`: Retention of the flagged text itself (not stored here); moderation log retention is 12 months in legal 02 s7.
- `consent_recorded`: Final wording of boxes A-F; whether box E/F consent can be given by an adult for content that depicts a minor.
- `photo_uploaded`: Whether the declared age_band of a depicted child is itself 'known child' data under state law; kept only for purge scheduling and consent coverage.
- `photo_upload_blocked`: CSAM procedure and evidence preservation must live outside analytics (legal 02 s8, 06 req 18).
- `proof_link_opened`: Recommend no open-tracking pixels in transactional email; confirm.
- `payment_succeeded`: What may be sent to ad platforms server-side (value, currency, event_id only vs hashed email); sale/share classification.
- `reminder_opt_in_changed`: Reminders store a recipient's occasion date; confirm treatment of third-party (recipient) data.
- `content_report_submitted`: Takedown/removal SLA (48 h target) and evidence handling.
- Whether T0 first-party analytics, including the pseudonymous `subject_id` link, needs an opt-out, a notice line or a banner choice under CCPA-style laws and wiretap theories (CIPA) for a US-only launch.
- Whether declared age bands on photo uploads are "known child" sensitive data under state laws.

## 11. Open questions for other teams
- CTO: where does `creation_id` come from in the Supabase version (BookProject.id, card draft id)? The plan assumes one opaque id per card/book.
- CMO: can each template have a stable `template_id`? `channel` values must match the CSV channel names.
- CX: helpdesk choice decides how `ticket_id` is created and where ticket bodies (C3, may contain children's names) live.
