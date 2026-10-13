# 02. Report patterns and rule requests

Owner: Trust & Safety. One row per pattern seen in reports. When a pattern repeats (2 or more reports, or 1 that reached print), file a rule request for gh-ip-safety (IP table, fastpass, vision check) or the relevant engineer. No customer content here: ids and a one-line description only.

## Patterns

| First seen | Report ids | Class | Pattern (one line, no customer content) | Count | Rule requested | Owner | Status |
|---|---|---|---|---|---|---|---|
| (none yet: no production reports as of 2026-10-12) | | | | | | | |

## Known gaps that will produce reports (from the 2026-10-12 assessment)

These are predicted, not observed. Re-check them against the first real reports.

| Gap | Likely report class | Rule or fix needed | Owner |
|---|---|---|---|
| Vision QA passes a page when the check itself fails | copyright, trademark | Fail closed, store an IP verdict per page | pipeline / gh-ip-safety |
| Model sheet gets no IP check | copyright | Vision check on the sheet before approval | pipeline / gh-ip-safety |
| Short misspellings and nicknames ("Elsaa", "Tay Tay") miss the rules in mock mode or on a screen failure | copyright, likeness (public figure) | Fuzzy match for short names and public figures | gh-ip-safety |
| Card sign-off is printed but not IP-screened | trademark, copyright | Screen sign-off as `card_message` | intake owner |
| Book text had no sensitive-content check (fixed 2026-10-12, rule list only, no model screen) | harmful | Live harmful-content screen for book text, not just IP | gh-ip-safety |

## Repeat infringers

Not built (req 24). Until there is a table, list account ids here only after the owner confirms an action, with the date and report ids. The threshold for closing an account is an attorney question.

| Account id | Report ids | Upheld actions | Owner decision | Date |
|---|---|---|---|---|
| | | | | |
