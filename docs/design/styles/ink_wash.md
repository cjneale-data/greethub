# Ink & Wash

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `ink_wash` | **category** Soft & Watery | **status** stable | **products** book, card | **ages** 4-7, 8-10

> Fine pen lines with loose see-through color, plenty of white space. Calm, grown-up and hand-drawn.

**Why this one (shown to customers):** Quiet and elegant, perfect when you want it to feel like stationery.

**Occasions:** wedding, anniversary, sympathy, thank_you, just_because, birthday, adventure  
**Tones:** elegant, tender  
**Older ids that resolve here:** `storybook_ink`

## Popularity evidence

Rating: **medium**. Minimalist and fine-line looks are the 2026 pick for wedding and sympathy cards; pencil and sketch looks appear on competitor menus.

- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Dip-pen or fineliner ink with transparent watercolor tints
- **Technique:** Line first, color washes dropped loosely beside the line so they do not quite fill it
- **Line:** Fine, confident, slightly scratchy pen line in warm dark brown
- **Palette:** Restrained: dusty rose, sage, warm gray, ochre, small gold accent
- **Composition:** Open page, subject floats on white, botanical or object details
- **Mood:** Calm, refined, wry
- **Era:** Vintage storybook sketch

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Delicate 2D ink line and watercolor wash illustration, fine pen linework in warm dark brown with loose translucent color washes that do not fill the lines, generous cream paper white space, soft botanical details, calm elegant composition, restrained palette of dusty rose, sage, warm gray and small gold accents, hand-drawn stationery feel, characters drawn with expressive faces and simple clothing - not photorealistic, no 3D render, no digital gradients.
```

**Avoid list (negative prompt):**

- photorealism
- 3D render
- heavy fills
- saturated primaries
- airbrush gradients
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| dusty rose | `#D9B8B0` |
| sage | `#A9B79C` |
| warm gray | `#8E8A84` |
| gold | `#C9A24B` |
| paper | `#FBF6EE` |

## Character consistency

Book rating **3 of 5**, card rating **4 of 5** (5 = holds characters best).

Line art helps keep faces recognisable, but wash color is loose, so outfit colors can shift. Fine detail varies page to page.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- State exact outfit colors every page
- Name two or three face-defining line traits (glasses, curl, freckles)
- Attach the model sheet first
- Keep backgrounds sparse so the model spends effort on the characters

## Photo reference handling

Describe hair and face as 3 to 4 line-drawing traits (glasses, curls, beard shape, nose line) and let color wash carry skin tone lightly. Do not trace; loosen proportions slightly.

## Card typography and layout

- **Display:** Cormorant Garamond 600; Pinyon Script (names only)
- **Body:** Figtree 400
- **Notes:** Classic serif with a single script line for names. Message in dark cocoa at 17 to 19 pt, centered on the inside.
- **Layout:** Subject floats off-center with blank space on one side; weddings: two names centered below in script.
- **Text-safe zone:** Keep a clear 35 percent band (top or bottom) for a line of type on the front. The inside is mostly white.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Mostly white page: a tiny cream paper tint is fine, but keep the paper tone out of the bleed or a visible edge appears when trimming.
- **Ink coverage:** Very light. Use uncoated or textured stock to match the hand-drawn feel.
- **Foil and spot colour:** A gold foil line on the front is a lovely add-on but is not simulated by the picture.

## Best for / avoid for

**Best for**

- Weddings, anniversaries, sympathy
- Grown-up thank-you notes
- Books for ages 8 to 10 with a gentle humor
- Pet and garden themes

**Avoid for**

- Loud kids' birthdays
- Toddler books (too fine)
- Anything needing saturated, energetic color

## Retrieval

- **Tags:** ink, pen, line art, sketch, wash, elegant, botanical, stationery, wedding, refined
- **Synonyms (customer words):** pen and ink, fine line, sketchy and pretty, classic illustration, like an old storybook sketch, etching
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** beatrix potter, peter rabbit, wind in the willows

## Risks

- **IP:** Low to medium. Classic vintage animals in clothes are a well-known visual identity; keep animals generic and clothing plain.
- **Uncanny valley:** Low.
- **Age appropriateness:** Fine for all ages; subtle for toddlers.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#5B2A4B` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/ink_wash.jpg` (copied to `app/public/styles/`). Rendered 2026-10-13 at 1K (site-art-v1, best of 3). Sample of the style, not yet reviewed against a print proof.
