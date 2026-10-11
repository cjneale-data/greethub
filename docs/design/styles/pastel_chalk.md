# Dreamy Pastel

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `pastel_chalk` | **category** Soft & Watery | **status** stable | **products** book, card | **ages** 0-3, 4-7

> Powdery chalk-pastel color, soft clouds and glow. Sweet, sleepy and light.

**Why this one (shown to customers):** Sleepy and sweet, made for babies, bedtime and gentle love notes.

**Occasions:** new_baby, valentines, birthday, bedtime, mothers_day, just_because  
**Tones:** tender  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **medium**. Soft pastels with metallic accents are listed for new baby and Valentine cards; 'soft and dreamy' is a competitor menu entry; neon-pastel palettes called a 2026 trend.

- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R05 [V] Lumonova Studio: Children's book illustration styles (2025-12-20, vendor blog): https://lumonovastudio.com/childrens-book-illustration-styles/ (read 2026-10-11)

## How it looks

- **Medium:** Soft chalk pastel and colored pencil on toothy paper, a little digital blending
- **Technique:** Smudged gradients, grainy highlights, layered dusty color
- **Line:** Almost none; edges are formed by color change, with a faint soft outline in a darker tone of the same color
- **Palette:** Powdery pastels: lilac, baby blue, peach, mint, a dusty rose, optional gold dust accent
- **Composition:** Floaty central figure, clouds and stars, rounded shapes, low contrast
- **Mood:** Sleepy, sweet, safe
- **Era:** Contemporary nursery

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Dreamy 2D chalk pastel and colored pencil illustration on toothy paper, powdery smudged gradients, grainy soft highlights, almost no outlines with edges formed by color change, soft glowing light, pastel palette of lilac, baby blue, peach, mint and dusty rose, rounded sweet shapes with small simple faces, cloud and star backgrounds, gentle low contrast - not photorealistic, no 3D render, no sharp lines.
```

**Avoid list (negative prompt):**

- hard outlines
- dark heavy shadows
- high contrast
- photorealism
- 3D render
- text in the picture

## Palette

| Swatch | Hex |
|---|---|
| lilac | `#CDB8E0` |
| baby blue | `#B9D3EA` |
| peach blush | `#F6C9C0` |
| mint | `#BFE3D0` |
| gold dust | `#E7C770` |

## Character consistency

Book rating **2 of 5**, card rating **4 of 5** (5 = holds characters best).

No outlines means faces shift from page to page; low contrast makes small details disappear. Fine for a quiet 12-page baby book, risky for 32 pages.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Give each character a simple, bold shape (round head, one hair blob)
- Use only one outfit color per person
- Lock hair color and one accessory
- Prefer card or short baby book over long stories

## Photo reference handling

Soften every person into a rounded, simplified character with the photo's hair color and skin tone, eyes as small dots or soft curves. Babies read as sleeping or looking sideways.

## Card typography and layout

- **Display:** Fredoka 500 (rounded); Dancing Script 600
- **Body:** Figtree 400
- **Notes:** Rounded sans in a deeper plum or navy for contrast against the pastel. Message at 17 to 20 pt, never in a pastel color (low contrast).
- **Layout:** Center a small subject in a big soft field; stars and clouds frame the edges.
- **Text-safe zone:** Top 30 percent stays pure sky for an optional caption; the inside carries a light pastel corner wash.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Gradients to the edge band easily; request 'full-bleed' and check for banding in the proof.
- **Ink coverage:** Light to medium; pastel gradients can show banding on coated stock, so prefer matte uncoated.
- **Foil and spot colour:** Gold dust accents can be a spot foil add-on; the picture only suggests it.

## Best for / avoid for

**Best for**

- New baby, baby shower, christening
- Valentine notes
- Bedtime books for ages 0 to 3
- Pregnancy announcements

**Avoid for**

- Humor
- Action stories
- Long books where characters must stay identical
- Dad and uncle cards

## Retrieval

- **Tags:** pastel, chalk, dreamy, soft, baby, nursery, clouds, sleepy, powdery
- **Synonyms (customer words):** soft and dreamy, pastel dream, cloudy, sweet and sleepy, baby pastel, cotton candy
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** Low; faces are too soft to be uncanny.
- **Age appropriateness:** Best for 0 to 7.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#5B2A4B` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
