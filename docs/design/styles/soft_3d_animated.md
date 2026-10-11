# Soft 3D Animated

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `soft_3d_animated` | **category** Big-Screen Bright | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Glowy, rounded characters with big eyes and cinematic light, like a modern animated movie.

**Why this one (shown to customers):** Glowy and cinematic, the closest thing to a movie poster of your family.

**Occasions:** birthday, adventure, christmas, graduation, congratulations, new_home, just_because  
**Tones:** adventurous, silly, tender  
**Older ids that resolve here:** `storybook_3d`

## Popularity evidence

Rating: **high**. The leading AI-book competitors sell a 3D animated or cinematic look (R09, R10, R12); 3D is suited to action (R05). Our nearest generic equivalent.

- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R10 [V] Magic Story home page (competitor): https://www.magicstory.com/ (read 2026-10-11)
- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Digital 3D-rendered animated-film look with soft clay-like forms
- **Technique:** Subsurface-soft skin, rounded forms, rim lighting, shallow depth of field, gentle color grading
- **Line:** None; shape and light define form
- **Palette:** Warm saturated with teal-orange cinematic contrast
- **Composition:** Hero framing, depth layers, cinematic backlight, bokeh background
- **Mood:** Warm, wondrous, high-energy
- **Era:** Contemporary animation

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Soft cozy 3D-rendered animated-film look, rounded clay-like forms, warm cinematic lighting with gentle rim light, shallow depth of field, gentle color grading, stylized cartoon characters with large expressive eyes, smooth simplified skin and softly sculpted hair - not photorealistic, no realistic skin pores, no hyperreal textures.
```

**Avoid list (negative prompt):**

- photorealism
- realistic skin pores
- scary expressions
- text in the picture
- hair or outfits resembling known films

## Palette

| Swatch | Hex |
|---|---|
| sunset orange | `#F59E5B` |
| cinema teal | `#3CA6A6` |
| glow gold | `#F7D774` |
| dusk purple | `#6C4AB6` |
| warm white | `#FFF3E2` |

## Character consistency

Book rating **3 of 5**, card rating **3 of 5** (5 = holds characters best).

Great first-impression quality, but faces re-interpret page to page and the model drifts toward generic movie-cute faces; kids resemble each other. Photo likeness needs the model sheet.

**Sample render (2026-10-11):** Attractive, warm lighting and a plush fox, but it is a soft painted hybrid rather than a true 3D render: the child's face stays 2D-leaning. Good enough as a safe 'animated film glow' look. Expect face drift page to page; keep the model sheet gate.

**Tips (what to attach and repeat):**

- Approve the model sheet before any page
- Describe 3 distinctive facial anchors per person
- Keep hair as a simple sculpted shape
- Avoid scenes with 4 characters at once

## Photo reference handling

Translate into a stylized 3D character with the photo's hair color/shape, skin tone, glasses and face-shape cue; enlarge eyes modestly; keep skin smooth. Do not preserve the photographic lighting.

## Card typography and layout

- **Display:** Baloo 2 ExtraBold; Fredoka 600
- **Body:** Figtree 600
- **Notes:** Rounded display with a drop shadow; white on a dark glow area.
- **Layout:** Hero character mid-frame with depth layers.
- **Text-safe zone:** Keep the lower third calm for a caption; inside page is plain.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Full-bleed backgrounds with soft bokeh.
- **Ink coverage:** High; glow and saturated teals can band or darken in CMYK, proof.
- **Foil and spot colour:** Spot gloss over highlights is a good upgrade; not simulated.

## Best for / avoid for

**Best for**

- Birthday adventure books
- Ages 4 to 10 'hero of the story'
- Christmas cards for kids

**Avoid for**

- Strong likeness
- Elegant
- Photo-based sympathy
- Customers wanting a hand-made look

## Retrieval

- **Tags:** 3d, animated, movie, cinematic, glowy, rounded, cgi, cartoon movie, bright
- **Synonyms (customer words):** animated movie, 3D cartoon, cgi, movie style, film look, big-screen
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** pixar, pixar style, pixar looking, pixar-looking, like a pixar movie, disney, disney movie, like a disney movie, disney princess, dreamworks, frozen style, frozen-style, like frozen, frozen movie, illumination, encanto style, moana style

## Risks

- **IP:** High. This is the style customers most often ask for by franchise name. Never mention a studio; keep hair, outfits and sidekicks original. Output vision check must stay on.
- **Uncanny valley:** Medium; keep eyes stylized and skin smooth.
- **Age appropriateness:** 4 and up.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/soft_3d_animated.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Partial: a painterly-3D hybrid, plush fox and smooth child, no real CGI render.
