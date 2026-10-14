-- Handwriting styles and signatures (docs/PLAN.md "Handwriting and signatures"). Same document shape and security model
-- as 20261013000000_core_documents.sql: server-only, RLS on with no policies. One row per member (id = user id); the
-- glyph sheets and signature images themselves live in the private bucket under writing/<user id>/.
create table if not exists public.writing (
  id         text primary key,
  owner_id   text,
  refs       text[] not null default '{}',
  doc        jsonb not null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists writing_owner_idx on public.writing (owner_id);
create index if not exists writing_refs_idx on public.writing using gin (refs);
alter table public.writing enable row level security;
revoke all on public.writing from anon, authenticated;
