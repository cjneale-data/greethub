# Botanical Garden

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `botanical_gouache` | **category** Clean & Simple | **status** stable | **products** card | **ages** 4-7, 8-10

> Hand-painted flowers, leaves and little garden creatures. Fresh, pretty and easy to love.

**Why this one (shown to customers):** Pretty, fresh and garden-y, a safe pick for Mom, Grandma and teachers.

**Occasions:** mothers_day, thank_you, birthday, wedding, sympathy, get_well, anniversary  
**Tones:** tender, elegant  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **high**. Botanical illustration pairs with earthy palettes (R06); watercolor greenery and florals are common holiday card motifs (R08); strong on Etsy (R14).

- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)
- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R08 [V] Shutterfly: Top Christmas and holiday card trends (updated 2026-08-07): https://www.shutterfly.com/ideas/top-christmas-holiday-card-trends/ (read 2026-10-11)
- R14 [S] Etsy, Amazon and Hallmark listing roundups (search results, listing counts not sales): https://www.etsy.com/market/watercolor_birthday_cards (read 2026-10-11)

## How it looks

- **Medium:** Gouache and watercolor botanicals with fine ink details
- **Technique:** Layered petals, visible brush marks, flat leaf shapes with vein details
- **Line:** Fine ink details or none
- **Palette:** Sage, rose, peony pink, buttery yellow, soft blue, cream
- **Composition:** Bouquet or wreath, centered with breathing room
- **Mood:** Fresh, graceful, warm
- **Era:** Timeless

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Hand-painted botanical illustration in gouache and watercolor, layered petals and flat leaf shapes with fine ink vein details, visible brush marks, fresh palette of sage, peony pink, buttery yellow, soft blue on warm cream paper, loose balanced bouquet composition with breathing room, optional small friendly garden creature - not photorealistic, no 3D render, no gradients on petals.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- dense clutter
- text in the picture
- neon
- stock-photo flowers

## Palette

| Swatch | Hex |
|---|---|
| sage | `#B7C9A8` |
| peony pink | `#E58FA3` |
| butter yellow | `#F2D16B` |
| soft blue | `#9DB7D5` |
| cream | `#FBF6EE` |

## Character consistency

Book rating **2 of 5**, card rating **5 of 5** (5 = holds characters best).

Botanicals hold up perfectly for cards because there is no character to drift. For books, characters would be tiny; not offered.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Card-only
- Name the specific flowers for the recipient

## Photo reference handling

No people in the picture. If a pet or person appears, show as a small simple figure among flowers; or name the recipient's favorite flowers instead.

## Card typography and layout

- **Display:** Fraunces 600; Pinyon Script (names only)
- **Body:** Figtree 400
- **Notes:** Soft serif headline in deep green or cocoa; script only for the recipient's name.
- **Layout:** Bouquet or wreath at center, open space for message.
- **Text-safe zone:** Wreath center or bottom 30 percent stays clear for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Cream paper margin, bleed only the background tint if used.
- **Ink coverage:** Low to medium.
- **Foil and spot colour:** Gold foil on one leaf or name is a good upgrade; not simulated.

## Best for / avoid for

**Best for**

- Mother's Day
- Teacher thank-yous
- Get well
- Wedding and sympathy

**Avoid for**

- Books
- Funny cards for dads
- Adventure

## Retrieval

- **Tags:** botanical, floral, flowers, garden, wreath, leaves, bouquet, gouache, spring
- **Synonyms (customer words):** flowers, floral, garden, bouquet, wildflowers, pretty
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#C8441F` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/botanical_gouache.jpg` (copied to `app/public/styles/`). Rendered 2026-10-13 at 1K (site-art-v1, best of 3). Sample of the style, not yet reviewed against a print proof.
