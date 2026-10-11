# 03. Selection guide: how to recommend a style

Owner: Head of Design. Written 2026-10-11. For the Greet Guide, the style picker and anyone writing copy. The code that does this: `app/lib/intake/knowledge/styles/recommend.ts` (server, with free-text search) and `recommend-core.ts` (the same rule score, runs in the browser for the picker). The data: `style-library.json`. Voice rules: warm, plain, first names, one exclamation mark at most per screen (`docs/cx/01-ux-ui-standards.md`).

## 1. The rule in one line

Score every style that exists for the product on occasion, tone, age and character-consistency need, add a small popularity nudge, and show the top 3 as "Recommended for you" with a one-line why. Everything else stays browsable by category.

## 2. How the score works

| Signal | Points | Notes |
|---|---|---|
| Occasion is in the style's occasion list | +3, plus up to +0.6 for how central it is | Lists are ordered most central first, which breaks ties |
| Tone matches | +2.5 for the first mapped tone (+0.4 if it is the style's lead tone), +1.5 for the second | funny = silly then bold; heartfelt = tender then elegant; adventurous = adventurous then bold |
| Age band matches | +2 (and -1 when the band is known and does not match) | Books: reading age 0-2 = 0-3; 3-5 = 4-7; 6-8 = 4-7 and 8-10. Cards: recipient age if known |
| Book consistency | (bookRating - 3) x 0.9 | Only when the customer needs characters to stay recognisable; default for books |
| Card consistency | (cardRating - 3) x 0.2 | Small: one picture only |
| Popularity | +0.6 high, +0.3 medium, +0.2 emerging | A nudge, not a driver |
| Free-text match (server only) | up to +4 | BM25 over the style documents, so "soft and watery" finds Soft Watercolor and Dreamy Pastel |
| Franchise-look request (server only) | +10 | The generic equivalent (section 5) |

Styles that do not exist for the product (a gold foil style for a book) are never returned. The beta Cinematic Photo Look is only returned when the customer asks for realistic or photo looks.

## 3. Starting points (snapshot of the scorer, top 3 per cell)

Cards, by occasion and tone:

| Occasion | Funny | Heartfelt | Adventurous |
|---|---|---|---|
| Birthday | Bold Cartoon Pop; Friendly Flat Graphic; Wonky Ink Cartoon | Soft Watercolor; Hand-Lettered Note; Botanical Garden | Storybook Anime; Soft 3D Animated; Soft Watercolor |
| New baby | Friendly Flat Graphic; Paper Cut Collage; Felt & Thread | Soft Watercolor; Friendly Flat Graphic; Dreamy Pastel | Soft Watercolor; Moonlit Night; Friendly Flat Graphic |
| Thank you | Friendly Flat Graphic; Paper Cut Collage; Bold Cartoon Pop | Hand-Lettered Note; Botanical Garden; Soft Watercolor | Soft Watercolor; Cozy Gouache Storybook; Block Print |
| Wedding | Bold Geometric; Gold & Luxe; Hand-Lettered Note | Botanical Garden; Minimal Line Art; Hand-Lettered Note | Block Print; Bold Geometric; Gold & Luxe |
| Anniversary | Mid-Century Shapes; Hand-Lettered Note; Bold Geometric | Hand-Lettered Note; Minimal Line Art; Botanical Garden | Block Print; Hand-Lettered Note; Bold Geometric |
| Get well | Bold Cartoon Pop; Wonky Ink Cartoon; Crayon & Pencil | Soft Watercolor; Botanical Garden; Storybook Anime | Storybook Anime; Soft Watercolor; Comic Strip |
| Congratulations | Bold Cartoon Pop; Friendly Flat Graphic; Wonky Ink Cartoon | Friendly Flat Graphic; Paper Cut Collage; Soft 3D Animated | Soft 3D Animated; Comic Strip; Clay Models |
| Mother's Day | Paper Cut Collage; Crayon & Pencil; Vintage Storybook | Botanical Garden; Soft Watercolor; Hand-Lettered Note | Soft Watercolor; Hand-Lettered Note; Paper Cut Collage |
| Father's Day | Bold Cartoon Pop; Wonky Ink Cartoon; Crayon & Pencil | Vintage Storybook; Crayon & Pencil; Cozy Gouache Storybook | Cozy Gouache Storybook; Bold Cartoon Pop; Mid-Century Shapes |
| Valentine's Day | Hand-Lettered Note; Storybook Anime; Gold & Luxe | Hand-Lettered Note; Dreamy Pastel; Minimal Line Art | Storybook Anime; Hand-Lettered Note; Gold & Luxe |
| Christmas | Soft 3D Animated; Vintage Storybook; Party Pattern | Vintage Storybook; Cozy Gouache Storybook; Felt & Thread | Cozy Gouache Storybook; Soft 3D Animated; Block Print |
| Graduation | Bold Cartoon Pop; Paper Cut Collage; Party Pattern | Paper Cut Collage; Storybook Anime; Soft 3D Animated | Storybook Anime; Soft 3D Animated; Comic Strip |
| Sympathy | Hand-Lettered Note; Minimal Line Art; Botanical Garden | Hand-Lettered Note; Botanical Garden; Soft Watercolor | Soft Watercolor; Moonlit Night; Hand-Lettered Note |
| Just because | Friendly Flat Graphic; Bold Cartoon Pop; Wonky Ink Cartoon | Hand-Lettered Note; Soft Watercolor; Friendly Flat Graphic | Storybook Anime; Soft Watercolor; Soft 3D Animated |

Books, by reading age and tone (consistency need on):

| Reading age | Funny | Heartfelt | Adventurous |
|---|---|---|---|
| 0-2 | Friendly Flat Graphic; Vintage Storybook; Paper Cut Collage | Friendly Flat Graphic; Vintage Storybook; Soft Watercolor | Friendly Flat Graphic; Soft Watercolor; Moonlit Night |
| 3-5 | Bold Cartoon Pop; Friendly Flat Graphic; Mid-Century Shapes | Friendly Flat Graphic; Vintage Storybook; Cozy Gouache Storybook | Cozy Gouache Storybook; Bold Cartoon Pop; Friendly Flat Graphic |
| 6-8 | Bold Cartoon Pop; Friendly Flat Graphic; Mid-Century Shapes | Friendly Flat Graphic; Vintage Storybook; Cozy Gouache Storybook | Cozy Gouache Storybook; Bold Cartoon Pop; Friendly Flat Graphic |

These are what the code returns today; they will move if the JSON changes. Treat them as defaults, not rules. Where a cell reads oddly (a funny wedding), the customer's own words and the browse list are the fix.

## 4. Decision tree for the Greet Guide

Ask only what is missing; the brief already carries product, occasion, tone and, for books, reading age.

1. **Did they already name a look?** ("watercolor", "paper cut", "like a movie"). If the words match a style (`findStyleInText`) or a franchise-look phrase (section 5), confirm that style in one sentence and skip to step 6.
2. **Product.** Book or card changes the pool: card-only styles (Botanical Garden, Hand-Lettered Note, Gold & Luxe, Bold Geometric, Party Pattern) never show for books.
3. **Is it a book that must keep the same child on every page?** If yes (the default), favor Friendly Flat Graphic, Bold Cartoon Pop, Mid-Century Shapes, Cozy Gouache Storybook and Vintage Storybook, and say why in one line ("this look keeps your child recognisable from page to page"). Only offer Dreamy Pastel, Painted Portrait or the photo look for a short book or when they ask.
4. **Is it a grown-up occasion?** (wedding, anniversary, sympathy, retirement). Lead with Clean & Simple and Fancy & Fabulous for cards; Ink & Wash and Soft Watercolor work for both. Never lead with Bold & Silly unless tone is funny.
5. **Tone.** Funny: Bold & Silly first, then Sketchy & Homemade. Heartfelt: Soft & Watery and Clean & Simple. Adventurous: Cozy Storybook and Big-Screen Bright.
6. **Show three, with a why each.** Offer the top 3 as quick-reply chips by name (the quick replies already do this) and say "or browse them all in the Style step". If they pick none, ask one short question ("Softer or bolder?") and re-rank.
7. **Do not ask them to describe art terms.** If they say "I don't know", pick the top 1, say why in a line, and let them change it.
8. **Confirm and move on.** "Soft Watercolor it is. Warm and gentle." Do not re-ask the style after it is set unless they bring it up.

Sample lines (US spelling, at most one exclamation mark):

- "For a new baby, I'd go soft. Soft Watercolor, Dreamy Pastel, or Friendly Flat Graphic. Which sounds like them?"
- "Dad's birthday and funny? Bold Cartoon Pop is the loud one. Wonky Ink Cartoon is the goofy one."
- "Your child will be in all 14 pictures, so I'd pick a look that keeps them recognisable. Bold Cartoon Pop is the steadiest."

## 5. Customers who ask for a famous look

People say things like "like a Disney movie", "Pixar-looking", "anime", "Studio Ghibli-like", "Dr. Seuss-y", "Frozen-style". The rule from `docs/legal/07-ip-safety-design.md` stands: same theme, different characters, and no franchise, studio or artist name in any prompt or note.

How it works:

1. Each style carries `ipSafeAliases`, the customer phrases that map to it. Examples: movie, studio and princess-film phrases go to **Soft 3D Animated**; "anime", manga and the well-known hand-painted animation studio phrases go to **Storybook Anime**; the rhyming-doctor phrases go to **Wonky Ink Cartoon**; the tissue-collage caterpillar phrases go to **Paper Cut Collage**; clay-animation duo phrases go to **Clay Models**.
2. The aliases are matched in code against the customer's text only (`matchIpSafeAlias`). They are never indexed in retrieval, never in a style string and never in a note shown to the customer. A test fails if any alias, franchise name or artist name appears in a style string, avoid list, tag, synonym or retrieval document.
3. When the Greet Guide or the book form sees such a phrase, the IP-safety layer attaches a `styleOffer` to its result (`withStyleOffers`, `app/lib/safety/style-offer.ts`). The customer sees one friendly line, for example: "We make our own looks, so here is the closest one: Soft 3D Animated. Glowy and cinematic, the closest thing to a movie poster of your family. Change it any time." They get a one-tap "Use Soft 3D Animated" button (picker) or a chip with the style name (chat).
4. The offer is only an offer. The customer's characters are still rewritten to original designs by the normal IP pass; the style does not make a look-alike safe, and the output vision check stays on.
5. Ordinary words are untouched ("a frozen pond", "cartoon animals").

Do not promise a match: say "closest", not "same as". Do not mention law. Do not apologise.

## 6. Mixing styles inside one book: don't

One book, one style, from cover to The End. Reasons: the character model sheet is made in one style and every page restates the same style string, which is how consistency is kept (the Eye Story lesson); a mid-book style change reads as an error, not a choice; and the print proof is judged as one object. Specific rules:

- The style id is set once in the brief and locked when the model sheet is approved. Changing it after approval means a new model sheet and a fresh run.
- Do not blend two style strings into one prompt ("watercolor and 3D"). Pick one.
- A different style for the cover than the pages is not offered either.
- A card that has an inside illustration uses the same style as the front.
- Mixed packs (a card and a book for the same person) may use different styles, but when the person is the same character, offer the same style so the saved Person looks the same.

## 7. When the picker and the chat disagree

The brief's `artStyle` is the single value both write. The chat's chips and the form's picker rank with the same rule score, so they should agree on the top 3. When they do not (the server also uses the customer's free text), the chat's first suggestion wins for the chat and the picker stays as the customer last set it. Never overwrite a chosen style silently.

## 8. Backward compatibility

Old ids still work and resolve to a current style (`LEGACY_STYLE_MAP`):

| Old id (source) | Resolves to |
|---|---|
| `watercolor` (shared schema) and `soft_watercolor` (CMO) | `watercolor_wash` |
| `storybook_ink` (shared) and `ink_wash` (CMO) | `ink_wash` |
| `paper_cut` (shared) and `paper_collage` (CMO) | `paper_cut_collage` |
| `bold_flat` (shared) and `bold_pop` (CMO) | `bold_cartoon_pop` |
| `crayon` (shared) | `crayon_pencil` |
| `storybook_3d` (shared) | `soft_3d_animated` |
| `cozy_gouache` (CMO) | `cozy_gouache` |

The earlier mismatch: the shared schema had six ids; the CMO had five presets with different ids; the app mapped the CMO's "Cozy Storybook" to `storybook_3d`, whose prompt actually described a 3D look. We now keep the id's real prompt (`storybook_3d` is the 3D look) and give the cozy lamplit look its own id, `cozy_gouache`, as the default for Christmas and adventure. New briefs store the canonical id; stored drafts and older clients keep working.
