# Felt & Thread

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `felt_thread` | **category** Cut, Stitched & Handmade | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Cut felt shapes sewn with thread, like a handmade quilt or a craft-table scene.

**Why this one (shown to customers):** Soft, fuzzy and handmade, like a keepsake someone sewed.

**Occasions:** new_baby, birthday, christmas, mothers_day, thank_you, teacher, just_because  
**Tones:** tender, silly  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Felt craft appears as a competitor style (R12); thread and tactile textures are a 2026 trend (R15). No sales evidence found.

- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)
- R15 [S] Adobe Express design trends 2026 and Creative Market trends (search): https://www.adobe.com/express/learn/blog/design-trends-2026 (read 2026-10-11)

## How it looks

- **Medium:** Felt appliqué and embroidery thread on linen background
- **Technique:** Layered felt pieces sewn on with visible thread, soft fuzzy edges and small shadows
- **Line:** Sewn thread edges and thread outlines in a contrasting color
- **Palette:** Warm brights: red, mustard, sage, cream linen, denim blue
- **Composition:** Centered scene on linen, patch-like shapes, hand-sewn outlines on each shape
- **Mood:** Sweet, snug, handmade
- **Era:** Timeless craft

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Handmade felt appliqué and embroidery illustration on natural linen, layered cut felt shapes with soft fuzzy edges and tiny shadows, visible hand-sewn outlines in contrasting thread on each shape, warm palette of red, mustard, sage and denim blue, simple rounded characters with button eyes and sewn smiles, flat tabletop view - not photorealistic, no 3D render, not a photograph of real felt.
```

**Avoid list (negative prompt):**

- photographs of real objects
- 3D render
- glossy plastic
- photorealism
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| felt red | `#C94438` |
| mustard felt | `#E3A93B` |
| sage | `#8DAE8B` |
| linen | `#E9DFC9` |
| denim | `#4F6D8E` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Distinct materials help, but thread detail varies. Characters can end up too similar when made of simple shapes.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Use different felt colors per character
- Use button eyes as the constant face trait
- Keep the scene on a flat plane

## Photo reference handling

Reduce to felt shapes: hair as a piece of felt in the photo's color, skin as a flat warm felt, eyes as buttons. Likeness comes from hair and color only.

## Card typography and layout

- **Display:** Fredoka 600; Gochi Hand
- **Body:** Figtree 500
- **Notes:** Rounded sans reads as soft; a sewn-look script for names (added by us as type, not drawn).
- **Layout:** Center a patch, sewn thread border at the edges.
- **Text-safe zone:** Linen margin on all sides acts as the type zone; avoid text on felt.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Linen background to the edge; print on uncoated cream stock.
- **Ink coverage:** Low to medium.
- **Foil and spot colour:** Embroidery cannot be simulated in print; a debossed thread border is possible as an upgrade.

## Best for / avoid for

**Best for**

- New baby
- Teacher gifts
- Christmas
- Toddler books

**Avoid for**

- Humor with sharp edges
- Formal events
- Complex scenes

## Retrieval

- **Tags:** felt, thread, embroidery, craft, fabric, quilt, handmade, button eyes, textile
- **Synonyms (customer words):** fabric, sewn, plush, patchwork, yarn, craft felt
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low. Avoid recognisable felt puppets.
- **Uncanny valley:** Medium: button eyes can be unsettling if overused; keep expressions friendly.
- **Age appropriateness:** Best 0 to 7.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
