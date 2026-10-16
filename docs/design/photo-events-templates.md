# Photo cards and events: templates, sizes, type

Head of Design, 2026-10-14. Wave 1 deliverable for docs/products/photo-cards-and-events-plan.md.
The card engineer builds against `docs/design/photo-events-templates.json` (slots in inches, text styles, themes, suites). It is generated and checked for safe area, bleed, overlaps, keep-clear zones, QR size, contrast and style ids. All checks pass.

## 1. Sizes and print spec

All flat cards: 300 DPI, 0.125 in bleed on every edge, 0.25 in safe area inside trim. Coordinates start at the top-left of the **trim** box; negative values reach into bleed.

| Size id | Trim (in) | Canvas with bleed | Use | Envelope |
|---|---|---|---|---|
| flat_5x7_p / flat_7x5_l | 5 x 7 | 5.25 x 7.25 (1575 x 2175 px) | Holiday card, save the date, invitation | A7 (5.25 x 7.25) |
| postcard_6x4_l | 6 x 4 | 6.25 x 4.25 | Save the date, RSVP postcard | A6 (4.75 x 6.5), or mailed bare |
| details_4x6_p | 4 x 6 | 4.25 x 6.25 | Invitation details card | Goes inside the A7 |
| rsvp_5x3_5_l | 3.5 x 5 | 5.25 x 3.75 | RSVP card | A1 (3.625 x 5.125); A2 (4.375 x 5.75) only as fallback |

- **Borders:** grid layouts use a 0.3125 in outer margin and 0.125 in gutters. Anything under about 0.25 in shows trim drift (cutters wander about 1/16 in), so a photo edge either sits inside the safe line or runs fully into bleed. Nothing in between. The validator enforces this.
- **Envelopes:** no bleed (printed on made-up envelopes), 0.25 in safe. Each envelope layout keeps the stamp corner and the USPS barcode clear zone (bottom 5/8 in, right 4.75 in) free of ink.
- **USPS shape:** A7, A6, A2, A1, 4x6 and 3.5x5 all sit inside the machinable aspect range (1.3 to 2.5). A2 is close to the limit at 1.31. Square cards (5x5, planned for later) pay the non-machinable surcharge, so the product page should say so. The postcard address side follows USPS conventions. **Verify the zones against USPS DMM 201/202 and the chosen mailing partner's own template before print** (not checked against the DMM text in this pass; the partner's template wins when it is stricter).
- **Fonts in PDFs:** every face must be embedded. Bricolage and Figtree need self-hosted TTFs the same way the handwriting fonts are (`app/public/fonts/handwriting`). The PDF renderer cannot use the Google Fonts CSS.

## 2. Layout set (v1)

Fronts, 5x7 portrait (`_p`) and landscape (`_l`): **full-bleed** (with a color band, or text on a scrim), **2-up**, **3-grid** (portrait: one tall and two stacked; landscape: three columns), **4-grid**, **hero plus two**, **polaroid stack** (three rotated frames, -6°, +5° and -2°, over a pattern, with an optional handwritten caption). Frame and photo share a pivot, so they rotate as one.

Backs: **photo strip** (3 or 6 squares portrait, 4 landscape) with message and sign-off; **letter** (up to about 220 words; landscape flows into two columns so lines stay under about 70 characters); **from block** (sign-off, names and year on a panel over a pattern).

Also: four save-the-date fronts (scrim, calendar, art border, 4x6 photo-left), three invitations (text-led, photo top, party), RSVP, QR-first reply card, details card, the postcard address side, and four envelope fronts.

Each text slot names a **role** (headline, names, kicker, date, subhead, body, small, caption, signoff, address, address_return) and a `bind` field. The theme maps roles to text styles, so one layout serves many themes. Text auto-fits from `sizePt` down to `minPt`. If it still overflows, the editor asks the person to shorten it and never shrinks below the minimum.

## 3. Typography

Brand faces carry the system: Bricolage Grotesque (display) and Figtree (text). We add script from fonts we already ship and propose one serif.

| Product | Headline / names | Details | Sign-off |
|---|---|---|---|
| Holiday | Bricolage 800, 34 pt (min 22), or Great Vibes script 44 pt (Red Wool) | Figtree 700 caps, tracked +0.12, for names and year; Figtree 400 10 pt for letters | Customer's pick of the 8 handwriting presets, default Everyday (Kalam), 18 pt × sizeScale; own handwriting for Plus |
| Wedding | Allura script 48 pt (min 30) or **Cormorant Garamond** 600 caps 30 pt | Figtree 600 caps, tracked +0.18, for the date; Cormorant 500 12 pt for body | Same handwriting options |
| Party | Bricolage 800, 40 pt (min 24) | Bricolage 700 18 pt for the date; Figtree 500 11 pt | Marker (Gochi Hand) |
| Envelopes | Recipient: Figtree 500 caps, 11 pt, **never script or handwriting** (machine reading). Return address may use handwriting. | | |

Cormorant Garamond is a **proposal**. It is SIL Open Font License, but it is not yet in the repo. Each serif style carries a Figtree fallback in the JSON until the card engineer adds the TTF and its licence. Minimums: body 8.5 pt, fine print 7 pt, script never under 14 pt.

## 4. The 12 launch themes

| # | Theme | Product | Palette (bg / ink / accent) | Optional AI art (style-library ids) |
|---|---|---|---|---|
| 1 | Paper Pines | Christmas | paper / pine #2F4A3A / deep red | botanical_gouache, block_print |
| 2 | Red Wool | Christmas | #9E3115 / paper / marigold | felt_thread, cozy_gouache |
| 3 | Snow Day | Happy holidays (non-religious) | white / slate #23395B / ice | watercolor_wash, minimal_line_art |
| 4 | Merry and Bright | Christmas, kids | marigold / cocoa / plum (no persimmon on marigold) | bold_cartoon_pop, maximalist_pattern |
| 5 | Eight Nights | Hanukkah | #1F3A68 / paper / soft gold | paper_cut_collage, midcentury_shapes |
| 6 | Midnight Confetti | New Year | plum / paper / marigold | deco_geometric |
| 7 | Golden Hour | Save the date | navy back, white over scrim | photo-led |
| 8 | Modern Calendar | Save the date | white / cocoa / persimmon-ink | minimal_line_art |
| 9 | Garden Letterpress | Save the date | ivory / sage #3E4F3A | botanical_gouache, ink_wash |
| 10 | Classic Garden | Wedding suite | as 9 | botanical_gouache, ink_wash |
| 11 | Evening Deco | Wedding suite | navy / cream / gold-ochre | deco_geometric |
| 12 | Confetti Party | Party suite (birthday, shower, graduation) | paper / cocoa / persimmon | bold_cartoon_pop, maximalist_pattern, paper_cut_collage |

Ink on background is 6.7:1 or better on every theme (computed in the JSON).

**Cultural accuracy, Eight Nights:** a hanukkiah has nine branches (eight level, the shammash set apart). Never a seven-branch menorah, and no Christmas motifs. The customer picks the spelling (default "Hanukkah"). **Midnight Confetti:** the proof checker confirms the year shown is the coming year.

**Suites coordinate** through one palette, one text-style map and **one art render** reused on every piece (invitation border, details band, RSVP pattern, back). That means one ~$0.06 render per suite, not per piece, and guaranteed visual match. Save-the-date pairs: Garden Letterpress → Classic Garden; Golden Hour and Modern Calendar → Evening Deco. Confetti Party is digital-first: the RSVP is a QR card pointing at the event page.

## 5. Photo quality rules

Effective DPI = source pixels on the short side of the crop ÷ slot inches, after zoom.

| Effective DPI | Editor shows |
|---|---|
| 300+ | nothing |
| 200–299 | nothing (fine at arm's length) |
| 150–199 | amber: "This photo may print a little soft." |
| 100–149 | red, and the person must tick "Print it anyway" |
| under 100 | blocked: swap the photo or pick a smaller slot |

Each photo slot in the JSON carries `minPixels` for warn, block and ideal (a full-bleed 5x7 needs 1050 x 1450 px to clear 200 DPI). No upscaling past 2x. No generative upscaling or "face enhancement" on customer photos: it changes how real children look.

**Faces:** every detected face box sits inside the slot, inset by 8% of the slot's short side, with at least 5% headroom above the head. On full-bleed slots, faces stay at least 0.375 in from trim. No face is cut by a gutter or polaroid frame. Text slots are no-face zones, and auto-crop moves the photo rather than putting text on a face.

## 6. Text over photos (accessibility)

- Text sits on photos only in the two layouts marked `requiresContrastCheck` (the full-bleed scrim layouts). Everywhere else, text sits on a band or panel.
- For each text box, measure the 95th-percentile worst pixel under it. Body text needs 4.5:1 against that pixel, and display text of 24 pt or more needs 3:1 (WCAG 1.4.3 ratios, used as a print standard). If it fails: deepen the scrim (theme dark, up to 65%), then offer the band layout, then block approval.
- QR codes: at least 0.75 in, a 4-module quiet zone, dark on light, never on a photo, and always printed with a short URL.
- Digital versions (e-card, event page): the text is live text, not baked into the image, and photos get alt text the customer can edit (default "Photo from {names}").
- Open: the small GreetHub mark on backs is `optional: true` until the CMO and owner decide.
