# Support macros: launch-reality layer

Owner: GreetHub Support Agent. Written 2026-10-12. Base set: `docs/cx/02-support-model.md` section 10 (macros 1 to 20 plus the content-check bonus). This file **overrides** those macros where they promise something the product or the support desk can't do yet, and adds holiday-season replies. Same voice rules: first names, plain words, the fix or next step in the first two lines, at most one exclamation mark, sign as "{sign}, GreetHub".

Every draft the support agent writes must end with an internal block:

```
Order facts used: {order id, status, dates, amounts, what the customer said}
Policy applied: {Refund & Reprint Policy clause / help article / goodwill}
Remedy cost: {$} (agent limit $60 per order, docs/cx/02 s5)
Needs a human to: {send / approve remedy / owner approval / do the manual action in Stripe or the printer portal}
```

Nothing is sent by the agent. A human sends every reply.

## 1. What support can actually do today (2026-10-12)

| Action | In the product? | How it's done until built |
|---|---|---|
| Look up an order by email or order id | No admin lookup. Only `GET /api/admin/orders/exceptions` (ids only) | Owner reads the order store by hand. Agent asks for the order id. |
| Refund | No refund call in code (Stripe adapter has none) | Owner refunds in the Stripe dashboard, then the order status stays wrong until a status tool exists |
| Cancel | No cancel button or action (CX-11) | Owner cancels at the printer (Lulu has a short hold window; Prodigi not verified) and refunds in Stripe |
| Reprint | No reprint action; a resubmit needs a new external id (`-R1`, docs/ops/01) | Owner resubmits in the printer portal |
| Change address | No action | Only inside the printer's hold window, in the printer portal |
| Top up book redraws | **No.** 3 per book is a constant (`REROLL_ALLOWANCE`), no per-project override | Can't be done. Don't promise it. |
| Redraw a page for the customer | No | Can't be done. Don't promise it. |
| Send a delete-account link | No. Only the customer can start it (Account, Delete account) | Point them to it; privacy@ handles the rest by hand |
| Delay notice email | No template | Human writes it from macro H3 |

## 2. Corrected macros (replace the same-numbered macro in docs/cx/02)

### 2. "The render looks wrong" (corrected: no redraw top-up exists)

> Hi {first_name},
> Thanks for showing me. I can see what you mean on {page}. Here's the quickest way to fix it:
> 1. Open the proof and choose Redraw this page.
> 2. In the box, say what should change in a few words, for example "{example_note}".
> You have {redraws_left} of your 3 redraws left on this book, and a redraw that fails doesn't use one up. If you've run out, or it still isn't right, send me the page number and I'll look at it myself.
> You haven't paid for anything yet, and nothing prints until you approve. There's no rush.
> {sign}, GreetHub

*Internal: if redraws are 0 and the problem is clearly a drawing error, escalate to the owner with a recommendation. There is no tool to add redraws; the only remedies are a discount on a new book or an engineer-run redraw.*

### 3. Child's face inconsistent between pages (corrected)

> Hi {first_name},
> You're right, {name} looks a bit different on {pages}. The character sheet keeps faces close, but some pages drift.
> The quickest fix is to redraw {pages} from the proof. You have {redraws_left} redraws left on this book. If the sheet itself isn't quite {name}, tell me what's off ("rounder face, dark curly hair") and I'll see what we can do. A clearer photo helps a lot: {link_photo_tips}.
> If you've already approved it and it's on its way, write back with your order number and what you see.
> {sign}, GreetHub

### 4. Odd hands, teeth, stray objects (corrected)

> Hi {first_name},
> Thanks for spotting that on {page}. It happens: AI drawings sometimes get hands and teeth wrong, and our check misses some.
> Open the proof, choose Redraw this page, and add a note such as "hands in pockets, closed-mouth smile". Simple poses draw most reliably. You have {redraws_left} redraws left.
> If you can't get a clean version, tell me the page and I'll look at it with our team.
> {sign}, GreetHub

### 5. Name misspelled after paying (corrected: no pause button; act fast)

> Hi {first_name},
> Thanks for writing so quickly about "{wrong}". I'm checking order {order} with our print shop right now and I'll tell you by {time} whether we caught it before printing.
> If we did, I'll cancel it and refund you in full, so you can fix the name and order a corrected copy. If printing has already started, I'll write back with what we can do.
> {sign}, GreetHub

*Internal: P1. Owner checks the printer hold window immediately. Do not write "I've paused your order"; nothing in the product can pause it.*

### 13. Wrong address, not shipped (corrected: change isn't certain)

> Hi {first_name},
> Thanks for telling me quickly. I'm asking our print shop to change order {order} to:
> {new_address}
> Is that right? Reply "yes" and I'll confirm by {time} whether the change went through. Print shops can only change an address for a short time after an order arrives, so I'll tell you straight away either way.
> {sign}, GreetHub

### 16. Cancel before printing (unchanged text, internal note added)

*Internal: the order goes to the printer inside the payment webhook, so "Preparing" shows within seconds of paying. The status label "In production" in the policy draft does not exist. A cancel is only possible inside the printer's hold window. Owner does the printer cancel and the Stripe refund; the agent never says "I've cancelled it" until the owner confirms both.*

### 17. Delete my data or account (corrected: we can't send the link)

> Hi {first_name},
> I can help with that. The fastest way is to do it yourself: go to Account, Delete account, type DELETE, and confirm from the email we send you. If you'd like a copy first, choose Download my data on the same page.
> What we can't remove: order and tax records we must keep (we remove your name and address from our copy after delivery) and payment records held by Stripe. Orders already printing will still ship.
> If you can't get into your account, reply from {email} and we'll do it for you within 30 days; usually it's a day or two.
> {sign}, GreetHub

## 3. Holiday-season replies (Nov 15 to Dec 24)

Cut-off dates below are **proposed, not approved** (docs/ops/03): book standard Dec 2, card standard Dec 10. Use the variables; the owner fills them once approved. Never promise a delivery date the order page doesn't show.

### H1. "Will it arrive by Christmas?" (before the cut-off)

> Hi {first_name},
> Yes, if you order by {cutoff_date}. That's our last day for {item} to reach a US address before Christmas with standard shipping. Your order page will show the delivery estimate before you pay, so you'll know before you commit.
> One tip: give yourself a day to check the proof slowly. A misspelled name is the one thing we can't fix after printing.
> {sign}, GreetHub

### H2. Past the cut-off

> Hi {first_name},
> I'm sorry, we're past our last date to get a printed {item} there by Christmas. I don't want to promise a day we can't keep.
> {If a digital option is live:} You can still give it on the day: {digital_option} arrives by email as soon as it's ready, and you can order the printed copy to follow.
> {If not:} You can still order now and it will arrive after Christmas. Your order page shows the estimate before you pay.
> {sign}, GreetHub

### H3. Order at risk of missing Christmas (we're late)

> Hi {first_name},
> I want to tell you before you have to ask: order {order} for {recipient} is running late. {Plain reason, e.g. "the print shop is a few days behind."} The new estimate is {new_date}.
> Your choice: keep the order and it arrives {new_date}, or cancel for a full refund. Just reply with which you'd like. If you do nothing, we'll keep it coming.
> {sign}, GreetHub

*Internal: required whenever we know we'll miss the shown estimate (FTC Mail Order Rule, docs/legal/03 s3; attorney confirms wording). Refunding one book or card is within the $60 agent limit; an order over $60 needs the owner; the owner still does the Stripe refund by hand.*

### H4. Arrived after Christmas, ordered before the cut-off

> Hi {first_name},
> I'm sorry {recipient}'s {item} didn't make it in time. You ordered on {order_date}, before our cut-off, so this one's on us.
> I can refund your shipping of {shipping_amount}, or give you {discount}% off your next order, your choice. If it hasn't arrived at all, tell me and I'll treat it as lost.
> {sign}, GreetHub

*Internal: goodwill. Shipping refund or a 20% code is within the agent limit (docs/cx/02 s5). Log as cause "printer" or "carrier".*

### H5. Peak auto-reply (replace the normal one Nov 15 to Dec 24)

> Thanks, {first_name}. We got your note{ about order {order}}. It's our busiest time of year, so a person will reply by {business_day_time}, a little slower than usual. If this is about a photo of a child, we look at those first.
> Last order dates for Christmas: books {book_cutoff}, cards {card_cutoff}. Track your order any time from Account, Orders.

### H6. Needs-attention follow-up (send within one business day of the automatic email)

> Hi {first_name},
> I'm following up on the snag with {recipient}'s {item}. {If fixed:} It's sorted and on its way to the print shop now. Your delivery estimate is {date}. {If not:} We're still working on it. I'll write again by {time}. If you need it by a date, tell me the day and I'll tell you honestly whether we can make it, or refund you in full.
> You don't need to do anything.
> {sign}, GreetHub

*Internal: the automatic email now says "a person will email you by the end of the next business day". This macro keeps that promise. The order page note may show raw printer text; do not quote it to the customer.*
