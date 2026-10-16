# Board Director review, 2026-10-15 (equity and contribution tracking)

Read: docs/PLAN.md (line 27 and the Oct 24 gate list), docs/equity/01 to 05, the 11 other reviews in this folder. Modelling only, not legal or tax advice.

## 1. State of the system
- Spec, idea rubric, schema, contribution policy, attorney/accountant questions: written (docs/equity/01 to 05), dated 2026-10-12 and still draft. Module at `app/lib/equity/index.ts` with tests in `app/tests/equity/`; dashboard source at `docs/equity/dashboard.html`. I did not re-run the tests today.
- Method sources (slicingpie.com, read 2026-10-12): 2x non-cash, 4x cash. Not found: Moyer's handbook wording on leavers and rate setting. Buying the handbook is still open.
- No real partners, rates, hours or cash are recorded anywhere. Dashboard holds fake demo data only. So the true split today is undefined, and nothing has been granted.
- Known gaps (spec section 10): one rate per person (no versioned rates), dashboard ignores the `config` collection, leaver rule rewrites history.

## 2. What needs logging from today's work (by a human, not me)
- Agent output earns nothing (PLAN line 27; spec section 9). The CFO's $600-a-day engineering figure must never be logged as hours. I am not entering any figures.
- Time: only the hours a partner actually spent today briefing, reviewing, deciding and directing the committee (this review round, owner decisions below). Category and note per entry, then approval by a second partner. Needs a second partner to exist; with a single partner nothing can be approved.
- Cash: any model, hosting, domain or tool bill a partner paid personally and was not repaid (OpenRouter, Vercel, Supabase, Stripe test-side tools, Gooten or printer sandbox and proof order due by Nov 6). Bills paid from a company account earn nothing. Log when spent.
- Ideas: candidates to enter as `proposed` only, with no award until adopted or shipped and reviewed by another partner: photo cards and events line, Dec 5 vs Nov 30 order-by call, Oct 24 go/no-go gate. Authorship must be a human partner's; I cannot judge who authored them.
- Resources: none to log without a stated fair value from the owner.

## 3. Decisions the owner must make (equity-relevant, as reviews converge)
1. Name the partners and set each fair-market rate once. Nothing else can start until this is done.
2. Who funds the cash needs? CFO plan peaks near $54k (finance/README.md). Partner-funded means up to $216k cash slices at 4x; outside investor means a trigger event that freezes the split. Pick before anyone fronts money.
3. Treatment of Photo cards and events spend (Gooten account, Nov 6 proof order, usability budget of $400 to $500, support allowance): company account or partner-paid. Decides whether it earns cash slices.
4. Approve or change the placeholder idea caps (5,000 per idea, 20,000 per person) and the rubric weights. Approve the deliberate departure from base Slicing Pie.
5. Approve or amend leaver defaults and write "good reason" into the policy. Then sign the contribution policy (04). Nothing is binding until you and each partner sign.
6. Decide the rate-change rule (new versioned rate vs new Person record) before real data goes in.
7. Engage the attorney and accountant now. Add the 05 questions (vesting, tax on equity grants, entity type, slice-to-share conversion) to the same brief as Q45 to Q66 in `docs/legal/attorney-brief-2026-10.md`.
8. Decide approval ground rules for solo periods (who approves while only one partner works).

## 4. Dependencies on other teams
- CFO: confirm which spend is company-paid vs partner-paid so cash entries are classified right.
- Legal: carry the equity questions into the attorney brief.

## 5. Not done
No real data, no commit, no re-test of the module today, no handbook read.
