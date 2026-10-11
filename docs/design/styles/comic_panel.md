# Comic Strip

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `comic_panel` | **category** Bold & Silly | **status** stable | **products** book, card | **ages** 8-10

> Inked comic art with halftone dots and action poses. Fast, funny and a little cool.

**Why this one (shown to customers):** Action-packed and cheeky, for kids who read comics.

**Occasions:** birthday, graduation, adventure, get_well, congratulations, just_because  
**Tones:** adventurous, silly, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Line drawing and graphic-novel looks suit ages 7-12 (R05); a 'comic' style is on competitor menus (R09).

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)

## How it looks

- **Medium:** Digital ink and flat color with halftone shading
- **Technique:** Dynamic black ink, cel-shaded color, halftone dot shadows, speed lines
- **Line:** Variable-weight black ink line
- **Palette:** Primary-leaning: red, yellow, blue plus black and cream
- **Composition:** Single dramatic panel per page, strong diagonals, action pose
- **Mood:** Energetic, cheeky, heroic
- **Era:** Contemporary comic

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Inked 2D comic-book illustration, dynamic variable-weight black ink linework, flat cel-shaded colors with halftone dot shading, red, yellow, blue and cream palette, energetic action poses and speed lines, expressive cartoon faces, bold simple backgrounds, single-panel composition without any speech bubbles or text - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- speech bubbles
- sound effect lettering
- text in the picture
- photorealism
- 3D render
- costumes resembling any known hero

## Palette

| Swatch | Hex |
|---|---|
| action red | `#D7263D` |
| comic yellow | `#F9C80E` |
| ink blue | `#2E5EAA` |
| cream | `#FBF6EE` |
| ink black | `#141414` |

## Character consistency

Book rating **4 of 5**, card rating **4 of 5** (5 = holds characters best).

Outlines and flat colors help, but dynamic poses and cropping vary faces. Caution with capes and masks which push toward known heroes.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Keep costumes plain and original
- Restate outfit colors
- Ask for one action pose per page
- Attach the model sheet first

## Photo reference handling

Turn the person into a confident cartoon hero with the photo's hair and glasses, strong jaw/cheek lines, no costume unless the customer designs one.

## Card typography and layout

- **Display:** Bangers or Luckiest Guy (display); Figtree 700
- **Body:** Figtree 500
- **Notes:** Display caps for the front (added by us, not drawn). Keep the inside message readable in plain sans.
- **Layout:** Diagonal composition with burst shape behind the subject.
- **Text-safe zone:** A clear burst or banner shape in the top third for added text.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Halftone dots can moire when scaled; supply at final size.
- **Ink coverage:** Medium to high; saturated red and yellow need a proof.
- **Foil and spot colour:** Spot gloss on the burst is a nice upgrade.

## Best for / avoid for

**Best for**

- Ages 8 to 10 adventure books
- Gaming and sports birthdays
- Graduation jokes

**Avoid for**

- Toddlers
- Tender portraits
- Sympathy

## Retrieval

- **Tags:** comic, graphic novel, superhero, action, halftone, ink, panel, manga-free
- **Synonyms (customer words):** comic book, graphic novel, action cartoon, superhero style, cool comic
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** marvel, marvel comic, dc comics, superhero movie, spiderman style

## Risks

- **IP:** High if costumes or capes are specified. Keep original, plain costumes; no masks with spiders, bats or stars.
- **Uncanny valley:** Low.
- **Age appropriateness:** 8 to 10 best; violence stays cartoon-only.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
