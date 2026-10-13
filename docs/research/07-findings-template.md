# Findings templates

Store filled copies in `docs/research/findings/<study>/`. Participant ids only (P1, P2 ...). No names, emails, faces, recordings, photos or children's details. Quotes are trimmed of anything that identifies a person.

## 1. Usability session notes (one per session)

Same fields as cx/04 s8, plus the assumption ids.

```
Study: round-1   Session: P_   Profile: P-a..P-e   Device / browser:   Date:   Moderator:
Consent form version:   Recording consent: Y/N   Self-photo arm: Y/N (attorney-approved: Y/N)
SUS: __   Trust (1-5): photos __ cost __ arrival __ help __ gift __
Seeded flaw: found Y/N, at which page view:

| Task | Result (C / CH / F) | Time | Errors | SEQ (1-7) | Notes |
|---|---|---|---|---|---|

| ID | Screen / step | What happened (observed) | Quote (timestamp) | Severity S1-S3 | Assumption | Proposed fix |
|---|---|---|---|---|---|---|

Price answers (too cheap / getting expensive / too expensive): book __ card __
Best moments:
Surprises:
```

## 2. Interview notes (one row per participant)

```
| P | Profile | A2 photo trust | A3 price (book: cheap/exp/too exp; card) | A8 AI story | Last gift story (2 lines) | Best quote |
|---|---|---|---|---|---|---|
```

## 3. Synthesis (one per study, within 48 hours of the last session)

```
Study:   Dates:   n:   Build / commit:   Live adapters: Y/N   Image spend: $__

Verdict: go / go with fixes / hold

Assumptions
| Id | Supported / mixed / contradicted / no signal | Evidence (counts, quotes) |

Top problems (ranked by severity x how many saw it)
| Finding | Seen by (n of N) | Severity | Quote | Recommended fix | Ticket |

What worked (keep these):
Pass/fail vs cx/04 s6 criteria:
Decisions needed from the owner:
What we could not test, and why:
```

## 4. Ticket format for the CX backlog

```
### CX-xx <Short title> | S1/S2/S3 | effort S/M/L
Source: research <study> finding <id>, seen by n of N.
Problem: <observed behaviour, one or two sentences>.
Evidence: "<quote>" (P_), "<quote>" (P_).
Fix: <recommended change>.
Acceptance: <how a retest or metric shows it is fixed>.
```

Severity follows cx/04 s7. Any S1 seen by 2 or more participants holds launch until fixed and retested with 3 new participants.
