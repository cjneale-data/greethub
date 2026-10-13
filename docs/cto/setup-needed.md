# Setup needed from the owner

Everything below is stubbed behind adapters in `app/lib/adapters/` until the credential exists. Put values in `app/.env.local` (local) and in Vercel project env vars (preview/production). Names match `app/.env.example`. Never commit real values.

| When | Account | Exact credentials | Env var(s) |
|---|---|---|---|
| M3 (intake, guest preview) | OpenRouter (have it) | A **new key with a spend limit** for the website (the current key in `book\.env` has about $4 left). Top up credit: budget about $1.50 per 24-page book, $0.25 per card | `OPENROUTER_API_KEY`, `GENERATION_DAILY_SPEND_CAP_USD` |
| M3/M4 | Supabase project | Project URL, anon (public) key, service-role key. Enable Email (magic link); later Google provider and pgvector extension. Schema, redirect URLs and email template: see [supabase.md](supabase.md) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
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

Adapter status (2026-10-13, `app/lib/adapters/index.ts`): Stripe, Lulu, Prodigi and Resend have real adapters that switch on when their env vars exist, but none has been run against a sandbox yet. Supabase (SEC-18) is built: shop data, sign-in and the private file bucket switch on with the three Supabase env vars and were tested against a local Supabase stack, not yet a hosted project ([supabase.md](supabase.md)). Book projects, render jobs and photos still live on local disk until the hosted job queue (SEC-21) exists, so a Vercel preview still loses book data between instances.

## Agent channel (MCP + agent API), all optional until the channel is built out

Framework is merged dark. See docs/cto/agent-channel-build-order.md. Names only; values go in Vercel env vars, never in the repo.

| Unblocks | Env var(s) | Notes |
|---|---|---|
| Turning the channel on at all | `AGENT_CHANNEL_ENABLED=1` | Leave unset in production until persistence and the auth server exist |
| API keys (headless agents) | `AGENT_KEY_PEPPER` | Long random secret, generate in Vercel; rotating it invalidates all keys |
| OAuth linking for ChatGPT, Claude, Gemini | `AGENT_AUTH_ISSUER`, `AGENT_JWKS_URL`, `AGENT_MCP_RESOURCE_URL` | Values depend on the AGT-010 decision (Supabase OAuth server vs custom); needs a custom auth domain (for example auth.greethub.com) and mcp.greethub.com on Vercel |
| Model spend cap for assistants | `AGENT_DAILY_MODEL_BUDGET_USD` | Default 10 (owner to confirm) |
| Tuning / kill switch | `AGENT_READS_PER_MIN`, `AGENT_WRITES_PER_MIN`, `AGENT_APPROVALS_PER_DAY`, `AGENT_MAX_PREVIEW_WAIT_S`, `AGENT_AUTONOMY_COOLING_OFF_H`, `AGENT_CHANNEL_PAUSED=1` | Optional; defaults in `app/lib/agent/config.ts` |
| Sandbox deployment only | `GREETHUB_SANDBOX=1` | Never on a deployment holding production secrets |

Hard prerequisites from other work: real Supabase accounts (SEC-18), shared rate limiter (SEC-07), persistent cost ledger (SEC-10).
