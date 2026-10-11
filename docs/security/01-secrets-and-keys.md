# 01. Secrets and keys

## Findings from the scan (values never printed)

- Working tree and all 20 commits scanned for OpenRouter (`sk-or-`), generic `sk-`, Stripe (`sk_live_`, `sk_test_`, `whsec_`), Resend (`re_`), JWTs, GitHub tokens, AWS keys and PEM blocks. No real secret found.
- Literal hits that are not secrets: `whsec_greethub_local_fake` (`app/lib/adapters/fake/payments.ts`, line 6; a public test constant used to sign fake events) and a test fixture (`app/tests/shop/stripe.test.ts`, line 7). Also the dev fallback `greethub-local-dev-session-secret` in `app/lib/shop/session.ts` line 6 (a risk, see below).
- `.gitignore` (root) ignores `.env*` except `.env.example`; `app/.gitignore` ignores `.env*`, `.data/`. Confirmed ignored: `app/.env.local`, `pipeline/.env`. There is no `.env.example` in the repo although the ignore rule expects one.
- Untracked-but-present: `app/.env.local` exists (not opened), `app/.data/greethub.json` exists (ignored; holds local test data).
- The key is read in three places: `lib/intake/config.ts`, `lib/book/moderation.ts`, `lib/book/engine/live.ts` (also reads `.env.local` from disk), plus `pipeline/src/cli.ts` (reads `.env.local`). Server-side only; nothing in the browser bundle (grep for `NEXT_PUBLIC_` shows only site and Supabase public values planned).
- Children inherit everything: `lib/intake/preview.ts` (`env: process.env`) and `lib/book/queue.ts` (`...process.env`).
- Logging: errors are passed through `redact()` for `sk-` patterns in intake/safety paths; Stripe error text and `console.error(err)` calls elsewhere are not redacted (fine today, add a shared redactor).

## The book\.env key

Several agents have used the OpenRouter key stored at `C:\Users\seejn\book\.env`. I did not open it. Assume it appears in agent transcripts, tool logs or shell history on this machine.

Recommended, in order:
1. Now (owner, 10 minutes): in the OpenRouter dashboard, create a new key named `greethub-dev-<yourname>` with a credit limit (for example $10) and put it in `app/.env.local` only. Revoke the old key.
2. Stop agents reading `book\.env`. Give GreetHub work its own file, `app/.env.local`. Tell agents that rule 1 forbids opening it; keep the file outside any folder an agent edits for other projects.
3. At launch (owner): rotate again. Whatever was in a transcript during development is burned.
4. Keep a record of who holds which key (a note in your password manager, no values in docs).

## Key plan: one key per environment, each with a spend limit

| Key | Used by | Limit | Where it lives |
| --- | --- | --- | --- |
| `greethub-dev` | local dev, agents | $10 total, no reset | `app/.env.local` |
| `greethub-ci` (only if CI makes live calls; prefer mock) | GitHub Actions | $2 total | GitHub Actions secret |
| `greethub-preview` | Vercel Preview | $10 per month | Vercel env, Preview scope only |
| `greethub-prod` | Vercel Production | monthly limit set to the budget you accept losing in the worst case (suggest 2x forecast) | Vercel env, Production scope only, marked Sensitive |
| `greethub-worker` (when the worker leaves Vercel) | queue worker host | separate limit, so a worker leak does not touch web | worker host secret store |

OpenRouter supports a credit limit per key, with an optional reset period, and keys can be disabled instantly; check the exact option names in the dashboard when creating them (not verified here). Set the account-level auto top-up OFF so a leak can only spend what is already loaded. Add a low-balance email alert.

The in-app spend ledger (03) is the second wall; the OpenRouter key limit is the last wall and the only one an attacker with the raw key cannot bypass.

## Rules for every secret

- Names only in docs and `.env.example`. Never a value in a prompt, test, fixture, screenshot or commit message.
- Server env vars only. Anything prefixed `NEXT_PUBLIC_` is public by design: only the Supabase URL and anon key, the Turnstile site key, the Stripe publishable key.
- Vercel: mark secrets Sensitive (not readable after saving), scope each to the right environment (Production, Preview, Development), never share one value across environments.
- Supabase service role key: server routes and worker only; never in the browser, never in a `NEXT_PUBLIC_` variable. Prefer RLS plus the user's JWT for reads; use the service role only for ledger, orders and webhooks.
- Stripe: restricted key limited to Checkout Sessions (write) and Events (read) instead of the full secret key; separate test and live keys; webhook signing secret per endpoint.
- Lulu and Prodigi: sandbox credentials in Preview, live only in Production.
- Printer webhook secret and cron secret: 32 or more random characters, different from `SESSION_SECRET`. Generate with the PowerShell line in LAUNCH-CHECKLIST.
- Passing secrets to child processes: build an explicit env for the worker (`OPENROUTER_API_KEY`, `GREETHUB_DATA_DIR`, mode flags) instead of `...process.env`.

## Startup guard (ticket SEC-02)

Add `app/lib/security/env-guard.ts`, called from the root layout or instrumentation: in production, throw if `SESSION_SECRET` is unset or under 32 characters, if fake auth is active, if `GREETHUB_ALLOW_FAKE` or `GREETHUB_ALLOW_DEV_SIGNIN` is `1`, if mock AI is on, or if a `sk_test_` Stripe key is present while `VERCEL_ENV=production`. Fail loudly at boot, not at the first customer.

## Scanning and prevention

- Pre-commit: gitleaks (or `secretlint`) via a git hook; block commits with matches. Agents commit too, so install the hook in the repo (`.githooks/` + `core.hooksPath`), not only on one machine.
- CI: GitHub Actions job running gitleaks on every push and PR, full-history scan weekly.
- GitHub: enable 2FA, branch protection on `main`, Dependabot alerts. GitHub's built-in secret scanning and push protection for private repos need GitHub Advanced Security (paid, see costs.md); gitleaks covers the gap for free.
- Add `.env.example` with variable names only (listing in LAUNCH-CHECKLIST lines ~190 to 200).
- Add a `SECURITY.md` and a `/.well-known/security.txt` with a contact address after launch.

## If a key leaks

See `05-incident-response.md`, section "Key leak".
