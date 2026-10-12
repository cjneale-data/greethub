# GreetHub dynamic equity model: specification

Status: draft for owner review. This is modelling, not legal or tax advice. Nothing here grants equity. Code: `app/lib/equity/index.ts` (tests in `app/tests/equity/`).

## 1. Method and sources

GreetHub uses a "Grunt Fund" dynamic equity split, the Slicing Pie method by Mike Moyer. Every human's contributions become "slices"; a person's share is their slices divided by all slices, recalculated on every approved entry. Nothing is fixed until a trigger event (section 7).

Sources read 2026-10-12:
- https://slicingpie.com/the-magic-of-mutipliers/ : Moyer recommends a non-cash multiplier of 2 and a cash multiplier of 4. Cash includes "cash (when spent) and un-reimbursed expenses". Ideas and relationships are non-cash (2x). Cash is calculated after tax, non-cash at pre-tax rates.
- https://slicingpie.com/the-good-way-to-say-good-bye/ : four leaver quadrants (fired for good reason, fired for no good reason, resigned for good reason, resigned for no good reason). Fired for good reason: equity compensation retrieved and cash repaid without interest. A comment by Moyer says someone who leaves for no good reason loses non-cash slices and loses the multiplier on cash.
- https://slicingpie.com/ : slices come from time, money, ideas, relationships, facilities, supplies and equipment.
- Third-party summaries (equitymatrix.io, fairsquarellp.com) vary on multipliers; not relied on.
- Not found: Moyer's exact handbook wording of leaver definitions, and his published treatment of fair-market-value rate setting. The handbook should be bought and read before the policy is finalised (owner/attorney ask).

## 2. Who earns

Only humans named as partners. AI agents (Claude, any tool) never earn slices and have no Person record. The owner sets who is a partner and each person's rate.

## 3. Formulas

Let `Mn` = non-cash multiplier (default 2), `Mc` = cash multiplier (default 4).

- Time slices = approved hours x person's hourly fair-market base rate x Mn.
- Cash slices = approved dollars (cash spent or unreimbursed expense) x Mc.
- Resource slices (equipment, supplies, IP, facilities, no cash) = fair value of use x Mn.
- Idea slices = see section 5.
- Person total = sum of the above. Share % = person total / sum of all totals x 100. Zero total gives 0% for everyone (no divide by zero).

Rate is set once per person, recorded, and not changed retroactively (a rate change applies to later entries only; the current module takes one rate per person, so a change must be handled as a new Person record or a versioned rate before real use: open item).

## 4. Entry lifecycle

Entry fields: person, date, quantity (hours / dollars / fair value), category, note, status. Status is `logged`, `approved` or `rejected`. An entry counts only when `approved` by a different partner (`approvedBy` set, not equal to the person). Self-approval never counts. Hours are never invented; later, git activity or Claude Code session logs may be attached as supporting evidence only, never as the hours themselves.

## 5. Idea quality (deliberate departure from base method)

Base Slicing Pie values ideas at little or nothing. The owner wants idea quality to count, so GreetHub adds an explicit, auditable idea ledger. This is a departure and is flagged for the attorney.

- Fields: title, description, author, date, status (`proposed`, `adopted`, `shipped`), three rubric scores 0 to 5, reviewer (another partner), review note.
- Rubric (see `02-idea-rubric.md`): impact (weight 0.5), originality (0.2), evidence it was used (0.3).
- Weighted score S = sum(weight x score) / sum(weights), range 0 to 5.
- Award = `ideaCapPerIdea` x S / 5, only if status is in the unlock set (default adopted, shipped), a different partner reviewed it, and S >= `ideaMinScore` (default 2). Otherwise 0.
- Caps: default 5,000 slices per idea, 20,000 per person (placeholders; the owner sets them).
- All of rubric weights, caps, minimum score and unlock statuses are in `EquityConfig`.

## 6. Leaver rules (configurable, attorney review)

Rules are data in `EquityConfig.leaverRules`, each with `nonCashKept` (0 to 1) and `cashMultiplier`. Defaults:

| Leaver type | Non-cash slices kept | Cash multiplier |
|---|---|---|
| none (active) | 100% | 4 |
| fired for good reason | 0% | 1 (face value) |
| quit with no good reason | 0% | 1 |
| fired for no good reason | 100% | 4 |
| quit for good reason | 100% | 4 |

Cash at 1x is the owner's brief; Moyer's text says the 4x multiplier is lost. The module also never lets a leaver rule raise cash above the standard multiplier. Whether cash is instead repaid (his "fired for good reason" description) is for the attorney. "Good reason" and "good leaver" definitions must be written into the signed policy. Idea slices follow the non-cash rule.

## 7. Trigger events

Slices are a working ledger, not shares. At a financing, profit distribution or sale, the split is frozen from the ledger and converted to shares or units under the entity documents. Conversion mechanics are an attorney question (`05-attorney-accountant-questions.md`).

## 8. Worked examples (fake people)

Demo Alex rate $50/h, Demo Blake $100/h, Demo Casey $40/h.

1. First entry: Alex logs 10h, Blake approves. Slices = 10 x 50 x 2 = 1,000. Alex 100%.
2. Add Blake 5h approved by Alex: 5 x 100 x 2 = 1,000. Alex 50%, Blake 50%.
3. Casey spends $500 on unreimbursed expenses, approved: 500 x 4 = 2,000. Total 4,000: Alex 25%, Blake 25%, Casey 50%.
4. Alex quits for no good reason. Alex time slices 0; any Alex cash counts at 1x. Total becomes 3,000: Blake 33.3%, Casey 66.7%.
5. Idea shipped, scores 5/5/5, reviewed by a partner: award 5,000 x 5/5 = 5,000 slices.

## 9. Known limits

- One rate per person (see section 3).
- Ideas cap is per idea and per person, not a percentage of the pie.
- Cash repayment and recoupment are not modelled.
- Time spent is the person's honest log, verified only by partner approval.
