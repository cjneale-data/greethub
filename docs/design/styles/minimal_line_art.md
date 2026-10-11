# Minimal Line Art

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `minimal_line_art` | **category** Clean & Simple | **status** stable | **products** card, book | **ages** 0-3, 8-10

> A few thin lines on lots of white space. Quiet, modern and a little poetic.

**Why this one (shown to customers):** Quiet and modern, saying a lot with very few lines.

**Occasions:** wedding, anniversary, sympathy, valentines, thank_you, new_baby, just_because, mothers_day  
**Tones:** elegant, tender  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **high**. Minimalism and clean lines are named for wedding and sympathy cards (R07); minimalist suits ages 0-3 board books (R05).

- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Single-weight pen line with a spot of color
- **Technique:** Continuous line drawing, tiny accent fill in one color, generous white
- **Line:** Thin, even, dark ink or colored pen
- **Palette:** Black or navy line, one soft accent (blush or sage), white paper
- **Composition:** Subject small and off-center, big negative space
- **Mood:** Calm, poetic, modern
- **Era:** Contemporary

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Minimalist continuous-line illustration, single-weight thin dark navy pen line with one small soft blush accent fill, generous warm white space, simple shapes and gesture drawing, delicate and uncluttered, hand-drawn stationery feel, faces reduced to a few lines - not photorealistic, no 3D render, no shading, no gradients.
```

**Avoid list (negative prompt):**

- shading
- gradients
- clutter
- photorealism
- 3D render
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| navy line | `#1F2F4D` |
| blush accent | `#F6C9C0` |
| sage accent | `#B7C9A8` |
| warm white | `#FBF6EE` |
| gold accent | `#C9A24B` |

## Character consistency

Book rating **3 of 5**, card rating **5 of 5** (5 = holds characters best).

Few lines mean few things to drift, but also little to anchor identity; use hair line and glasses as anchors.

**Sample render (2026-10-11):** Nice thin line and white space, but it filled the coat and hair with flat color; not strictly one accent. Good for cards; the extra fills actually help character identity.

**Tips (what to attach and repeat):**

- Lock 2 line traits per person
- One accent color per character
- Use for short books or cards

## Photo reference handling

Distill to a gesture: head shape, hair line, glasses; skin left white. Line drawing of two people holding hands conveys relationship more than likeness.

## Card typography and layout

- **Display:** Cormorant Garamond 500; Jost 400 caps
- **Body:** Figtree 400
- **Notes:** Light serif with spaced small caps; lots of white around the message.
- **Layout:** Subject small, off-center in the lower half; type above.
- **Text-safe zone:** Top 45 percent can be fully empty for type.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** White background: no bleed art needed; keep line art inside safe margin.
- **Ink coverage:** Very low. Letterpress or foil line works well as an upgrade.
- **Foil and spot colour:** A foil-stamped line is a lovely upgrade; picture only shows an ink line.

## Best for / avoid for

**Best for**

- Weddings and engagement
- Sympathy
- Anniversary
- Baby board books (ages 0 to 3)

**Avoid for**

- Loud humor
- Complex adventures
- Kids' birthdays

## Retrieval

- **Tags:** minimal, line art, continuous line, simple, modern, white space, pen, elegant
- **Synonyms (customer words):** simple lines, one line drawing, clean and simple, scandi, modern minimal
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FFFFFF`, accent `#C8441F` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Rendered sample: `docs/design/samples/minimal_line_art.jpg` (copied to `app/public/styles/`). Rendered 2026-10-11 at 1K. Fair: line-led but with more color fills than minimal.
