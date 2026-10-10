# Pipeline costs (measured)

Data: `finance/measured_costs.json`, built by `pipeline/scripts/cost-report.ts` from the JSON-lines ledgers in `pipeline/measurements/`. Every OpenRouter call writes one ledger line per attempt (`pipeline/src/ledger.ts`): stage, label, model, image size, tokens, HTTP status, latency, and `costUsd` read from the response `usage.cost` field (requested with `usage: {include: true}`). If a response lacks it, cost is computed from tokens or a fallback price table and flagged `costSource: computed` (never happened in these runs). The Supabase `cost_ledger` table mirrors these columns.

Test spend: **$1.53** of the $2.50 cap, across 4 pipeline runs (3 cards, 1 four-art-page book) and one 1K/2K/4K size probe. Real photos from the Eye Story refs were used as inputs and are not in the repo.

## Per-call (USD, nano-banana-2.1 served every call; no fallback was needed)
| Call | Cost |
|---|---|
| Image 1K | 0.041 |
| Image 2K (about 15 s) | 0.061 |
| Image 4K (about 21 s) | 0.123 |
| Identity sheet (Sonnet, vision, 2 photos per person) | 0.011 |
| Card copy | 0.005 |
| Book story (3 spreads; about 0.007 per spread) | 0.022 |
| Page prompts (about 0.009 per page) | 0.038 to 0.042 |
| Vision QA per page | 0.0025 |

## Per product (2K images, recommended)
| Product | Renders | Base | With 20% re-roll allowance |
|---|---|---|---|
| Card, front only | 2 (sheet + front) | 0.15 | 0.16 |
| Card, front + inside art | 3 | 0.22 (measured clean run: 0.239) | 0.25 |
| Book, 24 pages (11 spreads) | 14 | 1.10 | 1.26 |
| Book, 32 pages (15 spreads) | 18 | 1.42 | 1.64 |
| Book, 24 pages at 4K | 14 | 1.97 | 2.31 |
| Guest preview (1K, front only, no sheet; estimate) | 1 | 0.07 | |

Measured directly: card 2K clean run $0.239; card 2K with two re-rolls $0.368; book with model sheet + cover + 3 spreads $0.469 (one wasted re-roll, since fixed). The 24/32-page figures are extrapolated linearly from the measured per-call costs; they are not full-book runs. User-requested re-rolls beyond the allowance cost about $0.06 each.

This is well below the plan's $2-4 book and $0.30-0.60 card guesses. Image size is the main lever: 2K is about 280 DPI at card size and 234 DPI at book size (4K doubles cost for little visible gain).

## Reliability
- 0 HTTP errors, 0 network errors, 0 429s in about 45 calls; the fallback chain was never triggered (covered by mocked tests only).
- Auto-QA caught real defects: 2 of 8 2K page renders had a faded white vignette border and were re-rolled once (second try passed). A QA counting bug (counted background animals) and an over-strict border check caused 3 wasted re-rolls in early runs; both are fixed (QA counts cast only; border check requires near-pure white). Small sample, treat the 20% re-roll rate as a planning figure.

## What was built (`pipeline/`)
- `src/openrouter.ts`: client. No retry on HTTP 400 (or other permanent 4xx), retry on network error and 429/5xx (3 attempts, backoff), model chain nano-banana-2.1 -> 3.1-flash-image -> 3-pro-image with per-model max size, text model claude-sonnet-5.5, hard spend cap per ledger, key read lazily and redacted from logs.
- `src/stages/`: identity sheet, model sheet (with approval gate callback), copy/story, page prompts, render (model sheet attached first), QA (free local white-border check + cheap vision count/text check, one auto re-roll).
- Prompt guard lines appended by code to every page: FULL-BLEED, FRAMING, exact cast count, locked outfit and same-teeth lines, no text in image.
- `src/layout/`: pdf-lib + fontkit, embedded Andika/Chewy (OFL, copied from the Eye Story). Book 8.5x8.5 trim + 0.125 in bleed (630 pt, 2625 px at 300 DPI), Trim/Bleed boxes, auto-fit text, interior/front/back/preview PDFs (24 pages = 11 spreads, 32 = 15). Card 5x7 + bleed, print PDF (front + inside) and a watermarked low-res guest proof.
- Run: `cd pipeline && npx tsx src/cli.ts card fixtures/card.json --photos <dir> --size 2K --cap 0.5` (photo id maps to `<dir>/<id>.jpg`). `npm test` runs 24 mocked tests.

## Not done yet
Page-flip web preview (M4), Lulu cover wrap with spine, Supabase job queue and Realtime progress, a full 24-page live run (the budget did not allow it), and a user-visible model-sheet re-roll loop.
