# Block Print

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `block_print` | **category** Retro & Graphic | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Carved-and-stamped look: bold shapes, a bit of rough ink, two or three colors.

**Why this one (shown to customers):** Earthy and handmade, with a folk-art feel.

**Occasions:** christmas, thank_you, anniversary, wedding, adventure, just_because, new_home  
**Tones:** elegant, adventurous, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Linocut or woodblock is named for folk tales (R05); earthy palettes are a 2026 card trend (R06). No sales evidence found.

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)

## How it looks

- **Medium:** Linocut or woodblock print with hand-inked relief
- **Technique:** Carved line, flat ink areas with rough edges and tiny speckles, 2 or 3 color layers offset slightly
- **Line:** Thick carved white lines inside dark shapes
- **Palette:** Forest green, terracotta, mustard, indigo, cream
- **Composition:** Bold scenes that fill the picture to every edge, symmetrical or patterned, folk motifs
- **Mood:** Earthy, warm, folk-tale
- **Era:** Timeless folk print

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Hand-carved linocut block print illustration, bold flat ink shapes with carved white lines and rough ink speckle, two or three offset color layers, limited earthy palette of forest green, terracotta, mustard and indigo on cream paper, folk-art motifs, characters with simple carved faces and strong silhouettes, bold composition that fills the picture to every edge - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- gradients
- photorealism
- 3D render
- fine detail
- text in the picture
- bright neon

## Palette

| Swatch | Hex |
|---|---|
| forest green | `#2F5D4A` |
| terracotta | `#C4623A` |
| mustard | `#D9A32B` |
| indigo | `#2C3E6B` |
| cream | `#F3EADB` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Carved faces are simplified and repeatable but the model changes carving detail; likeness is weak.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Lock 3 colors
- State 'carved white line' for hair and details
- Keep one character per scene

## Photo reference handling

Turn the person into a bold carved silhouette: hair shape, glasses, beard; skin as cream paper left unprinted.

## Card typography and layout

- **Display:** Alfa Slab One; DM Serif Display
- **Body:** Figtree 500
- **Notes:** Slab or serif in dark green or indigo for a printed folk look.
- **Layout:** Framed panel with a central motif, border pattern.
- **Text-safe zone:** Leave the inner frame band or the lower 30 percent blank for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** If a border frame is used, keep it inside the safe area; bleed the paper color only.
- **Ink coverage:** Low to medium: ideal for two-color printing.
- **Foil and spot colour:** Real letterpress is a premium option and matches this look; the picture only imitates it.

## Best for / avoid for

**Best for**

- Christmas and winter
- Thank-you cards
- Folk-tale style books
- Anniversary (earthy)

**Avoid for**

- Babies
- Likeness-driven gifts
- Humor with big expressions

## Retrieval

- **Tags:** linocut, block print, woodcut, folk art, carved, print, stamp, earthy
- **Synonyms (customer words):** woodblock, stamp style, printmaking, folk print, carved
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** 4 and up.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#C8441F` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
