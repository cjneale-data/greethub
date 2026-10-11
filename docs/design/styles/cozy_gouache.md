# Cozy Gouache Storybook

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `cozy_gouache` | **category** Cozy Storybook | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Rich, velvety painted scenes lit by a warm lamp. Detailed but never busy, like a favorite bedtime book.

**Why this one (shown to customers):** Warm, rich and a little magical, great for adventures and winter nights.

**Occasions:** christmas, adventure, bedtime, birthday, new_home, thank_you, fathers_day  
**Tones:** adventurous, tender  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Comfort, nostalgia and hope are the 2026 mood in children's books; 'storybook classic' is a competitor menu entry.

- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Opaque gouache with colored pencil details on warm paper
- **Technique:** Flat-to-velvety brush layers with visible strokes, soft glow around lights
- **Line:** No hard outlines; soft painted edges with darker color for definition
- **Palette:** Plum, amber, forest green, cream, deep teal night blue
- **Composition:** Layered foreground, middle and background; a light source in the scene; room for the eye to rest
- **Mood:** Cozy, warm, adventurous at bedtime
- **Era:** Mid-century picture book, updated

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Cozy 2D gouache storybook illustration, warm lamplit atmosphere, rich velvety colors in plum, amber, forest green and cream, visible brush texture on warm paper, detailed but uncluttered scenes, gentle depth with soft shadows, vintage picture book charm, characters with soft rounded proportions and friendly expressive faces - not photorealistic, no 3D render, no glossy digital gradients.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- neon
- harsh white light
- clutter
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| plum | `#5B2A4B` |
| lamp amber | `#E8A33D` |
| forest green | `#2F5D4A` |
| cream | `#F3EADB` |
| night blue | `#2A3F5F` |

## Character consistency

Book rating **4 of 5**, card rating **4 of 5** (5 = holds characters best).

Painted but opaque, so outfits and hair hold well. Rich scenes can tempt the model to add extra figures; restate exact counts.

**Sample render (2026-10-11):** Rich, believable gouache texture. It added an inset cream frame and rounded vignette, which would print as a white border; the FULL-BLEED line did not fully stop it, so keep the white-border QA check on. Warm and consistent character colors.

**Tips (what to attach and repeat):**

- Restate the exact character count every page
- Lock outfit colors that stay readable in low light
- Describe one light source
- Keep backgrounds layered but with calm text area

## Photo reference handling

Translate hair color, skin tone and glasses or beard into painted rounded characters, with warm lamplight on faces. Winter clothes help hide photo clothing; always replace the photo's clothes with the locked outfit.

## Card typography and layout

- **Display:** DM Serif Display; Caveat 600
- **Body:** Figtree 400
- **Notes:** A sturdy serif headline in cream on deep plum or navy sections, or dark cocoa on light. Message 17 to 19 pt.
- **Layout:** Scene fills the front; a lit window or lamp makes the focal point.
- **Text-safe zone:** A calm dark sky or snow band at the top 25 percent is the type zone.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Dark saturated backgrounds go to the edge: bleed matters, and a cut slightly off shows white.
- **Ink coverage:** Heavy (up to 260 percent) in night scenes: use uncoated stock slowly, allow drying time, avoid show-through on thin paper.
- **Foil and spot colour:** No foil; stars can be a spot gloss add-on only if the printer offers it.

## Best for / avoid for

**Best for**

- Christmas and winter cards
- Adventure and camping books
- New home cards
- Bedtime stories 4 to 8

**Avoid for**

- Quick laughs
- Bright summer fun
- Toddler board-book simplicity

## Retrieval

- **Tags:** gouache, cozy, storybook, lamplit, warm, winter, christmas, bedtime, painted, rich
- **Synonyms (customer words):** classic storybook, warm and rich, fireside, cabin, bedtime book, painted storybook
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** winnie the pooh, classic disney storybook

## Risks

- **IP:** Low. Do not describe specific bear, honey or hundred-acre features.
- **Uncanny valley:** Low.
- **Age appropriateness:** Fine for all ages; dark scenes should stay friendly for 0 to 3.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#FBF6EE`, paper `#5B2A4B`, accent `#F5B83D` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/cozy_gouache.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Good richness; the model drew a cream border (a vignette frame) despite the full-bleed line.
