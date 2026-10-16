# Photo cards and events: IP safety and photo moderation

IP Safety Engineer, 2026-10-15. Wave 1 deliverable for `docs/products/photo-cards-and-events-plan.md` (section 8, row "IP safety"). Engineering and research, not legal advice. Items marked **[Attorney]** need the owner's attorney before launch; items marked **[U]** are from general knowledge and were not verified against a source this session (no web research was done for this note).

Read for this note: the plan, `docs/design/photo-events-templates.md`, `docs/legal/01`, `05` (ToS s3), `07`, `app/lib/book/moderation.ts`, `app/lib/safety/ip-table.json`.

## 0. What changes compared with books and illustrated cards

| | Books and illustrated cards | Photo cards, save the dates, invitations |
|---|---|---|
| What is printed | AI art we generated | **The customer's own photo, printed as is** |
| Logo or costume in a photo | Warned, then redrawn plain by the image prompt | Nothing redraws it: it prints exactly as uploaded |
| Who made the picture | GreetHub's pipeline | The customer, a relative, or **a hired photographer** |
| Copies | 1 | **10 to 300**, and with mail-for-me we mail them to third parties |
| Where it is shown | Proof, then print | Print **and** a digital event page that guests open |

Two consequences. First, the main IP question moves from "did we generate a look-alike" to "is the customer allowed to print this photo". Second, a moderation miss is multiplied by the batch size and lands in strangers' mailboxes under our return path, so thresholds must be tighter than for a one-off book page.

The design rule from `07` still holds for everything GreetHub generates or writes (AI borders and backdrops, greeting and letter text, the later illustrated portrait): same theme, different characters, never a look-alike. We do **not** alter customer photos to remove things (the design doc already bans generative changes to customer photos, section 5), so for photos the controls are: classify, tell the customer plainly, and block only the narrow cases below.

## 1. Photo moderation thresholds

### 1.1 Change the classifier from booleans to scores

`app/lib/book/moderation.ts` asks the model for five booleans. A boolean gives no way to tune precision and recall, and no "review" band. Proposal for the photo-card path (and later the book path): ask for a 0 to 10 confidence per category, the same scale as `LOOKALIKE_RISK_FAIL_AT`, keep `temperature: 0`, `provider.zdr = true`, and fail closed when the call errors or the JSON is unreadable (as today).

### 1.2 Categories and starting thresholds

Starting values only. They are **not measured**: photo moderation has never been live-tested (`07` section 5). They must be tuned on the eval set in section 6 before launch.

| Category | What it means | Block at | Hold for human review | Warn / info | Notes |
|---|---|---|---|---|---|
| `minor_sexual` | Sexualised depiction of anyone who looks under 18 | **any score of 3 or more** | never (halt, not review) | none | Halt path as today: not stored, displayed or forwarded, metadata-only hook. Procedure is still an open attorney item (`07` s5). Ordinary bath-time babies and beach photos must score 0; the prompt keeps that exclusion. |
| `sexual` | Nudity or sexual content | 6 | 4 to 5 | none | Lower than a book page because of batch size and mailing to third parties. Swimwear and breastfeeding photos must not block: add both to the benign eval cases. |
| `violence_graphic` | Gore, injury, weapons used on people | 6 | 4 to 5 | none | |
| `weapon_visible` | Firearm or hunting scene, no harm to a person | never | never | info only, no customer message | US holiday cards with hunting photos and military dress uniforms are common and lawful. Do not block. Trust & safety decides if event pages need more. |
| `hate_symbol` | Hate symbols or slurs readable in the photo | 6 | 3 to 5 | none | **New category.** Not in the current prompt. |
| `readable_text` | Signs, shirts or captions with readable text | never | 7+ when the text is offensive (from the T&S rules) | info | Feeds the proof checker so text on a shirt is not confused with our layout text. |
| `protected_artwork_primary` | The photo is mostly someone else's artwork: a film still, a screenshot, a poster, comic panel, character illustration or a costumed character performer alone | 7 | 4 to 6 | none | See section 2. |
| `logo_incidental` | A brand logo on clothing, a cup, a stadium | never | never | info only | See section 2. |
| `licensed_costume_worn` | A real person (usually a child) in a character costume or licensed print | never | never | info only | See section 2. |
| `watermark_or_proof` | A visible watermark, "PROOF", a photographer's or stock site's mark | 7 | 4 to 6 | none | See section 3. |
| `professional_cues` | Studio lighting, posed session, photographer logo in a corner, EXIF Artist or Copyright tag set | never | never | triggers the one-line permission note in section 3 | |
| `screenshot_or_web_image` | Phone UI, social-media frame, very low resolution with heavy JPEG artefacts | 8 (when it is also a third-party image) | 5 to 7 | info | Also caught by the DPI rules (design s5). |

"Hold for human review" means the photo stays private, the order cannot be approved, and a person on the trust & safety rota looks at it within the review SLA (T&S to set). If there is no reviewer on duty in December, the review band falls back to **block with a retry message**, never to pass. Reviewers see only the flagged photo, never the address book.

### 1.3 Batch and event-page rules

- **Every photo is screened once at upload**, not per printed copy. The verdict is stored with the photo (category scores only, no image content, no customer text), and approval of a batch requires a verdict for every photo in the design. A missing verdict blocks approval. This avoids the fail-open gap found on the book vision check (`07` s7, first bullet).
- **Re-screen nothing on reprint**, but re-screen if the customer swaps or re-crops a photo (a crop can turn an incidental logo into the main subject).
- **Event pages** show the same photos to guests. They use the same verdict. A guest report on an event page (T&S report flow) unpublishes the page photo while it is reviewed; the printed order is not touched.
- **Guest uploads** (if a later event feature lets guests add photos): out of scope here. They need their own consent and moderation design before they exist.

### 1.4 What the customer sees

Plain, one line, no law, no blame, at most one exclamation mark (brand rules):
- Block: "We can't print this photo. Try a different one." (same text for every block category, so it never hints at the CSAM path).
- Review: "We're taking a quick look at this photo before it can print. You can keep designing."
- Watermark: "This photo has a watermark on it. Ask your photographer for the print-ready file, then add it here."
- Professional cues: see section 3.4.
- Logos and costumes: no message by default (section 2.2).

## 2. Logos and characters visible in customer photos

### 2.1 The cases

| Case | Example | Proposed handling |
|---|---|---|
| A child in a character costume | A four-year-old dressed as an ice princess or a superhero on the holiday card | **Print as is.** No warning shown. Category `licensed_costume_worn` logged for data only. |
| Licensed print or logo on clothing | A sports jersey, a cartoon T-shirt, a brand cap | **Print as is.** No warning. |
| Incidental logos and places | A family at a theme park in front of the castle, a coffee cup, a stadium | **Print as is.** No warning. |
| Costumed character performer with the family | Kids meeting a park character | **Print as is** when real family members are the subject. If the performer fills most of the frame and no family member is clearly the subject, `protected_artwork_primary` decides. |
| The photo IS someone else's character artwork | A screenshot of a cartoon, a photo of a poster, a toy box, a film still | Block at 7, review at 4 to 6. "We can only print your own photos, not pictures of characters or artwork. Try a family photo." |
| A photo of a branded cake or party decorations | A licensed-character birthday cake on a party invitation | Print as is when it is a photo of the real party. Review if the character art is the main subject (score 4 to 6). |

Reasoning (engineering judgement, not a legal conclusion): a personal photo of a real family in which a costume or logo appears is the most ordinary content on any photo-card service, and the competitors listed in the plan print such photos routinely **[U]**. Blocking or warning on it would fail most holiday orders with children and would read as preachy. The risk that matters is the narrower one: GreetHub printing and selling copies of a third party's artwork that the customer merely photographed or screenshotted. Whether "incidental inclusion" or de minimis arguments actually protect a printer that reproduces the photo 200 times is **[Attorney]** (question A1).

### 2.2 Why no warning on costumes, when books do warn

On books the warning exists because the pipeline **redraws** the child and the image model might reproduce the costume. On photo cards nothing is redrawn, so a warning would only make the customer feel judged. The warning returns in two places:
- **Illustrated family portrait (later phase)**: the source photo feeds an image model, so the book rules apply unchanged: `licensed_costume` warning, prompt hardening ("redraw logo or licensed-character clothing plain"), output vision QA with `LOOKALIKE_RISK_FAIL_AT = 6`, one re-roll, then block.
- **AI border or backdrop**: the backdrop prompt is built only from the theme and style id, **never from the photo** and never from what the classifier saw in it. A kid in an ice-princess costume can get the Snow Day theme; the art still goes through `guardLines()` hardening and vision QA like any render.

### 2.3 Text next to the photo

The photo can show a costume, but the words we print are ours to check. Cases:
- "Merry Christmas from our little Elsa" where Elsa is the child's name: left alone by the family-name logic in `fastpass.ts` (the child's name is a customer-supplied known name).
- "From our little [character name] and [character name]" when those are costume nicknames, or "Liam's [franchise] 5th birthday" on a party invitation: today the rules **rewrite franchise names in printed text** (`07` s7, "Printed text"). For party invitations this is a real product conflict: children's parties are routinely named after a franchise, and parents will type it into the headline. Proposal until the attorney answers `07` question 1: keep rewriting the **printed** card and the **page headline**, offer the original theme name with the usual note ("Kept the idea, a pup rescue party, and gave it an original name. Edit anything you like."), and never print franchise logos, fonts or character art. Whether a plain-word theme mention in the event page's body text is acceptable is **[Attorney]** (question A2).

### 2.4 Holiday characters missing from the IP table (finding)

The table has Charlie Brown, Bluey and Paw Patrol, but **not** Rudolph the Red-Nosed Reindeer, Frosty the Snowman, the Grinch, Jack Skellington or Elf on the Shelf (checked by search of `app/lib/safety/ip-table.json`, 2026-10-15). These look generic but are owned characters or brands **[U]**, and they are exactly what holiday card text and AI holiday backdrops will ask for. Generic Santa, reindeer, snowmen and elves are fine and must stay unflagged ("a red-nosed reindeer" alone is a description, not the character, unless combined with the name). I will add these entries with original replacement designs and red-team cases (positives and benign controls such as "our dog Rudy", "frosty morning", "grinchy uncle") as my next change, then rerun `npm run eval:ip -- --mock`. Not done in this wave because the task limited me to this file.

## 3. Professional-photographer copyright (engagement and family-session photos)

### 3.1 The issue

Save the dates are usually built on engagement photos, and many holiday cards on a paid family session. In the US the photographer is normally the author and copyright owner of a photo they took, unless a written agreement says otherwise; a hired independent photographer is usually not a work-for-hire (17 USC 101 and 201) **[U]**. Clients typically receive a **print release** or personal-use licence with the gallery. What it allows varies: some allow any personal printing, some forbid editing, cropping or filters, some require a photo credit, some reserve card products for the photographer's own shop **[U]**. Retail photo labs commonly ask for a copyright release for professional-looking photos **[U]**.

GreetHub cannot read the customer's contract, so the job is: get the warranty, nudge at the right moment, never help remove the photographer's marks, and handle complaints fast.

### 3.2 Controls

1. **Warranty (already drafted).** ToS s3(a): "you own Your Content or have permission to use it". Keep it. Whether it is enough, and whether a click warranty works on a gift order, is the open `07` question 3 / attorney brief Q19.
2. **Watermarks block** (`watermark_or_proof`, section 1.2). A watermarked photo is usually an unpaid proof. We do not print it, and we **never** offer any tool that removes or crops out a watermark, photographer logo or signature. Removing copyright management information can be a separate violation (17 USC 1202) **[U]**, **[Attorney]** question A4. Auto-crop must not be tuned to cut off a corner logo either: if a photographer mark sits in a corner, the crop keeps it or the person moves the photo themselves.
3. **Read EXIF before it is stripped.** At upload, before the photo is downscaled and its metadata discarded, read only the EXIF `Artist` and `Copyright` fields (and IPTC creator if present) and store a single boolean `has_creator_metadata`. Do not store the photographer's name or any other metadata (location data must never be kept). This is a hint, not proof: many professional files have no tags and many phones fill nothing in.
4. **One-line permission note** (section 3.4) when `professional_cues` scores 6 or more or `has_creator_metadata` is true. Not on every photo: a checkbox on every upload trains people to click through.
5. **Optional photo credit.** Offer a small "Photo: [name]" line in the back-side `small` role (design s2), off by default and suggested when the note above was shown. It helps customers whose release requires credit and fits the photographer-partnership plan (Social row in plan s8). The credit is customer-typed text and goes through the safety service like any field.
6. **No editing that a release might forbid, unless the customer chooses it.** We already do no generative changes. Filters and crops are the customer's own actions in the editor. Nothing is applied automatically beyond the face-safe auto-placement, which the person can change.
7. **Complaints.** A photographer complaint goes through the existing `/report` copyright path (good-faith statement and signature). For batch products the takedown process needs new steps that do not exist yet (`07` s6, "Not built"): unpublish the event page photo at once, stop an unprinted batch, and record that a mailed batch cannot be recalled. **[Attorney]** question A5.

### 3.3 What we do not do

- We do not ask customers to upload their print release (friction, and we would then hold a contract with the photographer's details).
- We do not block professional-looking photos. Most of them are licensed for personal printing, and a block would fail most save-the-date orders.
- We do not reverse-image-search photos against the web. It would send customer photos (often of children) to another third party, which the consent flow does not cover.

### 3.4 Copy for the note

"Looks like a photographer took this one. Most print releases cover cards like this, but it's worth a quick check. [I have permission to print it] [Add a photo credit]"

Ticking "I have permission" is stored as a boolean on the design (no free text). It is not a legal shield, only a record that we asked.

## 4. Template originality

### 4.1 What is ours and what is not

Layout forms (full bleed, 2-up, grids, hero plus two, polaroid stack, photo strip, letter back) are common design conventions that every competitor uses; I treat them as unprotectable building blocks **[U]**. The risk is in the specific combination: a competitor's exact arrangement, ornament, lettering and wording. Minted's designs in particular come from independent artists who own or license them **[U]**, so a near-copy of one design is a claim from a real person.

### 4.2 Rules for the template set (Head of Design and CMO own the templates; these are my requirements)

1. **No competitor design as input.** The market-intel teardown (`docs/market/03-photo-cards-and-events.md`) may describe formats, prices and features, but no competitor template screenshot is used as a design reference, put in `docs/design`, given to an image model, or traced. Teardown screenshots, if any, stay in `docs/market` and are labelled "not for design use".
2. **Provenance record per template.** For each layout and theme in `photo-events-templates.json`: author (agent or person), date, the tokens and fonts used, the source of every ornament or pattern (our AI render with style id and render id, or hand-made), and "no external reference used". I propose a `provenance` object per theme; the Head of Design adds it, I check it.
3. **Fonts.** Every face must carry its licence file in the repo and allow PDF embedding. Great Vibes, Allura, Kalam, Gochi Hand and the proposed Cormorant Garamond are believed to be SIL OFL **[U for each; verify the licence file shipped with each TTF]**. OFL allows embedding in PDFs; it forbids selling the font file on its own, which we never do.
4. **AI art on templates** (theme borders, patterns, backdrops) goes through the same controls as book pages: style ids only, never a living artist, studio or brand as a style reference (standing rule 6); `guardLines()` hardening; vision QA including `text_in_image`, `logo_or_brand_mark` and `character_lookalike_risk`; and a human look by the Head of Design before a render becomes a shipped template asset. Style ids such as `deco_geometric` and `midcentury_shapes` name broad movements, which is fine; keep it that way.
5. **Holiday iconography.** Generic Santa, reindeer, snowmen, trees, stars, dreidels and the nine-branch hanukkiah are free to use. Never draw the named holiday characters in section 2.4, and never a specific commercial Santa design.
6. **Theme names.** "Paper Pines", "Red Wool", "Snow Day", "Golden Hour" and the rest have had **no trademark or competitor-name check**. Competitors name individual designs, so overlap is likely. A quick clearance search before the names appear in advertising (same item as `07` s7, last bullet). Owner or attorney.
7. **Default sample photos** in templates must not be customer photos and must not show real people (standing rule 5). Use stock with a model release and a licence that permits use in a product mock-up, or abstract placeholders. Record the licence in the provenance object.

### 4.3 Similarity check (proposed, not built)

Before a template ships, render it with placeholder photos and run one vision call asking whether it closely resembles a known commercial card design (score 0 to 10, flag at 6, same scale as look-alike risk). This is weak evidence, like the look-alike score, but it costs about one cent per template **[estimate, not measured]** and catches an accidental near-copy of a well-known design. Requires a dollar cap from the owner.

## 5. New text paths to wire into the safety service

The collage editor, recipients and event pages add text that is printed or shown to guests. Each needs the same screen as card text (`app/lib/safety/service.ts`, mock when `GREETHUB_MOCK_AI=1`), batched into one call per save:

| Field (design role) | Screen | Notes |
|---|---|---|
| Headline, kicker, subhead, names (`headline`, `kicker`, `subhead`, `names`) | Yes, printed-text rules | Household names ("The Riveras") count as customer-supplied known names, so a family called Mario or Disney is not rewritten. |
| Letter (`body`, up to ~220 words) | Yes | Also the "Write it for me" output, checked on output as today. |
| Caption, sign-off (`caption`, `signoff`) | Yes, as `photo_caption`: bare names are not flagged | The `photo_caption` field type exists in the service but has never been wired (`07` s3). |
| Photo credit (section 3.2 item 5) | Yes | |
| Event page title, description, RSVP questions, meal names | Yes | Shown to guests; T&S also screens for abuse. |
| Photo alt text | Yes (light) | Default "Photo from {names}". |
| Recipient and return addresses (`address`, `address_return`) | **No IP screen, and never sent to the model** | Third-party personal data; a street or person named Mario is not an IP issue. |
| Guest RSVP notes | No IP screen | Not printed; T&S covers abuse. |

The card engineer (`app/lib/collage/`) and shop engineer (`app/lib/recipients/`) own the call sites; I will add the field types and household-name handling in `app/lib/safety/` and red-team cases in `app/tests/fixtures/` in wave 2.

## 6. Eval plan for photo moderation

- **CI (free):** extend the mock marker scheme (`GH_TEST_MODERATION:<category>`) to the new categories and score bands, and test the batch rule "no verdict, no approval".
- **Live set (needs a dollar cap):** about 200 images, built only from (a) AI-generated scenes with no real people, (b) stock photos with model releases whose licence allows testing, and (c) our own non-person shots (logos on mugs, posters, screenshots of our own app, watermarked copies of our own sample art). **Never customer photos, never real children.** Benign controls must outnumber positives and include: bath-time babies, beach swimwear, breastfeeding, kids in costumes, sports jerseys, theme-park backgrounds, hunting and military dress photos, professional engagement shots without watermarks. The `minor_sexual` category is **never** tested with real material of any kind; it is tested by mock only, and the live prompt's exclusions are tested with the benign controls.
- **Targets before launch:** 0 blocks on the benign controls; recall at least 95% on `sexual`, `violence_graphic` and `watermark_or_proof` positives; numbers recorded in `07` section 8 next to the text eval.
- Cost per image for the default classifier: **not measured**.

## 7. Residual risks

- **Photo moderation is untested live.** Every threshold in section 1.2 is a starting guess.
- **Printing a third party's work inside a personal photo** (costume, poster on the wall, logo) is allowed by this design and has not been reviewed by an attorney. At 200 copies it is still reproduction by GreetHub.
- **Photographer rights rest on a click warranty** plus a heuristic note. Unwatermarked professional photos printed against a restrictive release will get through.
- **Mailed batches cannot be recalled.** A takedown after mail-for-me can only stop the next print and the event page.
- **Franchise-themed party invitations** will be rewritten to original names, which some parents will dislike; the alternative depends on the attorney's answer.
- **The holiday-character gap** in the IP table (section 2.4) is open until my next change.
- **Event pages are public to anyone with the link**, so a missed photo reaches more people than a printed card; guest reports are the backstop.
- **Review band staffing in December**: falling back to block means good photos will be blocked when no reviewer is on duty.
- **No guarantee of non-infringement** for templates or AI art; the vision checks are a model's opinion.

## 8. Questions for the attorney

- **A1.** Does incidental inclusion of a costume, licensed print, logo or theme-park landmark in a customer's personal photo create meaningful risk for GreetHub as the printer and seller of 10 to 300 copies? Does it change when we mail them to third parties, or show them on an event page?
- **A2.** Can a franchise name appear as a plain-word party theme on an invitation or event page ("a [franchise] party"), or should it always be rewritten (extends `07` question 1)?
- **A3.** Is the ToS warranty plus a one-line prompt enough for professional-photographer photos, or should we require a stronger confirmation for save the dates?
- **A4.** Confirm that printing a photographer-watermarked image should be blocked, and that we must not offer any watermark or credit removal (17 USC 1202).
- **A5.** Takedown for batch products: what to do with an unprinted batch, a printed but unshipped batch, a mailed batch and a live event page; whether counter-notice applies to customer photos.
- **A6.** Does sending customer photos to the moderation classifier through OpenRouter need anything beyond the existing consent and ZDR setting (same vendor question as `07` question 10, now at much higher volume)?

## 9. Owner asks

- Dollar caps for: the live photo moderation eval (section 6) and the template similarity check (section 4.3).
- Attorney review of section 8 (can be added to `docs/legal/attorney-brief-2026-10.md` by the general counsel).
- Trademark check of the 12 theme names before advertising.
- A decision on December review staffing (or accept "review falls back to block").

## 10. Hand-offs to teammates

- **Book engineer / card engineer:** switch the photo-card moderation call to the scored categories in 1.2, add `hate_symbol`, `protected_artwork_primary`, `watermark_or_proof`, `professional_cues`, `screenshot_or_web_image`, `readable_text`, `weapon_visible`; read EXIF `Artist`/`Copyright` as one boolean before stripping; store a verdict per photo and require it for approval; re-screen on swap or re-crop; keep auto-crop from cutting off corner marks.
- **Card engineer:** wire the fields in section 5 through the safety service; backdrop prompts never built from photo content.
- **Head of Design:** provenance object per theme, licence files for every font, stock-licence record for sample photos.
- **Market intel:** label any competitor screenshots "not for design use" and keep them out of `docs/design`.
- **Trust & safety:** review SLA and rota, offensive-text and hate-symbol rules, guest report flow on event pages.
- **General counsel:** fold section 8 into the attorney brief.
- **Privacy ops:** confirm that the moderation verdict and the EXIF boolean are kept no longer than the photo.
