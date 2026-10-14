-- Membership subscriptions (docs/finance/membership-plan.md). Same document shape and security model as
-- 20261013000000_core_documents.sql: server-only, RLS on with no policies. One row per member (id = user id);
-- refs hold the Stripe customer and subscription ids so subscription webhooks can find the member.
create table if not exists public.memberships (
  id         text primary key,
  owner_id   text,
  refs       text[] not null default '{}',
  doc        jsonb not null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists memberships_owner_idx on public.memberships (owner_id);
create index if not exists memberships_refs_idx on public.memberships using gin (refs);
alter table public.memberships enable row level security;
revoke all on public.memberships from anon, authenticated;
