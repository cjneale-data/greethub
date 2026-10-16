# Stock cards: name, positioning and copy

CMO, 2026-10-16. Draft for owner review. Not legal advice. No prices on tiles or in this file: prices come from the CFO's tokens (`{card_ready_digital}`, `{card_ready_mailed}`, to be added) and are not approved. Labels: SOURCED = cited in docs/market; GUESS = mine.

## 1. Names

**Product: Ready Cards.** Plain, says "done, just add your words", and does not collide with "Custom" or "Plus". Rejected: "Stock cards" (reads as a bin of generic filler and, to an AI-assistant listing, as stock photos), "Instant cards" (promises speed we may not keep at print), "Classic" (implies old).

**The two tiers, by what the buyer gets, not by the tech:**
- **Made-for-you cards** (today's product): drawn new from your story. Line: "Drawn for this person, from what you tell us."
- **Ready Cards**: the artwork is already made. You pick one, change the words, sign it. Line: "Already drawn. Pick it, make the words yours, send it."

Why not "AI cards" vs "non-AI cards": it is false. Ready Cards art is also made with AI, ahead of time (GUESS on workflow; confirm with Head of Design). The honest difference is *when* and *for whom* the art is made, so the tiers say that. We say "made with AI" in the FAQ and the card detail page for both tiers, never hide it, and never imply Ready Cards are hand-painted.

## 2. Who it is for, and the moment

The "I just need a nice thank you card, now" person: a thank-you after a dinner, a last-minute birthday, a teacher gift, a get-well. They have the words in their head and no ten minutes for a story chat (the Made-for-you flow takes about ten minutes, site-copy s1). Segments C and E in marketing-plan s2 first, plus anyone who bounced from the story form. They are also the segment most likely to be a repeat buyer (GUESS), which helps the CAC problem in marketing-plan s7.

Not for: the person who wants a card about one specific person and memory. That stays Made-for-you, and we say so, which keeps the top tier meaningful.

## 3. Value props (in this order)

1. **Done in two minutes.** Pick, edit the words, send. No chat, no waiting for art.
2. **Still yours.** The message inside is yours to write. Plus members add their own handwriting and saved signature (membership-landing.md), so a ready-made front can still read as written by hand.
3. **Same paper, same print, same mailing.** Same printers and stock as every GreetHub card. Say this only after fulfillment confirms the same spec.
4. **A little less.** Priced below Made-for-you. Say "a little less" in words only; no figures on tiles.
5. **Sent for you.** Mailed straight to them, like any card.

Deliberately not a value prop: "no AI". See section 8.

## 4. Placement

- **Home:** one band, below "Pick an occasion", above Picture books. Not in the hero: the hero stays "Cards that sound like *you.*" so Ready Cards do not become the first impression of the brand. Chips in "Pick an occasion" lead to a browse page that shows both tiers.
- **Browse (`/cards`):** a segmented control (existing Segmented component), "Made for you | Ready Cards", default Made for you for first-time visitors, remembering the last choice per visitor. On an occasion page ("Thank you"), Ready Cards appear as a row under the Made-for-you start card, labelled, never mixed unlabelled into one grid.
- **Card detail:** a quiet line "Want it about one person? Make one from scratch", linking to Made-for-you. This is the upsell path and the answer to brand cheapening.
- **Tilt and badges:** use TemplateCard with tilt in browse grids. Badge tone `new` (marigold) at launch for the first month only, from dated config (CX-03).

## 5. Copy

**Home band**
- H2: Need one *today?*
- Body: Pick a card that's already drawn. Change the words so they sound like you, and we'll print and mail it. Two minutes, not twenty.
- CTAs: Browse Ready Cards | Or make one from scratch
- Small: Same paper and printing as our custom cards.

**Landing section (browse page header)**
- H1: Ready Cards
- Lede: Already drawn, ready for your words. Thank yous, birthdays, get wells and more.
- Three lines under it: Pick one. Make the message yours. We print and mail it.
- Compare strip: *Ready Cards:* artwork made ahead, words made yours. *Made for you:* artwork drawn new from your story.

**Tile labels (no prices):** title (e.g. "Thank you, with flowers") plus aside "Ready Card"; occasion chip; badge "New" only in month one. Segmented labels: "Made for you" and "Ready Cards". Alt text: describe the card ("Watercolor-style thank you card with a bunch of daisies"), not the model.

**Card detail line:** "Already drawn. Edit the message, add your signature, send."

**FAQ**
- *Is the artwork made with AI?* Yes. We create Ready Card artwork ahead of time with AI tools and check it ourselves. Made-for-you cards are drawn new from your story.
- *Can I change the message?* Yes, everything inside. The front is fixed. (Confirm front is not editable with product.)
- *Can it be in my handwriting?* With GreetHub Plus, yes. Everyone gets the built-in handwriting styles and a typed signature.
- *Will someone else send the same card?* They might. Ready Cards are shared. Want one nobody else has? Make one for you.

## 6. SEO pages ("thank you cards")

The 12 occasion pages (marketing-plan s3, review 2026-10-15 A) are Growth's. Ready Cards make them real: each page can show actual, buyable cards in two minutes, which fixes the thin-page risk where art does not exist yet. Rules:
- Page title and H1 describe the cards that exist: "Thank you cards you can personalize and mail". Do not use "free", "instant download", "handmade", "unique" or "one of a kind" for Ready Cards.
- Ready Cards may be shown as examples of the occasion; label them "Ready Card". Do not present them as custom or as made for the reader.
- "Personalized" is allowed only where the words inside are the buyer's; the front is not personalized.
- Each occasion page offers both paths, so the page matches both searches ("thank you card" and "personalized thank you card"). No keyword stuffing, no doorway pages per city or per name.
- Do not claim page ranking, "best", or a card count we have not shipped. Counts read from the catalog at render time.

## 7. Effect on the marketing plan

- Add Ready Cards to the launch focus as the low-friction entry for segments C and E; keep A and B (picture books, Made-for-you) as the brand story.
- Paid-spend gate item (1): Ready Cards art counts toward "real art on the 12 template tiles" only if Head of Design confirms it passes the brand and IP review. It is a faster route to a real catalog, but the gate still stands.
- CAC: a lower price and faster flow should raise visitor-to-purchase, a lower average order. GUESS, no data. CFO should test margin and AOV, not assume. channel-assumptions.csv is unchanged until there is evidence; I will tell the CFO if any rate moves. Net effect on payback: unknown.
- Assistant-sent cards ("send a thank you to X"): Ready Cards suit this because no art is generated at purchase. Positioning to AI platforms is Integrations' lane; our copy must say the same things (what it is, that the art is shared, that the buyer approves).
- Emails: Ready Cards are natural for reminder and "forgot a card" sends. Copy to follow once the catalog exists.

## 8. Risks and what NOT to claim

**Risks**
- *Cheapening the brand:* mitigate with curated count (start small, around 20 to 30), the same art-direction bar as templates.md, and a visible path up to Made-for-you. Do not bury Made-for-you.
- *Confusing the line:* two tiers, two plain names, one switch, one compare strip. If users cannot say the difference in one sentence in testing, rename. Ask Customer Research to test the labels.
- *Cannibalizing higher-priced cards:* GUESS; watch the mix in the first 60 days.
- *Duplicate cards:* two senders, same card to one recipient. Honest FAQ answer above.
- *Handwriting expectations:* a Ready front with Plus handwriting inside must not be sold as "a card you drew".

**Do NOT claim**
- "No AI", "handmade", "hand-drawn", "original art" or "one of a kind" for Ready Cards.
- "Made just for them" or "unique" for a Ready Card front.
- "Instant", "in seconds" or delivery speed beyond the printer's confirmed dates (cut-offs apply, marketing-plan s4).
- Any price, discount percent or "cheapest", until the owner approves prices and Market Intel confirms the comparison; no competitor names in public lines.
- That art is licensed, exclusive or copyright-protected for the buyer, or that anyone owns it; send to the attorney (AI-generated artwork ownership and AI disclosure wording).
- Likeness of real people, brands, characters or living-artist styles (docs/legal/07-ip-safety-design.md).

**Owner asks:** approve the names "Ready Cards" and "Made for you"; approve that both tiers state "made with AI"; approve Ready Card prices; attorney review of the AI-disclosure and artwork-ownership lines.
