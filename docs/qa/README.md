# QA runbook: end-to-end and accessibility checks

Owner: QA. Scripts live in `app/tests/e2e/`. They use the `playwright` library (already a dev dependency) and `axe-core` (installed with eslint-plugin-jsx-a11y). No paid calls: always run the app in mock mode.

## Scripts

| Script | What it proves | Exit 1 when |
|---|---|---|
| `launch-flow.mjs [desktop\|mobile]` | Stop condition steps 1-7 in one session: guest card preview, sign-up, card, book (brief, consent, synthetic photos, story, sheet, pages, proof), cart, checkout, pay, confirmation email, tracking, profile, addresses, people, export, delete. Runs axe on 13 screens. | Any hard step fails. Known product gaps print `GAP` and fail only with `STRICT=1`. |
| `card-flow.mjs` | Guest card in depth: chat, IP rewrite, form mode, preview, flip, upgrade wall, reload, server refuses a second preview and guest photos. Desktop and mobile. | Any step fails. |
| `shop-walk.mjs [desktop\|mobile]` | Browse, cart gate, 18+ sign-up gate, checkout validation (PO box), declined card, pay, tracking, account pages, export, delete. | Export, sign-out after delete, or console errors fail. |
| `a11y.mjs` | axe (WCAG 2.x A/AA) and a keyboard Tab walk on 14 public pages at 1280 and 390 px. | Critical axe violation or keyboard trap (`A11Y_STRICT=1` adds serious). |

Screenshots and JSON results go to the OS temp folder (`greethub-e2e/<script>`), or to `OUT=<dir>`. Never into the repo.

## Run locally (mock mode)

Use a separate port and data folder so the run does not touch the dev server on 3000 or its data. Blank the provider keys so `.env.local` can't switch on a real adapter (an empty variable wins over `.env.local`).

```sh
cd app
GREETHUB_MOCK_AI=1 GREETHUB_DATA_DIR="$TMP/gh-e2e-data" GREETHUB_MOCK_DELAY_MS=150 \
OPENROUTER_API_KEY= STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET= LULU_CLIENT_KEY= LULU_CLIENT_SECRET= PRODIGI_API_KEY= RESEND_API_KEY= \
npx next dev -p 3101
# second terminal
export BASE_URL=http://localhost:3101
node tests/e2e/launch-flow.mjs desktop && node tests/e2e/launch-flow.mjs mobile
node tests/e2e/card-flow.mjs
node tests/e2e/shop-walk.mjs desktop && node tests/e2e/shop-walk.mjs mobile
node tests/e2e/a11y.mjs
```

One full pass makes 4 guest previews. The preview route allows 5 per IP per 10 minutes, so a second full pass within 10 minutes fails with `rate_limited` (429). Restart the dev server or wait.

## Run against a preview URL

```sh
BASE_URL=https://<deployment>.vercel.app VERCEL_AUTOMATION_BYPASS_SECRET=<from Vercel, never commit> STRICT=1 node tests/e2e/launch-flow.mjs desktop
```

Not runnable yet: sign-in and account deletion use the local `dev-link`, which a preview must not expose. The preview run needs a test inbox the script can read (or a Supabase test-user helper). See the QA section of docs/PLAN.md.

## Rules

- Photos are generated shapes (`syntheticPhoto()` in `_lib.mjs`). Never use real people, customer or family photos.
- Emails are `qa-*@example.com`.
- Don't add `waitForTimeout` to fix a flake. Wait for a visible state. Next 16 keeps the previous route mounted but hidden, so filter with `{ visible: true }` when the same control exists on two routes.
