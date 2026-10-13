# Soft Watercolor

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `watercolor_wash` | **category** Soft & Watery | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Gentle, wet-on-paper color with soft edges and a little white showing through, like a classic picture book.

**Why this one (shown to customers):** Warm and gentle, the safe choice when the feeling matters more than the joke.

**Occasions:** birthday, new_baby, mothers_day, get_well, thank_you, just_because, bedtime, sympathy  
**Tones:** tender, adventurous  
**Older ids that resolve here:** `watercolor`, `soft_watercolor`

## Popularity evidence

Rating: **high**. Named as the nostalgic default for ages 3-6, still popular for Mother's Day, strong on Etsy, and on every AI-book style menu we found.

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)
- R14 [S] Etsy, Amazon and Hallmark listing roundups (search results, listing counts not sales): https://www.etsy.com/market/watercolor_birthday_cards (read 2026-10-11)

## How it looks

- **Medium:** Transparent watercolor with touches of gouache on cold-press paper
- **Technique:** Wet-on-wet washes, a few dry-brush edges, paper white left as highlight
- **Line:** Thin, soft pencil-and-ink outlines that fade in places
- **Palette:** Muted warm: peach, cream, sage, dusty blue, a single deeper accent
- **Composition:** Centered subject, generous calm background, color carried softly to every edge (no white vignette)
- **Mood:** Tender, calm, nostalgic
- **Era:** Classic 20th-century picture book, refreshed

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Soft 2D watercolor and gouache illustration, classic children's picture book style, gentle hand-drawn ink outlines, warm natural light, visible cold-press paper grain, rounded friendly shapes, muted warm palette with peach, cream and sage, soft diffuse lighting, simple softly washed backgrounds, characters with soft round proportions and oversized expressive eyes - not photorealistic, no realistic skin texture, no sharp photographic shadows, no 3D render.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- hard black outlines
- neon colors
- text or letters in the picture
- glossy airbrushed skin

## Palette

| Swatch | Hex |
|---|---|
| blush peach | `#F6C9C0` |
| paper cream | `#FBF6EE` |
| sage | `#B7C9A8` |
| dusty blue | `#9DB4C8` |
| deep persimmon accent | `#C8441F` |

## Character consistency

Book rating **3 of 5**, card rating **5 of 5** (5 = holds characters best).

Models hold hair color and outfit colors well but drift on face shape, because loose washes invite re-interpretation each page.

**Sample render (2026-10-11):** Good, but it reads closer to wash-over-pencil than wet-on-wet watercolor: edges are cleaner than a real painting. Faces stay friendly; the child's outfit lost the raincoat's yellow saturation (drifted to pale mustard), which is the colour drift to expect across pages.

**Tips (what to attach and repeat):**

- Attach the approved model sheet first on every page
- Repeat each character's locked outfit colors verbatim
- Keep one outfit and one hair color per person; avoid patterns
- Re-roll one page, not the book, when a face drifts

## Photo reference handling

Reduce each person to 3 anchors from the photo (hair color and shape, one face trait, skin tone) and redraw as rounded watercolor figures with simple dot or soft eyes. Never trace the photo; ignore the clothing in it and use the locked outfit.

## Card typography and layout

- **Display:** Fraunces 600 (soft serif); Caveat 600 (handwritten accent)
- **Body:** Figtree 400
- **Notes:** A soft serif headline with a handwritten sign-off reads warm. Keep the message at 17 to 20 pt in cocoa, never pure black.
- **Layout:** Subject in the middle 60 percent; the washes fade toward the edges so the card never looks boxed in.
- **Text-safe zone:** Keep the bottom 25 percent of the front calm for an optional caption; the inside message page is plain paper with a faint wash corner.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Washes that fade to paper white need a printed tint to the edge: tell the model FULL-BLEED, or the trim will show a pale rim.
- **Ink coverage:** Light coverage (under 160 percent). Dries fast, low risk of show-through on 100 lb stock.
- **Foil and spot colour:** No foil. A gold-look accent is possible only as printed ink.

## Best for / avoid for

**Best for**

- New baby and baby showers
- Mother's Day and grandparent cards
- Bedtime and gentle first books
- Get well and thinking-of-you

**Avoid for**

- Big laughs and loud humor
- Dad's birthday jokes
- Ages 8 to 10 adventure with fast action

## Retrieval

- **Tags:** watercolor, soft, watery, gentle, pastel, dreamy, nursery, baby, grandma, storybook
- **Synonyms (customer words):** soft and watery, painted, wet paint, light and airy, delicate, baby shower, nursery art, pretty and soft
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low. Classic watercolor is a medium, not a brand. Do not add rabbits in blue jackets or bears in red shirts by name.
- **Uncanny valley:** Low.
- **Age appropriateness:** Suits every age band.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#C8441F` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/watercolor_wash.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Good: soft washes and paper grain, gentle faces.
