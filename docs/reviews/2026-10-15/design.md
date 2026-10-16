# Design review, 2026-10-15 (Head of Design)

Sources read: docs/PLAN.md (B10, B14), docs/design/*, docs/design/site-art/approval-log.csv, docs/cmo/templates.md section 3, app/public, app/app/opengraph-image.tsx. Not verified: whether the home page and template pages in the running app actually load the new WebP files (I did not open the app).

## 1. Done vs plan

B10 Real art (plan: 15 samples, two-page consistency test, hero, 12 covers, sample book, Christmas book, Hanukkah and Thanksgiving templates, each IP-checked and logged):
- Style library: 26 styles, 10 categories, schema, selection guide, per-style docs, generated knowledge. Done.
- Style samples: 26 of 26 JPGs in app/public/styles and docs/design/samples. Ahead of plan (plan said 15 missing).
- 12 template covers: masters in docs/design/site-art/masters, 400/800/1200 WebP in app/public/templates (36 files). Done.
- Approval log exists (24 rows read: 12 templates, 12 styles listed) but every row says "Claude (pending owner review)". Nothing is human-approved. The IP vision check column reads "none" flags; QA was a Sonnet text/vision pass, not a person.
- Two-page consistency test per style: NOT done. Book and card ratings (1 to 5) are still estimates from technique, not measurements (01-taxonomy.md line 125 still lists it as to do). The selection guide weights book consistency 0.9 on those estimates.
- Hero pile (2 images), fictional sample book (6 spreads), Christmas book, Hanukkah card, Thanksgiving card: not found in the repo. Merry and Bright (Christmas card) exists; no Christmas book.
- 6 product-in-hand photos: not started (need physical proofs).
B14.2 / B14.7 design side: photo-events-templates.json and .md delivered (sizes, bleed, safe area, themes, suites; validator passes per its header). Holiday templates are layouts only, no art.

## 2. Open design assets
- Template art: hero pile (2); sample book with character sheet (6 spreads); Christmas book cover and pages; Hanukkah card; Thanksgiving thank-you card; 12 covers need owner sign-off. Spring rotation (Mother's Day, wedding off the home grid) is data only.
- Photo-card templates: 6 front + 2 back 5x7 layouts exist as JSON; no rendered previews, no holiday background or decoration art, no save-the-date / invitation / RSVP sample art. Cormorant Garamond is proposed but not in the repo; Bricolage and Figtree need self-hosted TTFs for the PDF renderer. Envelope and postcard address-side zones are unchecked against USPS DMM 201/202 and the mailing partner's template.
- Social templates (Pinterest pins, Instagram, TikTok covers): none exist.
- Email templates (Resend order, proof, shipping, abandoned-cart): no designed HTML/art found in docs/design; needs brand tokens and a safe-for-clients layout. Owner or CMO should confirm who owns the copy.
- OG images: app/app/opengraph-image.tsx is type only (by design, safe). No per-page or per-occasion OG art, no product-in-hand OG. No app icon set (only favicon.ico and logo-mark.svg).
- Brand kit gaps: brand/README.md says logo SVG text must be outlined to paths before app icon/favicon use (not done); no apple-touch / maskable icons; no illustration or iconography spec; no photography direction; no print-product mockup set (book in hand, card in hand); the small GreetHub mark on card backs is still "optional" pending CMO and owner.
- New home page gallery art (plan: public gallery of about 50 fictional samples; CX-01 top trust gap): have 12 covers and 26 style swatches only. Need roughly: 8 occasion tiles (reuse covers, no new renders), 2 hero images, 1 sample book, then a growth set toward 50 (about 35 more) with consistent framing (4:5 and square crops, same WebP ladder), alt text, and approval-log rows.

## 3. Blocked vs can start now
Blocked on owner art-spend approval (OpenRouter cap of about $35 in the plan; I did not check the remaining credit or the ledger total):
- Hero pile, sample book (live book pipeline), Christmas book, Hanukkah and Thanksgiving art, any gallery expansion, two-page consistency renders for 26 styles (about 52 images), re-rolls of any cover the owner rejects.
Blocked on the owner for other reasons: approving the 24 logged images; physical proofs for product-in-hand photos; attorney view on holiday templates and the protected-character table (B14.7, decision 7).
Can start now with no spend:
- Occasion tiles from existing covers; crops and alt text for the gallery.
- Outline logo text to paths and build the icon set; per-page OG layouts (type-only or using approved covers).
- Social and email template layouts as HTML/SVG with tokens (no AI art needed).
- Render photo-card layout previews in mock mode; fonts: add TTFs and licences; USPS zone check from the DMM text.
- Write the consistency test protocol and scoring sheet so the paid run is one command.
- Mock-mode IP checks and approval-log hygiene (add reviewer column format for the owner).

## 4. Quality risks
1. Unapproved art is live: 36 template files and 26 swatches carry only AI self-QA. A bad hand, odd text or accidental lookalike goes to customers. Needs a human pass before launch, and a second IP vision check on the real build.
2. Consistency ratings are guesses. If a style rated 4 or 5 drifts across 24 pages, the book fails the "same child on every page" promise. Test before recommending styles for books; until then consider restricting book picks to the styles we have actually seen hold.
3. Samples show one image per style, not a character across pages, so swatches over-promise.
4. Template covers show AI text rendering; spelling of titles on covers must be checked by eye every time (qa_text false in log means no flag raised, not proven correct).
5. Print fidelity unknown: no physical proof exists. Color (Display vs CMYK), bleed, 300 DPI on 5x7, and thin type on dark backgrounds are unverified. The photo-card DPI rule is not yet in one module.
6. Holiday timing: Hanukkah (Dec 2026) and Christmas art not started, with a Nov 20 ship gate. Any art spend must be approved in days, not weeks.
7. Fonts: serif proposal not licensed in repo; PDF text may fall back and change layout.
8. Gallery volume: 50 samples at 1 to 2 renders each at 2K is cheap per image but approval time is the real cost; people-free or fictional casts only, no real photos.
