# 01. IP and AI output

Research brief for the owner and a licensed attorney. Not legal advice. All pages read 2026-10-10 (today) unless noted.

Confidence tags used throughout: **[V]** = read on the primary page or statute this session. **[S]** = reported by a secondary source (law firm, news, vendor blog), not confirmed on the primary page. **[U]** = from general knowledge or my own estimate, not verified; an attorney must confirm.

## 1. Can GreetHub or its customers own the AI images and books?

**Short answer: not the raw AI images. Yes for the human parts (customer's text, our layout, our selection and arrangement).** Nothing in this stops the business from selling the product; it limits exclusivity.

- U.S. Copyright Office, *Copyright and AI, Part 2: Copyrightability*, published 29 Jan 2025 **[V that it exists and its date, via copyright.gov/ai]**. Its conclusions, as reported by several firms **[S]**: "given current generally available technology, prompts alone do not provide sufficient human control to make users of an AI system the authors of the output"; human-authored expressive input that is perceptible in the output, and human selection, arrangement or modification, can be protected; assistive AI use does not disqualify a work; existing law is adequate. I could not extract the report text itself (the PDF fetch returned binary), so quotes are second-hand. Report: https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf ; hub page: https://www.copyright.gov/ai/
- Registration guidance for works containing AI material: 88 Fed. Reg. 16,190 (16 Mar 2023) **[V citation, from copyright.gov/ai]**; I did not read its text. From general knowledge **[U]**: applicants must disclose AI-generated content that is more than de minimis and disclaim it.
- *Thaler v. Perlmutter*: D.C. Circuit affirmed on 18 Mar 2025 that a work needs a human author; Supreme Court denied certiorari on 2 Mar 2026 (No. 25-449) **[S]** (Baker Donelson, Jones Day and Sterne Kessler alerts; e.g. https://www.bakerdonelson.com/supreme-court-denies-certiorari-in-thaler-v-perlmutter-ai-cannot-be-an-author-under-the-copyright-act).

**What this means for GreetHub**
1. A competitor can copy a GreetHub-generated illustration and GreetHub probably cannot sue for copyright in the image alone. Do not market anything as "exclusive artwork protected by copyright".
2. Customer-written story text and messages are the customer's human authorship. Claude-written story text raises the same AI question; the customer's edits and approval help but do not guarantee protection.
3. Page layout, the book as a compilation, brand design and the site code are protectable. Registering finished sample books as compilations with an AI disclaimer is optional and cheap; ask the attorney whether it is worth it.
4. The customer is buying a physical gift, not a monopoly on images. The ToS should say that plainly (see 05-policies-draft.md) and should not promise copyright ownership.

## 2. Provider terms as accessed through OpenRouter

GreetHub's chain: GreetHub -> OpenRouter -> (Google Gemini image models | Anthropic Claude). GreetHub is bound by OpenRouter's terms and, through them, by each model provider's terms.

### OpenRouter (terms and privacy both show "last updated August 31, 2026")
Sources: https://openrouter.ai/terms , https://openrouter.ai/privacy , https://openrouter.ai/docs/guides/features/zdr (read 2026-10-10) **[V, as summarised by the fetch tool]**
- Output ownership: section 6.1 says ownership of Output is "set forth in the Model Terms for each Model you use". OpenRouter itself does not grant or promise ownership.
- You must comply with each model's own terms (5.1). Model providers are third-party beneficiaries of some sections.
- You license OpenRouter to operate the service (non-exclusive, transferable, sublicensable, royalty-free).
- You must be 18+ (section 2; also in the privacy policy). Content that "exploits or endangers minors" is prohibited (section 7). OpenRouter may remove content and report to authorities.
- Indemnity runs one way: you indemnify OpenRouter (section 15). OpenRouter's liability is capped at the greater of fees paid in the prior 12 months or $100 (17.2). Service is "AS IS", with no warranty on any model provider's data handling.
- Prompt logging is opt-in (6.2, 6.5). Privacy policy: OpenRouter does not use Inputs or Outputs for its own training; inputs go to whichever provider serves the call, and "providers may retain and use Inputs and Outputs under their own terms, and some may use them for training". For images: "We do not persist image, audio or video files beyond the duration necessary to route the request" (except abuse detection, security, billing, legal compliance).
- **Zero Data Retention (ZDR)**: a per-request `provider: { zdr: true }` restricts routing to ZDR endpoints. If OpenRouter cannot establish an endpoint's policy it "assumes the endpoint retains and trains on data". Under ZDR, the Google group drops AI Studio endpoints and keeps Vertex; the Anthropic group drops first-party endpoints and keeps Bedrock and Vertex. The endpoint table did not load for me, and the page does not say whether the Gemini image models have a ZDR endpoint. **Action for CTO: query https://openrouter.ai/api/v1/endpoints/zdr and test an image call with `zdr:true` before relying on it.** If no ZDR route exists for the image models, photos go to a provider that may retain them, which limits the privacy promises we can make (see 02).
- No DPA for OpenRouter surfaced in my reading. Ask OpenRouter for one or for an enterprise agreement. **[gap]**

### Google (Gemini API)
Source: https://ai.google.dev/gemini-api/terms ("Effective March 23, 2026", last updated 2026-04-28) **[V]**
- Google "won't claim ownership" of generated content, reserves the right to generate the same or similar content for others, and says you are responsible for your use of generated content and for how anyone you share it with uses it.
- Paid services: Google says it does not use prompts or responses to improve its products; it logs them for a limited time to detect misuse and meet legal duties. **Unpaid** services: Google uses inputs and outputs to improve products and human reviewers may read them; the page says not to submit sensitive, confidential or personal information to Unpaid Services. GreetHub must never route children's photos to a free-tier or unpaid Gemini route. Confirm with OpenRouter which Google route and tier its paid calls use. **[open question]**
- **Age restriction**: "You must be 18 years of age or older to use the APIs", and an API Client may not be "directed towards or is likely to be accessed by individuals under the age of 18". GreetHub's audience is adults buying books for children, so it must be built as an adult-only service (18+ gate, no child accounts, no child-directed UI). A children's-book site invites the "likely to be accessed by" question. Attorney to assess; mitigation is the age gate plus not marketing to kids.
- Prohibited Use Policy (last modified 17 Dec 2024): https://policies.google.com/terms/generative-ai/use-policy **[V]** bans child sexual abuse or exploitation content, sexually explicit content, non-consensual intimate imagery, impersonation intended to deceive, IP infringement, and "using personal data or biometrics without legally required consent". That last item is the direct hook for our consent checkbox.
- Indemnity: the Gemini API terms page contains **no customer IP indemnity** that I could find **[V: absent]**. Google's generative-AI indemnity sits in Google Cloud's Service Specific Terms and covers listed "indemnified services" (for example generally available Gemini and Imagen on the Cloud API); the list is at https://cloud.google.com/archive/terms/generative-ai-indemnified-services-20260422 (an archived version; check the live one) **[S, from a search snippet]**. That is a Google Cloud customer contract. GreetHub going through OpenRouter is not a Google Cloud customer. Also, "Preview" models such as `google/gemini-3-pro-image-preview` are probably not "generally available" **[U inference]**.

### Anthropic (Claude; text only for GreetHub)
Sources: https://www.anthropic.com/legal/commercial-terms (Effective June 17, 2025), https://www.anthropic.com/legal/aup (current version shows effective November 12, 2026, which is after today's date; an earlier version is archived) **[V]**
- Customer owns Outputs; Anthropic assigns its rights (Section B). Anthropic may not train on Customer Content from the Services.
- IP indemnity (Section K.1) covers a customer's *paid use of the Services* and Outputs, with exclusions including modified outputs, combinations, customer inputs, knowing infringement, and trademark claims from using an Output in commerce (K.3). **This is for Anthropic's direct Customers. Through OpenRouter, GreetHub is not Anthropic's Customer, so assume no Anthropic indemnity applies [U inference].** Use Anthropic directly for the text calls if the indemnity matters.
- Usage Policy items relevant to us: bans CSAM and sexualising minors (minor = under 18 anywhere); bans collecting or accessing biometric data, including facial recognition, without permission; bans impersonation, fake reviews, non-consensual intimate imagery; requires consumer-facing chatbots to disclose that the user is talking to AI "at minimum at the start of each chat session or in the product interface". **The Greet Guide chat must say it is an AI.**

### Indemnity gap summary
| Source | Who protects GreetHub from third-party IP claims over outputs? |
|---|---|
| Google (via OpenRouter) | No one that I could find. |
| Anthropic (via OpenRouter) | Probably no one (inference). |
| OpenRouter | No. GreetHub indemnifies OpenRouter, whose liability cap is $100 or 12 months of fees. |
| Lulu / Prodigi | No. GreetHub indemnifies Lulu; Prodigi disclaims third-party-rights liability. |
| Customers | Only what GreetHub's ToS obtains from them (section 3). |

So **GreetHub carries the output-infringement risk itself.** Mitigations: moderation and prompt rewriting (no named characters or brands), output review for obvious character lookalikes, a fast takedown-and-reprint path, media liability insurance (04), and a path to a Vertex AI contract later if volume justifies it.

## 3. User-content licences GreetHub needs

Needed in the ToS (drafted in 05):
1. A licence from the user to GreetHub and its vendors to host, process, transform, display to the user, send to AI providers and printers, and print the user's text and photos, only to deliver the order and the features the user turns on. Narrow, ends on deletion, no marketing use unless separately opted in.
2. User warranties: they own or have permission for every photo and word; for every identifiable person they have that person's consent; for any person under 18 they are the parent or legal guardian or have the guardian's written consent. Lulu's terms say content showing identifiable individuals under 18 needs written consent of a parent or guardian, and the uploader warrants consent from any identifiable person in it **[V: https://lulu.com/terms-and-conditions, "Last revised October 8, 2026", Section 3]**. GreetHub passes customer content to Lulu, so our consent checkbox must satisfy Lulu's clause.
3. No third-party characters, brands, celebrities or real public figures (matches the PLAN.md guardrails).
4. A user indemnity to GreetHub for breach of 2 and 3 (an attorney should check enforceability against consumers).
5. Output terms: assignment of whatever rights GreetHub has in outputs to the user for personal use and gifting; a disclaimer that outputs may be similar to others' and may not be copyrightable. Decide whether commercial resale of the book is allowed (recommend no).
6. A showcase licence, as a separate opt-in only.
7. DMCA notice-and-takedown clause and repeat-infringer policy. Register a DMCA designated agent: the Copyright Office directory requires online registration, and the provider must also publish the agent's details on its site **[V: https://www.copyright.gov/dmca-directory/]**; fee $6 per designation and renewal every three years **[S: law-firm alerts and Copyright Office FAQ snippets from search]**. Creations are private, so the 512(c) safe harbour matters less, but any public gallery or shared link makes it relevant. Registering is cheap, so do it.

## 4. Copyrighted characters and likeness

- **Characters**: image generators reproduce protected characters when asked. Disney and Universal sued Midjourney in June 2025 over characters such as Homer Simpson and Darth Vader, and Warner Bros. Discovery followed in Sept 2025; a mediation deadline of 19 Aug 2026 was reported; I could not confirm an outcome **[S: e.g. https://www.nbcnews.com/business/business-news/disney-universal-sue-ai-image-company-midjourney-unlicensed-star-wars-rcna212369]**. The plaintiffs target the *service* that outputs the character. The PLAN.md rewrite ("like Meeko" becomes "a friendly raccoon") is the right control, but it must also run on free-text story fields, on photos (a child in a licensed costume or T-shirt), on the model's own output (a cheap vision check for recognisable characters and logos), and on re-rolls.
- **Real people and likeness**: right of publicity and false light are state-law matters and vary **[U; not researched this session]**. Product rules: no public figures or celebrity likenesses; ordinary private individuals only with the uploader's warranty of consent; for a gift book featuring a third adult (grandma), the uploader warrants permission. Takedown on request from anyone depicted.
- **Intimate imagery and deepfakes**: the TAKE IT DOWN Act notice-and-removal duty (48 hours) became enforceable 19 May 2026 for "covered platforms" **[S: https://www.ftc.gov/news-events/news/press-releases/2026/05/ftc-begins-enforcing-take-it-down-act]**. GreetHub's creations are private, so it is probably not a "covered platform" (a public forum for user-generated content) **[U inference]**, but a "report an image of me" channel with a 48-hour target costs almost nothing and also meets the providers' rules. Block sexual or nude content outright; for anything involving a minor, see 02 section 8.
- **AI transparency laws**: California's AI Transparency Act (SB 942, moved by AB 853 to 2 Aug 2026) applies to "covered providers" with over 1,000,000 monthly users of a publicly accessible generative AI system **[S: https://natlawreview.com/article/californias-ongoing-ai-regulation-key-deadlines-arriving-2026-and-beyond ; statute not read]**. GreetHub is far below that and is a deployer, not the model creator, so probably out of scope. Keep provenance metadata the model adds where practical. Our honesty copy ("the art is AI") covers FTC risk (03).
- **Colorado AI Act** (SB 24-205, delayed to 30 Jun 2026 by SB25B-004 **[S]**): targets "high-risk" consequential decisions (jobs, credit, housing). A card generator is not one. I did not verify what happened in the 2026 session. Low relevance.

## 5. Printer terms (flow-down)

- **Lulu** (https://lulu.com/terms-and-conditions, last revised October 8, 2026) **[V]**: content licence limited to operating the Site; creator warrants non-infringement and consent of identifiable people; **parent or guardian written consent for identifiable under-18s**; prohibits infringing privacy or publicity rights; Lulu "may monitor, filter, alter, remove, or refuse Content" and may suspend printing and shipping; its prohibited list includes "mass-produced or AI-generated content without meaningful human review, if it results in spam or low-quality publications"; the user indemnifies Lulu (Section 16). Print API use is also governed by "Terms & Conditions for Lulu Press APIs" at developers.lulu.com (not read) and a Lulu Data Processing Addendum (referenced, not read). **Action: read the developers.lulu.com API terms and obtain the DPA before launch; ask Lulu in writing whether per-customer AI-illustrated books with a human approval step are acceptable.** The proof-approval step is the "meaningful human review".
- **Prodigi** (https://www.prodigi.com/terms-and-conditions/, effective 1 May 2026, v1.0) **[V]**: no explicit customer-content warranty clause; general indemnity of Prodigi (cl. 9.6); Prodigi "will not be responsible for any infringement of third party rights" from your use of Products (cl. 12.3); may refuse any order (cl. 3.2); content must not be "malicious, defamatory, obscene, racist or designed to offend" (cl. 13.3); a Data Processing Addendum governs merchant-customer data (cl. 3.7).
- Gelato (fallback in PLAN.md): terms not read.
- Do not send source photos of people to either printer. Only the final generated art and PDF should go to them. This reduces who holds the children's photos.
- Children's product rules (CPSIA testing, tracking labels) may apply to a hardcover children's book **[U; not researched]**. Ask Lulu for its compliance statement and ask the attorney.

## 6. Trademark clearance for "GreetHub"

- **What I could verify**: web searches for "GreetHub" and "Greet Hub" with trademark terms returned no result for that exact mark (a cancelled 2017 filing for GREET in Class 38 by an unrelated owner appeared on trademarkdir.com). That is **weak evidence only**. A general web search is not a trademark search and I cannot query USPTO's database from here. **Status: not cleared.**
- Risks: GREET- and -HUB marks are common; Greetz, GreetPool and greetabl exist in the same field **[V that they exist; none is identical]**. "Greet" is descriptive of greeting cards and "Hub" is weak, so the mark is probably suggestive at best: easy to register if no conflicts, narrow in scope, and likely to draw "confusingly similar" objections from near names.
- Steps and costs are in 04-business-setup.md. Before spending ad money on the name: (1) search tmsearch.uspto.gov for GREETHUB, GREET HUB, GREET-HUB and phonetic variants in classes 9, 16, 35, 41, 42; (2) check state registries and common law (app stores, Instagram, TikTok and Pinterest handles, domains); (3) get an attorney knockout opinion, then file an intent-to-use application.

## 7. The Eye Story family sample

I did not open the Eye Story files for this brief; this is guidance for how to use it. The marketing plan wants it as the hero sample "with the family's OK".
1. Get a **signed release from every depicted real person, and from a parent or guardian for each minor**, covering commercial advertising use (website, social ads, press), for a stated term, with a revocation process and a statement of what revocation does not undo (ads already published). Written, dated, listing the specific uses. This is different from the product consent checkbox.
2. Confirm no one else is identifiable (neighbours, a school logo, a licensed-character T-shirt).
3. Treat the sample as an ad: say it is "AI-illustrated from real family photos". If the family speak for the product, their statements must be true and any free product or payment disclosed (FTC reviews rule, see 03).
4. If the family are the owner's relatives, the FTC rule on insider reviews requires disclosing the relationship.
5. The marketing plan already says no targeting based on kids' photos. Add: no use of the children's likeness in paid social without the written release above; keep a log.
6. Record who wrote what in the story (owner vs Claude) in case anyone later registers it.

## Sources (all read 2026-10-10)
- https://www.copyright.gov/ai/ (hub; Part 2 report 29 Jan 2025; registration guidance 88 FR 16,190)
- https://www.copyright.gov/dmca-directory/
- https://openrouter.ai/terms ; https://openrouter.ai/privacy ; https://openrouter.ai/docs/guides/features/zdr
- https://ai.google.dev/gemini-api/terms ; https://policies.google.com/terms/generative-ai/use-policy
- https://cloud.google.com/archive/terms/generative-ai-indemnified-services-20260422 (search snippet only)
- https://www.anthropic.com/legal/commercial-terms ; https://www.anthropic.com/legal/aup
- https://lulu.com/terms-and-conditions ; https://www.prodigi.com/terms-and-conditions/
- Secondary: Baker Donelson (Thaler cert denial), IPWatchdog, Sidley and Baker Botts (Part 2 summaries), NBC News (Midjourney), NatLawReview (California AI rules), FTC press release May 2026 (Take It Down Act)
