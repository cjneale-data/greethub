# 03. E-commerce, tax and consumer rules

Research brief for the owner and a licensed attorney. Not legal advice. Pages read 2026-10-10. Tags: **[V]** verified on the primary page this session; **[S]** secondary source only; **[U]** general knowledge or estimate, unverified.

## 1. Sales tax

### What is settled
- Since *South Dakota v. Wayfair* (2018) states can require remote sellers to collect tax on economic nexus alone **[U: well known; case not fetched]**. A 2026 guide says most post-Wayfair states converged on **$100,000 in sales or 200 transactions** in the state in the current or prior calendar year, with some states dropping the transaction count and many counting exempt sales too **[S: single guide, e.g. https://sales.tax/expert-articles/sales-tax-on-digital-goods-whats-taxable-in-2026-and-what-changed/ ; verify per state]**. Thresholds differ (a few states are higher), so do not hard-code them: use Stripe Tax's monitoring.
- GreetHub is the **seller of record** (it sets the price and takes the payment; Lulu and Prodigi are suppliers), so it is not protected by marketplace-facilitator rules and must register, collect and remit itself **[U inference]**.
- **Home state**: wherever the owner lives or works, GreetHub has physical nexus from day one. Register there before the first sale (sales tax permits are normally free or low cost **[U]**).
- Drop-ship printing: the printers hold the goods, but whether a printer's location creates nexus for GreetHub varies by state and is a question for the accountant **[U]**.

### Taxability by product (the part that varies)
- **Printed cards and hardcover books** are tangible personal property and are generally taxable where a sales tax exists; custom or personalised status does not usually exempt them, and some states tax shipping/handling on taxable goods **[U]**. A few states exempt books or clothing categories; the state-by-state grid is not something I could verify from one source. Treat as: *tax everywhere that has a sales tax unless Stripe Tax says otherwise.*
- **Digital goods (e-card, PDF)**: no federal rule; every state decides. A 2026 guide says some states exempt digital greeting cards; Louisiana expanded its base to digital products from 1 Jan 2025; Florida's treatment is reported inconsistently **[S: https://www.fonoa.com/resources/blog/guide-to-the-taxability-of-digital-products-in-the-us ; https://dodopayments.com/blogs/sales-tax-digital-goods-by-state]**. Use the right Stripe product tax code for each SKU (physical card, physical book, digital download).
- **Bundled orders** (book plus digital copy): some states tax the whole bundle at the higher treatment; configure line items separately.
- **Resale certificates**: GreetHub buys the printing from Lulu or Prodigi to resell. Give each printer your state's resale certificate so the printer does not charge tax you then charge again **[U; confirm each printer's process]**.

### Stripe Tax and what it does not do
Sources: https://docs.stripe.com/tax , https://stripe.com/tax/pricing **[V]**
- Calculates and collects sales tax, VAT, GST by product tax code and customer location; monitors thresholds and alerts when you may need to register; can help register and file via partners.
- Pricing: **Tax Basic** (calculation and collection only) is 0.5% per transaction on no-code integrations such as Checkout, or $0.50 per transaction via API, where you are registered; **Tax Complete** starts at $90 per month (one-year contract) with higher tiers $430, $1,000, $1,500 per month (registrations, filings, limits included). Filing runs through partners (TaxJar in select U.S. states; Taxually for 93 countries).
- **Not done for you**: deciding to register, owning the filing deadlines (unless you buy filing), and responding to state audits. Stripe says it flags where you "might" owe; the legal obligation stays with GreetHub.
- Budget: Stripe Tax Basic on Checkout at 0.5% of a $40 order is $0.20; plus state registrations (mostly free) and an accountant or a filing service (see 04).

### Practical sequence
1. Turn on Stripe Tax in test mode now; set origin address; set product tax codes per SKU.
2. Register in the home state before launch.
3. Check the Stripe Tax monitoring dashboard monthly; register in each state when it says you are near threshold (Nov-Dec holiday volume can cross a state threshold fast).
4. Charge tax on shipping where the destination state requires it (let Stripe decide).
5. Keep invoices showing tax by jurisdiction for 7 years **[U]**.

## 2. FTC rules on advertising, reviews, AI claims

### Truth in advertising and AI claims
- FTC Operation AI Comply (announced 25 Sep 2024) targeted deceptive AI claims (for example DoNotPay's unsubstantiated "robot lawyer", settled for $193,000) and AI-generated fake reviews **[S: Akin Gump, Babl, The Hill coverage via search]**. Secondary sources reported that in 2026 the FTC signalled enforcement, not new AI rulemaking, and that it set aside the Rytr order in Dec 2025; I could not confirm either from an FTC page **[S, unconfirmed]**. Takeaway: no AI exemption; claims need substantiation.
- Claims in the CMO plan that need substantiation before use: "competing AI storybook products often drift between pages" (the plan itself says verify), "nothing is final until you approve" (true only if there is no hidden charge or auto-ship), "the family sheet is approved before any page is drawn" (true by design), "your photos are never used to train AI" (only true with ZDR confirmed, see 01 and 02), "delivered by Christmas" (see section 3). Keep a claims file with evidence for each.
- AI disclosure: plan says the art is AI and the proof is seen first; keep it, state it on product pages and checkout. Tell buyers the likeness is an illustration and may not look exactly like the person; offer the approval step and reprint terms.
- Chatbot disclosure: the Greet Guide must say it is AI (Anthropic AUP requirement **[V]**).

### Consumer reviews and testimonials rule
16 CFR Part 465, effective 21 Oct 2024 **[V: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers]**. Prohibits: fake or false reviews and testimonials (including writing or buying them), paying for reviews conditioned on sentiment, undisclosed insider reviews (employees, relatives, agents must disclose), suppressing reviews by threats or false accusations, and buying or misusing fake social-media followers. The FTC page does not state the per-violation penalty; I will not quote one.
Implications: no invented testimonials or AI-written "customer reviews" on the site or in ads; creators who receive free books must disclose the material connection (the marketing plan requires contract disclosure; the FTC Endorsement Guides, 16 CFR Part 255, support that **[U: not fetched]**); the Eye Story family review needs the relationship disclosed; do not gate who may leave a review by sentiment; do not threaten customers over bad reviews.

### Platform ad policies
Meta, TikTok, Google and Pinterest policies on AI-generated content and on minors were not researched; the marketing plan itself flags this as unverified. Review each before spending **[gap]**.

## 3. Shipping and delivery: the Mail, Internet or Telephone Order Merchandise Rule (16 CFR 435)

Source: FTC business guide (dated Sept 2011, edited Jan 2025): https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule **[V]**. (The eCFR page redirected to an unverified host so I did not use it.)
- If you advertise a shipping time you need a **reasonable basis** (demand, supply, fulfilment capacity, records). With no stated time you must reasonably expect to ship within **30 days** of receiving a properly completed order.
- If you cannot ship on time, promptly and no later than the promised time you must offer the buyer the choice to consent to a delay or cancel for a prompt refund, with a revised date and a free way to respond. If the new date is 30 days or less after the promised date, silence counts as consent; if longer, the order is cancelled automatically unless the buyer consents.
- Refunds due within **seven working days** for card/cash/check payments (credit card refunds within one billing cycle). No store credit as a substitute.
- Covered: merchandise ordered by mail, internet or phone. Exemptions listed: serial subscriptions after first shipment, seeds and plants, COD, negative-option club plans, services, approval and invoice sales. **Custom or personalised goods are not on the exemption list I read, and the guide is silent on digital goods; treat the rule as applying to every physical order [V that it is silent; U conclusion].**
- "Ships" means handed to the carrier; the clock runs from receipt of a *properly completed order* (approved proof and payment). Define that moment in the checkout flow and keep the timestamp.

Product implications: show printers' real production times plus transit in the cart; set seasonal cut-off banners from real data (CMO plan already requires this); build the delay-notice email and the one-click cancel-and-refund path now; the ledger must show promised date, ship date and tracking per order.

## 4. Refunds, returns and reprints for personalised goods

- There is **no general federal right to return** goods bought online. The seller's published policy and state law control **[U]**. Personalised goods are commonly non-returnable "unless defective or wrong"; courts and card networks still expect a clear, conspicuous policy shown before payment.
- State rules to check with the attorney: some states require return policies to be disclosed or default to a refund right when no policy is posted (California is often cited **[U]**); the Mail Rule refund obligations above are federal.
- Recommended policy (full draft in 05): approve-before-print gate; refund in full if we fail to ship or cancel before production starts; free reprint or refund for print defects, damage in transit, or if the book does not match the approved proof; no refund for subjective dislike of an approved proof, but a goodwill option; re-rolls included as allowance. Say who pays return postage (none: ask for a photo, do not require return).
- Evidence: log the approved proof (page hashes, timestamp, IP, account) at checkout. This is the best defence in chargebacks.
- Chargebacks: a "no returns" notice does not stop a card dispute for non-delivery or defect; keep tracking and proof records. Stripe dispute evidence deadlines are short **[U]**.
- Gift cards and "gift-card / send it digitally" pushes in the CMO plan: gift cards bring card-act and unclaimed-property rules **[U, not researched]**; either skip at launch or sell fixed "send a card" digital products.

## 5. Auto-renewal and subscriptions

- The FTC's "click-to-cancel" amendments to the Negative Option Rule were **vacated by the Eighth Circuit on 8 Jul 2025** (*Custom Communications Inc. v. FTC*) for failing a required preliminary regulatory analysis **[S: Fenwick, Dickinson Wright, BCLP; e.g. https://www.fenwick.com/insights/publications/eighth-circuit-vacates-ftcs-click-to-cancel-rule]**. I found nothing confirming 2026 re-proposal.
- **ROSCA** (Restore Online Shoppers' Confidence Act) and state automatic-renewal laws still apply (clear disclosure of terms, express consent, simple cancellation) **[S]**; California tightened its law from 1 Jul 2025 **[S]**.
- GreetHub v1 as planned has **no paid subscription** (account has a monthly re-roll allowance that is free; reminders are free). If you add a paid plan: show the price and renewal terms next to the button, get a separate consent, store the consent record, send renewal reminders where required, make cancel as easy as sign-up. Have the attorney review before adding.

## 6. Accessibility (ADA and WCAG)

- Title III of the ADA has no technical standard for private websites; courts and plaintiffs use WCAG 2.1 Level AA as the de facto benchmark **[S: Level Access, https://www.levelaccess.com/ada-and-the-web-for-retailers-the-road-to-accessibility/]**. The 2024 DOJ web rule is for state and local governments (Title II), not private stores. Compliance-date reports for that rule conflict **[S]**.
- Litigation volume: Seyfarth counted 3,117 federal Title III website suits in 2025 (up 27%), about 36% of all ADA Title III federal suits; other counters report 5,000+ across state and federal with 70% against e-commerce **[S]**. Courts are split on whether online-only businesses are covered **[S]**.
- Overlay widgets do not protect you: one source reports a $1,000,000 FTC action against accessiBe over compliance claims and 1,400+ 2025 suits against sites already using a widget **[S, unconfirmed]**.
- Build to WCAG 2.2 AA (the current W3C Recommendation **[U]**): keyboard operation of the creator and page-flip viewer, labels, focus order, colour contrast against the brand palette, alt text for generated pages (generated from the page text), captions on any video, and a proof viewer usable without a mouse. Publish an accessibility statement with a contact. Run axe in Playwright. The wizard and chat are the highest-risk parts.

## 7. Email marketing (CAN-SPAM)

Source: FTC compliance guide https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business **[V]**
- Applies to all commercial email. Accurate header and from information, non-deceptive subject, clear ad identification, a valid postal address (street address, USPS-registered P.O. box or commercial mailbox), a clear opt-out, opt-outs honoured within **10 business days**, opt-out working for 30 days after sending, no fee or extra data to opt out, no selling opted-out addresses. Penalty up to **$53,088 per violating email** (page text). Hiring a sender does not move liability.
- Transactional or relationship messages (order confirmation, shipped, proof ready, account changes) are largely exempt if their primary purpose is transactional. Mixed messages become commercial if the subject suggests an ad or the transactional content is not at the beginning. Keep "proof ready" and "shipped" free of promotions or the unsubscribe becomes mandatory.
- Marketing sends in the CMO plan: guest-preview series, occasion reminders, "make another" emails. These are commercial: footer with postal address and unsubscribe link, one-click opt-out honoured by Resend suppression. Opt-in at the point of collection is recommended (the law requires opt-out, not opt-in, for U.S. recipients), and required if the audience is outside the U.S. Mailbox-provider bulk-sender rules (one-click unsubscribe headers, authentication) apply too **[U: not fetched]**.
- Do not email marketing to anyone who only used the guest preview unless they ticked the email box.

## 8. Text marketing (TCPA)

- Not in the product plan. Recommendation: **do not launch SMS marketing**. If added: prior express written consent for marketing texts, clear disclosures, and easy opt-out. Secondary sources: the FCC's "one-to-one consent" rule was vacated by the Eleventh Circuit in Jan 2025; revocation-of-consent rules partly took effect 11 Apr 2025 (consumers may revoke by any reasonable means) with the "revoke-all" part delayed, one source says to 31 Jan 2027; quiet hours questions were pending **[S: JD Supra and compliance blogs; unconfirmed on FCC pages]**. State "mini-TCPA" laws add restrictions **[U]**.
- Transactional shipping texts need opt-in and an STOP keyword; avoid until needed.

## 9. Other items to put on the attorney list
- Terms for the creator/affiliate programme (disclosure clauses, no children's images unless parent and consent, FTC endorsement compliance).
- Product safety for children's books (CPSIA) **[U]**; print supplier statement.
- Unclaimed-property laws if store credit or gift cards exist.
- State privacy and children's rules covered in 02.
- Stripe's prohibited-businesses list and AI/child imagery policies (not read) **[gap]**.

## Sources (read 2026-10-10)
- https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule
- https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- https://docs.stripe.com/tax ; https://stripe.com/tax/pricing
- Secondary: Fonoa and Dodo Payments digital goods tax guides; sales.tax; Fenwick and Dickinson Wright (click-to-cancel vacatur); Akin Gump, Babl.ai and The Hill (Operation AI Comply); Level Access (ADA); JD Supra and compliance blogs (TCPA)
