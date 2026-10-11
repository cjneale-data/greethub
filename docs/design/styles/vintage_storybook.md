# Vintage Storybook

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `vintage_storybook` | **category** Cozy Storybook | **status** stable | **products** book, card | **ages** 0-3, 4-7

> A mid-century look: a few flat colors printed slightly off the line, friendly animals and kids, a printed-in-1955 charm.

**Why this one (shown to customers):** Nostalgic and charming, like a book from grandma's shelf.

**Occasions:** birthday, thank_you, christmas, mothers_day, fathers_day, just_because, new_baby  
**Tones:** tender, silly  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Reinvented heritage and classic looks are rising (R04); several evergreen bestsellers share a vintage printed look (unverified, R19).

- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)
- R19 [U] Design head's own knowledge of how top-selling picture books look (unverified): docs/design/00-research-notes.md (read 2026-10-11)

## How it looks

- **Medium:** Limited-color screen-print look: gouache and ink, 3 to 5 flat colors
- **Technique:** Flat color blocks slightly misregistered from a brown or black ink line; subtle halftone speckle
- **Line:** Brush-ink outline in dark brown, uneven thickness
- **Palette:** Cream paper, tomato red, mustard, teal, soft brown
- **Composition:** Single clear scene, bold readable silhouettes, plenty of flat background
- **Mood:** Nostalgic, warm, gently funny
- **Era:** 1950s to 1960s picture books

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Vintage 1950s-style picture book illustration, limited palette of 4 or 5 flat colors printed slightly off the brown ink brush outline, subtle halftone speckle and cream paper grain, tomato red, mustard, teal and soft brown, simple rounded characters with dot eyes and friendly faces, flat clean backgrounds with a few playful details - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- gradients
- photorealism
- 3D render
- glossy highlights
- more than 5 colors
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| cream paper | `#F3EADB` |
| tomato | `#D9482B` |
| mustard | `#E0A526` |
| teal | `#2E7F86` |
| brown ink | `#5A3E2E` |

## Character consistency

Book rating **4 of 5**, card rating **4 of 5** (5 = holds characters best).

Flat colors and a strong ink line help models repeat characters. Misregistration is applied randomly, which can read as inconsistency but is part of the look.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Lock 3 colors per character
- Say 'dot eyes' once and keep it
- Restate the brown outline color
- Keep scenes to two or three objects

## Photo reference handling

Reduce the person to a bold silhouette: hair shape and color, glasses, a distinctive hat. Eyes as dots, skin as a flat warm tone. No texture from the photo.

## Card typography and layout

- **Display:** Rozha One or Abril Fatface (display); Patrick Hand
- **Body:** Figtree 400
- **Notes:** Chunky display type with a hand-drawn sub line fits the printed-in-1955 feel. Use two colors max.
- **Layout:** One bold subject, flat background, a banner shape for the message.
- **Text-safe zone:** Reserve a flat color panel in the lower third for an optional caption.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Flat color panels to the edge; make sure the model fills the bleed, not cream.
- **Ink coverage:** Low to medium. Uncoated stock reproduces the printed look well.
- **Foil and spot colour:** A single metallic ink as the 'fifth color' is an option but is not simulated.

## Best for / avoid for

**Best for**

- Birthday and thank-you cards with retro charm
- Books ages 3 to 7
- Grandparent gifts
- Dad's cards

**Avoid for**

- High-realism requests
- Scenes with many characters
- Modern tech themes

## Retrieval

- **Tags:** vintage, retro, storybook, 1950s, nostalgic, classic, flat, limited color, halftone
- **Synonyms (customer words):** old-fashioned, like grandma's books, classic kids book, oldschool, heritage
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** goodnight moon, little golden books, winnie the pooh classic

## Risks

- **IP:** Low to medium. Heritage look is adjacent to famous vintage titles; no named animals or outfits.
- **Uncanny valley:** Low.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#C8441F` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
