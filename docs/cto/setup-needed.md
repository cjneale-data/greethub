# Setup needed from the owner

Everything below is stubbed behind adapters in `app/lib/adapters/` until the credential exists. Put values in `app/.env.local` (local) and in Vercel project env vars (preview/production). Names match `app/.env.example`. Never commit real values.

| When | Account | Exact credentials | Env var(s) |
|---|---|---|---|
| M3 (intake, guest preview) | OpenRouter (have it) | A **new key with a spend limit** for the website (the current key in `book\.env` has about $4 left). Top up credit: budget about $1.50 per 24-page book, $0.25 per card | `OPENROUTER_API_KEY`, `GENERATION_DAILY_SPEND_CAP_USD` |
| M3/M4 | Supabase project | Project URL, anon (public) key, service-role key. Enable Email (magic link) and anonymous sign-ins; later Google provider and pgvector extension | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| M1 preview, M7 | Vercel account | Link the repo (or give a Vercel token for CLI deploys); set the env vars above in the project | `VERCEL_TOKEN` (CLI only, optional) |
| M5 | Stripe (test mode) | Secret key, publishable key, a webhook signing secret for `checkout.session.completed` (created once the preview URL exists). Stripe Tax enabled in test mode | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| M5 | Resend | API key and a verified sending domain (or the Resend test sender for now) | `RESEND_API_KEY`, `EMAIL_FROM` |
| M6 | Lulu Print API (sandbox) | Client key and client secret from the Lulu developer portal sandbox | `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_API_BASE` |
| M6 | Prodigi (sandbox) | Sandbox API key (fallback: Gelato key) | `PRODIGI_API_KEY`, `PRODIGI_API_BASE` |
| M1/M3, optional | Google Cloud OAuth | OAuth client ID and secret; redirect URI is the Supabase auth callback | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` |

Also needed:
- The production domain name (for `NEXT_PUBLIC_SITE_URL`, Resend DNS and Stripe webhooks).
- A decision on print specs before M6: Lulu hardcover SKU (8.5x8.5 casewrap) and the Prodigi greeting-card SKU. The pipeline outputs interior, front and back cover PDFs; the Lulu spine/wrap file is assembled with Lulu's cover-dimensions API in M6.
- Privacy/COPPA legal review before real children's photos go through the site.

Currently stubbed (TODO adapters, `app/lib/adapters/stubs.ts`): auth (Supabase), payments (Stripe Checkout and webhook), printers (Lulu, Prodigi), private photo storage (Supabase Storage). The home page, brand components and CreationBrief schema are real.
