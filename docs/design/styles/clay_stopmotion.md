# Clay Models

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `clay_stopmotion` | **category** Cut, Stitched & Handmade | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Little sculpted characters made of modeling clay, photographed on a tiny set. Quirky and tactile.

**Why this one (shown to customers):** Quirky and tactile, like a tiny handmade movie set.

**Occasions:** birthday, adventure, congratulations, get_well, just_because, graduation  
**Tones:** silly, adventurous  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Clay animation appears on AI illustration menus (R12). No sales evidence found.

- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)

## How it looks

- **Medium:** Sculpted modeling clay with fingerprints, on a miniature craft set
- **Technique:** Chunky smooth shapes, thumbprint texture, soft studio lighting, shallow depth of field
- **Line:** None; forms come from the sculpture
- **Palette:** Bright toy colors with earthy backdrops
- **Composition:** A miniature tabletop scene with small props
- **Mood:** Goofy, handmade, curious
- **Era:** Timeless craft animation

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Handmade modeling-clay stop-motion look, chunky smooth sculpted characters with visible thumbprint texture and slight imperfections, miniature craft-set backgrounds made of cardboard and paper, soft warm studio lighting, shallow depth of field, bright toy-like palette, big simple eyes and simple mouths, stylized and toy-like - not photorealistic, not a real photograph, no glossy plastic.
```

**Avoid list (negative prompt):**

- photorealistic humans
- glossy plastic
- real photograph
- text in the picture
- uncanny skin

## Palette

| Swatch | Hex |
|---|---|
| clay red | `#E8604C` |
| clay yellow | `#F2B134` |
| clay teal | `#4CA7A0` |
| cardboard | `#A68A64` |
| backdrop cream | `#F3EADB` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Models render clay convincingly, but lighting and set details change page to page. Faces are stable if kept simple.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Lock clay colors per character
- Say 'same clay color and thumbprint texture' on every page
- Keep sets simple

## Photo reference handling

Translate into chunky clay figures with the person's hair color, glasses and one signature outfit color; faces simplified, no realistic skin pores.

## Card typography and layout

- **Display:** Chewy (embedded); Baloo 2 ExtraBold
- **Body:** Figtree 600
- **Notes:** Playful rounded display; add type digitally rather than drawing it in clay.
- **Layout:** Miniature set, subject centered, props at the sides.
- **Text-safe zone:** Backdrop wall or sky band at the top for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Backdrops to the edge.
- **Ink coverage:** Medium; photographic lighting can print dark: lift shadows.
- **Foil and spot colour:** None.

## Best for / avoid for

**Best for**

- Silly birthdays
- Adventure books for ages 4 to 8
- Get well with humor

**Avoid for**

- Tender portraits
- Elegant events
- Complex action

## Retrieval

- **Tags:** clay, stop motion, plasticine, sculpted, miniature, toy, claymation
- **Synonyms (customer words):** claymation, plasticine, modeling clay, stop-motion look, little figures
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** wallace and gromit, shaun the sheep, aardman, pingu

## Risks

- **IP:** Medium. Clay animation has recognisable character signatures; no wide grins with big teeth, no pants or sheep ensembles.
- **Uncanny valley:** Medium; keep faces simple.
- **Age appropriateness:** 4 and up.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/clay_stopmotion.jpg` (copied to `app/public/styles/`). Rendered 2026-10-13 at 1K (site-art-v1, best of 3). Sample of the style, not yet reviewed against a print proof.
