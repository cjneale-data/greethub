# UX/UI standards

Owner: Head of Customer Experience (from 2026-10-10). The CMO keeps brand and marketing; the CTO keeps engineering. This file is the rulebook for how screens behave and feel. Brand tokens are the source of truth (`brand/README.md`, `app/styles/tokens.css`); where a standard below changes a token's use, it says so and says why. A pull request that breaks a MUST needs a CX sign-off comment.

MUST = blocks merge. SHOULD = needs a reason to skip.

## 1. Principles

1. **Say what happens next.** Every screen ends with one obvious next step and says what follows it, in plain words and with a time if one exists.
2. **Never spend the customer's trust or money by surprise.** Price, postage, tax, delivery range, and what is final are shown before the click that commits.
3. **Nothing prints, and nothing is charged, until the customer has looked and said yes.** The proof is the contract.
4. **Children's photos get the quietest, clearest screens in the product.** Fewest words that still tell the truth; a visible way to delete; no dark patterns.
5. **Recovery before apology.** When something fails, the first line says what we did and what the customer can do now; the sorry is short.
6. **Warm, plain, first names.** "Your card's on its way to Sam." Max one exclamation mark per screen. US spelling and words.

## 2. Tokens in use (do not invent others)

Colours: persimmon `#EE5A36` (art, progress, accent word), persimmon-ink `#C8441F` (primary buttons, links, focus), persimmon-deep `#9E3115` (hover; links on cream), persimmon-tint `#FDE3D8`, marigold `#F5B83D` (cocoa text only), blush `#F6C9C0`, plum `#5B2A4B`, cocoa `#2B1E18`, cocoa-70 `#6B5A50`, cocoa-40 `#A99888`, twine `#D9CBB6`, line `#E8DCC8`, cream `#F3EADB`, paper `#FBF6EE`, white.

**Two additions that fix accessibility failures (CX-19).** CTO adds these tokens; no other new colours.

| New token | Value | Use | Ratio |
|---|---|---|---|
| `--gh-control-border` | `#8C7B6E` | border of inputs, selects, chips, checkboxes, switch tracks, upload dropzones | 3.8:1 on paper, 4.1:1 white, 3.4:1 cream (needs 3:1) |
| `--gh-placeholder` | `#6B5A50` (same as cocoa-70) | placeholder text | 6.1:1 on paper |

Rules of use, restated with the failures found:
- `twine` is decorative only (card edges, dividers). It is not a control border.
- `cocoa-40` is for disabled text and inactive icons only. Never for placeholders, helper text, captions or labels.
- Text links and ghost buttons on cream or on tinted fills use `persimmon-deep`. On paper or white, `persimmon-ink`.
- White text on `persimmon #EE5A36` is only allowed at 24px and above bold. Smaller text uses persimmon-ink backgrounds.
- Marigold never carries persimmon text; marigold carries cocoa text (9.1:1).
- Plum with paper text; blush with plum text (7.5:1).
- **One persimmon moment per screen.** The header "Start a card" button is cocoa (`dark`) on every page except the logged-out home hero, so a page's own primary action is the one persimmon moment (CX-25).
- No red, anywhere. Errors are persimmon-ink text plus an icon and words, never colour alone.

## 3. Spacing and layout

- 4pt scale only: 4 8 12 16 20 24 32 40 48 64 96 120. Marketing section gap 120 desktop, 64 mobile. App screens: panel padding 24 (20 on mobile), gap between panels 16, field gap 16, label to input 6 (use 8).
- Content max width 1200 with 28 gutters desktop, 16 gutters mobile. Form and reading columns max 640 (text 65 characters wide). Never show body copy wider than 75 characters.
- One column forms. Two columns only for short pairs that read as one (first and last name, city and state, ZIP and country).
- Breakpoints: 390 (phone, design target), 720 (tablet, tab bar goes away), 1024 (two-pane creator), 1280 (design target desktop).
- Every page uses the same shell: header, `main`, footer (Terms, Privacy, Acceptable Use, Refund & Reprint, Report, Accessibility, Contact, privacy choices, legal name and address). Creator and checkout pages keep the footer (CX-26). Checkout may use a reduced header (logo and "Back to cart") but not drop the footer.
- Mobile: a sticky bottom action bar holds the page's one primary button on every multi-step form (book steps, checkout), above the safe-area inset. The tab bar is for browsing pages only; creators and checkout hide it so the action bar owns the bottom.

## 4. Type

Per brand: Bricolage Grotesque for display and headings, Figtree for everything else.

| Role | Size / line | Weight | Notes |
|---|---|---|---|
| Display | 72/0.95 desktop, 40/1 mobile | 800 | Home hero only |
| H1 | 48/1.05 desktop, 32/1.1 mobile | 800 | One per page. Page title or app screen title |
| H2 | 32/1.1, 24/1.15 mobile | 700 | Panel and section titles |
| H3 | 20/1.25 | 700 | Card and group titles |
| Body | 17/1.6 (16/1.55 in dense app panels) | 400 | Minimum body size 16 |
| UI | 15/1.4 | 600 | Nav, chips, table headers |
| Label | 13/1.4 | 600 | Above fields. Minimum text size anywhere is 12, and only for prices in tile asides and legal footers |
| Button | 16 (14 for sm) | 700 | Never smaller than 14 |

Text must reflow at 320px wide and survive 200% zoom with no horizontal scroll (1.4.4, 1.4.10). No text in images except the logo and the watermark.

## 5. Components and states

Every interactive component implements all eight states: default, hover, focus-visible, active, disabled, loading, error, success. A component without a focus state does not ship.

**Buttons** (pill, Figtree 700): primary persimmon-ink with inner edge; secondary outline in cocoa; ghost; dark; sunny (marigold).
- Heights 36 (sm), 48 (md), 52 (lg). Touch target at least 44 on any device with a coarse pointer: `sm` buttons get a 44px hit area through padding or a pseudo-element.
- Loading: label stays, adds a small spinner on the left, button is `aria-busy` and ignores clicks. Never blank the label.
- Disabled: allowed only when the reason is visible next to the button ("Tick the first two boxes to add photos"). Prefer enabled-with-explanation: clicking an incomplete form scrolls to the first problem and announces it.
- Labels are verbs and objects: "Add to cart", "Redo the sheet", never "Submit", "OK", "Continue" alone.
- Destructive actions use `dark`, not persimmon, and a confirm modal that restates the consequence in the button ("Delete my account").

**Focus (CX-20, replaces the tint-only ring).** All focusable elements: `outline: 3px solid var(--gh-persimmon-ink); outline-offset: 2px;` on `:focus-visible`. The 4px tint ring stays as decoration. Focus is never removed, never clipped by `overflow:hidden`, and never hidden behind the sticky header or action bar (2.4.11): add `scroll-margin-top`/`bottom` equal to those bars.

**Text fields.** Visible label above (13/600), 48px field, radius 14, 1.5px `--gh-control-border`, paper fill, white on focus. Placeholder is an example, never the label or an instruction. Hint text under the field in cocoa-70. Use the right `type`, `inputmode` and `autocomplete` (`given-name`, `email`, `postal-code`, `address-line1`, `address-level1`, `address-level2`). Optional fields say "(optional)"; required is the default (do not star).

**Choices.**
- 2 to 7 single-choice options: `ChipGroup` implemented as a `radiogroup` with arrow-key movement (not `aria-pressed` buttons). The selected chip is cocoa fill, paper text. A selected chip also shows a check icon so selection is not colour only.
- Many options or addresses: native `select` styled to the field.
- Yes/no that takes effect now: `Toggle` (`role=switch`). Yes/no that is submitted later: checkbox. A toggle that cannot be turned off is not a toggle; write a sentence.
- Mode switches (Chat or Form) use proper tabs with panels and arrow keys; filters use the radiogroup chips.

**Checkboxes.** 24px box in `--gh-control-border`, 44px row hit area, label clickable, text beside it is the full legal sentence. Consent boxes start unticked, always.

**Modals.** Radius 22, white, lifted shadow, 40% cocoa scrim. Focus moves in, is trapped, Esc and the close button close it, focus returns to the trigger. Title first, one sentence, primary action, then "Not now" as an equally visible text button. No browser `confirm()`/`alert()` anywhere.

**Toasts.** Only for results of an action the customer just took ("Saved.", "Your card's on its way to Rosa."). Position bottom center above the action bar. `role=status`. Success toasts last 5 s; any toast with an action stays until dismissed (2.2.1). Never the only place an error appears.

**Progress.** `Progress` has an accessible name (`aria-labelledby` the visible label) and shows a plain label ("Step 2 of 6: Photos"). Determinate only when we know the total; otherwise a labelled indeterminate state (section 8).

**Cards and tiles.** Tilt only in browse grids and hero piles. Hover lifts 4px and straightens; with `prefers-reduced-motion` it only changes the shadow.

**Badges.** 12/700. New (marigold, cocoa text), Draft (blush, plum), Sent (cocoa, paper), Promo. Status badges always include a word, never colour alone.

## 6. Forms and validation

1. Validate on blur for format (email, ZIP) and on submit for everything. Do not scold while a person is still typing.
2. On submit with errors: move focus to an **error summary** at the top of the form ("Two things need a look") with links to each field; scroll the first invalid field into view below the sticky header; every invalid field gets `aria-invalid`, its message is linked with `aria-describedby`, and the summary has `role=alert`.
3. Messages say what to do, in the customer's words, without blame. Format: what is needed, then why if not obvious.
   - Bad: "Required." "How old is the reader?" (the label repeated).
   - Good: "Pick a reading age so we match the words to the reader." "Add a name so we can draw them." "That email doesn't look right. Check for typos."
4. Never clear what the customer typed after an error. Never lose a form on refresh: drafts persist (the book form already does; extend to checkout address fields in session storage, never photos).
5. Address forms are US-only: State is a select, ZIP is `inputmode=numeric` with 5 or 9 digits, "ZIP code" not "Postcode", suggest `autocomplete`. PO box rule stays, with its explanation ("We can't deliver hardcover books to PO boxes. Use a street address.").
6. Consent and legal acknowledgements are never pre-ticked, never bundled with marketing, and their wording comes verbatim from the attorney-approved text (docs/legal/06).
7. Free text boxes show a character counter only when within 20% of the limit.

## 7. Error messages

Three tiers, always plain, never with codes in the headline.

| Tier | Where | Pattern | Example |
|---|---|---|---|
| Field | under the field | what to do | "Use a street address; we can't deliver to PO boxes." |
| Action | inline panel in the flow (cream, icon, no red) | what happened, what we did, button | "Page 7 didn't draw. We kept the other 12. [Try page 7 again]" |
| System | full panel or page | what happened, your work is safe or not, two buttons (retry, get help), reference code | "We couldn't reach the print shop. Your order is safe and paid. We'll retry and email you by 5pm. Ref GH-7K2F. [Contact us]" |

Rules: say whether the customer's work and money are safe in the first sentence. Never say "Oops", "Something went wrong" alone, "Invalid", "Error 500", or blame ("You entered..."). Offline: "We lost you for a second. Trying again." with Retry. Every system error shows a short reference code that is logged server-side (CX-34) and quoted in the Contact form.

Payment declines keep the current copy ("Your card was declined. Try another card, or check the details.") and add the specific reason Stripe returns when it is safe to show (expired card, wrong security code, not enough funds, bank needs a check). The cart and order draft always survive.

## 8. Loading and long-wait patterns

Thresholds:
- Under 400 ms: nothing.
- 400 ms to 3 s: cream skeleton blocks at final size (no spinners on page loads).
- 3 s to 20 s (card preview, story draft, character sheet): `Progress` indeterminate with a plain label that changes as work moves ("Reading your notes", "Drawing Rosa's card"), a cancel link, and the first reassurance line.
- Over 20 s (book pages, expected 5 to 15 minutes): the **long-wait pattern**.

**Long-wait pattern for book drawing.**
1. Top: honest estimate in words, set from live data (rolling median render time) with a floor and ceiling: "Drawing your book. About 8 minutes." Never a fake percentage; the bar is `pages done / pages total`.
2. Tiles fill in as pages finish (today's behaviour, keep). Tapping a finished tile opens it large, so the wait is also the first look.
3. Second line, always: "You can close this tab. We'll email {email} the moment it's ready." The email must actually send (proof-ready email, transactional). Show "Email on" with the address.
4. At 15 minutes without completion: copy changes to "This is taking longer than usual. Your pages are safe; we're still on it." and a Contact link appears. At 30 minutes: auto email to the customer, alert to the support inbox with the project id (03 doc).
5. A failed page never fails the book. Failed tiles show "Page 7 needs another try", a Try again button, and the book continues. After two automatic retries we offer "Skip for now, we'll redraw it free" (does not use their re-roll allowance).
6. If the customer returns later, the screen resumes at the right step with a toast "Welcome back. Your book is ready to look through." The account Drafts list shows "Drawing, about 3 minutes left" or "Ready to review".
7. Cancel is available and says what it means: "Stop drawing. Pages already drawn stay."
8. Do not play animated "magic" loops or rotating jokes. One calm state change every few seconds is enough. `prefers-reduced-motion`: no shimmer, static bar.

Never block the whole screen with a modal spinner. Never show a fake 100%.

## 9. Empty states

Pattern: one-line statement of what is here, one line of what it is for, one button that starts the thing. Cream panel, a small tilted illustration only on browse-like pages.
- Cart: "Your cart is empty. Start a card or browse the books." [Start a card] [Browse]
- Drafts: "Nothing saved yet. Drafts you save show up here." [Start a card]
- Orders: "No orders yet. When you order, tracking lives here." [Start a card]
- People: "Save Grandma once and she looks the same in every card." [Add a person]
- Filter with no results: "Nothing for that mix yet. Try fewer filters, or start from a blank page."
- Search in help: "We couldn't find that. Ask us and we'll answer within one business day." [Contact us]

## 10. Mobile patterns

- Design at 390 first. One column. 16 gutters. Body 16 minimum.
- Header collapses to logo, cart, menu on every page. Menu is a full-width sheet with 48px rows.
- TabBar (Home, Explore, Books, Me, raised Create) on browsing pages only; four drawn line icons in the logo stroke weight; active tab has a text label and a bar, not colour alone; hit area 48; respects `env(safe-area-inset-bottom)`.
- Sticky bottom action bar for multi-step forms: one primary button, a one-line status ("Step 2 of 6"), above the safe-area.
- Chip rows scroll horizontally with a visible partial last chip and a fade edge, or wrap if fewer than 8.
- File upload: one button "Add photos" that opens the camera roll and the camera; thumbnails 72px with a 44px remove button; HEIC converts silently (already supported).
- Proof viewer on phone: one spread per screen, swipe and arrow buttons both, pinch to zoom, a "Page 4 of 13" counter that doubles as a seen-pages tracker.
- No hover-only information. No gestures without a visible button alternative (2.5.1, 2.5.7 dragging).
- Keyboard type fits the field (`email`, `numeric`, `tel`).
- Test on a real mid-range Android and a small iPhone; the browser's address bar changes the viewport height, so use `dvh`.

## 11. Motion

- Easing `cubic-bezier(.2,.8,.2,1)`; 150 ms for colour, 200 to 250 ms for transforms; nothing over 400 ms except the card flip (500 ms) and the progress bar.
- Motion carries meaning (a tile appears when a page is done; a card flips to show the inside) never decoration. No parallax, no autoplay loops, no confetti except one small marigold celebration on the confirmation screen, off under reduced motion.
- `@media (prefers-reduced-motion: reduce)`: no transforms except opacity, no tilt animation, no flip (swap instantly), no shimmer. Currently covered in book, creator and shop CSS; add it to the card flip, TemplateCard and toast (CX-23).
- Nothing flashes more than 3 times per second (2.3.1).

## 12. Trust patterns that must appear

| Where | What |
|---|---|
| Every screen with generated art, cart, checkout, confirmation, order page, order emails | "The art is AI-illustrated." (shared `AiNote`, CX-09) |
| Greet Guide start | "You're chatting with an AI." (exists) |
| Before photo upload | The two required consent boxes, the "What happens to your photos" expander, delete-anytime line (exists; CX-07 refines) |
| Proof screen | Spelling check, seen-pages counter, delivery range, total with postage, legal-approved acknowledgement with the Refund & Reprint link |
| Checkout | Delivery range, total including postage, tax line (estimated), "Nothing is charged until you pay", Refund link |
| Footer on every page | Legal name, postal address, support email, policy links |
| Reviews | Only real reviews with consent; sample items labelled "Sample"; no fake or sentiment-filtered reviews (legal 06 req 46) |

## 13. Accessibility checklist (WCAG 2.2 AA)

Run for every PR touching UI; automate with axe in Playwright (CX-35). Tick or explain.

Perceivable
- [ ] Text 4.5:1 (3:1 for 24px/19px bold), UI components and focus 3:1; verified against the token table in section 2.
- [ ] Information not by colour alone (selected chip has a check; error has icon and words; status badges have words).
- [ ] Every image has alt: decorative `alt=""`, generated pages one-line scene description, logo "GreetHub".
- [ ] Zoom 200% and 320px reflow with no horizontal scroll or clipped content; text spacing override does not break layouts.
- [ ] Captions and transcripts for any video.

Operable
- [ ] All functions work by keyboard. Logical tab order. No traps (modals trap on purpose and release on Esc).
- [ ] Skip link "Skip to content" first in tab order, visible on focus.
- [ ] Focus visible with 3px ink outline; not hidden by sticky bars (2.4.11).
- [ ] Targets at least 24px (AA), at least 44px on touch per brand (2.5.8).
- [ ] No drag-only interactions (2.5.7): the proof viewer, upload and reorder all have buttons.
- [ ] No timeouts without warning and extension. Sign-in links say how long they last (15 minutes) and can be re-sent. Toasts with actions persist.
- [ ] Page titles unique and descriptive ("Your proof | GreetHub"). Headings in order, one h1.
- [ ] Consistent navigation and help location: Help link in the header and footer on every page (3.2.6).

Understandable
- [ ] `lang="en"`. Plain language: reading level around grade 7 for UI copy.
- [ ] Labels visible and programmatically tied to fields; `autocomplete` on identity and address fields (1.3.5).
- [ ] Error identification in text, suggestion given, errors announced (3.3.1, 3.3.3).
- [ ] No redundant entry (3.3.7): the shipping address saved once is reused; "To me" copies the buyer address.
- [ ] No cognitive-test sign-in: magic link and Google only; no CAPTCHA that needs puzzle solving (3.3.8). If bot protection is needed, use invisible methods.
- [ ] Consistent component names and placement across pages.

Robust
- [ ] Valid roles and names: tabs only where they behave as tabs, radiogroups for single choice, progressbar named, modals `aria-modal` with a title.
- [ ] Status messages announced with `role=status` or `alert` (4.1.3), without moving focus.
- [ ] Test with VoiceOver on iOS Safari and NVDA with Firefox or Chrome before launch (once). Record results in the accessibility statement.

Also: the Accessibility page lists how to reach us and a 5-business-day response promise; it is real, not a stub.

## 14. Definition of done for a screen

1. Matches this document and the brand kit at 390 and 1280, light only (no dark mode at launch).
2. All eight states designed and built, including loading, empty, error and offline.
3. Copy reviewed against the voice rules and the US-spelling rule.
4. Keyboard pass and axe pass recorded in the PR.
5. Analytics events (docs/cmo/ux-spec.md section 12) fire server-side or consent-gated; none on photo, proof, cart, account pages (legal req 44).
6. Appears in the Playwright flow, with a screenshot saved for CX to review.
7. The help article that explains this screen exists or is updated.
