# 07. IP-safety design

Engineering design note for the owner and a licensed attorney. Not legal advice. Written 2026-10-11 after the build described in section 3. **An attorney must review this design, the replacement table and the takedown process before launch.** Nothing in the product, code or docs claims that the output is "legally safe". The customer-facing wording is "original characters inspired by your idea".

Background: GreetHub has no upstream IP indemnity (01 section 2, "Indemnity gap summary"), so it carries the output-infringement risk itself. This note covers the controls that reduce that risk. They reduce it; they do not remove it (section 7).

## 1. The rule: same theme, different characters

The customer's IDEA is kept: relationships, mood, setting type, activity, kind of magic, the occasion. The protected IDENTITY is replaced.

Example. A customer asks for "Anna and Elsa from Frozen on a birthday card". The product keeps two sisters, icy winter magic, a snowy castle and sparkle. It draws two ORIGINAL characters: Juniper (chestnut bob, round glasses, plum puffer jacket, striped mittens, steaming mug) and Wren (short black curls, mustard wool coat, pine-green bobble hat, a carved wooden lantern that sparkles frost). The names, franchise words, signature phrases and logos never reach a prompt.

### Why a look-alike is not the goal

The goal is NOT "slightly looks like Anna and Elsa". A near-copy is the riskiest zone: copyright and trademark protect a character's distinctive combination of traits (name, hair colour and style, costume silhouette and palette, signature props, sidekicks, setting), not any single trait, and "a lookalike with small changes" is the fact pattern that produces infringement claims. So every replacement must change ALL of the distinctness checklist, and the output check scores look-alike risk and fails at a documented threshold (section 4, control 7).

Distinctness checklist (used by the table authors, by the live classifier prompt in `app/lib/safety/service.ts` `DISTINCTNESS_CHECKLIST`, and by the re-roll prompt):
1. A new name (not a spelling variant, translation or nickname).
2. A different hair or body colour AND a different style.
3. A different costume silhouette AND palette.
4. Different signature props, sidekicks and setting.

Also never used anywhere: franchise names, character names, signature phrases or slogans, logos, and "in the style of [franchise]" (replaced with "a warm hand-drawn storybook style").

Old replacements such as "an ice queen with a braid" (Elsa), "a masked hero in a red and blue suit" (Spider-Man) or "a cheerful cartoon mouse with a big bow" (Minnie) were near-copies and were deleted. A unit test (`app/tests/safety.test.ts`) fails if any of those strings returns.

Brands are removed, never replaced by a look-alike mark. Real public figures are refused with a friendly "describe what you like about them" message.

### Real family names are not protected

A name is treated as a protected character only in a franchise context. "My niece Elsa", "Happy birthday Elsa", a recipient or character the customer named Elsa/Anna/Mario/Simba, and "our dog Bluey" are left alone. Logic: `app/lib/safety/fastpass.ts` (family cues, customer-supplied known names, other franchise cues, bare mentions only in idea fields). The word "frozen" in ordinary use ("frozen pond", "frozen yogurt") is not flagged.

## 2. Product behaviour

- Rewrites are applied automatically and shown with a friendly one-line note with an edit option, e.g. "Kept the idea (two sisters, icy winter magic and sparkle) and made original characters. Edit anything you like." Notes have no more than one exclamation mark, never preach, never mention law.
- Chat: the note is prepended to the guide's reply and an "I'll rephrase" chip is offered. Card form: the field keeps the customer's text with the note and a "Use this version" button. Book: the rewritten text is put back in the form and a toast shows the note.
- A slogan typed as the printed card message is replaced by an original line with the same sentiment (table: `slogans[].alt`) and the customer is told. Ordinary phrases ("good luck", "let it go and relax") are untouched; everyday phrases that are also slogans ("just do it") count only when standing alone, quoted, Title Cased or labelled as a slogan.
- A page whose picture still looks protected after one automatic re-roll is blocked: "This picture kept coming out too close to something that already exists, so we stopped it. Want to try a different direction for this page?" The re-roll charge is refunded.

## 3. Controls and where they live

| # | Control | Where |
|---|---|---|
| 1 | Data-driven table: 48 characters with original designs, 15 franchises, brands, 41 slogans with alternatives, public figures, family cues | `app/lib/safety/ip-table.json` |
| 2 | Normaliser (case, accents, full-width and look-alike letters, zero-width characters, leetspeak, spaced letters) with a map back to the customer's text | `app/lib/safety/normalize.ts` |
| 3 | Free first pass and MOCK service: exact names, misspellings (edit distance), descriptions, other languages, "in the style of", slogans, public figures, family-name logic | `app/lib/safety/fastpass.ts` |
| 4 | Service interface, mock, live implementation (rules, then ONE `anthropic/claude-sonnet-5.5` call with strict JSON, batched), merge and re-check of model output, note policing | `app/lib/safety/service.ts`; server factory `app/lib/safety/server.ts` (mock when `GREETHUB_MOCK_AI=1` or no key) |
| 5 | Card chat (customer turn AND fields the model writes into the brief), card message route (suggested message too), card preview route | `app/app/api/intake/route.ts`, `app/app/api/card/message/route.ts`, `app/app/api/card/preview/route.ts`, `app/lib/safety/draft.ts`, `app/lib/intake/guardrails.ts` (client-side instant check uses the same rules) |
| 6 | Book: story idea, setting, dedication, character roles, sheet notes, re-roll notes, story edits, proof title and dedication, final re-check at story approval; live-engine last-mile check of every printed string before print files | `app/lib/book/service.ts`, `app/lib/book/engine/live.ts` |
| 7 | Sonnet-written text checked on OUTPUT (title, blurb, page text, scenes, card message); last-mile prompt sanitiser on every final image prompt; guest-card runner | `pipeline/src/stages/copy.ts`, `pipeline/src/stages/prompts.ts`, `pipeline/src/stages/render.ts`, `pipeline/src/safety/index.ts`, `app/lib/intake/pipeline-runner.mjs` |
| 8 | Prompt hardening on every image prompt (no logos, brand marks, trademarks, licensed or franchise characters, slogans or readable text; plain original clothing and props; redraw logo or licensed-character clothing from reference photos plain) | `app/lib/safety/hardening.ts`, appended by `guardLines()` in `pipeline/src/stages/prompts.ts` |
| 9 | Output vision QA: `recognizable_protected_character`, `logo_or_brand_mark`, `slogan_or_trademarked_text`, `licensed_merch_on_clothing`, `character_lookalike_risk` 0-10; fails at `LOOKALIKE_RISK_FAIL_AT = 6`; one automatic re-roll with a hardened prompt naming the problem; then block, delete the file, offer a different direction. All calls (screen, QA, re-roll) are in the cost ledger (stages `ip_safety`, `qa`, `render`, labels `#reroll`). The free local white-border check is kept and the vision call now runs even when it fails, so the IP check is never skipped on a page that may be kept | `pipeline/src/stages/qa.ts`, `pipeline/src/stages/render.ts`, `pipeline/src/safety/thresholds.ts` |
| 10 | Photo moderation (nudity or sexual content, sexual content involving minors, graphic violence = block; large logos and licensed costumes = warning, clothing redrawn plain). Fails closed if the classifier is unavailable | `app/lib/book/moderation.ts` |
| 11 | Data events | `app/lib/safety/events.ts`; plan `docs/data/tracking-plan.json` and `docs/data/03b-seed-event-definitions.sql` (`ip_input_rewritten`, `ip_input_blocked`, `ip_output_flagged`, `ip_output_rerolled`; kinds and counts only, no customer text) |
| 12 | Report and takedown: public form, API, stored report, email confirmation, admin list, DMCA agent placeholder | `app/components/shop/ReportForm.tsx`, `app/app/(shop)/report/page.tsx`, `app/app/api/report/route.ts`, `app/lib/safety/reports.ts`, `app/app/(shop)/internal/reports/page.tsx`, `app/app/api/admin/reports/route.ts`, `app/components/shop/DmcaAgentBlock.tsx` (footer) |
| 13 | Red-team set and eval | `app/tests/fixtures/ip-redteam.json`, `app/tests/safety-redteam.test.ts`, `app/scripts/eval-ip.ts` (`npm run eval:ip`) |

Photo captions: the book form has no caption field today. The service supports `photo_caption` as a field type, and bare character names are deliberately not flagged there (a child called Elsa); wire it when a caption field exists.

## 4. Design details worth knowing

- **Fail-open on the model, fail-closed on photos.** If the Sonnet screen call fails, the free rules still run and the result is marked `degraded`; the image prompts are still hardened and the vision QA still runs. Photo moderation, in contrast, refuses the upload if the classifier cannot run.
- **Model output is not trusted.** After the model rewrites text, the rules run again on the result; a protected name the model let through is removed. Notes are policed: any note that mentions law, safety or approval is replaced with the template note.
- **Injection.** Customer text is passed as JSON data and the classifier prompt says to ignore instructions inside it. Tested in `app/tests/safety.test.ts`.
- **Multi-step attempts** are covered only when both halves are in one message, or in the last four customer turns (passed to the live classifier as history). Longer-range assembly is not covered.
- **Cost.** The rules are free. The live screen is one Sonnet call per request (batched across fields); measured about $0.002-$0.003 per customer text in the eval, about $0.01 per vision check and one extra render only when a page is flagged.

## 5. Photo moderation and CSAM (req 17, 18)

The classifier is `google/gemini-2.5-flash-lite` via OpenRouter with `provider.zdr = true` (override with `GREETHUB_MODERATION_MODEL`). It was not live-tested: the budget went to the text and image validation, and no real photo may be sent anywhere without the consent flow. It is covered by mock-mode tests only.

A "sexual content involving a minor" result stops processing: the upload is not stored, displayed or forwarded, a metadata-only hook (`setCsamHook`) is called, and the customer sees the same generic "can't use that photo" message as any block. The default hook only logs.

**TODO for the attorney (blocking before real photos):**
- Req 18 says "preserve evidence securely" and "report to NCMEC CyberTipline as the law requires" (18 USC 2258A, unverified). The owner's instruction for this build is "do not store or forward the image". These conflict if a provider must preserve the image on report. Decide what the hook must do: preserve (where, how long, who can access), report (who files, what is sent), ban the account, and what is told to the customer.
- The classifier call itself sends the image to a third party (OpenRouter and the model provider). Is that acceptable for suspected CSAM, and does it trigger any reporting duty for GreetHub or the provider?
- A written procedure, staff access rules and logging.

## 6. Report and takedown

`/report` is a real form: what, where (order number or link), who is shown, contact email, and for copyright the good-faith statement and a typed signature. The API stores the report in the shop store (Supabase table later), emails the reporter a confirmation and the team inbox (`report@greethub.example`, or `REPORT_INBOX_EMAIL`) through the email adapter (fake locally, Resend when keyed), and shows a 48-hour target. An admin-readable list is at `/internal/reports` and `/api/admin/reports`, open in local dev only; every production build, Vercel previews included, needs `GREETHUB_ADMIN_TOKEN` in the `x-admin-token` header (timing-safe compare). `GREETHUB_ALLOW_FAKE=1` no longer opens it (changed 2026-10-12: the list holds reporters' emails and descriptions of children). The footer shows the DMCA designated-agent block with a visible PLACEHOLDER marker until the owner registers an agent (01 section 3 item 7). **Owner action:** register the agent, then fill `DMCA_AGENT` in `app/components/shop/DmcaAgentBlock.tsx` and set `registered: true`.

Not built: a takedown workflow (removing an order's art and stopping a print job), counter-notice handling and a repeat-infringer log. The list has a status field; actions are manual.

## 7. Known residual risks and what is NOT guaranteed

- **The output vision check fails open (found 2026-10-12).** If the vision call errors or returns unreadable JSON, `qaPage` passes the page ("QA call failed; not blocking") and the guest preview runner treats it as no flags. A page that was never IP-checked can reach the proof and the printer. Fix (pipeline owner): record an IP verdict per page and require one before proof approval and print; retry the check, never pass on a missing verdict.
- **The character model sheet is not IP-checked (found 2026-10-12).** `modelsheet.ts` gets no hardening lines, no prompt sanitiser on the identity text and no vision check, yet every page copies it. A look-alike sheet makes every page fail, re-roll and block. One vision check on the sheet (about $0.01) is cheaper than that.
- **App-side screen spend is uncapped.** `lib/safety/server.ts` counts live Sonnet screen spend in memory only; it is not in the cost ledger or the daily guest cap. Every chat turn and draft save pays for it.
- **Cyrillic is folded as look-alike Latin, not transliterated.** Names in Cyrillic match only when the table lists the Cyrillic spelling. Transliteration conflicts with the homoglyph defence and needs a per-word script check.
- **No guarantee of non-infringement.** An output can still resemble a protected character, trade dress or a living artist's work. The look-alike score is a model's opinion; it will miss things and will sometimes over-flag.
- **The first-pass table is finite.** 48 characters and 15 franchises are listed; everything else relies on the live Sonnet screen and the output vision check. Mock mode (CI, local dev) has only the table. A new franchise will not be caught by the rules until added.
- **Recall numbers are on our own set.** The 197 red-team cases were written by the same team that tuned the rules, so rules recall on them is optimistic. Treat live recall as an upper bound, and grow the set from real traffic.
- **Look-alike risk can arise by accident.** Image models reproduce well-known styles. The model sheet and distinct designs reduce this; the vision check catches obvious cases only.
- **Photos.** A child's clothing with a licensed print is warned about and redrawn plain by instruction; the image model may not comply, which is why the output check exists. Faces are the customer's own and are outside this note.
- **Printed text.** Franchise names in a card message are rewritten even when they are a plain mention (for example "we are going to Disneyland"); this is a deliberate conservative choice (question 1 below). Fail-open on a model outage means a slogan the rules do not know can be printed.
- **The Sonnet screen sees customer text.** It goes to OpenRouter and Anthropic under the existing terms. No ZDR flag is set on text-only calls.
- **Public figures** are a fixed list plus the model; a lesser-known real person is only caught by the model.
- **Takedown is a target, not a safe harbour.** The 48-hour target is our promise to ourselves; DMCA safe-harbour status needs the registered agent, a repeat-infringer policy and an attorney.
- **No trademark clearance** of the replacement names (Wren, Juniper and so on) has been done. They are common words and first names, but check before they appear in advertising.

## 8. Eval results (2026-10-11)

Set: 197 cases in `app/tests/fixtures/ip-redteam.json` (franchise names, misspellings, spaced letters, leetspeak and look-alike characters, nicknames, descriptions, 10 other languages and scripts, slogans, "in the style of", brands, public figures, jailbreaks and multi-step attempts, 58 benign cases including real family members named Elsa, Anna, Mario, Dora, Simba and ordinary uses of "frozen"). Positive means the case must be rewritten or blocked (139 cases).

| Run | Precision | Recall | False-positive rate | Exact verdict |
|---|---|---|---|---|
| Free rules only (mock, runs in CI) | 100% (128/128) | 92.1% (128/139) | 0% (0/58) | 94.4% |
| Live: rules, then Sonnet on the 69 cases the rules left unflagged | 98.6% (139/141) | 100% (139/139) | 3.4% (2/58) | 99.0% |

Rules misses that the live model caught: a descriptive nickname ("the Mouse House's famous mascot"), "the Caped Crusader", two descriptions without names, Spanish/French/Russian titles that are not in the table ("Bob l'éponge", "Тополино"), an unlisted real person, an obfuscated ("backwards") name and a reference to an earlier turn. Live false positives: "A super man who loves cooking pancakes" and "Because you are worth it, here is a card." (an ordinary sentence containing a slogan; defensible either way).

A first live run had 12 degraded calls (response truncated at 3000 tokens); the cap was raised to 8000 and the run repeated with 0 degraded. To limit spend, cases the rules already rewrite or block keep the rules result in the live run. Reproduce: `cd app && npm run eval:ip -- --mock` (free), `npm run eval:ip -- --skip-rules-hits --cap 0.16` (live, about $0.14).

### Rerun 2026-10-12 (mock only; no live calls)

Added 18 cases from an offline evasion probe (misspellings, other languages, descriptions, look-alike public-figure names, and benign family cases such as "Ariel my niece", "Luca", "Coco the cat", "Olaf, our grandfather"). Rule changes: a relation after the name ("Ariel, my niece") now marks a real person; "like a <known style> book/illustration/drawing" is a style request; added Pato Donald, Paperino, Bob Esponja, Bob l'éponge, Pepa Pig, Тополино, Человек-паук; the ice-queen descriptor accepts "with the long ... braid".

| Run | Precision | Recall | False-positive rate | Exact verdict |
|---|---|---|---|---|
| Free rules only, 215 cases | 100% (136/136) | 90.7% (136/150) | 0% (0/65) | 93.5% |
| Free rules only, the original 197 cases | 100% | 94.2% (131/139) | 0% (0/58) | |

The 6 new cases the rules miss have not been run live (no budget given). Live numbers above are from 2026-10-11 and do not cover them.

## 9. Live image validation (2026-10-11)

Review images are in `docs/legal/ip-safety-samples/` (`themed_1.jpg`, `themed_2.jpg`, `control_mouse.jpg`, `summary.json`, cost ledger).

- **Themed example** ("Anna and Elsa from Frozen on a birthday card"). The customer text went through the screen and the final image prompt contained no franchise names. Two renders. Honest assessment: both show two clearly different characters (a girl with a chestnut bob, round glasses and a plum puffer jacket; a woman with short black curls in a mustard coat and green bobble hat holding a lantern), a generic fairy-tale castle, pine trees and sparkles. Neither resembles Anna or Elsa in hair, colour palette, costume or props; the castle is a generic snowy castle, which is the theme we deliberately keep. The vision check scored look-alike risk 2 of 10 with no flags on both. In the second render the model drew the word "COCOA" on the mug (the design said "a tin of cocoa"); the QA flagged `text_in_image` and the table design was changed to a "steaming enamel mug". Two samples is not a statistical result.
- **Control** (a famous mouse described without its name: round black ears, red shorts with two buttons, yellow shoes, white gloves). The render is recognisably that character; the vision check named it, scored look-alike risk 8 and flagged `protected_character` and `lookalike_risk`, which would trigger the re-roll and then the block. This shows the check can fire; it does not measure its recall.
- **Spend** (all live OpenRouter use for this work): about $0.43 of the $0.50 budget: text classifier runs $0.12 + $0.03 + $0.14, images and vision QA $0.13.

Not live-tested: photo moderation, the full book pipeline end to end with live models, and the re-roll path with real renders (it is covered by mocked tests in `pipeline/tests/safety.test.ts`).

## 10. Questions for the attorney

1. **Trademark use on cards.** Is printing a franchise or brand name inside the customer's own card message (nominative or descriptive use, for example "see you at Disneyland") acceptable, or should it always be rewritten as it is now? Does it matter that GreetHub prints and ships the item rather than the customer?
2. **Parody and fair use.** Does any parody, homage or "inspired by" position make a deliberately close look-alike safer, or should the "different characters, same theme" rule stay absolute? What is the risk in matching a theme and mood (icy sisters, snowy castle) while changing every character trait? Is a theme such as "wizard school" or "caped hero" itself protectable?
3. **Customer warranties and indemnity.** Is a ToS warranty that the customer will not request protected characters, plus an indemnity, enforceable against consumers (and for gifts to third parties)? Does a rewrite that the customer accepted shift responsibility, or does it make GreetHub the author of the final prompt?
4. **Output review duty.** What review is expected of a service that generates and prints per-order content: is the automated vision check plus the customer's proof approval enough, or is human review of flagged or sampled orders needed? Does Lulu's "meaningful human review" language (01 section 5) cover this?
5. **Takedown timing.** Is a 48-hour target appropriate, what must the DMCA notice, counter-notice and repeat-infringer process contain, what must we do with an already-printed or shipped order, and do we need the designated agent registered before launch?
6. **Likeness.** Right of publicity and the rewrite of public figures into "someone inspired by what you like about them": any concern with the "inspired by" step?
7. **Look-alike threshold.** Is 6 of 10 on a model's look-alike score a defensible standard, or should the approach be documented differently?
8. **CSAM procedure** (section 5): preservation versus "do not store or forward", reporting, and sending a suspected image to the classifier vendor.
9. **Replacement names and designs.** Clearance for the original names in the table before they are used in advertising.
10. **Vendors.** Whether moderation and screening calls through OpenRouter (and its model providers) need DPAs or ZDR for text-only calls.

## 11. Maintaining the table

Edit `app/lib/safety/ip-table.json`, not the code. A new character needs: `names`, `newName`, a `design` of at least 10 words that changes all four checklist groups, `theme`, optional `descriptors` and `strong` names (names always treated as protected even if the entry is `ambiguous`). Run `npx vitest run tests/safety.test.ts tests/safety-redteam.test.ts` (it checks that no design leaks a protected word or repeats an old near-copy) and add red-team cases for the new entry.
