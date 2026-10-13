# Bold Geometric

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `deco_geometric` | **category** Fancy & Fabulous | **status** stable | **products** card | **ages** 8-10

> Crisp shapes, arches and fans in rich colors. Modern, confident and a bit glamorous.

**Why this one (shown to customers):** Crisp, confident shapes, for people who like a little drama.

**Occasions:** wedding, anniversary, graduation, congratulations, birthday, new_home, christmas  
**Tones:** bold, elegant  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Bold geometrics (R06), abstract and geometric art (R07), and 'Neodeco' art deco geometry (R16) are named 2026 trends.

- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)
- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R16 [S] Pinterest Predicts 2026 coverage (Axios, PG Buzz): https://axios.com/2025/12/09/2026-pinterest-trend-report (read 2026-10-11)

## How it looks

- **Medium:** Digital vector with metallic-look accents and subtle paper grain
- **Technique:** Symmetric geometry, concentric arches and fans, color-blocking
- **Line:** Crisp thin lines in a contrast color
- **Palette:** Emerald, burgundy, mustard, midnight, cream, copper accent
- **Composition:** Symmetric, centered ornament, tight pattern, framing
- **Mood:** Glamorous, confident
- **Era:** Art deco revival

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Bold geometric art-deco-inspired illustration, symmetric concentric arches, fans and stripes, crisp thin copper-look lines on color-blocked fields of emerald, burgundy, mustard and midnight with cream, subtle paper grain, clean flat vector precision, optional simple centered motif such as a sun, wreath or monogram shape without letters - not photorealistic, no 3D render, no text.
```

**Avoid list (negative prompt):**

- text in the picture
- photorealism
- 3D render
- gradients
- busy realism
- logos

## Palette

| Swatch | Hex |
|---|---|
| emerald | `#1F6B57` |
| burgundy | `#7A1F3D` |
| mustard | `#E2A82E` |
| midnight | `#1B2240` |
| copper | `#B87333` |

## Character consistency

Book rating **1 of 5**, card rating **5 of 5** (5 = holds characters best).

Pattern, no characters. Models render symmetry well but may drift on exact arches; accept variation.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Card-only
- Name 3 colors
- Ask for a centered motif

## Photo reference handling

Not applicable. A pet or person becomes a flat silhouette inside a geometric frame.

## Card typography and layout

- **Display:** Poiret One or Josefin Sans 700 caps; DM Serif Display
- **Body:** Figtree 500
- **Notes:** Wide-spaced geometric caps, cream on dark.
- **Layout:** Symmetric motif; message below.
- **Text-safe zone:** Bottom 30 percent plain color for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Color-blocked fields to the edge.
- **Ink coverage:** High; deep emerald and burgundy shift in CMYK, proof.
- **Foil and spot colour:** Copper or gold foil on the lines is an upgrade; not simulated.

## Best for / avoid for

**Best for**

- Weddings and anniversary
- Graduation
- Modern holiday
- New home

**Avoid for**

- Babies
- Kids' books
- Sentimental portraits

## Retrieval

- **Tags:** art deco, geometric, arches, bold, pattern, emerald, burgundy, glam, symmetry
- **Synonyms (customer words):** gatsby, deco, geometric pattern, glam, modern shapes
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** Adult occasions.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#FBF6EE`, paper `#1B2240`, accent `#F5B83D` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/deco_geometric.jpg` (copied to `app/public/styles/`). Rendered 2026-10-13 at 1K (site-art-v1, best of 3). Sample of the style, not yet reviewed against a print proof.
