# Support patterns log

Owner: GreetHub Support Agent. For CX (docs/cx) and engineering. No customer names, emails, photos or message text here; order ids and counts only.

## Status 2026-10-12

No live tickets yet: there is no support mailbox (`hello@greethub.example` can't receive mail) and no `/contact`. The entries below are **predicted** contact drivers found by reading the code and docs. Replace them with real counts by reason after launch (tags from docs/cx/02 s7).

## Predicted contact drivers, most likely first

| # | Reason | Why we expect it | Fix owner |
|---|---|---|---|
| 1 | "Where is my order?" | Orders never reach "Delivered"; no delay email; tracking only after ship | Shop (CX-45), fulfillment |
| 2 | Name misspelled, noticed after paying | No spelling card on the proof (CX-05); order goes to the printer within seconds of payment, no undo window | Book engineer, CTO |
| 3 | Dedication missing from the printed book | Proof shows and edits a dedication that the print file never includes (CX-44) | Pipeline owner. Every case is "doesn't match proof" = our cost |
| 4 | Cancel request | No cancel button (CX-11); policy says "until In production", a status that doesn't exist | Shop, legal (policy text) |
| 5 | Needs-attention order | Every real print fails today (`printAssets()` returns nothing). Email now says it's on us; order page may show raw printer text in the line note | Shop / CTO |
| 6 | Out of redraws on a book | 3 per book, no top-up tool for support | Book engineer (admin override) |
| 7 | Sign-in link missing | Sender address defaults to `hello@example.com` when `EMAIL_FROM` is unset; deliverability unknown | Owner (domain), DevOps |
| 8 | "Reply to this email" goes nowhere | Confirmation email says "just reply"; no reply-to set and no real inbox | Owner (mailbox), shop |

## Defects log

| Date | Defect | Count | Raised to |
|---|---|---|---|
| 2026-10-12 | (none from customers yet) | 0 | |
