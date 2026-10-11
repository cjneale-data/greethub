# Crayon & Pencil

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `crayon_pencil` | **category** Sketchy & Homemade | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Wobbly crayon and colored-pencil drawing on textured paper. Happily homemade.

**Why this one (shown to customers):** Looks like a kid made it, in the best way.

**Occasions:** birthday, fathers_day, mothers_day, thank_you, back_to_school, get_well, just_because  
**Tones:** silly, tender  
**Older ids that resolve here:** `crayon`

## Popularity evidence

Rating: **emerging**. Naive crayon and wobbly-line looks are named as a 2026 trend (R15, R04 hand-drawn imperfection); a crayon-and-ink doodle book is a top-70 seller (unverified, R19).

- R15 [S] Adobe Express design trends 2026 and Creative Market trends (search): https://www.adobe.com/express/learn/blog/design-trends-2026 (read 2026-10-11)
- R12 [S] AI illustration tools (IllustratorMagic, Musely, Neolemon, Booklet AI): style menus via search: https://musely.ai/tools/children-book-generator (read 2026-10-11)
- R04 [V] The Bright Agency: Trends in Children's Literature 2026: https://thebrightagency.com/uk/case-studies/trends-in-children-s-literature-2026-vicki-willden-lebrecht (read 2026-10-11)
- R19 [U] Design head's own knowledge of how top-selling picture books look (unverified): docs/design/00-research-notes.md (read 2026-10-11)

## How it looks

- **Medium:** Wax crayon and colored pencil on textured paper
- **Technique:** Scribbled fills with paper tooth showing through, overlapping strokes, gentle smudges
- **Line:** Wobbly, uneven, joyful
- **Palette:** Saturated childlike: red, blue, green, orange, purple, with cream paper
- **Composition:** Centered doodle-like characters, floating objects, no strict perspective
- **Mood:** Joyful, homemade, silly
- **Era:** Timeless

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Hand-drawn crayon and colored-pencil illustration on textured paper, wobbly joyful uneven waxy crayon lines, scribbled saturated fills that go over the lines with paper tooth showing through, childlike palette of red, blue, green and orange, simple characters with round heads and dot eyes, playful uneven shapes and a loose, homemade feel - not photorealistic, no 3D render, no clean vector lines.
```

**Avoid list (negative prompt):**

- clean vector lines
- photorealism
- 3D render
- gradients
- text in the picture
- airbrush

## Palette

| Swatch | Hex |
|---|---|
| crayon red | `#E0412F` |
| crayon blue | `#2E6FD0` |
| crayon green | `#3FA34D` |
| crayon orange | `#F28C28` |
| paper | `#FBF6EE` |

## Character consistency

Book rating **3 of 5**, card rating **5 of 5** (5 = holds characters best).

Wobbly lines forgive small differences, which helps; but faces are loose so likeness is weaker. Great for cards.

**Sample render (2026-10-11):** Too polished: line is neat and fills are even, so it looks like colored pencil, not a child's crayon scribble. Charming and consistent, but 'wobbly and scribbled' needs stronger wording (heavy waxy strokes, uneven fills, off-the-line coloring).

**Tips (what to attach and repeat):**

- Keep characters to circles and sticks
- Use the same hair scribble color
- Restate outfit colors

## Photo reference handling

Simplify to a doodle: hair as a scribble in the photo's color, glasses as two circles, big smile. Never copy facial structure.

## Card typography and layout

- **Display:** Patrick Hand; Gochi Hand; Chewy (embedded)
- **Body:** Figtree 600
- **Notes:** Hand-printed fonts in marker colors; keep to 2 colors.
- **Layout:** Doodle in the middle, floating objects around.
- **Text-safe zone:** A blank paper corner or band for the added caption.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Textured paper to the edge; use uncoated stock.
- **Ink coverage:** Medium.
- **Foil and spot colour:** None.

## Best for / avoid for

**Best for**

- Kids' birthdays
- Father's Day from kids
- Teacher thank-you
- Toddler books

**Avoid for**

- Elegant occasions
- Strong likeness requirement
- Adult sympathy

## Retrieval

- **Tags:** crayon, pencil, colored pencil, doodle, kid drawing, scribble, homemade, naive
- **Synonyms (customer words):** kid-drawn, child's drawing, scribbly, doodle, wobbly, marker
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** 0 to 7.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/crayon_pencil.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Fair: reads as tidy colored pencil, not wobbly crayon.
