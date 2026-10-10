# 04. Business setup and Opex ranges for the CFO

Research brief for the owner and a licensed attorney/accountant. Not legal or tax advice. Date: 2026-10-10.

Cost ranges below are **my planning estimates [U]** unless a source is cited. Only these were checked against a source this session: USPTO base trademark fee (secondary sources), DMCA agent fee (secondary), Stripe Tax pricing (Stripe page), cyber insurance range (secondary). Get quotes before committing. State fees change; check the Secretary of State site for your state.

## 1. Entity choice

| | LLC | C-corporation (usually Delaware) |
|---|---|---|
| Best when | Bootstrapped, one or few owners, profits taxed to owners | Raising venture or angel money, issuing stock options, wanting QSBS treatment later **[U]** |
| Liability shield | Yes if you keep it separate (bank account, no commingling) | Yes |
| Tax | Pass-through by default; self-employment tax on profits unless it elects S-corp treatment | Corporate tax, then tax on dividends; losses stay inside |
| Admin | Light | Board, bylaws, stock ledger, annual meetings, 409A valuations once options exist |
| Conversion later | LLC can convert to a C-corp when investors require it (cost: attorney and some tax work) | n/a |

**Recommendation to discuss with an attorney and CPA:** if the owner is funding this alone and the model (CAC about $76 per the CMO's rough guess against a modest order value) says it is a small business first, form an **LLC**, in the owner's home state unless there is a reason otherwise (forming in Delaware or Wyoming and operating from another state usually means paying two states: foreign qualification at home **[U]**). If outside money is planned within about 12 months, form a **Delaware C-corp** now to avoid a conversion. Decision driver is the question to the owner: will you take investors?

Costs **[U]**: LLC filing $50 to $500 depending on state; annual report or franchise fee $0 to $800 (some states higher); registered agent $0 (self) to $300 per year; attorney-drafted operating agreement $0 (template) to $1,500; Delaware C-corp formation via attorney $500 to $2,500 plus Delaware franchise tax and annual report (varies by method; low hundreds of dollars at minimum **[U]**); stock issuance and founder paperwork $500 to $2,500.

## 2. Registrations and accounts

| Item | Why | Rough cost | Notes |
|---|---|---|---|
| EIN (IRS) | Banking, Stripe, payroll | $0 | Apply on irs.gov, not a paid service |
| Business bank account | Keep funds separate; Stripe payouts | $0 to $30/month | |
| State sales tax permit(s) | Collect and remit | $0 to $100 each, home state first | Register elsewhere when thresholds hit (see 03) |
| Local business licence | City/county | $0 to $400 | Depends on home-based rules |
| Foreign qualification (if formed outside home state) | Operating in home state | $100 to $800 + annual fees | |
| Beneficial ownership report (FinCEN) | Corporate Transparency Act | $0 | Domestic companies were exempted by 2025 rule changes; confirm current status **[U]** |
| DMCA designated agent | Safe harbour for user-content claims (17 USC 512) | **$6** per designation, renew every 3 years **[S]** | Register online at copyright.gov/dmca-directory **[V that online registration is required]**; list the agent on the site footer |
| Privacy contact mailbox and legal@ address | Rights requests, takedowns | $0 to $12/month in mail hosting | |
| Stripe Tax | Sales tax calculation | 0.5% per Checkout transaction, or from $90/month for Tax Complete **[V]** | See 03 |
| Registered agent address for privacy policy and CAN-SPAM postal address | Required postal address in marketing email | $0 to $300/year (commercial mailbox or registered agent address) **[U]** | Use a business address you are willing to publish, not a home address |
| Accountant/bookkeeper | Sales tax filings, income tax | $100 to $400/month, or software $30 to $100/month | Include sales tax filing service if needed |

## 3. Insurance

Planning basis: cyber $400 to $1,600 per year for a $1M aggregate policy **[S: https://www.quotesweep.com/blog/cyber-insurance-cost and https://beancount.io/blog/2026/07/22/cyber-insurance-small-business-cost-breach-guide ; one source says up to $8,000+; e-commerce blog said $2,400 to $4,500, flagged low quality]**. A BOP (general liability plus property) for a small online retailer averages $67 to $118 per month **[S]**; a BOP does not cover data breaches **[S]**.

| Policy | Covers | Rough annual premium | When |
|---|---|---|---|
| Cyber liability | Breach response, notification, regulatory defence for privacy claims, ransomware | $400 to $2,500 (planning figure $1,000 to $2,000) | Before real children's photos are stored |
| Media / IP liability (advertising injury, infringement, defamation, right of publicity from content you create) | The AI output risk we carry because no vendor indemnifies us | $500 to $3,500 **[U]**; some insurers exclude AI-generated content, so ask directly | Before launch; ask whether "AI-generated content" and "biometric" claims (BIPA) are excluded; BIPA exclusions are common **[U]** |
| Technology E&O (often bundled with cyber/media) | Failures of your service | included or $500 to $2,000 **[U]** | Launch |
| General liability / BOP | Bodily injury, property damage, advertising injury | $800 to $1,400 (from $67 to $118 per month) **[S]** | Before launch; landlords/partners ask for it |
| Product liability (printed goods) | Injury from the product | Often rolled into GL; confirm printers' product coverage | Ask Lulu/Prodigi for their certificates |
| Directors and officers | Mostly for investors | $1,500 to $5,000+ **[U]** | Only if raising |

Total planning range for a first-year insurance stack: **about $2,500 to $8,000**, depending on exclusions. A broker who sells to tech startups is worth the call; ask for written confirmation of what is excluded.

## 4. Trademark: filing steps and costs

1. **Search first.** USPTO database at tmsearch.uspto.gov for GREETHUB, GREET HUB and phonetic or spelling variants in classes 9 (downloadable software/apps), 16 (greeting cards, printed books), 35 (online retail), 41 (custom book creation/entertainment), 42 (SaaS). Also state registries, domains, app stores, social handles. Free (your time). My web searches did not find an exact "GreetHub" mark but that is not clearance **[see 01 section 6]**.
2. **Attorney knockout and opinion.** $300 to $1,500 for a knockout; a full search report plus opinion $1,000 to $3,000 **[U]**.
3. **File the application** at USPTO. Since 18 Jan 2025 there is a single base application fee of **$350 per class**, with surcharges: $200 per class for free-form goods/services text instead of the ID Manual, $100 per class for insufficient information, and $200 per extra 1,000 characters **[S: Perkins Coie, Gerben, Piper Pat, Flaster Greenberg; not the USPTO fee page, so verify at https://www.uspto.gov/trademarks/fees-payment-information]**. Practical filing: use ID Manual wording, file an **intent-to-use (1(b))** application if you have not yet sold, one to three classes (probably 16, 35, 42): **$350 to $1,050** USPTO fees. Attorney filing $500 to $1,500 per application **[U]**.
4. Examination takes many months; office actions are common; response cost $300 to $1,200 each **[U]**. Publication, opposition window 30 days.
5. Intent-to-use requires a Statement of Use later (fee, **[U]** about $150 per class) and extension fees if needed.
6. Registration maintenance between years 5 and 6 and every 10 years **[U]**.
7. Use the (TM) mark now; use (R) only after registration.
8. Monitoring service optional: $200 to $600 per year **[U]**.

Estimated first-year trademark budget: **$1,000 to $4,500**, mostly attorney time.

## 5. Domain and brand assets

- Check greethub.com and common variants for availability and for any existing business before deciding. Typical .com registration $10 to $20 per year; a premium aftermarket .com costs $500 to $50,000+ **[U]**. Defensive registrations (.co, .net, greet-hub) $30 to $100 per year.
- Registrar lock, auto-renew, and privacy; register in the company name, not a personal name.
- Resend needs DNS access for SPF/DKIM/DMARC; DMARC policy needed for deliverability **[U]**.
- Social handles on Instagram, TikTok, Pinterest, YouTube before launch.

## 6. Legal and professional services (one-time and ongoing)

| Item | Rough cost | Notes |
|---|---|---|
| Attorney review of ToS, Privacy Policy, AUP, Refund policy (05 drafts) | $2,500 to $8,000 | Fixed-fee quote; ask to include state-law differences and AI-vendor flow-down |
| Written opinion on COPPA/BIPA/state children's data position (photos of minors) | $1,500 to $5,000 | The single highest-value opinion; see 02 |
| Consent flow and model-release templates (product and Eye Story ad release) | $500 to $1,500 | |
| Trademark (section 4) | $1,000 to $4,500 | |
| Entity formation and operating agreement | $500 to $3,000 | |
| Vendor-contract review (OpenRouter, Lulu API, Prodigi, creator agreement) | $1,000 to $3,000 | |
| Tax adviser set-up for multistate sales tax | $500 to $2,000 | |
| Annual compliance refresh (policies, new state laws) | $1,000 to $4,000 per year | |
| **Launch legal total (excluding insurance)** | **about $7,000 to $27,000** | Low end if you use the drafts and a narrow attorney review |

## 7. Opex lines for the CFO workbook (summary)

| Opex line | One-time | Annual |
|---|---|---|
| Entity formation and registrations | $300 to $4,000 | $0 to $1,500 |
| Attorney launch package (policies, privacy opinion, vendor review) | $4,500 to $17,500 | $1,000 to $4,000 |
| Trademark | $1,000 to $4,500 | $200 to $600 (monitoring), maintenance later |
| Insurance stack | n/a | $2,500 to $8,000 |
| Stripe Tax | n/a | 0.5% of taxable Checkout volume (or $1,080+ per year for Tax Complete) |
| Sales tax filing service / bookkeeper | $0 to $500 | $1,200 to $5,000 |
| Domain(s) and DMCA agent | $20 to $100 | $20 to $120 |
| Accessibility audit (automated plus one manual expert pass) | $1,000 to $5,000 **[U]** | $500 to $2,000 |
| Cookie/consent management tool, if bought | n/a | $0 to $600 |
| Penetration test / security review for photo storage | $0 to $5,000 **[U]** | $0 to $3,000 |

These are estimates, not quotes. Treat the range ends as Low and High scenarios.

## Sources
- USPTO fee structure effective 18 Jan 2025: https://perkinscoie.com/insights/update/usptos-significant-restructuring-trademark-fees-takes-effect-january-18-2025 ; https://flastergreenberg.com/newsroom-alerts-USPTO-Implements-Significant-Changes-To-Trademark-Application-Filing-Procedures-And-Fees.html ; https://www.gerbenlaw.com/?p=68568 (read 2026-10-10, secondary)
- DMCA agent: https://www.copyright.gov/dmca-directory/ [V]; $6 fee and 3-year renewal from Copyright Office and law-firm notes surfaced in search (e.g. https://blogs.loc.gov/copyright/2019/10/it-may-be-time-to-renew-your-dmca-agent-registration/) [S]
- Stripe Tax pricing: https://stripe.com/tax/pricing [V]
- Cyber insurance ranges: https://www.quotesweep.com/blog/cyber-insurance-cost ; https://beancount.io/blog/2026/07/22/cyber-insurance-small-business-cost-breach-guide [S]
