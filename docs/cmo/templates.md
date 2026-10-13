# Starter templates and art-style presets

Owner: CMO. Templates fill the browse grid and pre-fill the brief (occasion, product, tone, art style). Cover-art prompts contain no people from photos, no text in the image, no brands, no copyrighted characters. Generic subjects only, so templates render without any user input.

## 1. Art-style presets

> Superseded 2026-10-11 by the Design style library (`docs/design/style-library.json`, 26 styles in 10 categories). The five preset ids below still work: `soft_watercolor` resolves to `watercolor_wash`, `bold_pop` to `bold_cartoon_pop`, `paper_collage` to `paper_cut_collage`; `cozy_gouache` and `ink_wash` are unchanged ids. See `docs/design/03-selection-guide.md` section 8. The table below is kept as the original brief.

`style` is the string passed to the image model, in the same form as the Eye Story style line. The CTO appends the shared page rules (FULL-BLEED, FRAMING, exact character counts, "no text in the image") separately; do not duplicate them in the style string.

| id | Name | Best for | Style string |
|---|---|---|---|
| `soft_watercolor` | Soft Watercolor | New baby, birthdays, heartfelt, family | "Soft 2D watercolor and gouache illustration, classic children's picture book style, warm natural light, gentle paper grain, rounded friendly shapes, muted warm palette with peach, cream and sage, soft edges, no photorealism, no 3D render." |
| `bold_pop` | Bold Cartoon Pop | Funny birthdays, kids, congratulations | "Bold 2D cartoon illustration, clean thick outlines, flat saturated colors, playful exaggerated proportions, lively expressions, simple graphic backgrounds, bright palette with coral, sunny yellow and teal, lightly textured print feel, no photorealism, no 3D render." |
| `cozy_gouache` | Cozy Storybook Gouache | Christmas, adventures, bedtime books | "Cozy 2D gouache storybook illustration, warm lamplit atmosphere, rich velvety colors in plum, amber, forest green and cream, visible brush texture, detailed but uncluttered scenes, gentle depth with soft shadows, vintage picture book charm, no photorealism, no 3D render." |
| `paper_collage` | Paper Cut Collage | Thank you, teachers, modern and graphic | "Layered paper-cut collage illustration, hand-cut shapes with subtle shadows between layers, torn paper edges, visible paper texture, limited bright palette with persimmon orange, mustard, blush pink and deep plum, mid-century picture book feel, flat 2D composition, no photorealism, no 3D render." |
| `ink_wash` | Ink and Wash | Weddings, anniversaries, sympathy, grown-up cards | "Delicate 2D ink line and watercolor wash illustration, fine pen linework with loose translucent color washes, generous white space, soft botanical details, calm elegant composition, restrained palette of dusty rose, sage, warm gray and gold accents, hand-drawn stationery feel, no photorealism, no 3D render." |

Defaults by occasion and tone (used when the user doesn't pick):

| Condition | Preset |
|---|---|
| Birthday + Funny | `bold_pop` |
| Birthday + Heartfelt, New baby, Get well | `soft_watercolor` |
| Wedding, Anniversary, Sympathy | `ink_wash` |
| Christmas, Adventurous, Moving house | `cozy_gouache` |
| Thank you, Teacher, Graduation | `paper_collage` |
| Anything else | `soft_watercolor` |

## 2. The 12 templates

Prices come from the CFO. `Aside` in the TemplateCard shows the price token for the product. Tilt index in the grid cycles 0..5 (positive and negative degrees alternating, 1.5 to 3 degrees).

| # | Title | Occasion | Product | Tone | Preset | Cover-art prompt (one line) |
|---|---|---|---|---|---|---|
| 1 | Big Birthday | Birthday | Card | Funny | `bold_pop` | A giant lopsided birthday cake with too many candles, confetti raining over a bright teal background, empty space at the top for nothing but sky. |
| 2 | For Nonna | Birthday | Card | Heartfelt | `soft_watercolor` | A sunlit kitchen table with a blue bowl of lemons, a cup of tea and a bunch of wildflowers in a jug, warm morning light through a window. |
| 3 | Hello, Little One | New baby | Card | Heartfelt | `soft_watercolor` | A sleeping baby fox curled in a crescent moon cradle among soft clouds and tiny stars, pastel peach and sage. |
| 4 | Thanks, Coach | Thank you | Card | Funny | `paper_collage` | A cut-paper whistle and clipboard beside a crooked trophy on a plum background, layered shapes in orange and mustard. |
| 5 | Just Wanted You to Know | Just because | Card | Heartfelt | `ink_wash` | A single hand-drawn bunch of daisies tied with twine lying on a soft blush wash, generous white space. |
| 6 | Forever, Starting Now | Wedding | Card | Heartfelt | `ink_wash` | Two overlapping olive branches forming a loose heart shape, gold accents and dusty rose washes, elegant open space. |
| 7 | Get Well, Grumpy Bear | Get well | Card | Funny | `bold_pop` | A bear in striped pajamas wrapped in a blanket with a thermometer and a huge mug of soup, comically glum, bright yellow wall. |
| 8 | Merry and Bright | Christmas | Card | Heartfelt | `cozy_gouache` | A snowy cabin with glowing windows, a lit fir tree and a small trail of footprints, deep plum night sky with amber lamplight. |
| 9 | Mom, You Did It | Mother's Day | Card | Heartfelt | `paper_collage` | A big layered paper flower in blush, persimmon and mustard with a small cut-paper teapot beside it, plum background. |
| 10 | Our Summer | Just because | Picture book | Adventurous | `cozy_gouache` | A small wooden rowboat on a calm lake at golden hour with a picnic basket and fishing rods, forested shoreline, warm gouache light. |
| 11 | The Night the Moon Came Down | Birthday | Picture book | Adventurous | `soft_watercolor` | A glowing round moon resting on a hilltop at night while a small child silhouette and a dog look up, deep blue and soft gold. |
| 12 | The Day We Moved In | Moving house | Picture book | Funny | `bold_pop` | A packed removal truck with a wobbling tower of boxes, a houseplant riding up front and a cat perched on top, bright suburban street. |

Notes
- Books #10 to #12 use generic silhouettes so the cover needs no photo. The user's characters replace them in their own story.
- ~~The Eye Story as hero sample~~ Withdrawn 2026-10-12: standing rule 5 says never use real people in samples. The sample book is fictional (section 3).
- Mix for launch: 9 cards, 3 books; skew to the next 90 days of the calendar (Mother's Day, Father's Day, graduation, back-to-school, Christmas) as templates are seasonal.
- Templates 6 and 8 are the only ones carrying a persimmon-adjacent color in the art; do not place a persimmon Badge on those tiles.
- Cover-art images must be generated once, reviewed by hand, and stored as static assets (not generated per visitor).
- Tile style labels now come from the style library names (`STYLE_NAMES`), so tiles and the picker agree (2026-10-12).
- Season fit (2026-10-12): the launch is November, but the set carries one holiday card and no holiday book. Add before launch, as data only: a Christmas picture book ("Grandma's Snowy Visit"), a Hanukkah card and a Thanksgiving thank-you card (occasion `other` with a label until the occasion list grows), and rotate Mother's Day and the wedding card off the home grid until spring.

## 3. Imagery needed for launch (the real-artwork brief)

Nothing on the site shows real art today: Home, the 12 tiles and the sample book are striped placeholders, and 15 of 26 styles have no sample (Design). Market and CX both rank this as the top trust gap. All of it is fictional: invented characters, text-described casts, no photos of real people, no customer content, no named artists, studios or characters (legal 07). Every image passes the IP vision check and gets a line in an approval log (who, date, model, prompt version).

| Asset | Count | Spec | Source |
|---|---|---|---|
| Home hero pile | 2 | 4:5, one card front (Big Birthday) and one book cover (The Night the Moon Came Down), 1200x1500 WebP, keeps the -6/+5 degree tilt and the "Love, Maya" sticker | Template renders below |
| Template covers | 12 | 4:5 tile, 1600x2000 master, WebP thumbnails at 400 and 800 wide, prompts from section 2 with the library style string | One render each, best of up to 3 |
| Sample book | 1 book, 6 spreads | Invented family of 3 plus a dog, text-described (as in the golden set), 24-page story, character sheet shown, flip viewer | Book pipeline in live mode, under the owner's cap, once the text-only identity path exists (model evals) |
| Product-in-hand photos | 6 | A printed card and a printed book held by adult hands, no faces | Physical proofs (owner orders) |
| Occasion tiles | 8 | Square, one per home chip, reuse template art | No new renders |
| Style samples | 15 missing | Design owns (Head of Design brief) | Design |

Budget: about 12-40 image renders for covers and hero (about $0.06 each at 2K, measured) plus one sample book (about $1.10-1.64, measured range). Under $10 in total, but it needs an owner dollar cap (standing rule 2). Review against the brand: one persimmon moment per tile, no text in the art, warm and plain, no likeness to any known character.

