# Support model for launch

Owner: Head of Customer Experience. Audience: owner, CFO (budget), CTO (tooling hooks), CMO (voice).

Goal: a customer with a problem gets a human answer fast, fixed the first time, on a budget close to nothing. At launch volume (CFO base case: about 1,900 orders in Year 1 with the CMO's paid budget, far fewer without it) this is a one-person job done in about an hour a day.

## 1. Principles

1. **One front door.** Everything lands in one inbox. Customers never need to guess where to write.
2. **Self-service first, never self-service only.** Help center answers the top 15 questions; every article ends with a way to write to us.
3. **Order-aware.** Every contact carries an order number, project name and account email, so we never ask "which order?".
4. **Fix, then explain.** First reply either fixes the problem or says exactly what we are doing and by when.
5. **Be generous within the policy, fast.** A $7.99 card is not worth a 3-email argument. Remedy cost is budgeted (section 8 and 03 doc).
6. **Safety is not a queue.** Anything about a child, a photo of a person, or a legal claim jumps the line (section 6).

## 2. Channels at launch

| Channel | At launch | Why |
|---|---|---|
| Email `support@` (shared inbox) | Yes, primary | Cheapest, async, customers expect it, fits a small team, carries photos for damage claims |
| Contact form on site (`/contact`) | Yes (CX-31) | Captures order number, topic and photo attachments so first replies need no questions; feeds the same inbox |
| Help center (`/help`) with the 15 articles | Yes | Deflects the easy 40 to 60 percent |
| In-order "Get help with this order" button | Yes (CX-31) | Prefills the form with order id and items |
| Privacy mailbox `privacy@` and report form `/report` | Yes | Legal requires a monitored channel for photo removal (legal 06 req 22, 48 hours) |
| Live chat | No | Needs coverage hours we cannot staff. Revisit at 300+ orders per month |
| Phone | No | Cost, and not what this audience expects. State this plainly in the FAQ |
| Social DMs (Instagram, Facebook, TikTok) | Reply from the brand account within 1 business day with "please email us so we can look up your order", never handle order details in DMs | Customers will go there; do not ignore them |
| Reviews and public comments | Monitor weekly; reply to every review under 4 stars within 2 business days | Public recovery is marketing |

## 3. Hours and coverage

- **Published hours:** Monday to Friday, 9am to 5pm Eastern, closed on U.S. federal holidays. The contact page says so.
- **Weekends:** the inbox is checked once on Saturday and Sunday for 20 minutes during gift seasons only (Nov 15 to Dec 24, 2 weeks before Mother's Day, Valentine's week). Non-peak weekends are not covered.
- **Auto-reply** on every message (and the contact form confirmation): "Thanks, {first_name}. We got your note about order {order}. A person will reply by {business_day_time}. If this is about a photo of a child, we look at those first." Include the Refund page link and the help center link.
- **Peak seasons** (Christmas ordering cut-off in December, Mother's Day, Valentine's): hire a part-time helper or contractor (see staffing), extend the first response target to 4 business hours, and put a cut-off date banner on checkout and in the help center.
- **Holiday and absence cover:** a second person has inbox access and the macros so that no business day is silent. If that is impossible, turn on a vacation auto-reply that names the return date and sets a 2-business-day expectation, and pause paid ads.

## 4. Service levels

First response means a human reply that moves the case forward, not the auto-reply.

| Priority | Examples | First response | Resolution target |
|---|---|---|---|
| P0 Safety and legal | Photo of a child to remove, suspected under-18 user, CSAM, DMCA, privacy rights request, data breach | 4 business hours (24 hours acknowledged any day if the mailbox is checked), action within 48 hours per legal draft | Per legal procedure; escalate to owner immediately |
| P1 Money and time-critical | Charged with no order, order delivery date at risk within 5 days, wrong address before shipping, cancellation before printing, double charge | 4 business hours | Same business day if the printer has not started; else 2 business days |
| P2 Quality claims | Damaged, misprinted, doesn't match proof, lost, late | 1 business day | Decision within 1 business day of receiving a photo; remedy shipped or refunded within 2 more |
| P3 Product help | Odd details, likeness, redraw limits, spelling before approval, sign-in link | 1 business day | 2 business days |
| P4 General | Questions, feedback, wholesale, press | 2 business days | 3 business days |

Targets to measure: median first response under 6 business hours, 90 percent inside SLA, 80 percent of P2 resolved in one reply plus one confirmation.

Refund timing promised to customers: refund issued within 7 business days of approval (Refund & Reprint draft); in practice issue it the same day and tell them their bank takes 5 to 7 days.

## 5. Roles at launch

- **Support lead (the owner, or the first hire, 0.2 FTE):** inbox, macros, refunds up to the authority limit below, weekly review.
- **Backup:** a second named person with inbox access.
- **CTO on-call for support (business hours):** stuck renders, orders missing from printers, webhook issues, deletion jobs. One named person, response within 4 business hours when support raises a P1.
- **Owner:** any exception beyond limits, any P0, any press or legal item.

**Refund and reprint authority (agent can do without approval):**
- Reprint or refund per policy up to $60 per order.
- Goodwill: a 20 percent discount code, or one free reprint when the cause is ours. (A redraw top-up was listed here, but books have a fixed 3 page redraws plus 2 sheet redos and no tool can add more; support note 2026-10-12, docs/support/macros.md.)
- Above $60, a repeat claimant (third remedy in 12 months), or any claim involving suspected fraud: owner approves.

## 6. Escalation rules

| Trigger | Action | Who | When |
|---|---|---|---|
| Customer mentions a child is in a photo they do not have rights to, or a stranger's photo of their child appears | Hide the content, lock the job, reply, log | Support lead, then owner | Immediately; reply within 4 business hours |
| Anything resembling sexual content involving a minor | Do NOT view further, do NOT forward. Follow the CSAM procedure (legal 06 req 18, attorney-approved). Preserve evidence, block, report as required | Owner and attorney | Immediately, any hour |
| User states they are under 18 | Lock account, delete data, confirm by email (legal 06 req 2) | Support lead | Same business day |
| Copyright or trademark complaint (DMCA) | Forward to the designated agent mailbox and owner; do not argue in the thread | Owner | 1 business day |
| Privacy rights request (access, delete, correct) | Log, verify identity by email match, run the deletion/export tool, confirm | Support lead + CTO for vendor propagation | Ack 3 days; done 30 days |
| Data exposure suspicion (someone sees another customer's order or photos) | Stop, preserve logs, notify owner and CTO, assess notification duty with the attorney | Owner | Immediately |
| Chargeback or dispute notice | Gather proof of approval (page hashes, timestamp, IP, approval click) and delivery; respond in Stripe within the deadline | Support lead | Within 3 business days of notice |
| Same defect reported 3 or more times in 48 hours (e.g. a printer cropping, a bad render model) | Stop selling or pause the affected SKU, tell CTO and owner | Support lead | Immediately |
| Printer fails to ship or loses 3 orders | Escalate to printer account manager; consider the backup printer | CTO | 1 business day |
| Customer threatens press, legal action, or posts publicly | Reply personally, offer the best remedy within authority, loop in owner | Owner | 4 business hours |
| Customer is abusive | One warning; after that stop responding and note the case. We do not tolerate abuse of staff | Support lead | n/a |

## 7. Ticket hygiene

- **Tags** (labels): topic (render, photo, spelling, payment, delivery, damage, address, refund, deletion, account), product (card, book), cause (customer, ours, printer, carrier, AI quirk), remedy (none, redraw, reprint, refund, discount). These feed the metrics in 03-quality-and-happiness.md; do not skip them.
- **Internal notes:** order id, what was promised, who promised it.
- **Close the loop:** after a remedy, one follow-up "did that fix it?" message. Send the CSAT link (03 doc).
- **Weekly 30-minute review:** top 5 causes, one fix per cause, tickets to the CTO's backlog, macro and article updates.

## 8. Cost assumptions and reconciliation with the CFO model

CFO inputs (finance/README.md, `Inputs`, `Opex`): support costs $25 per month for the helpdesk plus about $0.90 of support labour per order; refund rate 3 percent of revenue, reprint rate 4 percent of printed items (all GUESS); re-roll rate 20 percent.

Sanity check of $0.90 per order: if 15 in 100 orders generate a contact and a contact takes 8 minutes of work at an owner-time value of $25 per hour, labour is $0.50 per order. At 25 contacts per 100 orders it is $0.83. So $0.90 holds up to about 27 contacts per 100 orders. That is the ceiling I hold myself to: **contact rate target under 20 per 100 orders in month 1, under 15 by month 6.** Above 27 either support or the product needs a fix; that is an alarm, not a staffing request.

If volume grows past about 600 orders per month, or paid ads work, support labour exceeds the model; the CFO should expect a first part-time hire around then.

## 9. Tooling options and costs

Prices are public list prices as I know them (late 2025 and 2026) and are rounded; **verify at purchase**. All are monthly in USD unless noted.

| Option | Fits | Cost | Pros | Cons |
|---|---|---|---|---|
| **A. Shared Gmail inbox** (Google Workspace, `support@` as a Collaborative Inbox via a Google Group or a delegated mailbox) + Gmail templates + Google Form or our `/contact` form + a Google Sheet for tags | Day 1 to about 100 orders per month | Workspace Business Starter about $7 per user (we need it anyway for `hello@`, `support@`, `privacy@`; aliases are free). Add-ons $0 | Nothing new to learn. Cheapest. Photos arrive as attachments | No assignment or status tracking beyond labels. Easy to lose threads. Reporting is manual. No CSAT survey |
| **B. Help Scout** | 100 to 1,500 orders per month | Standard about $22 per user per month (annual about $20). Includes Docs (knowledge base), saved replies, tags, reports, 2 mailboxes | Looks like email to customers, shared inbox, assignments, notes, CSAT-style ratings, built-in help center, API for order lookup later | Another bill. KB branding needs work |
| **C. Crisp** | Chat plus inbox plus KB for one tiny team | Free tier exists (basic chat, limited agents, no KB features worth relying on); Pro about $25 per workspace per month (flat, several agents) | Cheapest paid way to add chat and a KB; flat pricing | Chat is a coverage commitment we cannot meet at launch; email handling is less polished than Help Scout |
| **D. Plain** | Teams building support into their own product and engineering workflow | Roughly $35 to $50 per seat per month (verify) | Engineering-friendly API and Slack workflows, strong for B2B SaaS | Built for B2B and developer products; overkill and costly for a consumer shop |
| **E. Zendesk, Freshdesk, Zoho Desk** | Larger teams | Free or low tiers (Freshdesk and Zoho have small free plans) up to $19 to $55 per agent | Mature ticketing; free tiers can work | Heavier to run; free plans limit automation and KB; brand polish takes work |

**Recommendation:**
1. **Launch on Option A** at about $7 per month on top of Workspace, with a 30-minute weekly review and a Sheet for tags. Put the help center in the app itself as static pages at `/help` (CX-31) so there is no KB subscription.
2. **Move to Help Scout Standard (about $22 per month, one seat) when either** monthly contacts exceed about 60 or the first thread gets lost, whichever comes first. Budget it in the CFO model as a $22 step in month 3 to 6; the existing $25 Opex line already covers it.
3. Skip live chat until volume and staffing justify it.
4. Plain only if the CTO wants tickets created straight from the app and the volume justifies a paid seat.

Other small costs for the CFO:
- Branded support email and DNS (SPF, DKIM, DMARC) for `support@`: included in Workspace. Needed so the sign-in and shipping emails reach inboxes.
- A virtual or real postal address for the footer (legal): owner decision, $0 to $20 per month.
- A prepaid reprint and refund budget: use the CFO's 3 and 4 percent. A $39 book reprint costs about $18 (print $12.50 plus shipping $5.50) plus another render allowance; a refund costs the price (tokens are sunk).
- A part-time contractor for peak weeks: about 10 hours per week at $20 to $25 per hour in December. Cheaper than losing reviews.

## 10. Canned replies (macros)

Voice: warm, plain, first names, no jargon, no more than one exclamation mark per message. Variables in {braces}. Every reply states the fix or the next step in the first two lines. Replace {sign} with the agent's first name. Where a remedy is offered, the macro says "your choice" and gives both options.

Standard opener: "Hi {first_name}," Standard closer: "{sign}, GreetHub".

**Support note 2026-10-12:** macros 2, 3, 4, 5, 13, 16 and 17 promise actions nobody can do yet (redraw top-ups, pausing an order, sending a delete link). Use the corrected versions and the holiday replies in `docs/support/macros.md` until the admin actions in section 11 exist.

### 1. Render stuck or failed

> Hi {first_name},
> Sorry about the wait on "{project}". I've looked, and {cause_plain}. Your pages and photos are safe and nothing has been charged for this.
> {If fixed:} It's drawing again now and should be ready in about {minutes} minutes. We'll email you the moment it's done.
> {If not fixed:} I've asked our engineer to push it through. I'll write again by {time} with a firm answer. You don't need to do anything.
> {sign}, GreetHub

### 2. "The render looks wrong" (generic, includes out of redraws)

> Hi {first_name},
> Thanks for showing me. I can see what you mean on {page}. Here's the quickest way to fix it:
> 1. Open the proof and choose Redraw this page.
> 2. In the note, say what you want in a few words, for example "{example_note}".
> I've {added 5 redraws to your account / noticed you have redraws left}, so go ahead and try a few. If it still isn't right, send me the page number and I'll look at it myself.
> You haven't paid for anything yet, and nothing prints until you approve. There's no rush.
> {sign}, GreetHub

### 3. Child's face inconsistent between pages

> Hi {first_name},
> You're right, {name} looks a bit different on {pages}. The character sheet keeps faces close, but some pages drift.
> What I'd do: redraw {pages} (I've topped up your redraws so it won't cost you any). If the sheet itself isn't quite {name}, tell me what's off ("rounder face, dark curly hair") and I'll redo the sheet and redraw the pages that depend on it. A clearer photo helps a lot: {link_photo_tips}.
> If you've already approved it and it's on its way, write back with your order number and what you see. We'll do what we can.
> {sign}, GreetHub

### 4. Odd hands, missing teeth, extra fingers, stray objects

> Hi {first_name},
> Thanks for spotting that on {page}. It happens: AI drawings sometimes get hands and teeth wrong, and our check misses a few.
> I've {redrawn it / added redraws} so you can try again: open the proof, choose Redraw this page, and add a note such as "hands in pockets, closed mouth smile". Simple poses draw most reliably.
> Look through every page again before you approve. If you can't get a clean version, tell me the page and I'll fix it for free.
> {sign}, GreetHub

### 5. Name misspelled, before printing

> Hi {first_name},
> Thanks for catching "{wrong}" quickly. I've checked your order {order}: printing hasn't started, so we can fix it.
> {Fix route A, if not yet approved:} Edit the name on the {step} step and redraw any page that shows it.
> {Fix route B, if approved and paid:} I've paused your order and will correct it to "{right}". You'll get a new proof by {time} to approve; nothing prints until you do.
> {sign}, GreetHub

### 6. Name misspelled, after approval or after printing

> Hi {first_name},
> I'm sorry about "{wrong}" in {name}'s book. I know how much a gift like this matters.
> {If error was ours / the print differs from the proof:} That's on us. I'll reprint with "{right}" at no cost, or refund you, your choice. Tell me which.
> {If it was in the approved proof:} Our policy doesn't cover errors that appear in an approved proof, but I don't want you left with a book you can't give. I can send a corrected copy at {discount} off, or {goodwill}. Say the word and I'll set it up. A photo of the page helps.
> {sign}, GreetHub

### 7. Payment declined

> Hi {first_name},
> I can see the payment didn't go through on {date}. Nothing has been charged, and your {book/card} and proof are safe in your cart.
> Please try: another card, checking the number, expiry and ZIP, or a quick call to your bank (they sometimes pause a first-time purchase). Here's your cart: {cart_link}.
> If it fails again, write back with the time you tried and I'll check on our side.
> {sign}, GreetHub

### 8. Charged but no order or confirmation

> Hi {first_name},
> Thanks for flagging this. I've checked: {found/not found}.
> {Found:} Your order {order} did go through; the email may be in spam. Here's the link to track it: {order_link}.
> {Not found:} I don't see an order, so the charge is only a hold from your bank. It usually drops off in 3 to 5 days. If it's still there after 5 days, tell me and I'll refund it by hand. I'm sorry for the worry.
> {sign}, GreetHub

### 9. Order is late

> Hi {first_name},
> I'm sorry {recipient}'s {item} isn't there yet. I've looked at order {order}: it {shipped on {date} with {carrier}, tracking {tracking} / is still printing}.
> {Within carrier estimate:} The carrier shows {status}. It should arrive by {date}. If you need it for a specific day, tell me the day and I'll see what I can do.
> {Past estimate:} It's past our estimate, so I've {contacted the printer/carrier} and I'll write again by {time}. If it doesn't arrive by {date}, I'll reprint at no cost, or refund you, your choice.
> {sign}, GreetHub

### 10. Order lost

> Hi {first_name},
> I'm sorry. Your {item} for {recipient} hasn't arrived and the tracking shows {status}. That counts as lost.
> You have two choices, whichever you prefer: I reprint and ship it again (express, if it's for a date), or I refund you in full, including postage. Just tell me which, and confirm the address: {address}.
> I'll start it as soon as you reply.
> {sign}, GreetHub

### 11. Arrived damaged

> Hi {first_name},
> I'm so sorry it arrived damaged. That's not how it should reach {recipient}.
> Could you send one or two photos, including the packaging? You don't need to send the item back. As soon as I have them I'll either reprint it (express shipping if there's a date) or refund you, your choice.
> Please reply within {claim_days} days of delivery. Thank you for your patience.
> {sign}, GreetHub

### 12. Print doesn't match the proof, or misprint

> Hi {first_name},
> Thanks for the photos. I can see {issue}, and it doesn't match the proof you approved. That's on us.
> I'll reprint it at no cost, or refund you in full, your choice. I'll also check with the printer so it doesn't happen again. Which would you like, and is the address still {address}?
> {sign}, GreetHub

### 13. Wrong address, order not shipped

> Hi {first_name},
> Thanks for telling me quickly. Order {order} hasn't shipped yet, so I can change it. I'm updating it to:
> {new_address}
> Is that right? Reply "yes" and I'll make the change. I'll email you the updated delivery estimate.
> {sign}, GreetHub

### 14. Wrong address, already shipped (or address entered incorrectly)

> Hi {first_name},
> I looked at order {order}. It shipped on {date} to the address on the order, {address}, and the carrier shows {status}.
> I've asked {carrier} to redirect it to {new_address}. Carriers can't always do this and it can take a few days, so I'll tell you what they say by {date}. If it can't be redirected or is returned to the printer, I'll help you reship; the cost of a new print is {cost/discount}, because the address was entered at checkout and the policy doesn't cover that. I'll do what I can to keep it low.
> {sign}, GreetHub

### 15. Changed my mind or "not what I hoped" (after approval, or printed)

> Hi {first_name},
> Thanks for telling me honestly. I'm sorry it isn't what you hoped for.
> {Not yet printing:} I can cancel it now for a full refund. Do you want me to?
> {Printed:} Because it matches the proof you approved, it isn't covered by a refund, but I'd like to help. I can offer {discount}% off a new version with changes you describe, plus extra redraws, or a different goodwill gesture. Tell me what's wrong and I'll see what we can do.
> {sign}, GreetHub

### 16. Cancel before printing

> Hi {first_name},
> I've checked order {order}: it hasn't started printing, so I've cancelled it. You'll get a full refund of {amount} to your card ending {last4} within 7 business days; most banks show it in 3 to 5.
> If you'd like to start again with a change, your drafts are still in your account.
> {sign}, GreetHub

*(If printing has started:)* "I'm sorry, order {order} went into production on {date}, so I can't cancel it. If there's a problem with the book itself, write back and I'll look into it."

### 17. Delete my data or account

> Hi {first_name},
> I can do that. To confirm it's you, I've sent a link to {email}. When you click it we'll delete your profile, saved people, photos, drafts and addresses.
> What we can't remove: order and tax records we must keep (we remove your name and address from our copy after delivery) and payment records held by Stripe. Orders still being printed will still ship.
> You can also do this yourself any time: Account, Delete account. Want a copy of your data first? Account, Delete account, Download my data.
> We'll confirm when it's finished, within 30 days; usually it's a day or two.
> {sign}, GreetHub

### 18. Photo consent, privacy worries or "where did my photos go"

> Hi {first_name},
> I'm glad you asked. Your photos are stored privately, used only to draw your book, sent to the AI services named in the consent box you ticked, and deleted 90 days after upload unless you save the character. Our printers only receive finished artwork, never your original photos. We don't identify anyone by their face and we don't use photos for ads unless you ticked the optional box.
> You can delete them yourself any time (Photos step, Withdraw consent and delete photos), or tell me and I'll do it. More detail: {link_privacy_article}.
> Would you like me to delete them now?
> {sign}, GreetHub

### 19. Remove a photo of me or my child (third party; priority P0)

> Hi {first_name},
> Thank you for telling us. I take this seriously.
> I have {blocked/removed} the content you describe and paused any use of it. Please send me the link or order number if you have it, and tell me whether you are the person in the photo or their parent or guardian. We'll confirm to you in writing within 48 hours that it's done and what we did. We don't share who made the request.
> If anything about this worries you, write back to {privacy_email}.
> {sign}, GreetHub
> *(Internal: lock the job, notify owner, log it, do not confirm to the uploader who complained.)*

### 20. Account access and missing sign-in link

> Hi {first_name},
> Let's get you in. GreetHub has no password, you sign in with an emailed link or with Google.
> 1. Request a new link at {signin_url}, using {email}. Check spam and promotions. Links work for 15 minutes, once.
> 2. If it still doesn't arrive, I've checked on my side and {finding}.
> If you can't reach that mailbox, tell me your name, the last order number and the first line of your shipping address, and I'll help you carefully; your orders and photos are private.
> {sign}, GreetHub

### Bonus: refused or blocked content (content check)

> Hi {first_name},
> Thanks for your patience. We couldn't draw {item} because it doesn't fit our Acceptable Use rules ({short_reason}). Nothing was charged. If you'd like, try {safer_alternative}, and I'm happy to help word it. If you think we got this wrong, tell me and a person will look again.
> {sign}, GreetHub

## 11. What the app must capture for support (for the CTO)

- Order number, project id and a **support reference code** in every error toast and email (CX-34).
- Admin view: look up by email or order, see timeline (paid, approved with page hashes and timestamp, print job id, tracking, emails sent), and buttons: refund, reprint, cancel (before production), resend email, lock or delete project.
- Customer-facing: order page Cancel, "Get help with this order", contact form with attachments.
- Webhooks and jobs raise a support alert: stuck render over 30 minutes, order submitted but printer rejected, shipping delay beyond estimate, failed deletion job.
- Audit log of every remedy given, who gave it, and the reason; feeds the weekly review and the CFO's refund and reprint rates.

## 12. What we need to decide before launch

Support email address and domain; published hours; who is the backup; refund authority limits; claim window (policy says 30 days) and the "lost" threshold; whether to publish a phone number (recommend no). These are in 05-backlog.md under "Needs from the owner".
