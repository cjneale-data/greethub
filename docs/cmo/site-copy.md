# GreetHub site copy

Voice: warm, plain, first names, short sentences. Max one exclamation mark per screen or email (this file uses none; the budget is there if a screen wants it). No therapeutic or tech jargon. "GreetHub" in prose.

Price tokens are filled by the CFO's launch prices: `{card_digital}`, `{card_mailed}`, `{book_24}`, `{book_32}`, `{shipping_card}`, `{shipping_book}`. Nothing here hard-codes a price.

Placeholders: `{first_name}`, `{recipient}`, `{date}`, `{carrier}`, `{tracking_url}`, `{order_id}`.

**Revised 2026-10-12 to match the build.** Re-rolls are per book (3 page redraws plus 2 free character-sheet redos), not a monthly allowance; cards have no signed-in redraw yet. Saved People holds names and details, not a likeness, and cards take no photos. No real family's book is used as a sample (standing rule 5). US spelling and terms throughout (Mom, ZIP code, personalized). The live app is the source of truth where they differ; this deck is the brief.

---

## 1. Home

**Badge (promo, seasonal):** none at launch. Show a promo only from a dated config that hides it after its end date (CX-03). Example: "Order by {date} for Christmas" once the printer cut-off is known.

**H1:** Cards that sound like *you.* (accent on "you.")
**Subhead:** Tell us who it's for and what you'd say. We draw it, write it with you, print it and mail it.
**CTAs:** Start a card | Make a picture book
**Under CTAs (small):** Try one card free. No account needed.

**Section: Pick an occasion** (H2: "Who are we celebrating?")
Chips: Birthday, Thank you, Wedding, New baby, Get well, Just because. Link: "See all occasions".

**Section: How it works** (H2: "Three steps. A card takes about ten minutes.") Books take longer: pages draw in 10-15 minutes.
1. **Tell us.** Chat with the Greet Guide or fill a short form. Who it's for, what to say, how it should feel.
2. **Check the look.** See your card or your characters before anything is final. Change what's off.
3. **We print and mail.** Real paper, real postage. To you, or straight to them.

**Section: Picture books** (H2: "Make the book your family keeps.")
Body: Tell us the memory and add a few photos. We write the story with you, draw everyone once for you to approve, then draw every page from that approved sheet. Hardcover, 8.5 by 8.5 inches, printed to order.
CTA: See a sample book (only once the fictional sample book exists; templates.md section 3)
Caption on sample: "A sample book with an invented family. Yours stars your people."

**Section: Cards people keep** (H2: "Cards that sound like you.")
Three proof lines (no testimonials until real ones exist):
- "Say it your way. Our Guide asks one question at a time, and nothing is made until you say yes."
- "Approve the look first. On a book, you see everyone drawn before a single page is."
- "Nothing's final until you've seen it. Look at the proof first."

**Section: Pricing strip** (H2: "Simple prices.") Card {card_digital} digital, {card_mailed} mailed. Picture book from {book_24}. Link: "See pricing".

**Footer line:** Made for the people who matter. Terms | Privacy | Contact | Help.

---

## 2. Card product page

**H1:** Make a card that sounds like you.
**Subhead:** A 5 by 7 folded card with your own picture on the front and your words inside. Mailed to you, mailed to them, or sent as a digital card.

**What you get** (bullets)
- A front illustration drawn for this person and this occasion
- A message inside, written by you or with you
- Optional drawing inside
- Folded 5 by 7 card, envelope included
- Mailed from the print shop, or a digital copy to send yourself

**Formats**
- Digital: yours to send by text or email, and to print at home. {card_digital}
- Mailed: printed on heavy card stock and posted. {card_mailed} plus {shipping_card}. Ship it to you, or straight to the recipient.

**How long** (H3): "About a minute to draw your preview. Mailed cards arrive in a few days after you approve." (Exact days come from CTO's printer data; do not promise a date here.)

**Try it free** (H3): "Make one preview, no account. It has a watermark. Make a free account to keep it, get a full-size proof and order."

**CTA:** Start a card
**Secondary:** Browse templates

---

## 3. Picture book page

**H1:** A picture book starring your people.
**Subhead:** Real photos in, a hardcover storybook out. 8.5 by 8.5 inches, 24 or 32 pages, printed to order.

**How it works**
1. **Tell us the story.** A real memory or an invented adventure. A few sentences is enough.
2. **Add the people.** One to four people and a pet. We draw them once, and you approve how they look before we draw a single page.
3. **Read the story.** Edit any line, or ask for it funnier, shorter, warmer.
4. **Look through the pages.** Flip through before you pay. Redraw a page if it's off.
5. **We print and ship.** Hardcover, mailed to you or a gift recipient.

**Honest notes (H3: "Good to know")**
- Books need a free account, because photos stay private.
- Photos of children need a parent or guardian's OK.
- Once a book is printed it can't be changed, so look closely first.
- The pictures are drawn by AI. Hands and small details can be quirky, which is why you can redraw pages.

**Formats:** 24 pages {book_24}. 32 pages {book_32}. Shipping {shipping_book}.
**CTA:** Start a picture book
**Secondary:** See a sample book

---

## 4. Pricing page

**H1:** Simple prices.
**Subhead:** Pay when you're happy with the proof. Not before.

| | Digital card | Mailed card | Picture book 24 pp | Picture book 32 pp |
|---|---|---|---|---|
| Price | {card_digital} | {card_mailed} | {book_24} | {book_32} |
| What you get | Full-size card file | Printed 5 by 7 card and envelope | Hardcover 8.5 by 8.5 | Hardcover 8.5 by 8.5 |
| Shipping | n/a | {shipping_card} | {shipping_book} | {shipping_book} |

**Free:** "One watermarked card preview, no account."
**With a free account:** saved drafts, saved people, full-size proofs, order tracking. Each picture book comes with 3 page redraws.
**Redraws:** "Each picture book comes with 3 page redraws and 2 free redos of the character sheet. A drawing that fails never uses one up." (Matches `lib/book/constants.ts`. Card redraws and any paid pack: CFO to set before publishing.)
**Fine print line:** "Prices don't include tax. Tax is worked out at checkout."
**Guarantee (H3: "If it's not right"):** "If something arrives damaged or printed wrong, tell us within 30 days and we'll reprint it or refund it. If it's just not to your taste, we'll help you fix it before it prints." (Policy must be confirmed by CEO and CFO.)

---

## 5. FAQ

**Do I need an account?**
Not to try one card. You get one free preview as a guest. A free account unlocks picture books, saved drafts, saved people, page redraws on books, full-size proofs, checkout and order tracking. Accounts are for adults, 18 and over.

**How does the card get made?**
You tell the Greet Guide who it's for, the occasion and what you'd say. We draw it and show you a preview. You change what you like, then approve.

**Can I make a card without the chat?**
Yes. Switch to Form and fill the same questions in a short list.

**What do you do with my photos?**
They're private, used only to draw your card or book, and deleted after 90 days unless you save the person for next time. You can delete them or your whole account any time.

**Can I use photos of my kids?**
Yes, if you're their parent or guardian, or have their parent or guardian's OK. We ask you to confirm when you upload.

**Can you draw Mickey, Elsa or other characters?**
No. We can't use copyrighted characters or real public figures. We'll offer a look-alike idea that's all yours, like "a cheerful cartoon mouse."

**Will it really look like us?**
You approve the character sheet before any page is drawn, so you see how everyone looks first. If something's off, you redo it.

**What if a picture comes out wrong?**
Redraw it. Each picture book comes with 3 page redraws and 2 free redos of the character sheet, and a drawing that fails never uses one up.

**How long does delivery take?**
We'll show an estimated date at checkout once you've entered the address. Cards and books are printed to order.

**Can you mail it straight to the person?**
Yes. Pick "To someone else" at checkout and add the address. We don't put prices on anything we send.

**Can I change it after I pay?**
Not once it's printing. Look closely at the proof first. If you spot a problem right away, contact us and we'll do what we can.

**What if it arrives damaged or wrong?**
Tell us within 30 days with a photo and we'll reprint or refund. (CEO/CFO to confirm.)

**Is the art made by AI?**
Yes. The pictures are drawn by AI image models from your brief and photos, then laid out and printed by us. We say so plainly. You always see it before it prints.

**Can I sell what I make or use it commercially?**
For personal use, it's yours. For business use, email us first. (Legal to confirm.)

**Which countries do you ship to?**
List comes from CTO's printer coverage at launch. Default launch copy: "We ship to the US to start. More countries soon." Confirm with CTO.

**How do I delete my account?**
Account, then Delete account. It removes your profile, saved people, photos, drafts and addresses.

---

## 6. Empty states

| Screen | Copy | Button |
|---|---|---|
| Drafts | Nothing saved yet. Start a card and we'll keep it here. | Start a card |
| People | No one saved yet. Add Grandma once and skip the typing next time. | Add a person |
| Orders | No orders yet. Your first one will show up here. | Start a card |
| Addresses | No saved addresses. We'll offer to save one at checkout. | Add an address |
| Cart | Nothing here yet. Start with a card or a book. | Start a card / Make a picture book |
| Templates (no filter match) | Nothing for that mix yet. Try fewer filters, or start from a blank page. | Start from a blank page |
| Greet Guide, first turn | Hi, I'm your Greet Guide. What are we making: a card or a picture book? | (chips) |
| Redraws used up (book) | No redraws left on this book. You can still edit the words. | OK |
| Upcoming occasions | No dates saved yet. Tell us a birthday and we'll remind you. (later step) | Add a date |
| Proofs in progress | Nothing drawing right now. | Start a card |

---

## 7. Emails

Sender: GreetHub <hello@{domain}> (owner to supply the domain; `greethub.example` cannot receive mail, CX-31). Plain-text friendly, brand header with the Logo mark only, one primary button per email (persimmon-ink), no exclamation marks beyond one.

### 7.1 Order confirmed
**Subject:** Thanks, {first_name}. We've got it.
**Preview text:** Your {product} for {recipient} is in the queue.

> Hi {first_name},
>
> Thanks for your order. Here's what's on its way:
>
> {line items: "Rosa's card, mailed" / "The Night the Moon Came Down, hardcover, 24 pages"}
>
> Sending to: {recipient}, {city}
> Total paid: {total}
>
> We'll email you when it ships, with a tracking link.
>
> [Track your order]
>
> If anything looks off, just reply to this email.
>
> The GreetHub team

### 7.2 Proof ready
**Subject:** {recipient}'s {product} is ready to look at
**Preview text:** Take a look. Nothing prints until you say so.

> Hi {first_name},
>
> Your {product} for {recipient} is ready for you to look through. Nothing is printed or charged until you say yes.
>
> [See your proof]
>
> Not quite right? Redraw a page that's off. Your book comes with 3 redraws.
>
> The GreetHub team

(Variant for books: "Your book is ready to flip through. Take your time with each page.") Not built yet: no proof-ready template exists in `lib/shop/mail.ts` (shop engineer).

### 7.3 Shipped
**Subject:** Your card's on its way to {recipient}.
**Preview text:** Here's your tracking link.

> Hi {first_name},
>
> Good news: your {product} for {recipient} has shipped with {carrier}.
>
> Track it: {tracking_url}
> Expected: {date}
>
> [Track your order]
>
> The GreetHub team

(If shipped straight to recipient: "We sent it straight to {recipient}. No prices inside, just the card.")

### 7.4 Optional (v1.1)
- **Magic link:** Subject "Your GreetHub sign-in link". Body: "Click to sign in. This link works for 15 minutes and only once. If you didn't ask for it, ignore this email."
- **Needs attention:** Subject "One thing to fix on {recipient}'s {product}". Body: "We hit a snag before printing: {reason}. Here's how to sort it out: {link}. Nothing has been charged twice."
- **Delivered:** Subject "{recipient}'s {product} was delivered". Body: "Hope it lands well. Want to make another?"
- **Account deleted:** Subject "Your GreetHub account is gone". Body: "As you asked, we removed your profile, photos, drafts and addresses. Open orders will still ship. Take care."

---

## 8. Error messages

| Situation | Message | Action |
|---|---|---|
| Invalid email | That email doesn't look right. Check for typos. | Edit |
| Magic link expired | That link has expired. Send a new one? | Send new link |
| Render failed (card/book page) | That one didn't come out. Nothing was charged. Try again? | Try again |
| Render timed out | This is taking longer than usual. We'll email you when it's ready. | OK |
| Photo too small | This one is too small. Try a bigger photo with one clear face. | Replace |
| Photo wrong type | We can open JPG, PNG and HEIC photos. | Replace |
| Photo blocked | We can't use that photo. Try another where the person is clearly the one in it. | Replace |
| Consent missing | Tick the box so we know an adult said yes. | n/a |
| Copyrighted character | I can't draw {character}. I can do something with the same spirit. How about {description}? | Yes, do that / I'll rephrase |
| Real public figure | I can't draw real public figures. What do you like about them? I can draw someone inspired by that. | Rephrase |
| Content blocked | That's not something I can make. Want to try a different idea? | Rephrase |
| Message too long | That message is a little long for the card. Trim it, or we can shrink the type. | Trim / Shrink |
| Out of redraws (book) | No redraws left on this book. | OK |
| Rate limit | A lot of cards are being made right now. We're getting to yours. | Wait |
| Guest limit reached | That's your free preview. Make a free account to keep going. Your card comes with you. | Make a free account |
| Address invalid | We can't find that address. Check the ZIP code and street. | Edit |
| PO box | We can't ship to PO boxes. Use a street address. | Edit |
| Delivery date too soon | Earliest we can do is {date}. | Use {date} |
| Payment didn't open | We couldn't open payment. Nothing was charged. | Try again |
| Payment declined | Your card was declined. Try another card, or check the details. | Try again |
| Checkout cancelled | No charge. Your cart is waiting. | Back to cart |
| Print check failed | Page {n} needs a fix before we can print. We're on it. | OK |
| Order needs attention | Something needs fixing before we print. We've emailed you what to do. | Open order |
| Offline | We lost you for a second. Trying again. | Retry |
| Not found (404) | We couldn't find that page. Let's get you back. | Home |
| Server error (500) | Something broke on our side. It's not you. Try again in a minute. | Retry |
| Not signed in | Sign in to see this. | Sign in |

## 9. Microcopy

- Draw wait lines (rotate): "Sharpening the pencils." / "Mixing the colors." / "Finding Rosa's best side." / "Adding the finishing touches."
- Toasts: "Saved." / "Updated." / "Removed." / "You're in. Your card's saved." / "Your card's on its way to {recipient}." / "Your book is ready to look through."
- Buttons: Start a card; Make a picture book; Make my preview; Looks good; Change something; Add to cart; Checkout; Continue to payment; Track this order.
- Meta titles: Home "GreetHub: custom cards and picture books"; Cards "Custom greeting cards, drawn and mailed for you"; Books "Custom picture books starring your family".

---

## AI assistant channel (page /assistants, home callout, nav, footer, FAQ entry)

Status wording: "Coming soon" everywhere until the service is live. Cards only (books excluded in phases 1 to 3, digital excluded for ChatGPT, per docs/integrations/02). Source of truth for the page is app/app/(shop)/assistants/page.tsx. When the service ships: drop the badge, name only the assistants that actually work, and re-check the claims about limits, the 24-hour wait and address/photo handling against what was built.
