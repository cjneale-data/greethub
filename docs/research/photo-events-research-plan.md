# Photo cards and events: research plan

Customer Research Lead, 2026-10-15. PROPOSED; nothing has been fielded. Sources read: `docs/products/photo-cards-and-events-plan.md` (s8), `docs/products/photo-events/pm-roadmap.md` (go/no-go table, Phase 1 scope, success metrics), `docs/cx/07-photo-events-ux.md` (flow A, proof step s4, mobile s5, accessibility s6), and this folder's README, `01`, `02`, `03`, `06`. Rules of this folder (README "Rules for every study") apply in full: adults 18+ only, no real child's photo, P-ids only, free text read by a person and never sent to a model, owner recruits and pays.

Four studies:

| Id | Study | Who | Feeds | Window |
|---|---|---|---|---|
| R-PE1 | Holiday photo card survey | Recent holiday photo card senders | Oct 24 call (advisory), Phase 1 price and quantities | Field Oct 17 to 21, read-out Oct 22 |
| R-PE2 | Holiday sender interviews, with a proof-check exercise | Same audience | Oct 24 call (advisory), proof step design | Oct 17 to 22 |
| R-PE3 | Engaged couples survey and interviews | Couples 4 to 15 months from their wedding | Phase 2 scope (build starts Jan 5) | Nov 2 to Dec 12 |
| R-PE4 | Usability test: collage editor and proof step | Holiday senders and couples | Phase 1 ship gate (if go), else Phase 2 | If go: Nov 10 to 14. If no-go: Jan 5 to 16, 2027 |

## 1. What research can and cannot do for the Oct 24 decision

The PM's ten go/no-go criteria are all operational (printer, price at the real quote, attorney, persistence, engine, intake, capacity, templates, physical proof, reprint policy). **No survey answer can turn a no-go into a go.** Research can do three things:

1. Turn a technical "go" into "no-go" or "go, but narrower", if demand inside the Phase 1 window is too thin to be worth the engineer days the PM says belong to the main launch.
2. Check the Phase 1 shape (25/50/100, ship to me, blank envelopes, $1.99/$1.79/$1.59, order-by Dec 5) against what senders do and expect.
3. Show how much the attorney gate (criterion 3, B11) actually bites: if almost every holiday card shows children, Phase 1 cannot take real orders until the attorney's written answers arrive.

Nine days is short. With a panel survey (owner approves spend by **Oct 16**) the Oct 22 read-out can give percentages. Without it, interviews from the owner's own network give **direction only**, reported as counts ("4 of 6"), and the read-out says so.

### 1.1 Answers that would change the Oct 24 call

Proposed thresholds for the owner; they are judgment calls, not statistics. "Qualified" means passed the R-PE1 screener (s3.1). Each line names the question that measures it.

| # | If we find | Then recommend | Measured by |
|---|---|---|---|
| D1 | Fewer than 30% of qualified senders usually place their order between Nov 20 and Dec 5 (the only window Phase 1 is open) | No-go, or go only if the 30-order allowlist is already warm. The window does not hold enough natural demand to learn from | H5, H6, interview 2 |
| D2 | 80% or more of planned 2026 cards show a child | Owner should treat criterion 3 as the deciding gate: no attorney answers by Nov 13 means no Phase 1 orders, whatever else is ready | H8 |
| D3 | 50% or more say printed recipient addresses or mailing for them is needed for them to switch from what they use now | Phase 1 (blank envelopes, ship to me) is a weaker offer than assumed. Go only as a learning soft launch; message envelopes plainly; pull addressing forward in Holiday 2027 | H10, H11 |
| D4 | Median "getting expensive" price for 50 flat 5x7 cards with envelopes is below $1.79 a card ($89.50), or median "too expensive" below $1.99 | CFO re-checks the bands before go; flag that contribution may miss the 25% guardrail | H13 to H15 |
| D5 | Under 40% of qualified senders would consider a site they have not used before for this year's cards | No-go for 2026: switching is the problem, not the product, and Holiday 2027 with reviews and addressing is the better first season | H16, interview 4 |
| D6 | Quantities cluster outside 25/50/100 (for example 35 to 45 or 60 to 80 is the most common band) | Keep the go criteria; ask CFO and Shop whether a 75 band is cheap to add | H7 |
| D7 | Interview proof exercise: fewer than 4 of 6 catch the wrong year, or fewer than 3 of 6 catch the name spelled two ways, with the checker panel shown | Proof step (cx/07 s4) needs a change before go; tell CX and the card engineer now | Interview 5 |

If none of D1 to D7 trips, research has nothing against go. If two or more trip, research recommends no-go regardless of the technical criteria.

Engaged couples (R-PE3) have **no bearing on Oct 24**. Their answers feed Phase 2 scope by Dec 15, before the Jan 5 build.

## 2. Timeline

| Date | Step | Owner |
|---|---|---|
| Oct 16 | Approve panel, incentives and the R-PE1 survey; consent form `03` reused (attorney review still open) | Owner |
| Oct 17 | Survey live; interview invites sent from the owner's network or the panel's interview add-on | Owner, research |
| Oct 17 to 22 | Six 30-minute interviews | Research moderates, second person notes |
| Oct 21 | Survey closes (or at 150 qualified completes) | Owner |
| Oct 22 | Read-out to PM, CFO, CX: D1 to D7 with numbers, quotes and a recommendation | Research |
| Oct 24 | Go/no-go | Owner |
| Nov 2 to Dec 12 | R-PE3 couples | Research, owner recruits |
| Nov 10 to 14 (go) or Jan 5 to 16 (no-go) | R-PE4 usability | Research, CX |

## 3. Recruiting

All recruiting, incentives and panel contracts are owner tasks. The screener answers stay with the recruiter; only the P-id and profile line come to us. Adults 18+ in the US only. Exclude anyone in web, software, marketing, research or a card or photo-gift company, and anyone who knows the team (as `02` Q5).

### 3.1 Holiday sender screener (adds to `02`, reuses `02` Q1, Q2, Q5, Q6, Q8)

- **HS1.** "Last holiday season (Nov to Dec 2025), did you send printed holiday cards that had your own photos on them?" Yes / No, but I sent cards without photos / No cards. *Only Yes qualifies.*
- **HS2.** "About how many did you send?" Under 10 / 10 to 24 / 25 to 49 / 50 to 99 / 100 or more. *Under 10 ends.*
- **HS3.** "Who chose and ordered them?" Me / Me with someone else / Someone else. *Someone else ends.*
- **HS4.** "Do you plan to send photo cards this year?" Yes / Maybe / No. *Keep No for the survey (lapsed senders tell us why); interviews take Yes or Maybe only.*

Interview quotas (six people): at least 2 parents with children at home, 1 grandparent or adult with no children at home, 1 who has already ordered for 2026, 1 who sends 100 or more, 1 wary of AI (`02` Q8), at least 2 outside big cities, at least 2 on a phone as main device.

### 3.2 Engaged couples screener

- **EC1.** "Are you engaged and planning a wedding?" Yes / No. *No ends.*
- **EC2.** "When is the wedding?" Under 4 months / 4 to 8 months / 9 to 15 months / Over 15 months / No date yet. *Under 4 or over 15 ends for the survey; interviews prefer 4 to 12.*
- **EC3.** "Have you sent save the dates yet?" Yes, printed / Yes, digital only / Not yet, planning to / Not planning to.
- **EC4.** "Who is mainly handling stationery and invitations?" Me / Shared / My partner or someone else. *Partner or someone else ends.*
- **EC5.** "Roughly how many guests are you inviting?" Under 50 / 50 to 100 / 101 to 150 / 151 to 250 / Over 250.

Quotas (interviews, six): mix of guest counts, at least 2 who have already sent save the dates (fresh memory), at least 1 destination or long-distance wedding, at least 1 second marriage or courthouse-plus-party (shorter, digital-first).

### 3.3 Where to find people

| Source | Speed | Notes |
|---|---|---|
| Paid online panel with incidence targeting (owner picks) | 3 to 5 days | Only route to 150 completes by Oct 21. Holiday photo card incidence is not known; ask the vendor for a quote and an incidence check before approving. Cost not found; get a written quote |
| Owner's network and the soft-launch allowlist (people who opted in to research, `02` s3) | 1 to 3 days | Fine for interviews; not for percentages (they like us already) |
| Wedding and parenting communities | Slow, rule-bound | Only with the community's permission; never post as a customer. Social lead may help for R-PE3 |

Incentives: owner sets. `06` suggests half the usability rate for a 30-minute interview; same here.

## 4. Sample sizes

| Study | Target | Why |
|---|---|---|
| R-PE1 survey | 150 qualified completes; at least 80 parents with children at home | A proportion near 50% at n=150 has a 95% margin of about plus or minus 8 points, enough to tell 30% from 50% on D1 to D5. Parents subgroup at 80 is about plus or minus 11 points |
| R-PE2 interviews | 6 | Direction and language, not rates. Six usually surfaces the main themes; stop early if the last two add nothing new |
| R-PE3 survey | 100 qualified completes | Scope questions only; plus or minus 10 points is enough to rank features |
| R-PE3 interviews | 6 | As above |
| R-PE4 usability | 5 plus 1 assistive-technology user, then a 3-person retest after fixes | Same as round 1 (`01`, cx/04). Pass and fail is per participant, reported as counts |

If R-PE1 falls short: report percentages only at n of 100 or more, counts below that, and never a percentage under n=10 (`06` s6).

## 5. Interview script: holiday photo card senders (R-PE2, 30 minutes)

Video, screen share for part 5 only. Consent `03` read and ticked first (without the self-photo box). Rules from `06`: past behaviour before opinions, never pitch, no competitor brands in our materials (participants may name them), no photos of children on screen. Do not ask for names, ages or photos of any child, or for anyone's address list.

**1. Warm-up (2 min).** "Tell me about the cards you sent last December." Who to, roughly how many, and why you send them.

**2. Last season, step by step (8 min).**
- "When did you start thinking about them, and when did you actually order?" Get the dates as close as they can. (D1)
- "Walk me through how you made them." Where, what device, how long, how many sittings, who else was involved.
- "How did you pick the photos?" Where were they (phone, cloud, someone else's phone)? How many did you look at? Any you wanted but could not use, and why?
- "What went wrong, or nearly went wrong?" Probe: blurry print, crop cut off a head, typo, late arrival, ran out of cards, envelopes, addressing.
- "When the box arrived, what did you do next?" Probe: addressing by hand, labels, stamps, how long it took, who did it. (D3)

**3. This year (5 min).**
- "Where are you with this year's cards?" Already ordered / chosen / not started. If not started: "When do you think you'll do it?" (D1)
- "Will the photos have kids in them? Pets? Just adults? Places?" Only the categories, no details. (D2)
- "What would make you switch from what you used last year?" Then: "What would stop you?" (D5)

**4. A new site (5 min).** Describe without brand: "A site where you upload a few photos, it places them in a designed 5x7 flat card with a back side, checks your names and dates before you approve, and ships you 25, 50 or 100 with envelopes. You address and stamp them yourself."
- "What's your first reaction?" Let them talk.
- "What would you want to know before you ordered from a site you hadn't used?" Their list, in their words.
- "You address them yourself. How does that sit with you?" (D3)
- Price, Van Westendorp-lite for **50 cards with envelopes**: too cheap to trust / getting expensive but still worth it / too expensive. Record the totals they say; convert to per card later. (D4)

**5. Proof-check exercise (7 min).** Share a static proof image on screen: front and back of a fictional card, made from a design template with **landscape and pet placeholder photos only, no people**. Next to it, the read-back panel and checker exactly as cx/07 s4 describes, as a static mock. Seeded errors:
- the back says 2025 (the checker flags it),
- the family name is "The Riveras" on the front and "The Rivera's" on the back (the checker flags "spelled two ways"),
- the greeting says "Happy Holidys" (the checker does not catch spelling in greetings).
Say: "Imagine you are about to order 100 of these. Check it as you normally would, and tell me when you would press Approve." Do not point at the panel. Score each error: found (yes/no), and whether they found it on the card, in the read-back panel or in the warnings. (D7)

**6. Wrap-up (3 min).** "If you could change one thing about making holiday photo cards, what would it be?" Research re-contact question only if they ticked it.

## 6. Interview script: engaged couples (R-PE3, 30 minutes)

Same rules and consent. Do not ask for guest names, addresses, or photos.

1. **Warm-up (2 min).** "Tell me about the wedding: when, where, how big, and where you are in planning."
2. **Save the dates (8 min).** If sent: "Walk me through how you made and sent them." Format (card, postcard, magnet, digital), photo, how many, where, how long, what it cost in total including postage, what went wrong. If not sent: "What's your plan, and what's holding you back?" Probe the guest address hunt: where did addresses come from (spreadsheet, texts, a wedding site), how long it took, who chased them.
3. **The website and QR (4 min).** "Do you have a wedding website? Did you put it, or a QR code, on the save the date? Did guests use it?"
4. **Invitations and RSVP (6 min).** "How will guests reply: paper card, website, text?" "What do you need to know from them?" (attending, party size, meals, songs, kids). "What worries you about tracking replies?"
5. **Paper versus digital (4 min).** "Which guests get paper and which get a link? Why?" "Would you send both from one design?"
6. **Mail for me (3 min).** Describe: "We print, address, stamp and mail each card to your guest list; postage at cost." Reaction, worries (addresses being wrong, the data being kept), and what it would be worth over doing it yourself.
7. **Wrap-up (3 min).** "What's the most stressful part of wedding stationery?" Re-contact question.

## 7. Surveys

About 5 minutes each, mobile first, single page per question group. No brand names in our answer options (an open "which site, if you want to say" box is fine). No question asks for a child's name, age or photo, a guest's personal data, or health. Survey free text is read by a person only.

### 7.1 R-PE1 holiday photo card survey (after screener HS1 to HS4)

**Last season**
- **H1.** How did you make them? An online photo card site / A store photo counter / A design app, then printed elsewhere / A local printer / Other (text).
- **H2.** Which device did you mostly use to design them? Phone / Tablet / Computer.
- **H3.** Roughly what did you spend on the cards, not counting postage? Free number in dollars, or "Don't know".
- **H4.** What, if anything, went wrong? (select all) A photo printed blurry / A crop cut someone off / A typo or wrong name / Arrived later than I wanted / Too few cards / Envelope problems / Addressing took ages / Nothing went wrong / Other (text).
- **H5.** When did you place the order? Before Nov 1 / Nov 1 to 19 / Nov 20 to Dec 5 / Dec 6 to 15 / After Dec 15 / Don't remember. (D1)

**This year**
- **H6.** Where are you with this year's cards? Already ordered / Picked a design, not ordered / Not started, will order before Nov 20 / Not started, will order Nov 20 to Dec 5 / Not started, will order after Dec 5 / Not sending this year (go to H6b). (D1)
- **H6b.** (if not sending) Why not? (select all) Cost / Postage / Time / Switched to digital / Nothing to share this year / Other (text). Then end.
- **H7.** How many will you order? Number. (D6)
- **H8.** Who will be in the photos? (select all) Children / Adults / Pets / Places, no people / Not sure yet. (D2)
- **H9.** How many photos on the card, front and back together? 1 / 2 to 3 / 4 to 6 / 7 or more.

**Envelopes and mailing**
- **H10.** How did you address them last year? By hand / Printed labels at home / The site printed them / The site mailed them for me / Someone else did. (D3)
- **H11.** To try a new site this year, how important is each? Very / Somewhat / Not. a) Envelopes included. b) Recipient addresses printed on envelopes. c) Site mails each card for me. d) A check for typos in names and dates. e) Arrives by a guaranteed date. f) Premium paper or foil. (D3)
- **H12.** If a site mailed each card for you, postage at cost, what would you pay on top of postage per card? $0 (wouldn't use it) / up to $0.25 / $0.26 to $0.50 / $0.51 to $1 / more than $1. (Phase 2 input)

**Price** (for "50 flat 5x7 photo cards, two-sided, envelopes included, shipped to you", totals in dollars) (D4)
- **H13.** At what total would they seem so cheap you'd doubt the quality?
- **H14.** At what total would they start to seem expensive, but still worth considering?
- **H15.** At what total would they be too expensive to consider?

**Trust and switching** (D5)
- **H16.** How likely would you be to order this year's cards from a site you have not used before? Very / Somewhat / Not very / Not at all.
- **H17.** What would you need to see first? (select all) Reviews from other customers / Sample prints / A clear delivery date / A reprint promise if it goes wrong / Clear rules on what happens to my photos / Other (text).
- **H18.** (optional) Some sites offer an AI-illustrated background or a drawn family portrait instead of photos. Interested / Maybe / Not for me. (Later phase; no bearing on Oct 24.)

**About you** (optional): children under 18 at home (Yes / No / Prefer not to say); US region.

### 7.2 R-PE3 engaged couples survey (after screener EC1 to EC5)

- **C1.** Save the date format sent or planned (select all): Flat card / Postcard / Magnet / Digital only / Both paper and digital / None.
- **C2.** How many save the dates? Number.
- **C3.** Photo on it? Engagement photo / Other photo / No photo, design only.
- **C4.** Wedding website? Yes, with RSVP / Yes, no RSVP / No. QR on the save the date? Yes / No / Not sure.
- **C5.** How will guests RSVP? Paper card / Website / Text or call / Mix.
- **C6.** Information you collect (select all): Attending / Party size / Meal / Dietary needs / Kids coming / Song requests / Address updates / Other.
- **C7.** Where do guest addresses live now? Spreadsheet / Notes or texts / Wedding site / Paper / Not gathered yet.
- **C8.** Importance (Very / Somewhat / Not): matching save the date and invitation; printed guest addresses; mail for me; digital version of the same design; RSVP page with reminders; typo and date check; magnets.
- **C9.** For mail for me, extra you'd pay per card on top of postage (same bands as H12).
- **C10.** Van Westendorp-lite for "100 flat 5x7 save the dates with envelopes", totals (three questions as H13 to H15).
- **C11.** Biggest stationery worry (text).

### 7.3 Post-order survey timing for photo cards (if Phase 1 goes)

Follows `04-surveys-nps-csat.md`; nothing here asks anything during design, proof, cart or checkout.
- One survey per order, sent at the **later of delivered + 3 days**, so they have opened the box, **and no later than Dec 21**, so it lands before the holiday. If delivery is after Dec 21, send Jan 6.
- Questions: print quality (1 to 5), photo sharpness as expected (Yes / No), any typo or wrong detail (Yes / No, then text), envelopes fine (Yes / No), NPS last and optional.
- Suppress while a support contact is open (README rule 5).
- Couples (Phase 2): send 7 days after delivery, never after the wedding date.

## 8. Usability test: collage editor and proof step (R-PE4)

Master guide stays cx/04 (moderator rules, severity, think-aloud). This section adds the photo card specifics.

**Entry criteria (all true):** Phase 1 editor flow A steps 1 to 6 (cx/07 s1) on a preview with B1 persistence; the collage engine rendering the real templates; the proof page with read-back panel, checker and two ticks (cx/07 s4); checkout in Stripe test mode, no printer submission. **No paid model calls needed**: Phase 1 has no AI art. If go, pilot Nov 10, sessions Nov 11 to 13, synthesis by Nov 15, S1 fixes before the Nov 20 gate. If no-go, run Jan 5 to 16 on the Phase 2 build and add the save the date tasks.

**Participants:** 4 holiday senders, 1 engaged person (if Phase 2 build), 1 assistive-technology user (keyboard only or screen reader; cx/07 s6). At least 3 on a phone at 390 px width; one grandparent-age participant on a tablet.

**Photo kit (fictional, no children).** Eight photos of fictional adults, a dog, a snowy street and a living room, made once from text descriptions only, checked by a person for resemblance to real or famous people, stored in the owner's private storage, not this repo (same process as `01` s4a). Use an existing design sample asset where one fits. Built into the kit: one 640 px photo (sets off the < 200 DPI warning in the 4-grid and the < 150 block in the 1-up), one portrait and one landscape, one with the main face near the edge (tests the attention crop), one HEIC. Participants never upload their own photos. Making the kit needs an owner dollar cap (about $0.30 estimated in `01`).

**Seeded flaws.** The participant continues from a prepared draft for "The Riveras" with:
1. year 2025 on the back (checker flags),
2. "The Rivera's" on the back (checker flags "spelled two ways"),
3. "Happy Holidys" in the greeting (checker does not flag),
4. the 640 px photo in a large slot (DPI warning).

**Tasks** (read aloud; the card is for the fictional family):
1. "Start a holiday card from your photos. Use these four." (Start door, photo tray, consent boxes, auto-place.)
2. "The dog is cut off. Fix it so you can see all of him." (Pan, zoom, Fit; on keyboard: arrows and F.)
3. "Swap the street photo with the living room photo." (Swap on phone without drag.)
4. "Change the greeting to one you like and sign it from the family." (Text sheet, overflow message.)
5. "Get it ready to print 50. Check it the way you would if this was your card." (Proof: flaws 1 to 4.)
6. "How much will this cost, and when will it arrive?" (Quantity chips, envelopes line, order-by date.)
7. "You've noticed a mistake after approving. What do you do?" (Edit cut-off, re-approval.)

**Measures and pass criteria (per participant, counts):**

| Measure | Pass |
|---|---|
| Flaw 1 and 2 fixed before approval | 5 of 6 |
| Flaw 3 found | 3 of 6 (tells us whether the read-back panel works without a checker hint) |
| DPI warning understood: participant can say what "May print soft" means and does something about it | 5 of 6 |
| Task 2 done on phone without an assist | 4 of 5 phone and tablet users |
| Keyboard or screen-reader participant completes tasks 2, 3 and 5 | Yes, with announcements heard (cx/07 s6) |
| Task 6: states price per card, total, envelopes and arrival date correctly | 5 of 6 |
| "Approve and print 50 cards": participant knows the count before pressing | 6 of 6 |
| Time from proof open to approval | Recorded, no pass bar; very short times with missed flaws are a finding |

Any participant who approves with flaw 1 or 2 uncaught, after seeing the checker, is an S1 finding.

## 9. Analysis and outputs

- Notes in `docs/research/findings/` with the `07` template, P-ids only. One findings file per study: `findings/photo-events-r1-holiday.md` (R-PE1 and R-PE2 together, for the Oct 22 read-out), `findings/photo-events-r3-couples.md`, `findings/photo-events-r4-usability.md`.
- R-PE1: each D threshold reported as value, n, and margin; open text coded by a person.
- Every finding: quote, count, severity (cx/04 scale), recommended fix, owner team.
- Tickets go to the CX backlog as below; CX owns `docs/cx/05-backlog.md`.

## 10. Tickets proposed for the CX backlog

| Id (proposed) | Ticket | Severity | Depends on |
|---|---|---|---|
| RES-7 | Field R-PE1 survey and R-PE2 interviews; Oct 22 read-out against D1 to D7 | S1 (feeds Oct 24) | Owner: panel and incentives by Oct 16 |
| RES-8 | Static proof-check mock for interview part 5: template with no-people placeholders, read-back panel and checker as cx/07 s4, three seeded errors | S1 (needed Oct 17) | Head of Design (template image), CX (panel copy) |
| RES-9 | R-PE4 usability on the Phase 1 editor and proof; seeded-flaw draft fixture for "The Riveras" | S1 if go (Nov 20 gate), S2 if no-go | Card engineer (fixture), B1, cx/07 s4 built |
| RES-10 | Fictional no-children photo kit for photo card tests, with the edge cases in s8 | S2 | Owner cap (about $0.30), design sample assets |
| RES-11 | Photo card post-order survey timing (s7.3): later of delivered + 3 days, cut off Dec 21 | S3 | Data (event `survey_sent` with `survey_type=photo_card`), RES-2 |
| RES-12 | Greeting spell check gap: the proof checker does not look at greeting spelling; test in R-PE2 and R-PE4 whether people catch it unaided, then decide | S2 | Model evals, card engineer |
| RES-13 | R-PE3 couples study before Phase 2 scope lock (Dec 15) | S2 | Owner recruits |

## 11. Privacy, consent, safety

- Consent form `03` covers interviews and usability; it still needs attorney review (README). No self-photo arm in these studies.
- We never collect participants' address books, guest lists or photos. Questions about addresses are about process only.
- The proof mock and the photo kit show no children and no real people (standing rule 5).
- No living artist, studio or brand appears in our materials (standing rule 6). Participants may name competitors; notes record "an online photo card site" unless the name matters to the finding.

## Owner asks

1. By Oct 16: approve the R-PE1 survey, pick and pay a panel (get a written quote and incidence check), set interview incentives. Without this the Oct 22 read-out is direction only.
2. Recruit six holiday-sender interviews for Oct 17 to 22 (network or panel add-on).
3. Set a dollar cap for the fictional photo kit (about $0.30 estimated).
4. Recruit couples for November.
5. Keep consent form `03` on the attorney's list.

## Needs from teammates

- **Head of Design:** one front and back template image with no-people placeholders for the proof mock, by Oct 16.
- **CX:** read-back panel and checker copy for the mock; fold R-PE4 into cx/04 if go.
- **Card engineer:** seeded-flaw draft fixture for R-PE4 (preview only).
- **CFO:** read D4 at the Oct 22 read-out; confirm the per-card bands to test.
- **PM:** confirm research input to Oct 24 is advisory and D1 to D7 are acceptable thresholds.
- **Head of Data:** `survey_type=photo_card` for RES-11.
