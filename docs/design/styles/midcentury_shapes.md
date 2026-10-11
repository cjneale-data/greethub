# Mid-Century Shapes

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `midcentury_shapes` | **category** Retro & Graphic | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Big geometric shapes and a few strong colors, like a 1960s travel poster for kids.

**Why this one (shown to customers):** Stylish and graphic, the grown-up-cool pick that still works for kids.

**Occasions:** birthday, fathers_day, anniversary, new_home, graduation, thank_you, just_because  
**Tones:** bold, elegant, silly  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Bold geometrics are a named 2026 card trend (R06); mid-century picture-book feel appears in art-minded parent segments (R05).

- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R15 [S] Adobe Express design trends 2026 and Creative Market trends (search): https://www.adobe.com/express/learn/blog/design-trends-2026 (read 2026-10-11)

## How it looks

- **Medium:** Digital screen-print look with gouache texture
- **Technique:** Geometric shape construction, overprint where colors overlap, grain texture
- **Line:** No outlines; occasional thin white line details
- **Palette:** Burnt orange, teal, mustard, cream, deep brown
- **Composition:** Strong geometric silhouettes, asymmetry, big negative space
- **Mood:** Stylish, confident, playful
- **Era:** 1950s to 1960s graphic design

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Mid-century modern graphic illustration, bold geometric shapes with overprint where colors overlap, gouache and screen-print grain texture, limited palette of burnt orange, teal, mustard, cream and deep brown, no outlines, characters built from simple shapes with small dot eyes, flat 2D composition with large negative space - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- gradients
- outlines
- photorealism
- 3D render
- busy detail
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| burnt orange | `#C8581E` |
| teal | `#1F7F86` |
| mustard | `#E2A82E` |
| cream | `#F3EADB` |
| deep brown | `#4A2F22` |

## Character consistency

Book rating **4 of 5**, card rating **5 of 5** (5 = holds characters best).

Simple shapes are repeatable; likeness is stylized. Models sometimes over-ornament with patterns.

**Sample render (2026-10-11):** Lands well. Palette drifted a little cooler (teal pond added) but stays in the five-color range. Simple shapes should repeat well across pages.

**Tips (what to attach and repeat):**

- Specify head shape (circle) and body shape per character
- Restate the 5-color palette
- Ban patterns on clothing

## Photo reference handling

Reduce to geometry: hair as a bold shape in the photo's color, skin tone as a flat tone, glasses as circles. Likeness is carried by silhouette, not face.

## Card typography and layout

- **Display:** Josefin Sans 700 caps; DM Serif Display
- **Body:** Figtree 500
- **Notes:** Geometric sans in cream on burnt orange or cocoa on cream; wide letter-spacing for headlines.
- **Layout:** Asymmetric: subject off-center, large color field, small details.
- **Text-safe zone:** Large flat color field takes the type; keep 30 percent clear.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Color fields to the edge; overprint may look muddy in CMYK, proof.
- **Ink coverage:** Medium; works beautifully on uncoated stock.
- **Foil and spot colour:** Pantone orange or metallic bronze ink is an upgrade; not simulated.

## Best for / avoid for

**Best for**

- Father's Day
- Housewarming
- Modern birthdays
- Ages 4 to 8 books with a design-y parent

**Avoid for**

- Soft baby cards
- Detailed likeness
- Elegant weddings

## Retrieval

- **Tags:** mid-century, geometric, retro, shapes, graphic, poster, screenprint, modern
- **Synonyms (customer words):** 60s style, retro modern, scandinavian, poster style, geometric
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#F3EADB`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/midcentury_shapes.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Good: geometric shapes, limited palette, big negative space.
