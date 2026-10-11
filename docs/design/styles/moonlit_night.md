# Moonlit Night

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `moonlit_night` | **category** Cozy Storybook | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Deep blue nights, soft moonlight and tiny glowing details. Hushed and sleepy.

**Why this one (shown to customers):** Hushed and glowy, a gentle way to say goodnight.

**Occasions:** bedtime, new_baby, birthday, christmas, sympathy, just_because  
**Tones:** tender, adventurous  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Comfort and hope themes (R04) support night-time books; no dedicated sales evidence found for this look specifically.

- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)

## How it looks

- **Medium:** Gouache and soft acrylic glaze, a little digital glow
- **Technique:** Dark blue layered glazes, bright small lights, soft halos
- **Line:** Soft edges, no outlines
- **Palette:** Navy, indigo, moonlight cream, warm lantern yellow, small blush
- **Composition:** Small bright subject in a large dark field, one light source
- **Mood:** Hushed, safe, wondering
- **Era:** Contemporary bedtime book

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Moonlit 2D gouache and soft acrylic glaze storybook illustration, deep navy and indigo night with soft cream moonlight and a warm lantern-yellow glow, gentle halos around lights, visible soft brush texture, no outlines with edges formed by light and color, rounded friendly characters with softly lit faces, simple uncluttered night scenery - not photorealistic, no 3D render, not scary.
```

**Avoid list (negative prompt):**

- scary shadows
- pitch black areas
- photorealism
- 3D render
- neon
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| navy night | `#1F2A4D` |
| indigo | `#3E4A86` |
| moon cream | `#F4E8C8` |
| lantern yellow | `#F2C14E` |
| blush glow | `#E7A9A0` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Dark palettes hide outfit differences; characters can merge. Faces lit unevenly across pages.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Pick outfit colors that glow against navy (cream, yellow, coral)
- Restate lit face and hair color
- Keep one light source consistent
- Avoid more than 3 characters per scene

## Photo reference handling

Keep hair and skin tone true but lit warmly from one side. Choose pajamas or coats in light colors so characters separate from the night.

## Card typography and layout

- **Display:** Fraunces 600; Caveat 600
- **Body:** Figtree 500
- **Notes:** Cream text on navy needs weight 500 minimum and 18 pt or larger inside print areas.
- **Layout:** Moon or window as the focal point at upper third.
- **Text-safe zone:** Dark sky areas serve as the type zone; add headlines in cream.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Deep blue to the edge: request 'full-bleed' and check for white slivers at the trim.
- **Ink coverage:** Very heavy (up to 280 percent): choose uncoated and allow drying; consider a lighter navy to avoid ink set-off.
- **Foil and spot colour:** Silver or gold foil stars are a premium add-on, not simulated in the picture.

## Best for / avoid for

**Best for**

- Goodnight and bedtime books
- New baby
- Sympathy (gentle)
- Christmas Eve

**Avoid for**

- Daytime action
- Humor
- Tiny details on dark clothes

## Retrieval

- **Tags:** night, moon, stars, bedtime, sleepy, navy, lantern, goodnight
- **Synonyms (customer words):** goodnight, starry night, moon and stars, dark blue, sleep book
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** Low.
- **Age appropriateness:** Keep shadows friendly for 0 to 3.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#FBF6EE`, paper `#5B2A4B`, accent `#F5B83D` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
