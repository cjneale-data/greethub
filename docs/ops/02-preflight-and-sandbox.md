# Pre-print file checks and printer sandbox routine

Owner: Fulfillment. Version 2026-10-12. Nothing here has run against a real printer yet: no sandbox keys.

## What the code already does

- Book pages: 8.5 x 8.5 in trim plus 0.125 in bleed per side (8.75 in page), 0.5 in safe area, images resampled to 300 DPI JPEG q95, TrimBox and BleedBox set (`pipeline/src/layout/book.ts`, `common.ts`).
- Card panels: 5 x 7 in trim plus 0.125 in bleed (5.25 x 7.25 in), 0.375 in safe area (`pipeline/src/layout/card.ts`).
- Fonts embedded as subsets (Andika, Chewy). Colour is RGB JPEG; both printers are said to accept RGB but convert it, so expect some colour shift (verify on physical proof).
- Adapter checks are only "is a URL present" (`app/lib/adapters/real/lulu.ts`, `prodigi.ts`). Lulu's validation endpoints are a TODO.

## Gaps that block printing (in order)

1. `printAssets()` returns no URLs, so nothing can print (CTO).
2. Lulu needs one wraparound cover PDF (back + spine + front with wrap margin) sized by Lulu's cover-dimensions call for the page count. Not built.
3. Prodigi card SKU is a placeholder, and the card file layout Prodigi wants (one spread or separate panels; outside back) is unknown. The pipeline makes two separate pages. Also check where the SKU prints: if it prints outside the US, every card date in `03-holiday-cutoffs-2026.md` is wrong.
4. Resolution: model output is upsampled to 300 DPI. The launch checklist notes a 234 DPI effective-resolution concern. Only a physical proof settles it.
5. `messageFitted:false` on a card is not checked before print, so text can run off the panel (Card engineer).

## Preflight checklist (run on every file before submit; automate in code later)

| Check | Book interior | Book cover | Card |
|---|---|---|---|
| Page size including bleed | 8.75 x 8.75 in every page | From Lulu cover-dimensions for this page count | Per Prodigi spec for the chosen SKU |
| Page count | 24 or 32, even | 1 page (wrap) | Per spec |
| TrimBox and BleedBox present | Yes | Yes | Yes |
| Effective image resolution at print size | 300 target, 200 minimum, flag below | Same | Same |
| All text inside safe area | 0.5 in from trim | Also clear of spine edges | 0.375 in |
| Fonts embedded, no Type 3 | Yes | Yes | Yes |
| No transparency or layers left unflattened | Yes | Yes | Yes |
| IP vision verdict stored for every page (fails open today, IP safety) | Required | Required | Required |
| Text matches the approved proof (dedication currently does not print) | Required | Required | Required |
| File reachable by the printer (signed URL, at least 24 h validity) | Yes | Yes | Yes |
| File hash recorded so a reprint uses the same file | Yes | Yes | Yes |

A file that fails any row goes to `needs_attention` before submit, never to the printer. Lulu's own validation (interior and cover) should run as a second gate once keys exist.

## Sandbox test routine (run once keys arrive; repeat before each release that touches print, and monthly in Q4)

Use mock AI (`GREETHUB_MOCK_AI=1`), fictional sample content only, sandbox keys only. Never a customer file.

1. Catalogue: list Lulu pod packages and Prodigi products; confirm `LULU_BOOK_POD_PACKAGE_ID` (8.5 x 8.5 casewrap, 24 and 32 pages) and pick the real card SKU. Record both in `04-vendor-tracking.md`.
2. Quote: request cost and shipping quotes for book 24, book 32 and card, at every shipping level, to 5 test addresses (CA, NY, TX, AK, HI). Record unit cost, shipping cost, and whether each level has tracking. Feed the CFO.
3. Validate: run Lulu interior and cover validation on a 24-page and a 32-page sample; send the card to Prodigi with a known-bad file to confirm it is rejected.
4. Submit: one book and one card order end to end through the app (paid in Stripe test mode). Confirm the external id, that a second submit for the same line does not create a second job (Lulu has no idempotency key today: expect this to fail until fixed), and the status changes reach the order page.
5. Webhooks: register Lulu and Prodigi callbacks to the preview URL; confirm events arrive, are verified, and update the order. Today nothing registers them.
6. Exceptions: force each case in `01-order-exception-playbook.md` (bad file, bad address, cancel within 120 minutes) and confirm it shows on `/api/admin/orders/exceptions`.
7. Record pass or fail per step with the date. Ordering a physical proof and approving print quality is an owner step.

## Physical proof checks (owner orders, Fulfillment writes the checklist results)

Colour against screen proof, skin tones, trim position on every page, nothing important cut at gutter or edge, spine text centred, cover wrap tight, paper weight, card fold and envelope. One book of each page count and one card. Photograph the result for the team (no real people in the book).
