# Cinematic Photo Look

<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->

**id** `cinematic_photoreal` | **category** Lifelike & Cinematic | **status** beta | **products** card, book | **ages** 8-10

> Photographic, movie-still lighting. Sharp, real-looking and dramatic. Beta: ask for it deliberately.

**Why this one (shown to customers):** Movie-still realism for grown-up moments. Choose this one on purpose.

**Occasions:** anniversary, wedding, graduation, pet, retirement, birthday, just_because  
**Tones:** elegant, bold, adventurous  
**Older ids that resolve here:** none

## Popularity evidence

Rating: **niche**. 'Realistic' and 'cinematic' looks appear on AI-book menus (R09, R10). We found no evidence it sells better than illustrated looks; parent-trust research favors human-looking art (R20).

- R09 [V] ToonyStory: art styles menu (competitor): https://toonystory.com/styles (read 2026-10-11)
- R10 [V] Magic Story home page (competitor): https://www.magicstory.com/ (read 2026-10-11)

## How it looks

- **Medium:** Digital cinematic photograph look
- **Technique:** Shallow depth of field, key and rim lighting, film color grade, subtle grain
- **Line:** None
- **Palette:** Cinematic teal and amber, natural skin tones
- **Composition:** Medium shot, rule of thirds, bokeh background
- **Mood:** Dramatic, polished, grown-up
- **Era:** Contemporary film

## Image-model style string

Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.

```text
Cinematic stylized photographic look, shallow depth of field, soft key light with gentle rim light, film color grade with warm amber and muted teal, fine film grain, natural but softly retouched faces, composed medium shot with bokeh background - invented people only, not a copy of any real photograph, no text, no hyperreal skin pores.
```

**Avoid list (negative prompt):**

- uncanny hyperreal faces
- extra fingers
- text in the picture
- real celebrities
- children in realistic danger
- logos

## Palette

| Swatch | Hex |
|---|---|
| amber | `#D8913A` |
| film teal | `#2E5E6B` |
| natural skin | `#E6C7A9` |
| shadow | `#1E1E24` |
| highlight | `#F2E8D5` |

## Character consistency

Book rating **1 of 5**, card rating **3 of 5** (5 = holds characters best).

Models can hold a person's likeness best at photo-real, but identity drifts across pages and the uncanny valley is the main risk. Real child likeness in photoreal is privacy-sensitive. Beta: not shown in the default list for kids.

**Sample render (2026-10-11):** Not rendered in the sample run (budget). Ratings are estimates from the Eye Story lessons and the rendered styles, not measurements.

**Tips (what to attach and repeat):**

- Only for adults and ages 8 to 10 with an adult's consent
- Use one reference photo and the sheet
- Prefer cards over books
- Proof carefully

## Photo reference handling

Closest to the source photo, but still do not copy it: reinterpret pose, clothing and lighting; remove logos and prints; keep skin natural but retouched.

## Card typography and layout

- **Display:** Playfair Display 600; Josefin Sans 600 caps
- **Body:** Figtree 400
- **Notes:** Elegant serif or spaced caps in white on dark photographic areas.
- **Layout:** Medium shot, subject on a third, negative space on the other side.
- **Text-safe zone:** Bokeh negative space on one third is the type zone.

Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.

## Print and colour notes

- **Bleed:** Full-bleed photo-like image; check dark shadows.
- **Ink coverage:** Heavy; use a satin or gloss stock.
- **Foil and spot colour:** Spot UV on the title is an upgrade.

## Best for / avoid for

**Best for**

- Anniversary
- Pet or memorial portraits
- Grown-up gifts
- Graduation

**Avoid for**

- Toddlers and young kids' books
- Humor
- 32-page stories needing consistency

## Retrieval

- **Tags:** photo, photographic, realistic, cinematic, movie still, film, photoreal, lifelike
- **Synonyms (customer words):** photorealistic, real life, realistic, movie look, like a photo
- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** none

## Risks

- **IP:** Medium; lookalike risk with real people and known film stills. Never use names of celebrities.
- **Uncanny valley:** High.
- **Age appropriateness:** Not recommended under 8 for books; beta.

## Brand kit pairing

Display Bricolage Grotesque 700, text Figtree 400. Text colour `#2B1E18`, paper `#FBF6EE`, accent `#5B2A4B` (all from, or checked against, the brand tokens in brand/README.md).

## Thumbnail

Not rendered (budget): generated swatch placeholder, not a real sample of this style.
