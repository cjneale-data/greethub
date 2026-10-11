# Usability test plan: 5 moderated sessions

Owner: Head of Customer Experience. Run once on the staging build with live adapters (real image models, Stripe test mode, printer sandbox) after the Must-fix tickets in 05-backlog.md are done. Run it again on the first production-like build and after any big change. Mock mode is not enough: the art, the waiting and the delivery estimates are what we are testing.

## 1. Goals

1. Can a first-time customer make, approve and pay for a card without help? A book?
2. Do they understand what is free, what costs money, what is AI, what happens to their photos, and when it arrives?
3. Do they catch mistakes in the proof?
4. Does the 5 to 15 minute wait feel okay?
5. Can they get help, and how do they feel about the answer?

## 2. Recruitment

**Who:** five people. Adults 18+, U.S.-based, who have bought a personalised gift or card (Etsy, Shutterfly, Minted, Hallmark, a photo book) in the last 12 months, and who are the parent, grandparent, aunt or uncle of a child aged 0 to 8 (for the book). Not friends of the team; not designers, engineers or marketers.

**Mix (one person can cover two lines):**
1. Mother, 30 to 40, daily phone user, iPhone.
2. Father or step-parent, 30 to 45, mostly phone, Android.
3. Grandparent, 60+, tablet or laptop, low-to-medium tech confidence (tests accessibility, text size, step clarity).
4. Gift buyer without children (aunt, uncle, friend) who sends cards for occasions; tests the card flow and mailing to someone else.
5. A person who uses assistive technology or has a low-vision or motor need (screen reader, zoom, or switch/keyboard). Recruit through a disability-focused panel; pay a higher incentive.

Devices: at least three sessions on the participant's own phone, at least one on a laptop, one with a tablet or assistive setup. Browser: whatever they use.

**Sources:** a recruitment panel (UserInterviews, Respondent; budget about $50 to $90 per participant for 45 minutes) or a local parents' group, school community, or the owner's network of second-degree contacts (people who do not know us). Screen with five questions (purchase of personalised gifts, child in life, device, availability, comfort speaking while using a screen). Offer a $60 gift card, plus $100 for the accessibility participant. Total about $350 to $450 for 5, plus panel fees if used (about $50 for 5 on a pay-per-participant plan; verify).

**Consent and privacy.** Written consent for screen and audio recording, explained in plain words. Use **fake child photos**: give each participant a set of stock photos of children from a licensed library, or use an adult's photo, or an AI-generated face. **Never ask a participant to upload their own child's photo in testing.** Explain that nothing they enter is real, that payment is a test card, and that they can stop at any time. Recordings stored privately, deleted after 90 days; clips used for presentations only with names removed. The moderator does not record the screen when they stray into personal accounts.

## 3. Logistics

- 45 to 60 minutes per session, remote by video with screen share, or in person (one session in person for the assistive technology user).
- Two staff: a moderator and a note-taker (the CTO or CMO observes silently; no helping, no defending).
- Environment: a clean test account for each participant (no previous drafts). Test card 4242 for success; use the decline test card for the decline task. Printer sandbox. A test inbox participants can open (a shared mailbox address we control, so they can see emails without using their own).
- Schedule: two sessions a day over three days. Debrief after each, a synthesis after the fifth.
- Pilot first with one colleague to catch broken tasks.

## 4. Moderator guide

**Warm-up (5 min).** Introduce, consent, "we're testing the website, not you; there are no wrong answers; think aloud; I won't be able to help during tasks, but I'll answer questions at the end." Background questions: who they last made or bought a personalised card or photo book for, how it went, what worried them. Ask about photo habits ("Do you share photos of your family online?" "How do you feel about AI?"). Note their comfort with AI so we can read their reactions.

**First impression (3 min).** Show the home page for 10 seconds, then ask: "What is this site for? Who is it for? What would you expect to pay? What would you do next?" Do not say what it is.

**Tasks.** Read each task aloud. Do not describe the UI. Time each task. Prompts allowed: "What are you thinking?" "What would you do next?" "What did you expect?" Do not rescue until they give up or hit 3 minutes with no progress (then note "assisted at x:xx" and give the smallest hint).

Task 1, Card (about 10 min). "Your friend Maria's birthday is next week. Make her a card from this site. She loves gardening and has a small dog called Biscuit." Success: gets a guest preview. Then: "Now say you like it and want to send it to her" (account wall). Observe: do they understand why an account is needed? Do they notice "AI"? Can they edit the message? Do they find "Re-roll"? Do they use Chat or Form?

Task 2, Book (about 20 min, with a half-time break). "Your niece Lily is 4. Make a picture book for her birthday about her and her grandpa finding a lost kite. Here are her photos on this laptop/phone." (stock photos.) Observe: the form length, the sign-in gate, the consent boxes (do they read? do they understand? do they stop?), upload on phone, step labels, the sheet approval ("Is this Lily?"), what they do while it draws (with live adapters this wait is real), whether they notice the "you can leave" and email promise, the proof: how they look at pages, whether they spot the deliberately planted issue (one page with a seeded flaw: misspelled name in a prepared draft, or an odd hand), what they tick before approving.

Task 3, Checkout (about 8 min). "Buy the book and the card. Send the card straight to Maria at {fake address}, and the book to yourself." Success: paid. Use the decline card first: "Your bank says no. What do you do?" Then success. Observe: do they understand total and tax, the delivery date, the PO box message, the policy link; do they read the acknowledgement; how do they respond to "Earliest arrive-by date"; what do they think "Standard (included)" means.

Task 4, After the order (about 5 min). "A week later you have not got your book. Find out where it is." Then: "You notice the name on the cover has a typo. What do you do?" Success: finds order tracking; finds the help route; the first move toward cancel or contact. Observe whether they use the help center, the order page button or the footer; whether they find the refund policy and understand it. Then the support probe: send them a real reply from the support inbox (a macro) and ask: "What do you think of this answer? What would you do next?" (This checks tone and clarity of macros 5 and 9.)

Task 5, Photo trust (about 4 min). "A friend asks: is it safe to put my child's photo on this? What would you tell her? Show me where you'd look." Success: finds privacy explanation, deletion, 90-day rule. Then: "Delete your photos." Observe time and path.

Task 6, Accessibility run (assistive technology participant only, replaces Task 5 if time is short): repeat Task 1 and the checkout with their setup. Note every blocker.

**Wrap-up (7 min).** Ask: "What was the best part? The most confusing? Would you use this? Who for? What would stop you? How much would you pay for the book and card? Was anything a surprise? How did the AI part feel? How would you feel about giving your child's photo?" Then SUS (10 questions, 1 to 5), the single ease question after each task (SEQ, 1 to 7), and "What one thing would you change?"

## 5. What we measure per session

- Task success: complete, complete with help, failed.
- Time on task.
- Errors and false starts (count per task).
- SEQ per task (1 to 7).
- SUS at the end.
- Verbatim quotes with timestamp.
- Trust questions (5-point scale): "I understand what happens to the photos"; "I know what this will cost me"; "I know when it will arrive"; "I know what to do if something goes wrong"; "I'd feel comfortable giving this as a gift."
- Seeded flaw detection: found the flawed page before approving? (yes or no), at what point.
- Observed emotion (frustration, delight, confusion) with the screen moment.

## 6. Success criteria (pass = ready to launch)

With 5 users the aim is to find the big problems, not statistical proof.

| Criterion | Pass |
|---|---|
| Card task completed unaided (to guest preview and account) | 5 of 5 |
| Book task completed to approved proof unaided | at least 4 of 5 (with the live wait included) |
| Checkout completed incl. decline recovery | at least 4 of 5 |
| Find order tracking | 5 of 5 within 60 seconds |
| Find help for the typo scenario | at least 4 of 5 within 90 seconds, and the first move is correct (contact us; check the cancel option) |
| Understood the AI and photo handling (trust questions at 4 or 5) | at least 4 of 5 |
| Know the total price and delivery date before paying (4 or 5) | at least 4 of 5 |
| Spotted the seeded proof flaw | at least 3 of 5 before approval (if fewer, the proof flow in 03 doc needs work) |
| SEQ average per task | at least 5.5 |
| SUS average | at least 78 |
| Zero participants have an unrecoverable blocker; the assistive technology participant completes the card task | yes |
| Nobody says they would not trust it with a child's photo because of something we can fix | yes |

Any Severity 1 problem (blocks completion or causes a wrong purchase) found by 2 or more users holds launch until fixed and retested with 3 new users.

## 7. Severity and prioritisation

- **S1:** blocks or causes a wrong, unsafe or unfair outcome. Fix before launch.
- **S2:** causes significant confusion, delay or a support contact. Fix before launch if cheap, else first month.
- **S3:** annoyance or polish.
Rank by severity times how many of 5 saw it. A finding seen by 3 or more is a pattern; one by 1 person is noted and watched.

## 8. Findings template

Copy per session and one synthesis.

```
Session: P__ (profile, device, browser, date, moderator)
Consent recorded: Y/N      Recording link:
SUS: __   Trust Qs: photos __ cost __ arrival __ help __ gift __

Task results
| Task | Result (C / CH / F) | Time | Errors | SEQ | Notes |
|---|---|---|---|---|---|

Findings
| ID | Screen / step | What happened (observed, not interpreted) | Quote | Severity (S1-S3) | Seen by (n of 5) | Hypothesis | Proposed fix | Ticket |
|---|---|---|---|---|---|---|---|---|

Seeded flaw: found? at what point?
Best moments (keep these):
Surprises:
Follow-up questions:
```

Synthesis (one page): top five problems with evidence, five things that worked, trust scores, decisions needed, tickets created. Share within 48 hours of the last session. Store notes in `docs/cx/research/` (no names; use P1 to P5) and recordings in a private folder.

## 9. Support testing (separate, 1 hour, no participants)

Run a "mystery customer" drill with the team and 2 friends: send 10 real emails and form submissions covering macros 1 to 20 (with test orders), measure time to first response, whether the macros fit, whether order lookup takes less than 2 minutes, and whether the admin tools support every remedy (refund, reprint, cancel before production, resend email, delete data). Fix what fails before launch.

## 10. After launch

Run 3 short moderated sessions at day 30 with real customers who agree (offer a $25 credit); sample recordings from a privacy-safe session replay tool only if the owner and attorney approve it, and never on the creator, proof, cart or account pages (legal 06 req 44).
