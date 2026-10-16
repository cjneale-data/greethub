-- Ready Cards (stock cards) customisations (docs/cto/stock-cards-architecture.md section 9). Same shape and security as memberships: server-only, RLS on, no policies. id = sc_<id>; owner_id = user.
create table if not exists public.stock_creations (
  id         text primary key,
  owner_id   text,
  refs       text[] not null default '{}',
  doc        jsonb not null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_creations_owner_idx on public.stock_creations (owner_id);
create index if not exists stock_creations_refs_idx on public.stock_creations using gin (refs);
alter table public.stock_creations enable row level security;
revoke all on public.stock_creations from anon, authenticated;
