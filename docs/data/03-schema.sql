-- GreetHub analytics + ML-ready schema (PostgreSQL 15+, Supabase compatible)
-- Owner: Head of Data. Status: DRAFT for CTO review; not applied anywhere.
-- Companion docs: 01-tracking-plan.md, 02-architecture.md, 06-data-governance.md
--
-- DESIGN RULES (read before editing)
--  1. Three schemas, three trust levels:
--       privacy.*   restricted. Identity map, consent ledger, deletion log, legal sign-offs. Only privacy_admin + service role.
--       analytics.* pseudonymous behaviour and commerce facts. Keyed by subject_id / anonymous_id, never email, name, address, IP.
--       ml.*        generation logs, QA, feedback, preference signals, eval sets, training-candidate registry. Pseudonymous, no photos.
--  2. subject_id is a random uuid minted by privacy.subjects. It is NOT the auth uid and not derivable from it.
--     Deleting the privacy.subjects row severs the link between any surviving copy of the data (backup, warehouse export) and a person.
--  3. No photos, no face-derived data, no embeddings of images, no free text in analytics.* (free text lives in the operational DB
--     under the order retention schedule, and in ml.text_samples only for opted-in, scrubbed rows).
--  4. Every deletable table has subject_id so privacy.delete_subject() can reach it. A CI test (see 07 DATA-014) fails if a new
--     table in analytics/ml lacks subject_id and is not listed in privacy.non_subject_tables.
--  5. Sensitivity class codes: C0 system, C1 pseudonymous behaviour, C2 personal identifier, C3 user text, C4 likeness (photo or photo-derived),
--     C5 prohibited. Only C0, C1 live in analytics.*; C3 only in ml.text_samples; C2/C4 never in these schemas.

-- gen_random_uuid() is built in from PostgreSQL 13, no extension needed.

create schema if not exists privacy;
create schema if not exists analytics;
create schema if not exists ml;

-- Roles. In Supabase create these in the dashboard/migration and map JWT roles as needed.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'privacy_admin') then create role privacy_admin nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'analytics_writer') then create role analytics_writer nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'analyst_ro') then create role analyst_ro nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'ml_ro') then create role ml_ro nologin; end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------------------------------------------------
create type privacy.sensitivity_class as enum ('C0','C1','C2','C3','C4');            -- C5 is "never stored", so not an enum member
create type privacy.consent_tier as enum ('T0','T1','T2');                           -- T0 always, T1 opt-in improvement, T2 opt-in training (blocked until legal sign-off)
create type analytics.event_source as enum ('client','server','worker','webhook','batch');
create type ml.gen_kind as enum ('text','image');
create type ml.gen_status as enum ('ok','http_error','network_error','no_image','mock','blocked','cancelled');
create type ml.candidate_status as enum ('quarantined','eligible','included','excluded','withdrawn','deleted');

-- ---------------------------------------------------------------------------------------------------------------------
-- PRIVACY SCHEMA
-- ---------------------------------------------------------------------------------------------------------------------

-- Identity map. The only place a pseudonymous subject_id is joined to an auth user. Deleting a row = crypto-shredding.
create table privacy.subjects (
  subject_id    uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,                       -- Supabase auth.users.id (anonymous or real). Null after deletion tombstone.
  is_guest      boolean not null default true,     -- true for Supabase anonymous sign-ins; false after sign-up/upgrade
  created_at    timestamptz not null default now(),
  upgraded_at   timestamptz
);
comment on table privacy.subjects is 'subject_id <-> auth user. Restricted. Row is deleted on account deletion; the subject_id then lives on only in privacy.deletion_tombstones.';

-- Anonymous visitor ids (first-party cookie gh_aid) linked to a subject once known.
create table privacy.anonymous_links (
  anonymous_id  uuid primary key,
  subject_id    uuid not null references privacy.subjects(subject_id) on delete cascade,
  linked_at     timestamptz not null default now(),
  link_reason   text not null check (link_reason in ('guest_signin','signup','login','merge'))
);
create index on privacy.anonymous_links(subject_id);

-- Consent ledger of record (legal 02 s6, 06 req 4). Mirrors and replaces the app's ConsentRecord JSON; keeps IP and UA for 5 years.
-- Photos are never stored here. wording_hash proves which text the person saw.
create table privacy.consent_records (
  consent_id        text primary key,                      -- e.g. cns_<hex>, same id the app already issues
  subject_id        uuid not null,                          -- no FK on purpose: must survive subject deletion (5 yr log)
  recorded_at       timestamptz not null,
  ip                inet,                                   -- C2. Restricted. Purged at end of retention.
  user_agent        text,
  wording_version   text not null,
  wording_hash      text not null,
  box_a_authority   boolean not null,                       -- parent/guardian + adult
  box_b_ai_notice   boolean not null,                       -- AI processing notice
  box_c_keep_person boolean not null default false,
  box_d_marketing   boolean not null default false,         -- showing finished pages publicly; NEVER implies training
  box_e_improve     boolean not null default false,         -- PROPOSED: T1 improvement opt-in (ratings, edits, scrubbed text). Attorney to finalise.
  box_f_training    boolean not null default false,         -- PROPOSED: T2 training opt-in. Must stay unreachable in the UI until a legal_signoffs row covers it.
  photo_ids         text[] not null default '{}',
  character_labels  text[] not null default '{}',           -- first names/labels as entered. C2.
  withdrawn_at      timestamptz,
  purge_after       timestamptz not null                    -- recorded_at + 5 years, or later if a legal hold applies
);
create index on privacy.consent_records(subject_id, recorded_at desc);

-- Effective consent per subject, flattened for fast joins. Written by a trigger/service on every consent change.
create table privacy.consent_state (
  subject_id         uuid primary key,
  tier               privacy.consent_tier not null default 'T0',
  analytics_ok       boolean not null default true,          -- first-party operational analytics (T0) on unless account-level opt-out/GPC says otherwise
  marketing_tags_ok  boolean not null default false,          -- ad/pixel consent (banner)
  gpc_seen           boolean not null default false,
  consent_id         text,
  wording_version    text,
  updated_at         timestamptz not null default now(),
  check (tier <> 'T2' or consent_id is not null)
);

-- Legal sign-offs gate T2 usage. No row, no training.
create table privacy.legal_signoffs (
  signoff_id    uuid primary key default gen_random_uuid(),
  scope         text not null,                               -- e.g. 'train_text_scrubbed', 'train_nonlikeness_art', 'distill_vendor_outputs'
  signed_by     text not null,                               -- attorney name/firm
  document_ref  text not null,                               -- link or file id of the written opinion
  conditions    text,
  valid_from    date not null,
  valid_until   date,
  revoked_at    timestamptz
);

-- Deletion requests and per-target tasks (propagation to every derived store and vendor).
create table privacy.deletion_requests (
  request_id    uuid primary key default gen_random_uuid(),
  subject_id    uuid not null,
  kind          text not null check (kind in ('account','data_only','consent_withdrawal','retention_purge','guest_expiry','underage_lockout')),
  requested_at  timestamptz not null default now(),
  due_by        timestamptz not null default (now() + interval '30 days'),
  completed_at  timestamptz,
  channel       text check (channel in ('self_service','email','support','system'))
);
create table privacy.deletion_tasks (
  task_id       uuid primary key default gen_random_uuid(),
  request_id    uuid not null references privacy.deletion_requests(request_id) on delete cascade,
  target        text not null,   -- analytics.events | ml.* | storage.photos | storage.art | resend | stripe | lulu | prodigi | posthog | warehouse | dataset_rebuild
  status        text not null default 'pending' check (status in ('pending','done','not_applicable','failed','retained_by_law')),
  detail        text,                                         -- counts and reason only, never personal data
  done_at       timestamptz
);
create index on privacy.deletion_tasks(request_id);

-- Tombstones: random ids only. Replayed after any backup restore so deleted people do not come back.
create table privacy.deletion_tombstones (
  subject_id    uuid primary key,
  deleted_at    timestamptz not null default now(),
  request_id    uuid
);

-- Permanent, personal-data-free log of deletions for audit (legal 02 s7 point 6).
create table privacy.deletion_log (
  log_id        bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  kind          text not null,
  request_id    uuid,
  counts        jsonb not null default '{}'::jsonb            -- {"events":123,"generations_anonymised":9,"candidates_withdrawn":0}
);

-- Tables intentionally without subject_id (aggregates, definitions). CI checks everything else has one.
create table privacy.non_subject_tables (
  table_schema text not null, table_name text not null, reason text not null,
  primary key (table_schema, table_name)
);

-- ---------------------------------------------------------------------------------------------------------------------
-- ANALYTICS SCHEMA
-- ---------------------------------------------------------------------------------------------------------------------

-- Loaded from tracking-plan.json by a deploy step. The ingestion function rejects names not in here.
create table analytics.event_definitions (
  event_name       text primary key,
  schema_version   int  not null default 1,
  domain           text not null,
  max_sensitivity  privacy.sensitivity_class not null,
  min_tier         privacy.consent_tier not null default 'T0',
  source           analytics.event_source not null,
  retention_days   int  not null check (retention_days > 0),
  owner            text not null,
  kpis             text[] not null default '{}',
  deprecated_at    timestamptz
);

create table analytics.sessions (
  session_id      uuid primary key,
  subject_id      uuid,                                       -- null until identified; backfilled on link
  anonymous_id    uuid,
  started_at      timestamptz not null,
  last_event_at   timestamptz not null,
  first_touch     jsonb not null default '{}'::jsonb,         -- utm_source/medium/campaign/content, channel, landing_page_type, referrer_host
  device_class    text,                                       -- mobile|desktop|tablet (from UA, UA itself not stored)
  country         char(2),                                    -- coarse geo from edge; IP not stored
  region          text,
  app_version     text,
  consent_analytics boolean not null default true,
  consent_marketing boolean not null default false
);
create index on analytics.sessions(subject_id);
create index on analytics.sessions(anonymous_id);
create index on analytics.sessions(started_at);

-- The event table. Monthly range partitions on occurred_at (create with analytics.ensure_event_partitions()).
create table analytics.events (
  event_id        uuid not null,                              -- client/server generated uuid; dedupe key
  event_name      text not null,
  schema_version  int  not null default 1,
  occurred_at     timestamptz not null,
  received_at     timestamptz not null default now(),
  source          analytics.event_source not null,
  anonymous_id    uuid,
  subject_id      uuid,
  session_id      uuid,
  creation_id     text,                                       -- app project/draft id (opaque), joins events to a card/book
  order_id        text,
  job_id          text,
  props           jsonb not null default '{}'::jsonb,         -- validated against tracking-plan.json; no free text, no PII
  sensitivity     privacy.sensitivity_class not null default 'C1',
  consent_tier    privacy.consent_tier not null default 'T0',
  app_version     text,
  primary key (event_id, occurred_at),
  check (jsonb_typeof(props) = 'object'),
  check (pg_column_size(props) < 8192),
  check (sensitivity in ('C0','C1'))                          -- C2+ must never enter this table
) partition by range (occurred_at);

create table analytics.events_default partition of analytics.events default;
create index on analytics.events (event_name, occurred_at);
create index on analytics.events (subject_id, occurred_at);
create index on analytics.events (anonymous_id, occurred_at);
create index on analytics.events (creation_id) where creation_id is not null;
create index on analytics.events (order_id) where order_id is not null;

create or replace function analytics.ensure_event_partitions(p_months_ahead int default 3) returns int
language plpgsql as $$
declare
  m date; n int := 0; part text;
begin
  for i in 0..p_months_ahead loop
    m := (date_trunc('month', now()) + make_interval(months => i))::date;
    part := format('events_%s', to_char(m, 'YYYY_MM'));
    if to_regclass(format('analytics.%I', part)) is null then
      execute format('create table analytics.%I partition of analytics.events for values from (%L) to (%L)',
                     part, m, (m + interval '1 month')::date);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- Commerce facts. Mirror of the operational orders, with no name, email, address or phone.
create table analytics.fact_orders (
  order_id          text primary key,
  subject_id        uuid not null,
  created_at        timestamptz not null,
  status            text not null,                            -- paid|preparing|printing|shipped|delivered|needs_attention|cancelled|refunded
  items_count       int  not null,
  subtotal_cents    int  not null,
  postage_cents     int  not null,
  shipping_method   text,
  shipping_method_cents int not null default 0,
  tax_cents         int  not null default 0,
  total_cents       int  not null,
  stripe_fee_cents  int,
  refunded_cents    int  not null default 0,
  reprint_count     int  not null default 0,
  is_first_order    boolean not null,
  channel_first_touch text,
  channel_last_touch  text,
  utm_campaign_last text,
  promised_delivery date,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  ship_country      char(2),
  ship_region       text,                                     -- state only
  proof_approved_at timestamptz,
  policy_version    text
);
create index on analytics.fact_orders(subject_id);
create index on analytics.fact_orders(created_at);

create table analytics.fact_order_items (
  order_item_id     text primary key,
  order_id          text not null references analytics.fact_orders(order_id) on delete cascade,
  subject_id        uuid not null,
  creation_id       text not null,
  sku               text not null,                            -- card_digital|card_mailed|book_digital|book_24|book_32
  kind              text not null check (kind in ('card','book')),
  quantity          int not null default 1,
  product_cents     int not null,
  postage_cents     int not null,
  printed           boolean not null,
  printer           text,                                     -- lulu|prodigi|gelato
  print_cost_cents  int,                                      -- from printer invoice/API, feeds unit economics
  ship_cost_cents   int,
  status            text not null,
  occasion          text,                                     -- enumerated brief fields only
  tone              text,
  art_style         text,
  reading_age       text,
  page_count        int,
  character_count   int,
  has_pet           boolean
);
create index on analytics.fact_order_items(order_id);
create index on analytics.fact_order_items(subject_id);

-- One row per creation (card or book project). Enumerated brief fields only; no names, no text.
create table analytics.fact_creations (
  creation_id       text primary key,
  subject_id        uuid not null,
  kind              text not null check (kind in ('card','book')),
  created_at        timestamptz not null,
  occasion          text, tone text, art_style text, reading_age text,
  page_count        int, character_count int, has_pet boolean, uses_saved_person boolean,
  brief_source_mix  jsonb,                                    -- {"chat":5,"form":4,"template":1,"people":0,"rag":0}
  story_idea_chars  int, message_chars int,                   -- lengths only
  started_from_template_id text,
  brief_completed_at timestamptz,
  story_approved_at timestamptz,
  sheet_approved_at timestamptz,
  sheet_versions    int, sheet_free_redos_used int,
  pages_total       int, pages_rerolled int, rerolls_used int,
  proof_approved_at timestamptz,
  ordered_at        timestamptz,
  total_cost_usd    numeric(10,4) not null default 0,
  intake_cost_usd   numeric(10,4) not null default 0,
  render_cost_usd   numeric(10,4) not null default 0,
  abandoned_at      timestamptz
);
create index on analytics.fact_creations(subject_id);
create index on analytics.fact_creations(created_at);

-- Spend per UTC day for the spend cap (replaces the in-process counter flagged in app/lib/intake/preview.ts).
create table analytics.spend_daily (
  day               date not null,
  purpose           text not null check (purpose in ('guest_preview','intake_chat','book_render','card_render','qa','story','other')),
  usd               numeric(12,5) not null default 0,
  calls             int not null default 0,
  primary key (day, purpose)
);

-- Ad spend imported by CSV (CMO weekly export) or API later. No personal data; this is how CAC by channel is computed.
create table analytics.ad_spend_daily (
  day               date not null,
  channel           text not null,                           -- same names as docs/cmo/channel-assumptions.csv
  campaign          text not null default '',
  spend_usd         numeric(12,2) not null,
  impressions       bigint, clicks bigint,
  source            text not null default 'csv',
  imported_at       timestamptz not null default now(),
  primary key (day, channel, campaign)
);

-- ---------------------------------------------------------------------------------------------------------------------
-- ML SCHEMA
-- ---------------------------------------------------------------------------------------------------------------------

-- Prompt templates under version control. Stores the TEMPLATE (with placeholders), never a rendered prompt with user data.
create table ml.prompt_versions (
  prompt_version_id  text primary key,                        -- e.g. page_prompts@2026-10-10.1
  stage              text not null,                           -- identity|modelsheet|story|card_copy|prompts|render|qa|intake
  template_sha256    text not null,
  template_text      text,                                    -- may be null if kept only in git; sha ties it to the repo commit
  git_commit         text,
  style_guard_lines  text[],                                  -- FULL-BLEED/FRAMING/exact-count etc. as active
  created_at         timestamptz not null default now(),
  retired_at         timestamptz,
  unique (stage, template_sha256)
);

-- Superset of pipeline LedgerEntry (pipeline/src/ledger.ts). One row per model call attempt.
create table ml.generation_attempts (
  attempt_id          uuid primary key default gen_random_uuid(),
  ts                  timestamptz not null,
  run_id              text not null,                           -- LedgerEntry.runId
  job_id              text,                                    -- app Job.id
  creation_id         text,
  subject_id          uuid,                                    -- nulled on deletion (row kept anonymised for unit economics)
  stage               text not null,
  label               text not null,                           -- page id etc.
  purpose             text not null default 'other',           -- guest_preview|intake_chat|book_render|card_render|qa|story|other
  kind                ml.gen_kind not null,
  model_requested     text not null,
  model_served        text,                                    -- actual model after fallback chain
  provider            text,                                    -- upstream provider as reported by OpenRouter, if available
  openrouter_gen_id   text,
  fallback_used       boolean not null default false,
  zdr_requested       boolean,                                 -- was provider.zdr=true sent (legal 06 req 8)
  attempt             int  not null,
  status              ml.gen_status not null,
  http_status         int,
  image_size          text,                                    -- 1K|2K|4K
  prompt_version_id   text references ml.prompt_versions(prompt_version_id),
  prompt_sha256       text,                                    -- hash of rendered prompt. Nulled on deletion (could embed a child's name).
  params              jsonb not null default '{}'::jsonb,      -- temperature, max_tokens, style id, page kind, n_reference_images, etc. No text.
  n_input_images      int,
  prompt_tokens       int, completion_tokens int, image_tokens int,
  cost_usd            numeric(10,5) not null default 0,
  cost_source         text not null check (cost_source in ('openrouter_usage','computed','none')),
  latency_ms          int,
  output_ref          text,                                    -- opaque storage key of the output; deleted with the asset, never exported
  output_sha256       text,                                    -- nulled on deletion
  output_is_likeness  boolean,                                 -- derived from photos of people? (C4). Drives training eligibility.
  experiment_key      text,
  experiment_variant  text,
  mock                boolean not null default false
);
create index on ml.generation_attempts(ts);
create index on ml.generation_attempts(job_id);
create index on ml.generation_attempts(creation_id);
create index on ml.generation_attempts(subject_id);
create index on ml.generation_attempts(stage, model_served, ts);
create index on ml.generation_attempts(prompt_version_id);

-- QA outcomes (pipeline/src/stages/qa.ts QaVerdict, plus future scorers and human labels).
create table ml.qa_results (
  qa_id               uuid primary key default gen_random_uuid(),
  attempt_id          uuid not null references ml.generation_attempts(attempt_id) on delete cascade,
  subject_id          uuid,
  creation_id         text,
  page_id             text,
  evaluator           text not null,                           -- local_border|vision_count|vision_text|scorer_v1|human
  evaluator_version   text not null,
  pass                boolean,
  score               numeric(6,3),                            -- 0..1 for learned scorers, null for rules
  expected_count      int, character_count int,
  white_border        boolean, text_in_image boolean,
  notes_code          text,                                    -- controlled vocabulary, not free text
  cost_usd            numeric(10,5) not null default 0,
  led_to_auto_reroll  boolean not null default false,
  created_at          timestamptz not null default now()
);
create index on ml.qa_results(attempt_id);
create index on ml.qa_results(subject_id);
create index on ml.qa_results(evaluator, evaluator_version, created_at);

-- Explicit user judgements: ratings, reason codes, approvals. Free text is stored elsewhere (ml.text_samples) and only under T1+.
create table ml.user_feedback (
  feedback_id         uuid primary key default gen_random_uuid(),
  subject_id          uuid not null,
  creation_id         text,
  attempt_id          uuid references ml.generation_attempts(attempt_id) on delete set null,
  target_type         text not null check (target_type in ('model_sheet','page','story','card_front','card_message','proof','order','intake_chat')),
  target_id           text,
  signal              text not null check (signal in ('thumbs','stars','approve','redo','reroll','nps','csat','report')),
  value_num           numeric(4,1),                            -- stars 1-5, thumbs -1/1, nps 0-10
  reason_codes        text[] not null default '{}',            -- controlled list, see tracking plan (e.g. likeness_off, wrong_count, style_off, text_wrong)
  has_free_text       boolean not null default false,
  consent_tier        privacy.consent_tier not null default 'T0',
  created_at          timestamptz not null default now()
);
create index on ml.user_feedback(subject_id);
create index on ml.user_feedback(creation_id);
create index on ml.user_feedback(target_type, signal, created_at);

-- Edits: what users change. Metrics only; text diffs live in ml.text_samples if opted in.
create table ml.edits (
  edit_id             uuid primary key default gen_random_uuid(),
  subject_id          uuid not null,
  creation_id         text not null,
  target_type         text not null check (target_type in ('story_page','title','dedication','card_message','brief_field','sheet_note','reroll_note')),
  target_id           text,
  field_key           text,
  chars_before        int, chars_after int,
  edit_distance_ratio numeric(5,4),                            -- 0 = unchanged, 1 = rewritten
  edit_kind           text check (edit_kind in ('minor','moderate','rewrite','delete','add')),
  source_attempt_id   uuid references ml.generation_attempts(attempt_id) on delete set null,
  created_at          timestamptz not null default now()
);
create index on ml.edits(subject_id);
create index on ml.edits(creation_id);

-- Preference signals derived from behaviour. IDs only, no content: A was preferred over B.
create table ml.preference_pairs (
  pair_id             uuid primary key default gen_random_uuid(),
  subject_id          uuid not null,
  creation_id         text not null,
  target_type         text not null check (target_type in ('model_sheet','page','card_front')),
  target_id           text not null,
  chosen_attempt_id   uuid not null references ml.generation_attempts(attempt_id) on delete cascade,
  rejected_attempt_id uuid not null references ml.generation_attempts(attempt_id) on delete cascade,
  signal              text not null check (signal in ('approved_after_reroll','selected_older_version','kept_after_redo','auto_qa_pass_vs_fail')),
  strength            numeric(3,2) not null default 0.5,       -- 0..1 heuristic confidence
  created_at          timestamptz not null default now(),
  check (chosen_attempt_id <> rejected_attempt_id)
);
create index on ml.preference_pairs(subject_id);

-- Outcomes per creation: the label that matters (did it become a happy, delivered order?).
create table ml.outcomes (
  creation_id         text primary key,
  subject_id          uuid not null,
  kind                text not null,
  proof_approved      boolean not null default false,
  ordered             boolean not null default false,
  order_id            text,
  delivered           boolean,
  refunded            boolean not null default false,
  reprinted           boolean not null default false,
  support_contacts    int not null default 0,
  rating_nps          int check (rating_nps between 0 and 10),
  rerolls_used        int not null default 0,
  sheet_redos_used    int not null default 0,
  auto_reroll_count   int not null default 0,
  total_cost_usd      numeric(10,4) not null default 0,
  revenue_cents       int,
  contribution_cents  int,
  updated_at          timestamptz not null default now()
);
create index on ml.outcomes(subject_id);

-- Text samples: user-originated or model-originated text kept for improvement. Only with consent_tier >= T1, scrubbed.
create table ml.text_samples (
  sample_id           uuid primary key default gen_random_uuid(),
  subject_id          uuid not null,
  creation_id         text,
  kind                text not null check (kind in ('story_page','story_edit_before','story_edit_after','card_message','free_feedback','intake_user_turn')),
  text_scrubbed       text not null,                           -- names, places, dates, contacts replaced by typed placeholders
  scrub_version       text not null,
  pii_scan_passed     boolean not null,
  consent_tier        privacy.consent_tier not null,
  consent_id          text not null,
  language            text,
  created_at          timestamptz not null default now(),
  purge_after         timestamptz not null,
  check (consent_tier in ('T1','T2')),
  check (pii_scan_passed)
);
create index on ml.text_samples(subject_id);

-- Golden evaluation set. Built from SYNTHETIC briefs and staff/volunteer-released content only, never customer content.
create table ml.eval_sets (
  eval_set_id         text primary key,                        -- e.g. golden_v1
  purpose             text not null,
  created_at          timestamptz not null default now(),
  frozen_at           timestamptz,
  release_doc_ref     text                                     -- where signed releases for any real photos used are filed
);
create table ml.eval_items (
  eval_item_id        text primary key,
  eval_set_id         text not null references ml.eval_sets(eval_set_id),
  kind                text not null check (kind in ('card','book_page','model_sheet','story')),
  brief_json          jsonb not null,                          -- synthetic brief
  source              text not null check (source in ('synthetic','staff_with_release','volunteer_with_release')),
  tags                text[] not null default '{}',            -- e.g. {'group_of_4','pet','dark_skin','glasses','long_name'}
  human_label         jsonb,                                   -- reference verdicts for scorer calibration
  created_at          timestamptz not null default now()
);
create table ml.eval_runs (
  eval_run_id         uuid primary key default gen_random_uuid(),
  eval_set_id         text not null references ml.eval_sets(eval_set_id),
  config              jsonb not null,                          -- model, prompt_version_ids, image size, guard lines
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  total_cost_usd      numeric(10,4) not null default 0
);
create table ml.eval_scores (
  eval_run_id         uuid not null references ml.eval_runs(eval_run_id) on delete cascade,
  eval_item_id        text not null references ml.eval_items(eval_item_id),
  metric              text not null,                           -- qa_pass|count_correct|no_border|no_text|scorer_v1|human_pref
  value               numeric(8,4) not null,
  primary key (eval_run_id, eval_item_id, metric)
);

-- Experiments (A/B). Assignment is deterministic from subject_id or anonymous_id, stored for audit.
create table ml.experiments (
  experiment_key      text primary key,
  hypothesis          text not null,
  unit                text not null check (unit in ('subject','creation','session')),
  variants            jsonb not null,                          -- {"control":0.5,"v2":0.5}
  primary_metric      text not null,
  guardrail_metrics   text[] not null default '{}',
  min_sample_per_arm  int,
  started_at          timestamptz, ended_at timestamptz, decision text
);
create table ml.experiment_assignments (
  experiment_key      text not null references ml.experiments(experiment_key),
  unit_id             text not null,
  subject_id          uuid,
  variant             text not null,
  assigned_at         timestamptz not null default now(),
  primary key (experiment_key, unit_id)
);
create index on ml.experiment_assignments(subject_id);

-- De-identified training-candidate REGISTRY. Metadata and pointers only; content stays in its source store.
-- Default posture: nothing is eligible. A row becomes 'eligible' only if every gate below is satisfied.
create table ml.training_candidates (
  candidate_id        uuid primary key default gen_random_uuid(),
  subject_id          uuid not null,                           -- pseudonym, kept ONLY so withdrawal/deletion can reach the row. Stripped in dataset exports.
  modality            text not null check (modality in ('text_story','text_message','text_prompt','image_art','qa_label','preference_pair')),
  source_table        text not null,                           -- ml.text_samples | ml.generation_attempts | ml.preference_pairs ...
  source_id           text not null,
  content_class       privacy.sensitivity_class not null,      -- C3 for text, C4 for likeness art, C1 for labels
  derived_from_photo  boolean not null,
  contains_likeness   boolean not null,                        -- any depiction of a real person (esp. a minor), including photo-derived illustration
  minors_possible     boolean not null,                        -- true if any character ageBand is baby/toddler/child/teen, or unknown
  consent_tier_at_capture privacy.consent_tier not null,
  consent_id          text,
  consent_wording_version text,
  scrub_version       text,
  pii_scan_passed     boolean not null default false,
  moderation_clean    boolean not null default false,
  legal_signoff_id    uuid references privacy.legal_signoffs(signoff_id),
  status              ml.candidate_status not null default 'quarantined',
  status_reason       text,
  content_sha256      text,
  created_at          timestamptz not null default now(),
  withdrawn_at        timestamptz,
  unique (source_table, source_id),
  -- the hard gates, enforced in the database so no job can bypass them
  constraint eligible_requires_all_gates check (
    status not in ('eligible','included') or (
      consent_tier_at_capture = 'T2'
      and consent_id is not null
      and legal_signoff_id is not null
      and pii_scan_passed
      and moderation_clean
      and not derived_from_photo
      and not contains_likeness
      and not minors_possible
      and withdrawn_at is null
    )
  ),
  constraint c4_never_eligible check (content_class <> 'C4' or status in ('quarantined','excluded','withdrawn','deleted'))
);
create index on ml.training_candidates(subject_id);
create index on ml.training_candidates(status);

create table ml.dataset_versions (
  dataset_id          text primary key,                        -- e.g. scorer_train_2027_03
  purpose             text not null,
  built_at            timestamptz not null default now(),
  built_by            text not null,
  legal_signoff_id    uuid not null references privacy.legal_signoffs(signoff_id),
  row_count           int,
  needs_rebuild       boolean not null default false,          -- set when a member is withdrawn/deleted
  needs_rebuild_since timestamptz,
  artifact_ref        text,
  retired_at          timestamptz
);
create table ml.dataset_members (
  dataset_id          text not null references ml.dataset_versions(dataset_id) on delete cascade,
  candidate_id        uuid not null references ml.training_candidates(candidate_id),
  primary key (dataset_id, candidate_id)
);
create index on ml.dataset_members(candidate_id);

-- Model/artefact lineage: which dataset produced which scorer/model, for unlearning decisions and audits.
create table ml.model_registry (
  model_id            text primary key,
  kind                text not null,                           -- scorer|prompt_set|finetune|distill
  dataset_id          text references ml.dataset_versions(dataset_id),
  created_at          timestamptz not null default now(),
  eval_run_id         uuid references ml.eval_runs(eval_run_id),
  deployed_at         timestamptz, retired_at timestamptz,
  notes               text
);

-- ---------------------------------------------------------------------------------------------------------------------
-- FUNCTIONS: identity, ingestion, deletion, retention
-- ---------------------------------------------------------------------------------------------------------------------

-- Link an anonymous visitor to a subject (call at guest sign-in, sign-up, login). Backfills earlier events/sessions.
create or replace function privacy.link_anonymous(p_anonymous uuid, p_subject uuid, p_reason text) returns void
language plpgsql security definer set search_path = privacy, analytics, pg_temp as $$
begin
  if exists (select 1 from privacy.deletion_tombstones where subject_id = p_subject) then
    raise exception 'subject is deleted';
  end if;
  insert into privacy.anonymous_links(anonymous_id, subject_id, link_reason)
  values (p_anonymous, p_subject, p_reason)
  on conflict (anonymous_id) do nothing;
  update analytics.events   set subject_id = p_subject where anonymous_id = p_anonymous and subject_id is null;
  update analytics.sessions set subject_id = p_subject where anonymous_id = p_anonymous and subject_id is null;
end $$;

-- Merge two subjects (a guest that logs in to an existing account). Keeps the surviving id, retargets all rows.
create or replace function privacy.merge_subjects(p_from uuid, p_into uuid) returns void
language plpgsql security definer set search_path = privacy, analytics, ml, pg_temp as $$
declare r record;
begin
  if p_from = p_into then return; end if;
  update analytics.events set subject_id = p_into where subject_id = p_from;
  update analytics.sessions set subject_id = p_into where subject_id = p_from;
  update analytics.fact_orders set subject_id = p_into where subject_id = p_from;
  update analytics.fact_order_items set subject_id = p_into where subject_id = p_from;
  update analytics.fact_creations set subject_id = p_into where subject_id = p_from;
  update ml.generation_attempts set subject_id = p_into where subject_id = p_from;
  update ml.qa_results set subject_id = p_into where subject_id = p_from;
  update ml.user_feedback set subject_id = p_into where subject_id = p_from;
  update ml.edits set subject_id = p_into where subject_id = p_from;
  update ml.preference_pairs set subject_id = p_into where subject_id = p_from;
  update ml.outcomes set subject_id = p_into where subject_id = p_from;
  update ml.text_samples set subject_id = p_into where subject_id = p_from;
  update ml.training_candidates set subject_id = p_into where subject_id = p_from;
  update ml.experiment_assignments set subject_id = p_into where subject_id = p_from;
  update privacy.anonymous_links set subject_id = p_into where subject_id = p_from;
  delete from privacy.consent_state where subject_id = p_from;
  delete from privacy.subjects where subject_id = p_from;
end $$;

-- Ingestion: validates against event_definitions, drops events when the visitor has opted out, enforces dedupe.
create or replace function analytics.ingest_event(
  p_event_id uuid, p_name text, p_occurred_at timestamptz, p_source analytics.event_source,
  p_anonymous uuid, p_subject uuid, p_session uuid, p_props jsonb,
  p_creation text default null, p_order text default null, p_job text default null, p_app_version text default null
) returns boolean
language plpgsql security definer set search_path = analytics, privacy, pg_temp as $$
declare d analytics.event_definitions; cs privacy.consent_state;
begin
  select * into d from analytics.event_definitions where event_name = p_name and deprecated_at is null;
  if not found then raise exception 'unknown event %', p_name using errcode = '22023'; end if;
  if p_subject is not null then
    if exists (select 1 from privacy.deletion_tombstones where subject_id = p_subject) then return false; end if;
    select * into cs from privacy.consent_state where subject_id = p_subject;
    if found and not cs.analytics_ok and d.domain not in ('commerce','fulfillment','privacy','safety') then return false; end if;
    if found and d.min_tier > cs.tier then return false; end if;
  elsif d.min_tier > 'T0' then
    return false;
  end if;
  insert into analytics.events(event_id, event_name, schema_version, occurred_at, source, anonymous_id, subject_id, session_id,
                               creation_id, order_id, job_id, props, sensitivity, consent_tier, app_version)
  values (p_event_id, p_name, d.schema_version, p_occurred_at, p_source, p_anonymous, p_subject, p_session,
          p_creation, p_order, p_job, coalesce(p_props, '{}'::jsonb), d.max_sensitivity,
          d.min_tier, p_app_version)
  on conflict do nothing;
  return true;
end $$;

-- Deletion propagation. Deletes analytics + behavioural ML rows, ANONYMISES cost/ops facts, withdraws training candidates, flags datasets.
-- The caller (service role) then runs the non-SQL tasks (storage, Resend, PostHog, printers) recorded in privacy.deletion_tasks.
create or replace function privacy.delete_subject(p_subject uuid, p_kind text default 'account', p_channel text default 'self_service')
returns uuid
language plpgsql security definer set search_path = privacy, analytics, ml, pg_temp as $$
declare
  req uuid; n_events bigint; n_sessions bigint; n_fb bigint; n_edit bigint; n_pairs bigint; n_txt bigint; n_gen bigint;
  n_orders bigint; n_cand bigint; n_ds bigint; n_creat bigint; n_out bigint; n_qa bigint;
begin
  insert into privacy.deletion_requests(subject_id, kind, channel) values (p_subject, p_kind, p_channel) returning request_id into req;

  -- 1. Withdraw training candidates and flag every dataset that contained them (rebuild required; models trained on them go on the review list).
  update ml.training_candidates set status = 'withdrawn', withdrawn_at = now(), status_reason = 'subject_deleted'
   where subject_id = p_subject and status <> 'deleted';
  get diagnostics n_cand = row_count;
  update ml.dataset_versions dv set needs_rebuild = true, needs_rebuild_since = coalesce(needs_rebuild_since, now())
   where exists (select 1 from ml.dataset_members m join ml.training_candidates c using (candidate_id)
                  where m.dataset_id = dv.dataset_id and c.subject_id = p_subject);
  get diagnostics n_ds = row_count;

  -- 2. Hard delete behavioural and content-bearing rows.
  delete from ml.text_samples where subject_id = p_subject;                        get diagnostics n_txt = row_count;
  delete from ml.preference_pairs where subject_id = p_subject;                    get diagnostics n_pairs = row_count;
  delete from ml.user_feedback where subject_id = p_subject;                       get diagnostics n_fb = row_count;
  delete from ml.edits where subject_id = p_subject;                               get diagnostics n_edit = row_count;
  delete from ml.qa_results where subject_id = p_subject;                          get diagnostics n_qa = row_count;
  delete from ml.experiment_assignments where subject_id = p_subject;
  delete from ml.outcomes where subject_id = p_subject;                            get diagnostics n_out = row_count;
  delete from analytics.events where subject_id = p_subject or anonymous_id in (select anonymous_id from privacy.anonymous_links where subject_id = p_subject);
  get diagnostics n_events = row_count;
  delete from analytics.sessions where subject_id = p_subject or anonymous_id in (select anonymous_id from privacy.anonymous_links where subject_id = p_subject);
  get diagnostics n_sessions = row_count;
  delete from analytics.fact_creations where subject_id = p_subject;               get diagnostics n_creat = row_count;
  -- order facts carry no personal identifiers, but link to the person via subject_id: keep the row (tax/finance, unit economics), cut the link.
  -- Legal/CPA to confirm. fact_order_items.creation_id is also unlinked.
  update analytics.fact_order_items set subject_id = '00000000-0000-0000-0000-000000000000', creation_id = 'deleted' where subject_id = p_subject;
  update analytics.fact_orders set subject_id = '00000000-0000-0000-0000-000000000000', utm_campaign_last = null, ship_region = null where subject_id = p_subject;
  get diagnostics n_orders = row_count;

  -- 3. Anonymise generation logs: keep cost, model, latency, status (unit economics); drop every link and hash.
  update ml.generation_attempts
     set subject_id = null, job_id = null, creation_id = null, prompt_sha256 = null, output_sha256 = null, output_ref = null,
         openrouter_gen_id = null, params = params - 'character_names' - 'recipient'
   where subject_id = p_subject;
  get diagnostics n_gen = row_count;

  -- 4. Sever identity. After this, surviving copies (backups, exports) cannot be tied to a person.
  delete from privacy.anonymous_links where subject_id = p_subject;
  delete from privacy.consent_state where subject_id = p_subject;
  delete from privacy.subjects where subject_id = p_subject;
  insert into privacy.deletion_tombstones(subject_id, request_id) values (p_subject, req) on conflict do nothing;
  -- privacy.consent_records is retained for its 5-year period (legal 02 s7). Its ip/user_agent are purged by privacy.purge_expired().

  insert into privacy.deletion_tasks(request_id, target, status, detail) values
    (req, 'analytics.events', 'done', format('%s events, %s sessions', n_events, n_sessions)),
    (req, 'ml.behavioural', 'done', format('feedback %s, edits %s, pairs %s, text %s, qa %s, outcomes %s', n_fb, n_edit, n_pairs, n_txt, n_qa, n_out)),
    (req, 'ml.generation_attempts', 'done', format('%s rows anonymised', n_gen)),
    (req, 'analytics.fact_orders', 'retained_by_law', format('%s order rows unlinked, financial facts kept', n_orders)),
    (req, 'privacy.consent_records', 'retained_by_law', 'kept for retention period without photos'),
    (req, 'ml.training_candidates', case when n_cand > 0 then 'done' else 'not_applicable' end, format('%s withdrawn, %s datasets flagged for rebuild', n_cand, n_ds)),
    (req, 'storage.photos_and_art', 'pending', 'app storage adapter'),
    (req, 'resend', 'pending', 'delete contact and logs'),
    (req, 'stripe', 'pending', 'delete saved payment methods; retain legally required records'),
    (req, 'lulu_prodigi', 'pending', 'request deletion of customer data once fulfilment is complete'),
    (req, 'posthog_or_other_tool', 'pending', 'delete person and events by distinct id'),
    (req, 'warehouse_and_exports', 'pending', 'replay tombstones'),
    (req, 'backups', 'pending', 'expire within published backup window');

  insert into privacy.deletion_log(kind, request_id, counts)
  values (p_kind, req, jsonb_build_object('events', n_events, 'sessions', n_sessions, 'generations_anonymised', n_gen,
          'candidates_withdrawn', n_cand, 'datasets_flagged', n_ds, 'creations', n_creat));
  return req;
end $$;

-- Replays tombstones against everything (run after any backup restore or warehouse reload).
create or replace function privacy.replay_tombstones() returns int
language plpgsql security definer set search_path = privacy, analytics, ml, pg_temp as $$
declare t record; n int := 0;
begin
  for t in select subject_id from privacy.deletion_tombstones loop
    if exists (select 1 from analytics.events where subject_id = t.subject_id)
       or exists (select 1 from ml.generation_attempts where subject_id = t.subject_id)
       or exists (select 1 from ml.text_samples where subject_id = t.subject_id) then
      perform privacy.delete_subject(t.subject_id, 'account', 'system');
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- Retention enforcement: run daily (pg_cron). Retention days come from analytics.event_definitions.
create or replace function privacy.purge_expired() returns jsonb
language plpgsql security definer set search_path = privacy, analytics, ml, pg_temp as $$
declare n_ev bigint := 0; n_txt bigint := 0; n_cr bigint := 0; n_ss bigint := 0; n_ga bigint := 0; d record; c bigint;
begin
  for d in select event_name, retention_days from analytics.event_definitions loop
    delete from analytics.events where event_name = d.event_name and occurred_at < now() - make_interval(days => d.retention_days);
    get diagnostics c = row_count; n_ev := n_ev + c;
  end loop;
  delete from analytics.sessions where last_event_at < now() - interval '13 months';                    get diagnostics n_ss = row_count;
  delete from ml.text_samples where purge_after < now();                                               get diagnostics n_txt = row_count;
  -- consent log: drop IP/UA at end of period, keep the row's non-personal columns only if still useful; here we delete after purge_after
  delete from privacy.consent_records where purge_after < now();                                       get diagnostics n_cr = row_count;
  -- generation logs: strip links after 24 months, keep the cost facts
  update ml.generation_attempts set subject_id = null, job_id = null, creation_id = null, prompt_sha256 = null, output_sha256 = null,
         output_ref = null, openrouter_gen_id = null
   where ts < now() - interval '24 months' and (subject_id is not null or prompt_sha256 is not null);   get diagnostics n_ga = row_count;
  -- guest subjects with no activity for 7 days (legal: guest previews and uploads 7 days)
  perform privacy.delete_subject(s.subject_id, 'guest_expiry', 'system')
    from privacy.subjects s
   where s.is_guest and s.created_at < now() - interval '7 days'
     and not exists (select 1 from analytics.events e where e.subject_id = s.subject_id and e.occurred_at > now() - interval '7 days');
  insert into privacy.deletion_log(kind, counts) values ('retention_purge', jsonb_build_object('events', n_ev, 'text_samples', n_txt, 'consent_records', n_cr, 'sessions', n_ss, 'generations_stripped', n_ga));
  return jsonb_build_object('events', n_ev, 'text_samples', n_txt, 'consent_records', n_cr, 'sessions', n_ss, 'generations_stripped', n_ga);
end $$;

-- Spend cap helper: returns true if today's spend (UTC) is still below the cap. Replaces the in-process counter.
create or replace function analytics.spend_ok(p_cap_usd numeric) returns boolean
language sql stable as $$
  select coalesce(sum(usd), 0) < p_cap_usd from analytics.spend_daily where day = (now() at time zone 'utc')::date;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- VIEWS used by dashboards (04-kpis-and-dashboards.md). Plain views first; materialise later if slow.
-- ---------------------------------------------------------------------------------------------------------------------

create view analytics.v_funnel_daily as
select (occurred_at at time zone 'utc')::date as day,
       count(distinct coalesce(subject_id::text, anonymous_id::text)) filter (where event_name = 'page_viewed')            as visitors,
       count(distinct coalesce(subject_id::text, anonymous_id::text)) filter (where event_name = 'creator_started')        as creator_starts,
       count(distinct coalesce(subject_id::text, anonymous_id::text)) filter (where event_name = 'guest_preview_rendered')  as guest_previews,
       count(distinct subject_id) filter (where event_name = 'signup_completed')                                          as signups,
       count(distinct creation_id) filter (where event_name = 'brief_completed')                                          as briefs_completed,
       count(distinct creation_id) filter (where event_name = 'proof_approved')                                           as proofs_approved,
       count(distinct order_id) filter (where event_name = 'payment_succeeded')                                           as orders
  from analytics.events
 group by 1;

create view ml.v_generation_cost_by_creation as
select creation_id,
       sum(cost_usd) as cost_usd,
       sum(cost_usd) filter (where purpose = 'intake_chat') as intake_usd,
       sum(cost_usd) filter (where kind = 'image') as image_usd,
       count(*) filter (where kind = 'image' and status = 'ok') as images_ok,
       count(*) filter (where status in ('http_error','network_error','no_image')) as failed_calls
  from ml.generation_attempts
 where creation_id is not null
 group by 1;

create view ml.v_qa_first_pass_rate as
select date_trunc('week', g.ts) as week, g.model_served, g.image_size, g.prompt_version_id,
       count(*) as pages,
       avg((q.pass)::int) as first_attempt_pass_rate
  from ml.generation_attempts g
  join ml.qa_results q using (attempt_id)
 where g.kind = 'image' and g.attempt = 1 and q.evaluator in ('local_border','vision_count')
 group by 1,2,3,4;

-- ---------------------------------------------------------------------------------------------------------------------
-- GRANTS + ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------------------------------------------------

revoke all on schema privacy from public;
revoke all on schema analytics from public;
revoke all on schema ml from public;
grant usage on schema privacy to privacy_admin;
grant all on all tables in schema privacy to privacy_admin;
grant usage on schema analytics to analytics_writer, analyst_ro, ml_ro;
grant usage on schema ml to analytics_writer, ml_ro, analyst_ro;
grant insert, update on all tables in schema analytics to analytics_writer;
grant insert, update on all tables in schema ml to analytics_writer;
grant select on all tables in schema analytics to analyst_ro, ml_ro;
grant select on all tables in schema ml to ml_ro;
-- analysts get cost/QA views but not feedback/outcome rows with subject_id
grant select on ml.v_generation_cost_by_creation, ml.v_qa_first_pass_rate to analyst_ro;
-- text_samples and training_candidates are NOT readable by analyst_ro
revoke all on ml.text_samples, ml.training_candidates, ml.dataset_members from analyst_ro;
revoke all on ml.text_samples from ml_ro;  -- text export goes through a reviewed, logged job, not ad hoc SELECT

-- Supabase: the anon and authenticated API roles must not see these schemas at all. Enable RLS as defence in depth.
do $$
declare t record;
begin
  for t in select schemaname, tablename from pg_tables where schemaname in ('privacy','analytics','ml') loop
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
  end loop;
end $$;
-- No permissive policies are created: only roles that bypass RLS (service role, table owner) can read or write.
-- If a role needs access, add an explicit policy in a migration and review it in 07 DATA-014.

-- Seed: tables without subject_id on purpose.
insert into privacy.non_subject_tables(table_schema, table_name, reason) values
  ('analytics','event_definitions','static definitions'),
  ('analytics','spend_daily','aggregate spend per day, no identifiers'),
  ('analytics','ad_spend_daily','ad platform spend per channel per day, no identifiers'),
  ('ml','prompt_versions','prompt templates, no user data'),
  ('ml','eval_sets','synthetic or released content only'),
  ('ml','eval_items','synthetic or released content only'),
  ('ml','eval_runs','eval harness'),
  ('ml','eval_scores','eval harness'),
  ('ml','experiments','experiment definitions'),
  ('ml','dataset_versions','lineage of datasets; members reach subjects via training_candidates'),
  ('ml','dataset_members','lineage'),
  ('ml','model_registry','lineage');
