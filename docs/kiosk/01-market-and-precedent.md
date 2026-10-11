# 01. Market and precedent

All pages read 2026-10-11 unless noted. Tags: [V] I fetched the primary page (the fetch tool summarises it, so re-check exact wording before quoting); [S] search snippet or secondary source; [U] unverified or my own inference. "Not found" means I looked, not that it does not exist. Several vendor pages blocked fetches (403) or said little; thin rows say so.

## 1. Who already does this

| Player | What it is | Evidence | Tag |
|---|---|---|---|
| **Scribbler + Fujifilm "Cardbored" kiosk** (UK, Ireland, Australia, NZ) | Touchscreen kiosk, 3,000+ designs, photo upload, custom inside message, 3D preview, chip-and-PIN payment (Worldpay, Windcave), multi-language, white-label software, prints on a Fujifilm CX3240 printer | https://www.fujifilm.com/uk/en/business/photofinishing/touchscreen-solutions/Cardbored (read 2026-10-11). Page gives no card size, envelope, price or deployment terms | [V] |
| Scribbler rollout | 12-month trial in 12 of its own stores, now rolling out to all 37; Primark trialling in two stores; store managers report about 3,000 extra cards each over the year; photo upload is 20% of cards made; a cheaper "Lite" kiosk exists | https://pgbuzz.net/scribblers-kiosk-expansion-plans (dated 2025-01-10, read 2026-10-11) | [V] |
| Scribbler pricing and terms | Suggested £3.49 a card or four for £9.99, stores set their own price; kiosk rentable at about £200 a month or buyable; one photo-shop owner averaging about £12.7k a year (about 3,650 cards) | Search snippet of https://betterretailing.com/greeting-card-kiosks-generating-13k-in-annual-sales (page returned 403 when fetched) | [S] |
| Scribbler Australia | Hardware about A$14,000, starter consumables about A$1,200, licence and wholesale card cost not visible to the author. Criticisms: card stock "less than ideal", only one size, kiosk cards feel inferior to rack cards, payment not yet integrated | https://www.newsagencyblog.com.au/2024/02/10/fujifilm-and-scribbler-unite-to-offer-card-kiosk-in-australia/ (2024-02-10) | [V] |
| **Card Isle** (US) | Kiosks at AAFES exchanges, post stores and malls; 25+ added from Dec 2017; 8,000+ card catalogue incl. selfie and photo cards; pick-up service for cards designed online. Company-level claim (from search summary): 50+ sites across hospitals, airports, military bases, universities, convenience stores, corporate campuses | https://www.vendingmarketwatch.com/home/news/12402972/card-isle-expands-fleet-of-greeting-card-kiosks-in-partnership-with-aafes (2018-03-15) [V]; the 50+ sites claim [S] | mixed |
| Card Isle today | Its site now says "design your cards; receive a pickup code; print at your local shop", lists "Premium True-Color Coated Linen Cardstock" and recycled envelopes, offers a "Printing Station"; no kiosk wording, no site count, copyright 2025 | https://www.cardisle.com | [V] |
| **Ink'd Greetings** (Phoenix, founded 2023) | Self-service kiosks that print cards on demand, each card with an attached digital gift card; locations and pricing not stated in the article | https://www.abc15.com/news/business/phoenix-startup-inkd-greetings-aims-to-disrupt-greeting-card-industry (about April 2024) | [V] |
| **CreataCard (American Greetings)**, **Hallmark** | CreataCard launched 1992, reportedly 10,000 kiosks by 1995; Hallmark and American Greetings fought over patents in the mid-1990s. I found no current information on whether either still runs in-store card kiosks | search results citing Christian Science Monitor 1994 and Case Western; patents US5513117A, USH1708 | [S] |
| Photo kiosks (Kodak, HP, Lucidiom, Mitsubishi) | Established photo-print kiosk industry. I found no revenue-share terms or per-print economics from these vendors in this pass | not found | not found |

Takeaway: the category exists and has survived 30 years, but the visible survivors are (a) a UK chain with its own stores and a large design catalogue, and (b) a US operator that appears to have shifted toward design-online, print-at-shop. Nobody I found sells AI-personalized art with saved People at a kiosk. That is either white space or a sign the economics do not work. P0 and P2 exist to find out which.

## 2. Hardware precedent: what the kiosk makers print on

- **Dye-sublimation photo printers** are the standard for instant photo kiosks. DNP DS620A: up to 400 prints an hour, about 8.3 seconds a 4x6, roughly 400 prints a roll, thermal head rated about 100,000 prints [S] (https://www.photographyblog.com/news/dnp_ds620a_dye_sublimation_photo_printer and listings, read 2026-10-11). B&H lists it at $995, $1,359 as a kit with wireless module and roll media [S, search snippet]. Dye-sub gives glossy photo output and few jams, but a flat print on photo paper, not a folded card.
- **Scribbler/Fujifilm** use a Fujifilm CX3240 printer inside the kiosk [V]. I could not confirm its print technology or price. Unit cost about A$14,000 all-in suggests a purpose-built cabinet [S].
- **Card Isle** advertises coated linen card stock [V], which implies a toner or inkjet engine on heavy stock. Printer model not found.

## 3. Deployment models seen

| Model | Seen where | Notes |
|---|---|---|
| Owned by the retailer (bought) | Scribbler own stores; Australia purchase at about A$14k [S] | Retailer carries capex and keeps margin |
| Rented/leased to the retailer | Scribbler about £200 a month [S] | Predictable for the operator, low barrier |
| Operator-owned, retailer hosts | Card Isle at AAFES (inferred from 2018 article, terms not stated) | Revenue-share terms not found in any source |
| Operator-owned, design online, print at shop | Card Isle today [V] | Printing Station at the shop, pick-up code |
| White-label software on partner hardware | Fujifilm Cardbored for any retailer, content provider selectable [V] | The licensing route open to GreetHub |

Revenue-share percentages: **not found**. This plan uses 15 to 35% of net sales as a labelled guess [U].

## 4. Known problems (from the sources above and general kiosk experience)

- Stock feels thin or cheap, and kiosk versions feel inferior to rack cards [V, Australia review].
- One size only; card selection drives repeat use [V].
- Payment not integrated in some markets; shop must be open for purchase [V].
- Seasonality: one store owner said demand varies with the season [S].
- Paper jams, ink/toner outages, vandalism and downtime for unattended machines: general kiosk experience, not sourced here [U]. Treat as the main operating cost driver.

## 5. Which venues fit

No source gave venue-level economics. The table is my judgment [U] except the Card Isle site list [S].

| Venue | What it wants | Fit for GreetHub |
|---|---|---|
| Gift shops and card stores | Margin per square foot, no inventory, cards to sell all year | Best fit; staff can help (Tier C), shelf is nearby |
| Grocery and drugstore | Impulse sales, small footprint, no staff time | Good volume potential, low price tolerance; Tier B or A |
| Hospitals (gift shop, lobby) | Get-well and new-baby cards on the spot, quiet, accessible, hygiene | Strong occasion fit; accessibility and privacy scrutiny high |
| Hotels, resorts | Guest amenity, souvenirs, "send a card from your trip" with mail-it-later | Moderate; low repeat, needs stamp/mail service |
| Airports | High footfall, high rent share, security and 24h service demands | Hard operationally; revenue-share demands high |
| University bookstores | Student birthdays, parents, graduation, thank-you season peaks | Good: young, phone-first users, seasonal peaks |
| Event venues, weddings, conferences | Branded cards as an activation | Better as a rented, assisted unit than a fixed kiosk |
| Malls | Foot traffic, gifting seasons | Mixed; kiosk competes with card shops there |

Seasonality (Valentine's, Mother's Day, Christmas, graduation) will concentrate sales; the 5 cards a day base case is an annual average [U].

## 6. What this means for the plan

- Price anchor: premium rack cards are about $5 to $8 (`finance/README.md`). A kiosk card at $6.99 with envelope sits at the top of that range; Scribbler's suggested £3.49 is lower, with a thinner stock [S, V]. This plan models $5.99 to $7.99.
- Throughput anchor: about 8 to 10 cards a day per site is what the best Scribbler references imply [S, V]. This plan's base is 5 a day, low 2, high 10.
- The bar for card quality is "better than the rack card". Stock and fold quality are the first things reviewers criticised.
