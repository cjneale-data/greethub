# Bold Cartoon Pop

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `bold_cartoon_pop` | **category** Bold & Silly | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Thick outlines, bright flat color and big expressions. Built to get a laugh.

**Why this one (shown to customers):** Loud, bright and funny, the best choice for birthdays and jokes.

**Occasions:** birthday, fathers_day, congratulations, get_well, graduation, new_home, thank_you, just_because  
**Tones:** silly, bold  
**Older ids that resolve here:** `bold_flat`, `bold_pop`

## Popularity evidence

Rating: **high**. Bright polished cartoon is the North American default for ages 3-6; bold and colorful is one of the biggest 2026 card shifts; humor leads card sales.

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R08 [V] Shutterfly: Top Christmas and holiday card trends (updated 2026-08-07): https://www.shutterfly.com/ideas/top-christmas-holiday-card-trends/ (read 2026-10-11)
- R13 [S] Moonpig US: hottest birthday cards 2026 (search result, retailer self-promo): https://www.moonpig.com/us/blog/gifts-and-wishes/hottest-birthday-cards-usa-2026/ (read 2026-10-11)
- R14 [S] Etsy, Amazon and Hallmark listing roundups (search results, listing counts not sales): https://www.etsy.com/market/watercolor_birthday_cards (read 2026-10-11)

## How it looks

- **Medium:** Digital ink and flat color with light print texture
- **Technique:** Clean thick outlines, flat saturated fills, one simple shadow shape
- **Line:** Thick, even, rounded outline in near-black or deep brown
- **Palette:** Coral, sunny yellow, teal, tomato, deep blue
- **Composition:** Strong silhouette, big shapes, simple graphic backgrounds, diagonals for energy
- **Mood:** Silly, loud, cheerful
- **Era:** Contemporary cartoon

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Bold 2D cartoon illustration, clean thick outlines, flat saturated colors, playful exaggerated proportions, lively exaggerated expressions, simple graphic backgrounds, bright palette with coral, sunny yellow and teal, lightly textured print feel, characters with big heads, simple limbs and expressive faces - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- soft gradients
- muted colors
- text in the picture
- tiny details

## Palette

| Swatch | Hex |
|---|---|
| coral | `#FF6B57` |
| sunny yellow | `#FFD23F` |
| teal | `#1FB5A8` |
| ink brown | `#2B1E18` |
| deep blue | `#3A5BA9` |

## Character consistency

Book rating **5 of 5**, card rating **5 of 5** (5 = holds characters best).

The most dependable style for holding characters across pages: simple shapes, thick outline, flat color.

**Sample render (2026-10-11):** Best result of the set. Crisp outline and flat fills; both characters clearly distinct and on-style. Slight tendency to add a soft cloud gradient-free sky only.

**Tips (what to attach and repeat):**

- Keep the model sheet and outfit color restate
- Give each character one signature shape (hair, glasses, hat)
- Exaggerate rather than refine faces
- Reuse the same background color per scene

## Photo reference handling

Caricature gently: exaggerate the one or two most recognisable features (hair volume, glasses, smile), enlarge the head, simplify the body, flat skin tone, always friendly never mocking.

## Card typography and layout

- **Display:** Lilita One or Baloo 2 ExtraBold; Chewy (already embedded in the pipeline)
- **Body:** Figtree 600
- **Notes:** Chunky rounded display in white or cocoa on saturated flats; punchy 2 to 4 word headline.
- **Layout:** Subject large, one joke visible at a glance, color field behind.
- **Text-safe zone:** Hold the top 25 percent as a flat color band for a headline.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Saturated flats to the edge need full-bleed, and prefer rounded safe margins.
- **Ink coverage:** Medium to high; vivid corals and teals fall outside CMYK and print duller: proof them.
- **Foil and spot colour:** A spot gloss on the headline or foil confetti is a nice add-on, not simulated.

## Best for / avoid for

**Best for**

- Funny birthdays and Father's Day
- Get well with a joke
- Graduation and congratulations
- Kids ages 4 to 10

**Avoid for**

- Sympathy
- Weddings
- Formal thanks

## Retrieval

- **Tags:** cartoon, bold, funny, silly, bright, thick lines, pop, comic, playful, flat color
- **Synonyms (customer words):** goofy, cartoony, loud and fun, kids cartoon, colorful cartoon, funny
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** the simpsons, simpsons style, cartoon network, nickelodeon

## Risks

- **IP:** Medium. Cartoon conventions overlap with famous shows; avoid yellow-skinned or specific hair-and-outfit signatures.
- **Uncanny valley:** Low.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FFD23F`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/bold_cartoon_pop.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K (child and fox in a meadow). Excellent: thick outline, flat color, expressive faces, exactly two characters, no text.
