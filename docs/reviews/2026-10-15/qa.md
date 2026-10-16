# QA committee review, 2026-10-15

Author: QA. Method: read docs/PLAN.md, docs/qa/, app/tests (incl. e2e), .github/workflows/ci.yml; ran `npx vitest run` and `npx tsc --noEmit` in app/ (mock mode). I did not run the e2e scripts this pass (no dev server started; rule 4), so their status below is from the plan and README, not from today.

## 1. Results run today

| Check | Result |
|---|---|
| `npx tsc --noEmit` (app) | Clean, no output |
| `npx vitest run` (app) | 709 passed, 5 skipped, **1 failed** of 715 (40 of 41 files pass) |
| The failure | `tests/book/jobs.test.ts` "runs story, sheet, pages and proof end to end": timed out at the 5000 ms default (took 5.5 s while the suite ran in parallel). Looks like load-sensitive timing, not logic, but I have not re-run it alone. It will go red in CI intermittently. Fix: per-test timeout or fewer mock delays (book engineer). |

## 2. Done versus plan

| Plan item | Status |
|---|---|
| Single launch-flow e2e (guest, sign-up, card, book, cart, pay, tracking, account, delete) | Built: `app/tests/e2e/launch-flow.mjs` (277 lines), desktop and mobile, axe on 13 screens. Last recorded: 16/16 hard checks in mock mode at 1280 and 390 px (PLAN.md; not re-run today). |
| STRICT=1 with 0 gaps (M7 done gate) | **Not met.** 4 GAPs fail under STRICT: guest draft not carried to Account > Drafts; signed-in "Looks good" still hits the sign-up wall (cart card line is the stand-in `demo-card-rosa`); no sandbox print submission (local fake printer); export omits book projects and consent (legal req 28). Needs shop and card engineers, not QA. |
| Run against the Vercel preview | **Blocked.** No Supabase (SEC-18), no preview test-auth path (sign-in and deletion use local `dev-link`), no Stripe test keys, no Lulu/Prodigi sandbox keys. |
| Account handwriting flow in e2e | Not added (PLAN.md line 226 assigns it to QA). |
| `@playwright/test` migration (retries, traces, `toHaveScreenshot`) | Not done. Plain `playwright` library scripts. Needs CTO/owner approval for the dev dependency. |
| Photo-card test plan | Written: `docs/qa/photo-events-test-plan.md` (199 lines). Execution depends on engineering. |

## 3. Coverage

**STRICT launch flow.** Covered in mock mode only, with the 4 gaps above. Real Stripe test payment, sandbox print orders and real email are not exercised anywhere. Rate limit: a second full pass inside 10 minutes fails with 429 (README), a trap for CI reruns.

**Accessibility.** `a11y.mjs`: axe WCAG A/AA on 14 public pages at 1280 and 390 px plus an 80-stop Tab walk (traps, missing focus ring, hidden stops). launch-flow adds axe on 13 in-flow screens. Gaps: criticals only fail by default (`A11Y_STRICT=1` adds serious; the done gate says no serious, so STRICT must be the gate setting); no screen-reader pass; no zoom/reflow at 200 to 400 percent; no reduced-motion or forced-colors run; the footer logotype is a known 1.4.3 exemption to filter. Not covered: account pages, proof viewer and photo-card editor in a11y.mjs (only in the flow).

**Visual regression.** **None.** No `toHaveScreenshot`, no pixelmatch (not in package.json), no goldens. Screenshots are saved for human review only. The photo-card plan proposes pixelmatch goldens for collage PNGs; `tests/collage/proof-envelope-golden.test.ts` is a data golden, not an image one.

**Home page animation.** **Not tested.** The only related test is `tests/tilt.test.ts` (tiltDegrees mapping, unit). No test of animation start/stop, `prefers-reduced-motion`, layout shift (CLS), pause control (WCAG 2.2.2) or animation under mobile viewport. `a11y.mjs` loads `/` but takes no motion assertions.

**Photo-card path.** Unit only: `tests/photo-card/photo-card.test.ts` (215 lines), `tests/collage/` (collage, design-pdf, proof envelope), `tests/recipients/recipients.test.ts`. **No `photo-card-flow.mjs`** and no STRICT e2e on the photo-card path, which PLAN.md B14.8 requires for the Nov 20 gate. No editor UI test, no DPI-threshold test against the C1 conflict, no PDF box checks against a real printer spec, no physical proof.

## 4. CI gaps (`.github/workflows/ci.yml`)

Present: lint, typecheck, vitest, IP eval (mock), production build, pipeline typecheck and test, npm audit, gitleaks, weekly scan.
Missing:
1. **No e2e job at all** (launch-flow, card-flow, shop-walk, a11y). Nothing stops a regression in the flow before merge.
2. No axe gate, no visual diff, no Playwright browser install or trace/screenshot artifact upload.
3. No preview-URL job (post-deploy run with bypass secret), and no way to authenticate on a preview.
4. No coverage reporting or threshold; no flaky-test quarantine (see the `jobs.test.ts` timeout).
5. No cross-user/RLS test job (gate for Supabase).
6. Build runs only on ubuntu/node 24; no mobile-browser engines (WebKit) even though iPhone Safari is a main customer path.

## 5. Test work before the gates

### Before Nov 13 (books and folded cards; code-complete)
- Fix or de-flake `tests/book/jobs.test.ts` (today, red).
- Add an e2e CI job: Playwright install, start app in mock mode on a spare port with blank provider keys, run launch-flow (desktop and mobile), card-flow, shop-walk, a11y; upload screenshots and results. Wait 10 minutes or reset between passes for the rate limit.
- Switch a11y.mjs to `A11Y_STRICT=1`; add account pages, proof viewer, order confirmation.
- Close the 4 STRICT gaps with owners, then run `STRICT=1` locally and have 0 gaps. QA cannot fix those.
- Preview test-auth path (Supabase admin magic link, preview-only) and Stripe test keys: then point `launch-flow.mjs` at the preview with `STRICT=1`.
- Add account handwriting flow and the book re-roll and failure path (refund) to launch-flow.
- Add home page animation checks: reduced-motion honored, no CLS, pausable, no focus loss. Add WebKit mobile run.
- Add visual regression for 8 to 10 key screens (home, browse, card preview, proof viewer, cart); decide `@playwright/test` (owner/CTO approval) so `toHaveScreenshot` and retries are available.

### Before Nov 20 (ship gate, incl. B14.8)
- `photo-card-flow.mjs`: upload synthetic photos (1 to 4), editor, DPI warning/block, proof checker, quantity 25/50/100, cart, pay, fake then sandbox printer, tracking, delete. Add the same axe and keyboard walk.
- Settle conflicts C1 to C6 in the test plan (DPI thresholds, size ids, list cap, 25/50/100) so conflict cases stop failing on purpose.
- Image goldens for collage at every size (pixelmatch dev dependency needs owner OK).
- Printer sandbox routine passes for Lulu and Prodigi in STRICT; both products' order lines reach `submitted`.
- Final `STRICT=1` pass on the preview at desktop and mobile, plus axe with no serious violations, saved as the gate record.
- Physical proof judged by Fulfillment (owner orders by Nov 6).

## 6. Needs from others
- Owner: Supabase credentials, Stripe test keys, Lulu and Prodigi sandbox keys, approval for `@playwright/test` and `pixelmatch`, proof order by Nov 6.
- CTO/DevOps: CI e2e job and preview test-auth path.
- Shop, card and book engineers: the 4 STRICT gaps; the `jobs.test.ts` timeout.
- Attorney answers (Q1 to Q13) still gate any real children's photos; the e2e uses synthetic images only.
