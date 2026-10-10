# 00. Legal summary for the owner

This is research to brief a business owner and to hand to a licensed attorney. It is not legal advice. Sources are cited with URLs in files 01 to 04; all pages were read on 2026-10-10. Tags: [V] verified on the primary page, [S] secondary source, [U] unverified or my estimate. Where I could not verify something, the files say so.

Files: 01 IP and AI output · 02 children's photos and privacy · 03 e-commerce, tax, consumer · 04 business setup and costs · 05 draft policies · 06 product requirements.

## Top risks, ranked

1. **Children's photos sent to AI vendors (privacy and biometric exposure).** Highest severity. COPPA probably does not squarely apply to adults uploading photos (my reading, [U], needs attorney opinion), but the FTC treats photos of children as personal information, state laws and Illinois BIPA litigation (private right of action, $1,000/$5,000 per violation [S]) make this the place a claim is most likely and most costly. Texas AG penalty up to $25,000 per violation [V]. Controls: adult-only gate, specific consent with vendors named, no face matching or embeddings, ZDR routing, 90-day purge, working delete flow. (02, 06 A, B, D)
2. **No upstream IP indemnity.** Google's Gemini API terms have none that I found [V]; Anthropic's indemnity is for direct customers, probably not via OpenRouter [U]; OpenRouter caps its own liability at $100 or 12 months of fees [V] and GreetHub indemnifies it. Copyrighted-character output (Disney/Universal/WBD v. Midjourney [S]) and likeness claims land on GreetHub. Controls: prompt rewriting, output checks, takedown path, media-liability insurance. (01 s2, s4)
3. **Privacy promises the vendor chain may not support.** "Not used for training" is only safe if zero-data-retention routing exists for the Gemini image models; OpenRouter assumes retention and training when a policy is unclear [V], and the ZDR endpoint list for those models was not verified. (01 s2, 02 s11)
4. **Vendor-term compliance.** Gemini API and OpenRouter require 18+ users; Gemini bars API clients "likely to be accessed by" under-18s [V]. Lulu requires written parent/guardian consent for identifiable under-18s and prohibits AI content without meaningful human review [V]. Our proof-approval and consent steps must be built to meet these. (01 s5, 02 s6)
5. **Misleading claims and delivery promises.** FTC reviews rule in force since 21 Oct 2024 [V]; Mail/Internet rule: 30-day default, reasonable basis for stated ship dates, delay notices, 7-working-day refunds [V]. Holiday cut-offs are the main exposure. (03 s2, s3)
6. **Sales tax registration and nexus.** GreetHub is seller of record; home-state registration from day one; thresholds commonly $100,000 or 200 transactions [S]. Stripe Tax calculates and collects; registration and filing remain GreetHub's job [V]. (03 s1)
7. **Name not cleared.** No exact "GreetHub" mark turned up in web searches, which is not a trademark search. (01 s6, 04 s4)
8. **Accessibility suits.** 3,117 federal website suits in 2025 [S]. Build to WCAG 2.2 AA. (03 s6)
9. **Ad pixels, state privacy opt-outs and wiretap suits.** (02 s12, 06 F)
10. **Email and SMS.** CAN-SPAM up to $53,088 per email [V]; no SMS at launch. (03 s7, s8)

## Before launch (P0) versus later

**Before any real children's photos touch the system**
- 18+ gate; consent modal and consent log; ZDR test (or a changed privacy promise); no face recognition/embeddings; image moderation and CSAM procedure; 90-day purge and delete-my-data flow; private storage and logging hygiene (06 A to D).
- Signed DPAs (Supabase, Vercel Pro, Resend, Stripe, Lulu, Prodigi); OpenRouter DPA/ZDR confirmation; Lulu written confirmation (01 s5, 02 s10).
- Attorney written opinion on children's data, biometrics, and the Illinois decision (02).
- Cyber and media insurance bound (04 s3).

**Before public launch**
- Final Terms, Privacy, AUP, Refund policies reviewed by an attorney (05).
- Entity formed, EIN, bank, home-state sales tax permit, Stripe Tax set up (03, 04).
- DMCA agent registered; takedown channel live (01 s3, 06 C).
- Name clearance and trademark filing started (04 s4).
- Cookie banner/GPC handling, footers, email classes, creator contract terms, Eye Story releases (06 F, G).
- Delay-notice automation and delivery estimates from real printer data (03 s3).
- Accessibility pass (03 s6).

**Later**
- Gift cards, subscriptions, SMS, EU/UK sales (03 s5, s8; 02 s9). Annual policy refresh. Pen test. Possible direct Google Cloud (Vertex) contract for indemnity once volume justifies it (01 s2).

## Attorney-review items (estimated)

| # | Item | Est. cost [U] |
|---|---|---|
| 1 | Opinion on COPPA/state children's data/BIPA for adult-uploaded photos of minors; Illinois decision | $1,500 to $5,000 |
| 2 | ToS, Privacy, AUP, Refund policy review (05) incl. arbitration/class-waiver decision, state differences | $2,500 to $8,000 |
| 3 | Consent text, model releases (product and Eye Story ads) | $500 to $1,500 |
| 4 | Trademark knockout, search, filing | $1,000 to $4,500 |
| 5 | Vendor contract review (OpenRouter, Lulu API, Prodigi, creator agreement) | $1,000 to $3,000 |
| 6 | Entity formation and operating agreement | $500 to $3,000 |
| 7 | CSAM reporting procedure and takedown SOP | included in 1 or $500 to $1,000 |
| 8 | Multistate sales tax set-up (CPA, not attorney) | $500 to $2,000 |
| | Launch legal total (excl. insurance) | about $7,000 to $27,000 |

Insurance first year about $2,500 to $8,000. Full lines for the CFO are in 04 s7.

## Launch checklist

- [ ] Owner answers the questions below
- [ ] Entity, EIN, bank account, state sales tax permit (home state)
- [ ] Stripe Tax on; product tax codes; U.S.-only shipping
- [ ] GREETHUB name search and attorney knockout; TM application (ITU)
- [ ] DMCA agent registered ($6) and shown in footer
- [ ] Insurance bound (cyber, media/IP, GL); exclusions confirmed in writing
- [ ] OpenRouter: Google route/tier confirmed, ZDR for image models tested, DPA requested
- [ ] Lulu API terms and DPA read; written OK for per-customer AI books; Prodigi DPA signed
- [ ] DPAs accepted: Supabase, Vercel (Pro), Resend, Stripe
- [ ] 18+ gate, consent modal, consent log live
- [ ] Image and text moderation live; CSAM procedure approved
- [ ] 90-day purge job, reminder email, delete-my-data flow tested end to end
- [ ] No face embeddings, no face matching (code review)
- [ ] Greet Guide AI disclosure shown each session
- [ ] Policies reviewed by attorney and published; footer links; acceptance logged
- [ ] Cookie banner / GPC; no tags on photo, creator, proof, cart, account pages
- [ ] Email: transactional vs marketing split; unsubscribe; postal address
- [ ] Delivery estimates from printer data; delay-notice automation; refund within 7 working days
- [ ] Proof-approval evidence stored at checkout
- [ ] Accessibility pass (WCAG 2.2 AA) and statement
- [ ] Eye Story releases signed; creator contracts include disclosure terms
- [ ] Claims file for every advertised claim; platform ad-policy check
- [ ] Incident plan (breach notification) and a named privacy contact

## Questions the owner must answer

1. Which state do you live in and work from, and will you take investors (LLC vs C-corp)?
2. Do you accept the privacy trade-off if no zero-retention route exists for the Gemini image models (change the promise, change the model, or hold launch)?
3. Illinois: accept with the consent flow, or block Illinois uploads until the attorney signs off?
4. Is the product US-only for at least a year?
5. Are gift cards, subscriptions or SMS planned in year one?
6. Will photos of customers' children ever be used in ads or samples (requires separate releases)?
7. Who are the Eye Story family and will they sign releases?
8. What is the legal budget and insurance budget you will commit?
9. Do you want arbitration and a class-action waiver in the Terms?
10. Do you want to contract with Anthropic and/or Google Cloud directly to obtain an IP indemnity?
