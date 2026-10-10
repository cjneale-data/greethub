# GreetHub UX spec (v1, web first)

Owner: CMO. Consumers: CTO (builds the screens), CFO (funnel steps map to conversion rates).

Kit components used: SiteNav, TabBar, Button (primary / secondary / ghost / dark / sunny), TextField, Chip/ChipGroup, Toggle, Segmented, Badge (new / draft / sent / promo), Progress, TemplateCard (tilt), Avatar/AvatarStack, Toast, Logo.

## 0. Global rules

**Brand rules applied to every screen**
- One persimmon moment per screen. That is the primary Button, or the accent word in an H1, or the Progress bar. Never two. Wireframes mark it `[P]`.
- If an H1 carries the persimmon accent word, every CTA on that screen uses `dark` or `secondary`.
- Max one exclamation mark per screen, counting Toasts. Default is zero. This spec uses none.
- Voice: warm, plain, first names ("Your card's on its way to Sam."). Never "Order #4821 has been successfully processed."
- Tilted TemplateCards only in browse grids and hero piles. Tilt 0 in drafts, cart, order lists and editors.
- Persimmon never sits on marigold. Marigold text is cocoa.
- Tap targets 44px minimum. Focus ring is `0 0 0 4px persimmon-tint`.

**Gaps in the kit (CTO composes these from tokens, no new colors)**
- Modal (radius 22, white, lifted shadow, cocoa scrim at 40%).
- Chat bubble (guide = cream, user = white with twine border, radius 22).
- Upload dropzone (dashed 1.5px twine border, radius 14, paper fill).
- Checkbox (twine border, radius 8, persimmon-ink check).
- Step header: use Progress with a step label ("Step 2 of 5: Meet the family"), not a new component.
- Brief card: white panel, radius 22, raised shadow, rows of label + editable value.
- Account sub-navigation: Segmented on mobile, vertical link list on desktop.

**Layout**
- Desktop: SiteNav, content max 1200, 28px gutters. Mobile (<720px): SiteNav collapses to logo + menu; TabBar at the bottom (Home, Explore, Books, Me, raised Create button). Create opens a sheet: "What are we making?" Card / Picture book.
- Creator screens (4, 6) are two-pane on desktop (chat left, brief card + preview right) and stacked on mobile (preview on top, chat below, brief card as a drawer).

**Universal states**
- Loading: cream skeleton blocks at final size. A wait over 400ms gets a Progress with a label.
- Error: validation inline under the field (TextField `error`, persimmon-ink hint). System errors go in a Toast with a retry action. No red anywhere.
- Offline: Toast "We lost you for a second. Trying again." with Retry.

**Locked-for-guest summary**

| Feature | Guest | Upgrade prompt (exact wording) |
|---|---|---|
| One card preview | Yes: watermarked, low-res | n/a |
| Second card | Locked | "That's your free preview. Make a free account to keep going. Your card comes with you." |
| Picture books | Browse and chat only; photo upload locked | "Books use real photos, so we need to know it's you. Make a free account to start." |
| Photos of people | Locked | "Photos of people stay private, so we need an account. Make a free account to add photos." |
| Save draft | Locked | "Want to come back to this? Make a free account and we'll keep it." |
| Saved People | Locked | "Save Grandma once and she looks the same in every card. Make a free account to save people." |
| Re-roll | Locked | "Not quite right? Accounts get re-rolls every month. Make a free account." |
| Full-size proof | Locked (watermark stays) | "Make a free account to see the full-size proof." |
| Cart, checkout, order tracking | Locked | "Make a free account to check out and track your order." |

Upgrade prompt pattern: Modal with primary Button "Make a free account" and ghost Button "Not now". When the guest has a draft, a second line reads "Your card comes with you." Never use the guest's name unless known; drop it rather than say "user".

---

## 1. Home (guest or signed in)

**Purpose:** get a visitor to start a card in one click, show both products, show proof.

```
+------------------------------------------------------------------+
| [logo]  Cards  Picture books  Occasions  Pricing   Sign in [Start]|  SiteNav
+------------------------------------------------------------------+
| (promo Badge) Mother's Day ships free until May 4                |
|                                                                  |
|  Cards that sound like  [you.]<-P         ,-------.  ,-------.   |
|  Describe it, we draw it, we mail it.    /  -6deg  \/  +5deg  \  |
|  [Start a card (dark)] [Make a picture   '---------'`----------' |
|   book (secondary)]                   (plum pill sticker "Love, Maya")
+------------------------------------------------------------------+
| ChipGroup: Birthday | Thank you | Wedding | New baby | ...        |
| TemplateCard grid, tilted: 8 of the 12 starter templates         |
+------------------------------------------------------------------+
| How it works: 1 Tell us  2 Approve the look  3 We print and mail |
+------------------------------------------------------------------+
| Sample book: The Eye Story (flip viewer teaser)  [See inside]    |
+------------------------------------------------------------------+
| Pricing strip | FAQ top 4 | footer (Terms, Privacy, Contact)     |
+------------------------------------------------------------------+
```

- Components: SiteNav, Badge promo, Button dark + secondary, ChipGroup, TemplateCard (tilt), Logo.
- Persimmon moment: the "you." accent word.
- States: no promo (badge hidden). Loading: 8 cream tile skeletons. Error loading templates: fall back to four baked-in static templates, no message.
- Signed in: SiteNav shows Avatar and "Your account". H1 becomes "Who are we celebrating, Sam?" with "celebrating?" in persimmon. The promo badge is replaced by a row of upcoming occasions.
- Mobile: hero stacks, occasion chips scroll sideways, TabBar visible.
- Guest locks: none.

## 2. Browse templates (Cards, Picture books, Occasions)

**Purpose:** pick a starting point or begin blank.

```
SiteNav
H2 Cards                            Segmented: [Cards][Picture books]
ChipGroup occasion: All | Birthday | Thank you | Wedding | ...
ChipGroup tone:     Any | Funny | Heartfelt | Adventurous
+--------+ +--------+ +--------+ +--------+
| tilt   | | tilt   | | tilt   | | tilt   |   TemplateCard 4:5
| Title  | | Title  | | Title  | | Title  |   aside = price
+--------+ +--------+ +--------+ +--------+
[ Start from a blank page ] (secondary, last tile)
```

- Components: SiteNav, Segmented, ChipGroup x2, TemplateCard (tilt), Badge new, Button secondary.
- Click a tile: preview Modal with cover art, tone, art style, primary "Use this template" (the persimmon moment), helper line "Change anything you like." Choosing pre-fills occasion, product, tone and art style in the brief; the Greet Guide starts at the next missing field.
- States: empty filter result: "Nothing for that mix yet. Try fewer filters, or start from a blank page." Loading: skeleton grid. Error: Toast "Couldn't load templates." with Retry.
- Guest: fully open. Book templates open the book flow, which gates at photo upload (6b).

## 3. Sign up / log in

**Purpose:** get an account with the least friction; carry the guest draft over.

```
+--------------------------------------+
|  [logo mark]                         |
|  H2  Make a free account             |
|  Your card comes with you.           |
|  [ Continue with Google ] (secondary)|
|  ------------- or -----------------  |
|  TextField  Email                    |
|  [ Email me a sign-in link ] [P]     |
|  small: By continuing you agree to   |
|  the Terms and Privacy Policy.       |
+--------------------------------------+
```

- Components: Logo, Button secondary (Google), TextField, Button primary, Toast.
- Shown as a Modal from any upgrade prompt, or full page at /signin. Log-in title is "Welcome back".
- Link-sent state: "Check your email. We sent a link to {email}. It works for 15 minutes." Ghost "Use a different email"; ghost "Resend" disabled for 30s with a countdown. The primary button is gone in this state, so there is no persimmon moment; that is allowed (zero or one, never two).
- Errors: "That email doesn't look right. Check for typos." Expired link: "That link has expired. Send a new one?" with primary Button. Google cancelled: return to the form, no message.
- On success: return to the previous screen with the guest draft attached. Toast "You're in. Your card's saved."
- First time only, optional: TextField "What should we call you?" with ghost "Skip". Needed for the first-name voice.

## 4. Create card (Greet Guide)

**Purpose:** fill a card CreationBrief by chat or form, then render a preview.

```
+-----------------------------+-----------------------------------+
| Segmented [Chat | Form]      | Brief card (live, editable)       |
| (guide) Who's the card for? |  Product    Card                  |
| [Mum][Partner][Friend] ...  |  Occasion   Birthday     [edit]   |
| (you)   My mum, Rosa        |  For        Rosa (Mum)            |
|                             |  Tone       Heartfelt             |
| TextField "Say anything..." |  Style      Watercolor            |
| [ + photo ]   [ Send ]      |  Message    (empty)               |
|                             |  -------------------------------- |
| Progress: 4 of 6 done       |  Preview pane (blank card)        |
|                             |  [ Make my preview ] [P] disabled |
+-----------------------------+-----------------------------------+
```

- Components: Segmented, ChipGroup (quick replies, pickers), TextField (multiline for the message), Progress (brief completeness), Button primary (Make my preview, the persimmon moment), Avatar (saved People), Badge draft, Toast.
- Form mode renders the same brief card fields in the order of intake-questions.md. Chat and form edit one brief and either can finish it.
- Quick replies appear as a ChipGroup under the guide bubble. Free text is always accepted.
- "Make my preview" is enabled only when every required field validates. Disabled hint: "Add a recipient to continue."
- Rendering: preview pane shows Progress "Drawing Rosa's card" (Realtime), with rotating one-liners ("Sharpening the pencils."). Typical wait 30 to 90 seconds. Leaving the page is safe; a Toast with "View" brings you back.
- Result: front of card; tap to flip to the inside message. Buttons: primary "Looks good" (replaces Make my preview), secondary "Change something" (reopens chat with "What should change?"), ghost "Re-roll".
- States: empty (guide asks the first question; brief card shows dashes). Loading (guide typing: three cream dots). Error (render failed): bubble "That one didn't come out. Nothing was charged. Try again?" with a Button. Moderation block: the guardrail wording from intake-questions.md plus a rewrite offer.
- **Guest:** one full card, low-res, diagonal "GreetHub preview" watermark. Locked: Save draft, saved People, Re-roll, full-size proof, photos of people, a second card (wording in the table). Guest cards are text-only in v1.
- **Account:** autosave with a small ghost "Saved" label (no toast). People appear as Avatar chips at the "who is it for" question. Re-roll allowance shown on the ghost button.

## 5. Card approval and proof

**Purpose:** final check before the cart.

```
SiteNav
 <- Back to edit
+---------------------------+  H2  Rosa's card
|  Segmented [Front|Inside] |  Birthday - Heartfelt - Watercolor
|  large preview, zoomable  |  Inside message (TextField, editable)
+---------------------------+  Format Segmented [Mailed][Digital]
                               Toggle "Send it straight to Rosa"
                               Price line  $X.XX
                               [ Add to cart ] [P]   Re-roll (2 left) ghost
```

- Components: Segmented (Front | Inside; Mailed | Digital), Toggle, TextField, Button primary, Button ghost, Badge draft, Toast.
- Re-roll text: "Re-roll (2 left this month)". At zero: "No re-rolls left this month. They come back on {date}."
- Text-only edits re-flow the layout without a new render; Toast "Updated."
- Errors: message too long for the card: "That message is a little long for the card. Trim it, or we can shrink the type." with two ChipGroup choices.
- Low QA confidence: Badge draft "Check the edges" and a hint line.
- **Guest:** sees the watermarked low-res proof. "Add to cart" opens the checkout prompt (table).

## 6. Create book

**Purpose:** run the proven pipeline: photos, character sheet approval, story, pages, proof. One page, five stages, a Progress header on each ("Step 2 of 5: Meet the family").

### 6a. Book intake
Same layout as screen 4 with the book fields from intake-questions.md. Guests can chat through the structured questions; the gate hits at the photo step:

```
+-----------------------------------------------+
| Books use real photos, so we need to know     |
| it's you. Make a free account to start.       |
| Your answers come with you.                   |
| [ Make a free account ] [P]    [ Not now ]    |
+-----------------------------------------------+
```

### 6b. Photos and consent (accounts only)
```
H2 Who's in the book?
Per character (1 to 4, plus an optional pet):
 +--------------------------------------------+
 | Avatar | Name TextField | Age band ChipGroup|
 | Role ChipGroup (Hero, Sibling, Parent, Pet) |
 | Dropzone: add 1 to 4 photos                 |
 | [x] consent checkbox (exact text in         |
 |     intake-questions.md)                    |
 +--------------------------------------------+
 [ + Add another character ] secondary
 [ Continue ] [P]
```
- Components: TextField, ChipGroup, Dropzone, Checkbox, Avatar, Button primary / secondary.
- "Use a saved person" Avatar chips replace uploading for People already saved.
- Continue is disabled until every photo of a child has the consent ticked. A consent record is saved (user, timestamp, photo ids, wording version).
- Photo checks: 600px short edge minimum, JPG/PNG/HEIC, 10MB max. Error under the photo: "This one is too small. Try a bigger photo with one clear face."
- States: empty (dropzone only). Loading (thumbnail with Progress). Error (hint plus "Remove").

### 6c. Character sheet approval (the gate)
```
H2  Meet the family           Progress "Step 3 of 5"
+---------------------------------------------+
| Model sheet image, large, zoomable          |
| Names under each figure                     |
+---------------------------------------------+
"Do these look like them?"
Per character: ChipGroup [Looks right][Something's off]
  if off: TextField "What should change?"
[ Looks right, draw the book ] [P]  [ Redo the sheet ] secondary
```
- Components: Progress, ChipGroup, TextField, Button primary / secondary, Toast.
- Under the buttons, cocoa-70: "Pages are drawn after you say yes. Changing a character later means redrawing the pages." This is deliberate friction and the cost guard.
- Two free sheet redos per book, then "Redo (uses a re-roll)".

### 6d. Story review
```
H2  The story        Segmented [Page by page][Read through]
Each page: TextField (multiline), left-page text, character count
ChipGroup rewrite helpers: Shorter | Funnier | Warmer
Segmented [24 pages][32 pages]  (locks after approval)
[ Approve the story ] [P]
```
- Rewrite chips call the model on one page only. Autosave. Badge draft "A bit long for age 4" on over-length pages.

### 6e. Page rendering
```
Progress "Drawing page 6 of 14"   62%      <- the [P] moment (bar)
Grid of untilted thumbnails appearing as pages finish
Toast: "Your book is ready to look through."  [View]
ghost: Cancel
```
- Safe to leave; the "proof ready" email goes out. A failed page retries once automatically (thumbnail shows "Redrawing" with Badge draft).

Guest locks: everything past 6a. Common errors: photo blocked: "We can't use that photo. Try another where the person is clearly the one in it." Copyrighted character in text: the rewrite offer in intake-questions.md.

## 7. Book approval and proof

**Purpose:** page-flip review, re-rolls, approve, add to cart.

```
SiteNav
Page-flip viewer (text-left / art-right)        Side panel
  <  spread 4 of 14  >                           Title TextField
  thumbnail strip (untilted)                     Dedication TextField
                                                 Re-roll this page (3 left) ghost
[x] I've looked at every page and I'm happy to print it.
Hardcover 8.5 x 8.5, 24 pages   $X.XX
[ Add to cart ] [P]      Toggle "Add a digital copy"
```
- Components: TextField, Toggle, Checkbox, Button primary, Button ghost, Badge sent / draft, Toast.
- Re-roll opens a Modal: "What should change on this page?" with optional TextField and primary "Redraw this page"; the modal's primary is the screen's only persimmon moment while it is open (the page's primary dims).
- "Add to cart" is disabled until the approval checkbox is ticked. Line under it: "Printed books can't be changed after you pay."
- Print validation failure: "Page 9 needs a fix before we can print. We're on it." Add to cart disabled.
- Guest: n/a (books are account-only).

## 8. Cart

```
H2  Your cart (2)
+-------------------------------------------------+
| TemplateCard(0) | Rosa's card, mailed            |
|   mini          | To: Rosa, Leeds                |
|                 | [edit] [remove]         $X.XX  |
+-------------------------------------------------+
| TemplateCard(0) | The Eye Story, 24 pages        |
|                 | Ship to: you             $X.XX |
+-------------------------------------------------+
TextField Promo code  [Apply]
Subtotal / Shipping (next step) / Tax (estimate)
[ Checkout ] [P]        Keep making things (ghost)
```
- Components: TemplateCard (tilt 0, small), TextField, Button primary / ghost, Toast, Badge.
- Empty: "Nothing here yet. Start with a card or a book." Two secondary Buttons plus three untilted suggestions for the next occasion. No persimmon moment.
- Remove: Toast "Removed." with Undo.
- Error: an item can't print: Badge draft "This one needs a look" and Checkout is blocked until fixed.
- Guest: "Add to cart" shows the checkout prompt.

## 9. Checkout

**Purpose:** address, delivery date, pay. Payment is Stripe Checkout (hosted); GreetHub collects delivery details first.

```
Progress "Step 1 of 2"                 Order summary (sticky right)
H2 Where is it going?
 per mailed item:
  Segmented [To me][To someone else]
  Saved addresses ChipGroup (Home | Rosa | + New)
  TextFields: Name, Line 1, Line 2, City, Region, Postcode, Country
  Delivery Segmented [As soon as possible][By a date] + date picker
  Toggle "Save this address"
[ Continue to payment ] [P]
```
- Step 2 is Stripe. Success returns to /orders/{id}. Cancel returns to the cart with Toast "No charge. Your cart is waiting."
- Components: Progress, Segmented, ChipGroup, TextField, Toggle, Button primary.
- Validation: required fields, postcode/country format, PO box: "Couriers can't deliver to PO boxes. Use a street address." A date earlier than possible: Toast "Earliest we can do is {date}." with a chip to accept it.
- Digital-only carts skip step 1, confirm the email, and go to Stripe.
- Empty: redirect to Cart. Loading: skeleton summary. Error: Toast "We couldn't open payment. Nothing was charged." with Retry.
- Guest: locked (table).

## 10. Order confirmation and tracking

**Confirmation (right after paying)**
```
H2  Thanks, Sam. We're on it.
Order summary (untilted TemplateCards)
We emailed sam@example.com.
[ Track this order ] [P]   [ Make another ] secondary
```

**Tracking (/orders/{id})**
```
H2  Rosa's card                     Badge: Printing
Timeline:
 [x] Paid                Oct 10
 [x] Proof approved      Oct 10
 [~] Printing            est. Oct 12   <- current
 [ ] Shipped             tracking link when available
 [ ] Delivered
Shipping to: Rosa, Leeds
Tracking: carrier + number (link)
[ Ask us about this order ] ghost
```
- Components: Badge (draft = in production, sent = shipped), Progress, Button primary (confirmation only), TemplateCard (0), Toast ("Your card's on its way to Sam." when the status flips while the user is on the site).
- Statuses and labels: Paid, Preparing, Printing, Shipped, Delivered, Needs attention, Cancelled, Refunded.
- Empty orders: "No orders yet. Your first one will show up here."
- Errors: no tracking yet: "Tracking shows up once it ships. We'll email you." Needs attention: "Something needs fixing before we print. We've emailed you what to do."
- Guest: not reachable; links redirect to sign-in with Toast "Sign in to see this order."

## 11. Account

Sub-navigation: Profile, Addresses, Drafts, People, Orders, Delete account. TabBar "Me" is the mobile entry.

### 11a. Profile
```
H2 Your account
TextField First name | Last name
TextField Email (read-only)   ghost "Change email"
Toggle "Email me when a proof is ready"   (on, required, disabled)
Re-roll allowance: Progress "3 of 5 left this month"
[ Save changes ] [P]
```
- Errors inline. On save: Toast "Saved."

### 11b. Addresses
```
H2 Addresses                       [ + Add an address ] secondary
Panels (untilted): "Home - 12 Elm St, Leeds"  [Edit] [Delete]  Toggle Default
Empty: "No saved addresses. We'll offer to save one at checkout."
```
- Delete: Toast with Undo for 5 seconds. One default only.

### 11c. Drafts
```
H2 Your drafts         ChipGroup: All | Cards | Books
Grid of TemplateCard (tilt 0) + Badge draft + "Edited 2 days ago"
Row actions: Continue, Duplicate, Delete
Empty: "Nothing saved yet. Start a card and we'll keep it here."
```
- Drafts expire after 90 days. At day 75 the card shows Badge draft "Expires in 15 days". Photos purge with the draft unless kept as a Person.

### 11d. People
```
H2 People                              [ + Add a person ] secondary
Grid: Avatar (photo) + name + relationship + "used in 3"
Click: drawer with model sheet, name, age band, pronouns,
       Toggle "Keep photos", Delete person
Empty: "No one saved yet. Add Grandma once and she looks the same in every card."
```
- Adding a minor requires the same consent checkbox.
- Delete: Modal "Delete Rosa? Cards and books you've already made keep her picture. New ones can't use her." Dark "Delete", ghost "Keep". Photos purged within 30 days.
- Guest: locked (table).

### 11e. Orders
```
H2 Orders          ChipGroup: All | In progress | Delivered
Rows: TemplateCard(0) thumb | title | date | Badge status | total | [View]
Empty: as screen 10.
```

### 11f. Delete account
```
H2 Delete your account
This removes your profile, saved people, photos, drafts and addresses.
Orders already in production still ship. Order records are kept for tax
and accounting, with your name and address removed after fulfilment.
ghost link: Download my data
TextField: Type DELETE to confirm
[ Delete my account ] (dark)   [ Keep my account ] (secondary)
```
- Flow: Modal confirm, then a confirmation magic link by email, then the deletion job. Toast "Your account is gone. Take care, {first name}." (name read before deletion). Redirect to Home.
- Order in production: required checkbox "I know my open order will still ship and I'll lose its tracking page."
- No persimmon on this screen: destructive actions stay calm. Retention period for order records: confirm with legal before launch (flag for CEO).

---

## 12. Analytics events (CTO and CFO)

`view_home`, `template_click`, `creator_start` (guest), `guest_preview_rendered`, `signup_prompt_shown`, `signup_complete`, `brief_complete`, `book_sheet_approved`, `add_to_cart`, `checkout_start`, `purchase`, `reroll_used`, `proof_email_open`.

CFO funnel mapping: visitor = `view_home` (or any landing view), sign-up = `signup_complete`, creator start = `creator_start`, purchase = `purchase`.
