# 07. R&D program and costs

All costs in USD, estimates [U] unless tagged. Everything here is reproduced in `financial-inputs.csv` (built by one script so the totals tie). Month 1 is the month the owner approves P0; the online launch is planned for Nov 2026 (`finance/README.md`), so the calendar mapping is the CFO's choice (suggest M1 = Jan 2027). **2026-10-13:** in finance workbook v3, month 1 is the launch month (Nov 2026) and the kiosk schedule is shifted 6 months (P0 M7-M9, G0 M10, P1 M11-M15, P2 M17-M22, P3 M24-M29, P4 M31-M42, fleet plan 6 months later); G0 defaults to 0. The phase tables below keep the original program-month numbering.

## 1. Assumptions

- **Blended daily rate:** engineering, design and project management at **$850 / $1,000 / $1,200 per 8-hour day** (low / base / high) for contractors [U]; field service at **$450 / $600 / $750 per day** [U]. Owner time is not priced.
- **Scope multiplier on person-days:** 0.7 low (off-the-shelf only), 1.0 base, 1.5 high (full custom folding and envelope automation, plus rework).
- **Contingency:** 10 to 20% (P0), 15 to 30% on later phases, rising with hardware content.
- **Team (contractors, no hires):** 1 senior full-stack engineer (kiosk app, agent, Stripe Terminal, device management), 1 UX/design resource (kiosk screens, accessibility, template pack art direction), 1 industrial designer (enclosure, ergonomics), 1 mechanical engineer with kiosk or vending experience (feed, fold, envelope), 1 electronics/firmware contractor (sensors, PDU, fold motor control), 1 QA/test, 1 part-time PM (the Kiosk Program Lead role), field service technicians (P2 on), plus legal and compliance vendors. CTO time for the Supabase and ledger prerequisites is counted in the main plan, not here.
- Fleet hardware (units for sale or placement at scale, from P3's first batch on) is **capex outside the R&D total**, shown separately.

## 2. Phases

### S0 Evidence before spend (after launch, before P0; added 2026-10-13)

- **Scope:** no hardware, no contractors, no retailer commitments. (a) From the live online store: printed-card orders a month, reprint and complaint rate on Prodigi 5x7 cards, printed versus digital share, and how many card buyers make a second card. (b) A paper check: the owner orders 5 printed cards through the normal flow (about $55 at list price) and 3 people compare them blind against 2 rack cards. (c) Refresh the operator research (Scribbler/Fujifilm, Card Isle) and whether they license software. (d) Only if the owner chooses: informal talks with up to 3 hosts the owner already knows; no terms offered.
- **Cost:** owner and agent time, about $100 to $500 cash. Not in the workbook (immaterial).
- **Start gate S0 (to begin P0), all must hold:**
  1. The online store has sold printed cards for at least 3 months and at least 150 printed cards in total [U threshold], with complaints or reprints under 5%.
  2. Cash: P0's $35k base is funded on top of the CFO's peak funding need, or the business has had 3 consecutive months of positive contribution after marketing.
  3. Platform: Supabase store and auth (SEC-18), durable spend ledger (SEC-10), hosted job queue (SEC-21), the signed-in card path with approval and card print PDF, and a print path that uses the approved message verbatim, all live in production.
  4. Interest: one host the owner knows would take a free pilot, or one operator agrees to a licence call.
  5. The owner approves P0 in writing (budget and dates).

### P0 Concept validation (M1 to M3)

- **Scope:** borrowed tablet; one dye-sub printer (about $1k [S]), one colour laser (about $0.5k to $1k [U]) and one pigment inkjet (about $0.6k to $1.4k [S]) bought for the test; sample stock (216 gsm pre-scored blanks, envelopes) from three suppliers; a Stripe S700 reader ($299 [S]) for the payment test; a `/kiosk` prototype of the Quick pick and Make it yours paths running on the existing app in a dev environment (reuse, no new product code beyond a stub); print test matrix (stock x engine x fold x colour), 20 to 30 observed users at a friendly venue, 20 retailer conversations including licence talks with an operator.
- **Person-days (base):** 12 software, 6 UX/design, 8 print/hardware test = 26 days; owner time extra.
- **Cost:** low / base / high **$20k / $35k / $66k** (labor $15k / $26k / $47k, hardware $2.5k / $3.5k / $5k, test incentives $0.3k / $0.6k / $1k, legal $0 / $0 / $2k, contingency 10 / 15 / 20%).
- **Certification:** none.
- **Gate G0 (M4), all must pass:**
  1. Print: at least 8 of 10 cards fold and read as "better than a rack card" in a blind comparison with three testers; the fold-and-colour test picks a viable engine for Tier B and Tier A.
  2. Demand: at the $6.99 target, at least 30% of 20+ observed users say they would buy (stated intent only, weak evidence) and at least 3 retailers agree to host a free pilot; at least 1 operator is open to a licence discussion.
  3. Online: the web business has at least 6 months of data and is not in crisis (I recommend this gate, not the owner's necessarily). Reachable only if P0 starts after launch, which the 2026-10-13 schedule now does.
  4. Legal: the attorney has no blocking objection to unattended sales with AI-printed content.

### P1 Pilot prototype (M5 to M9)

- **Scope:** kiosk app and agent; Stripe Terminal integration; account link and phone handoff; template pack of 60 to 120 pre-generated fronts; imposition and print job format; privacy wipe; accessibility pass; telemetry and device management; **two Tier A/C pilot units** assembled from off-the-shelf parts plus a **Tier B bench rig** to prove or kill the feed, fold and envelope mechanisms (not a full cabinet). Mechanical feasibility gate on fold yield.
- **Person-days (base):** 85 software and integration, 20 UX/ADA, 15 industrial design, 25 mechanical, 10 electronics/firmware, 12 QA, 10 PM, 10 content/art direction = **187 days**.
- **Hardware and tooling:** prototypes $7k / $19k / $50k, rapid fabrication $2k / $15k / $35k, pre-compliance testing $0 / $4k / $8k, model spend for the template pack about $0.1k to $0.6k.
- **Cost:** **$138k / $270k / $538k** (labor $111k / $187k / $337k, contingency 15 / 20 / 25%).
- **Decision gate G1 (M10):** pilot units run 500 test prints at 97% first-time success; kiosk routes capped and rate-limited per device token, not per IP (a store's shared IP would hit the web's 5-previews-per-10-minutes limit, and wiped cookies reset the guest cap every session); fold yield at least 95% on the bench rig or Tier B is deferred; accessibility reviewer sign-off on screens; CTO security review of link, device token and spend caps passes; 3 sites signed.

### P2 Field pilot at 1 to 3 sites (M11 to M16)

- **Scope:** place 3 pilot units (Tier A/C hybrids, or one Tier B rev-0 only if G1 allows) at 1 to 3 hosts; 6 months total including the build, install and a peak; remote support and weekly metrics; two software releases; location agreement and insurance; pilot report.
- **Person-days (base):** 40 software, 15 analytics/support, 12 PM, 10 ID/mech = **77 days**, plus **36 field service days**.
- **Hardware and operations:** pilot units $10.5k / $15k / $36k, pilot operating costs (connectivity, insurance share, consumables, payment fees, signage, travel) $4.5k / $7.2k / $11.7k (about $250 / $400 / $650 per site-month for 18 site-months), field evaluation labels $0 / $7.5k / $18k, legal $6k / $12k / $25k, insurance setup and other $2k / $4.2k / $9k.
- **Cost:** **$92k / $173k / $349k** (labor $57k / $99k / $179k, contingency 15 / 20 / 25%).
- **Decision gate G2 (M17):** the success metrics in 05 section 5: at least 5 cards a day per site, 15% account link, 97% print success, 2 of 3 hosts continue on a paid term, model cost per card at most $0.35, no content incidents. Failing G2 stops hardware; licence track continues.

### P3 Productized small batch (M18 to M23)

- **Scope:** Tier B design for manufacture: enclosure with ADA layout, tamper protection, fold and envelope modules productized from the P1 bench rig, service manual and spares kit, NRTL listing and FCC, PCI documentation, the first batch of **10 units** (fleet capex, not in R&D), supplier setup and incoming inspection, field service training, retailer onboarding kit.
- **Person-days (base):** 55 mechanical, 20 industrial design, 30 electronics/firmware, 45 software, 20 QA/compliance, 20 PM, 10 service documentation = **200 days**.
- **Non-labor:** certification (UL/ETL and FCC) **$12k / $30k / $60k**, tooling and fixtures **$15k / $45k / $110k** (sheet metal soft tooling, jigs, packaging), legal $8k / $15k / $30k (location agreement, privacy, ADA, IP), other (supplier setup, spares, insurance) $8k / $16k / $30k.
- **Cost:** **$186k / $367k / $767k** (labor $119k / $200k / $360k, contingency 15 / 20 / 30%).
- **Decision gate G3 (M24):** 10-unit batch passes burn-in; certification complete; unit cost at 10 units within the range in 03 ($8.6k / $12.0k / $17.4k); at least 10 placement commitments signed (the scale-up trigger); cash for 50-unit order available.

### P4 Scale (M25 to M36)

- **Scope:** fleet of 13, growing to 100 units by M36 in the base plan; sustaining engineering (software, hardware revisions, supplier changes), fleet operations tooling, field-service network with contractors, retailer expansion, certification updates.
- **Person-days (base):** 70 software, 30 hardware, 60 PM/operations = **160 days**.
- **Non-labor:** tooling (volume tooling and fixtures) $10k / $40k / $100k, legal $3k / $8k / $20k, certs $0 / $5k / $15k.
- **Cost:** **$124k / $256k / $529k**.
- Fleet operations costs (service visits, connectivity, insurance, parts) are **operating** cost per kiosk in 05 and the CSV, not R&D.

## 3. Totals (R&D, P0 to P4)

| | Person-days (base) | Low | Base | High |
|---|---:|---:|---:|---:|
| P0 Concept validation | 26 | 20,097 | 34,615 | 65,760 |
| P1 Pilot prototype | 187 | 138,420 | 270,360 | 537,750 |
| P2 Field pilot | 77 + 36 field | 92,178 | 173,400 | 348,500 |
| P3 Productized small batch | 200 | 186,300 | 367,200 | 767,000 |
| P4 Scale (sustaining R&D) | 160 | 124,430 | 255,600 | 528,750 |
| **Total** | **650 + 36 field** | **561,425** | **1,101,175** | **2,247,760** |
| Money at risk before demand evidence (P0 + P1 + P2) | | 250,695 | 478,375 | 952,010 |
| Fleet capex in the base plan through M36 (10-unit batch at M23, then 90 more) | | | 939,015 | |

Low = off-the-shelf tiers only (no custom fold or envelope), High = full custom automation and rework. A staged decision caps exposure: after P0 the cash at risk is $35k; after G1, about $0.3M.

## 4. Per-unit hardware cost at 1, 10 and 100 units (from 03)

| Tier | 1 unit | 10 units | 100 units | Range at 10 (low / high) |
|---|---:|---:|---:|---|
| A tabletop dye-sub | 3,453 | 2,703 | 2,179 | 1.9k / 3.9k |
| B freestanding | 21,189 | 11,970 | 7,528 | 8.6k / 17.4k |
| C counter assisted | 5,848 | 4,557 | 3,549 | 3.3k / 6.6k |

Single-unit costs include one-off labor for assembly and calibration. Engineering (NRE) is in the phase costs, not in these unit costs.

## 5. Monthly cash profile, 36 months

R&D only (labor and non-labor, with prototype hardware in the second month of its phase, certification and tooling in the last two months, contingency spread). Gate months have no spend. Fleet capex and operating contribution are base-case revenue and cost assumptions from 05 (3 pilot units live from M13, 13 at M24, 100 at M36).

| Month | Phase | Low | Base | High | Units live | Base fleet capex | Base op. contribution |
|---|---|---:|---:|---:|---:|---:|---:|
| M01 | P0 | 5,622 | 9,770 | 18,792 | 0 | 0 | 0 |
| M02 | P0 | 8,579 | 14,398 | 26,532 | 0 | 0 | 0 |
| M03 | P0 | 5,896 | 10,447 | 20,436 | 0 | 0 | 0 |
| M04 | gate | 0 | 0 | 0 | 0 | 0 | 0 |
| M05 | P1 | 24,440 | 42,867 | 80,346 | 0 | 0 | 0 |
| M06 | P1 | 33,245 | 66,373 | 141,101 | 0 | 0 | 0 |
| M07 | P1 | 24,440 | 42,867 | 80,346 | 0 | 0 | 0 |
| M08 | P1 | 28,148 | 59,126 | 117,978 | 0 | 0 | 0 |
| M09 | P1 | 28,148 | 59,126 | 117,978 | 0 | 0 | 0 |
| M10 | gate | 0 | 0 | 0 | 0 | 0 | 0 |
| M11 | P2 | 12,811 | 23,223 | 44,437 | 0 | 0 | 0 |
| M12 | P2 | 24,514 | 41,113 | 87,407 | 0 | 0 | 0 |
| M13 | P2 | 12,811 | 23,223 | 44,437 | 3 | 0 | 419 |
| M14 | P2 | 12,811 | 23,223 | 44,437 | 3 | 0 | 419 |
| M15 | P2 | 14,615 | 31,308 | 63,892 | 3 | 0 | 419 |
| M16 | P2 | 14,615 | 31,308 | 63,892 | 3 | 0 | 419 |
| M17 | gate | 0 | 0 | 0 | 3 | 0 | 1,222 |
| M18 | P3 | 24,930 | 44,620 | 87,700 | 3 | 0 | 1,222 |
| M19 | P3 | 27,360 | 50,740 | 105,400 | 3 | 0 | 1,222 |
| M20 | P3 | 24,930 | 44,620 | 87,700 | 3 | 0 | 1,222 |
| M21 | P3 | 24,930 | 44,620 | 87,700 | 3 | 0 | 1,222 |
| M22 | P3 | 42,075 | 91,300 | 199,250 | 3 | 0 | 1,222 |
| M23 | P3 | 42,075 | 91,300 | 199,250 | 3 | 0 | 1,222 |
| M24 | gate | 0 | 0 | 0 | 13 | 119,700 | 5,297 |
| M25 | P4 | 8,995 | 16,130 | 30,954 | 13 | 0 | 5,297 |
| M26 | P4 | 10,618 | 20,390 | 41,529 | 19 | 71,820 | 7,741 |
| M27 | P4 | 8,995 | 16,130 | 30,954 | 25 | 71,820 | 10,186 |
| M28 | P4 | 8,995 | 16,130 | 30,954 | 33 | 95,760 | 13,445 |
| M29 | P4 | 8,995 | 16,130 | 30,954 | 42 | 107,730 | 17,112 |
| M30 | P4 | 8,995 | 16,130 | 30,954 | 50 | 95,760 | 20,372 |
| M31 | P4 | 8,995 | 16,130 | 30,954 | 58 | 60,228 | 23,631 |
| M32 | P4 | 8,995 | 16,130 | 30,954 | 67 | 67,756 | 27,298 |
| M33 | P4 | 8,995 | 16,130 | 30,954 | 75 | 60,228 | 30,558 |
| M34 | P4 | 8,995 | 16,130 | 30,954 | 83 | 60,228 | 33,817 |
| M35 | P4 | 16,429 | 45,020 | 104,317 | 92 | 67,756 | 37,484 |
| M36 | P4 | 16,429 | 45,020 | 104,317 | 100 | 60,228 | 40,743 |

Cumulative cash at M36 (R&D + fleet capex - operating contribution), CSV rows `cum_cash_36m_baseRD`:

| Revenue case (with base R&D) | M36 cumulative | Deepest point |
|---|---:|---:|
| Bad (2 cards/day, $5.99, 35% share) | -$2.28M | -$2.28M |
| Base (5 cards/day, $6.99, 25% share) | -$1.76M | -$1.76M |
| Good (10 cards/day, $7.99, 15% share) | -$0.80M | -$1.11M |

Run rate at M36 (base): 100 kiosks, about $106k revenue and $41k operating contribution a month.

## 6. Risks to the plan

1. A mechanism that works on the bench and not in the field (humidity, dust, restocking by amateurs).
2. Certification iterations (each re-test is weeks and thousands).
3. Component discontinuation (printers, readers).
4. Retailer decision cycles longer than the schedule.
5. The online business changes priorities and CTO capacity (the kiosk depends on Supabase auth, the ledger and security fixes).
6. Seasonality distorting pilot metrics.

## 7. Sequence and what is shared with the online plan

Prerequisites from the main plan, not costed here: Supabase auth, DB-backed spend ledger and quotas (security R1 to R5), moderation and IP safety in production, the 90-day purge, trademark clearance. If they slip, the kiosk slips.

## 8. What must be true for the kiosk to be worth building versus selling cards online only

Online only is almost free to extend (no hardware, no host share). The kiosk is worth it only if at least one of these holds at the gate, with evidence:

1. **Volume:** sustained 8 or more cards a day per kiosk at about $7, with a path to 100 or more kiosks (base contribution $4.40 a card, $262 a month fixed per kiosk: 8 a day yields about $81k a month at 100 kiosks, about $970k a year, enough to repay base R&D plus fleet capex in roughly 2 to 3 years after reaching 100 units).
2. **Cheaper program:** R&D near the low case ($0.56M) by using Tier A/C off-the-shelf units, or partner co-funding of hardware.
3. **Licensing:** an operator pays for the brain (Tier D); this makes the kiosk a software line with near-zero hardware risk.
4. **Acquisition value:** kiosk buyers who join GreetHub cost less than the online paid CAC (about $70 in v3; avoided CAC counts only if paid spend is actually cut, so value a sign-up at about $11 of repeat contribution [U]) and reorder online; the pilot must measure the signup rate and the 90-day reorder.
5. **Retail terms:** host share at or below 25% of net sales, no placement fees.
6. **Quality:** card stock and fold judged better than a rack card in blind tests (the Scribbler criticism).

If none hold after G2, stop and keep the online product.

