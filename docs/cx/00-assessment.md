# CX assessment: GreetHub as built, 2026-10-10

Owner: Head of Customer Experience. Audience: owner, CTO, CMO, CFO.

## How this was done

I used the product the way a first-time customer would, in mock mode (`GREETHUB_MOCK_AI=1`, fake Stripe, fake printers) on `localhost:3000`. Playwright with Chrome drove every flow at 1280px and 390px, and I looked at the screenshots. Flows covered: home, browse, pricing, FAQ, sign-up, guest card creator (chat, form, preview, upgrade prompt), the six-step book creator (idea, photos and consent, story, characters, drawing, proof, approve), cart, checkout (validation, decline, pay), confirmation, order tracking, account (profile, addresses, drafts, people), delete-my-data, legal pages, cookie notice, 404.

Limits, so nothing here is over-claimed:
- Mock mode means the art is placeholder art. I cannot judge real render quality, real render duration, real Stripe or real printer behaviour. Those need a test with live adapters (see 04-usability-test-plan.md).
- I did a keyboard and DOM check by script, plus contrast maths from the tokens. I did not run a screen reader or axe. Items marked "verify" need that.
- Screenshots live in `docs/cx/screens/`. `shot-*` are the shop and card flows, `book-desktop-*` and `book-mobile-*` the book flow in order, `misc-*` the cookie notice, legal pages, 404 and mobile menu.

Severity scale: **S1** blocks launch or breaks trust/legality; **S2** hurts conversion or causes support tickets; **S3** polish or later. Ticket IDs (CX-xx) are in 05-backlog.md.

## Verdict

The bones are good. The flow is short, the voice is warm, consent is handled better than most products would, and the "approve the character before we draw 13 pages" step is the right design. A first-time customer can get from the home page to a paid order without help in mock mode.

What stops me recommending launch today is not the flow. It is that the product does not yet look or read like something you would trust with your child's photo and $39: no real artwork anywhere, placeholder legal text and company details visible to customers, a delivery date we cannot back up, a proof approval that is a single unenforced checkbox, and support that is a `mailto:` to an address that does not exist.

## What a first-time customer experiences today

1. **Lands on home.** Clean, calm, on-brand. Headline and CTAs are clear. Everything that should be a picture is a striped box. The promo badge says Mother's Day ships free until May 4, in October. The footer reads "GreetHub, [company legal name], [postal address]." (`shot-home-desktop`, `shot-home-mobile`)
2. **Tries a card as a guest.** This is the best part of the product. The guide announces it is an AI, one question at a time, quick-reply chips, a live editable brief card, a watermarked preview that flips, honest labelling "Low-resolution preview, AI-illustrated". The second-preview lock is explained kindly. (`shot-card-preview-desktop`, `shot-card-upgrade-desktop`)
3. **Starts a book.** One long form of five panels. The first sign-in demand arrives only after the customer has filled in the whole thing and pressed Next. (`book-desktop-01`, `book-desktop-05`)
4. **Photos and consent.** Thoughtful, legally aware, but heavy: two long required paragraphs. Upload is correctly locked until consent is saved. (`book-desktop-06`)
5. **Story, characters, drawing.** Clear progress and per-page tiles. No time estimate for a wait that will be 5 to 15 minutes in real life. (`book-desktop-11`)
6. **Proof.** A nice spread viewer. Approving needs one checkbox that is not tied to having looked at anything. (`book-desktop-14`)
7. **Cart, checkout, pay.** Short and clear, with sensible address validation (the PO box rule is a nice catch). The total shown is not the final total ("Tax: worked out at payment"). The arrive-by date is a bare ISO date. (`shot-cart-desktop`, `shot-checkout-desktop`)
8. **After paying.** The confirmation greets the customer by their email handle and shows no order number, no summary, no date. (`shot-confirmation-desktop`)
9. **Needs help.** There is nowhere to go except a `mailto:` link. (`shot-order-delivered-desktop`, `misc-desktop-report`)

## Findings

Format: ID, severity, evidence, what is wrong, fix. Backlog ticket in brackets.

### A. Trust gaps (children's photos, AI disclosure, price, proof, delivery)

**F-01 (S1) No real product imagery anywhere. [CX-01]**
Evidence: `shot-home-desktop`, `shot-browse-desktop`, `book-desktop-01` (look picker). Template cards are striped placeholders; the six art styles are flat colour swatches; the hero is two striped cards. A customer deciding whether to hand over a photo of their child has nothing to judge the output by.
Fix: before launch, commission or generate (with real runs, labelled AI-illustrated) 12 template covers, one sample spread per art style, and the Eye Story sample book once the family releases are signed (legal 06 req 47). Style picker shows a sample illustration of the same scene in each style. Never show an invented testimonial.

**F-02 (S1) Placeholder legal and company text is customer-visible. [CX-02]**
Evidence: `misc-desktop-terms` has an amber banner "Draft placeholder. The final wording comes from the legal review in docs/legal". Footer shows "[company legal name], [postal address]". Contact and report addresses are `hello@greethub.example` and `report@greethub.example`. Account page shows "Terms and Privacy accepted (version 2026-10-draft-1)". The Terms page is three sentences. Report content is an email address, not the form that legal 06 req 22 asks for.
Fix: ship real pages from the attorney-reviewed drafts, real address, real mailboxes. Until then, none of this can face a customer. Report page becomes a form (reason, link or order number, "this is my child", email) with a confirmation that states the 48-hour target.

**F-03 (S1) Stale and unproven promise on home. [CX-03]**
Evidence: "Mother's Day ships free until May 4" shows in October. It also contradicts the pricing page, which charges postage. Legal 06 req 13 bars delivery or shipping promises without evidence on file.
Fix: promo badge off by default; driven by a dated config with an end date; no "free shipping" copy unless the CFO has priced it.

**F-04 (S1) Delivery date is not trustworthy and not carried through. [CX-04]**
Evidence: checkout says "Earliest arrive-by date: 2026-10-18" (ISO format, computed in the browser by `earliestDeliveryDate()` and not from printer data); the cart shows no date; confirmation shows none; the order page has no estimate. Legal 06 req 36 wants production plus transit from real printer data and the promised date stored on the order.
Fix: server-side estimate range from printer quote ("Arrives Oct 21 to 25"), shown in cart, checkout, confirmation, confirmation email, order page; stored on the order; written in plain date format. Standard and Express each get a range. If the estimate moves, tell the customer (legal req 37).

**F-05 (S1) Proof approval is a single unenforced checkbox. [CX-05]**
Evidence: `book-desktop-14`. "I've looked at every page and I'm happy to print it." can be ticked without opening a page. No spelling confirmation of names, title, dedication. The wording is not the one legal specified (req 39: "I have reviewed and approve this proof. I understand it's made just for me and the Refund & Reprint Policy applies."). The proof screen has no AI-illustrated line, no refund link, no delivery estimate. Price excludes postage and tax and the "Add to cart" button is the only commitment point. The refund policy excludes anything visible in the approved proof, so this checkbox is what decides most disputes.
Fix: see the proof-approval flow in 03-quality-and-happiness.md: seen-pages counter, spelling check card, then legal-approved wording with the policy link, AI line, delivery range, total with postage. Store the page hashes (req 32).

**F-06 (S2) The customer can approve a character sheet without answering the question. [CX-06]**
Evidence: `book-desktop-09`. "Do these look like them?" offers Looks right / Something's off chips per character, but "Looks right, draw the book" is enabled regardless. If a customer says Something's off and still draws, 13 pages are spent on a character they rejected.
Fix: if any character is marked Something's off, the primary button becomes "Redo the sheet" and the note field opens; approval is blocked until all are Looks right. Verify behaviour with live adapters.

**F-07 (S2) Photo consent is strong but dense; two surprises. [CX-07]**
Evidence: `book-desktop-06`. Box B bundles five disclosures in one paragraph (AI vendors, printers, no face ID, no ad use, 90-day deletion). The privacy link opens a stub page. "Withdraw consent" uses a browser `confirm()` dialog. A "Signed in with the local test account" toast sits over the Save button on mobile (dev-only; make sure it cannot ship).
Fix: keep the two required boxes (legal needs them) but format B as a short sentence plus a "What happens to your photos" expander with the five points as a list. Replace `confirm()` with the branded modal. Show "Your photos: 2 added, delete anytime" with a visible delete-all. Remove the dev toast from production builds.

**F-08 (S2) Price clarity: the total moves after the customer thinks it is final. [CX-08]**
Evidence: cart total $55.97 but "Tax: Worked out at payment". Checkout labels Standard "(included)" while the cart charges postage ($2.99 and $5.99). Pricing page says "Faster shipping is $8.99 more per order" and checkout says Express "+$8.99 Faster courier service" with no days. Book proof shows $39 without postage.
Fix: price lines everywhere read "Book $39.00 + $5.99 postage". Call standard shipping "Postage" not "included". Show estimated tax once the address is known (Stripe Tax can compute before payment) or say "plus sales tax, shown on the next step before you pay" in the cart. Express shows days.

**F-09 (S2) AI disclosure is good in some places and absent in others. [CX-09]**
Working: Greet Guide opens with "I'm your Greet Guide, an AI" and a banner line; preview caption; cart; checkout; footer; FAQ.
Missing: book proof screen, confirmation, order page, order emails, templates on browse (they are AI-illustrated). Fix: one shared `AiNote` component placed on every screen that shows art or takes money.

**F-10 (S3) Gift buyers get no gift handling. [CX-10]** "To someone else" works but there is no gift message, no packing-slip-without-price option, no way to tell the recipient it is coming. Post-launch.

### B. Journey friction

**F-11 (S1) Order page has no way to cancel, though the policy promises it. [CX-11]**
Evidence: `shot-order-delivered-desktop`. The only action is "Ask us about this order" (a `mailto:`). Refund policy draft: "You can cancel from the order page until the status says In production." No cancel button exists in `Orders.tsx`.
Fix: Cancel button visible while status is Paid or Preparing; confirm modal states the refund and the 7-business-day timing; becomes "Contact us" after printing begins, with the reason.

**F-12 (S2) Confirmation page greets the email handle and says nothing useful. [CX-12]**
Evidence: `shot-confirmation-desktop`: "Thanks, walk-1791677222548. We're on it." Happens when no first name is stored. No order number, no items, no estimated arrival, no "what happens next".
Fix: greet by first name only if known, else "Thanks. We're on it." Show order number, items with recipient, delivery range, total paid, and three next steps (we email when it is printing; when it ships; where to track). Single persimmon CTA.

**F-13 (S2) Guest hits the account wall late in the book flow. [CX-13]**
Evidence: `book-desktop-05`. After five panels of input the customer is told to sign in. Entries survive (kept on device), which is good, but the surprise costs trust.
Fix: say on the first panel "Books use real photos, so you'll make a free account in a minute. Your answers stay put." Offer sign-in at the top ("Sign in to save as you go"). Per the CMO spec the gate belongs at photo upload; keep it there.

**F-14 (S2) Step labels collide. [CX-14]**
Evidence: stepper chip 2 "Meet the family" is the photos step; the character-sheet step (chip 4 "The characters") has the panel heading "Meet the family". The first chip on step 1 renders as a grey pill (looks disabled) rather than the cocoa "current" state used on the other steps (`book-desktop-01` versus `book-desktop-09`).
Fix: rename steps: Idea, Photos, Story, Characters, Pages, Proof. Panel headings must match the step name. Current step chip uses the same selected style on every step.

**F-15 (S2) Unhelpful form errors. [CX-15]**
Evidence: `book-desktop-02-brief-errors` and `book-desktop-03-brief-filled` (errors still showing after the fields were filled, until the next submit): under "How old is the reader?" the error says "How old is the reader?"; under story kind "Pick what kind of story."; under name, age, role just "Required". Errors repeat the label and do not say what to do. No summary at the top; on mobile the first error may be off-screen.
Fix: specific messages ("Pick a reading age so we match the words to the reader"), an error summary that links to each field, focus moved to the summary.

**F-16 (S2) Long waits have no time promise. [CX-16]**
Evidence: `book-desktop-11`: "Drawing page 8 (9 of 13) 62%" plus "You can leave this page. Your book keeps drawing and will be waiting here." The percentage reaches 62% in seconds in mock mode, but real pages take about 16 s each at 2K (`finance/measured_costs.json`), so a 13-page book is a few minutes and a 5 to 15 minute plan allows for queueing and retries. Nothing says how long, and nothing says we will email.
Fix: "About 8 minutes. We'll email you when it's ready; you can close this tab." Show elapsed. Tiles fill in as they finish (already good). See loading and long-wait patterns in 01-ux-ui-standards.md.

**F-17 (S3) Style picker cannot be judged (flat swatches), and the "kept on this device" note looks like a warning. [CX-01, CX-17]** The pink badge next to "Next: add photos" reads like an alert. Make it small grey helper text.

**F-18 (S3) Drafts and People are fine but empty states are thin.** "Nothing saved yet" works; add the next action ("Start a card") to every empty state. (`shot-drafts-empty-desktop`)

### C. Accessibility (WCAG 2.2 AA)

Contrast figures computed from the brand tokens.

**F-19 (S1) Form and control borders fail non-text contrast (1.4.11). [CX-19]**
`twine #D9CBB6` on paper is 1.5:1 and on white 1.6:1. It is the border of every input, chip, select, checkbox and the switch track. WCAG asks 3:1 for the visual boundary of a control. This is a brand-kit token, so it is a CMO and CX decision; I am making it as UX owner.
Fix: add a `--gh-control-border: #8C7B6E` (3.8:1 on paper, 4.1:1 on white, 3.4:1 on cream) for control outlines. Keep twine for decorative hairlines and card edges.

**F-20 (S1) Placeholder and helper text too faint. [CX-19]**
`cocoa-40 #A99888` is 2.6:1 on paper, 2.3:1 on cream. Placeholders ("First name", "she/her", "For Lee, with love") and "Tick the first two boxes" hints use it. Placeholders are not exempt. Disabled controls are exempt, but disabled buttons carry meaning here ("Add to cart" is disabled until you tick).
Fix: placeholders in `cocoa-70` (6.1:1). Reserve `cocoa-40` for disabled and decorative uses, and give every disabled primary a visible reason next to it (most already do).

**F-21 (S2) Focus indicator is too faint on buttons and chips. [CX-20]**
The focus ring is `0 0 0 4px #FDE3D8` (persimmon tint) which is about 1.2:1 against paper. Inputs also switch the border to persimmon-ink, which passes; buttons, chips, links and style tiles rely on the tint alone. I tabbed through home, checkout and the book form: a keyboard user can lose the cursor.
Fix: `:focus-visible { outline: 3px solid #C8441F; outline-offset: 2px; }` plus keep the tint ring as decoration. Passes 2.4.7 and 2.4.13 comfortably (4.5:1 on paper).

**F-22 (S2) Persimmon-ink text on cream falls under 4.5:1. [CX-19]**
`#C8441F` on cream `#F3EADB` is 4.1:1. Seen on ghost buttons ("Redraw this page", "Start over") and links inside cream panels. On paper it is 4.5:1 (pass, barely).
Fix: links and ghost buttons on cream or tinted fills use `persimmon-deep #9E3115` (6.7:1).

**F-23 (S2) White text on persimmon (#EE5A36) is 3.4:1. [CX-19]** The brand kit already says buttons use persimmon-ink for this reason. Check that the "1/2/3" number badges, the mobile Create "+" button, the home hero accent word (large text, 3.2:1 on paper, passes at 24px bold or larger only) and any small text on persimmon use ink or are 24px+.

**F-24 (S2) Missing landmarks and skip link. [CX-21]** No "Skip to content" link on any page (checked home). The shell has one `h1` per page (good) and `lang="en"` (good). Verify `<main>` exists on the create and shop layouts.

**F-25 (S2) Semantics of the brand components. [CX-21]** (verify with a screen reader)
- Segmented control uses `role="tablist"/"tab"` for Cards/Picture books and Chat/Form switches. Real tabs need arrow-key support and tabpanels; most of these are filters or mode switches. Use a radio group for filters, and proper tabs only for Chat/Form.
- ChipGroup is a set of `aria-pressed` buttons. For single-select (occasion, tone, age) use `role="radiogroup"` with `role="radio"` and arrow keys, as the brand kit's "single select" implies.
- `Progress` has `role="progressbar"` with no accessible name; the visible label is a sibling. Add `aria-labelledby`.
- Errors are inside the label element and `aria-invalid` is set (good), but there is no `aria-live` summary, so errors added on submit are not announced.
- The toast uses `role="status"` and auto-dismisses after 5 s; an action toast (Retry) lasts 12 s. WCAG 2.2.1 wants the user to be able to extend or turn it off. Keep action toasts open until dismissed.

**F-26 (S3) Touch targets below the brand's own 44px rule. [CX-22]**
Measured: header "Sign in" and "Start a card" 36px high; footer links 36px high; "See all templates" and "See pricing" 20px high. WCAG 2.2 AA 2.5.8 only needs 24px (passes), but the brand kit and UX spec say 44px. Mobile footer links are the main offender. Add padding to reach 44.

**F-27 (S3) Motion. [CX-23]** Reduced-motion rules exist in book, creator and shop CSS (good). Card tilt and flip animation should be covered too; verify the flip honours the preference.

**F-28 (S3) Generated art needs alt text. [CX-24]** The proof viewer uses "Cover artwork", "Page 3 artwork". Better: one-line scene description from the page prompt ("Lee and Grandpa carrying a red kite along the beach").

### D. Brand-fidelity gaps (against the brand kit and CMO ux-spec)

**F-29 (S2) "One persimmon moment per screen" is broken on nearly every page. [CX-25]**
The header "Start a card" button is persimmon on every page, so any page with its own primary CTA has two (checkout: header CTA plus "Continue to payment"; card creator: header CTA plus "Looks good"; the home hero accent word plus the header CTA). The CMO spec forbids it and the brand README states it.
Fix: header "Start a card" becomes `dark` (cocoa) variant on all pages except the home page and browse, or the page's own CTA becomes the only persimmon. Decide once; I recommend the header goes cocoa, because it is persistent.

**F-30 (S2) Two different headers; create pages have no footer or tab bar. [CX-26]**
Create pages show a centred nav (Cards, Picture books, Occasions, Pricing) while shop pages show (Cards, Picture books, Pricing, FAQ) with a cart icon and account. Create pages drop the cart icon, the footer (so no Terms, Privacy, Refund, Contact on the pages where a customer uploads a child's photo), and on mobile the 4-link nav wraps to two rows and there is no TabBar. (`book-mobile-06`, `shot-card-chat-mobile`)
Fix: one shell for everything. Creator pages keep the footer (legal 06 req 50: footer on every page).

**F-31 (S3) Browse nav shows two active links, and "Start from a blank page" floats beside the last tile. [CX-27]** (`shot-browse-desktop`)

**F-32 (S3) Mobile TabBar uses blank rounded squares for icons. [CX-28]** (`shot-home-mobile`, `misc-mobile-menu-open`) The brand kit specifies a 4-tab bar with a raised Create button; the icons are not drawn. Draw 4 line icons from the logo's stroke weight.

**F-33 (S3) Tilt is correct (browse and hero only).** Working. Cart, orders, drafts have no tilt.

**F-34 (S3) Colour ratio and radius.** Radii (14, 22, pill), shadows, fonts, and the plum band on home all match the kit. Marigold appears only with cocoa text. No red anywhere (spec rule), errors are persimmon-ink. Working.

### E. Copy

**F-35 (S2) UK words in a US-only product. [CX-29]** Template "Mum, You Did It", "Personalised" (Terms and Refund pages), "Postcode" on checkout, "Mum" in test prompts, sample address "Leeds, NY" in my walk (mine, ignore). The market is US only ("We ship to the US to start").
Fix: Mom, Personalized, ZIP code, State as a dropdown of states. Spell "recognize", "color" in all site copy.

**F-36 (S3) Mixed button verbs and small voice slips. [CX-29]**
- "Make a free account" (good) versus "Email me a sign-in link" (good); "Start a card" and "Start a new book" (good). Keep.
- "Hardcover 8.5 x 8.5, 24 pages" uses letter x: use "8.5 × 8.5 in".
- "Keep making things" (cart, secondary) is vague: "Add another card or book".
- Toggle "Email me when a proof is ready (always on)" is a switch that cannot be switched. Make it plain text. (F-37)
- Cookie text is good and short. Keep.

**F-37 (S3) Disabled-looking switch on account page. [CX-30]** (`shot-account-desktop`) Replace with a line of text, or let customers turn it off (transactional proof email may stay on; marketing is separate).

### F. Support and error states

**F-38 (S1) There is no support path. [CX-31]**
Contact is a `mailto:` to a placeholder address. "Ask us about this order" opens the email client (fails for webmail users, loses context). No help centre, no contact form, no stated response time, no order-aware contact. FAQ answers are good but are the only self-service.
Fix: `/help` with search and the 15 launch articles (written, `docs/cx/help-articles/`), a `/contact` form with order picker, photo attach for damage claims, auto-reply with the SLA; "Get help with this order" button on the order page that prefills the form. See 02-support-model.md.

**F-39 (S2) 404 and error pages are the default framework screens. [CX-32]** (`misc-mobile-nope-404`) White page, no brand, no navigation. Build branded 404, 500, offline and "this link has expired" pages, each with a way home and a way to get help.

**F-40 (S2) Payment decline recovery is good; add what the customer cannot see. [CX-33]** (`shot-declined-desktop`) Message is kind and specific: "Your card was declined. Try another card, or check the details." Order is not lost, the cart persists. With real Stripe, check that 3-D Secure failure, expired card and insufficient funds each get their own plain line, and that the cart survives a closed tab. The "Test payment" screen is mock only; make sure it is unreachable when Stripe keys are set.

**F-41 (S3) Error toasts have no reference code. [CX-34]** When something fails the customer should see a short code to quote to support (e.g. "Ref GH-7K2F"), and the system should log it.

### G. Mobile

**F-42 (S2)** Home, browse and cart reflow properly (single column, large type, comfortable cards). Checkout fields are full width, 48px high (good). Problems: creator pages lose the footer and TabBar (F-30), header wraps to two rows (`book-mobile-06`); the step chips scroll sideways with the last chip clipped and no cue; the proof thumbnail strip shows five of thirteen with no scroll hint; the card creator on mobile puts "Make my preview" above the chat, so a new customer sees an empty box and a disabled button first (`shot-card-chat-mobile`); long consent text (mobile) is a wall.
Fix: header collapses to logo + menu on every page; sticky bottom action bar for the book steps ("Next: add photos"); chat first, preview as a collapsible card that opens when ready.

**F-43 (S3)** State field is free text (type "NY"); on mobile use a state select with `autocomplete="address-level1"`, ZIP `inputmode="numeric"`, and `autocomplete` attributes on every address field. Verify these attributes in code.

### H. What is working well (keep, protect, do not "improve" away)

1. **Greet Guide.** Declares it is an AI, asks one thing at a time, quick replies, live brief card with Edit links, Chat or Form modes, copyright guardrail with a friendly rewrite offer ("I can't draw Meeko... a friendly raccoon?") (`shot-card-guardrail-desktop`).
2. **Guest preview and upgrade prompt.** One free watermarked card, flips front/inside, restores after reload, and the lock message offers what the customer gets. "Not now" is as visible as the primary.
3. **Approve-the-character gate** before 13 pages are drawn, with free redos shown ("2 free redos left"), zoom on the sheet.
4. **Render tiles** fill in one by one, per-page retry for failures, "You can leave this page" and a Cancel.
5. **Consent design.** Unticked required boxes, upload locked until saved, optional boxes separate, withdrawal available, "How we handle children's photos" linked.
6. **Delete-my-data.** Lists where data lives (database, storage, Resend, Stripe, printers) and what we cannot remove; Download-my-data link; type DELETE; two-step email confirm. Better than most.
7. **Cookie notice.** Equal-weight Accept and Reject, plain words, honours GPC.
8. **Cart and checkout.** Per-item "To me / To someone else", PO box rule with a clear message, saved-address toggle, decline message, order tracking timeline with carrier link, "Your card's on its way to Rosa." toast in brand voice.
9. **Pricing page.** Four prices, tax and postage and US-only stated, refund promise in one paragraph with a link.
10. **FAQ.** Honest answers to the questions people actually have (photos, kids, AI, characters, delivery, deleting).
11. **Visual system.** Type, spacing, shadows, plum band, tilted cards, no red. It looks like the brand kit.
12. **Reduced-motion rules, `lang`, one `h1` per page, visible labels on every field, `aria-invalid`.** A good a11y floor to build on.

## Top-line priorities

Must fix before launch (details in 05-backlog.md): F-01, F-02, F-03, F-04, F-05, F-08, F-11, F-12, F-19, F-20, F-21, F-30, F-38, F-39, plus F-06 and F-35. Everything else can follow in the first month.

## Re-check, 2026-10-12

I walked the app again in mock mode at 1280 and 390 px. I ran QA's `launch-flow`, `card-flow`, `shop-walk` and `a11y` scripts, and all of them pass. Ticket status is in `05-backlog.md` under "Status". What changed since 10-10:
- Fixed today: skip link; branded 404 (`screens/recheck-1012-mobile-404-before.png` and `-after.png`); link and ghost-button contrast; WCAG 2.5.3 label mismatches; the cookie notice no longer drops focus to `<body>`; the two scroll regions can be reached by keyboard; `/browse` has an h1; the stale promo is gone; "Make a free account" opens sign-up, not sign-in; "ZIP code"; the confirmation no longer greets the customer by email handle (`screens/recheck-1012-mobile-confirmation-before.png` shows the old greeting).
- Still true and still S1: F-01 (no real art), F-02 (`[PLACEHOLDER]` company and DMCA text on every page), F-04, F-05, F-11, F-38 (no help or contact page; every contact path is a `mailto:` to a `.example` domain). Synthetic test data only in screenshots.
