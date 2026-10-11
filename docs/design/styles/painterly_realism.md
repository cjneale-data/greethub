# Painted Portrait

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `painterly_realism` | **category** Lifelike & Cinematic | **status** stable | **products** book, card | **ages** 8-10

> Soft oil-painting realism with warm light, like a gallery portrait. Real-feeling but painted.

**Why this one (shown to customers):** Warm and painterly, the most lifelike look that still feels like art.

**Occasions:** anniversary, wedding, sympathy, mothers_day, fathers_day, retirement, pet, birthday  
**Tones:** elegant, tender  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. Fine-art painterly is favored in European markets (R05); 'soft realism' is on competitor menus (R09). No sales evidence found.

- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)

## How it looks

- **Medium:** Oil or acrylic painting look on canvas
- **Technique:** Soft blended edges, visible brush marks in backgrounds, glazing, chiaroscuro-lite light
- **Line:** None
- **Palette:** Rich earthy: umber, ochre, deep green, warm skin tones, muted blue
- **Composition:** Portrait or scene with a clear focal light, painterly background
- **Mood:** Warm, reflective, dignified
- **Era:** Classic painting tradition

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Soft painterly storybook realism, oil-painting look with visible brush marks in the background and smooth blended faces, warm directional light with gentle shadows, rich earthy palette of umber, ochre, deep green and muted blue, faces natural but softly idealized with gentle expressions, painterly atmospheric backgrounds - not a photograph, no hyperreal skin pores, no glossy 3D render.
```

**Avoid list (negative prompt):**

- photograph look
- hyperreal skin
- 3D render
- plastic gloss
- text in the picture
- extra fingers

## Palette

| Swatch | Hex |
|---|---|
| umber | `#7A4B2A` |
| ochre | `#C58B2C` |
| deep green | `#365C4A` |
| warm skin | `#E7C7A9` |
| muted blue | `#5A7EA3` |

## Character consistency

Book rating **2 of 5**, card rating **3 of 5** (5 = holds characters best).

Rendered faces change with each page and the uncanny valley sits close; resemblance expectations are high. Better for single images than a 32-page book.

**Sample render (2026-10-11):** Soft oil look with natural light. The child was drawn younger and more idealized than the prompt implied; that is the safe side of the uncanny valley. Likeness from a real photo is untested here.

**Tips (what to attach and repeat):**

- Prefer cards or a short book
- Attach 2 reference photos plus the sheet
- Use soft idealization, not photo likeness
- Re-roll face-drift pages

## Photo reference handling

Soft idealization of the real face: keep face shape, eye color, hair, glasses; smooth skin; adjust lighting to the painting's single source. Be honest: likeness will be close, not exact.

## Card typography and layout

- **Display:** Cormorant Garamond 600; Playfair Display 600
- **Body:** Figtree 400
- **Notes:** Classic serif in dark cocoa; names in italic.
- **Layout:** Portrait-oriented subject with painterly background; vignette edges.
- **Text-safe zone:** Dark background bottom 30 percent is the type zone.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Dark painterly edges: bleed matters.
- **Ink coverage:** Heavy in dark areas (up to 280 percent); use heavyweight stock.
- **Foil and spot colour:** None.

## Best for / avoid for

**Best for**

- Anniversary and wedding gifts
- Sympathy and memorial portraits
- Pet portraits
- Older kids' memory books

**Avoid for**

- Toddlers
- Silly
- Strong consistency across 32 pages

## Retrieval

- **Tags:** painted, oil, portrait, realistic, painterly, classic art, lifelike, soft realism
- **Synonyms (customer words):** looks real but painted, oil painting, portrait, realistic painting, lifelike
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low; avoid naming painters.
- **Uncanny valley:** High. Closer to a face, closer to the valley: stay softly idealized.
- **Age appropriateness:** Not recommended for 0 to 7 books.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#5B2A4B` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/painterly_realism.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Good: soft oil-painting look, no uncanny face.
