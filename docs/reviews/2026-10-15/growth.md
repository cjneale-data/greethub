# Growth review, 2026-10-15

Growth lead. Evidence: docs/PLAN.md (Growth section), docs/cmo/marketing-plan.md, docs/growth/photo-events-seo.md, app/lib/seo.ts, app/lib/shop/mail.ts. Every traffic or volume figure below is a GUESS unless marked SOURCED. No Keyword Planner or Search Console data exists. Not legal advice.

## 1. Done vs plan

| Plan item | Status |
|---|---|
| 24 occasion pages in 90 days (marketing-plan s3) | 0 written, 0 live. PLAN.md revised this to "12 good pages first". |
| 8 blog guides | 0. No blog or guides route exists. |
| Lifecycle emails (welcome series, post-purchase, reminders) | 0 drafted. docs/growth/ holds ONE file (photo-events-seo.md). |
| Keyword evidence | Not started for core products. Photo-events doc has 4 SOURCED figures, 3 of them unverified; the rest NOT FOUND. |
| Technical SEO | Partly done by engineering: `app/lib/seo.ts` (canonical, OG, indexable only on production), sitemap.ts, robots.ts, OG image, nopin on private pages. 6 indexable URLs (/, create/card, create/book, browse, pricing, faq). |
| Photo cards and events SEO plan | Written (210 lines): keywords, page template, email timing, editorial calendar. Publishes nothing in 2026 by design. |
| Ad creative briefs | 0. Paid is gated (CMO gate, no paid before Jan if gate unmet), so low urgency. |
| Transactional email code | Exists: order confirmed, shipped, needs attention, magic link, delete confirm, account deleted (app/lib/shop/mail.ts). Not Growth's, but the base for the list below. |

Honest read: the owner is right. Growth delivered one planning doc and no drafts. The plan's own definition of done (prioritized content plan with drafts) is not met for books and cards.

## 2. Inventory of what is missing

Size: S under half a day, M 1-2 days, L 3+ days. Owner: who does the work. Start: NOW = no blocker, BLOCKED = needs the named item.

### 2a. Occasion landing pages (12 first, per PLAN.md order). Each M for the first (template), S after.
Needs: server-rendered route (Shop eng), sample art with fictional people (Design), starter link to `/create/card?template=`.
| # | Page | Owner | Dependency | Start |
|---|---|---|---|---|
| 1 | Christmas card | Growth draft, Shop eng route | Template route + Design art | Draft NOW, ship BLOCKED |
| 2 | Christmas book gift | same | Book sample (fictional) | Draft NOW |
| 3 | Hanukkah card | same | Design art | Draft NOW |
| 4 | Thanksgiving thank-you | same | none | Draft NOW |
| 5 | Birthday card for Mom | same | none | Draft NOW |
| 6 | Grandma and kids book gift | same | none | Draft NOW |
| 7 | New baby book | same | none | Draft NOW |
| 8 | Valentine's card | same | Must be indexed by early Dec (PLAN) | Draft NOW |
| 9 | Mother's Day card and book | same | Indexed by Dec/Jan | Draft NOW |
| 10 | Sympathy card (SEO only, no remarketing, careful tone) | Growth + CX review | Owner tone sign-off | Draft NOW |
| 11 | Teacher thank-you | same | none | Draft NOW |
| 12 | Hub `/occasions` plus relationship hub (mom, dad, grandma) | Shop eng | pages 1-11 | BLOCKED |
Pages 13-24 (Father's Day, graduation, anniversary, get well, wedding, Grandparents' Day, new year, Easter, back to school, retirement, pet, friendship): S each, draft after the first 12 prove out. Wait for Search Console data.

### 2b. Guides and blog (8 planned). Each M.
what to write in a sympathy card; Christmas card wording; when to mail Christmas cards (cut-off dates need printer data, BLOCKED on CTO); Mother's Day message ideas; birthday message for Mom; how to make a personalized picture book gift; how to write a thank-you note to a teacher; new baby gift ideas. Owner Growth. NOW except the cut-off guide. Needs a `/guides/[slug]` route (Shop eng, M).

### 2c. Comparison pages (S-M each, Growth + Market intel)
GreetHub vs Shutterfly/Minted/Wonderbly-style personalized books, "custom picture book vs template book". BLOCKED: Market intel prices are dated (Minted $2.28 is Nov 2022); PLAN says no public price comparison until refresh (Oct 22), and legal should check comparative-claim wording (attorney brief). Draft feature-only versions NOW, no prices.

### 2d. Technical SEO
| Item | Size | Owner | Start |
|---|---|---|---|
| Buy domain, set NEXT_PUBLIC_SITE_URL | S | Owner | Blocks all indexing clocks |
| Search Console + sitemap submit (launch day) | S | Owner | BLOCKED on domain |
| JSON-LD: Product, FAQPage, Organization, Breadcrumb (none exist) | M | Shop eng; Growth spec | NOW |
| Add each new page to INDEXABLE_PATHS; sitemap lastmod | S | Shop eng | per page |
| Internal linking: footer occasion links, /browse to occasion pages (browse filters in client state, no URLs) | M | Shop eng + Growth map | NOW |
| Server-render creator landing text (crawler sees little) | M | Book/Card eng | NOW |
| Remove `[PLACEHOLDER]` text and draft banners (indexing gate) | S | Owner/CMO | NOW |
| `/e/` noindex, disallowed in robots (photo events) | S | Shop eng | when built |
| Core Web Vitals check on live domain | S | DevOps | BLOCKED on domain |
| Rank tracking sheet + SEO KPIs in dashboard | S | Data | NOW |

### 2e. Keyword list status
Core cards/books: NOT STARTED. Need: Keyword Planner export (owner, US, 12 months) for ~60 terms, then rank by volume x intent x template exists. I can prepare the term list NOW (S). Photo-events list exists, volumes mostly NOT FOUND. CSV SEO row (CPC $0.35, CAC $33) is all GUESS.

### 2f. Emails (nothing marketing exists; Resend adapter and 6 transactional templates do)
Consent column: T = transactional, no promotion allowed in body (else becomes commercial, legal/03 s7). M = marketing, needs opt-in stored with timestamp and source, postal address (owner ask, still open), working unsubscribe, one-click header, separate sending subdomain warmed first. Shop eng must add: marketing_consent field, suppression list, unsubscribe endpoint (M-L, BLOCKS every M email).

| Email | Trigger | Timing | Consent | Size | Owner | Start |
|---|---|---|---|---|---|---|
| Magic link, delete confirm, account deleted | exist | instant | T | done | Shop eng | live |
| Order confirmed, shipped | exist | instant / on tracking | T | done (Growth copy review S) | Shop eng | live |
| Proof ready | proof generated | instant | T, no promo | S | Shop eng + Growth copy | NOW |
| Delivered | carrier delivered | day 0 | T | S | Shop eng | BLOCKED tracking webhook |
| Welcome (3-part: your preview, re-rolls, occasion reminders) | guest makes preview + opts in | 0, +2d, +7d | M | M | Growth draft, Eng wire | Draft NOW, send BLOCKED consent |
| Draft saved | draft saved, not purchased | +1h, once | M if promo; T-like only if purely "your link" (attorney view) | S | Growth | Draft NOW |
| Abandoned cart | cart with items, no checkout | +4h, +2d, stop at 2 | M (opt-in captured at account) | S | Growth + Eng | BLOCKED consent + cart events (Data) |
| Post-purchase "how was it" + make another | delivered | +7d / +30d | M | S | Growth | BLOCKED consent |
| Review / testimonial ask | delivered | +10d | M; any child photo or name needs signed release | S | Growth + Customer research | BLOCKED consent + release form |
| Birthday / occasion reminder | saved date | 14 days before | M, explicit opt-in per date | M | Growth + Eng | BLOCKED reminder feature (later step) |
| Reorder reminder | prior order anniversary | 11 months | M | S | Growth | BLOCKED consent |
| Seasonal sends (Valentine's, Mother's Day, Father's Day, Christmas cut-off x3) | calendar | per CMO table; dates from order-by config, never hand-typed | M | S each, M for set | Growth | Draft NOW, send BLOCKED printer cut-offs |
| Win-back | no order 6 and 12 months | +180d, +365d, then stop | M | S | Growth | BLOCKED consent; after launch +6 months |
| Waitlist launch note | launch | once | M (waitlist opt-in wording) | S | Growth | Draft NOW; BLOCKED waitlist exists |
| Deletion/photo-purge notice (90-day) | purge date | -7d | T | S | Privacy ops + Eng | Not Growth, flagged |

Never emailed as marketing: guest-list / RSVP addresses and address books. Sympathy buyers: no remarketing.

## 3. 30-day order of work (Oct 15 to Nov 14; launch is invite-only soft launch)
Week 1 (Oct 15-21): term list of ~60 keywords for owner's Keyword Planner export; JSON-LD and internal-link spec for Shop eng; page template and first two drafts (Valentine's, Mother's Day, the two pages that need earliest indexing); email copy decks for proof ready, welcome, draft saved.
Week 2 (Oct 22-28): drafts for pages 1-6; /guides route request; consent and unsubscribe requirements doc to Shop eng and Data; Market intel price refresh then feature-only comparison draft.
Week 3 (Oct 29-Nov 4): pages 7-11 drafts; 4 guides drafted (sympathy, Christmas wording, Mother's Day, teacher); abandoned cart, post-purchase, review ask, reminder drafts; sympathy page to CX for tone review.
Week 4 (Nov 5-14): all 12 pages final copy with FAQs (Support); seasonal sequence for Valentine's and Mother's Day; rank-tracking sheet; re-rank pages against Keyword Planner data if it arrived; publish list to Shop eng once domain and gates clear.
Realistic outcome (GUESS): pages indexed by December; first meaningful organic visits Feb to May 2027; Christmas 2026 gets zero from search.

## 4. Decisions needed from the owner
1. Buy the domain this week (every ranking clock waits on it).
2. Export Keyword Planner data (US, 12 months) for the list I send, and verify Search Console on launch day.
3. Approve "12 pages first, then 12 more" over writing 24 thin pages now.
4. Marketing email: approve opt-in at signup/checkout (unticked box) plus waitlist, and supply a postal address or PO box for footers.
5. Approve building the consent field, suppression list and unsubscribe before any M email ships (Shop eng cost).
6. Sympathy page and guide: go or hold, and who reviews tone.
7. Comparison pages: ask the attorney whether naming competitors is acceptable; until then feature-only.
8. Release form and testimonial policy before any review ask or ad uses a customer or child.
9. Attorney view on whether "draft saved" and cart reminders count as transactional (my read: commercial, treat as M).
