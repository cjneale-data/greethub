# 06. Data governance

Owner: Head of Data. Date: 2026-10-10. Not legal advice; this is the operating policy I propose and the list of questions the attorney must answer (section 11). Anything marked ATTORNEY must be resolved before the stated gate. Legal sources: `docs/legal/02-children-photos-privacy.md` (cited "02"), `06-product-requirements.md` (cited "06 req N"), `01-ip-and-ai-output.md`.

## 1. Rules that override everything else

1. **No training on, and no retention for training of, photos of people, faces, or art derived from them. Ever, by default and by construction.** Enforced in schema (`ml.training_candidates` constraints `eligible_requires_all_gates` and `c4_never_eligible`), not only by policy.
2. **Every data element has a class, a tier, a retention period and a deletion path** (section 2). If any of the four is missing the element is not collected.
3. **Analytics holds no identifiers and no content.** Only classes C0/C1 (pseudonymous behaviour and system facts) are allowed in `analytics.*`; the events table has a CHECK that rejects anything else.
4. **Deletion propagates.** One function, one request id, one task list, an audit trail without personal data (section 6).
5. **Consent is tiered, specific, unticked, revocable and recorded** (section 3). Consent for one purpose is never reused for another.
6. **Adults only; no child accounts; no face recognition; US-only launch** (02 s1, s9).

## 2. Data inventory and classification

Classes: C0 system, C1 pseudonymous behaviour, C2 personal identifiers, C3 user text, C4 likeness, C5 prohibited (never collected). Definitions in `01-tracking-plan.md` section 3 and `tracking-plan.json`. This table is generated from `tools/build-inventory.mjs` and mirrored in `data-inventory.json`.

<!-- BEGIN INVENTORY -->
| Data | Where | Class | Purpose | Tier | Access | Vendors |
|---|---|---|---|---|---|---|
| Uploaded photos of people, pets, places | Supabase Storage, private bucket | C4 | Draw this customer's order | T0 (operational only; never analytics or ml) | worker/service role only; no human access except documented takedown or safety process | Supabase; transiently OpenRouter and the model providers (ZDR required) |
| Guest uploads (if ever allowed) | Supabase Storage | C4 | none at launch: guests cannot upload people photos (legal 06 req 6) | n/a | worker only | Supabase |
| Saved Person: identity sheet, model sheet, source crop | Supabase Storage + people table | C4 | Reuse character across creations (box C) | T0 (user-initiated feature) | worker/service role | Supabase; model providers when reused |
| Generated art, drafts, proofs | Supabase Storage + project/job tables | C4 when photo-derived, else C3 | Show proof, fulfil order | T0 (never in analytics/ml; T2 candidate only if not photo-derived and not likeness) | customer; worker; support read-only on request with log | Supabase |
| Final print PDFs and order artwork | Supabase Storage; copy at Lulu/Prodigi | C4 when photo-derived | Print, reprint window | T0 | worker; printers | Lulu, Prodigi (DPAs to sign) |
| Briefs, drafts, chat transcripts, story text | app DB (drafts, projects, jobs) | C2 + C3 | Build the creation | T0 | customer; worker; support on request | Supabase; model providers (prompts/responses, ZDR) |
| Account profile, email, first/last name | Supabase Auth + users table | C2 | Operate account | T0 | service role; support lookup by email | Supabase; Resend (contact) |
| Saved addresses and order ship-to | addresses table; orders | C2 | Ship orders | T0 | worker; support | Stripe, Lulu, Prodigi, Resend |
| Orders, invoices, tax records | orders table; Stripe | C2 + financial | Fulfil, account, tax | T0 | owner; CFO; support | Stripe |
| Card and payment details | Stripe only | C2 (processor-held) | Payment | T0 | Stripe dashboard (MFA) | Stripe |
| Consent ledger incl. IP and user agent | privacy.consent_records | C2 | Prove consent (BIPA-grade written release) | T0 | privacy_admin; attorney on request | Supabase |
| Terms/privacy acceptance and age confirmation | users table; privacy.consent_state | C1 | Prove acceptance | T0 | privacy_admin | Supabase |
| Analytics events | analytics.events | C0/C1 | Funnel, KPIs, debugging | T0 | analyst_ro (read), analytics_writer (insert) | Supabase |
| Sessions (first touch, device class, coarse geo) | analytics.sessions | C1 | Attribution | T0 | analyst_ro | Supabase |
| Order, order-item, creation facts | analytics.fact_* | C1 | Unit economics | T0 | analyst_ro | Supabase |
| Generation ledger (cost, model, prompt version, status) | ml.generation_attempts | C0/C1 | Unit costs, quality, spend cap | T0 | ml_ro, analytics_writer | Supabase |
| QA results, feedback, edits, preference pairs, outcomes | ml.qa_results, user_feedback, edits, preference_pairs, outcomes | C0/C1 | Quality measurement and experiments | T0 (ids, codes and metrics only) | ml_ro | Supabase |
| Scrubbed text samples (opted-in) | ml.text_samples | C3 (scrubbed) | Prompt design, text scorer, evals | T1 (box E) | named reviewer only via logged export job; not analyst_ro/ml_ro SELECT | Supabase |
| Training-candidate registry | ml.training_candidates, dataset_versions, dataset_members, model_registry | C0/C1 (metadata only, no content) | Lineage and gating | T1+ registry; eligibility needs T2 | Head of Data, privacy_admin | Supabase |
| Golden evaluation set | ml.eval_*; assets in a separate private bucket | synthetic or released | Regression evals | n/a (no customer content) | Head of Data, CTO | Supabase |
| Moderation and abuse logs (not CSAM material) | app DB / safety log | C0/C1 | Safety, repeat offenders | T0 | CTO; owner | Supabase; moderation provider (TBD) |
| Application and platform logs | Vercel, Supabase, Sentry | C0 (no bodies, no prompts) | Debugging | T0 | CTO | Vercel (Pro), Supabase, Sentry |
| Email contacts and delivery logs | Resend | C2 | Transactional and marketing mail | T0 (marketing needs opt-in) | CTO, CMO (marketing list) | Resend |
| Support tickets and attachments | helpdesk (TBD) | C2 + C3 | Customer support | T0 | CX; owner | Helpdesk vendor (TBD, DPA) |
| Server-side ad conversion events | Meta/Google/Pinterest/TikTok | C1 (minimal fields) | Measure ad performance | T0 only if attorney approves payload; otherwise off | CMO | Ad platforms |
| BI caches and CSV extracts | Metabase host, laptops | C1 | Reporting | T0 | named users | BI host |
| Database and storage backups | Supabase | all | Recovery | T0 | owner | Supabase |
| Deletion log and tombstones | privacy.deletion_log, deletion_tombstones | C0 (random ids, counts) | Audit and anti-resurrection | T0 | privacy_admin | Supabase |
| Printer-held customer data | Lulu, Prodigi | C2 + C4 | Fulfilment | T0 | n/a | Lulu, Prodigi |
<!-- END INVENTORY -->

**C5, never collected or derived:** face embeddings, face geometry or match results, age/gender/ethnicity inferred from images, EXIF location, payment card data, session replay or keystroke capture of creator/proof pages, advertising IDs, fingerprints, precise geolocation, biometric voice data.

## 3. Consent tiers (what is collected under which consent)

| Tier | What | UI | Default | Withdrawal effect |
|---|---|---|---|---|
| **T0 Operational** | C0/C1 events, cost/latency/QA logs, order and fulfilment facts, reason-code feedback, consent and deletion ledgers. Needed to run, secure, price and support the service. Never any C2/C3/C4 content. | Privacy Policy notice; account-level "no analytics" switch; GPC honoured for any third-party tool | On | Switch off: client events stop, server operational/commerce records remain (they are the service itself) |
| **T1 Help improve GreetHub** (proposed box E) | Scrubbed story/message text and edit pairs, chat user turns after scrub, free-text feedback after scrub; used for prompt design, evals, text scorer, recommendations. Never photos or art. | Separate unticked checkbox at consent and a Settings toggle; non-blocking prompt at proof approval | Off | Delete the user's `ml.text_samples`; stop future capture; datasets built from them flagged for rebuild |
| **T2 Allow training use** (proposed box F) | Only items passing every gate in `ml.training_candidates`: T2 consent + legal sign-off + PII scan + moderation clean + **not photo-derived + not likeness + not minors-possible** | Hidden at launch; appears only after `privacy.legal_signoffs` has a valid row for the scope | Off; hidden | Candidate rows `withdrawn`, datasets flagged `needs_rebuild`; already-trained models handled per the attorney's policy |
| **Never** | Photos of any person, especially minors; faces; identifiable PII; art derived from uploaded photos; payment data; replays | n/a | n/a | n/a: not collectable, and no consent can unlock it in this plan |

Mapping to existing boxes (`app/lib/book/consent.ts`, 02 s6): A authority, B AI-processing notice are required for upload; C keep Saved Person; D show finished pages publicly (marketing). **D is not T1/T2 consent and C is not training consent.** Proposed new E (T1) and F (T2) are stored on `privacy.consent_records` (columns exist) and flattened into `privacy.consent_state`. Wording and parent/guardian handling are ATTORNEY items (11.B, 11.C). Any change of wording bumps `CONSENT_WORDING_VERSION` and re-prompts (06 req 5).

Truthfulness rule: the sentence "we do not use your photos to train AI models" ships only if ZDR/paid-tier terms are confirmed for every vendor route (06 req 8, 14). Our own commitment ("GreetHub does not train on photos") is true by schema; the vendors' commitment is separate and must be verified.

## 4. Retention schedule

Aligned to 02 s7. Everything beyond the legal docs' table (analytics, ledger, tickets, tombstones, facts) is my proposal and needs attorney/CPA confirmation. The 90-day photo purge is unchanged. Analytics retention is shorter than business need, because event data is pseudonymous but linkable.

<!-- BEGIN RETENTION -->
| Data | Keep | Then | Mechanism |
|---|---|---|---|
| Uploaded photos of people, pets, places | 90 days from upload; extended to order delivered + 30 days if later; hard cap 120 days; Saved Person exception | Hard delete object, thumbnails, derived crops, CDN copies; deletion record | daily purge job (legal 06 req 25) + delete_subject task `storage.photos` |
| Guest uploads (if ever allowed) | 7 days | Hard delete | guest expiry job (`purge_expired`) |
| Saved Person: identity sheet, model sheet, source crop | Until the user deletes it, or 24 months of account inactivity; reminder 30 days before | Hard delete | user action; inactivity job; delete_subject |
| Generated art, drafts, proofs | 12 months from last edit unless on a placed order | Delete; order pages follow the order-art rule | retention job; delete_subject |
| Final print PDFs and order artwork | Printing + 12 months reprint window | Delete art; keep invoice facts | retention job; request printer deletion after fulfilment |
| Briefs, drafts, chat transcripts, story text | 12 months from last edit; guest drafts 7 days; order text follows the order-art rule | Delete | retention job; delete_subject |
| Account profile, email, first/last name | Account life | Delete on request or deletion flow | delete-account flow |
| Saved addresses and order ship-to | Saved: until deleted. Order ship-to: removed when order closed AND account deleted (`scrubbed`) | Scrub fields | delete flow; order scrub |
| Orders, invoices, tax records | 7 years for invoice/tax record (CPA to confirm); art follows order-art rule | Delete identifiers; keep invoice | retained by law, identifiers minimised after account deletion |
| Card and payment details | Stripe policy; GreetHub stores none | n/a | delete saved payment methods; retain legally required |
| Consent ledger incl. IP and user agent | 5 years from consent or from deletion request, whichever is later | Delete row | retained by law until purge_after |
| Terms/privacy acceptance and age confirmation | 5 years | Delete | retained by law until expiry |
| Analytics events | 395 days for behavioural events; 730 days for system events; 1825 days for consent/privacy events (per event definition) | Delete partition rows; aggregates keep | delete_subject removes by subject_id and linked anonymous_ids |
| Sessions (first touch, device class, coarse geo) | 13 months | Delete | delete_subject |
| Order, order-item, creation facts | Order facts 7 years (finance); creation facts 24 months | Delete creation facts; order facts unlinked from subject after deletion | delete_subject unlinks order facts, deletes creation facts |
| Generation ledger (cost, model, prompt version, status) | Full detail 24 months, then links and hashes stripped; cost facts kept indefinitely | Strip subject, job, creation, hashes, output refs | delete_subject anonymises (keeps cost, model, latency, status) |
| QA results, feedback, edits, preference pairs, outcomes | 24 months | Delete | delete_subject deletes |
| Scrubbed text samples (opted-in) | 12 months | Delete | withdrawal of box E and delete_subject |
| Training-candidate registry | Life of dataset + 5 years audit | Delete | delete_subject sets withdrawn and flags datasets for rebuild |
| Golden evaluation set | Until retired; release documents kept as long as assets are | Delete assets when release lapses | release revocation |
| Moderation and abuse logs (not CSAM material) | 12 months | Delete | retention job |
| Application and platform logs | 30 days | Vendor expiry | expiry |
| Email contacts and delivery logs | Shortest vendor setting; contact deleted on request | Vendor expiry/deletion API | delete_subject task `resend` |
| Support tickets and attachments | 24 months after close; takedown/privacy requests 5 years | Delete | delete_subject task `helpdesk` |
| Server-side ad conversion events | Per ad platform | Per platform | not reachable; therefore minimal payload and opt-out/GPC respected |
| BI caches and CSV extracts | Cache 24 hours; extracts deleted within 30 days | Delete | cache TTL; policy |
| Database and storage backups | Provider window (Pro daily backups, about 7 days; CONFIRM); published in the Privacy Policy | Expire | expire; after any restore run privacy.replay_tombstones() |
| Deletion log and tombstones | Log: indefinite. Tombstones: 24 months (longer than any backup or export) | Delete tombstone | none: contains no personal data |
| Printer-held customer data | Per DPA; request deletion after fulfilment where not required | Per vendor | delete_subject task `lulu_prodigi` |
<!-- END RETENTION -->

Enforcement: `privacy.purge_expired()` (events by per-event `retention_days`, text samples, consent records past `purge_after`, session expiry, generation-link stripping at 24 months, guest subjects after 7 idle days) runs nightly from `pg_cron`; storage purges run from the app's job (existing `purgeExpiredPhotos`, to be rebuilt on Supabase). Each run emits `retention_job_run` and a row in `privacy.deletion_log`; overdue counts show on dashboard D10 and page the CTO.

Backups: published window N days (CONFIRM against the Supabase plan; Pro is believed to keep about 7 daily backups; PITR is not recommended because it lengthens the window). After any restore run `select privacy.replay_tombstones();` before the app is reopened.

## 5. Access control

Principles: least privilege, named accounts, MFA everywhere, no shared credentials, secrets only in Vercel/Supabase settings (checklist Part 3 to 11), quarterly access review recorded.

| Role | Gets | Never gets |
|---|---|---|
| Owner | all dashboards, Supabase admin (MFA), Stripe, vendor consoles; break-glass | n/a, but photo viewing only through the takedown/safety process |
| CTO/engineering | service role in server env; application logs (30 days); `analytics_writer` | production photos in dev; copies of production data on laptops |
| Head of Data | `analyst_ro`, `ml_ro`, `privacy_admin` for deletion ops only; Metabase admin | `ml.text_samples` ad hoc; photos |
| CMO | Metabase groups: D2, D3, D11; aggregate only | event rows with `subject_id`, order identifiers |
| CFO | Metabase groups: D1, D6, D7, D9 | rows with `subject_id` |
| CX | helpdesk; order lookup tool (status, items, no art by default); deletion/export request queue | photo storage; analytics |
| Attorney | consent ledger, deletion log, this document on request | n/a |
| Contractors | none by default; if needed, a scoped role with an NDA and expiry | any production export |
| Model-vendor APIs | the minimum prompt/images for one call | account data, order data |

Technical controls: RLS enabled on every table with no permissive policy; schemas `privacy`, `analytics`, `ml` not exposed to PostgREST; BI uses `analyst_ro` through the pooler with SSL; `ml.text_samples` and `ml.training_candidates` are not readable by BI roles; service-role key server-only; photo URLs are short-lived signed URLs; access to production photos by a human is a logged exception handled under the takedown/CSAM procedure, and the support tool does not render photos by default (06 req 31).

## 6. Deletion propagation

Triggers: delete-my-data, delete-account, consent withdrawal (scope-specific), 90-day purge, guest expiry, under-18 actual knowledge, takedown. One request creates `privacy.deletion_requests` (due in 30 days; legal outer bound 45 days, 02 s7) and the tasks below.

| Target | Mechanism | Done when | Retained after |
|---|---|---|---|
| Photos, thumbnails, derived crops, CDN | storage adapter `remove()` + cache purge | object gone, task `storage.photos_and_art` done | nothing |
| Saved People, drafts, addresses, generated art, jobs | app delete flow (`deleteUserBookData` + account delete) | rows removed | order facts per row below |
| `analytics.events`, `sessions` | `privacy.delete_subject()` | zero rows for subject and linked anonymous ids | nothing |
| `ml` behavioural tables (feedback, edits, pairs, qa_results, outcomes, text_samples) | `delete_subject()` | zero rows | nothing |
| `ml.generation_attempts` | **anonymise**: null subject, job, creation, prompt/output hashes, output ref, name-bearing params | row kept for unit economics | cost, model, latency, status |
| `ml.training_candidates`, datasets | withdraw candidates; flag every dataset containing them `needs_rebuild` | rebuild scheduled | metadata only (no content) |
| Order and invoice facts | unlink subject, null region and campaign; invoices stay with Stripe/CPA | task `retained_by_law` with reason | financial facts, 7 years |
| Consent ledger | retained 5 years without photos | `purge_after` | ledger row |
| Email (Resend), helpdesk | vendor deletion API/manual task | task done | none |
| Stripe | delete saved payment methods; legal retention stays | task done | Stripe's own records |
| Lulu, Prodigi | deletion request once fulfilment complete (DPA) | task done | per DPA |
| OpenRouter / model providers | nothing persisted with ZDR; no prompt logging; confirm in writing | confirmation on file | none |
| PostHog or other tool (if ever adopted) | delete-person API by distinct id | task done | none |
| Warehouse / exports / BI cache | replay tombstones; extracts expire in 30 days; cache TTL 24 h | tombstone replay count 0 | none |
| Backups | expire within the published window; `replay_tombstones()` after restore | window passed | disclosed to the user |
| Deletion log | counts only, no subject id | permanent | audit |

Sequence for `delete_subject(subject, kind, channel)`: (1) withdraw training candidates and flag datasets; (2) delete behavioural and content-bearing rows; (3) anonymise generation logs; (4) delete the identity link and write the tombstone; (5) create vendor/storage tasks as `pending`. Steps 1 to 4 are one transaction in Postgres (tested in PGlite with synthetic rows). Crypto-shredding: after step 4 no surviving copy of the data can be tied to a person because `privacy.subjects` is the only join between a pseudonym and an auth user.

Export (CCPA access right, 02 s7): `exportUserData` (existing) must add analytics and ml rows by `subject_id` (events as JSON, feedback, outcomes) through a `privacy_admin` function; the export never includes other users' data or internal scoring.

Edge cases: guest who later signs up (merge, then delete the survivor); user who deletes while an order is in print (order facts and ship-to are retained until the order is closed and then scrubbed, as in the existing `Order.scrubbed` flag); recipient who is not a user (see 11.A); dataset that included a now-deleted user (rebuild flag, never silent).

## 7. Vendor data flows

| Vendor | Receives | Class | Purpose | Contract status (02 s10) | Training/retention position | Action |
|---|---|---|---|---|---|---|
| Supabase | everything operational; analytics/ml schemas | all | DB, auth, storage | DPA v1 (1 Aug 2026) in ToS; SCCs | processor | Pro plan, region US East, sub-processor notices |
| Vercel | requests, logs, env | C0/C2 | hosting | DPA for Pro | processor | Pro plan; logs 30 days; no bodies |
| OpenRouter | prompts, photos for image/vision calls, QA images | C2/C3/C4 | model routing | no DPA found | "no persistence of images beyond routing"; providers may retain/train unless ZDR | `provider.zdr = true` on every photo call, prompt logging OFF, ask for DPA; record `zdr_requested` in ledger |
| Google (Gemini via OpenRouter) | images, prompts | C3/C4 | image generation | no consumer DPA; paid tier only | unpaid tier trains: forbidden route | confirm paid/Vertex route with OpenRouter |
| Anthropic (via OpenRouter) | text, vision QA images | C3/C4 | story, intake, QA | via OpenRouter | no training on commercial content | confirm in writing |
| Stripe | email, name, address, payment | C2 | payments, tax | online DPA (not read) | independent controller for some data | accept DPA; server-side events only |
| Lulu | print PDFs, ship-to | C2/C4 | books | API terms + DPA to read | processor | sign DPA; ask artwork retention |
| Prodigi | print files, ship-to | C2/C4 | cards | DPA referenced in terms | processor | request and sign |
| Resend | email, first name, message content | C2 | email | DPA | processor | no children's details beyond first names |
| Sentry or similar | error traces | C0 | monitoring | to sign | must scrub request bodies and user data | `beforeSend` scrubbing, no replay |
| BI host (Fly/Render/VPS) | analyst_ro credentials; query results cached | C1 | dashboards | to sign if third party | pseudonymous only | SSO, cache TTL 24 h |
| Helpdesk (TBD) | tickets, attachments | C2/C3 | support | to sign | attachments may contain photos | disable attachment previews; retention 24 months |
| Ad platforms (Meta, Google Ads, Pinterest, TikTok) | marketing-page pixels (consented) and server purchase event | C1 minimal | acquisition | platform terms | "sharing" under CCPA-style laws | no tags on creator/proof/cart/checkout/account; payload per attorney; GPC honoured |
| PostHog / Plausible (optional, not at launch) | allowlisted events | C1 | analytics | to sign | | defer |

All vendors are listed in the Privacy Policy by category (02 s11). Sub-processor notices subscribed for Supabase, Vercel, Resend.

## 8. Logging and engineering hygiene (06 req 30)

- Application logs never contain prompts, chat text, story text, names, addresses, emails, photo bytes or signed URLs; log ids and codes only (job id, creation id, model, cost, moderation result, consent id).
- Error reporting scrubs bodies and cookies before send.
- `ml.prompt_versions.template_text` stores templates with placeholders only.
- Test fixtures: no real people's data; the golden set is synthetic or released.
- Dev environments use mock mode or synthetic data; production exports to laptops are prohibited.
- CI runs the tracking-plan validator (no PII property names), the schema lint (every analytics/ml table has `subject_id` unless listed in `privacy.non_subject_tables`), and a secret scanner.

## 9. Incident response basics

**Definition.** A suspected or confirmed event where personal data (especially C2/C4) was exposed, altered, lost or processed outside policy, or where a vendor reports the same. Includes: leaked service-role or API key, public bucket, PII found in analytics, model vendor retention/training disclosure, mis-sent email with children's details, wrong-user data in an export, dataset or model built on ineligible data.

**Severity.** S1: children's photos or likeness, or any C2 at scale, exposed or exfiltrated. S2: C2/C3 exposed to one other user, or ineligible data in a dataset. S3: policy deviation without exposure (overdue purge, missing consent record).

**First hour (any severity):**
1. Declare the incident, name an incident lead (default CTO), open a private incident log (time-stamped, facts only).
2. Contain: rotate the exposed key (Supabase service role, OpenRouter, Stripe, Resend, printer keys), make buckets private, disable uploads (feature flag), set `GENERATION_DAILY_SPEND_CAP_USD` low, block the offending route, revoke sessions.
3. Preserve evidence: snapshot relevant logs before the 30-day expiry; legal hold flag suspends purge for the affected scope only (record in `privacy.deletion_log`).
4. Assess scope with queries (which subjects, which classes, which time window); do not copy personal data into chat tools or tickets.
5. Notify: owner immediately; attorney within 24 hours for S1/S2; insurer per policy; affected vendors.

**Notification.** US state breach laws and the privacy statutes have their own triggers and clocks; the attorney decides notification of individuals and regulators (ATTORNEY 11.A); we pre-draft templates and keep the user/contact lookup ready. No notification text is sent without attorney review.

**Data-specific runbooks**
- PII found in analytics: stop the sender, delete offending rows by event name and property path, rebuild affected aggregates, fix the validator rule, record in log, review whether any export left the building.
- Ineligible record in a training dataset: freeze the dataset (`retired_at`), remove members, rebuild, list any model built from it in `ml.model_registry`, attorney decides on model handling.
- Vendor says it retained/trained on photos: stop routing to that route (switch the model chain), request deletion in writing, record, assess disclosure duties.
- Suspected CSAM: do not open, copy or forward; quarantine, preserve, report per the attorney-approved procedure (02 s8, 06 req 18); never route through analytics.
- Backup restore: run `privacy.replay_tombstones()`, verify D10 shows zero tombstoned subjects present.

**After:** post-incident review within 5 business days (cause, timeline, what detection missed, actions with owners), update controls and the tracking-plan validator, twice-yearly tabletop (one S1 photo-exposure scenario, one PII-in-analytics scenario).

## 10. Monitoring the program

D10 (`04-kpis-and-dashboards.md`) is the live control panel: consent coverage 100%, overdue photos 0, deletion tasks older than 20 days 0, unknown events 0, tier mix, tombstone replay 0. A monthly review is minuted: sample five deleted subject ids from tombstones and confirm zero rows in every schema; list vendor and wording changes; confirm the retention job ran 30/30 days.

## 11. Data-protection items for the attorney

Priority: **L** blocks launch; **T1** blocks enabling box E or any text sample; **T2** blocks any training use; **Q** quality of life. These supplement the open items already in `docs/legal/00-summary.md` and 06 section H (req 54 to 57); they do not replace them.

### A. Operational data (L unless stated)
1. **L.** Privacy Policy treatment of first-party analytics with a pseudonymous `subject_id`: notice content, whether an opt-out/GPC/banner choice is required, CIPA/wiretap theories for server and client event collection, and whether "operational analytics" can be T0 without consent.
2. **L.** Whether the declared `age_band` of a depicted child, stored for purge/consent logic, is "known child" data requiring consent under state comprehensive laws (02 s3).
3. **L.** Retention periods in section 4: analytics 13 months, ledger 24 months, creation facts 24 months, tickets 24 months, tombstones 24 months, consent ledger 5 years, invoices 7 years; the 90-day/120-day photo rule for open orders.
4. **L.** What may lawfully remain after a deletion request: unlinked order facts, anonymised cost ledger, consent ledger, deletion log, tombstone ids. Whether a random UUID in a tombstone is personal data. 30-day target vs 45-day statutory outer limit.
5. **L.** Whether anonymised ledger and order-fact rows meet a de-identification standard (CCPA: reasonable measures, public commitment, no re-identification, contractual flow-down), given shipping country is kept and region/campaign removed.
6. **L.** Server-side conversion events to ad platforms: allowed payload (value, currency, event id, no email hash?), whether this is "sharing", GPC/opt-out handling, and the "no tags on creator/proof/cart/account" rule.
7. **L.** Email: confirm no open-tracking pixel in transactional email and treatment of click tracking; `proof_link_opened` design.
8. **L.** Moderation/abuse log retention (12 months) and the separate store for CSAM evidence and NCMEC reporting; `photo_upload_blocked` carries no evidence.
9. **L.** Under-18 actual-knowledge handler: what record may be kept of a locked/deleted account.
10. **L.** Vendors: DPAs and sub-processor terms for Supabase, Vercel Pro, Stripe, Resend, Lulu, Prodigi, OpenRouter, Sentry, BI host, helpdesk; written OpenRouter/Google/Anthropic position on ZDR, retention and training for the image models in use.
11. **L.** Recipients (third parties) named in orders, addresses and reminders: notice and deletion obligations.
12. **L.** Illinois: accept with consent or restrict uploads; and written confirmation that no image-derived attribute is computed anywhere (data plan forbids it).
13. **L.** Breach notification matrix for the states of likely customers; incident response plan above; cyber/media insurance exclusions for AI and biometric claims (06 req 56).
14. **L.** Application log retention (30 days) and legal hold rules.
15. **Q.** Support tickets with attachments that may include photos of children: retention, deletion, access.

### B. Tier T1, improvement use of scrubbed text and edits (before box E ships)
16. **T1.** Wording of box E and where it appears; whether adult consent is adequate for text that mentions a minor's name or facts, even after scrubbing; whether this is necessary at all if the purpose is within "business purposes" (opt-in preferred as the safer path).
17. **T1.** The scrub standard (typed placeholder replacement of names, places, dates, contact data; PII scan pass) and whether scrubbed text is still personal information for access and deletion rights.
18. **T1.** Reason-coded feedback about a depicted child's drawing (e.g., "likeness off") stored under T0: is it child data.

### C. Tier T2, any training use (before box F is shown or any training starts)
19. **T2.** Whether any training use is permissible for content from a creation that involved a minor's information (recommendation: never), and the exact definition of "not likeness / not photo-derived" the attorney will accept.
20. **T2.** Whether a stylised illustration derived from a photo of a person is the person's likeness / personal information (assumed yes) and the effect on retention of order art beyond 12 months.
21. **T2.** Vendor terms (Anthropic, Google, OpenRouter) on using outputs to train or distil other models; permitted scope and attribution.
22. **T2.** Policy for models already trained when a user withdraws (retrain schedule vs disclosure that trained models are not unwound).
23. **T2.** Automated decision-making and profiling duties (CPPA regulations, 02 s4 gap) for template/style recommendations and any scoring; need for risk assessments for T1/T2 processing.
24. **T2.** Distinguishing box D (public showcase) from box F (training) and from box C (keep Saved Person) in wording and logs.

### D. Other
25. **Q.** Releases for the golden set (volunteers, staff, and the Eye Story family, which includes minors) and their storage term.
26. **Q.** Employee/contractor confidentiality and access terms for anyone who can read operational data.
27. **Q.** Whether an annual privacy/data protection assessment should be documented now to satisfy the written information security program expectation (02 s2).

## 12. What the owner decides (summary)

1. Open or keep closed box E (T1) at launch (recommended: build, hide, enable after wording sign-off, or enable at launch only if the attorney clears it).
2. Whether T2/box F ever opens (recommended: not before month 12, never for photo-derived content).
3. Analytics tooling spend: BI host and later PostHog (section 7 of `02`).
4. Retention values in section 4, in particular the 24-month figures.
5. Illinois policy (accept vs restrict).
6. Backup window and whether to buy PITR (recommended: no).
