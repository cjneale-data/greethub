-- GreetHub core storage (SEC-18). Every table has the same document shape so the app's store layer
-- (lib/store/supabaseDocs.ts) can treat them alike:
--   id        primary key (user id for the per-user lists: carts, addresses, drafts, people)
--   owner_id  the user the row belongs to, when there is one (indexed; used for listing and delete-my-data)
--   refs      secondary lookups (Stripe session id on checkouts, printer job ids on orders)
--   doc       the record itself, as the app's TypeScript types describe it (lib/shop/types.ts, lib/book/types.ts)
--   version   optimistic-concurrency counter: an update only lands if the version it read is still current
--
-- Security model: only the server touches these tables, with the service-role key. Row-level security is on and there
-- are no policies, so the anon and authenticated roles (the browser) can read or write nothing. Ownership is enforced
-- in the server routes, as it is for the local JSON store.

create or replace function public.gh_create_doc_table(t text) returns void
language plpgsql as $$
begin
  execute format($f$
    create table if not exists public.%1$I (
      id         text primary key,
      owner_id   text,
      refs       text[] not null default '{}',
      doc        jsonb not null,
      version    integer not null default 1,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists %1$I_owner_idx on public.%1$I (owner_id);
    create index if not exists %1$I_refs_idx on public.%1$I using gin (refs);
    alter table public.%1$I enable row level security;
    revoke all on public.%1$I from anon, authenticated;
  $f$, t);
end;
$$;

-- Shop (lib/shop/types.ts DB)
select public.gh_create_doc_table('users');
select public.gh_create_doc_table('carts');            -- id = user id, doc = CartItem[]
select public.gh_create_doc_table('addresses');        -- id = user id, doc = SavedAddress[]
select public.gh_create_doc_table('drafts');           -- id = user id, doc = Draft[]
select public.gh_create_doc_table('people');           -- id = user id, doc = Person[]
select public.gh_create_doc_table('checkouts');        -- refs = [stripe session id]
select public.gh_create_doc_table('orders');           -- refs = [stripe session id, printer external ids...]
select public.gh_create_doc_table('processed_events'); -- payment webhook ids already handled
select public.gh_create_doc_table('magic_tokens');     -- fake-auth links; with Supabase Auth, terms acceptance waiting on a link
select public.gh_create_doc_table('delete_tokens');
select public.gh_create_doc_table('fake_printer_jobs');
select public.gh_create_doc_table('outbox');           -- fake email only
select public.gh_create_doc_table('content_reports');

drop function public.gh_create_doc_table(text);

-- Private bucket for photos and print files (lib/adapters/real/supabaseStorage.ts). No storage policies: only the service
-- role reads or writes, and browsers get files through ownership-checked routes or short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('private', 'private', false, 26214400)
on conflict (id) do nothing;
