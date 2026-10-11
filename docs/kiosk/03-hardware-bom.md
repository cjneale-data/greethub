# 03. Hardware bill of materials

Prices are planning ranges in USD. Most are my estimates [U] because component pricing for a custom kiosk is mostly quote-only. Tagged [S] where a retailer or vendor listing was seen on 2026-10-11 (search results; listings change). Columns are quantity tiers: **1 unit / 10 units / 100 units** (unit prices include a 5% spares allowance in the totals). "O" = off-the-shelf, "C" = custom or semi-custom engineered, "L" = labor.

## 1. Tier A: tabletop dye-sub

| Part | Type | 1 | 10 | 100 | Notes |
|---|---|---:|---:|---:|---|
| Tablet 10-12 in, kiosk mode | O | 520 | 480 | 420 | iPad or Android; consumer tablets are not rated for 24/7, expect replacement |
| Dye-sub printer, 5x7 capable (DNP DS620A class) | O | 1,050 | 995 | 900 | $995 at B&H, $1,359 as a kit [S]; about 8.3 s a 4x6, 400 prints a roll, head rated about 100k prints [S] |
| Stand, printer shroud, locks | C | 700 | 380 | 220 | |
| Card reader (Stripe S700 class) | O | 299 | 299 | 280 | $299 after a Feb 2026 price cut [S] https://pricingsaas.com/companies/stripe/diffs/2026W09 |
| Networking (wifi, optional LTE dongle) | O | 120 | 100 | 80 | |
| Power, surge, cabling | O | 40 | 40 | 30 | |
| Envelope tray, signage | C | 110 | 70 | 45 | |
| Assembly, burn-in | L | 300 | 120 | 50 | |
| Shipping, crating | L | 150 | 90 | 50 | |
| **Total incl 5% spares** | | **3,453** | **2,703** | **2,179** | Range at 10 units: $1.9k to $3.9k |

## 2. Tier B: freestanding kiosk

| Part | Type | 1 | 10 | 100 | Notes |
|---|---|---:|---:|---:|---|
| Touchscreen 21.5 in commercial capacitive | O | 780 | 650 | 480 | Sunlight-readable not needed indoors; glass thickness and vandal resistance extra |
| Mini PC, N100 class, SSD, TPM | O | 300 | 250 | 190 | Fanless preferred |
| Printer engine: commercial duplex colour laser or pigment inkjet | O | 1,700 | 1,500 | 1,200 | Ranges: pro pigment inkjet Epson SureColor P900 about $1,099 to $1,395 [S] (not duplex); Canon Pro-200 about $0.16 to $0.29 ink per 5x7 [S]; office duplex laser about $400 to $900 [U]; commercial small-office laser $1.5k to $4k [U]. Choose in P0 |
| Card-stock feed adaptation (10x7 pre-scored blanks, 200-sheet cassette) | C | 1,200 | 600 | 350 | Standard trays do not take 10x7 stock |
| Automatic fold module | C | 2,500 | 1,200 | 700 | Biggest custom risk. Pre-scored stock reduces force |
| Envelope dispenser | C | 2,400 | 1,500 | 900 | Stack pick or vending-style slot |
| Freestanding steel enclosure with service doors, ADA layout | C | 6,000 | 3,000 | 1,300 | Soft tooling or laser-cut sheet metal at low volume |
| Cooling, filters, dust seals | O | 200 | 150 | 100 | Paper dust is the enemy |
| Security: locks, tamper switch, floor anchor | C | 300 | 200 | 150 | |
| Unattended payment reader (Verifone UX700 class) | O | 650 | 550 | 500 | **Price not found.** Stripe tiers it "Smart Advanced" [V]; $299 is the S700/S710 price [S]. Ask Stripe sales |
| LTE router, wifi, antennas | O | 450 | 350 | 280 | Plus $25 to $40 a month data [U] |
| UPS and remote-reboot PDU | O | 350 | 300 | 200 | |
| Sensors: door, stock level, jam, temperature | C | 150 | 100 | 70 | |
| Accessibility: audio jack, headphones, tactile controls | C | 300 | 150 | 150 | |
| Assembly, calibration, burn-in | L | 2,400 | 600 | 350 | Includes colour profile creation per unit |
| Shipping, crating, install kit | L | 500 | 300 | 250 | |
| **Total incl 5% spares** | | **21,189** | **11,970** | **7,528** | Range at 10 units: $8.6k to $17.4k. Scribbler Australia's hardware at about A$14,000 [S] is in the same neighborhood |

## 3. Tier C: countertop assisted unit

| Part | Type | 1 | 10 | 100 |
|---|---|---:|---:|---:|
| Tablet and stand | O | 520 | 480 | 420 |
| Counter printer (Fujifilm CX3240 class or pro inkjet; price **not found**) | O | 3,200 | 2,800 | 2,300 |
| Trimmer, crease and fold tool | O | 450 | 300 | 220 |
| Card reader (optional) | O | 0 | 0 | 0 |
| Wifi | O | 100 | 100 | 80 |
| Countertop shroud, lock | C | 700 | 350 | 200 |
| Stock and envelope trays, signage | C | 150 | 100 | 60 |
| Assembly, burn-in | L | 300 | 120 | 50 |
| Shipping | L | 150 | 90 | 50 |
| **Total incl 5% spares** | | **5,848** | **4,557** | **3,549** |

## 4. Choosing the print engine (the P0 test)

| Engine | Pros | Cons | Consumable per card (see section 5) |
|---|---|---|---|
| **Dye-sub** (DNP class) | Photo quality, few jams, fast (8 s per 4x6 [S]), proven in retail kiosks | Flat photo paper only, no fold, proprietary media, single-sided | $0.35 to $0.60 per 5x7 [U] |
| **Pigment inkjet** (Canon/Epson pro) | Best colour on matte card, 5x7 ink about $0.16 to $0.29 [S] | Slow on heavy stock, ink dry time on duplex, clogging if idle, borderless on custom sizes uncertain | about $0.30 to $0.60 per 10x7 duplex sheet [U] |
| **Colour laser** (office or commercial) | Fast duplex, cheap per page, dry output that folds without cracking if stock is right, no clogging | Colour accuracy and gloss on smooth art are weaker; fuser heat and curl on heavy stock; duplex registration drift; media limit often 216 to 300 gsm [U] | $0.05 to $0.14 toner [U] |
| **Thermal** (Zink, receipt) | Not suitable: small, low quality | | |

My expectation, to be tested [U]: laser for Tier B (cost, duplex, fold-friendly), dye-sub for Tier A (reliability), pro inkjet for Tier C (quality, staff available to watch it).

Card stock: 5x7 folded is 10x7 flat. 216 gsm (80 lb cover) is the usual weight that folds cleanly when pre-scored; a lighter stock reads as cheap (the Scribbler Australia complaint [V]). Pre-cut, pre-scored A7 blanks and A7 envelopes are standard paper products [U]. Source pricing in P0.

## 5. Consumables per card (USD, low / base / high, all [U])

| | Tier A | Tier B | Tier C |
|---|---|---|---|
| Card media or blank | 0.35 / 0.45 / 0.60 (dye-sub print) | 0.12 / 0.20 / 0.30 | 0.15 / 0.25 / 0.35 |
| Toner or ink | in media | 0.05 / 0.09 / 0.14 | 0.06 / 0.12 / 0.18 |
| Envelope | 0.05 / 0.08 / 0.12 | 0.05 / 0.08 / 0.12 | 0.05 / 0.08 / 0.12 |
| Waste allowance (jams, rejects, test prints) | 2% / 3% / 6% | 4% / 8% / 15% | 3% / 6% / 12% |
| **Total per card** | **0.41 / 0.55 / 0.76** | **0.23 / 0.40 / 0.64** | **0.27 / 0.48 / 0.73** |

Model cost per card is separate (05).

## 6. Maintenance and service intervals (Tier B, estimates [U])

| Item | Interval | Notes |
|---|---|---|
| Restock cards and envelopes | 200 cards: about 40 days at 5 a day, 20 days at 10 | Low-stock sensor alerts service at 20% |
| Toner or ink | Per supplier yield; check each restock | |
| Clean paper path, rollers, filters | Every 2 to 4 weeks | Pick rollers wear: replace every 10k to 30k sheets [U] |
| Fuser or head replacement | Per printer duty rating; plan one inspection a year | |
| Touchscreen clean, security check | Each visit | |
| Spares kit on the road | 2 cassettes, rollers, one PSU, one spare reader | |

Base service plan: 1.3 visits a month per Tier B kiosk at about $100 a visit [U]. Tier A and C use retailer staff to restock; field service only on faults.

## 7. Biggest engineering risks

1. **Paper handling.** 216 gsm blanks, humidity curl, duplex registration, double feeds. Mitigation: pre-scored blanks, stock-specific profiles, mechanical test rig with 5,000 cycles before a single site is installed.
2. **Automatic folding** to a crease that does not crack toner and lands square. Mitigation: pre-scored stock, slow fold, fall-back "flat card with fold line" mode (customer folds). Gate P1 on a fold yield target.
3. **Envelope dispensing** (feeding thin A7 envelopes reliably is a classic vending problem [U]).
4. **Colour accuracy.** Illustrations are generated in sRGB; the printer renders in its own gamut. Mitigation: per-unit ICC profile at assembly, soft proof, a "kiosk-safe" colour check on the style library, and a physical comparison to the online printers' output.
5. **Print speed.** Customer tolerance for waiting at a kiosk after paying is about 30 to 60 seconds [U]. Dye-sub is quickest; laser duplex 20 to 40 seconds; plus fold.
6. **Tamper resistance and vandalism.** Locks, tamper switches, and an unattended-payment enclosure that meets the reader maker's mounting rules.
7. **Thermal and dust** in a closed steel cabinet with a printer that makes heat and paper dust.
8. **Component end-of-life.** Printer models and readers get discontinued (the Stripe WisePOS E is reported to retire in early 2027 [S]). Design for a swappable printer bay.

## 8. Off-the-shelf versus custom

Only about a third of Tier B cost at 10 units is off-the-shelf (screen, PC, printer, reader, network, UPS, cooling); about 56% is custom (enclosure, feed, fold, envelope, security, sensors, accessibility) and the rest is labor. The custom work is the enclosure, stock feed, fold, envelope dispense, security and sensors. A hardware contractor with kiosk or vending experience is required for P1 and P3. Tier A and C are almost entirely off-the-shelf and can be assembled by one technician.
