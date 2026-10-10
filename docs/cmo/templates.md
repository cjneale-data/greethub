# Starter templates and art-style presets

Owner: CMO. Templates fill the browse grid and pre-fill the brief (occasion, product, tone, art style). Cover-art prompts contain no people from photos, no text in the image, no brands, no copyrighted characters. Generic subjects only, so templates render without any user input.

## 1. Art-style presets

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
| 9 | Mum, You Did It | Mother's Day | Card | Heartfelt | `paper_collage` | A big layered paper flower in blush, persimmon and mustard with a small cut-paper teapot beside it, plum background. |
| 10 | Our Summer | Just because | Picture book | Adventurous | `cozy_gouache` | A small wooden rowboat on a calm lake at golden hour with a picnic basket and fishing rods, forested shoreline, warm gouache light. |
| 11 | The Night the Moon Came Down | Birthday | Picture book | Adventurous | `soft_watercolor` | A glowing round moon resting on a hilltop at night while a small child silhouette and a dog look up, deep blue and soft gold. |
| 12 | The Day We Moved In | Moving house | Picture book | Funny | `bold_pop` | A packed removal truck with a wobbling tower of boxes, a houseplant riding up front and a cat perched on top, bright suburban street. |

Notes
- Books #10 to #12 use generic silhouettes so the cover needs no photo. The user's characters replace them in their own story.
- The Eye Story is the hero sample book on Home and the Picture Book page (needs the family's OK and a privacy review of real names/photos before publishing; flag for CEO). It is a showcase, not a template.
- Mix for launch: 9 cards, 3 books; skew to the next 90 days of the calendar (Mother's Day, Father's Day, graduation, back-to-school, Christmas) as templates are seasonal.
- Templates 6 and 8 are the only ones carrying a persimmon-adjacent color in the art; do not place a persimmon Badge on those tiles.
- Cover-art images must be generated once, reviewed by hand, and stored as static assets (not generated per visitor).
