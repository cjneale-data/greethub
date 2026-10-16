# Committee review, consolidated for the owner, 2026-10-15

Written by the Product Manager from the 27 review files in this folder (you said 25; there are 27, all read) and docs/PLAN.md. Every number below is credited to the review it came from. Nothing here is new research. Unverified items are marked UNKNOWN. This is not legal or tax advice.

## 1. Where we really are

- **The product works end to end in mock mode and nowhere else.** QA ran today: typecheck clean, vitest 709 passed, 5 skipped, 1 failed (a timing timeout in `tests/book/jobs.test.ts`, probably load-related, not re-run alone) (qa). PLAN still quotes older counts (512/457); those are stale. Most other reviews ran nothing and read code only.
- **Built but never run for real.** Supabase persistence, Stripe, Resend, Lulu and Prodigi adapters are coded; none has touched a live or sandbox account (cto, shop-engineering, fulfillment). A paid order cannot reach a printer: `printAssets()` returns nothing, so every printed line lands in `needs_attention` (fulfillment, shop-engineering). Book state is still on the local file store, so a preview loses jobs on cold start (cto).
- **Not started at all:** the durable job queue (B3, the CTO's top technical risk: a 24 to 32 page render inside a Vercel request will time out), the durable spend ledger and CAPTCHA (B2), the analytics collector (B8, 0 of 95 events built beyond 4 safety events) (cto, security, data).
- **Security has launch blockers in code.** One env var on Vercel Production turns on fake payments and fake sign-in; mock AI can run in production unguarded; spend caps live in per-instance memory and reset on every cold start; no CAPTCHA; the rate-limit key is spoofable; no limit on magic-link emails (security).
- **Safety promises the product does not keep yet.** Box C keeps photos forever against a "90 days" promise; no cancel button; no durable consent log; the vision IP check passes a page when the check itself fails (so "no print without an IP verdict" is not met); the book proof shows a dedication that never prints (CX-44) (legal, privacy, ip-safety, book-engineering).
- **Docs are far ahead of code and content.** Plans, policies, runbooks, 66 attorney questions, finance workbook v3 and pricing proposals exist. Marketing: 0 occasion pages, 0 guides, 0 lifecycle emails, 0 posts, no accounts (growth, social). Art: 12 template covers and 26 style samples exist, but every approval row says "Claude (pending owner review)"; hero, sample book, Christmas book are missing (design).
- **Nothing is owner-unblocked yet.** No Supabase project, no printer accounts, no attorney, no domain or mailbox, no entity/EIN, no art cap, no usability round (legal, devops, finance-ops, research). Photo cards: Oct 24 gate is 1 met, 7 not met, 2 unknown (PLAN, cfo); plan for no-go.
- **Money is thin.** Base case: no break-even in 36 months, month-36 cash -$267k, peak funding need $297k on a $30k opening cash GUESS; recommended prices, $0 paid and 25% cash engineering give the $54k peak (cfo). Print cost is still an ESTIMATE and is the largest uncertainty (cfo).

## 2. Critical path and what to cut

**Nov 13 books gate** (needs B1-B7, B11, STRICT e2e, Lulu 7-step sandbox, physical proof judged, attorney Q1-Q13 on file) (PLAN, cto, book-engineering):

1. Oct 16: owner delivers Supabase, Stripe test, Lulu and Prodigi sandbox, Resend, Vercel, and the attorney engagement starts. Every later day comes off the gate (PLAN, cto).
2. B1 live against real Supabase, book state moved off the file store (cto, book-engineering). Largest single item; not mine to size.
3. B3 queue (page-per-step) before any live B5/B6 test. CTO recommends a Supabase table plus cron consumer (no new vendor).
4. B6 print PDFs from signed URLs, Lulu cover wrap, a real mock PDF and text-fit failure by **Oct 31** so the proof can be ordered **Nov 3** (book-engineering, PLAN).
5. B5 fail-closed IP verdict per page plus model-sheet check (ip-safety) in parallel; B11 consent log, box C, reminder email.
6. B2 durable caps and CAPTCHA before any live key runs a render (security).
7. Preview test-auth, CI e2e job, 4 STRICT gaps closed, STRICT run on preview (qa, devops).
8. Attorney answers to Q1-Q13 (legal). The longest lead item and the only one that can fail the gate on its own (book-engineering).

**Nov 20 cards gate:** B4 (about 8 engineer-days, card-engineering), B6 for Prodigi, folded-card proof in hand, live-payment prerequisites (entity, EIN, tax registration) (PLAN). Folded cards win any contested engineer-day over photo cards (PLAN).

**Cut order if dates slip** (CTO's list, extended by me):
1. Photo cards beyond B14.1 (printer quote) and B14.8 (proof). Default stance already is no-go.
2. Agent channel and all marketing sends (already dark/deferred) (cto, integrations).
3. B8 beyond three funnel events; B10 beyond hero and 12 covers; Express shipping (cto).
4. My additions: usability round 1 (research flags it likely to slip; fallback is assumption interviews, then round 1 in January, with a written waiver from you); publishing SEO pages; CX S2/S3 items; membership.
5. Fallbacks, from the plan: books miss Nov 13 means no Christmas books, cards only. Cards miss Nov 20 means skip Christmas physical product; sell the digital book and e-card as the after-cut-off gift. That means those must be live, or support has nothing to offer (support). Soft launch (invite-only, about 50 orders) moves to January.

## 3. One owner decision and approval list

Spend figures are CFO's (cfo section 2) unless marked. Labels: ESTIMATE, GUESS, UNKNOWN as the CFO gave them.

### By Oct 16 (every day late comes off the Nov 13 gate)
| # | Ask | Recommendation | Source | $ |
|---|---|---|---|---|
| 1 | Supabase project (Pro) credentials; let Data open a read-only `analyst_ro` | Yes. Unblocks nearly everything | PLAN 1, cto, data, devops | about $26-53 a month ESTIMATE |
| 2 | Job host: Supabase table queue vs Inngest | Supabase table (no new account) | cto, devops | in #1 |
| 3 | Engage an attorney now; send attorney-brief-2026-10 plus photo-events-legal (Q1-Q66) plus board's equity questions in one package. Or waive Q1-Q13 in writing, knowing why | Engage. Do not waive for real children's photos | legal, board, privacy | $7k-27k range ESTIMATE; model carries $12k |
| 4 | Stripe test keys and webhook secret, Resend key, Vercel login; turn on Deployment Protection and `master` branch protection; confirm no fake/dev/mock flags in Production | Yes | PLAN 4, devops, security | Resend about $20 a month; Vercel Pro $26 a month ESTIMATE |
| 5 | Lulu and Prodigi sandbox accounts and keys | Yes | PLAN 3, fulfillment | $0 |
| 6 | Rotate the OpenRouter key; separate dev/preview/prod keys with credit limits; auto top-up off | Yes, today | security | $0 |
| 7 | Buy the production domain (every SEO clock waits) | Yes | growth, devops | about $20 a year |
| 8 | R-PE1 holiday card survey panel and 6 interviews | Only if you want the photo-card read-out; ask Research for a written panel quote first. Otherwise cancel R-PE1 | research | UNKNOWN (no quote); CX says $50-90 per person |

### By Oct 20-24
| # | Ask | Recommendation | Source | $ |
|---|---|---|---|---|
| 9 | One OpenRouter art/eval cap of **$35** (style samples $3.50, launch art under $10, golden baseline $5, usability renders $15, IP live eval about $1) | Approve $35 as the single cap. Model-evals ($15, plus $5 for two fallback baselines), research ($15 image, $0.30 photo kit) and IP safety ($1) overlap with it; treat them as inside it, fallback baselines UNKNOWN extra | cfo, model-evals, research, ip-safety, design | $35 |
| 10 | Gooten account and sandbox; approve Fulfillment contacting Gooten and Prodigi with the written question list | Yes by Oct 20, or photo-card criterion 1 cannot be met | fulfillment, cfo | UNKNOWN |
| 11 | Oct 24 photo-card go/no-go | No-go unless 8 of 10 criteria flip. Plan Holiday 2027 | PLAN, cto, cfo | none |
| 12 | Core prices: books +$5 ($44/$54 all-in), mailed card $8.99 postage included, digital book $9.99, Express off. Photo cards $1.99/$1.79/$1.59 at 25/50/100 | Approve the core three; hold photo-card prices until a real printer quote. Raise every band $0.20 if print at 50 is above $0.95 a card | cfo, market-intel | none |
| 13 | Box C: hide until Saved People with photos exists | Hide (PLAN recommendation; legal and privacy both need it) | PLAN, privacy, legal, book-engineering | none |
| 14 | Reprint window: 90 days from delivery, shown at checkout | Approve 90 days; attorney confirms Q45 | PLAN decision 6, privacy, support | none |
| 15 | Refund/reprint limit $60 per order, 1% goodwill budget; separate rule for batch card orders | Approve $60. For batches use a percentage or higher cap (a 100-card order exceeds $60) | cx, support | none |
| 16 | Christmas cut-offs: books Dec 2, folded cards Dec 10, photo cards Nov 30 | Approve books/cards; photo cards Nov 30 (see conflicts) | fulfillment, PLAN | none |
| 17 | DPI rule: warn under 200, block under 150, undismissable | Approve | PLAN, card-engineering, model-evals | none |
| 18 | Name the daily report reader and a backup (weekends included); reviewer recommends, owner approves removals | Required for soft launch | trust-safety | none |
| 19 | Dev dependencies `@playwright/test` and `pixelmatch` | Approve `@playwright/test`; pixelmatch only if photo cards go | qa | none |

### By Nov 6
| # | Ask | Recommendation | Source | $ |
|---|---|---|---|---|
| 20 | Order physical proofs: book and folded card by **Nov 3**; flat photo card by **Nov 6** (only if go). Approve print quality | Yes for book and folded card. Flat card only on a go | PLAN, fulfillment | model carries $1,500 for proofs and launch assets GUESS; real cost UNKNOWN until quote |
| 21 | Entity, EIN, business bank, accountant (send `finance/ops/accountant-questions.md`); company legal name, postal address, support mailbox (CX-02, CAN-SPAM) | Start now; the lead times are weeks | finance-ops, cx, support | model: $2,000 accountant/entity/domain/mailbox GUESS; accountant $500-2,000 once plus $100 a month |
| 22 | Soft-launch mechanism (allowlist or invite code); whether email capture on the waitlist is allowed | Allowlist only, no capture, until marketing email consent exists | cmo, growth, data | none |
| 23 | Usability round 1: run (about $360-460 incentives for 6) or waive in writing | Waive in writing for now unless Supabase lands by Oct 30; run in January | research, cx | PLAN $400-500 |
| 24 | Support tool and budget: Google Workspace inbox (about $7 a month) vs Help Scout (about $22 a month); $10-50 a month plus about $400 December contractor | Google Workspace inbox; move at about 60 contacts a month | support, cx | up to about $450 for Dec; not in CFO total |

### Before launch (before the first real child's photo or first live charge)
| # | Ask | Recommendation | Source | $ |
|---|---|---|---|---|
| 25 | Sales tax registration (home state), Stripe Tax live, resale certificates for Lulu and Prodigi | Before the first live charge | finance-ops | in #21 |
| 26 | Vendor DPAs/ZDR: OpenRouter, Google, Anthropic, Lulu, Prodigi, Supabase; send OpenRouter's ZDR/DPA request | Yes. No "we do not train" claim until written | privacy, legal, data | none |
| 27 | DMCA agent registration; set `registered: true` in `DmcaAgentBlock.tsx` | Yes | legal, ip-safety, trust-safety | $6 SOURCED |
| 28 | Insurance (cyber, media/IP, GL) with AI and biometric exclusions confirmed in writing | Get quotes now, bind before real photos | legal, cfo | model $383 a month; range $2,500-8,000 a year |
| 29 | Trademark knockout and filing (brand, handles, replacement character names) | Knockout before any social handle purchase | ip-safety, social, cmo | model $2,000; range $1,000-4,500 |
| 30 | Turnstile site (free), alert recipients, daily spend ceiling (security suggests $0.50 per measured-cost run), GitHub secret scanning | Yes | security, devops | $0 |
| 31 | Marketing email: opt-in wording, postal address, build consent/suppression/unsubscribe before any promotional send | Defer sends to after Valentine's as PLAN says; build is a Shop task | growth, shop-engineering, data | none |
| 32 | Art approvals: approve or reject the 24 logged images; sample policy (fictional only, no children's faces in any ad) | Approve the policy; review all 12 covers yourself | design, cmo, ip-safety | none |
| 33 | Partners, rates and funding of the $54k to $297k need; company vs personally paid spend | Not launch-blocking, but decide before anyone fronts money; log nothing the agents did | board, PLAN 12 | opening capital UNKNOWN |
| 34 | Competitor books and our own proof: Imagitime, Wonderbly (about $200) | Yes, Oct 25 (inside #20's budget as the CFO counts it) | market-intel, cfo | about $200 |
| 35 | Kiosk stays research-only until S0; agent channel stays dark | Confirm | kiosk, integrations | $0 now |

**Spend total.** CFO: about **$18k before the first live order** ($35 + $450 + $1,500 + $12,000 + $2,000 + $2,000) plus about **$480 a month** (Vercel, Supabase, Resend, insurance). Plan **$18k-$35k** if the attorney lands at the high end ($27k), and treat the $30k opening cash GUESS as spoken for. Not in that total: engineering ($107k modelled), Gooten (UNKNOWN), survey panel (UNKNOWN), support allowance (about $450 for December), the fallback eval baselines, December no-face photo shoot (UNKNOWN, social), state LLC fee, bank/EIN fees. The paid-marketing budget for the soft launch is $0 (cfo).

## 4. Conflicts between reviews and docs

| Topic | Who disagrees | Resolution |
|---|---|---|
| **DPI rule** | CTO/Fulfillment: warn under 200, block under 150. Design: tick-to-continue 100-149, block under 100. Code (`quality.ts`): flag under 120, never block. CX: a block cannot be dismissed | Resolved by recommendation (#17): warn under 200, block under 150, undismissable. Needs your yes; Card engineer then aligns code into one module before the golden PDF is trusted. Revisit after the paper proof |
| **Order-by date, photo cards** | PM: Nov 30. Gooten: print-ready by Dec 7. Fulfillment draft is internally inconsistent on Dec 5. CFO: about 70% of orders arrive Dec 1-10 (not modelled). Folded-card config says Dec 10 | Flag. Recommend Nov 30 unless Gooten gives written dates for Dec 5. It costs demand a 30-order cap can absorb. Only matters on a go |
| **List cap** | Code, CTO, Legal: 500. Privacy ops doc: 1,000 | Resolved: 500 (privacy review already says its doc must be corrected). Privacy ops to fix the doc; QA conflict cases C1-C6 should then stop failing on purpose |
| **Retention** | (a) Box C keeps photos forever vs the 90-day promise. (b) Support/Ops 12-month reprint window vs Privacy/Legal 90 days. (c) Photo sets "order closed + 30 days, cap 120" vs 90 days in PLAN and consent box B. (d) Drafts/art 12 months and consent 5 years promised, no job exists. (e) `identity.txt` and model sheets survive the purge | (a) hide box C (#13). (b) 90 days from delivery (#14). (c) Align to one number; recommend 90 days from delivery, and Privacy ops edits the photo-events doc. (d) Build the jobs or remove the promise before publishing the policy. (e) attorney question Q4, owner of the answer is legal |
| **Refund limit** | CX: $60 per order. Support: batch card remedies will always exceed it | Flag. Recommend $60 for books/cards, a percentage cap for batch lines (#15) |
| **Help desk tool** | PLAN: Help Scout from launch. CX: Google shared inbox first | Recommend CX's. Your call (#24) |
| **Marketing email** | CMO and Growth want invite, welcome and cart emails now. PLAN, Data and Shop engineering: no consent store, unsubscribe or suppression list exists; sends deferred to after Valentine's | Draft now, send nothing. Attorney to say whether "draft saved" and cart reminders count as transactional (Growth reads them as commercial). The soft-launch invite is a one-off sent by you from a person, to a list you hold, after the attorney agrees |
| **"Sample" label on AI people** | Social wants a "Sample" label for AI adults; IP safety and standing rule 5 say no real people and no lookalikes | Default to no-face samples (hands, rings, pets); your decision (#32). No AI people in 2026 |
| **Content counts** | CMO: 60 type-only pins, 10 TikTok scripts. Social: 40 pins, 12 TikTok videos. Both are plans, not measurements | One owner of the content calendar: Social. Use Social's numbers for week 1 to 4 |
| **Cap overlap** | CFO $35 vs model-evals $15, research $15 and $0.30, IP safety $1 | One $35 cap (#9) |
| **Stale claims** | Minted $2.28 and Vistaprint $59.95 are Nov 2022; Paperless Post $0.22-0.30 is out of date; PLAN calls `photo_sets` uncommitted (it is committed); finance/README kiosk figures are v2 | No public price comparison until Market intel refreshes (Oct 22). CFO to date or drop old figures. PM to fix the PLAN line |
| **Animated home page** | CX, QA and Security each looked for it and found nothing in the repo | Not assessable. CTO to say whether it exists and when it lands; QA/CX checks wait on that |
| **Photo-card ladder** | CFO's ladder 10-200 vs PM 25/50/100 | 25/50/100 for 2026 (CFO agrees); price config file, not code |

## 5. What can start now, without waiting on the owner

### Engineering (ranked)
1. **SEC-02 hard boot failure** if fake auth, fake payments, dev sign-in or mock AI is set in Production; also reject a missing key silently meaning mock (security 1, 7). S.
2. **CX-44: hide the dedication in the proof** (book-engineering P0). S.
3. **B5 fail-closed IP verdict** per page, stored and enforced at approve and print; model-sheet check (ip-safety 1, book-engineering P0). M. The $0.01-per-sheet live check waits for the cap.
4. **Real mock PDF and text-fit failure** so B6 has a print PDF by Oct 31 (book-engineering). M.
5. **B6 print path against fakes**: signed print URLs, Lulu cover wrap, Lulu submit idempotency key, account-delete photo purge (shop-engineering, fulfillment). M-L.
6. **B3 queue** design and Supabase-table consumer, behind the existing interface (cto). L.
7. **Rate-limit and abuse fixes**: platform client IP instead of left-most `x-forwarded-for`, magic-link rate limit, signed guest cookie, cart caps (security 3-6). S-M.
8. **Migrations**: `batch_jobs` and `photo_sets` tables, `photo_sets` in `Docs`, consent and ledger tables from DATA-001 (cto, data). M.
9. **B4 session-aware card creator, approval page, render job** against the store interface in mock (card-engineering, about 8 days).
10. **Housekeeping**: de-flake `jobs.test.ts`; one DPI module (after #17); CI e2e job in mock mode; `/api/health`; committed `.env.example`; merge order #12, wave 2 (rebase if squashed), #13 (cto, qa, devops).
11. **CX-31 `/help` and `/contact`, CX-34 reference codes** (cx, support). S-L.
12. $0 evals: proof-checker set and crop set (model-evals), text-only identity path and `--golden` mode for the baseline run.

### Legal and operations
1. Send the single attorney package once an attorney is chosen; add Q45-Q66 and equity questions (legal, board). Writing is done; the send is the owner's.
2. Privacy ops: correct the 1,000 cap and the photo-set retention number; write the "order closed" rule; DELETION_VENDORS update.
3. Trust & safety: DMCA form wording (trademark option, penalty-of-perjury text), AUP extension, hold-not-delete design, comment-moderation policy.
4. Fulfillment: send-ready Gooten and Prodigi question lists, vendor contact sheet, delay-notice templates, peak-week watch plan (needs your OK to contact vendors).
5. Finance: CFO adds photo-card, event and membership rows to workbook, refreshes README; finance-ops chart of accounts into the chosen tool once picked.
6. Market intel: price refresh by Oct 22 (web research, no spend), Black Friday check about Nov 1.
7. Support/CX: finalise macros and holiday replies H1-H6 to match the decisions in section 3.

### Marketing, SEO, email and social (nothing publishes until its gate clears)
Counts as each review gave them; all are drafts. Rule from the CMO: copy that needs no art and no decision first, then art, then anything that talks to customers last.

| Area | Inventory | Source | Start now |
|---|---|---|---|
| Occasion pages | 12 first (Christmas card, Christmas book, Hanukkah, Thanksgiving, birthday Mom, Grandma and kids, new baby, Valentine's, Mother's Day, sympathy, teacher, hub), then 12 more | cmo, growth | Draft all 12 text now. Valentine's and Mother's Day first (earliest indexing) |
| Guides | 8 guides | growth | 7 of 8 now; the "when to mail" guide waits on printer cut-offs |
| Keywords | about 60 terms for your Keyword Planner export | growth | Term list now |
| Comparison pages | feature-only, no prices | growth, market-intel | Draft; hold on prices |
| Technical SEO | JSON-LD (Product, FAQ, Organization, Breadcrumb), internal links, server-render landing text, remove `[PLACEHOLDER]` | growth | Specs now; Shop engineer builds |
| Emails | about 14 lifecycle emails (cmo); about 13 marketing rows plus 3 transactional (growth); 4 optional transactional drafted | cmo, growth | Copy now. Send none |
| Social, 2026 | about 116 pieces, about 76 startable now, about 40 blocked on art or proofs | social | Pinterest: 6 boards, 30 type-only pins pre-launch; IG founder posts and 6 carousels; 12 TikTok voice videos. Month-one plan: about 40 pins, 6 IG posts, 7 TikToks |
| Social, later | Valentine's about 40 pins plus 12 Reels, 8 carousels; Mother's Day about 30 pins, 6 Reels, 6 carousels | social | Drafts only; no creators |
| Ads | 12 concepts x 3 audiences, Pinterest, Google, TikTok, retargeting, last-week digital gift | cmo | Briefs as text; nothing runs before the gate |
| Press | fact sheet, 3 pitch angles, 30-outlet list, press kit | cmo | Fact sheet and list now; hold pitching until real orders ship |
| Brand/Design | social and email templates, icon set, per-page OG, outlined logo, occasion tiles from existing covers | design | All no-spend |
| Review | the 26 style samples against brand and IP | cmo, ip-safety | Eyeball review now; vision check needs the cap |

**Hard blocks on the above:** no real art (cap #9), no accounts or AI-label wording for platforms (social: unresearched), no domain (#7), no postal address and consent store (#21, #31). The CMO and Social agree 2026 revenue from marketing is a stretch; SEO pays from about February 2027 (growth GUESS).

## 6. Recommended next three work waves

**Wave 1, Oct 16 to Oct 24: unblock and harden.**
- Owner: items 1-8 of section 3, then 9-19.
- CTO and Security: Supabase adapter live, queue decision, SEC-02 boot guard, abuse fixes. Book engineer: CX-44, mock PDF, fit check. IP safety: fail-closed verdict (with CTO agreeing who owns `qa.ts`). Card engineer: one DPI module. QA: de-flake, e2e CI job.
- Fulfillment and CFO: Gooten/Prodigi written answers and real quote, so the Oct 24 call has evidence.
- CMO, Growth, Social: 12 page drafts, email decks, 30 pins, term list. Market intel: price refresh Oct 22. Legal: package to the attorney.

**Wave 2, Oct 24 to Nov 6: build the path.**
- CTO, Shop, Fulfillment: B3 queue, B6 print path and PDFs by Oct 31, Lulu then Prodigi sandbox 7-step routine. Book engineer and IP safety: B5 gate, B11 consent log, box C hidden. Card engineer: B4 with approval page.
- Owner: orders book and folded-card proofs Nov 3; entity, EIN, bank, accountant started.
- Design and Model-evals: render hero, covers, sample book and golden baseline the day the cap lands; Design runs the 26-style IP vision check.
- Photo cards only if Oct 24 is a go: B14.1 and B14.8 first. Data: collector with three funnel events.

**Wave 3, Nov 6 to Nov 20: prove it and decide.**
- QA and DevOps: STRICT e2e on preview at 1280 and 390, axe strict, backup restore drill, monitoring and health check, purge cron alert.
- Fulfillment and owner: judge the physical proofs. Legal: attorney answers on file. Support, CX, Trust & safety: mailbox, contact form, report reader named.
- Nov 13 books go/no-go, Nov 15 cut-off banner, Nov 20 cards go/no-go, with the fallbacks in section 2. Invites go out only after both gates and the attorney's go-ahead.

## Not verified or left out
I ran no tests and no code; the only test results here are QA's. Dates for invites and gift-guide closes are the CMO's guesses. The animated home page could not be found by three reviewers. The CFO figures are cached workbook values, not recalculated today.
