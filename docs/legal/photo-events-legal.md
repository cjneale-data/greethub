# Photo cards and events: legal research

Prepared 2026-10-15 by the GreetHub legal research lead (wave 1). Research for the owner and the owner's attorney. **Not legal advice.** Inputs: `docs/products/photo-cards-and-events-plan.md` (4.2, 4.4, 4.6, 7, 8), `docs/cto/photo-events-architecture.md`, `docs/products/photo-events/pm-roadmap.md`, and the existing `docs/legal/` set, especially `attorney-brief-2026-10.md` (Q1 to Q44), `02-children-photos-privacy.md` and `06-product-requirements.md`.

Tags: **[V]** read on the primary page on the date given; **[S]** secondary source; **[U]** unverified or my judgment. Where I name a code location it was read on 2026-10-15.

## 0. Summary

1. **Minors' photos are the same exposure as books, with three differences.** The photos print as photographs (no AI likeness), the card goes to dozens of third parties, and a new vendor (a mailing partner) would receive the image files. Photo cards inherit B11 and attorney Q1 to Q13: no real child's photo before those are answered (PM roadmap criterion 3).
2. **Address books and guest lists are the largest new legal surface.** They hold other people's data, collected from the customer, not from the person. The safe design is a narrow purpose list, short retention, no marketing, no cross-customer reuse. California's regulation helps on notice and limits us on purpose (section 2).
3. **USPS rules are workable but shape the product.** Cards with a personal message must travel First-Class (DMM 133.3 [V]); card thickness, size and squareness change the stamp (DMM 201 [V]); USPS's own address API terms may bar bulk list cleaning [S] (section 3).
4. **Event pages need host terms, a guest notice, a report path and no analytics.** Dietary notes and children's names in RSVPs are the sensitive fields (section 4).
5. **22 new attorney questions (Q45 to Q66)**, tagged by phase gate (section 7). Section 8 lists owner decisions.

Phase gates (from the PM roadmap): Phase 1 (holiday photo cards, ship to me) needs section 1 only. Phase 2 (save the dates, address book, mail-for-me) needs sections 2 and 3. Phase 3 (event pages, RSVP) needs section 4.

## 1. Minors' photos (all phases)

### 1.1 What carries over from the books work [V on the existing docs]

The adults-only stance, the A to D consent boxes, the 90-day purge, the no-face-templates rule, the CSAM procedure and the vendor-chain questions all apply unchanged to photo cards, because the architecture reuses the book intake (`downscale`, `moderation`, `consent`, purge) per its section 4. These attorney questions already cover the card flow and must be answered before a real child's photo is uploaded: **Q1** (COPPA and "known child" rules for adult-uploaded photos), **Q2** (biometric laws and Illinois), **Q3** (retention box C), **Q4** (derived data), **Q5** (consent wording), **Q6** (consent log), **Q7** (legal hold), **Q9** (vendor chain and DPAs), **Q13** (CSAM procedure). Nothing below replaces them.

### 1.2 What is different for photo cards

| # | Difference | Why it matters | Confidence |
|---|---|---|---|
| a | The customer's own photograph is printed, with no AI redrawing. | The BIPA, CUBI and Washington definitions exclude or do not squarely cover photographs (02 s5 [V for Texas, S for Illinois and Washington]). Printing a photo is lower biometric risk than generating a likeness. The risk sits in any step that derives face geometry: the moderation vision call, the planned "pick my best photos" ranking (faces, eyes open) and any later model-based face detection. | [S], [U] |
| b | v1 auto-crop uses sharp's attention crop, "no model" (CTO s4). | No face template is made, which fits design position 3 in 02 s1. **A future face detector or "eyes open" scorer is a new biometric question** and should not ship before Q2 is answered. | [V] code claim read in CTO doc; the biometric reading is [U] |
| c | The printed card is mailed to a list. | The customer chooses to share their child's picture with relatives and friends. That is the customer's act, but a **mail-for-me** run makes GreetHub (or its mailer) the one that puts the image in other people's mailboxes. Ask the attorney whether that changes the consent wording (Q45). | [U] |
| d | A new processor receives the image files if mail-for-me uses a print-and-mail partner (Lob, PostGrid, Thanks.io are candidates in plan s6). | Each needs a DPA, a retention answer (do they keep artwork, for how long) and an acceptable-use check. This extends Q9 and Q26. Their terms were not read this session. | [U] |
| e | **Reprint window versus the 90-day purge.** Architecture s3 freezes `design_versions` at add-to-cart, and the print PDF holds the photos. The reprint window (propose 12 months in 02 s7) is longer than the 90-day photo purge. | A frozen PDF with a child's face is a derived copy of the photo. If the photo is purged at 90 days but the PDF stays 12 months, the "photos deleted after 90 days" promise (F1 in the brief) is false for photo cards. Options: purge the PDF on the same clock and make reprints re-upload; or keep the PDF and say so plainly. This is an extension of Q4 and a decision for Privacy ops and the owner (Q46). | [V] CTO s3 and 02 s7; the conclusion is mine |
| f | Holiday cards show **other families' children** (cousins, friends) and adults who did not consent. | Consent box A already covers "permission of every adult shown" and parental permission. Photo cards make third-party children routine, not an edge case. Ask whether the uploader's tick is enough (Q47, part of Q19). | [U] |
| g | Families upload **professional photographer images** and screenshots. | The photographer usually owns the copyright and gives a print release. This is an IP question (IP safety owns `docs/legal/photo-events-ip.md`); I note it so the upload tick and ToS warranty mention "I have the right to print this photo" in plain words. | [U] |
| h | Event pages (Phase 3) may show a child's name, age and party address. | See section 4. | |

### 1.3 Design asks for minors' photos

1. Show the B11 consent modal before the first photo, as for books. One consent record per upload batch, in the append-only log B11 builds.
2. No face recognition, grouping, embeddings or "same person" matching in the collage pipeline. Keep ranking to sharpness and exposure until Q2 is answered.
3. Mail-for-me and event pages must never send a photo to any vendor not on the privacy page's recipient list.
4. Do not use any customer card design, photo or RSVP in samples, ads or the golden set (standing rule 5). Marketing samples use fictional or stock-licensed people only; that is IP safety's and CMO's lane.

## 2. Third-party address and guest data

### 2.1 What we will hold

Per the CTO's types: `Recipient` (household, first and last name, postal address, email, tags, source, validation result), `RecipientList` (up to 500), `RecipientSnapshot` at checkout, `Guest` (household, email, party limit, token), `Rsvp` (name, attending, party size, meals, free-text note, time, `ipHash`). All are about people who are **not** our customers and who never saw our privacy policy. Source of data: the customer typing, a CSV, a vCard or Google Contacts.

### 2.2 Which laws bite (research, not conclusions)

| Rule | What I found | Tag |
|---|---|---|
| **CCPA notice at collection, third-party data.** | Cal. Code Regs. tit. 11, s 7012(h): a business that neither collects nor controls the collection of personal information directly from the consumer "does not need to provide a Notice at Collection to the consumer" if it neither sells nor shares the information. https://www.law.cornell.edu/regulations/california/11-CCR-7012 read 2026-10-15. Whether GreetHub "controls the collection" when our import tool does the collecting is open (Q48). The 02 s4 caveat stands: GreetHub may be below the CCPA thresholds at launch, but we build to the standard. | [V] text; application [U] |
| **CCPA purpose limitation.** | s 7002(a): collection, use, retention and sharing must be "reasonably necessary and proportionate" to the purpose collected or another disclosed purpose "compatible with the context". Reasonable expectations turn on the relationship, the type and amount of data, its source, how clear the disclosure is, and how visible service providers are. A recipient expects their address to be used to mail them one card from a friend and not for marketing. https://www.law.cornell.edu/regulations/california/11-CCR-7002 read 2026-10-15. | [V] |
| **Other state comprehensive laws.** | Roughly twenty states have them (02 s3 [S], March 2026). Several use data-minimisation tests stricter than California's. I did not read them for this task. | [S], not researched |
| **Individuals acting personally.** | A customer who sends cards to their own family is a consumer, not a "business" (general reading of the CCPA definition). GreetHub is the business that stores the list. I did not verify whether GreetHub is better described as a processor or service provider for the customer. That choice drives whose notice and deletion duties apply (Q48). | [U] |
| **Recipient rights requests.** | A recipient may write to GreetHub asking what we hold or to delete them. Our DSAR runbook (`docs/privacy-ops/01-dsar-runbook.md`) was written for customers. A recipient is in many customers' lists, with no account to log into and no identity proof other than the email they use (Q49). | [U] |
| **Breach statutes.** | Name plus postal address alone is generally not the data type most state breach laws list (they focus on SSN, licence, account numbers, medical and so on). The CCPA private right of action covers a defined list. Dietary notes in RSVPs may count as health or religious data. Existing Q11 asks for a notification matrix; add address books and RSVPs to it. | [U] |
| **Imports from Google Contacts.** | Google's API Services User Data Policy "Limited Use": use data only to provide or improve user-facing features that are prominent in the app; no transfer except user-consented features, security, law or a merger; humans may read it only in listed cases; no use or sale for ads; applies to sensitive and restricted scopes. https://developers.google.com/terms/api-services-user-data-policy (page updated 2024-02-15) read 2026-10-15. The contacts scopes are described as "sensitive", which needs Google OAuth verification before outside users connect, per vendor guides only. | [V] policy; [S] scope class and verification |
| **USPS address validation.** | USPS's own page says its address validation APIs may be used "in conjunction with USPS shipping or mailing services only", on an individual transactional basis (not batch cleansing of a database) and not to source addresses to add to a database; breach can end access. This is from search results quoting the legacy Web Tools guide (https://www.usps.com/business/web-tools-apis/address-information-api.htm), and one vendor blog says the legacy APIs were retired in January 2026. I did not reach the current developer-portal terms. A 500-row CSV check could break the "individual transaction" rule; a licensed vendor (CASS-certified) is the usual route [U]. | [S], [U] |
| **Marketing laws.** | CAN-SPAM covers messages whose primary purpose is commercial promotion; a message whose primary purpose is a transaction or relationship is outside the "commercial" definition. Sender is the person who initiates and whose product the message promotes; a service that only conveys a message "routine conveyance" does not "initiate" it. 15 USC 7702(2), (9), (16), (17) read 2026-10-15 (https://www.law.cornell.edu/uscode/text/15/7702); 16 CFR 316.2 read 2026-10-15 defers to the statute. A host's RSVP reminder is not commercial on its face; a GreetHub ad inside it could turn it into one (see 4.4). | [V] definitions; application [U] |

### 2.3 Purpose and retention positions to ask the attorney to bless

Proposed purposes, the **only** ones we use recipient data for:
1. print the address on the envelope, for that order;
2. mail the card, for that order (mail-for-me);
3. show the host who has answered (guest list);
4. send an RSVP reminder that the host asked for;
5. check the address with a validation vendor.

Never: GreetHub marketing to anyone on a list, selling or sharing, ad audiences, enrichment or lookups, matching lists across customers, building a shared address database, training models, or analytics events carrying names, addresses or emails (matches the plan's section 7 and the PM guardrail "no addresses in logs or analytics").

Proposed retention (Privacy ops sets final numbers; these are my proposals, [U]):

| Data | Keep | Then |
|---|---|---|
| Saved recipient lists | Until the customer deletes, or 24 months of account inactivity (same as Saved People, 02 s7) | Hard delete, 30-day warning email |
| Recipient snapshot on an order | Order close plus reprint window (propose 90 days, shorter than the 12 months in 02 for art) | Scrub names and addresses; keep counts and statuses |
| Address text inside printer or mailer jobs | Ask each vendor; require deletion on completion or within 30 days | Contractual (Q9) |
| Guest list and RSVPs | Until host deletes the event, or 90 days after the event date | Hard delete; host can export first |
| `ipHash` | 30 days (the brief's SEC-35 pattern) | Delete |
| Customer deletion | Deletes lists, guests and RSVPs, since the host is the owner (CTO s3) | A card already mailed cannot be recalled; say so |

### 2.4 Design asks for third-party data

1. Collect the minimum. At import, drop every column not in the `Recipient` type (phone, birthday, notes, employer). Do not store a recipient's birthday or occasion date (that is the unresolved Q40).
2. A line at import time: "You are adding other people's details. Only add people you know and who would expect a card from you." Logged per list, with the consent record id.
3. Do not email recipients except an RSVP reminder at the host's request. Never email them from the address book.
4. A recipient suppression path: a way for a recipient to say "stop mailing me through GreetHub". It needs a stored keyed hash of the address, which is itself processing (Q50).
5. Log redaction: no names, addresses or emails in app logs, error reports or analytics (Security and Data own the enforcement).
6. A `DSAR` branch for non-customers (Privacy ops, Q49).

## 3. USPS mail rules for mail-for-me and ship-to-me

All USPS pages read on pe.usps.com on 2026-10-15. The Postal Service's page text did not show an issue date; I quote revision markers where given. Pricing is Finance ops' and the CFO's lane; I cite only what shapes the legal and product rules.

### 3.1 Class of mail [V]

DMM 133.3 (https://pe.usps.com/text/dmm300/133.htm; latest bracketed revision markers on the page are July 2026):
- 133.3.3: "Mail containing personal information must be mailed as First-Class Mail" (or Ground Advantage Retail, Priority, Priority Express). Personal information is "any information specific to the addressee."
- 133.3.4: "Mail containing handwritten or typewritten material must be mailed as First-Class Mail" (same alternatives).
- 133.3.5: "Any matter marked 'Postcard' or 'Double Postcard' must be mailed as First-Class Mail".

My reading [U]: a holiday card or save the date that carries a personal message, a handwriting-style sign-off or a recipient name is First-Class matter, so **mail-for-me must run First-Class**, not a cheaper bulk marketing class. Bulk marketing rates also carry minimum volumes (I believe 200 pieces, **not verified**) that a 25 to 200 card job may not meet. Ask the mailing partner which class it will use and get it in writing. Whether our printed handwriting-font sign-off counts as "handwritten or typewritten" is for the attorney or USPS to say; the safe answer is First-Class anyway (Q51).

### 3.2 Size, thickness and shape change the stamp [V]

DMM 201 (https://pe.usps.com/text/dmm300/201.htm, read 2026-10-15; the tool read the first 100,000 of about 124,000 characters, so the nonmachinable and surcharge detail should be re-checked by Fulfillment):
- **Postcard (card price):** at most 9 long, 6 high and 0.016 in thick; at least 5 long, 3.5 high and 0.007 thick, with 0.009 minimum if over 4.25 high or over 6 long; aspect ratio 1.3 to 2.5. A 5x7 flat card meets the size limits (7 / 5 = 1.4) and a 4x6 meets the stamped-card limits. A card that fails those limits "must not bear the words 'Postcard'" (1.2.3).
- **Thickness trap:** **0.016 in (16 pt) is the maximum for card price.** A premium or double-thick stock above that is not postcard-priced, and the 5x7 plan lists "premium paper" as an upsell. Paper options must be checked against 0.016 before mail-for-me is offered on them.
- **Letter (in an envelope):** a 5x7 card in an A7 envelope (5.25 x 7.25) is letter-size with aspect about 1.38, so machinable if it is paper and not over 3.5 oz.
- **Square pieces:** a 5x5 piece has aspect ratio 1.0 and fails the 1.3 to 2.5 standard, so it is **nonmachinable**; the 5x5 square card the plan lists as "later" costs more to mail. Notice 123 (https://pe.usps.com/text/dmm300/Notice123.htm, shows an effective date of 2026-10-04) lists the nonmachinable surcharge as $0.49, a 1 oz stamped letter at $0.82 and a postcard at $0.65 [V as read; Finance ops should confirm]. The plan's "$0.78 Forever stamp in 2025" is out of date.

### 3.3 Other mail-for-me legal points

| Point | Notes | Tag |
|---|---|---|
| **Who mails.** | We (or a partner) act as the customer's agent. Postage is passed through at cost. Whether handling postage money is "money transmission" or only a pass-through line is for the attorney (Q52). Sales tax on postage: Finance ops. | [U] |
| **Delivery promises.** | The Mail Order Rule (16 CFR 435; FTC guide read 2026-10-10 per brief Q23) needs a reasonable basis for any stated shipment time. First-Class has no delivery guarantee I could verify; the order-by dates for mail-for-me should be "mailed by", not "delivered by". | [V] rule; [U] USPS point |
| **Return address and undeliverables.** | A customer's home address printed on every envelope goes to every recipient (their choice; warn them). If undeliverables return to the customer, our "undeliverable per recipient" report (PM Phase 2 criterion) must come from the mailer, not USPS, so confirm the mailer's data. | [U] |
| **Abuse: mail as harassment.** | Mail-for-me lets a paying user send printed matter to any address (an ex, a person who asked to be left alone, threats). The card carries the customer's text. Needs text moderation, a printed sender identity, a per-address frequency cap, a recipient suppression path and a report route (Trust and Safety owns the build). Whether GreetHub has duties on harassing mail is an attorney question (Q53). I did not research federal nonmailable-matter statutes and give no opinion on them. | [U] |
| **Address vendor.** | See 2.2: USPS API terms [S]; vendor CASS licence [U]. | |
| **Vendor artwork and addresses.** | The mailer holds artwork plus name and address pairs. DPA, retention and subprocessors per Q9 and Q54. | [U] |
| **Typos at scale.** | A wrong date on 150 mailed cards cannot be recalled. Proof approval, a "checked names and dates" tick and a published batch reprint policy are the protections (PM criterion 10). See 5. | |

## 4. Event pages and RSVP (Phase 3)

### 4.1 Role split

The host (our customer) invites guests; GreetHub hosts the page and stores the replies. The host is the controller in plain terms; GreetHub stores, secures and emails on the host's instructions. Whether GreetHub is legally a processor, a business or both for this is Q48.

### 4.2 Terms for hosts (draft points for the policy pack, Q21)

1. Host warrants rights to every photo and text on the page, and that guests were not collected by deception.
2. **Allowed:** invitations to personal and wedding events, with RSVP. **Not allowed:** advertising, selling tickets or collecting payments or donations on the page (money handling is out of scope; Q55), political or fundraising solicitation, phishing or collecting passwords or ID numbers, harassment, adult content, hate. The AUP extension is Trust and Safety's to write.
3. Host is responsible for what they do with an exported guest list after download.
4. GreetHub may take a page down on a report, and does not guarantee the page stays up past its retention date.
5. A **report this page** link on every page (copyright, abuse, remove my details). The DMCA and removal process (Q14 to Q16) must reach event pages too.
6. Children: a host may not publish a child's full name, school or home address on an unlisted page; suggest first name and "bring a gift for [first name]" wording only. This is a recommendation; whether a rule is wise is Q56.

### 4.3 What the guest sees and what we promise

On the RSVP form, a short notice, before submit: who runs the event, that GreetHub stores the reply for the host, that the host sees name, answer, party size, meals and notes, that GreetHub does not use it for marketing, how long it is kept, and how to ask for deletion (via the host or a GreetHub form). Link to the Privacy Policy. Event page and RSVP form carry **no ad or analytics tags** (the CTO's s6 already says "no analytics with guest data"; keep it).

Design points:
- **Do not show who else is coming** by default. A guest list visible to other guests discloses names to people the guest may not know. If the host turns it on, the form says so before submit [U].
- **Sensitive fields.** Meal choices and a free-text note can reveal health (allergies), religion (kosher, halal) or a child's details. Under the CCPA, health and religion data are sensitive categories [U, not re-read this task]. Ask for choices as plain labels the host defines, warn above the note box ("do not enter health or other private details"), and keep notes short (Q57).
- **Children as guests.** A child's birthday invitation lists a child's name and age and may collect other children's names and allergy details from parents. Parents give it, not the child (same COPPA logic as 02 s2 [U]); keep to first names and a count.
- **`ipHash`.** A hashed IP is still likely personal information if the hash can be matched back [U]. Key it per event, salt it, and expire it in 30 days.
- **Tokens and passwords.** Per-guest tokens in a URL end up in browser history and forwarded email. Treat a forwarded link as the host's choice; make editing a reply need the token and show a plain warning [U]. Same 404 for unknown, closed or wrong-password pages (CTO s6) also helps privacy.

### 4.4 Reminder and invitation email

- CAN-SPAM: a host-requested RSVP reminder is on its face about an event the guest was invited to, not about promoting a commercial product. Keep GreetHub's own promotion (a footer ad, "make your own card") **out** of these emails so the primary purpose stays non-commercial; the "primary purpose" rule applies (16 CFR 316.3, which I could not read; the text of 316.2 only points to the statute) [U].
- Still include the host's name, a plain way to stop reminders (a per-guest link honoured at once) and GreetHub's postal address (the placeholder address blocker, F10 in the brief). Honour a stop even if the law does not strictly require it.
- Sent only to guests with an email the host supplied who have not replied; daily caps (CTO s6). The host warrants permission to email them (2.4).
- No SMS reminders in this phase. Text messaging brings TCPA consent rules [U, not researched]; add to the attorney list before it is ever built.

### 4.5 Data lifecycle

Delete-event and delete-account must delete the guests and RSVPs, and the host export is the only copy that leaves. Closed events keep data only until the retention date in 2.3. The attorney should confirm that deleting RSVPs on a host's account deletion is acceptable when a guest asked us to keep their reply (Q58).

## 5. Batch orders, consumer rules and policy points (short)

- **Typos at scale and the customer's own error.** Policy options: customer-approved proof is final; a one-time partial credit; reprint only when our file differs from the approved proof. The proof checker (names, weekday, year) is evidence of reasonable care but also a promise if we say "we check" (Q59). The existing Q23 and Q22 cancellation questions apply.
- **Deadlines.** A late wedding save the date or invitation has bigger loss than a late birthday card. The Terms should disclaim consequential loss and say plainly that order-by dates are not guarantees (Q21 extension) [U].
- **Personalised goods and returns.** Whether cards made from a customer's photos and text are exempt from return rights is a state-by-state question I did not research (Q60).
- **Cap and allowlist.** The PM roadmap limits Phase 1 to about 30 invite-only orders, lower 48 only. That limits exposure and also keeps sales-tax and shipping questions small.

## 6. Proposed additions to `06-product-requirements.md`

I write only this file in wave 1. The owner or the next legal pass should merge these (suggested ids PE-1 to PE-14):

- PE-1 Photo cards use the B11 consent flow; no real child's photo before attorney Q1 to Q13.
- PE-2 No face detection, ranking by faces, grouping or embedding of uploaded photos until Q2 is answered.
- PE-3 Reprint copies of print files follow the photo purge clock unless the attorney approves a longer, disclosed one (Q46).
- PE-4 Recipient and guest data used only for the five purposes in 2.3; no marketing, no sale or sharing, no cross-customer reuse.
- PE-5 Import keeps only name, address, email and tags; extra columns dropped; list-level notice logged.
- PE-6 No names, addresses or emails in logs or analytics.
- PE-7 Recipient suppression and a non-customer DSAR path before mail-for-me goes live.
- PE-8 Mail-for-me uses First-Class; mail class, thickness and size checked per product (3.1, 3.2); order-by wording says "mailed by".
- PE-9 Paper options above 0.016 in thickness are not offered with postcard pricing.
- PE-10 Mailing and address vendors have a signed DPA and a deletion term before any real address is sent.
- PE-11 Event pages: noindex, no ad or analytics tags, guest notice on the form, report link, same 404 for all failures.
- PE-12 Guest list hidden from other guests by default; notes warned; no payment collection.
- PE-13 Reminder emails contain no GreetHub promotion, honour a per-guest stop, and are capped.
- PE-14 Deleting an event or account deletes guests, RSVPs and the IP hash.

## 7. New attorney questions (continue the brief's numbering)

Priority: **P1** before the first real photo card order (Phase 1); **P2** before Phase 2 (addresses, mail-for-me); **P3** before Phase 3 (event pages). All photo-card orders also need **Q1 to Q13** from the existing brief first.

**P1 (Phase 1)**
- **Q45.** Does mailing or printing a child's photo to many third parties (a card sent for the buyer) change the consent wording or any minors' rule compared with a book that goes to one household? (1.2 c)
- **Q46.** Frozen print PDFs contain the child's photo. May we keep them for the reprint window (12 months) when the photo itself is purged at 90 days, if we disclose it? Or must PDFs follow the photo clock? Extends Q4. (1.2 e)
- **Q47.** Is the uploader's tick enough when the photo shows other families' children, including children of friends the uploader has no authority over? Extends Q19. (1.2 f)
- **Q59.** Policy for the customer's own typo on a batch (who pays), whether "we check your names and dates" creates a duty, and the best wording. (5)
- **Q60.** Are cards made from a customer's own photos and text exempt from return and cancellation rights in any state we ship to (lower 48 in Phase 1)? (5)

**P2 (Phase 2)**
- **Q48.** Is GreetHub a "business", "service provider" or "processor" for customers' address books and guest lists? Does s 7012(h) (no notice at collection when we do not control collection from the person) fit when our tool does the import? Who owes recipients what? (2.2, 4.1)
- **Q49.** How should we answer an access or deletion request from a recipient who is not a customer and appears in many lists? Verification standard, scope (all lists or the one named), and a response clock. (2.2)
- **Q50.** May we keep a hashed suppression list of addresses that asked not to receive mail through GreetHub, after a deletion request? Is the hash itself personal data? (2.4)
- **Q51.** Confirm mail-for-me must use First-Class under DMM 133.3.3 to 133.3.5, including for cards with a printed handwriting-style sign-off, and whether any cheaper class is lawful for this product. (3.1)
- **Q52.** Is passing postage through to customers money transmission or a regulated activity in any state? Does the answer change if the mailing partner collects postage? (3.3)
- **Q53.** What duties, if any, does GreetHub have when a customer uses mail-for-me to send unwanted or harassing mail? Is a sender-identity printout, a frequency cap and a stop path adequate? (3.3)
- **Q54.** DPA and deletion terms to require from print-and-mail partners and address-validation vendors; is the USPS address-API restriction to "shipping or mailing services only" and "individual transactions" a bar to checking a 500-row import, and what licence route do you advise? (2.2, 3.3)
- **Q61.** Google Contacts import: is the Limited Use policy met by our five purposes, and is there any state-law issue in a user importing contacts' data that includes people who never agreed? (2.2)
- **Q62.** Minimum notice an import must show the customer about adding other people's details, and what record of it we keep. (2.4)

**P3 (Phase 3)**
- **Q55.** Rules for event pages that mention registries, gifts or cash gifts: is a ban on collecting payments or donations enough, and may we link to outside registries? (4.2)
- **Q56.** May we require or advise hosts not to publish a child's full name, school or address, and is a host's breach of that something we must act on? (4.2)
- **Q57.** Are dietary choices and free-text notes in RSVPs sensitive data (health, religion) under the state laws we ship to? Is a label-only meal choice plus warning enough? (4.3)
- **Q58.** On a host's account deletion, are we free to delete guests' replies even if a guest asked us to keep theirs? Who must get a copy before deletion? (4.5)
- **Q63.** Guest notice wording on the RSVP form and how a guest exercises rights (through the host, or with us). Is a hashed per-event IP address personal information, and how long may we keep it? (4.3)
- **Q64.** Does a host-requested reminder email stay "non-commercial" for CAN-SPAM if GreetHub's name appears in the sender or footer? Is a per-guest stop link required or just good practice? (4.4)
- **Q65.** Terms for hosts and guests: AUP additions, liability limit, takedown path for event pages, and whether a guest-visible "report this page" link creates any duty. (4.2)
- **Q66.** Before SMS reminders, TCPA consent and recordkeeping. (4.4; not researched)

Count: 22 new questions (Q45 to Q66): P1 five, P2 nine, P3 eight. After these the brief totals 66 questions; the brief itself is not edited here.

## 8. Owner decisions and asks

Decisions (mine to recommend, yours to take):
1. **Reprint copies vs the 90-day photo purge** (Q46): purge copies on the photo clock (reprint means re-upload), or keep 12 months and disclose it.
2. **Recipient retention numbers** (2.3): confirm or change; Privacy ops will write the final schedule.
3. **Mail-for-me abuse limits:** frequency cap, a printed sender line, a stop path. Recommended: all three before launch.
4. **Event guest list visible to guests:** recommended off by default.
5. **No payment collection on event pages** at launch (recommended).
6. **Face-based photo ranking:** hold until Q2 is answered (recommended).

Asks (owner only): engage the attorney and send them this file with the brief (add Q45 to Q66); sign DPAs with any print-and-mail partner or address vendor once Fulfillment chooses; obtain written class-of-mail and retention terms from that partner; apply for Google OAuth verification only if Integrations builds the Google import; fill in the company legal name and mailing address before any email goes to a guest.

## 9. What I did not verify

- Texts of Lob, PostGrid, Thanks.io, Gooten and Prodigi mailing terms and DPAs; the CTO's candidate vendors. Not opened.
- State comprehensive privacy laws beyond California's regulation text; teen and children's laws (see 02 s3 [S]).
- CAN-SPAM 16 CFR 316.3 primary-purpose test; TCPA; federal nonmailable-matter law; state harassment statutes; money-transmission law; state return-right exemptions.
- Whether Google's contacts scope is "sensitive" or "restricted" (vendor guides only), and the current USPS API terms (legacy page via search results).
- The second half of DMM 201 (nonmachinable details, surcharge conditions) and the issue date of the DMM pages.
- Whether the 50-state definitions of sensitive data cover dietary notes.

## Sources (read 2026-10-15 unless noted)

- USPS DMM 133 (First-Class requirements): https://pe.usps.com/text/dmm300/133.htm [V]
- USPS DMM 201 (letters and cards, dimensions): https://pe.usps.com/text/dmm300/201.htm [V, partial]
- USPS Notice 123 (price list, effective 2026-10-04): https://pe.usps.com/text/dmm300/Notice123.htm [V, partial]
- USPS address information API page (via search snippet): https://www.usps.com/business/web-tools-apis/address-information-api.htm [S]
- 11 CCR 7012: https://www.law.cornell.edu/regulations/california/11-CCR-7012 [V]
- 11 CCR 7002: https://www.law.cornell.edu/regulations/california/11-CCR-7002 [V]
- 15 USC 7702: https://www.law.cornell.edu/uscode/text/15/7702 [V]
- 16 CFR 316.2: https://www.law.cornell.edu/cfr/text/16/316.2 [V]
- Google API Services User Data Policy: https://developers.google.com/terms/api-services-user-data-policy [V]
- Google contacts scopes: search results (CloudSponge, Nylas guides) [S]
- Repo documents named at the top of this file, as read 2026-10-15.
