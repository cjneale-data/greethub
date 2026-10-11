# Hand-Lettered Note

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `hand_lettered_type` | **category** Clean & Simple | **status** stable | **products** card | **ages** 4-7, 8-10

> The words are the star: a quiet hand-painted border and lots of room for a heartfelt message.

**Why this one (shown to customers):** When the words matter most, we leave them room to shine.

**Occasions:** thank_you, anniversary, birthday, sympathy, valentines, just_because, mothers_day, wedding  
**Tones:** tender, elegant, bold  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **high**. The handwritten revival is the first trend in Printed.com's 2026 list (R06); handwriting-style fonts for anniversaries (R07); pen-pal and handwritten letters surge on Pinterest (R16).

- R06 [V] Printed.com: Top greeting card trends for 2026 (2026-01-09, printer blog): https://www.printed.com/blog/greeting-card-trends-2026/ (read 2026-10-11)
- R07 [V] Greetopia: Greeting card design trends 2026 (2025-12-18, retailer blog): https://greetopia.com/blog/greeting-card-design-trends-whats-hot-for-2026 (read 2026-10-11)
- R16 [S] Pinterest Predicts 2026 coverage (Axios, PG Buzz): https://axios.com/2025/12/09/2026-pinterest-trend-report (read 2026-10-11)
- R15 [S] Adobe Express design trends 2026 and Creative Market trends (search): https://www.adobe.com/express/learn/blog/design-trends-2026 (read 2026-10-11)

## How it looks

- **Medium:** Painted paper texture with a hand-drawn border or pattern
- **Technique:** Soft textured paper, simple painted leaves or dots as a frame, intentionally blank center
- **Line:** Fine hand-drawn border lines
- **Palette:** Soft neutrals with one accent: cream, blush, olive, plum
- **Composition:** Frame or edge pattern with an empty central area for lettering added by us
- **Mood:** Personal, sincere
- **Era:** Contemporary stationery

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Soft textured paper stationery design with a simple hand-painted border of small leaves and dots in olive, blush and plum along the edges, large calm empty center area, fine cream paper grain, gentle warm light, delicate and uncluttered - no lettering of any kind, no text in the picture, not photorealistic, no 3D render.
```

**Avoid list (negative prompt):**

- any text or letters
- photorealism
- 3D render
- dense illustration in the center
- gradients
- logos

## Palette

| Swatch | Hex |
|---|---|
| cream | `#F3EADB` |
| blush | `#F6C9C0` |
| olive | `#8A9A5B` |
| plum | `#5B2A4B` |
| cocoa type | `#2B1E18` |

## Character consistency

Book rating **1 of 5**, card rating **5 of 5** (5 = holds characters best).

No character, no drift. The only job for the model is a frame and a calm center. Never ask it to draw the words.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- We add the type with our fonts, never the image model
- Use a plain empty center
- Keep the illustration at the edges

## Photo reference handling

Not applicable: no people are drawn. If the customer wants a small figure, tuck it in a corner as a simple silhouette or switch to another style.

## Card typography and layout

- **Display:** Caveat 700; Pinyon Script; Fraunces 600
- **Body:** Figtree 400
- **Notes:** A handwritten script for a short line (names, 'thank you') and a soft serif for the full message. Max 2 families. 20 pt for script, 17 pt for message.
- **Layout:** Frame at edges, centered message block, message line breaks by phrase.
- **Text-safe zone:** Center 70 percent of the front is the type zone.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Border art reaches the bleed; center stays empty.
- **Ink coverage:** Low. Letterpress or foil on the lettering is the premium upgrade.
- **Foil and spot colour:** Foil on the lettering: not simulated.

## Best for / avoid for

**Best for**

- Thank you
- Anniversary
- Sympathy
- Valentine notes
- Heartfelt messages that deserve space

**Avoid for**

- Books
- Funny visual jokes
- Kids who want pictures

## Retrieval

- **Tags:** lettering, handwritten, script, type, message, note, stationery, calligraphy, border
- **Synonyms (customer words):** handwritten card, calligraphy, words only, text card, letter, note card
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Low.
- **Uncanny valley:** None.
- **Age appropriateness:** All ages.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#5B2A4B` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
