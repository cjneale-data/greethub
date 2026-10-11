# Wonky Ink Cartoon

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `wonky_ink_cartoon` | **category** Sketchy & Homemade | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Scratchy ink drawing with bendy shapes and bright patches of color. Goofy and a bit wild.

**Why this one (shown to customers):** Goofy, bendy and wild, for the funniest cards and books.

**Occasions:** birthday, fathers_day, get_well, congratulations, just_because, retirement  
**Tones:** silly, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Humor and punny cartoon animals lead card sales (R13, R14); whimsical bright cartoon is common in picture books (R05).

- R13 [S] Moonpig US: hottest birthday cards 2026 (search result, retailer self-promo): https://www.moonpig.com/us/blog/gifts-and-wishes/hottest-birthday-cards-usa-2026/ (read 2026-10-11)
- R14 [S] Etsy, Amazon and Hallmark listing roundups (search results, listing counts not sales): https://www.etsy.com/market/watercolor_birthday_cards (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Dip-pen and brush-pen ink with flat watercolor and marker color patches
- **Technique:** Scratchy line, shapes drawn slightly crooked on purpose, color patches offset from the line
- **Line:** Spiky, loose, thin-to-thick ink line
- **Palette:** Bright inconsistent: mango, pink, aqua, lime, with white paper
- **Composition:** Asymmetric, bendy silhouettes, silly props, scribbled patterns
- **Mood:** Goofy, cheeky, chaotic
- **Era:** Contemporary

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Wonky scratchy ink cartoon illustration, loose spiky pen line with slightly crooked shapes drawn on purpose, bright flat patches of color offset from the line, mango, pink, aqua and lime on white paper, characters with bendy bodies, big noses and silly expressions, playful scribbled patterns and goofy props - not photorealistic, no 3D render, no gradients, no neat vector perfection.
```

**Avoid list (negative prompt):**

- neat vector lines
- photorealism
- 3D render
- gradients
- text in the picture
- characters that match any known book

## Palette

| Swatch | Hex |
|---|---|
| mango | `#FF9F1C` |
| silly pink | `#F25CA2` |
| aqua | `#2EC4B6` |
| lime | `#A3D940` |
| scratch ink | `#222222` |

## Character consistency

Book rating **3 of 5**, card rating **5 of 5** (5 = holds characters best).

Messiness hides drift in faces; but characters can morph into each other in busy scenes.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Give each character an exaggerated nose or hair
- Limit to two characters per page
- Restate outfit color patches

## Photo reference handling

Caricature with exaggerated hair, nose and smile, always affectionate. Bendy limbs; flat color patches for skin.

## Card typography and layout

- **Display:** Gochi Hand; Caveat Brush; Bangers
- **Body:** Figtree 600
- **Notes:** Marker-style display text; keep to a short punchline.
- **Layout:** Off-center subject with doodled props.
- **Text-safe zone:** A white paper area (top or bottom 30 percent) for the added headline.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** White paper background: extend line art only to the trim, not the bleed.
- **Ink coverage:** Low to medium.
- **Foil and spot colour:** None.

## Best for / avoid for

**Best for**

- Funny birthdays
- Retirement jokes
- Get well with humor
- Books for ages 4 to 8 who like silly

**Avoid for**

- Tender moments
- Sympathy
- Anything formal

## Retrieval

- **Tags:** wonky, ink, scratchy, goofy, silly, crazy, bendy, zany, funny, doodle
- **Synonyms (customer words):** zany, whacky, wild, silly and crazy, kooky, nonsense
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** dr seuss, seussian, dr. seuss, cat in the hat, grinch style

## Risks

- **IP:** High if asked for rhyme, striped hats or fuzzy creatures; keep original characters and avoid named props.
- **Uncanny valley:** None.
- **Age appropriateness:** 4 to 10.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
