# Stock cards: v1 catalog and art direction

Head of Design, 2026-10-16. Companion to `docs/design/stock-cards.json` (48 cards, source of truth). Nothing is rendered yet and nothing was spent.

## 1. What a stock card is

A pre-made 5x7 folded card for a standard occasion. Art is generated once by us, reviewed by hand, stored as a static asset. The customer buys it, edits the inside message, and members can add their handwriting and signature. No model call at purchase. Same print spec as photo cards (`photo-events-templates.md` section 1): 300 DPI, 0.125 in bleed, 0.25 in safe.

## 2. Taxonomy: occasions x tones

Tones: **heartfelt**, **funny**, **celebratory**, **calm**. Each occasion offers only the tones that fit it. Cells show cards in v1.

| Occasion | heartfelt | funny | celebratory | calm | Total |
|---|---|---|---|---|---|
| Birthday | 1 | 2 | 2 | 1 | 6 |
| Christmas | 1 | 1 | 1 | 1 | 4 |
| Thank you (incl. teacher, coach) | 2 | 1 | - | 1 | 4 |
| Just because | 1 | 1 | - | 1 | 3 |
| New baby | 1 | - | 1 | 1 | 3 |
| Get well | 1 | 1 | 1 | - | 3 |
| Sympathy | - | **never** | **never** | 3 | 3 |
| Congratulations | - | 1 | 2 | - | 3 |
| Graduation | 1 | - | 1 | 1 | 3 |
| Wedding | 1 | - | - | 2 | 3 |
| Anniversary | 1 | 1 | - | 1 | 3 |
| Mother's Day | 1 | 1 | - | 1 | 3 |
| Father's Day | 1 | 1 | - | 1 | 3 |
| New home | - | 1 | 1 | - | 2 |
| Valentine's | 1 | 1 | - | - | 2 |
| **Total** | | | | | **48** |

Left out of v1 on purpose: Hanukkah, Diwali, Eid, Thanksgiving, Easter, retirement, pet loss, apology, divorce, miscarriage. Faith and culture cards need a reviewer from that community and a second pass by the owner; add them in a v1.1 batch. Seasonal cards (Christmas, Valentine's, parent days) can rotate on and off the grid by date.

## 3. Launch size and cost

**Launch with 48 cards.** Reasoning: 3 per occasion gives one safe choice per mood without a wall of near-duplicates; birthday gets 6 and Christmas, thank you 4 because they are the biggest and the November window needs Christmas now. More cards help less than better ones; grow by sales data per occasion.

Cost uses `finance/measured_costs.json` (read 2026-10-10 figures): 2K image $0.0609, 4K image $0.1233, QA vision $0.0025.

| Per card | USD |
|---|---|
| 2 candidates at 2K (pick the better) | 0.1218 |
| Final at 4K (print master, 1575x2175 px needs more than a 2K frame) | 0.1233 |
| Vision QA plus IP check | 0.0050 |
| **Total** | **0.2501** |

48 cards = **$12.00**; with a 30% re-roll buffer (white borders, IP-check fails) **$15.61**. If 2K upscales cleanly in a print proof, the total falls to about $6.50. Inside pages are typeset, not rendered. Recommend a dollar cap of $16 and a 6-card pilot ($1.50) first, one per tone, to check the style strings. The owner approves the cap.

## 4. Art direction per occasion

Same site rules: full bleed, no border, no text in the art, hand-reviewed, one approval-log row per image (who, date, model, prompt version).

| Occasion | Direction | Styles used (of 26) |
|---|---|---|
| Birthday | Bright, one clear subject, a calm band for a typeset greeting | bold_cartoon_pop, flat_vector_friendly, watercolor_wash, maximalist_pattern, paper_cut_collage, midcentury_shapes |
| Christmas | Warm night or deep green, amber light, one focal object | cozy_gouache, block_print, foil_luxe, wonky_ink_cartoon |
| Thank you | Gentle objects: flowers, apple, whistle. No people | ink_wash, paper_cut_collage, crayon_pencil, botanical_gouache |
| Just because | Quiet, small, lots of space | hand_lettered_type, wonky_ink_cartoon, cozy_gouache |
| New baby | Pastel, sleeping animals, no babies drawn | watercolor_wash, pastel_chalk, flat_vector_friendly |
| Get well | Cozy objects or one glum, funny animal. Funny only for minor illness | bold_cartoon_pop, watercolor_wash, flat_vector_friendly |
| Sympathy | Muted, wide empty space, no red, no people, no animals except one bird, no humor | ink_wash, botanical_gouache, watercolor_wash |
| Congratulations | Burst shapes, confetti, gold-look | bold_cartoon_pop, deco_geometric, comic_panel |
| Graduation | Caps, books, laurel, no school logos or mascots | paper_cut_collage, watercolor_wash, foil_luxe |
| Wedding | Botanical or gold-look ornament, large empty center | ink_wash, foil_luxe, botanical_gouache |
| Anniversary | Pairs of objects (cups, birds), no couples drawn | minimal_line_art, deco_geometric, vintage_storybook |
| Mother's / Father's Day | Objects and nature, never gendered stereotypes beyond a teapot or a grill joke | paper_cut_collage, botanical_gouache, crayon_pencil, bold_cartoon_pop, cozy_gouache, midcentury_shapes |
| New home | Houses, keys, boxes | flat_vector_friendly, bold_cartoon_pop |
| Valentine's | One shape, one accent color | minimal_line_art, bold_cartoon_pop |

Style notes from `style-library.json`: stock cards need no character consistency, so the card ratings (4-5) matter, not the book ratings. Avoid in v1: cinematic_photoreal and painterly_realism (uncanny risk, no photo use), soft_3d_animated and anime_inspired (the library flags movie-lookalike pull and anime did not land in the render test), moonlit_night and clay_stopmotion and felt_thread (kept for v1.1, not weak, just not needed for coverage). foil_luxe, deco_geometric and hand_lettered_type are gold-look in RGB, not real foil: do not call them "foil" to customers.

## 5. Inside page layout (5x7 right-hand panel)

The inside is **typeset, never model-drawn**. The left inside panel stays blank (a tiny cocoa wordmark may sit at the bottom for non-members only).

- Panel: 5 x 7 in trim, background paper `#FBF6EE`, optional 0.25 in hairline of `line` `#E8DCC8` inside the safe area.
- **Message area:** 3.9 in wide x 3.1 in tall, centered horizontally, top at 1.1 in. Figtree 17/1.6 cocoa, left-aligned. Fits about 6 lines of 34 characters.
- **Handwriting-friendly line length:** 34 characters or fewer per line, 6 lines maximum, default text under 110 characters (3 to 4 lines). Customer limit 200 characters in typed mode; in handwriting mode a live count warns at 150, because a long handwritten message shrinks the glyphs below 14 pt-equivalent. Lines break on a fixed 0.4 in baseline grid so the handwriting font sits on the same lines as typed text.
- **Signature zone:** 3.9 x 0.9 in, directly below the message with 0.3 in gap, bottom edge at least 0.9 in above the trim bottom. It holds a saved signature or a typed name. Keep clear of any art or ornament.
- Safe area 0.25 in on every edge; nothing in the message or signature zones within 0.5 in of the fold-side edge.
- Members choose "Typed" or "In my handwriting" (portal Handwriting page defaults carry through, CX 06). Non-members get typed only. The default message always appears typed first and is fully editable; clearing it is allowed.

## 6. What the front may carry

- The model draws **no text, letters, numbers, logos or brands** (same rule as site art).
- We may typeset one short greeting on the front ourselves, 5 words or fewer, Bricolage 800, in a calm band the art reserves (top or bottom third). v1 ships with no typeset front text on cards marked "empty center", so customers can add their own later.
- No names, dates, URLs, slogans, or the words "Disney", "Hallmark" or any brand.
- Alt text describes the picture in one sentence, never reads text from it.

## 7. Original characters only

Every animal or figure is invented: round cat, lumpy creatures, bear in pajamas. Do not describe a character with a protected character's traits (ears, buttons, gloves, capes, signature palettes). No superheroes, princesses, wizards-with-scars, talking cars, yellow sponges. No living artists or studios in prompts. Human figures are avoided in v1 (the art is object-led); hands in "High Five" must be plain, un-gloved. Every image passes the vision IP check (look-alike score under 6, `docs/legal/07-ip-safety-design.md` control 9) plus a human look before it enters the catalog. A "control" prompt must never be saved in the catalog. Taking down any card needs no code: remove its row and asset.

## 8. Sympathy and sensitive-occasion rules

- Sympathy: calm tone only. No humor, no exclamation marks, no puns, no "passed away" or "better place", no religion, no "everything happens for a reason". No red, no hearts, no balloons or confetti, no people. Default text is short and plain ("I am so sorry. I am thinking of you and I am here.").
- Get well: funny only for everyday illness; the funny card says "soup" and "blanket", not a diagnosis. Never imply the recipient is to blame.
- Wedding and anniversary art shows no couples, so any pairing fits.
- Default messages: original, 110 characters or fewer, at most one exclamation mark (brand rule; the current set uses zero), first-name friendly, no recipient assumptions (no "Dear Mom" unless the occasion is a parent day).
- Medical or legal wording is never added by us. Anything that sounds like advice goes to the owner's attorney.

## 9. Next steps (not done)

1. Owner: approve the dollar cap and the 6-card pilot.
2. Head of Design (when approved): render the pilot, run IP and white-border checks, log approvals, write `app/public/stock/` assets.
3. Card engineer: inside layout from section 5; load `stock-cards.json`.
4. CMO: copy review of the 48 default messages. Legal: glance at sympathy and get-well rules.
5. Design: v1.1 batch for faith and culture occasions with community review.
