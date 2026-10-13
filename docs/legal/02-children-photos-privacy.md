# 02. Children's photos and privacy

Research brief for the owner and a licensed attorney. Not legal advice. Pages read 2026-10-10. Tags: **[V]** verified on the primary page this session; **[S]** secondary source only; **[U]** general knowledge or estimate, unverified.

## 1. The core design position

GreetHub takes photos of children, uploaded by adults, sends them to third-party AI vendors, and prints likenesses of children in a physical book. The legal exposure is highest here. The design stance that keeps exposure lowest, and that every requirement in 06 assumes:

1. **Adults only.** Account holders are 18+. No child accounts, no child-directed marketing or UI, no kid-facing reading mode. This also matches OpenRouter (18+), Google's Gemini API (18+, and no API client "directed towards or likely to be accessed by" under-18s) and Lulu (registrants 16+) **[V, see 01]**.
2. **Photos are used only to make this customer's order**, deleted on a short clock, never used to train anything, never used in ads or shared with advertisers.
3. **No face recognition, no face templates.** The pipeline sends photos to a vision model to write an identity description and drive illustration. It must never create face embeddings, match faces across people, or store anything usable as a faceprint (this matters for the biometric laws in section 5; it also affects the pgvector plan in PLAN.md: embed text briefs, not faces).
4. **Say what we do, and make it true.** Most enforcement risk comes from privacy promises that the vendor chain cannot support.

## 2. COPPA

Sources: FTC six-step guide (page dated May 2026 in its footer) https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business **[V]**; amendments: FTC press release 16 Jan 2025 https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data **[V]**; effective and compliance dates from law-firm summaries (White & Case, Hunton, Davis Polk, Toy Association) **[S]**: published in the Federal Register 22 Apr 2025, effective 23 Jun 2025, full compliance by **22 Apr 2026** (so it is now binding). The Federal Register page itself would not load for me.

**Who is covered [V]:** operators of websites or online services that (a) are directed to children under 13 and collect personal information, or (b) are general-audience but have actual knowledge they collect personal information from a child under 13, plus ad networks and plug-ins with such knowledge. "Personal information" includes a photo, video or audio file containing a child's image or voice, persistent identifiers (cookies, IP address, device ID), and biometric identifiers.

**Does it apply to GreetHub?** The COPPA trigger is information collected *from a child online*. An adult parent uploading their child's photo is not the child giving information to the service. Most practitioners would say GreetHub is a general-audience, adult-directed service and that COPPA is **not squarely triggered** by adults uploading children's photos **[U; this is my reading, not a verified authority; the attorney should give an opinion in writing]**. It becomes triggered if (a) the site or its marketing is directed to children (children's-book branding is a risk factor, so keep visuals and copy addressed to parents and grandparents), or (b) GreetHub gets actual knowledge that a child under 13 is using the site, for example a child signs up, or a user states they are 12. Control: 18+ gate, no child sign-ups, delete immediately if actual knowledge arises.

**Amendments to adopt as best practice regardless [V press release; rest S]:**
- Separate verifiable parental consent before disclosing a child's personal information to third parties (other than as integral to the service) for targeted advertising. GreetHub does not do that, and the CMO plan already says no pixels on photo pages.
- Retain children's personal information "only as long as reasonably necessary" for the purpose collected, never indefinitely; a written retention policy must be in the privacy policy **[V: FTC guide]**.
- A written information security program, scaled to size and sensitivity **[V: FTC guide]**.
- Verifiable consent methods (card transaction with notice, signed form, ID check, etc.) **[V: FTC guide]**. A card payment tied to an adult account gives some adult-verification value; the order flow already does that.

The FTC also uses Section 5 (deception and unfairness) against privacy promises, which applies at any age.

## 3. State children's and teen privacy laws

All **[S]** unless stated; summaries from https://www.ketch.com/blog/posts/us-privacy-laws-2026 , https://www.icemiller.com/thought-leadership/state-privacy-law-updates-july-2026-connecticut-arkansas-utah , https://www.khlaw.com/insights/kids-and-teens-privacy-2025-look-back-and-2026-predictions-part-ii-state-privacy-patchwork , https://www.troutmanprivacy.com/wp-content/uploads/sites/941/2026/02/US-State-Children-and-Teens-Data-Privacy-Charts.pdf (not opened; chart is the best place for an attorney to start).
- As of March 2026, twenty states have comprehensive privacy laws (Indiana, Kentucky, Rhode Island effective 1 Jan 2026; Oklahoma 1 Jan 2027; Alabama 1 May 2027).
- Teen-focused changes: Connecticut amendments and Arkansas children's and teens' law (tiered parental consent under 13; teen or parent for 13 to 16) both 1 Jul 2026; Oregon amendments 1 Jan 2026; Colorado SB 24-041 (under-18 profiling, targeted advertising, sale) 1 Oct 2025; Maryland ODPA enforcement phase from 1 Apr 2026; Virginia social-media amendments (single vendor blog; verify).
- California Age-Appropriate Design Code: Ninth Circuit on 12 Mar 2026 lifted part of the injunction (coverage definition and age estimation freed; impact-assessment and dark-patterns provisions still blocked), details inconsistent across summaries.
- Most of these apply to services "likely to be accessed by" minors, or to controllers that know a user is a minor. With an 18+ gate and no child accounts GreetHub should be largely outside the teen-specific rules, **but** many comprehensive state laws treat a *known child's* personal data as sensitive data requiring consent. The photos are about the child, not from the child, so whether that "known child" rule reaches adult-uploaded photos is an open question for the attorney **[U]**. Our consent checkbox (section 6) is built to satisfy the strictest reading.

## 4. CCPA/CPRA and other state comprehensive laws

California Attorney General page, "Updated on August 28, 2026": https://oag.ca.gov/privacy/ccpa **[V]**
- Thresholds: over $25 million gross annual revenue (the page states $25M; I believe it is CPI-adjusted upward by regulation, **[U]**), or buys, sells or shares personal information of 100,000+ California residents or households, or derives 50% of revenue from selling or sharing PI. A new startup will not meet these at first. Many other states use lower consumer-count thresholds (commonly 100,000 residents; some, such as Texas, apply to anyone who is not an SBA small business **[U]**), so the safe approach is to build to the CCPA standard for everyone and let the attorney narrow it.
- Rights: know, delete, correct, opt out of sale and sharing (including via a global privacy control signal such as GPC), limit use of sensitive PI, non-discrimination. Under-16s: opt-in is required to sell or share (parent for under 13; the teen for 13 to 15).
- Sensitive PI includes "biometric data used for identification". Our design (section 5) does not use photos for identification.
- Deadlines for responding to requests: 45 days, extendable by 45 **[U]**.
- Breach private right: $100 to $750 per incident statutory damages page says "up to $750 per incident" **[V]**. Security hygiene (encryption at rest, access limits, logging) matters.
- The page did not address CPPA risk-assessment or automated-decision regulations; ask the attorney whether GreetHub's profiling/RAG on saved People triggers them **[gap]**.

What to publish: a Privacy Policy with categories, purposes, recipients (AI providers, printers, payments, email, hosting), retention periods, rights and how to use them; a "Do Not Sell or Share" mechanism if any pixel/ad-network sharing exists (see 03 and 06); honour GPC.

## 5. Biometric laws and face photos fed to AI

| Law | Key text | Private right of action? | Fit for GreetHub |
|---|---|---|---|
| **Illinois BIPA**, 740 ILCS 14 | "Biometric identifier" means a retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry; photographs are excluded **[S: search snippet of ILGA text; ILGA site and Justia would not load for me]**. Requires a public written retention/destruction policy (15(a)), informed written release before collection (15(b)), no sale, destruction within 3 years of last interaction or when purpose ends. Damages $1,000 negligent / $5,000 intentional or reckless per violation. 2024 amendment (Public Act 103-0769, SB 2979, signed 2 Aug 2024) limits it to one recovery per person per method and allows electronic signatures for the written release **[S: DWT, Greenberg Traurig, Kilpatrick Townsend]**. | **Yes, class actions** | **Highest risk.** A photograph is excluded, but a vendor that derives face geometry from it is the pleading theory. Apple Photos litigation: on 8 Oct 2026 (unsealed) the N.D. Ill. let claims proceed on whether Apple's system scans face geometry into faceprints, but accepted that cropped face images alone are not biometric identifiers **[S: https://www.mlex.com/mlex/articles/2535955]**. *Martell v. X Corp.* (N.D. Ill. June 2024) dismissed a claim over a hash of an uploaded photo that did not perform facial recognition or record facial measurements **[S: Duane Morris blog]**. Takeaway: generative use of a photo is far from the Clearview/Apple fact patterns, but the underlying model vendors' internal processing is outside GreetHub's control, so the protection is consent plus no matching. |
| **Texas CUBI**, Bus. & Com. Code 503.001 | "biometric identifier" means a retina or iris scan, fingerprint, voiceprint, or record of hand or face geometry; must inform and obtain consent before capture; destroy within a reasonable time and not later than the first anniversary of the purpose expiring; civil penalty up to $25,000 per violation; Attorney General enforces **[V: https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001]**. | No (AG only) | Moderate. Texas AG has sued large companies under it. Consent plus short retention covers it. |
| **Washington RCW 19.375** | Biometric identifier = data from automatic measurements of biological characteristics; "does not include a physical or digital photograph, video or audio recording or data generated therefrom". Enrolment in a database for a "commercial purpose" (sale or disclosure to a third party to market goods/services) needs notice, consent or an opt-out mechanism. AG enforces via the Consumer Protection Act **[S: search result quoting the statute; the leg.wa.gov and Justia pages would not load]**. | No (per one summary; verify) | Low: photos and data generated from them are excluded; we do not sell or market. |
| Washington My Health My Data Act, other states' biometric provisions (for example Colorado's 2024 biometric amendment) | **[U; not researched this session]** | varies | Ask the attorney whether any apply to non-identifying generative use. |

**Practical rules from this table**
- Do not run face recognition, face matching, liveness, or "find the same person across photos" on uploaded images. If the pipeline needs consistency, rely on the approved model sheet, not on face vectors.
- Do not store embeddings of images that encode faces.
- Obtain an express, separate, logged consent (section 6) that describes the AI processing of faces; show it before the first upload; keep it as a BIPA-grade "written release" (electronic signature is acceptable per the 2024 amendment **[S]**).
- Publish a written retention and destruction schedule in the Privacy Policy (BIPA 15(a)) even though we believe no biometric identifier is created.
- Decide whether to geo-restrict Illinois: the owner can accept the risk with the consent flow, or block Illinois-addressed uploads until the attorney signs off. Cheap to build either way; pick one before launch.

## 6. Consent design for adults uploading photos of minors

Principles: adult only, specific, affirmative, separate from ToS acceptance, unticked by default, re-shown whenever the wording changes, logged.

**Gate order:** (1) account holder confirms 18+ at signup; (2) first photo upload opens a modal; (3) upload is disabled until required boxes are ticked; (4) each upload batch carries the consent record id.

**Required checkbox A (rights and authority).** Suggested wording (attorney to finalise):
> "I am the parent or legal guardian of every child in these photos, or I have written permission from their parent or legal guardian, and I have the permission of every adult shown. I am at least 18 years old."

**Required checkbox B (AI processing, with the vendor chain named).**
> "I understand GreetHub will send these photos to AI image and language services (OpenRouter, Google, Anthropic) to create illustrations, and to print partners (Lulu, Prodigi) only as finished artwork. We do not use photos to train AI, do not identify anyone by face, and do not sell or share them for advertising. Photos are deleted after 90 days unless I choose to keep a saved Person. [Link: how we handle children's photos]"

(The sentence "We do not use photos to train AI" may be shown only if ZDR or the paid-tier no-training terms are confirmed for every route; see 01. Otherwise change it to the truthful statement.)

**Optional checkbox C (saved People).** "Keep my approved character for reuse until I delete it." Off by default; the 90-day purge applies unless ticked.

**Optional checkbox D (marketing use).** "GreetHub may show my finished pages as an example on its website or ads." Off by default, never for children's images without a separate signed release (see 01 section 7).

**Consent log fields:** user id, timestamp (UTC), IP address, user agent, consent text version/hash, which boxes were ticked, the photo ids covered, the child's first name or label as entered (not full name), and a withdrawal timestamp if withdrawn. Retain the consent log for the statute-of-limitations period (BIPA claims 5 years in Illinois per case law **[U]**), without storing the photos themselves.

**Withdrawing consent:** a button on the account page and an email address. Withdrawal stops further processing and triggers deletion (section 7). Orders already in print cannot be recalled; say so.

**Third-party adults in photos:** the same checkbox covers them; the ToS makes it the uploader's warranty. A "report a photo of me" form lets anyone depicted ask for removal.

## 7. Retention and deletion requirements

**Retention schedule (proposal; attorney and CTO to confirm):**
| Data | Keep | Then |
|---|---|---|
| Original uploaded photos | 90 days from upload, or until order delivered + 30 days if later, never beyond 120 days, unless a saved Person | Hard delete from storage, thumbnails, CDN caches |
| Saved Person (identity sheet, model sheet, source photo crop) | Until the user deletes it or 24 months of account inactivity | Hard delete, send reminder 30 days before |
| Generated art, drafts | 12 months from last edit unless on a placed order | Delete; order pages kept per next row |
| Order records and final print PDFs | Printing plus reprint window (propose 12 months), then delete art; keep invoice/tax record 7 years (accountant to confirm) | Invoices without art |
| Consent log | 5 years from the consent date or deletion request, whichever later | Delete |
| Guest previews and guest uploads | 7 days (they carry no account) | Hard delete |
| Moderation flags and abuse logs | 12 months; longer if reported to NCMEC (preserve per the reporting law) | Delete |
| Vendor-side | OpenRouter does not persist image files beyond routing **[V]**; providers per their terms. Use `zdr:true` if available | n/a |

A written retention policy and security program are required for COPPA-style compliance and BIPA 15(a) and good practice everywhere **[V: FTC guide; S for BIPA]**.

**90-day purge implementation requirements:** a scheduled job (daily) that deletes the object from Supabase Storage, deletes derived files and database rows referencing the photo, invalidates CDN caches, and writes a deletion record (id, time, no personal data). Email the user 14 days before: "your photos will be deleted on [date]; save a Person to keep the character". Backups: confirm Supabase backup retention and state in the policy that deleted data can persist in encrypted backups for up to N days **[N to be confirmed with the Supabase plan]**; make backups expire inside that number.

**Delete-my-data flow (account page "Delete my data" and "Delete my account"):**
1. Authenticated request (or emailed request, identity confirmed by magic link).
2. Immediate: revoke sessions, stop jobs, delete photos, saved People, drafts, addresses; mark orders anonymised.
3. Within 30 days (state deadlines are generally 45 days **[U]**): delete or de-identify remaining records except those legally required (tax/invoices, fraud, consent log); confirm by email.
4. Vendor propagation: Supabase (own), Resend (delete contact and logs), Stripe (retain what law requires; delete saved payment methods; Stripe is an independent controller for some data), Lulu/Prodigi (request deletion of customer data under their DPAs where no longer needed for fulfilment), PostHog/analytics if any, OpenRouter (nothing persisted by default; confirm).
5. A "download my data" export (CCPA access right) in the same screen.
6. Confirmation shown on screen and by email; keep a deletion log with no personal data.
7. Say clearly: copies already printed and shipped, and data in short-lived backups, are outside the deletion.

## 8. Child safety content duties

- Federal law requires providers who learn of apparent child sexual abuse material to report to NCMEC's CyberTipline (18 U.S.C. 2258A) **[U: well known, not fetched this session]**. Anthropic's and Google's policies also say CSAM is reported **[V]**. Build: automated image moderation at upload (nudity/minor-sexual content classifier), hard block, quarantine, do not display, preserve per the statute, report through NCMEC's process, ban the account. Attorney to approve the exact procedure; do not let staff or the owner open or forward such images other than as the law directs.
- **Update 2026-10-13 [V: https://www.law.cornell.edu/uscode/text/18/2258A, read 2026-10-13]:** a provider must report "as soon as reasonably possible after obtaining actual knowledge". A completed CyberTipline report is treated as a request to preserve its contents "for 1 year" (raised from 90 days by the REPORT Act, Pub. L. 118-59, 7 May 2024). The provider must also preserve reasonably accessible related files, keep them in a secure location with access limited to what is needed, and follow the NIST Cybersecurity Framework. Fines for knowing and willful failure to report: up to $600,000 for a first failure and $850,000 for later ones (providers under 100 million monthly users). The current hook discards the image. Whether that conflicts with these duties, and whether a classifier flag counts as actual knowledge, is attorney question Q13 in `attorney-brief-2026-10.md`.
- Do not generate or accept nude or sexualised images of anyone; for minors, zero tolerance (all providers prohibit it).

## 9. GDPR and UK if selling abroad

- Launch US only. GDPR can apply to a non-EU seller that targets EU residents (shipping to the EU, euro pricing, EU language) **[U general; Article 3 not fetched]**. Avoid targeting: ship only to U.S. addresses, price in USD, no EU marketing, block non-US shipping addresses in Stripe Checkout.
- If you later sell to the EU or UK: appoint an EU/UK representative (Article 27 **[U]**), publish a lawful-basis map, handle children's data (Article 8: child consent age is 16, Member States may lower it to no less than 13 **[V: https://gdpr-info.eu/art-8-gdpr/]**; UK is 13 **[U]**), run a DPIA for AI processing of children's images **[U]**, sign SCCs with every processor. Face images are not automatically "special category" biometric data unless processed for unique identification **[U]**, but regulators treat children's images carefully.
- Transfers: Supabase DPA incorporates EU SCCs (Modules 2 and 3), UK and Swiss addenda **[V: https://supabase.com/legal/dpa, version 1 dated 1 Aug 2026]**; Vercel DPA with SCCs and UK addendum (Pro and Enterprise plans), effective 31 Mar 2026 **[V: https://vercel.com/legal/dpa]**; Resend DPA with SCCs and DPF self-certification **[V: https://resend.com/legal/dpa]**.

## 10. Data processor agreements with vendors

| Vendor | Status found | To do |
|---|---|---|
| Supabase | DPA v1 dated 1 Aug 2026; part of the ToS, accepted by agreeing to the Agreement; Supabase = processor; sub-processor list with 30 days' notice; SCCs included **[V]** | Confirm plan level and region; subscribe to sub-processor notices; do not store HIPAA data |
| Vercel | DPA effective 31 Mar 2026; applies to Pro and Enterprise plans; Vercel = processor for Customer Data **[V]** | Hobby plan is not covered; use Pro for production; email privacy@vercel.com for sub-processor notices |
| Resend | DPA (processor for Customer Data), 14 days' notice of new sub-processors, accepting ToS executes it **[V]** | Keep email content free of children's details beyond first names |
| Stripe | Not read this session | Stripe's DPA is online; accept it **[U]** |
| Lulu | Print API governed by a DPA with Lulu as processor (Section 13/15 reference) **[V reference only]** | Read and countersign; ask what deletion/retention applies to order artwork |
| Prodigi | DPA referenced in terms (cl. 3.7, 20.2) **[V]** | Request and sign |
| OpenRouter | No DPA located; privacy policy says inputs go to providers who may retain per their own terms **[V]** | Ask for a DPA or enterprise terms; use `zdr:true` |
| Google (Gemini API) | Terms page has no DPA or children's-data clause **[V]**; a Cloud DPA exists only for Google Cloud customers **[U]** | Ask OpenRouter which Google route and contract governs; prefer Vertex via ZDR |
| Anthropic | Commercial Terms reference a DPA (not read) **[V partial]** | Read it; again, via OpenRouter you are not Anthropic's direct customer |

## 11. Do photos sent to AI providers need particular disclosures?

Yes, in practice, for four independent reasons:
1. **Privacy laws** require notice of categories of recipients and purposes (CCPA and equivalents) **[V for CCPA via AG page; S for others]**.
2. **FTC Act deception**: if the site says "private" or "never used for training", every vendor on the chain must support that.
3. **Google and Anthropic policies** make the customer responsible for having legally required consent for personal data and biometrics **[V]**.
4. **Biometric laws** (BIPA/Texas) require informing before capture **[V Texas; S Illinois]**.
Disclose in three places: the consent modal (section 6), the Privacy Policy "AI processing" section, and the FAQ. Name the vendors or at least categories and say photos are not used to train models only if verified.

## 12. Ad pixels and tracking

The marketing plan uses Meta pixel, Google Ads, Pinterest tag, TikTok. Under CCPA-style laws, sharing identifiers with ad networks is "sharing" and needs an opt-out link and GPC handling **[V: AG page lists opt-out via GPC]**. Plaintiffs also sue over pixels under wiretap statutes (for example California's CIPA) **[U; not researched]**. Keep pixels off every page that shows children's names or photos (already in the plan), off the creator, proof, cart and account pages, use server-side purchase events only, and run a consent banner on marketing pages (see 06).

## Sources (read 2026-10-10)
- https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business
- https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data
- https://oag.ca.gov/privacy/ccpa
- https://texas.public.law/statutes/tex._bus._and_com._code_section_503.001
- https://gdpr-info.eu/art-8-gdpr/
- https://supabase.com/legal/dpa ; https://vercel.com/legal/dpa ; https://resend.com/legal/dpa
- https://openrouter.ai/privacy ; https://openrouter.ai/docs/guides/features/zdr ; https://ai.google.dev/gemini-api/terms ; https://www.anthropic.com/legal/aup ; https://lulu.com/terms-and-conditions ; https://www.prodigi.com/terms-and-conditions/
- Secondary: whitecase.com COPPA alert; ktslaw.com, dwt.com and gtlaw.com BIPA 2024 amendment alerts; lawfilesext.leg.wa.gov (via search result) for RCW 19.375; mlex.com Apple Photos BIPA article; Duane Morris (Martell v. X); Ketch, Ice Miller, Keller & Heckman, Troutman state-law roundups; KTS and Loeb on California AADC
