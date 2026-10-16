-- Local-auth password hashes (lib/adapters/fake/auth.ts). With Supabase Auth, passwords live in auth.users and this
-- table stays empty; it exists so the document store has the collection, and account deletion can clear it.
-- Same document shape and security model as 20261013000000_core_documents.sql: server-only, RLS on with no policies.
create table if not exists public.credentials (
  id         text primary key,
  owner_id   text,
  refs       text[] not null default '{}',
  doc        jsonb not null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists credentials_owner_idx on public.credentials (owner_id);
alter table public.credentials enable row level security;
revoke all on public.credentials from anon, authenticated;
