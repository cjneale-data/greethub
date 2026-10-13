// Usage: node docs/data/tools/build-tracking-plan.mjs
// Emits docs/data/tracking-plan.json and docs/data/01-tracking-plan.md, and validates the plan (exit 1 on any violation).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { E } from "./events-a.mjs";
import "./events-b.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = (f) => path.join(here, "..", f);

/* ------------------------------------------------------------------ static sections */
export const SENSITIVITY = [
  { class: "C0", name: "System/operational", examples: "job ids, model names, cost, latency, status codes, printer states", storage: "analytics.*, ml.*", personal_data: false, default_retention: "24 months (raw), aggregates indefinitely" },
  { class: "C1", name: "Pseudonymous behaviour", examples: "event stream keyed by subject_id/anonymous_id, enumerated brief choices, order facts without identifiers", storage: "analytics.*, ml.*", personal_data: true, default_retention: "13 months raw, order facts per finance rules" },
  { class: "C2", name: "Personal identifiers", examples: "email, name, address, phone, IP, user agent, character first names, recipient names", storage: "operational DB, privacy.consent_records (ip/ua), vendors only", personal_data: true, default_retention: "per operational schedule; never in analytics or ml" },
  { class: "C3", name: "User-authored or user-derived text", examples: "story idea, memory, inside jokes, card message, chat turns, free-text feedback, story text with names", storage: "operational DB; ml.text_samples only if T1+ and scrubbed", personal_data: true, default_retention: "draft/order retention; text_samples 12 months" },
  { class: "C4", name: "Likeness (restricted)", examples: "uploaded photos, identity sheets, model sheets, any generated art derived from a photo of a person, anything depicting a minor", storage: "private object storage only, never copied to analytics/ml", personal_data: true, default_retention: "90-day photo purge; Saved Person 24 months inactivity; order art 12 months" },
  { class: "C5", name: "Prohibited: never collected or derived", examples: "face embeddings, face geometry, face-match results, age/gender/ethnicity inference from images, EXIF GPS, card numbers, session replay of creator pages, keystroke capture", storage: "nowhere", personal_data: true, default_retention: "n/a" },
];

export const CONSENT_TIERS = [
  { tier: "T0", name: "Operational (always on)", basis: "needed to run, secure, price and support the service; disclosed in the Privacy Policy",
    allowed: ["C0 and C1 events in the tracking plan", "cost/latency/QA logs", "order and fulfilment facts", "consent and deletion ledgers", "enumerated brief choices and counts/lengths of free text", "reason-code feedback tied to a generation"],
    never: ["any C2 in analytics/ml", "any C3 text", "any C4 content", "third-party ad tags on creator/proof/cart/account pages"],
    ui: "none beyond the privacy notice; honour account-level analytics opt-out and GPC for any third-party tool", legal_gate: "attorney confirms T0 notice wording and that first-party analytics needs no banner choice" },
  { tier: "T1", name: "Help improve GreetHub (opt-in)", basis: "separate, unticked, revocable checkbox E, off by default (proposed)",
    allowed: ["scrubbed story/message text and edit before/after pairs (ml.text_samples)", "free-text feedback after PII scrub", "chat user turns after PII scrub", "used for: prompt design, evals, quality scorer for TEXT, recommendations"],
    never: ["photos", "photo-derived art", "text with unscrubbed names", "use for training or fine-tuning a model (that is T2)"],
    ui: "Settings toggle plus one unticked line at proof approval; wording to attorney", legal_gate: "attorney approves wording and scrub standard" },
  { tier: "T2", name: "Allow training use (opt-in, blocked)", basis: "separate checkbox F, hidden in the UI until a row exists in privacy.legal_signoffs for the scope",
    allowed: ["only items passing every gate in ml.training_candidates: T2 consent + legal sign-off + PII scan + moderation clean + NOT photo-derived + NOT likeness + NOT minors-possible"],
    never: ["any content from a creation that used uploaded photos", "any art depicting a real person or a minor", "retroactive use of data collected under T0/T1", "use of box D (marketing display) as training consent"],
    ui: "not shown at launch", legal_gate: "written attorney opinion per scope (see 05 gates), vendor-terms review for any distillation from third-party model outputs" },
  { tier: "T-never", name: "Never collected or used for training", basis: "hard constraint",
    allowed: [], never: ["photos of any person, especially minors", "faces, face geometry, embeddings, face-derived attributes", "identifiable PII (names, emails, addresses, phones)", "illustrations derived from uploaded photos", "payment data", "session replays of creator/proof pages"], ui: "n/a", legal_gate: "not unlockable by consent in this plan; only a fresh attorney opinion plus a separate parent-signed release could reopen it, and this plan does not propose it" },
];

export const KPIS = {
  NSM_funnel: "North star: successful orders per week", A1_visitors: "Visitors", A2_channel_mix: "Channel mix and attribution", A3_guest_try_rate: "Guest try rate (CFO Inputs B15)", A3_template_ctr: "Template click-through", A4_agent_orders: "Orders and spend through AI assistants (agent API)",
  B1_visitor_to_signup: "Visitor to sign-up (CFO Inputs B12)", B2_signup_to_start: "Sign-up to creator start (CFO Inputs B13)", B3_brief_completion: "Brief completion rate", B4_sheet_approval: "Model sheet approval rate", B5_proof_approval: "Proof approval rate",
  C1_start_to_purchase: "Creator start to purchase (CFO Inputs B14)", C2_proof_to_cart: "Proof to cart", C2_cart_to_checkout: "Cart to checkout", C3_checkout_to_paid: "Checkout to paid", C4_aov: "Average order value", C5_items_per_order: "Items per order (CFO Inputs B9)", C6_mix: "Product mix (CFO SKU table)",
  Q1_first_pass_qa: "First-attempt QA pass rate", Q2_auto_reroll_rate: "Automatic re-roll rate", Q3_reroll_rate: "User re-roll rate (CFO Inputs B34-35)", Q4_sheet_redo_rate: "Model sheet redo rate", Q5_generation_failure: "Generation failure rate", Q6_user_rating: "User rating (thumbs/NPS/CSAT)", Q7_approval_without_reroll: "Proof approved with no re-roll", Q9_intake_friction: "Intake friction", Q10_story_edit_rate: "Story edit rate",
  U1_cost_per_creation: "Model cost per creation (CFO Model Costs)", U2_guest_preview_cost: "Guest preview cost", U3_abandoned_draft_cost: "Abandoned draft cost (CFO Inputs B17)", U4_cost_per_call: "Cost per call by model", U5_print_ship_cost: "Print and ship cost (CFO SKU table)", U6_cac_by_channel: "CAC by channel (CMO CSV)", U7_spend_vs_cap: "Spend vs cap", U8_contribution_margin: "Contribution margin per order",
  R1_repeat_rate: "Repeat rate (CFO Inputs B32)", R3_reminder_opt_in: "Reminder opt-in", R3_saved_person_rate: "Saved Person rate", R4_template_popularity: "Template and style popularity",
  F1_on_time_delivery: "On-time delivery", F2_needs_attention_rate: "Needs-attention rate", F3_refund_reprint_rate: "Refund and reprint rate (CFO Inputs B36-37)", F4_print_reject_rate: "Print file reject rate",
  S1_contact_rate: "Support contacts per 100 orders", S2_first_response: "Support first response time",
  P1_deletion_sla: "Deletion/export request SLA", P2_photo_purge_ontime: "Photo purge on time", P3_consent_coverage: "Consent coverage of uploads", P4_tier_mix: "Consent tier mix", P5_moderation_rate: "Moderation block rate",
};

const ENUM_ALIASES = {
  "brief.OCCASIONS": ["birthday", "thank_you", "wedding", "anniversary", "new_baby", "get_well", "congratulations", "mothers_day", "fathers_day", "valentines", "christmas", "graduation", "sympathy", "just_because", "other"],
  "brief.TONES": ["funny", "heartfelt", "adventurous"],
  "brief.AGE_BANDS": ["baby", "toddler", "child", "teen", "adult", "senior", "pet"],
  art_style_ids: "app/packages/shared/src/styles.ts ART_STYLE_IDS",
  skus: ["card_digital", "card_mailed", "book_digital", "book_24", "book_32"],
  order_statuses: ["paid", "preparing", "printing", "shipped", "delivered", "needs_attention", "cancelled", "refunded"],
  channels: ["meta", "pinterest", "google_search", "tiktok", "creator", "seo", "email", "direct", "referral", "other"],
  brief_field_keys: ["relationship", "recipientName", "occasion", "occasionOther", "tone", "artStyle", "idea", "message", "insideJokes", "include", "avoid", "insideIllustration", "signoff", "readingAge", "pageCount", "characters", "pet", "dedication", "shipTo", "deliveryDate", "delivery", "mailTo"],
};

/* ------------------------------------------------------------------ parse + validate */
const errors = [];
const DENY = /(^|_)(email|first_name|last_name|full_name|name|address|phone|ip|ua|user_agent|filename|file_name|caption|zip|postal|street|dob|birth|lat|lng|latitude|longitude|exif|body|transcript|password|token|card_number)(_|$)/;
const ALLOW = new Set(["marketing_email_opt_in", "email_kind"]); // flags and categories, not addresses
const TYPES = /^(string|int|decimal|bool|timestamp|date|enum\([^)]*\)|enum\[\]\([^)]*\)|string\[\])$/;
const SRC = ["client", "server", "worker", "webhook", "batch"];
const names = new Set();

const parseProp = (spec, evName) => {
  const [name, type, req, ...desc] = spec.split("|");
  if (!name || !type || !["R", "O"].includes(req)) errors.push(`${evName}: bad property spec "${spec}"`);
  if (!/^[a-z][a-z0-9_]*$/.test(name)) errors.push(`${evName}.${name}: not snake_case`);
  if (DENY.test(name) && !ALLOW.has(name)) errors.push(`${evName}.${name}: property name matches PII deny-list`);
  if (!TYPES.test(type)) errors.push(`${evName}.${name}: unknown type ${type}`);
  const m = type.match(/enum\[?\]?\(([^)]*)\)/);
  let enumRef;
  let values;
  if (m) {
    const inner = m[1];
    if (ENUM_ALIASES[inner]) { enumRef = inner; values = Array.isArray(ENUM_ALIASES[inner]) ? ENUM_ALIASES[inner] : undefined; }
    else values = inner.split(",");
  }
  return { name, type: type.startsWith("enum") ? (type.startsWith("enum[]") ? "enum[]" : "enum") : type, required: req === "R", ...(values ? { values } : {}), ...(enumRef ? { enum_ref: enumRef } : {}), sensitivity: "C1", description: desc.join("|") };
};

const events = E.map((e) => {
  if (names.has(e.name)) errors.push(`duplicate event ${e.name}`);
  names.add(e.name);
  if (!/^[a-z]+(_[a-z0-9]+)+$/.test(e.name)) errors.push(`${e.name}: not snake_case object_action`);
  if (!SRC.includes(e.src)) errors.push(`${e.name}: bad source`);
  if (!["C0", "C1"].includes(e.cls)) errors.push(`${e.name}: analytics events may only be C0 or C1`);
  if (!e.kpis?.length) errors.push(`${e.name}: no KPI`);
  for (const k of e.kpis ?? []) if (!KPIS[k]) errors.push(`${e.name}: unknown KPI ${k}`);
  if (!e.owner || !e.ret || !e.trigger) errors.push(`${e.name}: missing owner/retention/trigger`);
  const props = e.props.map((p) => parseProp(p, e.name));
  if (e.cls === "C0") for (const p of props) p.sensitivity = "C0";
  return {
    name: e.name, version: 1, domain: e.domain, funnel_stage: e.stage, phase: e.phase, source: e.src, trigger: e.trigger,
    sensitivity: e.cls, min_consent_tier: e.tier, owner: e.owner, retention_days: e.ret, kpis: e.kpis,
    identity: e.cls === "C0" ? "none or job-level; subject_id optional" : "anonymous_id until signup, then subject_id",
    ...(e.replaces ? { replaces_ux_spec_event: e.replaces } : {}),
    ...(e.note ? { note: e.note } : {}),
    ...(e.attorney ? { attorney_review: e.attorney } : {}),
    properties: props,
  };
});

const unusedKpis = Object.keys(KPIS).filter((k) => !events.some((e) => e.kpis.includes(k)));
// KPIs fed by non-event sources (spend imports, printer invoices, finance) are listed explicitly.
const NON_EVENT_KPIS = new Set(["A2_channel_mix", "S2_first_response"]);
for (const k of unusedKpis) if (!NON_EVENT_KPIS.has(k)) errors.push(`KPI ${k} has no feeding event`);
// all 13 UX-spec events must be covered
for (const u of ["view_home", "template_click", "creator_start", "guest_preview_rendered", "signup_prompt_shown", "signup_complete", "brief_complete", "book_sheet_approved", "add_to_cart", "checkout_start", "purchase", "reroll_used", "proof_email_open"]) {
  if (!events.some((e) => e.name === u || e.replaces_ux_spec_event === u)) errors.push(`UX spec event ${u} not covered`);
}

if (errors.length) {
  console.error("TRACKING PLAN INVALID:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}

/* ------------------------------------------------------------------ JSON */
const plan = {
  $schema_note: "Machine-readable tracking plan. Generated by docs/data/tools/build-tracking-plan.mjs from events-a.mjs and events-b.mjs; edit those, not this file.",
  plan_version: "1.0.0",
  generated_for: "GreetHub launch (Nov 2026)",
  conventions: {
    event_name: "snake_case object_action, past tense, one fact per event (page_viewed, proof_approved). No UI-widget names, no vendor names.",
    property_name: "snake_case; units as suffix (_ms, _usd, _cents, _bytes, _chars, _s); booleans start with is_/has_ or are plain adjectives; ids end in _id and are opaque",
    money: "customer money in integer cents (_cents); model/API cost in decimal USD (_usd), taken from OpenRouter usage.cost",
    time: "UTC ISO-8601 occurred_at set where the fact happened; received_at set by the collector",
    enums: "lower_snake_case, closed lists, extending a list is a minor version bump; unknown values rejected by ingest_event",
    free_text: "never an event property. Record length (_chars), presence (has_*) or a controlled reason code",
    versioning: "schema_version per event; additive changes keep the version; renames or semantic changes bump it and keep the old one for 90 days",
    dedupe: "event_id is a client- or server-generated UUIDv7; (event_id, occurred_at) is unique, so a retry must resend the same occurred_at",
  },
  envelope: [
    { field: "event_id", type: "uuid", required: true }, { field: "event_name", type: "string", required: true }, { field: "schema_version", type: "int", required: true },
    { field: "occurred_at", type: "timestamp", required: true }, { field: "source", type: "enum(client,server,worker,webhook,batch)", required: true },
    { field: "anonymous_id", type: "uuid", required: false, note: "first-party cookie gh_aid; absent for webhook/worker events" },
    { field: "subject_id", type: "uuid", required: false, note: "pseudonym from privacy.subjects; never the auth uid" },
    { field: "session_id", type: "uuid", required: false }, { field: "creation_id", type: "string", required: false }, { field: "order_id", type: "string", required: false }, { field: "job_id", type: "string", required: false },
    { field: "app_version", type: "string", required: false }, { field: "props", type: "object", required: true },
  ],
  identity: {
    anonymous_id: "random UUID in first-party cookie gh_aid (365 days) set only when analytics is allowed; if not allowed, no id is set and client events are dropped, server events for commerce and operations still carry subject_id",
    guest_subject: "Supabase anonymous sign-in uid maps to a subject_id at first server contact (privacy.subjects, is_guest = true)",
    stitching: ["guest sign-in: link anonymous_id -> subject_id", "signup (upgrade in place): same auth uid, is_guest false, no merge needed", "login to an existing account from a guest session: privacy.merge_subjects(guest, existing)", "backfill: events with the anonymous_id and null subject_id are updated at link time"],
    cross_device: "only via login; no probabilistic or fingerprint matching, ever",
    ad_platforms: "no identifiers sent from creator/proof/cart/account; server purchase events limited to what the attorney approves",
  },
  sensitivity_classes: SENSITIVITY,
  consent_tiers: CONSENT_TIERS,
  enum_aliases: ENUM_ALIASES,
  kpis: KPIS,
  ux_spec_event_mapping: Object.fromEntries(events.filter((e) => e.replaces_ux_spec_event).map((e) => [e.replaces_ux_spec_event, e.name])),
  events,
};
writeFileSync(out("tracking-plan.json"), JSON.stringify(plan, null, 2) + "\n", "utf8");

/* ------------------------------------------------------------------ MARKDOWN */
const byDomain = {};
for (const e of events) (byDomain[e.domain] ||= []).push(e);
const DOMAIN_TITLES = { acquisition: "Acquisition and visit", guest_preview: "Guest preview", auth: "Sign-up and login", intake: "Brief and Greet Guide chat", consent: "Consent", photos: "Photos", story: "Story", sheet: "Model sheet", render: "Rendering", qa: "QA", feedback: "Re-rolls, versions and ratings", proof: "Proof", commerce: "Cart, checkout and payment", fulfillment: "Fulfilment", lifecycle: "Post-purchase and lifecycle", support: "Support", privacy: "Privacy operations", safety: "Safety and moderation", experiment: "Experiments" };
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
let catalog = "";
for (const [d, list] of Object.entries(byDomain)) {
  catalog += `\n### ${DOMAIN_TITLES[d] ?? d}\n\n`;
  catalog += "| Event | Source | Class / tier | Owner | Retention | Feeds KPIs | Phase |\n|---|---|---|---|---|---|---|\n";
  for (const e of list) catalog += `| \`${e.name}\` | ${e.source} | ${e.sensitivity} / ${e.min_consent_tier} | ${e.owner} | ${e.retention_days} d | ${e.kpis.join(", ")} | ${e.phase} |\n`;
  for (const e of list) {
    catalog += `\n**\`${e.name}\`** - ${e.trigger}\n\n`;
    catalog += "| Property | Type | Req | Notes |\n|---|---|---|---|\n";
    for (const p of e.properties) {
      const t = p.type === "enum" || p.type === "enum[]" ? `${p.type}${p.enum_ref ? ` (${p.enum_ref})` : p.values ? ` (${p.values.join(", ")})` : ""}` : p.type;
      catalog += `| \`${p.name}\` | ${cell(t)} | ${p.required ? "R" : "O"} | ${cell(p.description)} |\n`;
    }
    if (e.note) catalog += `\nNote: ${e.note}\n`;
    if (e.attorney_review) catalog += `\nATTORNEY: ${e.attorney_review}\n`;
  }
}

const attorneyList = events.filter((e) => e.attorney_review).map((e) => `- \`${e.name}\`: ${e.attorney_review}`).join("\n");
const uxMap = Object.entries(plan.ux_spec_event_mapping).map(([k, v]) => `| \`${k}\` | \`${v}\` |`).join("\n");
const counts = { total: events.length, launch: events.filter((e) => e.phase === "launch").length, client: events.filter((e) => e.source === "client").length, c0: events.filter((e) => e.sensitivity === "C0").length };

const md = `# 01. Tracking plan

Owner: Head of Data. Machine-readable twin: \`tracking-plan.json\` (the build script \`tools/build-tracking-plan.mjs\` generates both this event catalogue and the JSON from \`tools/events-a.mjs\` and \`tools/events-b.mjs\`, and fails on any violation of the rules below). Date: 2026-10-10.

Scope: ${counts.total} events (${counts.launch} at launch, ${counts.total - counts.launch} after), only ${counts.client} fired from the browser. Everything that can be recorded on the server is recorded on the server. This replaces the 13-event list in \`docs/cmo/ux-spec.md\` section 12 (mapping at the end of this file).

## 1. Principles

1. **Server-side first.** The browser is untrusted, blocked by extensions, and sits on pages that show children's names. A fact is client-side only if it happens purely in the browser (page view, banner choice, viewing time, rating click).
2. **Every event has a sensitivity class** (C0 to C5, section 3) and a minimum consent tier (T0 to T2). The ingest function rejects events whose name is not in \`analytics.event_definitions\`, and the table has a CHECK that only C0/C1 can be stored.
3. **No free text, no content, no identifiers in properties.** Lengths, flags, controlled reason codes and enumerated values only. The build script rejects property names such as email, name, address, phone, ip, filename, caption, zip, transcript.
4. **One fact, one event, one owner.** Counts of purchases come from \`payment_succeeded\` (Stripe webhook) and nothing else. Page views never imply funnel steps.
5. **Deletion must reach every event.** Every row carries \`subject_id\` or \`anonymous_id\` linked to one, so \`privacy.delete_subject()\` can remove it (03-schema.sql).
6. **Events feed named KPIs.** No event without a KPI in section 8 of \`04-kpis-and-dashboards.md\`.

## 2. Naming conventions

| Item | Rule | Example |
|---|---|---|
| Event name | \`snake_case\`, object then past-tense verb, no vendor or UI words | \`model_sheet_approved\` |
| Property | \`snake_case\`, unit suffix, booleans \`is_/has_\`, ids end \`_id\` and are opaque | \`cost_usd\`, \`latency_ms\`, \`has_note\` |
| Money | customer money in integer cents (\`_cents\`), model cost in decimal USD (\`_usd\`) from OpenRouter \`usage.cost\` | \`total_cents\` |
| Time | UTC ISO-8601 \`occurred_at\` (when it happened), \`received_at\` (collector) | |
| Enums | lower_snake_case closed lists; unknown values rejected | \`charge: free_redo\` |
| Versioning | \`schema_version\` per event; additive = same version, rename/semantic change = bump and dual-write 90 days | |
| Dedupe | \`event_id\` UUIDv7 generated where the fact happens; webhook events use the Stripe/printer event id hashed to a UUID | |
| Page ids | \`p1..pN\`, \`cover\`, \`back\`, \`card_front\`, \`card_inside\` as in \`PAGE_ID\` | |

## 3. Sensitivity classes

| Class | Name | Examples | Allowed in analytics/ml? |
|---|---|---|---|
${SENSITIVITY.map((s) => `| ${s.class} | ${s.name} | ${s.examples} | ${s.class === "C0" || s.class === "C1" ? "yes" : s.class === "C3" ? "only ml.text_samples (T1+, scrubbed)" : "no"} |`).join("\n")}

Every property inherits class C1 unless the event is C0. Class C2-C5 data never enters an event.

## 4. Consent tiers and gating

| Tier | Name | What is collected | UI |
|---|---|---|---|
${CONSENT_TIERS.map((t) => `| ${t.tier} | ${t.name} | ${t.allowed.join("; ") || "nothing"} | ${t.ui} |`).join("\n")}

Gating in code (03-schema.sql \`analytics.ingest_event\`): events with \`min_consent_tier\` above the subject's tier are dropped at the collector, not stored. The full tier policy is in \`06-data-governance.md\` and the training-eligibility gates in \`05-model-improvement-roadmap.md\`.

Client collector rules:
- No cookie or request to any analytics endpoint until the banner allows it, except the first-party strictly operational fields (CSRF/session cookie already required by auth). GPC signal is treated as "reject" for marketing and for any third-party tool.
- On \`creator\`, \`proof\`, \`cart\`, \`checkout\`, \`account\` pages no third-party script loads at all (legal 06 req 44). The first-party collector there sends only the allowlisted client events (page_viewed with coarse page_type, proof_viewed, rating_submitted, cart_viewed).
- No session replay, heatmaps with DOM text capture, autocapture of clicks/inputs, or form field value capture, anywhere.

## 5. Identity and stitching

| Id | What | Lifetime | Where |
|---|---|---|---|
| \`anonymous_id\` | random UUID, first-party cookie \`gh_aid\`, set only once analytics is allowed | 365 days | events, sessions |
| \`session_id\` | UUID, 30 minute inactivity | session | events, sessions |
| \`subject_id\` | random UUID minted for each Supabase user (anonymous or real) in \`privacy.subjects\` | until deletion | events, facts, ml |
| \`auth_user_id\` | Supabase uid | until deletion | \`privacy.subjects\` only |

Stitching rules (all in SQL: \`privacy.link_anonymous\`, \`privacy.merge_subjects\`):
1. Guest opens the creator: Supabase anonymous sign-in gives an auth uid; the server creates a \`subject_id\` (guest) and links the current \`anonymous_id\`.
2. Guest signs up: the anonymous user is upgraded in place (PLAN.md), same uid, same subject; \`is_guest\` becomes false, \`signup_completed\` fires with \`guest_draft_carried\`. Earlier events already carry the subject.
3. Guest logs into an existing account: \`merge_subjects(guest, existing)\` retargets all rows, then deletes the guest subject.
4. Pre-subject client events (landing page views) carry only \`anonymous_id\`; they are back-filled with \`subject_id\` when the link is made.
5. No fingerprinting, no IP matching, no cross-device guessing. Cross-device exists only through login.
6. Marketing attribution: first-touch is written once to the subject at signup (\`attribution_captured\`, \`signup_completed.first_touch_channel\`); last-touch is read from the session at \`payment_succeeded\`. UTM keys are an allowlist; ad click ids are not stored.

## 6. Server-side vs client-side

| Where | Events | Why |
|---|---|---|
| Client (${counts.client}) | ${events.filter((e) => e.source === "client").map((e) => "`" + e.name + "`").join(", ")} | purely browser facts |
| Server route | brief, auth, consent, photo, story, sheet, reroll, proof approval, cart, checkout, support, privacy | validated, trusted, immune to ad blockers |
| Worker | generation, render, QA, spend cap, layout, fulfilment submission | the cost and quality system of record |
| Webhook | payment, refund, dispute, printer status, email unsubscribe | the source of truth is the vendor |
| Batch | abandoned-brief/sheet derivations, retention job, training registry | computed, never emitted by the app |

Client transport: \`POST /api/t\` with a batch of up to 20 events, validated by the same plan JSON, dropped if the visitor has not allowed analytics. The Next.js route handler is the only receiver; no third-party SDK is required at launch (02-architecture.md).

## 7. Property-level privacy rules (enforced by the build script and ingest)

- Never a property: email, any name (user, recipient, character), address (state and country allowed), phone, IP, user agent string, file name, EXIF, free text, prompt text, chat text, story text, URL path or query beyond the UTM allowlist.
- Declared age bands (\`baby\`..\`senior\`, \`pet\`) are user-entered brief fields, recorded as enumerated values for purge and consent logic; they are never inferred from an image and never joined to any image-derived attribute.
- Sizes are bucketed (\`bytes_bucket\`, \`megapixel_bucket\`). No image hash or perceptual hash of an upload is stored in analytics.
- \`prompt_version_id\` identifies a template (no user data). A hash of a rendered prompt exists only in \`ml.generation_attempts.prompt_sha256\` and is nulled on deletion.
- Reason codes are controlled lists. If the UI has a free-text box the event records \`has_note\`/\`has_free_text\` only.

## 8. Event catalogue (generated)
${catalog}

## 9. Mapping from the 13 events in docs/cmo/ux-spec.md section 12

| ux-spec event | This plan |
|---|---|
${uxMap}
| \`guest_preview_rendered\` | \`guest_preview_rendered\` (unchanged name, now server/worker with cost) |
| \`signup_prompt_shown\` | \`signup_prompt_shown\` (unchanged) |

Deliberate departures: \`proof_email_open\` is replaced by \`proof_link_opened\` (click, not an open pixel); \`purchase\` is sourced only from the Stripe webhook.

## 10. Items flagged for attorney review in this file
${attorneyList}
- Whether T0 first-party analytics, including the pseudonymous \`subject_id\` link, needs an opt-out, a notice line or a banner choice under CCPA-style laws and wiretap theories (CIPA) for a US-only launch.
- Whether declared age bands on photo uploads are "known child" sensitive data under state laws.

## 11. Open questions for other teams
- CTO: where does \`creation_id\` come from in the Supabase version (BookProject.id, card draft id)? The plan assumes one opaque id per card/book.
- CMO: can each template have a stable \`template_id\`? \`channel\` values must match the CSV channel names.
- CX: helpdesk choice decides how \`ticket_id\` is created and where ticket bodies (C3, may contain children's names) live.
`;
writeFileSync(out("01-tracking-plan.md"), md, "utf8");
console.log(`ok: ${events.length} events, ${Object.keys(KPIS).length} KPIs, ${events.reduce((a, e) => a + e.properties.length, 0)} properties`);

/* ------------------------------------------------------------------ seed SQL for analytics.event_definitions */
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const seed = `-- Generated by tools/build-tracking-plan.mjs from tracking-plan.json. Run after 03-schema.sql, re-run on every plan change.
insert into analytics.event_definitions(event_name, schema_version, domain, max_sensitivity, min_tier, source, retention_days, owner, kpis)
values
${events.map((e) => `  (${q(e.name)}, ${e.version}, ${q(e.domain)}, ${q(e.sensitivity)}, ${q(e.min_consent_tier)}, ${q(e.source)}, ${e.retention_days}, ${q(e.owner)}, array[${e.kpis.map(q).join(",")}])`).join(",\n")}
on conflict (event_name) do update set schema_version = excluded.schema_version, domain = excluded.domain, max_sensitivity = excluded.max_sensitivity,
  min_tier = excluded.min_tier, source = excluded.source, retention_days = excluded.retention_days, owner = excluded.owner, kpis = excluded.kpis, deprecated_at = null;
`;
writeFileSync(out("03b-seed-event-definitions.sql"), seed, "utf8");
