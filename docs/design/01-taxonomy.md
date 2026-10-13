# 01. Style taxonomy

Owner: Head of Design. Written 2026-10-11. Source of truth: `docs/design/style-library.json` (validated by `style-library.schema.json`). Evidence behind each style: `00-research-notes.md`. One guide per style: `styles/<id>.md`. How to choose: `03-selection-guide.md`.

This replaces the thin lists we had: the shared schema's six ids and the CMO's five presets (they did not match). We now have **26 styles in 10 categories**: 21 for books, 26 for cards, 21 shared.

## 1. Two axes

### Axis A. Medium and technique family (what it is made of)

This is the internal organising scheme. Each style is one medium family, described by medium, technique, line, palette, composition, mood and era, never by a living artist, studio or franchise.

| Family | Styles that realise it | Why it earns a place |
|---|---|---|
| Watercolor and gouache | Soft Watercolor, Cozy Gouache Storybook, Moonlit Night, Botanical Garden | Highest-evidence family for ages 0-7 and sentiment cards (R05, R07, R09) |
| Ink and wash | Ink & Wash, Wonky Ink Cartoon | Stationery feel (weddings, sympathy), and the funny-scratchy variant for humor |
| Pencil and crayon | Crayon & Pencil | Naive, wobbly, homemade is a named 2026 direction (R04, R15) |
| Flat vector graphic | Friendly Flat Graphic | The most consistent look for toddlers; bold and colorful card trend (R08) |
| Bold cartoon | Bold Cartoon Pop | Default North American kids' look and the card humor workhorse (R05, R13) |
| Bold shape-based, mid-century | Mid-Century Shapes, Bold Geometric | Bold geometrics are a named card trend (R06, R16) |
| Block print | Block Print | Folk and earthy palettes (R05, R06) |
| 3D soft-animated look | Soft 3D Animated | What AI-book buyers expect (R09, R10) |
| Animated 2D, big-eyed | Storybook Anime | Big-eyed emotion-led design is a major 2026 influence (R04) |
| Paper-cut collage | Paper Cut Collage | Tactile and stands out (R05, R15) |
| Textile (felt, thread) | Felt & Thread | Tactile trend, craft menus (R12, R15) |
| Clay and stop-motion look | Clay Models | On AI menus (R12); silly 4-8 |
| Comic and graphic novel | Comic Strip | Ages 8-10 and gaming birthdays (R05, R09) |
| Vintage storybook | Vintage Storybook | Heritage and nostalgia (R04) |
| Painterly realism | Painted Portrait | Grown-up gifts, pets, memorials (R05, R09) |
| Photoreal and cinematic | Cinematic Photo Look (beta) | Offered on purpose; riskiest end of the valley |
| Pastel and chalk | Dreamy Pastel | Baby and bedtime; pastel plus metal accents (R07) |
| Minimalist line art | Minimal Line Art | Wedding, sympathy and board books (R05, R07) |
| Typographic and hand-lettered | Hand-Lettered Note | Handwritten revival (R06, R16): the picture is a frame, we set the type |
| Foil and luxe | Gold & Luxe | Premium stationery and listings (R14, R17); the picture imitates, the printer foils |
| Pattern and maximalist | Party Pattern, Bold Geometric | Maximalism for congratulations and holidays (R07, R08) |

Not included, with reasons. Plastic-brick and voxel-pixel looks (on a competitor menu, R09) imitate trademarked toys and games and make look-alike risk the point of the style. Wimmelbuch (dense search-and-find scenes) breaks our text-left, art-right layout and our exact-count and consistency rules. A scribble-doodle look is covered by Crayon & Pencil and Wonky Ink Cartoon.

### Axis B. Fit (who and what it is for)

Every style carries these fields and the recommender scores them (`app/lib/intake/knowledge/styles/recommend-core.ts`):

- **Product:** book, card, or both.
- **Age band:** 0-3, 4-7, 8-10. For cards the band is the recipient's, with 8-10 standing for grown-up as well (anniversary, wedding), because older kids and adults share the same visual taste.
- **Occasion:** the brief's occasion ids plus bedtime, adventure, new home, teacher, retirement, pet, back to school. Listed most central first (the first entry breaks ties).
- **Tone:** silly, tender, adventurous, elegant, bold. The brief's funny maps to silly then bold; heartfelt to tender then elegant; adventurous to adventurous then bold.
- **Character-consistency suitability:** book and card ratings 1 to 5. A book needs the same character on 14 pages; a card needs one. Ratings come from the Eye Story lessons and from the sample renders (section 4), and flag where a style is estimated, not measured.
- **Risk:** IP closeness, uncanny valley, age appropriateness.

## 2. Ten categories a customer can browse

Plain names in the GreetHub voice. These are what the picker shows.

| # | Category | One-line blurb | Styles |
|---|---|---|---|
| 1 | **Soft & Watery** | Gentle washes of color. Think baby showers, grandma and bedtime. | Soft Watercolor, Ink & Wash, Dreamy Pastel |
| 2 | **Cozy Storybook** | Warm, lamplit, classic picture-book charm. | Cozy Gouache Storybook, Vintage Storybook, Moonlit Night |
| 3 | **Bold & Silly** | Big shapes and bright color, built to get a laugh. | Bold Cartoon Pop, Friendly Flat Graphic, Comic Strip |
| 4 | **Cut, Stitched & Handmade** | Looks you could almost touch: paper, felt and clay. | Paper Cut Collage, Felt & Thread, Clay Models |
| 5 | **Retro & Graphic** | Bold shapes and old-school printing. | Mid-Century Shapes, Block Print |
| 6 | **Sketchy & Homemade** | Crayon, pencil and wobbly pen. Happily imperfect. | Crayon & Pencil, Wonky Ink Cartoon |
| 7 | **Big-Screen Bright** | Glowy, rounded, animated-film looks. | Soft 3D Animated, Storybook Anime |
| 8 | **Lifelike & Cinematic** | Painted or photographic realism for grown-up moments. | Painted Portrait, Cinematic Photo Look (beta) |
| 9 | **Clean & Simple** | Fine lines, open space and hand lettering. | Minimal Line Art, Botanical Garden, Hand-Lettered Note |
| 10 | **Fancy & Fabulous** | Gold, geometry and show-off pattern. | Gold & Luxe, Bold Geometric, Party Pattern |

Why these names: a customer says "soft", "funny", "like a movie", "handmade", "fancy". They do not say "gouache". Categories answer the question "what feel do I want?", and the style card then shows the sample, the swatches and the one-line description.

## 3. The full matrix (snapshot of the JSON)

| Style | Category | Products | Ages | Tones | Book / card consistency | Popularity | Sample |
|---|---|---|---|---|---|---|---|
| Soft Watercolor (`watercolor_wash`) | Soft & Watery | book, card | 0-3, 4-7 | tender, adventurous | 3 / 5 | high | rendered |
| Ink & Wash (`ink_wash`) | Soft & Watery | book, card | 4-7, 8-10 | elegant, tender | 3 / 4 | medium | colors only |
| Dreamy Pastel (`pastel_chalk`) | Soft & Watery | book, card | 0-3, 4-7 | tender | 2 / 4 | medium | colors only |
| Cozy Gouache Storybook (`cozy_gouache`) | Cozy Storybook | book, card | 4-7, 8-10 | adventurous, tender | 4 / 4 | medium | rendered |
| Vintage Storybook (`vintage_storybook`) | Cozy Storybook | book, card | 0-3, 4-7 | tender, silly | 4 / 4 | medium | colors only |
| Moonlit Night (`moonlit_night`) | Cozy Storybook | book, card | 0-3, 4-7 | tender, adventurous | 3 / 4 | niche | colors only |
| Bold Cartoon Pop (`bold_cartoon_pop`) | Bold & Silly | book, card | 4-7, 8-10 | silly, bold | 5 / 5 | high | rendered |
| Friendly Flat Graphic (`flat_vector_friendly`) | Bold & Silly | book, card | 0-3, 4-7 | silly, bold, tender | 5 / 5 | high | colors only |
| Comic Strip (`comic_panel`) | Bold & Silly | book, card | 8-10 | adventurous, silly, bold | 4 / 4 | niche | colors only |
| Paper Cut Collage (`paper_cut_collage`) | Cut, Stitched & Handmade | book, card | 0-3, 4-7 | silly, bold, tender | 3 / 5 | medium | rendered |
| Felt & Thread (`felt_thread`) | Cut, Stitched & Handmade | book, card | 0-3, 4-7 | tender, silly | 3 / 4 | niche | colors only |
| Clay Models (`clay_stopmotion`) | Cut, Stitched & Handmade | book, card | 4-7, 8-10 | silly, adventurous | 3 / 4 | niche | colors only |
| Mid-Century Shapes (`midcentury_shapes`) | Retro & Graphic | book, card | 4-7, 8-10 | bold, elegant, silly | 4 / 5 | medium | rendered |
| Block Print (`block_print`) | Retro & Graphic | book, card | 4-7, 8-10 | elegant, adventurous, bold | 3 / 4 | niche | colors only |
| Crayon & Pencil (`crayon_pencil`) | Sketchy & Homemade | book, card | 0-3, 4-7 | silly, tender | 3 / 5 | emerging | rendered |
| Wonky Ink Cartoon (`wonky_ink_cartoon`) | Sketchy & Homemade | book, card | 4-7, 8-10 | silly, bold | 3 / 5 | medium | colors only |
| Soft 3D Animated (`soft_3d_animated`) | Big-Screen Bright | book, card | 4-7, 8-10 | adventurous, silly, tender | 3 / 3 | high | rendered |
| Storybook Anime (`anime_inspired`) | Big-Screen Bright | book, card | 4-7, 8-10 | adventurous, tender, bold | 3 / 4 | high | rendered |
| Painted Portrait (`painterly_realism`) | Lifelike & Cinematic | book, card | 8-10 | elegant, tender | 2 / 3 | niche | rendered |
| Cinematic Photo Look (`cinematic_photoreal`) | Lifelike & Cinematic | card, book | 8-10 | elegant, bold, adventurous | 1 / 3 | niche | colors only |
| Minimal Line Art (`minimal_line_art`) | Clean & Simple | card, book | 0-3, 8-10 | elegant, tender | 3 / 5 | high | rendered |
| Botanical Garden (`botanical_gouache`) | Clean & Simple | card | 4-7, 8-10 | tender, elegant | 2 / 5 | high | colors only |
| Hand-Lettered Note (`hand_lettered_type`) | Clean & Simple | card | 4-7, 8-10 | tender, elegant, bold | 1 / 5 | high | colors only |
| Gold & Luxe (`foil_luxe`) | Fancy & Fabulous | card | 8-10 | elegant, bold | 1 / 5 | medium | rendered |
| Bold Geometric (`deco_geometric`) | Fancy & Fabulous | card | 8-10 | bold, elegant | 1 / 5 | medium | colors only |
| Party Pattern (`maximalist_pattern`) | Fancy & Fabulous | card | 4-7, 8-10 | bold, silly | 1 / 5 | emerging | colors only |

Card-only styles are the ones with no character to keep consistent (frames, ornament, pattern, botanicals). Their book rating is 1 or 2 because we do not offer them for books.

## 4. What the sample renders showed (2026-10-11)

One neutral original scene (a child in a yellow raincoat and a small fox in a meadow; no photos, no real people, no logos), one render per style at 1K through the pipeline's image chain, 11 styles, **$0.409** live spend of the $0.45 cap. Thumbnails: `docs/design/samples/` and `app/public/styles/`. The other 15 show a generated swatch placeholder and are marked "Colors only", never passed off as samples. Each render is one image, so it shows how well the style *lands*, not how well it *holds a character across pages*. Consistency ratings for unrendered styles are estimates.

| Style | Verdict | What I saw |
|---|---|---|
| Bold Cartoon Pop | Excellent | Thick outline, flat fills, expressive faces, exactly two characters, no text. The one I would ship first. |
| Soft Watercolor | Good | Soft washes and paper grain, gentle faces; reads closer to wash over pencil than wet watercolor; the coat drifted from yellow to pale mustard. |
| Cozy Gouache Storybook | Good, one fault | Rich velvety texture. It drew a cream frame with a rounded vignette, which would print as a white border; the FULL-BLEED line did not fully stop it, so the white-border QA check must stay on. |
| Paper Cut Collage | Good | Convincing layers, shadows and a torn edge. Faces are smoother than real cut paper, and the side-on child pose differs from the fox's pose, so expect face-shape drift across pages. |
| Mid-Century Shapes | Good | Geometric shapes, limited palette, large negative space. A teal pond crept in but stayed in range. |
| Crayon & Pencil | Fair | Reads as tidy colored pencil, not a child's wobbly crayon. The string was strengthened (waxy uneven strokes, color over the lines); not re-rendered. |
| Soft 3D Animated | Partial | Warm glow and a plush fox, but a painterly-3D hybrid, not a true 3D render. Acceptable as an "animated film glow". |
| Painted Portrait | Good | Soft oil look, natural light, no uncanny face. The child came out younger and more idealized than asked, the safe side of the valley. Likeness from a real photo is untested. |
| Minimal Line Art | Fair | Lovely line and white space, but it filled coat and hair with flat color, so it is less minimal than named. |
| Gold & Luxe | Good | Wreath of fine gold-look line on midnight with an empty center, as wanted. Gold is printed ink only. |
| Storybook Anime | Weak | Came out as a soft western storybook with few animation cues (no large glossy eyes, no cel shading). The painted sky was good. The string was strengthened (very large glossy eyes, thin colored lineart, flat cel shading); not re-rendered for budget. |

Across all 11: no text, logos or lookalike characters appeared; every render used both requested characters and a yellow coat with chestnut hair, which suggests the hair and outfit anchors carry across styles. Two things the renders did not test: a real photo as input, and the same character on a second page.

## 5. Open items for the next design pass

- Re-render Storybook Anime and Crayon & Pencil with the strengthened strings, then render the 15 placeholders as budget allows.
- Run a two-page consistency test per style (same character, two scenes) to turn estimated ratings into measured ones.
- Add the card-only fonts to `pipeline/fonts` (only Andika and Chewy are embedded today). Fonts named in the style guides are open-license Google Fonts.
- Ask the attorney whether offering a "closest style" note to a franchise-look request (see 03 section 5) is acceptable wording.

Status check, 2026-10-12 (platform assessment, PLAN.md "Head of Design"):

- Nothing sets type on a card front. `layoutCard` prints the front art only, so Hand-Lettered Note (and the empty centers of Gold & Luxe and Bold Geometric) would print with no words. Either the card layout sets a front line in the style's `card.typography`, or these looks stop being recommended until it does.
- Every image prompt ends with the shared guard lines (full-bleed, no frame, nothing in the outer 12%, no text). Style strings must not ask for a frame, border or vignette. Block Print ("framed composition") and Felt & Thread ("sewn thread borders") did; both are reworded. The card-only frame looks still pull against the guard, so test them before relying on them.
- Every measured run so far used one legacy style. Ratings for all 26 styles are still single-image or estimated.
