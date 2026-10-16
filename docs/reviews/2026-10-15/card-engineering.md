# Card engineering review, 2026-10-15

Scope: PLAN.md B4, B12, B14.2/B14.4; code in app/lib/collage, app/lib/proof-check, app/lib/writing, app/app/create/card, pipeline/src/layout/card.ts. I read code and file lists; I did not run tests today except as quoted from PLAN (collage + recipients: 92 pass, mock).

## B4 Account card flow (M3b)
| Piece | State |
|---|---|
| Guest creator (`/create/card`, `CardCreator.tsx`, 496 lines): chat/forms, live brief card, one watermarked preview, no-photo guest rule (`guestPhotoViolation`), cookie limit | Built, mock-testable |
| `/api/intake`, `/api/card/preview`, `/api/card/message`; `/api/cart` accepts card lines | Built |
| `layoutCard` print PDF (pipeline/src/layout/card.ts), message fit, tested | Built in pipeline; not wired to any account order |
| Session-aware creator (signed-in path, save to account, real `creationId`) | Missing |
| Full render job (non-watermarked, hi-res) | Missing |
| Approval page (UX spec s5) and approved proof == print PDF | Missing |
| Add-to-cart with a real creation id | Missing; only guest preview feeds the cart today |
| Verbatim message print + sign-off screening into the print path | Partly: screening exists; print job not connected |
Dependency: B1 persistence (PLAN: all state on local disk, no commitment). B4 cannot be accepted on a hosted preview without it.

## B12 Handwriting in print
- Built (mock mode): 8 presets, own-handwriting template/scan, signatures, defaults, picker + preview, `lib/writing/service.ts` with `resolveCardWriting` (ownership 404), `layoutCard` embeds font or 300 DPI render and 0.7 in signature band, fonts traced in next.config.ts. Tests: tests/writing.
- Missing: nothing calls `resolveCardWriting` outside tests (needs B4/B6 print job); copy of resolved style/signature into the order at checkout; proof on paper at preview size; fonts found by the deployed print function (unverified on preview).
- Known gaps: preview box taller than print box when an inside drawing is present; Plus gating is off until `GREETHUB_MEMBERSHIP=1`; attorney question on signature image export.

## Photo-card editor UI (B14.2, B14.4)
- Engine built, mock/tested: lib/collage (templates, place, geometry, quality, 5x7 PDF with bleed, envelope, proof; tests/collage incl. golden PDF) and lib/proof-check (names spelled two ways, year not 2026; tests/proof-check). 6 front + 2 back templates exist as spec/JSON.
- UI: none. Nothing in app/ or components/ imports lib/collage or lib/proof-check. No pan/zoom/swap editor, DPI warning surface, "I checked names and dates" tick, batch 25/50/100 line, or proof page.
- Photo intake: lib/photo-sets exists but is reported uncommitted/unverified (PLAN go/no-go item 6); B14.3 owns consent, HEIC, moderation, purge.
- DPI constants disagree (quality.ts 200/150/100 vs decision 1): needs one rule in one module before PDF golden is trusted.

## Open items (priority, size)
| P | Item | Size |
|---|---|---|
| 0 | B1 persistence decision/commit (CTO/owner) | n/a for me; blocks all below |
| 1 | B4 session-aware creator + creation record | 2-3 d |
| 1 | B4 render job + approval page + proof==PDF | 3-4 d |
| 1 | B4 cart line with creationId; wire `resolveCardWriting` + checkout copies (with Shop) | 1.5 d |
| 1 | Folded-card sandbox/proof order tied to Prodigi (B6) | Fulfillment; I support 0.5 d |
| 2 | Resolve DPI rule, one module | 0.5 d |
| 2 | Photo-card editor (template pick, pan/zoom/swap, DPI badges, 390px layout) | 4-5 d |
| 2 | Proof page with checker flags and tick; approved proof == print PDF | 2 d |
| 2 | Batch cart line 25/50/100 (Shop) | 1 d mine |
| 3 | Playwright walks at 1280/390 for account card + editor | 1 d |
| 3 | Preview-vs-print box gap with inside drawing | 0.5 d |

## Risks to the Nov 20 cards gate
1. B1 uncommitted: B4 has no durable creation to approve or print; critical path.
2. B4 is the whole gate dependency (B6, B14.4, B14.5 all wait on it); about 8 engineer-days with B1 to B7 and B11 contending for the same people.
3. Photo cards Phase 1 depend on a printer account, sandbox and quote the owner has not opened (go/no-go Oct 24); editor work before that may be wasted. Plan rule: folded cards win any contested day.
4. Handwriting prints are untested on paper; a font or embedding fault shows only in a physical proof (order by Nov 6).
5. Photo intake/purge unverified: editor with real children's photos must not ship before consent and moderation.
6. Everything here is mock; no real render, Prodigi call or paid model path has run end to end.
