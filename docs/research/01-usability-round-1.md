# Usability round 1: run sheet

Master guide: `docs/cx/04-usability-test-plan.md` (goals, moderator guide, measures, pass criteria, severity). This sheet fixes the parts 04 leaves open and corrects the parts that no longer match the build (2026-10-12).

## 1. Decision: when, and on what build

**Run it before launch and before Christmas, but not on today's build.** Today's build would only rediscover known S1s: no real art (CX-01), no help or contact page (CX-31, so Task 4 fails by construction), a one-checkbox proof (CX-05), a dead-end "Looks good" for signed-in card buyers (CX-46), no "proof ready" email, and local-disk storage that loses sessions on a preview (CTO).

**Entry criteria (all must be true):**
1. A Vercel preview with Supabase (SEC-18), Stripe test mode and the Lulu/Prodigi sandbox.
2. Live image models on, with a daily spend cap of about $15 for the round (owner sets it). Estimate: 5 books at about $1.26, 5 cards at about $0.25, plus re-rolls and the pilot. Mock art defeats goals 1, 3 and 4.
3. Real sample art on home and in the picker for the recommended styles (CX-01, design).
4. CX-05 (proof flow with page counter and spelling card), CX-31 (help and contact) and CX-46 (signed-in card path) merged.
5. A readable shared test inbox for the preview (QA's ask), so participants see the emails without using their own.
6. A seeded-flaw fixture (s5).

**Dates (working back from launch):** pilot by about Oct 30, five sessions over three days by about Nov 6, synthesis within 48 hours, S1 fixes and a 3-person retest by about Nov 13. If the entry criteria are not met by about Nov 6, do not launch to paid traffic without it. Fall back to an invite-only soft launch (cards first) and run round 1 in January before Valentine's. That matches the paid-spend gate (CMO) and the creator timing (social).

**Fallback if the build slips but people are free:** run the 30-minute assumption interviews (`06-interview-guide.md`) on the same recruits. They need no build and test A2, A3 and A8.

## 2. Changes to cx/04 (CX to fold in)

| cx/04 says | Change | Why |
|---|---|---|
| s2: "stock photos of children from a licensed library" | Use the fictional photo kit (s4). No real child's face, stock or otherwise | Standing rule 5: no real people in samples. Stock licences often restrict AI processing and sensitive uses (unverified per licence; check before any use). The photos also go to a third-party model |
| s8: notes in `docs/cx/research/` | Notes in `docs/research/findings/` | Research owns the folder |
| s2 "personalised", s7 "prioritisation" | US spelling | US launch (CMO) |
| s4 Task 2 "the you-can-leave and email promise" | Keep only if the "proof ready" email exists; else note it as a known gap and skip the probe | The email isn't built |
| s4 Task 4 "first move toward cancel" | Keep; score against CX-11 if shipped, else score "found help" only | No cancel button today |
| s6 pass criteria | Add: "The grandparent participant finishes the book task with at most one assist" | A7 |
| s10 day-30 sessions "with real customers who agree" | Recruit only from the research opt-in (02 s3), never from the order list directly | Consent and fatigue |

## 3. Participants

Five plus one pilot, per cx/04 s2, screened with `02-screener.md`, consent with `03-participant-consent.md`. Incentives per cx/04 ($60, $100 for the assistive technology participant; panel fees unverified). Owner approves the budget (CX owner ask 9) and does the recruiting.

## 4. Fictional photo kit

**4a. Default (all sessions).** A set of 6 to 8 photos of fictional people for the story "Lily (4) and Grandpa": three of the child, two of the grandfather, one together, one blurry and one side-on (to test the photo tips). Made once by the team with an image model from text descriptions only (no reference photos), checked by a person for realism and for any resemblance to a real or famous person, and kept in the owner's private storage, not in this repo. Log the model, date and approver. Cost about $0.30 (estimate); needs an owner cap. Load the kit onto the session device or share it as a download link the participant opens during the session.

**4b. Optional adult self-photo arm (A1 proxy).** At the end, a participant who wants to may upload one photo of themselves (adult only) and approve or reject the character sheet. This is the only way to test likeness acceptance before launch. It needs: the attorney's sign-off (biometric laws, for example Illinois BIPA, may apply to an adult face; unverified), the same consent boxes as a customer, deletion right after the session, and confirmation that zero-data-retention routing is live (legal 06 req 8). Skip it if any of these is missing.

## 5. Seeded flaw

Prepare one book draft per participant account with the proof already rendered, where page 7 spells the child's name "Lilly" and one hand has an extra finger. The participant continues from "Ready to review". Needs a preview-only seed script or admin action (book engineer); no customer data involved. Score: flaw found before approving (yes or no), and on which page view.

## 6. Task cards (read aloud; US spelling)

1. **Card.** "Your friend Maria's birthday is next week. Make her a card from this site. She loves gardening and has a small dog called Biscuit." Then: "You like it. Send it to her."
2. **Book.** "Your niece Lily is 4. Make a picture book for her birthday about her and her grandpa finding a lost kite. Her photos are in this folder." (Kit 4a.) Then switch to the seeded draft for the proof.
3. **Checkout.** "Buy the book and the card. Send the card straight to Maria at 12 Elm Street, Springfield, IL 62701, and the book to yourself." Decline card first, then 4242.
4. **After the order.** "A week later the book hasn't come. Find out where it is." Then: "You notice Lily's name is spelled wrong on the cover. What do you do?"
5. **Photo trust.** "A friend asks if it's safe to put her child's photo on this site. What would you tell her? Show me where you'd look." Then: "Delete your photos."
6. **Accessibility run** (assistive technology participant): Task 1 and Task 3 with their own setup.

The address in Task 3 is invented; do not use a real person's address.

## 7. Outputs (definition of done)

1. One notes file per session and one synthesis in `docs/research/findings/round-1/` using `07-findings-template.md`.
2. Tickets in the CX backlog for every S1 and S2 finding, each citing the finding id.
3. A one-line pass or fail against each cx/04 s6 criterion, and a launch recommendation (go, go with fixes, hold).
