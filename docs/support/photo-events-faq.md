# Photo cards and events: FAQ, order-by dates, batch reprint policy, macros

Owner: GreetHub Support Agent. Written 2026-10-15 (wave 1, photo cards and events). Status: **DRAFT. Nothing here is live or approved.** Nothing is built yet for these products, and no price, date or policy is approved.

Sources read 2026-10-15: `docs/products/photo-cards-and-events-plan.md`, `docs/products/photo-events/pm-roadmap.md`, `docs/cx/07-photo-events-ux.md`, `docs/cx/02-support-model.md`, `docs/support/macros.md`, `docs/legal/05-policies-draft.md` (Refund & Reprint Policy), `docs/finance/photo-events-pricing.md`, `docs/cmo/photo-events-positioning.md`, `docs/ops/03-holiday-cutoffs-2026.md`, `docs/cto/photo-events-architecture.md`. `docs/ops/photo-events-printing.md` (the printer decision) does not exist yet.

Phase tags follow the PM roadmap: **[P1]** holiday photo cards, ship to me (Christmas 2026 only if the Oct 24 call is "go", else Holiday 2027); **[P2]** save the dates, address book, mail for me (about Feb 2027); **[P3]** invitations, event pages and RSVP (Mar to Jun 2027). Only publish an answer when its phase ships. Everything in brackets like {this} is a variable or a value the owner still has to set.

---

## 1. Customer FAQ (draft help-center copy)

Voice: warm, plain, no exclamation marks in answers. Prices and dates are read from config once approved; never type them in by hand.

### Ordering and price

**What can I make?** [P1] Holiday photo cards: a flat 5x7 card with 1 to 4 of your photos on the front and a simple back with your names, the year and an optional photo. [P2] Save the dates (5x7 card or 4x6 postcard). [P3] Invitations, with an optional RSVP card, a details card and an online event page where guests reply.

**How many can I order?** [P1] 25, 50 or 100 cards at launch. Later, anywhere from 10 to 200 for holiday cards and up to 300 for save the dates and invitations. *(Internal: the CFO ladder has a 10-card band, the PM's Phase 1 scope is 25/50/100 only. Publish whichever the owner approves.)*

**How much is it?** The price per card drops as you order more, and the lower price applies to every card in the order. You see the price per card and the total before you pay. Envelopes are always included. Shipping to you is {ship_to_me_price} per order. *(CFO proposal, not approved: $1.99 / $1.79 / $1.59 per card at 25 / 50 / 100, shipping $6.99.)*

**Are envelopes included?** Yes, one plain envelope for every card, in the same box.

**Can I add a few more cards later?** Yes, open your design and order again. The new order is priced on its own quantity, so 10 more cards cost the 10-card price. If you think you'll need extras, it's cheaper to add them to the first order.

**Do members get a discount?** [Later] Plus and Card Club members get a discount on batch cards, not on shipping or postage. It doesn't combine with other codes; we apply whichever saves you more. *(CFO proposal: 10% Plus, 15% Card Club. Deferred out of Phase 1.)*

### Photos

**Which photos work best?** Sharp, well-lit photos, as large as your phone saves them. If a photo is too small for its spot, the editor tells you: "May print soft" means it will print but may look a little fuzzy; "Too small to print sharp" means you need a different photo or a smaller spot.

**Why was my photo turned down?** Every photo goes through an automatic safety check before we use it. If one can't be used, the rest of your photos are kept. If you think we got it wrong, write to us and a person will look.

**There are children in my photos. Is that all right?** Yes. Before you add photos you tick a box confirming you have the right to use them, including permission from a parent or guardian for any child. Your photos are stored privately, only used to make your cards, and deleted 90 days after you upload them. Our printer receives the finished card design, not your original photos. *(Internal: confirm against the photo-card privacy text once privacy ops and the attorney sign off; B11 gating applies, no real child's photo until the attorney answers.)*

**Will the colors match my screen?** Very close, but printed paper is never quite as bright as a screen, and dark photos print a little darker. The proof shows layout and crop exactly; it can't show paper.

### Checking before it prints

**How do I avoid a typo on all my cards?** Before you approve, the proof shows every word on the card as a plain list, so names and dates are easy to read. We also check for common slips: a name spelled two ways, the wrong year, a date that doesn't match its weekday, or an RSVP date after the event. Read the list out loud once. Then tick "I checked the names and dates" and approve.

**What does "Approve and print 50 cards" mean?** It means the proof you see is exactly what we print, 50 times. After that, the order goes to the print shop.

**Can I change my card after I approve?** Before you pay, yes, edit and approve again. After you pay, your order goes straight to the print shop. If you spot a mistake, email us right away and we'll try to stop it, but we can't promise. *(Mirrors the honest line in legal 05 until a cancel window is built.)*

### Delivery

**When should I order?** See the order-by dates in section 2. The date on the screen is when the box reaches **you**. You still need time to address, stamp and mail your cards, so order earlier than the last date if you want them in mailboxes before the holiday.

**Do you mail the cards for me?** [P1] Not yet: all your cards and envelopes come to you in one box. [P2] Mail for me: we print each address, stamp the envelope and mail every card, with postage at cost shown before you pay.

**Do you ship outside the US?** Not yet. At launch we deliver to the lower 48 states only.

**Do you print addresses on envelopes?** [P1] Only if our print shop supports it at launch; otherwise envelopes are blank. [P2] Yes, recipient and return addresses.

### Addresses and guest lists [P2, P3]

**What happens to my address list?** It's used only to address and mail your cards (and for invitations, to send RSVP emails). We never use it for marketing and never sell it. You can delete a list any time in two clicks. *(Internal: retention number from privacy ops; attorney question on third-party data.)*

**Can my guests change their RSVP?** Yes. Each guest gets their own link in their confirmation email and can change their answer there until RSVPs close. They don't need an account.

**Who can see my event page?** Only people with the link. The page isn't listed or searchable, and you can add a password.

---

## 2. Order-by dates

**ALL DATES ARE PLACEHOLDERS pending the printer decision (Oct 24) and owner approval.** Do not quote any of them to a customer until they appear in config and on the order page. The printer, its production days, its December cut-offs and whether it prints in the US are all unknown (`docs/ops/photo-events-printing.md` not written yet).

### Holiday 2026 [P1, only if the Oct 24 call is "go"]

| Holiday | Box arrives at your door by | Order by (PLACEHOLDER) | Basis |
|---|---|---|---|
| Christmas, ship to me | Dec 22 | **Dec 5** | PM roadmap and CX 07 ("Order by Dec 5 to arrive by Dec 22") |
| Christmas, if you want to **mail them yourself in time** | about Dec 12 | **about Nov 28** (PLACEHOLDER) | Support suggestion: box by about Dec 12 leaves time to address and mail before USPS's Dec 17 send-by date (docs/ops/03, citing usps.com holiday dates, read there 2026-10-12) |
| Hanukkah 2026 (starts at sundown Dec 4; verify) | about Nov 25 to mail yourself | **about Nov 13** (PLACEHOLDER) | Dec 5 cut-off is after Hanukkah begins. Needs Fulfillment to confirm if it's worth offering at all in 2026 |
| New Year cards | about Dec 22 | **Dec 5 to Dec 10** (PLACEHOLDER) | Same production; cards mailed after Christmas still arrive near New Year |
| After the cut-off | | "Christmas delivery has closed. Cards ordered now arrive about {date}." | CX 07, shown at Start, not at payment |

Soft launch only: invite-only, cap 30 orders, lower 48 (PM roadmap).

**Finding that matters:** "arrives by Dec 22" is for the box, not the recipients. A customer who gets 50 cards on Dec 22 cannot mail them for Christmas. Expect "will they arrive in time to mail?" to be the top December contact. Recommend the order screen shows both dates: "Arrives by Dec 22. To mail them before Christmas, order by {about Nov 28}." (For CX and Shop; I don't write to those files.)

### Save the dates [P2, from about Feb 2027]

| Your plan | Mail them | Order by (PLACEHOLDER) |
|---|---|---|
| Wedding in the US | 6 to 8 months before the wedding (4 is the minimum) | 3 weeks before you want to mail them |
| Destination wedding | 8 to 12 months before | 3 weeks before you want to mail them |
| Mail for me | We mail them | {production days + mailing days}, set when the partner is chosen |

### Invitations [P3, from about Mar 2027]

| Event | Mail them | RSVP-by date | Order by (PLACEHOLDER) |
|---|---|---|---|
| Wedding | 6 to 8 weeks before | 3 to 4 weeks before the event | 3 weeks before you want to mail them |
| Birthday, shower, party | 3 to 4 weeks before | 1 week before | 2 to 3 weeks before the party; or use the event page alone, which works the same day |

Lead-time guidance comes from the plan section 2 (Zola, The Knot). The order-by figures are support's placeholders, not printer data.

---

## 3. Batch typo and reprint policy (DRAFT for owner and attorney)

Not legal advice. This adds batch-specific terms to the Refund & Reprint Policy in `docs/legal/05-policies-draft.md`; it does not replace it. Needs the owner's approval (PM go/no-go criterion 10) and the attorney's review, especially the "checker miss" clause, because it turns a marketing promise ("we check the names and the year") into a remedy.

### 3.1 Customer-facing text (draft)

> **Cards ordered in batches**
>
> Every card in your order is printed from the one proof you approved, so a mistake in the proof is on every card. That's why we show every word as a list and ask you to tick "I checked the names and dates" before you approve.
>
> **We reprint or refund, your choice, when:**
> - the cards don't match the proof you approved (wrong crop, colors clearly off, missing text, wrong design);
> - cards are misprinted, damaged in the box, or missing, or envelopes are missing or short. We replace the affected cards and envelopes. If more than a quarter of the order is affected, we reprint the whole order;
> - our proof check should have caught it and didn't: the wrong year on a holiday card, a name spelled two different ways on the same card, or a date that doesn't match its weekday;
> - the box is lost or arrives too late to use because of us.
>
> If a reprint can't reach you in time for your holiday or event, we refund instead.
>
> **Not covered:** a mistake that was in the proof you approved and that our check doesn't look for (for example, a name spelled the same wrong way everywhere, or the wrong venue), a photo you kept after we warned it may print soft, changes of mind, and an address you entered wrongly.
>
> **Still, tell us.** If you approved a typo, we'll offer one corrected reprint at {50}% off the cards, once per customer per season. Shipping is charged as normal.
>
> Please check your box when it arrives and write to us within {14} days of delivery (holiday cards: as soon as you can, so a reprint still has time) with your order number and a photo. You don't need to send the cards back.

### 3.2 Decision table (internal)

| Case | Cause tag | Remedy | Who approves |
|---|---|---|---|
| Print differs from approved proof | ours / printer | Reprint all or full refund, customer's choice | Agent if order value is $60 or less; else owner |
| Some cards damaged, misprinted or short; envelopes short | printer / carrier | Replace affected count (plus envelopes) | Agent (replacement cost is usually small); owner if over $60 |
| Over 25% of cards affected | printer / carrier | Reprint whole order or full refund | As above |
| Checker should have fired and didn't (year, name spelled two ways, weekday mismatch, RSVP after event) | ours | Reprint all or full refund; file a bug for Card engineer and Model evals | Owner (almost every batch is over $60) |
| Typo in approved proof the checker doesn't cover | customer | Goodwill: {50}% off cards in one corrected reorder of the same quantity, once per customer per season | Agent if the discount is $60 or less; else owner |
| Approved a "May print soft" photo, prints soft | customer | Goodwill: 20% code (standard agent goodwill) | Agent |
| Photo blurry and no warning was shown | ours | Reprint or refund; bug to Card engineer (DPI check) | Agent up to $60; else owner |
| Lost box | carrier | Reprint (express if the date allows) or full refund | Agent up to $60; else owner |
| Late, ordered before the cut-off | printer / carrier | Holiday macro H4: shipping refund or 20% code; full refund if unusable | Agent |
| Wrong address entered by customer (ship to me) | customer | Help redirect; else reorder at normal price | Agent |
| Mail for me: card returned undeliverable [P2] | customer if address was flagged and kept; ours if validation passed | Re-mail at cost of postage / re-mail free | Agent |

### 3.3 What this costs and the authority limit

Agent limit is **$60 per order** (docs/cx/02 s5). At the CFO's proposed prices, most batches are above it:

| Cards | Cards total | With $6.99 shipping | Full refund inside agent limit? | 50% typo goodwill (cards only) |
|---|---|---|---|---|
| 25 | $49.75 | $56.74 | Yes | $24.88, agent |
| 50 | $89.50 | $96.49 | No, owner | $44.75, agent |
| 100 | $159.00 | $165.99 | No, owner | $79.50, owner |

**Owner question:** is the $60 limit measured on the price to the customer or on our cost? A reprint of 100 cards costs us roughly the print quote, not $159. If it's cost, most reprints stay with the agent. Until answered, I treat it as the price to the customer.

The CFO model carries a 4% reprint and typo allowance (GUESS). The goodwill rate above should be checked against it once a real print quote exists.

### 3.4 Why these lines

- PM success metric is "0 reprints from a missed check", so a checker miss must be visible and owned, not absorbed as customer error.
- A typo on 100 cards is the main fear the CMO positions against; a firm "your typo, your cost" with no goodwill would undercut "Checked before it prints". 50% off once is generous but bounded.
- Partial replacement (not a full reprint) for a few bent cards keeps cost sane; the 25% line avoids arguing over a box that's mostly ruined.
- Holiday cards lose all value after the date, so "refund if a reprint can't arrive in time" is the fair default.

---

## 4. Support macros

Same voice and rules as `docs/support/macros.md`: "Hi {first_name}," to open, "{sign}, GreetHub" to close, the fix or next step in the first two lines, at most one exclamation mark, "your choice" when we offer a remedy. **Nothing is sent by the agent. A human sends every reply.** Every draft ends with:

```
Order facts used: {order id, product, quantity, total paid, approval time, ship date, what the customer said}
Policy applied: {section 3.1 clause / legal 05 clause / FAQ / goodwill}
Remedy cost: {$} (agent limit $60 per order, docs/cx/02 s5)
Needs a human to: {send / approve remedy / owner approval / printer portal / Stripe refund}
```

Tooling reality (from docs/support/macros.md s1, still true): no admin order lookup, no refund, cancel or reprint button. The owner does refunds in Stripe and reprints in the printer portal. A batch reprint needs B7 working on a batch line (PM roadmap). Never write "I've cancelled", "I've refunded" or "I've reprinted" until the owner confirms it.

### PE1. "Will they arrive in time to mail?" [P1]

> Hi {first_name},
> If you order by {mail_yourself_date}, your box should reach you by {box_date}, which leaves time to address and mail them before {holiday}. Our last order date is {cutoff_date}, but that's for the box arriving at your door, not for your cards reaching everyone else.
> USPS asks for holiday cards to be mailed by {usps_send_by}. Your order page shows the delivery estimate before you pay.
> {sign}, GreetHub

*Internal: dates from config only. P4, or P1 if within 5 days of the cut-off.*

### PE2. Past the cut-off [P1]

> Hi {first_name},
> I'm sorry, we're past our last date to get printed cards to you in time for {holiday}. I don't want to promise a day we can't keep.
> You can still order now and they'll reach you about {next_date}. A New Year card is a lovely way to send the same photos a little later, and your design carries over.
> {sign}, GreetHub

### PE3. Typo spotted before approving

> Hi {first_name},
> Good catch. You haven't approved yet, so nothing has printed. Open your design, tap the text you want to fix, and approve again. The list next to the proof shows every word, which makes it easier to check the rest.
> {sign}, GreetHub

### PE4. Typo spotted after paying, maybe not printed yet

> Hi {first_name},
> Thanks for writing so quickly about "{wrong}". I'm asking our print shop about order {order} right now, and I'll tell you by {time} whether we caught it before printing.
> If we did, we'll cancel it and refund you in full, so you can fix it and order again. If printing has started, I'll write back with what we can do.
> {sign}, GreetHub

*Internal: P1. Owner checks the printer hold window at once. Never say "paused". Refunds over $60 need the owner.*

### PE5. Customer's own typo, cards printed (not a checker miss)

> Hi {first_name},
> I'm sorry about "{wrong}" on your cards. I know how much work goes into these.
> It was in the proof you approved, so our policy doesn't cover a free reprint, but I don't want you stuck with cards you can't send. I can set up a corrected reprint of {quantity} cards at {50}% off the cards, which comes to {new_total} including shipping. Want me to go ahead?
> {If timing is tight:} It would reach you about {date}, so please tell me if that's too late for {holiday}.
> {sign}, GreetHub

*Internal: section 3.2 row 5. Once per customer per season; check the remedy log. Discount over $60 needs the owner.*

### PE6. Checker should have caught it (wrong year, name two ways, weekday mismatch)

> Hi {first_name},
> You're right, and that's on us. Our check is meant to catch {issue}, and it missed it on your proof.
> I'll reprint all {quantity} cards with it corrected at no cost, or refund you in full, your choice. {If timing is tight:} A reprint would reach you about {date}; if that's too late, a refund may suit you better.
> {sign}, GreetHub

*Internal: owner approves (batches are almost always over $60). File a bug with the order id and the field that slipped, for Card engineer and Model evals. Counts against the PM "0 reprints from a missed check" metric. Do not quote the customer's text in the bug beyond the field name.*

### PE7. Some cards damaged, misprinted, or short; envelopes missing

> Hi {first_name},
> I'm sorry your box didn't arrive right. Could you send a photo of the damaged cards and tell me how many you can't use? You don't need to send anything back.
> As soon as I have it, I'll send replacement cards {and envelopes} for those, at no cost. If more than a quarter of the box is affected, I'll reprint the whole order or refund you, your choice.
> {sign}, GreetHub

### PE8. Prints don't match the proof

> Hi {first_name},
> Thanks for the photos. I can see {issue}, and it doesn't match the proof you approved. That's on us.
> I'll reprint all {quantity} cards at no cost, or refund you in full, your choice. I'll also check with the print shop so it doesn't happen again.
> {sign}, GreetHub

### PE9. Photo printed blurry

> Hi {first_name},
> Thanks for showing me. I've looked at your proof: {If warned:} the editor marked that photo "May print soft" because it was small for its spot, so the print looks the way the warning said. I'm sorry it isn't what you hoped. Here's a 20% code for a new set with a larger copy of the photo: {code}. {If not warned:} it should have warned you the photo was small, and it didn't. That's on us. I'll reprint with a sharper photo of your choice, or refund you, your choice.
> {sign}, GreetHub

### PE10. Colors look different from the screen

> Hi {first_name},
> Thanks for the photo. Printed paper is never quite as bright as a phone screen, and darker photos print a little darker, so some difference is normal.
> {If clearly off, e.g. a strong color cast or very dark:} This looks further off than it should, so I'll treat it as a misprint: a reprint or a refund, your choice. {If within normal range:} What you're seeing is within what we'd expect, so it isn't covered, but if you'd like to try again with a brighter version of the photo, here's 20% off: {code}.
> {sign}, GreetHub

*Internal: owner or Fulfillment judges "clearly off" from the photo against the proof. Log cause "printer" if off.*

### PE11. "Can I add more cards?" or "change my quantity"

> Hi {first_name},
> {Before paying:} Yes, change the number on the quantity step. The price per card updates as you go.
> {After paying:} Your order is already with the print shop, so I can't change it, but you can order more from the same design any time: open it and choose Order again. The new order is priced on its own quantity.
> {sign}, GreetHub

### PE12. Photo turned down by the safety check

> Hi {first_name},
> I'm sorry that photo was turned down. Every photo goes through an automatic safety check, and sometimes it's cautious with ordinary photos, especially at the beach or bath time. Your other photos are kept.
> If you'd like a person to look again, reply and I'll check it. Or try a different photo from the same day.
> {sign}, GreetHub

*Internal: support may not view the photo outside the moderation procedure. Any hint of sexual content involving a minor: stop, do not view further, follow the CSAM procedure (docs/cx/02 s6). Never forward photos.*

### PE13. Children's photos and privacy

Use macro 18 in docs/cx/02, with "your book" changed to "your cards". Add: "Our print shop receives the finished card design, not your original photos." *(Confirm the 90-day purge applies to photo sets, per CTO architecture, before sending.)*

### PE14. Delete my address list or guest list [P2, P3]

> Hi {first_name},
> You can do it yourself in two clicks: {Account, Address lists / your event, Delete event}, then confirm. That removes the names, addresses and replies on it.
> We only ever used it to address your cards {and send RSVP emails}. We never use it for marketing or share it. If you can't get to it, reply from {email} and I'll do it for you.
> {sign}, GreetHub

*Internal: privacy rights flow if they ask about other data (docs/cx/02 s6). If a guest (not the host) asks for their data to be removed, treat as a third-party privacy request: log, remove their record, tell the host only that a guest asked to be removed. Attorney question pending.*

### PE15. Card came back undeliverable (mail for me) [P2]

> Hi {first_name},
> One of your cards, to {recipient_name}, came back from the post office as undeliverable. {If address passed validation:} The address looked right to us, so I'll mail it again free once you confirm or correct it. {If it was flagged and kept:} The address was flagged when you ordered, so a new card is {postage_and_fee}. Send me the right address and I'll take care of it.
> {sign}, GreetHub

### PE16. Guest can't change their RSVP [P3]

> Hi {first_name},
> You can change it from the link in your confirmation email; search your inbox for "{event_title}". If you can't find it, reply from the address you used to RSVP and I'll resend it. If RSVPs have closed, please contact {host_names} directly.
> {sign}, GreetHub

*Internal: never reveal the guest list or other guests' replies. Never change an RSVP for someone who isn't writing from the guest's email.*

### PE17. Event details changed after cards printed [P2, P3]

> Hi {first_name},
> I'm sorry the plans changed. The printed cards can't be edited, but your event page can: update the {date / venue} there and every guest who opens the link sees the new details. You can also email your guest list from the dashboard.
> If you'd like a printed change-the-date card, your design carries over and I can give you 20% off: {code}.
> {sign}, GreetHub

### PE18. Report an event page (spam, phishing, harassment) [P3]

> Hi {first_name},
> Thank you for telling us. I've passed this event page to our safety team, and we'll look at it within {48} hours. We won't tell the page's owner who reported it.
> {sign}, GreetHub

*Internal: route to Trust & Safety per docs/trust-safety/photo-events-abuse.md (wave 1, not read). Do not reply to the event owner from this thread.*

---

## 5. Contact reasons to watch (for patterns.md once live)

Predicted top reasons, in order, from the plan, CX 07 s7 and the book/card macros: (1) will it arrive in time to mail; (2) typo after approval; (3) blurry photo; (4) damaged or short box; (5) colors vs screen; (6) add more cards; (7) photo turned down; (8) [P2] CSV import and returned mail; (9) [P3] guest RSVP links. Tag every contact with product `photo_card`, `save_the_date` or `invitation` so the weekly review can split them from books and folded cards. Not yet added to `docs/support/patterns.md` (this task: one file only).
