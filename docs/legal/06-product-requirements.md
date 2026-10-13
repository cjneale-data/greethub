# 06. Product requirements for CTO and CMO

Research output, not legal advice; the attorney may change these. Each requirement cites the file and section it comes from. Priority: **P0** = before real users or real children's photos; **P1** = before public launch; **P2** = soon after. Owner: CTO, CMO, or Both.

**Status 2026-10-13:** for promise-by-promise build status see `docs/privacy-ops/05-audit-2026-10-12.md`, and for open legal questions see `attorney-brief-2026-10.md`. Key gaps against this list: req 2 (under-18 handler), 4 (durable consent log), 24 (repeat infringer), 25 (box C exception has no end date and no Saved Person), 26 (14-day email), 27 (retention config), 36 and 37 (delivery estimate from printer data; delay notice). Req 18: the hook discards the image; see the brief, Q13. Req 47: withdrawn (the sample book is fictional).

## A. Age gate, accounts and consent

1. **P0 CTO. 18+ gate.** Signup requires ticking "I am 18 or older" and a U.S. shipping/billing country; no child accounts or child-directed UI. Source: 02 s1, s2; 01 s2 (Google, OpenRouter 18+).
2. **P0 CTO. Actual-knowledge handler.** If a user says they are under 18, or support learns it, lock the account and delete its data. Source: 02 s2.
3. **P0 CTO. Photo-consent modal before the first upload**, with the unticked required checkboxes A and B and optional C and D from 02 s6; upload buttons disabled until A and B are ticked. Wording to be finalised by the attorney. Source: 02 s6, s11; 01 s3.
4. **P0 CTO. Consent log table** (user id, UTC time, IP, user agent, wording version or hash, boxes ticked, photo ids, withdrawal time); consent record id attached to every upload batch and every generation job. Source: 02 s6.
5. **P0 CTO. Consent re-prompt** when wording changes or a new type of use is added. Source: 02 s6, 02 s11 (Privacy Policy section 10 draft).
6. **P0 CTO. Guests cannot upload photos of people.** (Matches PLAN.md; keep guest card preview text-only or stock-reference.) Source: 02 s6; PLAN.md.
7. **P1 CMO. Copy rule:** all UI and ad copy addressed to parents and grandparents; no kid-targeted design or channels; no child-directed ad targeting. Source: 02 s2 (COPPA), 01 s2 (Gemini "likely to be accessed by" under-18).

## B. AI processing, vendors and disclosures

8. **P0 CTO. ZDR test and routing.** Send `provider: { zdr: true }` on every call carrying a user photo; verify image models have a ZDR endpoint via `https://openrouter.ai/api/v1/endpoints/zdr`; if none, escalate to the owner before launch. Source: 01 s2 (OpenRouter ZDR).
9. **P0 CTO. Paid-tier only:** never route photos to an unpaid/free Google route; confirm with OpenRouter. Source: 01 s2 (Gemini terms).
10. **P0 CTO. No face recognition or face embeddings.** No pgvector embeddings of images; embed text briefs only; no cross-photo matching. Consistency comes from the approved model sheet. Source: 02 s1, s5.
11. **P0 CTO. Only generated art goes to printers**; source photos never leave Supabase except to the AI call. Source: 01 s5; 02 s7, s10.
12. **P0 CTO. "AI" labels:** Greet Guide chat shows "You're chatting with an AI" at the start of every session; product and checkout pages state the art is AI-illustrated. Source: 01 s2 (Anthropic AUP), 03 s2.
13. **P1 CMO. Claims file.** Do not publish "never used to train AI", "other tools drift", or any delivery-date promise without evidence on file. Source: 03 s2, s3.
14. **P1 CTO/CMO. Privacy and ToS statements match reality:** the "we do not train on photos" sentence ships only if requirement 8 passes. Source: 02 s11; 05 (ToS s3, Privacy s4).
15. **P1 CTO. Vendor paperwork:** accept/sign DPAs with Supabase, Vercel (Pro plan), Resend, Stripe, Lulu, Prodigi; request DPA or enterprise terms from OpenRouter; read Lulu API terms; subscribe to sub-processor notices. Source: 02 s10.

## C. Moderation, safety and takedown

16. **P0 CTO. Text moderation** on every brief, story, name field and chat message before generation. Source: 01 s4; PLAN.md.
17. **P0 CTO. Image moderation on every upload** (nudity, sexual content involving minors, violence) before any AI call; block and quarantine on hit. Source: 02 s8; 01 s2 (provider policies).
18. **P0 CTO. CSAM procedure:** hard block, preserve evidence securely, no display or forwarding by staff, report to NCMEC CyberTipline as the law requires, ban the account. Attorney to approve the written procedure first. Source: 02 s8 (18 USC 2258A, unverified this session).
19. **P1 CTO. Character and logo check on outputs**: vision check for recognisable copyrighted characters, logos and celebrities on each rendered page; auto re-roll once; block on repeat. Source: 01 s4.
20. **P1 CTO. Prompt rewriting for named characters and brands** (extend the existing PLAN.md rule to story text, chat, photo captions and re-rolls). Source: 01 s4.
21. **P1 CTO. Public-figure block** in prompts and a name list check. Source: 01 s4; 05 (AUP 5).
22. **P1 Both. Takedown and report channel:** a "Report content / remove a photo of me or my child" form and a monitored mailbox with a 48-hour target, linked in the footer and on every proof page. Source: 01 s3, s4; 05 (ToS s9, AUP).
23. **P0 CMO/Owner. DMCA agent registration** at the Copyright Office, agent details published on the site; renew every 3 years. Source: 01 s3; 04 s2.
24. **P1 CTO. Repeat-offender policy** and admin tool to ban accounts and delete content. Source: 01 s3.

## D. Retention, deletion and logging

25. **P0 CTO. 90-day photo purge job** (daily) deleting original photos, thumbnails, derived crops and CDN copies; deletion record without personal data; exception only for Saved People with checkbox C. Source: 02 s7; PLAN.md.
26. **P0 CTO. Purge reminder email 14 days before** with a "save as Person" action. Source: 02 s7.
27. **P0 CTO. Retention schedule implemented as config** (guest uploads 7 days; drafts 12 months; order art 12 months; invoices 7 years; consent log 5 years; moderation logs 12 months). Values to be confirmed by attorney/CPA. Source: 02 s7.
28. **P0 CTO. Delete-my-data flow** in Settings: delete photos, People, drafts, addresses, whole account; vendor propagation list (Supabase, Resend, Stripe, printers); export-my-data; confirmation email; handles emailed requests. Source: 02 s7, s4.
29. **P1 CTO. Backup policy:** confirm Supabase backup retention, set it to match the figure published in the Privacy Policy. Source: 02 s7.
30. **P0 CTO. Logging without photos:** log job ids, model, cost, moderation result, consent record id; never log prompts that contain personal data or photo data in clear text, and keep application logs (Vercel, Supabase) on a short retention (e.g. 30 days). Source: 02 s7; 01 s2.
31. **P1 CTO. Private storage and access control:** private buckets, signed short-lived URLs, row-level security by user id, service-role key server-side only, MFA on admin accounts, encryption at rest. Source: 02 s2 (written security program), s4.
32. **P1 CTO. Approved-proof evidence:** at checkout store hash of every page, timestamp, account id, IP, approval click. Source: 03 s4.
33. **P2 CTO. Security review** (internal or pen test) of photo storage before scale. Source: 02 s2; 04 s7.

## E. Commerce, tax and shipping

34. **P0 CTO. Stripe Tax on:** product tax codes per SKU (physical card, physical book, digital download); origin address; U.S. shipping addresses only (blocks EU/UK targeting). Source: 03 s1; 02 s9.
35. **P1 Owner. Register for sales tax** in the home state before first sale; watch Stripe's threshold dashboard monthly; give printers resale certificates. Source: 03 s1; 04 s2.
36. **P0 CTO. Delivery estimates from real printer data**; checkout shows production plus transit time; store promised date per order. Source: 03 s3.
37. **P1 CTO. Delay-notice automation:** if an order will miss its promised date, send the notice with revised date and a one-click cancel/refund; auto-cancel if over 30 days late without consent; refund within 7 working days. Source: 03 s3.
38. **P0 CTO. Refund and reprint policy page linked at checkout** and in confirmation email; no-return statement for personalised items shown before payment. Source: 03 s4; 05.
39. **P1 CTO. Checkout consent text:** "I have reviewed and approve this proof. I understand it's made just for me and the Refund & Reprint Policy applies." Source: 03 s4.
40. **P2 Owner. No subscriptions or gift cards at launch** without attorney review; if added: clear terms, express consent, easy cancel, reminders. Source: 03 s4, s5.

## F. Marketing, email and tracking

41. **P0 CTO/CMO. Email classes:** transactional (confirmation, proof ready, shipped) contain no promotions; marketing emails carry the postal address, one-click unsubscribe, and 10-business-day suppression via Resend. Source: 03 s7.
42. **P0 CMO. Guest-preview emails** only to people who ticked the email-marketing box. Source: 03 s7.
43. **P1 CTO. Cookie / privacy banner on marketing pages** with equal-weight Accept and Reject; no ad or analytics tags before choice; honour Global Privacy Control; "Do not sell or share my personal information" link in the footer. Source: 02 s4, s12.
44. **P0 CTO. No pixels or third-party scripts** on pages that show photos, children's names, the creator, proof, cart (except the payment form) or account; purchase events server-side only. Source: 02 s12; CMO plan s8.
45. **P1 CMO. Creator contracts:** disclosure of material connection in every post, no fake or incentivised-by-sentiment reviews, no children's images unless parent consent. Source: 03 s2.
46. **P0 CMO. No fake testimonials or AI-written reviews**; sample reviews labelled; reviews are not filtered or deleted by sentiment. Source: 03 s2.
47. **P1 CMO. Eye Story sample** goes live only after signed releases from all depicted people and a parent or guardian for each minor, and "AI-illustrated from family photos" labelling. Source: 01 s7.
48. **P1 CMO. Platform ad policy check** (Meta, TikTok, Google, Pinterest) on AI imagery and minors before spend. Source: 03 s2 (gap).
49. **P1 CMO. No SMS marketing at launch.** Source: 03 s8.

## G. Footers, legal pages and accessibility

50. **P0 CTO/CMO. Footer on every page:** Terms, Privacy, Acceptable Use, Refund & Reprint, Report content / DMCA, Accessibility, Contact (support email and postal address), "Do not sell or share" (if tags used), company legal name and address. Source: 03 s7 (postal address), 02 s4, 01 s3.
51. **P1 CTO. Policy acceptance records:** version and timestamp of Terms and Privacy accepted at signup and checkout. Source: 05; 02 s6.
52. **P1 CTO. Accessibility:** WCAG 2.2 AA target; keyboard-operable creator and flip viewer; alt text for generated pages; contrast checks; axe checks in Playwright; accessibility statement with contact. Source: 03 s6.
53. **P2 Both. Annual review** of policies and vendor terms (OpenRouter, Google, Anthropic, Lulu, Prodigi all changed terms in 2026). Source: 01 s2, s5.

## H. Items waiting on the owner or attorney (blocking)

54. **Name clearance** for GREETHUB before ad spend. Source: 01 s6; 04 s4.
55. **Written attorney opinion** on COPPA, BIPA/biometric and state children's-data positions for adult-uploaded photos of minors; decision on Illinois (accept with consent vs restrict). Source: 02 s2, s3, s5.
56. **Insurance bound** (cyber, media/IP, GL) with written confirmation of AI and biometric exclusions. Source: 04 s3.
57. **Vendor questions answered in writing:** OpenRouter (Google route and tier, ZDR for image models, DPA), Lulu (AI-illustrated per-customer books acceptable; API terms; DPA; CPSIA statement). Source: 01 s2, s5; 02 s10.
