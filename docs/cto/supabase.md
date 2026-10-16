# Supabase backend (SEC-18)

What runs on Supabase, how to run it locally, and what the owner sets up for the hosted project.

## What is on Supabase

| Area | Code | Supabase piece |
|---|---|---|
| Shop data: users, carts, addresses, drafts, people, checkouts, orders, webhook ids, delete tokens, content reports | `app/lib/store/` (`docs()`), services in `app/lib/shop/` | Tables in `app/supabase/migrations/` |
| Sign-in: email + password, magic link and Google | `app/lib/adapters/real/supabaseAuth.ts`, `app/app/api/auth/password`, refresh in `app/proxy.ts` | Supabase Auth |
| Private files | `app/lib/adapters/real/supabaseStorage.ts` (`getAdapters().storage`) | Storage bucket `private` |

What switches it on (`app/lib/adapters/index.ts`, `app/lib/store/index.ts`):
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: shop data goes to Supabase.
- Plus `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sign-in and file storage also go to Supabase (`live.supabase`).
- None set: everything runs on the local JSON file and fake auth, as before.

**Not on Supabase yet:** book projects, render jobs, photos and renders. They stay in `lib/book/store` files on disk because the detached render worker reads them from disk and, by design (SEC-22), never gets Supabase secrets. They move with the hosted job queue (SEC-21). Until then a Vercel preview still loses book data between instances. Also still in memory: the rate limiter (SEC-07) and the model spend ledger (SEC-10).

## Design

- Every table has the same shape: `id`, `owner_id`, `refs text[]`, `doc jsonb`, `version`, timestamps. `doc` is the TypeScript record from `lib/shop/types.ts`. Carts, addresses, drafts and people are one row per user, holding the list.
- Writes are compare-and-swap on `version`, retried on conflict, so two server instances can't overwrite each other's changes.
- Order creation from a payment is idempotent across instances: the order number is claimed on the checkout row first, the order is inserted only if absent, and webhook ids are stored in `processed_events`.
- Security: row-level security is on with **no policies**, and the anon/authenticated roles are revoked. The browser can read nothing directly. Only the server, with the service-role key, reads and writes. Ownership is checked in the API routes, as before. The service-role key must never be in a `NEXT_PUBLIC_` variable.
- Email + password: sign-up creates the Supabase user through the admin API already confirmed (`email_confirm: true`), so it sends no email and works without SMTP. It refuses an email that already has an app account or a Supabase user, so a sign-up can't take over an account made with a link or Google. The trade-off: the address is not verified, so someone could register an email they don't own before its owner does. Once SMTP works, consider sending a confirmation email on password sign-up. Local auth keeps scrypt hashes in the `credentials` collection.
- User ids come from the verified email (`userIdForEmail`), not the Supabase auth uid, so accounts created under local auth keep their data. Guests keep the `gh_guest` cookie, so Supabase anonymous sign-ins are not needed.

## Local development

Needs Docker Desktop running.

```sh
cd app
npx supabase start          # first run downloads images; prints the URL and keys
npx supabase status -o env  # the URL, anon key and service-role key again
```

Put `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` into `app/.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Magic-link emails land in Mailpit at http://127.0.0.1:54324. `npx supabase db reset` re-applies the migrations to an empty database. `npx supabase stop` shuts it down.

Store contract tests against the local stack:

```sh
SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_SERVICE_ROLE_KEY=<service role key> npx vitest run tests/store
```

## Hosted project (owner)

1. Create the project at supabase.com. Copy the Project URL, the anon (publishable) key and the service-role (secret) key into Vercel env vars and `app/.env.local`.
2. Apply the schema. Either give Claude a Supabase access token (`npx supabase login`, then `npx supabase link --project-ref <ref>` and `npx supabase db push`), or paste `app/supabase/migrations/*.sql` into the SQL editor in order.
3. Authentication > URL Configuration: Site URL = the production domain. Redirect URLs: `https://<domain>/api/auth/callback**`, `https://*-<team>.vercel.app/api/auth/callback**` for previews, `http://localhost:3000/api/auth/callback**`.
4. Authentication > Providers: Email on (password and magic link). Confirm email can stay on. Google is optional: add the Google OAuth client ID/secret there, and in Google Cloud set the redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`.
5. Optional, recommended: in Authentication > Email Templates > Magic Link, change the link to `{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/account`. The default link uses PKCE and only works in the browser that asked for it. The token_hash link also works when the email is opened on a phone.
6. Set up SMTP (Resend) under Authentication > SMTP. Supabase's built-in sender is rate-limited to a few emails an hour.
