# 09. Open questions and owner decisions

Each item has my recommended default so a "yes to all" is a workable answer. IDs are referenced from other files. Owner-only items are marked (owner); items that need an outside party are marked (external).

## A. Strategy and money

1. **Go/no-go and gating.** Approve P0 and P1 now (about 57.5 days, about $34,500 at $600/day, plus the security work already planned), and gate P2 to P4 on P1 usage (25 connected beta accounts, 100 drafts). Default: yes. (owner)
2. **Blended rate and build model.** Is $600 per person-day the right planning number, and will gh- agents build this (cash cost = tokens plus your review) or a contractor? Default: plan at $600, measure actual agent cost on P0. (owner, gh-cfo)
3. **Is the channel worth it given the margin?** At about $3.3 contribution per card the build does not pay back from direct margin inside 36 months (08 section 4). It pays back only through CAC avoided, repeat use and distribution. Default: proceed in stages and judge on connected-account growth, not margin. (owner)
4. **Draft budget.** Approve an `agent` model-spend pool of $10 per day (worst case about $300 per month) and the per-grant quotas in 04 (10 drafts/day, 60/month free tier). Default: yes, revisit after SEC-14 measures real costs. (owner)

## B. Product and policy

5. **Human approval by default; autonomy opt-in only on the web.** Confirm that no tool call can ever enable autonomy, change limits or add recipients to an allowlist. Default: yes. (owner)
6. **Stored card, not a prepaid wallet, at launch.** Default: yes; wallet only after attorney opinion and never via an assistant. (owner)
7. **Default limits.** $15 per card, $50 per month, $120 per year for autonomy, max 6 cards a month, 30-minute undo hold, 24-hour cooling-off, first 3 cards to each recipient need approval. Default: accept as proposed. (owner)
8. **Products via assistants.** Mailed cards only in P1 to P3; no books, no digital cards, no express shipping. Default: yes. Do you want digital cards on Claude/Gemini later? (owner)
9. **Children's likeness via assistants.** Not in P1. In P2 only for People the owner flags "usable by my assistants", approval mode only, after the attorney opinion on children's data and your Illinois decision (legal 00 question 3). Default: block until the opinion. (owner, external attorney)
10. **Who may be a recipient.** Saved People only. Should the owner be able to mail a card to themselves (`mailTo: buyer`) with fewer checks? Default: yes, the owner's default address only. (owner)
11. **Email delivery of e-cards to a third party** (digital cards sent to a recipient's email) is excluded from this plan because of spam and CAN-SPAM exposure (legal 03 section 7) and ChatGPT's digital-goods rule. Default: exclude. (owner)
12. **Birthday and anniversary reminders**: build natively inside GreetHub (optional birthday on a Person, explicit consent) rather than via assistants. Default: yes (AGT-034). (owner)
13. **Message authorship.** Default `compose` (Greet Guide writes from a short memory) when the assistant supplies no text, `as_written` when it does. Is an "AI-written message" disclosure needed on the card or only on the approval page? (owner, attorney)
14. **Preview fidelity.** Render drafts at final resolution (about $0.27 each) or approve a 1K master and print through a verified upscale (about $0.09)? Needs a physical proof test; decides cost per draft. (gh-card-engineer, owner)

## C. Platforms (write to them before building P4)

15. **OpenAI:** (a) Is an approve-then-pay page on greethub.com that the user opens from push/email (not from the chat) compliant with "linking directly to a checkout or transactional page is prohibited"? (b) Are mailed personalized physical goods OK, and are digital cards/credits excluded as I read the guidelines? (c) Is there any timeline for opening Instant Checkout/ACP beyond select partners? (external, owner sends)
16. **Anthropic (mcp-review@anthropic.com):** (a) Does a merchant connector that lets users buy the merchant's own physical product count as "executes financial transactions" under Directory Policy 4A, and if so will Anthropic permit it in writing? (b) Does a card-creation service whose images are AI-generated count under 4B ("AI media generation") or is it a design-workflow case? (c) What does the Verified review involve and how long? (external)
17. **Google:** Is there a submission or partner path for the consumer Gemini app beyond user-added custom apps? None found. (external)
18. **Microsoft, Amazon, Perplexity:** consumer reach and listing process (Copilot consumer app, Alexa+ certification and commerce/Wallet terms, Perplexity listing). Not found. (external)
19. **Priority order of platforms for P4.** Default: Claude and ChatGPT directories first, Alexa+ second, Copilot Studio connector third. (owner)
20. **Who holds the platform accounts** (OpenAI Platform business verification, a paid Claude plan, Amazon developer account). (owner)

## D. Legal and privacy (attorney)

21. Agent addendum to Terms and Privacy; consent texts for connection, card-on-file, approval and autonomy. (attorney)
22. Recurring and automatic purchase rules: does a standing rule that buys cards on a trigger need negative-option/auto-renewal style disclosures? Legal 06 item 40 gate applies. (attorney)
23. Stored credentials/merchant-initiated charge rules for autonomous mode. (attorney, Stripe)
24. Recipient-address privacy: is the user's representation enough, and what must the Privacy Policy say about third-party addresses? (attorney)
25. Platform developer agreements: liability, indemnity, data-use and prohibited-use clauses for OpenAI, Anthropic, Google, Microsoft, Amazon. (attorney)
26. Refund rule for mistaken assistant orders: default proposal is refund if cancelled inside the hold, or if default-mode and the human did not approve; otherwise the personalized-item policy applies. (owner, attorney)
27. Whether meeting-derived thank-you context ("thanks for the budget walkthrough") sent by an assistant is a privacy issue for the owner's employer/clients (professional confidentiality). The tool docs warn users; is more needed? (attorney)

## E. Technical decisions needing a spike or an owner nudge

28. Supabase OAuth server vs a custom authorization server (AGT-010 spike); does it support CIMD, custom scopes, revocation, rotating refresh tokens, and a custom issuer domain (`auth.greethub.com`)?
29. Can `mcp-handler` 2.x serve 2025-11-25 clients (Alexa+) alongside 2026-07-28? (AGT-012)
30. Vercel plan and function-duration limits for the 20-second preview wait (docs/security/costs.md plan question).
31. Address validation provider or printer-side validation (AGT-023); PO boxes and commercial mail receiving agencies.
32. Does `orderState.ts` allow cancel from `paid`/`preparing`, and can printer submission be deferred 30 minutes? (AGT-022)
33. Sandbox policy vs SEC-02/R3 (fake providers never in production): approve a dedicated sandbox deployment with its own domain and no shared secrets. (gh-security, owner)
34. Web push for approvals now, native mobile push when the Expo app exists (docs/cto mobile plan). Is email-only acceptable for P2? Default: email plus web push.
35. Turnstile on checkout may block agentic browsers (for example Link Agent Wallet users); decide whether to allow-list or accept the loss. (gh-security)

## F. Things only the owner can do
- Approve or edit the defaults above.
- Send or authorize the platform questions (items 15 to 18).
- Engage the attorney (items 21 to 27).
- Create and verify the OpenAI Platform and Claude developer accounts (item 20).
- Keep the security prerequisites on the critical path (docs/security/06-backlog.md Groups A to C in 06).
