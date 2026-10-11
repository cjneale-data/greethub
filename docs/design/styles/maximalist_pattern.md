# Party Pattern

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `maximalist_pattern` | **category** Fancy & Fabulous | **status** stable | **products** card | **ages** 4-7, 8-10

> Busy, happy pattern: bright colors, flowers and shapes everywhere. A visual party.

**Why this one (shown to customers):** More is more! A busy burst of color for the people who love a party.

**Occasions:** birthday, congratulations, graduation, christmas, new_home, thank_you  
**Tones:** bold, silly  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **emerging**. Maximalism for congratulations and holidays (R07); bold and colorful is one of the biggest 2026 shifts (R08); coverage headlined 'loud, done with minimalism' (R16).

- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R08 [V] Shutterfly: Top Christmas and holiday card trends (updated 2026-08-07): https://www.shutterfly.com/ideas/top-christmas-holiday-card-trends/ (read 2026-10-11)
- R16 [S] Pinterest Predicts 2026 coverage (Axios, PG Buzz): https://axios.com/2025/12/09/2026-pinterest-trend-report (read 2026-10-11)

## How it looks

- **Medium:** Digital gouache pattern collage
- **Technique:** Dense repeating motifs, overlapping flowers, stars and confetti, strong contrast
- **Line:** Thin dark line or none
- **Palette:** Hot pink, cobalt, sunshine yellow, emerald, tangerine, cream
- **Composition:** All-over pattern with a calm central badge or window for the message
- **Mood:** Joyful, loud, festive
- **Era:** Contemporary maximalism

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Maximalist all-over pattern illustration in digital gouache, dense overlapping flowers, stars, confetti and swirls, hot pink, cobalt blue, sunshine yellow, emerald and tangerine on cream, strong contrast and joyful energy, a calm open round or arched window in the center for text, flat hand-painted shapes - not photorealistic, no 3D render, no text, no logos.
```

**Avoid list (negative prompt):**

- text in the picture
- photorealism
- 3D render
- muted colors
- logos
- faces

## Palette

| Swatch | Hex |
|---|---|
| hot pink | `#E8408A` |
| cobalt | `#2A4DB0` |
| sunshine | `#FFD23F` |
| emerald | `#1F8F5F` |
| tangerine | `#FF7A2F` |

## Character consistency

Book rating **1 of 5**, card rating **5 of 5** (5 = holds characters best).

Pattern only; models love this. Faces avoided.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Card-only
- Keep a defined empty window for message

## Photo reference handling

Not applicable. Names and age numbers are added as type, never drawn.

## Card typography and layout

- **Display:** Shrikhand or Lilita One; Baloo 2 ExtraBold
- **Body:** Figtree 700
- **Notes:** One bold color-contrast headline inside the window (dark navy on cream).
- **Layout:** All-over pattern, central window.
- **Text-safe zone:** The central window holds all type; keep at least a 2.5 in circle clear.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Pattern to the edge.
- **Ink coverage:** Very heavy and saturated; proof strongly.
- **Foil and spot colour:** Sparkle foil for confetti is an upgrade; not simulated.

## Best for / avoid for

**Best for**

- Big birthdays
- Congratulations
- Holiday party cards
- Graduations

**Avoid for**

- Sympathy
- Elegant weddings
- Books

## Retrieval

- **Tags:** maximalist, pattern, colorful, floral, confetti, party, busy, bright, joyful
- **Synonyms (customer words):** busy, colorful, all over, party, loud colors, fiesta
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#EE5A36` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
