# Storybook Anime

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `anime_inspired` | **category** Big-Screen Bright | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Hand-painted animation-style look: big expressive eyes, glowing skies and detailed painted backgrounds.

**Why this one (shown to customers):** Big-eyed and dreamy with painted skies, like a hand-drawn animated film.

**Occasions:** birthday, adventure, graduation, valentines, get_well, just_because  
**Tones:** adventurous, tender, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **high**. Big-eyed, emotion-led character design is named a major 2026 influence (R04); an anime option is on the leading AI-book menu (R09).

- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)

## How it looks

- **Medium:** Hand-painted 2D animation cel and painted background look
- **Technique:** Clean thin line, cel-shaded color, soft airbrushed skies, detailed painted nature
- **Line:** Thin precise colored lineart
- **Palette:** Fresh: sky blue, leaf green, warm skin tones, sunset pink
- **Composition:** Wide painted backgrounds, small characters in big landscapes, wind and light
- **Mood:** Dreamy, earnest, adventurous
- **Era:** Contemporary 2D animation

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Hand-painted 2D animation-style illustration, thin clean colored lineart with flat cel-shaded color and one soft shadow tone, very large glossy eyes with bright highlights and simplified small noses and mouths, light smooth hair strands with highlights, soft detailed painted backgrounds with luminous skies and clouds, fresh palette of sky blue, leaf green, warm skin tones and sunset pink, gentle wind and light, serene storybook mood - not photorealistic, no 3D render, not a copy of any existing animated film.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- sexualized proportions
- characters resembling any known film
- text in the picture
- chibi extremes

## Palette

| Swatch | Hex |
|---|---|
| sky blue | `#8EC9EA` |
| leaf green | `#6DB36B` |
| warm skin | `#F4C6A8` |
| sunset pink | `#F28FA3` |
| ink navy | `#2F3E5B` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Models hold this look very well: consistent eye and hair language. Risk is drifting to generic anime tropes and older proportions.

**Sample render (2026-10-11):** Did not land: no large glossy eyes, no cel-shaded linework, so it looks like a soft digital storybook. The painted sky is good. The style string was strengthened afterwards (large glossy eyes, thin colored lineart, cel shading) but that revision was NOT re-rendered because the budget was spent.

**Tips (what to attach and repeat):**

- State age cue (child proportions) explicitly
- Lock hair color and eye color
- Keep clothing everyday and plain

## Photo reference handling

Translate with large eyes in the photo's eye color, hair as a few clean shapes, and age-appropriate child proportions; keep faces modest and friendly.

## Card typography and layout

- **Display:** Baloo 2 ExtraBold; Kalam 700
- **Body:** Figtree 500
- **Notes:** Soft rounded sans; white on sky areas with a faint cocoa shadow.
- **Layout:** Small figure in a big painted landscape; sky takes the top half.
- **Text-safe zone:** Open sky occupies the top 35 percent for added type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Sky gradients to the edge: banding check.
- **Ink coverage:** Medium to high; bright pinks and blues can shift.
- **Foil and spot colour:** None.

## Best for / avoid for

**Best for**

- Adventure books for ages 6 to 10
- Graduation
- Birthdays for anime fans
- Landscape-heavy scenes

**Avoid for**

- Toddlers
- Humor with chaos
- Elegant weddings

## Retrieval

- **Tags:** anime, manga, japanese animation, big eyes, painted sky, animated, 2d animated
- **Synonyms (customer words):** anime style, anime-looking, japanese cartoon, manga, animation cel
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** anime, studio ghibli, ghibli, ghibli-like, studio ghibli-like, like studio ghibli, miyazaki, my neighbor totoro, pokemon, naruto

## Risks

- **IP:** High. Customers ask by studio name; never include the name. Avoid forest spirits, soot creatures, cat buses and signature costumes.
- **Uncanny valley:** Low.
- **Age appropriateness:** Keep proportions child-like; no sexualized styling.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/anime_inspired.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Weak match: reads as a soft Western storybook, few animation-style cues.
