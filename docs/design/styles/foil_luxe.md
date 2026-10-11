# Gold & Luxe

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `foil_luxe` | **category** Fancy & Fabulous | **status** stable | **products** card | **ages** 8-10

> Rich dark color with gold-look details. Feels special, like premium stationery.

**Why this one (shown to customers):** Rich and festive, made for the moments that deserve a little shine.

**Occasions:** wedding, anniversary, christmas, graduation, birthday, valentines, congratulations  
**Tones:** elegant, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Gold foil is common in listings (R14) and premium stationery (R17); metallic accents for baby and Valentine (R07); foil used sparingly on holiday cards (R08).

- R14 [S] Etsy, Amazon and Hallmark listing roundups (search results, listing counts not sales): https://www.etsy.com/market/watercolor_birthday_cards (read 2026-10-11)
- R17 [S] Premium stationery: letterpress and gold foil cards (Sugar Paper, museum stores): https://www.belleandblush.com/collections/gold/products/sugar-paper-throw-some-sprinkles-on-it-card (read 2026-10-11)
- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R08 [V] Shutterfly: Top Christmas and holiday card trends (updated 2026-08-07): https://www.shutterfly.com/ideas/top-christmas-holiday-card-trends/ (read 2026-10-11)

## How it looks

- **Medium:** Dark-ground illustration with metallic gold-look linework (printed ink, not real foil)
- **Technique:** Gold-colored fine line and shapes on deep color, subtle sparkle
- **Line:** Fine metallic-look gold line
- **Palette:** Deep navy, plum, emerald, burgundy with warm gold and cream
- **Composition:** Centered ornament or wreath, symmetric frame, space for type
- **Mood:** Festive, luxurious, formal
- **Era:** Contemporary luxe

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Luxe 2D illustration, deep midnight navy or plum background with fine metallic gold-look linework and small gold shapes, gentle sparkle, centered symmetrical ornamental composition with a calm empty center, rich emerald and burgundy accents, delicate hand-drawn details - not photorealistic, no 3D render, no real text, printed-ink gold look only.
```

**Avoid list (negative prompt):**

- text in the picture
- photorealism
- 3D render
- glittery clutter
- brand logos
- cheap shiny gradients

## Palette

| Swatch | Hex |
|---|---|
| midnight navy | `#1B2240` |
| plum | `#5B2A4B` |
| gold | `#C9A24B` |
| emerald | `#2F5D4A` |
| cream | `#F3EADB` |

## Character consistency

Book rating **1 of 5**, card rating **5 of 5** (5 = holds characters best).

Ornament, no characters. Gold in an RGB render is a yellow-brown with highlights; real foil must be added by the printer.

**Sample render (2026-10-11):** Wreath with fine gold-look linework and an empty center, as wanted. The fox is tiny. This is a color imitation: real foil must come from the printer.

**Tips (what to attach and repeat):**

- Card-only
- Explain to customers that gold is shown as printed gold-look, with real foil as an upgrade if offered

## Photo reference handling

No people. If a pet or person is needed, a small gold line silhouette inside the frame.

## Card typography and layout

- **Display:** Playfair Display 600; Cormorant Garamond 600 italic
- **Body:** Figtree 400
- **Notes:** Cream or gold-tone text on dark; at least 18 pt and weight 500 on dark.
- **Layout:** Symmetric frame with empty center.
- **Text-safe zone:** Center 60 percent of the front is the type zone.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Dark backgrounds to the edge: bleed matters.
- **Ink coverage:** Very heavy (up to 300 percent); choose heavy stock and expect set-off risk.
- **Foil and spot colour:** REAL foil is a separate printer finish and is not shown in the picture. Do not promise it unless the printer SKU includes it.

## Best for / avoid for

**Best for**

- Weddings
- Christmas
- Anniversary
- Graduations

**Avoid for**

- Kids' books
- Funny cards
- Casual thank-you

## Retrieval

- **Tags:** foil, gold, luxe, metallic, elegant, navy, ornate, formal
- **Synonyms (customer words):** gold foil, fancy, premium, shiny, metallic, sparkly
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** Adult occasions.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#FBF6EE`, paper `#1B2240`, accent `#F5B83D` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/foil_luxe.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K (wreath scene). Good: gold-look line on midnight, calm empty center. Gold is printed ink only.
