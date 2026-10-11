# Paper Cut Collage

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `paper_cut_collage` | **category** Cut, Stitched & Handmade | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Shapes cut from colored paper, layered with tiny shadows. Looks handmade and a little modern.

**Why this one (shown to customers):** Handmade-looking and bright, great for thank-yous and toddler books.

**Occasions:** thank_you, graduation, mothers_day, birthday, new_baby, congratulations, teacher  
**Tones:** silly, bold, tender  
**Older ids that resolve here:** `paper_cut`, `paper_collage`

## Popularity evidence

Rating: **medium**. Collage stands out for art-minded parents (R05), paper grain and layering are 2026 texture trends (R15), paper craft is on competitor menus; a famous collage classic is a perennial bestseller (unverified, R19).

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R15 [S] Adobe Express design trends 2026 and Creative Market trends (search): https://www.adobe.com/express/learn/blog/design-trends-2026 (read 2026-10-11)
- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)
- R19 [U] Design head's own knowledge of how top-selling picture books look (unverified): docs/design/00-research-notes.md (read 2026-10-11)

## How it looks

- **Medium:** Hand-cut colored paper and painted paper, layered and glued
- **Technique:** Flat shapes with subtle drop shadows between layers, torn edges, painted paper texture
- **Line:** None; the shape edge is the line
- **Palette:** Persimmon orange, mustard, blush pink, deep plum, cream and a leaf green
- **Composition:** Layered shapes, bold silhouettes, a flat 2D plane with slight depth
- **Mood:** Playful, crafty, bright
- **Era:** Mid-century revival

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Layered paper-cut collage illustration, hand-cut shapes with subtle shadows between layers, torn paper edges, visible painted-paper texture and fibers, limited bright palette with persimmon orange, mustard, blush pink and deep plum, mid-century picture book feel, flat 2D composition, characters built from simple cut shapes with round heads and small dot eyes - not photorealistic, no 3D render, no gradients.
```

**Avoid list (negative prompt):**

- gradients
- photorealism
- 3D render
- outlines
- text in the picture
- fine detail

## Palette

| Swatch | Hex |
|---|---|
| persimmon | `#EE5A36` |
| mustard | `#F5B83D` |
| blush | `#F6C9C0` |
| plum | `#5B2A4B` |
| leaf green | `#6AA26E` |

## Character consistency

Book rating **3 of 5**, card rating **5 of 5** (5 = holds characters best).

Strong shape language holds basic identity, but models swap paper textures and recut faces differently each time. Restate shapes for hair.

**Sample render (2026-10-11):** Convincing layered cut paper with torn edges. Faces are cleaner and smoother than real cut paper (looks like digital vector with paper texture), and the child's side-profile differs from the front pose: expect face-shape drift across pages.

**Tips (what to attach and repeat):**

- Describe hair as a single cut shape
- Reuse the same two or three paper colors per character
- Avoid detailed clothing patterns
- Use a plain background per spread

## Photo reference handling

Convert to cut-shape caricature: hair as one big shape in the photo's color, skin as a flat paper tone, glasses as two circles. No fine facial modeling.

## Card typography and layout

- **Display:** Bricolage Grotesque 800 (brand); Gaegu or Patrick Hand
- **Body:** Figtree 600
- **Notes:** A bold sans for the headline in cocoa or cream on a solid color panel echoes cut paper.
- **Layout:** Large cut shape (flower, cake, whistle) with smaller layered pieces; plenty of solid background.
- **Text-safe zone:** Reserve a solid color panel (lower 30 percent) to simulate a cut label for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Solid colored backgrounds to the edge.
- **Ink coverage:** Medium; works well on uncoated textured stock, which echoes paper.
- **Foil and spot colour:** Embossing under shapes would add tactile realism but is a printer upgrade, not simulated.

## Best for / avoid for

**Best for**

- Thank you and teacher cards
- Mother's Day flowers
- Toddler books
- Congratulations

**Avoid for**

- Detailed likeness
- Long, complex scenes
- Elegant weddings

## Retrieval

- **Tags:** paper, collage, cut paper, layered, craft, mid-century, cutout, handmade, texture
- **Synonyms (customer words):** paper craft, cut-out, collage, scrapbook, papercut, construction paper
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** eric carle, very hungry caterpillar style, south park style

## Risks

- **IP:** Medium. A famous tissue-collage style exists; avoid striped caterpillars and tissue-paper texture phrases.
- **Uncanny valley:** None.
- **Age appropriateness:** Best 0 to 7.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#FBF6EE`, paper `#5B2A4B`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/paper_cut_collage.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Good layered paper look with soft shadows.
