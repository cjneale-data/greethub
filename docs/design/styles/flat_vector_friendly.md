# Friendly Flat Graphic

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `flat_vector_friendly` | **category** Bold & Silly | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Clean modern shapes in a handful of cheerful colors. Simple, friendly and very clear.

**Why this one (shown to customers):** Clean and cheerful, easy to read for little eyes.

**Occasions:** birthday, new_baby, congratulations, thank_you, back_to_school, just_because, new_home  
**Tones:** silly, bold, tender  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **high**. Flat vector and minimalist looks suit toddlers (R05); bold and colorful is a top 2026 card shift (R08).

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R08 [V] Shutterfly: Top Christmas and holiday card trends (updated 2026-08-07): https://www.shutterfly.com/ideas/top-christmas-holiday-card-trends/ (read 2026-10-11)
- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)

## How it looks

- **Medium:** Digital vector-style shapes with subtle paper-grain texture
- **Technique:** Shapes only, no outlines or very thin ones, a limited palette of 5 to 6 colors, small details as cut-out shapes
- **Line:** Minimal or absent; shape edges define forms
- **Palette:** Cheerful limited: tomato, sunshine, sky, grass green, cream, navy
- **Composition:** Centered, clear silhouette, big color blocks, simple props
- **Mood:** Cheerful, calm, modern
- **Era:** Contemporary

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Modern flat vector-style children's illustration, bold clean geometric shapes with no outlines, limited vivid palette of 5 colors, gentle paper grain texture, cheerful and graphic, simple round-headed characters with dot eyes and small smiles, minimal backgrounds of large color blocks - not photorealistic, no 3D render, no gradients, no shading.
```

**Avoid list (negative prompt):**

- gradients
- shading
- outlines
- photorealism
- 3D render
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| tomato | `#EE5A36` |
| sunshine | `#F5B83D` |
| sky | `#7CC2E3` |
| grass | `#5BAE6B` |
| navy | `#1F2F4D` |

## Character consistency

Book rating **5 of 5**, card rating **5 of 5** (5 = holds characters best).

Strongest consistency of all: very simple shapes. The cost is less individual likeness.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Name hair shape and color plus one clothing color
- Use the same head shape for all kids and vary hair/glasses
- Keep likeness features few and bold

## Photo reference handling

Convert to an icon-like character: hair shape and color, skin tone as a flat color, one face-defining feature (glasses, freckles). Do not attempt a detailed likeness.

## Card typography and layout

- **Display:** Baloo 2 ExtraBold; Fredoka 600
- **Body:** Figtree 600
- **Notes:** Rounded sans in navy on cream or white on color; good for big numbers (age 5!).
- **Layout:** Big simple object or animal, color block background, lots of negative space.
- **Text-safe zone:** Reserve one full color block (about 30 percent) for message or age number.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Flat color to the edge; rich tints print well.
- **Ink coverage:** Low to medium, very efficient.
- **Foil and spot colour:** Pantone-like bright orange or green spot inks are an upgrade; not simulated.

## Best for / avoid for

**Best for**

- Baby books ages 0 to 3
- Age-number birthday cards
- Congratulations
- Back-to-school

**Avoid for**

- Strong likeness requests
- Emotional, tender portraits
- Realistic requests

## Retrieval

- **Tags:** flat, vector, geometric, simple, clean, modern, minimal shapes, friendly, toddler
- **Synonyms (customer words):** simple shapes, clean and modern, like a toddler book, board book, graphic
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** peppa pig, bluey, cocomelon, hello kitty, kawaii

## Risks

- **IP:** Medium. Flat children's TV characters are very recognisable; avoid pink pig or blue dog palettes.
- **Uncanny valley:** None.
- **Age appropriateness:** Best 0 to 7.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/flat_vector_friendly.jpg` (copied to `app/public/styles/`). Rendered 2026-10-13 at 1K (site-art-v1, best of 3). Sample of the style, not yet reviewed against a print proof.
