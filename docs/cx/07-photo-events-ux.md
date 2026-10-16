# Photo cards, save the dates, invitations: UX spec

Head of CX, 2026-10-14. PROPOSED. Built on the plan, PM roadmap, CTO architecture, 01 standards (all MUSTs apply) and legal 06. Nothing is built yet, so nothing was walked or screenshotted; each screen gets a CX walk at 390 and 1280 before its phase ships. Phase tags follow the PM roadmap: **[P1]** holiday card, ship to me; **[P2]** addresses, mail-for-me, save the dates; **[P3]** events and RSVP.

## 1. Flow A: photos to checkout

Creator shell, step bar ("Step 3 of 6: Back"), sticky phone action bar with one primary button.

1. **Start [P1].** Two equal doors: "Start with a design" (6 templates) or "Start with my photos" (we suggest templates that fit the count and orientation). Samples use no real people and say "Sample".
2. **Photos [P1].** Book intake as is: consent boxes A and B (unticked) before the picker, then "Add photos". Tray thumbnails carry a word: "Ready", "Checking", "May print soft", "Can't use this one". Auto-place uses attention crop, no face recognition.
3. **Arrange [P1].** Tap a slot; toolbar: Swap, Fit, Zoom +/-, Move arrows, Remove. Text edits in a bottom sheet, not on the card. 8 greetings or "Write my own"; font chips. Overflow: "That's a bit long for this spot. Try 32 characters or fewer."
4. **Back [P1].** "From" block, year, optional photo, prefilled from the front.
5. **Proof** (section 4).
6. **Quantity and delivery [P1].** Chips 25 / 50 / 100 with price per card and line total; "Envelopes included" stated. Order-by date above the button ("Order by Dec 5 to arrive by Dec 22"). [P2] Ship to me vs Mail for me as two cards, postage at cost shown before payment.
7. **Addresses [P2].** Upload CSV, Google, vCard, type them, or a saved list, into a review table. Return address prefilled. Count as a sentence: "62 cards mailed, plus 10 extras to you."
8. **Checkout.** Frozen proof thumbnail, quantity, envelopes, postage, tax estimate, delivery range.

## 2. Flow B: event page to dashboard [P3; save-the-date page P2]

1. **Create.** "Add an event page" from the design. One form: title, date, time, time zone, venue, links, RSVP-by, meal choices, party size, optional password, optional "Only invited guests can reply".
2. **Preview** as a guest at 390; the proof checker runs on the page text too.
3. **Share.** Copy link, QR, "Email my guest list", and "The page is unlisted. Only people with the link can see it."
4. **Guest RSVP.** No account. Yes / No / Maybe, party stepper with buttons, meal per person, note. Confirmation: "Thanks, Priya. You said yes for 2. To change it, use the link in your email."
5. **Host dashboard.** Top line in words: "38 yes, 6 no, 21 haven't answered. RSVPs close Apr 30." Tabs: Replies, Not answered, Meals. Actions: Send a reminder (shows who gets it), Export CSV, Close RSVPs, Delete event (dark button; confirm says "Delete the page and 44 replies").

## 3. Key screens and states

| State | Customer sees | Way out |
|---|---|---|
| Empty slot | Photo outline, "Add a photo" | Tap opens picker |
| Too small, warn (< 200 DPI) | Marigold "May print soft: this photo is small for this spot" | Zoom out, smaller spot, Keep it |
| Too small, block (< 150) | "Too small to print sharp" | Swap photo |
| Moderation reject | "We can't use this photo." Link to Acceptable Use | Remove; others kept |
| Upload failed | "That one didn't upload. The rest are safe." | Try again |
| Missing or bad address [P2] | Row says "Needs a street address"; USPS fix as "We suggest: 14 Elm St Apt 2" | Accept, Keep mine, or "Mail these 3 to me instead" |
| Order-by passed | Shown at Start, not at payment: "Christmas delivery has closed. Cards ordered now arrive about Jan 6." | New Year card |
| RSVP deadline passed | "RSVPs closed Apr 30. Contact Sam and Alex directly." | Host: Reopen RSVPs |
| Event closed or unknown | Same "This page isn't available" (no enumeration) | none |

## 4. Proof step that prevents batch typos

On a batch, one typo costs 100 cards.

- **Full-size proof JPEG made from the print PDF**, front and back, "Show cut lines" toggle, pinch zoom on phone.
- **Read-back panel** beside the proof: every text field as large plain text, one per line (names, date, weekday, time, venue, year). Typos are easier to spot in a list than over a photo.
- **Checker warnings** at the top, each with "Fix it" (back to that field) or "It's right": a name spelled two ways, year not 2026, "Saturday, June 14, 2027" is a Monday, a past date, RSVP-by after the event, venue or time missing. A DPI block can't be dismissed.
- **Two unticked boxes**: "I checked the names and dates" and the legal 06 req 39 approval text. The button names the count: "Approve and print 50 cards".
- One line under the button on the batch reprint policy (once the owner approves it).
- [P2] Three sample envelopes from the list, plus the count of unchecked addresses.
- Any edit after approval re-runs the checker and needs a new approval.

## 5. Mobile photo editing

- Card full width, toolbar under it, tray under that; the keyboard never covers the card.
- Drag pans inside the slot, pinch zooms, double tap toggles Fit/Fill. Each gesture has a button twin; rotate is a 90-degree button.
- Swap: tap a tray photo, then a slot. Drag-and-drop is a desktop extra.
- Live "Prints sharp" / "May print soft" badge as zoom changes. Undo always visible. Autosave the design (never photos in session storage). 44px targets, `dvh`, works at 320px.

## 6. Accessibility

- **Keyboard for drag (2.5.7):** slots are buttons in reading order. Arrows pan (Shift for bigger steps), +/- zoom, F fits, S opens a "Swap with" list. Each change is announced with `role=status` ("Photo 2 moved left. Prints sharp.").
- **Alt text:** editor photos are named by position ("Photo 1 of 3, top left"); we never auto-describe children's photos. Event pages offer an optional photo description; the default alt is the event title.
- **Text over photos:** every text slot over a photo needs a scrim or panel, so text keeps 4.5:1 (3:1 at 24px bold) against the darkest or lightest 10% of pixels under it. The engine measures this, and the editor offers "Add a backdrop" when it fails.
- **RSVP form:** WCAG 2.2 AA, error summary, no CAPTCHA puzzle, date and time in words with the time zone. Dashboard counts in text, not only a chart.

## 7. Contact reasons to design away

| Contact | Designed away by |
|---|---|
| "Printed blurry" | DPI warn and block, live badge, 100% proof |
| "Typo on all 100" | Read-back panel, checker, named tick, count on the button |
| "Will it arrive by Christmas?" | Order-by date on Start, quantity and checkout |
| "Are envelopes included?" | Stated on quantity step and summary |
| "My CSV won't import" [P2] | Column mapping preview, sample file, errors per row |
| "Cards came back" [P2] | USPS validation before payment; status per recipient |
| "Can I change my order?" | Edit cut-off time on confirmation and order page |
| "Guest can't change RSVP" | No account; per-guest link |
| "Delete my guests' data" | Delete event or list in two clicks |

## 8. Needs

Design: scrim rule per text slot. Card engineer: effective DPI and contrast in `RenderPlan`, and the keyboard model. Shop: import review states. Support and GC: batch reprint text. Owner: approve that policy, and get the attorney's view on minors' photos and guest data (not legal advice).
