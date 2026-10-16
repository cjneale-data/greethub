# Stock cards: UX flow (v1, mobile first)

Owner: Head of CX. Date: 2026-10-16. Status: proposal for the owner and PM. Builds on docs/cmo/ux-spec.md (sections 2, 8, 9, 11d), docs/cx/01-ux-ui-standards.md and the Handwriting page in docs/cx/06. Not legal advice; the recipient-address and emailing-a-third-party questions go to the attorney (see "Open questions").

## 1. The one rule

Sending a stock card is **pick, write, send, pay**. No chat, no brief, no waiting for art. A guest can reach the pay step in 4 taps and about 60 seconds. Everything else (handwriting, saved people, scheduling) is optional and never blocks the main path.

## 2. Naming and how it differs from AI cards

- Stock cards are called **Ready-made cards**. AI cards are called **Made-for-you cards** ("we draw it from your story"). Never "stock" or "template" in customer copy (spec section 2 already uses "template" for the AI starting points, so avoid mixing).
- Nav and home: two doors side by side. "Send a ready-made card" (the fast door, dark button) and "Make one from scratch" (secondary). The ready-made door is first on mobile.
- Tile label (a Badge in the corner, text not color only): **Ready to send** on ready-made; **Made for you** on AI starters. Same TemplateCard, same tilt rules.
- Different verb on the primary button: Ready-made says "Choose this card"; Made-for-you says "Start with this look". Page H1s: "Cards you can send today" vs "Cards drawn for you".
- Expectation line under ready-made tiles and in the editor: "Already designed. Change the words, add your handwriting, send." Under Made-for-you: "We draw it from your story. About 2 minutes."
- Ready-made cards never show a Greet Guide, a "Re-roll", or a render wait. If a customer wants a different picture, one link: "Want it drawn just for them? Make one from scratch."

## 3. No price on tiles (owner rule)

- No price, "from $", or aside price on any gallery tile, home grid, occasion page or search result. The TemplateCard `aside` slot stays empty for ready-made cards.
- Price appears first on the editor screen (small line under the preview: "$X.XX, printed and mailed" / "Free to email", wording set by the CFO) and in full on the pay screen. Nothing is added at checkout that was not shown on the editor (spec section 9 rule).
- Honesty check: the price line sits above the main button, in cocoa-70 text, and is readable by screen readers. Hiding it until payment is not allowed (legal 06 on price clarity).
- Backlog note: the tile `aside` price in docs/cmo/ux-spec.md section 2 applies to Made-for-you only if the owner wants it there too. Ask.

## 4. Entry points (all land on the same picker or editor)

1. **Home:** hero secondary door "Send a card" plus an occasion chip row ("Thank you", "Birthday", "Sorry", "Thinking of you"). A chip opens Browse filtered.
2. **Browse:** top Segmented `Ready-made | Made for you`, default Ready-made. Same occasion chips.
3. **Shortcut "Send a thank you":** any occasion page, footer, search and the mobile Create sheet get one-tap shortcuts (`/send/thank-you`). It opens the picker already filtered, with a "Pick one" header and the 6 best sellers on screen. Nothing to configure.
4. **From a Saved Person (11d):** on the person's drawer, a button "Send Rosa a card". It opens the picker with Rosa pre-set as the recipient, her name pre-filled in the message ("Dear Rosa,") and her last address offered at the send step. Also: "Rosa's birthday is in 9 days. Send a card?" prompt on Drafts and email (reminders use transactional rules only; no promos, legal 06 req 41).
5. **Reorder:** order page, "Send another to Rosa".
6. **Mobile TabBar Create sheet:** "What are we making?" becomes three rows: Send a ready-made card, Make a card for them, Picture book.

## 5. Flow end to end (taps for a guest, best case)

| Step | Screen | Taps | Time |
|---|---|---|---|
| 1 Find | Home chip or shortcut | 1 | 5s |
| 2 Pick | Picker grid, tap a tile, "Choose this card" | 2 | 15s |
| 3 Edit | Editor: the inside message is already filled; change or keep | 0 to 1 + typing | 20s |
| 4 Hand-touch (members, optional) | Toggle "In my handwriting", signature | 1 | 5s |
| 5 To whom | Name, delivery choice, address or email | 1 (+ typing) | 20s |
| 6 Pay | One screen: summary, pay, done | 1 | 15s |

Target: 4 taps and 60 seconds without typing a new message; 3 minutes with a fully written message and a new address. Measure steps 1 to 6 with the tracking plan (the Head of Data names the events). Guests may pick and edit; paying needs a free account at step 6 (spec locked-for-guest table), created inline with email only, with the card kept. A member with a default address and saved handwriting does steps 5 and 6 in 2 taps ("Send to Rosa, same address" then Pay).

## 6. Screens in words

**Picker.** H1 "Cards you can send today". Occasion chips (scrollable, active chip scrolled into view with a fade edge; 44px). Two-column grid on a phone, four on desktop, no prices. Tiles show the front art, title and a "Ready to send" badge. Tap opens a bottom sheet (full-width modal on desktop) with a big front, a peek at the inside message, and one primary button "Choose this card". Back closes the sheet and keeps scroll position and filters.

**Editor.** Stacked on mobile: front thumbnail (tap to flip), then the message in a large text area, then a sticky bottom bar. The sticky bar holds the price line and the primary button "Next: who it's for". Message: pre-filled and visibly editable ("Tap the words to change them"). Counter shows space left ("34 characters left") and the preview shrinks text rather than clipping; if it still cannot fit, text stays and an inline hint says what will be trimmed. "Put it back the way it was" restores the original. Three suggested lines for this occasion sit in chips ("Add a line"). No chat. A "Use their name" chip inserts the recipient's first name.

**Hand-touch (members).** A Toggle "Write it in my handwriting" appears under the message. Locked for guests and free-tier per membership rules: tapping shows the exact prompt "Add your own handwriting and signature with a free account." (or the membership prompt if handwriting is paid; the owner decides tier). Members see their saved style chip ("Neat print · your signature") with "Change" linking to the style list from the Handwriting page. A live preview re-renders the message in their hand within about 1 second; a signature toggle "Sign it" places the saved signature bottom right and lets them drag nudge or use arrow keys. Preview is labeled "Preview. Printed ink may look a little different." If no handwriting is saved: "Set up your handwriting (2 minutes)" links to the sheet and returns to the card with the draft kept.

**Who it's for.** One screen, three questions. 1) "Who is it for?" name field, with Saved People as avatar chips on top (one tap fills the name, relationship and address). 2) "How should it get there?" Segmented: **We mail it to them** / **We mail it to me** / **Send by email** (digital: email field, optional send date, "Add a note for the email" ). 3) Address: autocomplete with validation before payment (docs/cx/07 rule). "We'll email you a tracking link" line. Gift message is the card, so no extra field.

**Pay.** One screen: small card thumbnail, "To Rosa, Portland OR", line items (card, postage, tax), delivery range ("Arrives Oct 24 to 28"), one primary button "Pay $X.XX". Undo/edit window as for other items (docs/cx/03). Confirmation: "Your card's on its way to Rosa." with order number, tracking steps, and secondary buttons "Send another" and "Add her birthday".

## 7. Copy for key moments

- Picker empty filter: "Nothing for that mix yet. Try fewer filters, or make one just for them."
- Editor intro: "Already designed. Change the words, add your handwriting, send."
- Message too long: "That's a bit long for the space. We'll fit up to 180 characters. Trim a few words?"
- Guest at pay: "Make a free account to send this. Your card comes with you."
- Handwriting not set: "Want it to look like you wrote it? Set up your handwriting once, use it every time."
- Address fails: "We couldn't find that address. Check the street and zip, or choose a suggestion."
- Payment declined: "Your bank said no. Nothing was charged. Try another card?"
- Email delivery confirmation: "Sent. We'll let you know when Rosa opens it" only if the attorney clears open tracking; otherwise "Sent to rosa@..." (no pixel).
- No exclamation marks in this flow except at most one on the confirmation screen.

## 8. Error and edge states

- **Offline or slow save:** autosave the message every few seconds; Toast "We lost you for a second. Trying again." with Retry; the draft is kept in the browser until a save succeeds.
- **Card retired or out of stock:** the tile disappears; a saved draft shows "This card is retired" with three close matches. Never a dead end.
- **Handwriting render fails:** fall back to the plain typed message, keep the toggle on, hint "We'll try again; you can send with typed words now."
- **Print vendor can't make it (bad address, size):** blocked at the address step, not after payment.
- **Profanity or protected names in the edited message:** same moderation path as Made-for-you (docs/legal/07); gentle copy, no accusation: "We can't print this wording. Try different words."
- **Customer content:** messages and handwriting images are customer content; never in logs or analytics (CLAUDE standing rule 5).

## 9. Accessibility

- Whole flow works by keyboard: Tab order follows the visual order, tiles are links with a visible focus ring (`0 0 0 4px persimmon-tint`, 3:1), the picker sheet traps focus and returns it to the tile on close, Escape closes it.
- Card images have real alt text: "Front: watercolor thank-you with sunflowers. Inside: Thank you for everything." The message text area has a persistent label, not placeholder only.
- Live character counter uses `aria-live="polite"` and updates at pauses, not every keystroke.
- Preview flip and tile tilt respect `prefers-reduced-motion` (no tilt, crossfade not flip). No autoplay.
- Handwriting preview has a text alternative (the typed message) and the signature nudge has arrow-key and a numeric "Move" fallback; no drag-only control.
- Segmented controls are radiogroups; badges use text. Errors are inline, linked with `aria-describedby`, and focus moves to the first error. Targets at least 44px on touch; contrast per brand (control-border for inputs, CX-19).
- Zoom to 200% and 320px width with no horizontal scroll; the sticky bar never covers the focused field.

## 10. Acceptance criteria

1. A guest can go from home to the pay screen in 4 taps (no message edit), measured on a 390px device.
2. No price, "from" or aside price shows on any ready-made tile, grid, occasion page or search result (automated check on the TemplateCard).
3. Ready-made and Made-for-you are labeled on every tile and page heading; no Greet Guide or render wait appears in the ready-made path.
4. The editor shows price and delivery range before the main button, and the pay total equals it.
5. A member with saved handwriting applies it with one tap and sees a preview within about 1 second; a guest sees the exact upgrade prompt.
6. Saved Person and "Send a thank you" shortcuts pre-fill recipient and filter; back never loses the filter or edits.
7. Address validation and payment-failure states match section 8, with no charge on failure.
8. Keyboard-only and screen-reader pass of picker, editor and pay (QA with axe plus a manual VoiceOver and TalkBack run); reduced motion honored.
9. Usability test of 5 first-time senders: 4 of 5 send without help in under 3 minutes (docs/cx/04).

## 11. Open questions for the owner

Handwriting tier (member free or Plus only?), digital-only price, recipient email notices and open tracking (attorney), whether Made-for-you tiles may show a price, minimum and maximum message length for each print layout (Design).
