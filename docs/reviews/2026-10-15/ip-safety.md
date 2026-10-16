# IP safety review, 2026-10-15

Owner: IP Safety Engineer. Read: docs/PLAN.md (B5, B14.7, decision 7), docs/legal/01, 07, photo-events-ip.md, attorney-brief-2026-10.md, app/lib/safety/, pipeline/src/stages/qa.ts. I did not run the eval or any live call today; numbers below are from doc 07 (Oct 11 and Oct 12). Nothing here is legal advice.

## Done vs plan
| Item | Status | Evidence |
|---|---|---|
| Same-theme, different-character service, 13 controls | Done | doc 07 section 3 |
| Free rules + one Sonnet screen, output vision QA, one hardened re-roll | Done | `pipeline/src/stages/qa.ts`, `render.ts` |
| Holiday characters (Rudolph, Frosty, Grinch, Jack Skellington, Elf on the Shelf) | In `ip-table.json` and committed (d233837); 7 red-team lines mention Rudolph/Grinch. B14.7 acceptance (all five with cases + benign controls + `eval:ip --mock` green) NOT re-run by me today | ip-table.json, fixtures |
| Eval | Mock: 100% precision, 90.7% recall on 215 cases, 0% false positives (Oct 12). Live: 98.6% / 100% on the first 197 (Oct 11). The 18 newer cases and the holiday cases have no live run | doc 07 s8 |
| **B5 fail-closed IP verdict per page** | **NOT done.** `qaPage` still returns `pass: true`, "QA call failed; not blocking", when the vision call errors (`qa.ts` line 95). No per-page verdict is stored and no gate sits before proof approval or print | qa.ts; PLAN B5 |
| B5 model-sheet check | **NOT done.** `modelsheet.ts` has no hardening, sanitiser or vision check | doc 07 s7 |

## Open items (ranked)
1. B5 fail-closed: record a verdict per page, retry the check, never pass on a missing verdict, and block proof approval and print without one. Needs pipeline owner/CTO. I can write the verdict type and tests in `pipeline/src/safety/` once the owner of `qa.ts` agrees.
2. Model-sheet vision check (about $0.01 per sheet). Needs a dollar cap.
3. App-side Sonnet screen spend is in-memory only, outside the cost ledger and the daily cap.
4. Takedown workflow, counter-notice handling and repeat-infringer log: not built (needs Supabase, SEC-18).
5. Photo moderation never live-tested; CSAM hook only logs.
6. Cyrillic names match only if listed; multi-turn assembly beyond 4 turns not covered; table is finite (48 characters plus 5 holiday, 15 franchises). Mock/CI has only the table.
7. Red-team set is our own writing, so recall is optimistic. No real-traffic reports yet.
8. `photo_caption` field type exists but no caption field is wired.

## IP risks in marketing and social content
- **Sample art.** Only two live themed renders and one control exist (docs/legal/ip-safety-samples); two samples is not a statistical result. The CMO has 26 style sample JPGs in `app/public/styles` that nobody has run through the IP vision check or the brand review. Run all 26, and every public sample and ad image, through the vision QA before use. Keep real children's faces out (rule 5); the "Sample" label on AI people conflicts with that rule.
- **Themes.** "Icy sisters, snowy castle", wizard school, caped hero: theme matching is our deliberate position (attorney Q2). Christmas is the sharp edge: Rudolph, Grinch, Frosty and Elf on the Shelf are protected, so no holiday template, Pinterest board or ad may name them or use their silhouettes (red nose, green furry figure, snowman with top hat and pipe, elf doll).
- **Template names and copy.** The Christmas book, Hanukkah and Thanksgiving templates and the 12 template names are not IP-logged by me. Names must not contain a franchise, brand or slogan. The 41 slogans in the table (including "because you're worth it" style lines) must not appear in marketing copy. Audit all hashtags and TikTok sounds that name a franchise.
- **Style strings.** Social and CMO docs say "no in the style of"; presets must use movement names only. `anime_inspired` is a style id to check: "anime" is a genre, which I judge acceptable, but it goes to the attorney.
- **Our own names and handles.** Wren, Juniper and other replacement names have no trademark clearance. Handles and the brand name need a knockout search (Social asks the attorney).
- **Competitor material.** Teardown screenshots stay in docs/market, never used as design references (photo-events-ip.md 4.2). Template provenance records and a one-cent similarity check are proposed but not built.
- **Claims.** Never write "legally safe", "copyright-free" or "no look-alikes guaranteed" in ads or help pages.

## Owner actions
1. Approve a dollar cap (suggest $1.00): live eval on the new and holiday cases, model-sheet check, 26 style samples and any public sample art.
2. Direct the pipeline owner to do B5 fail-closed before any approval or print is enabled (a launch gate, not a nice-to-have).
3. Register the DMCA agent (US$6, 3 years), then set `registered: true` in `DmcaAgentBlock.tsx`; engage the attorney on Q2, Q4, Q5, Q7, Q8, Q9 and the CSAM procedure.
4. Decide on "Sample" labels for AI-made people in ads.
5. Approve trademark knockout searches for the brand name, handles and replacement names.
