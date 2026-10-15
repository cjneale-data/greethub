# Do in-store holiday photo cards fit the kiosk concept?

Owner: Kiosk Program Lead. Written 2026-10-15 for wave 1 of `docs/products/photo-cards-and-events-plan.md` (section 8). Research only: no hardware, no spend, no retailer contact. Tags as in the rest of this folder: [V] primary page fetched, [S] search snippet or secondary source, [U] my estimate or inference. Web sources read 2026-10-15; list at the end.

## Short answer

**No, not as a kiosk product, and not before Holiday 2028 at the earliest.** In-store holiday photo cards are a mature, very cheap, already-solved US retail category (Walmart, CVS, Walgreens: phone transfer, same-day pickup, often under $1.50 a card). A GreetHub kiosk would sell the same flat photo print at several times the price, would need photos of children on a public machine (which this folder ruled out for v1), and would tie up the machine for many minutes per order. The useful overlap is narrower: **the kiosk can sell a photo-card order that the customer finishes on their own phone and that ships**, with no photos ever touching the kiosk. That costs almost nothing extra if a kiosk exists for single cards, and it should be judged on single-card evidence, not built for photo cards.

## 1. What the plan asks for versus what a kiosk does

| Photo-card need (plan sections 3 and 4) | Kiosk concept as written (02, 03, 04) | Fit |
|---|---|---|
| 1 to 4 customer photos front, up to 6 back | No photo upload, no camera, saved People only (02 section 7, 06) | **Conflict** |
| Batches of 10 to 200 identical cards | One card per sale, 30 to 60 s wait tolerance (03 point 5) | **Conflict** |
| Flat 5x7, often double-sided | Tier A dye-sub prints flat 5x7, single-sided only (03 section 4) | Partial: front only |
| Envelopes always included, addressing, mail-for-me | Loose envelope tray; mail-it-later only via phone hand-off | Weak |
| Hard December order-by date, proof checker, forced full-size proof | Short public session, guest data held 24 h | Weak: a typo on 100 cards is reviewed best at home |
| Privacy: consent tick for children, 90-day purge | Kiosk keeps no photos and only text for one session | **Conflict** unless photos stay on the phone |

## 2. Phone-to-kiosk photo transfer

How the incumbents do it: Kodak Moments' current order station (launched 2025-01-30) takes phone photos over Wi-Fi, AirPrint, Bluetooth, a QR-code "Direct Transfer" upload, or social accounts [V]. CVS and Bartell used a Kodak app for the same transfer years earlier [S]. So the customer expectation is "photos go from my phone to the store's machine".

For GreetHub, the safe version is the reverse: **the photos never go to the kiosk.** The design already in 04 (QR pairing, phone signs in, server binds the session) extends to photo cards like this:

1. Kiosk shows a QR. Customer opens GreetHub on their own phone, signs in, uploads photos through the normal photo intake (consent tick, moderation, private storage, 90-day purge: `docs/book/photo-intake-reuse.md` when written).
2. The phone does layout and proof. The kiosk at most shows the proof (a rendered, watermarked image fetched by session id, cleared at session end) on a bigger screen.
3. Pay on the phone or the kiosk reader; the order goes to the online printer.

What this avoids: no image files on a shared device, no Bluetooth or AirPrint attack surface, no stranger's phone pushing content to a public screen, no new consent flow. What it costs: the kiosk adds little beyond the phone itself, which is the honest finding. If photos must render at the kiosk, the security lead and general counsel need to review it first (public-device storage, wipe, shoulder-surfing, children's images on a screen in a store). I have not asked them; this is a flag, not a design.

## 3. Print on site versus ship

| | Print on site (Tier A dye-sub) | Ship (online printer from the photo-events plan) |
|---|---|---|
| Product | Glossy flat photo print, front only, no scored stock [U, 03] | Flat 5x7 card stock, two-sided, envelopes, addressing options (pending `docs/ops/photo-events-printing.md`) |
| Time for 50 cards | About 8 to 15 s a print [S/U, 03] = roughly 7 to 13 minutes of machine time, plus media changes (a roll covers a few hundred prints [S]) | Days; must meet the early-December cut-off |
| Media cost | $0.35 to $0.60 a 5x7 print [U, 03] before envelope, about $17 to $30 for 50 | Pending CFO and fulfillment |
| Customer experience | Waits at the counter, kiosk blocked for other buyers, envelopes by hand | Orders in two minutes, cards arrive at home |
| Differentiation | None: the same product Walmart, CVS and Walgreens sell for less | Paper, back side, letter, addressing, mail-for-me |

On site makes sense only for the last-minute buyer after the online cut-off (about Dec 10 to 23). That buyer already has the drugstore down the road.

## 4. Existing retail photo kiosks and counters (the competition)

| Player | Holiday photo cards in store | Price seen | Tag |
|---|---|---|---|
| Walmart Photo | 5x7 photo cards, envelopes included, "free pickup today" label; same-day stationery cards also listed | $0.56 to $0.78 a card on Walmart pages (dates unclear); Black Friday 2023 deal at $0.35 | [S] |
| CVS Photo | Same-day pickup, many orders ready in about 2 hours; 20-card minimum per one review | 5x7 flat from about $1.39 a card in a 20-pack, folded $3.99 (undated) | [S] |
| Walgreens Photo | Same-day pickup at participating stores | 6 premium 5x7 cards $23.99 (about $4 each), often free with codes in 2025; folded card $4.49 | [S] |
| Kodak Moments order stations | Self-service kiosk in photo departments, phone transfer, QR upload | Retailer sets price; host retailers not named in the 2025 article | [V] |
| Costco | Closed all in-store photo centers in Feb 2021, citing "the continued decline of prints"; online photo later moved to Shutterfly | n/a | [S] |
| Sam's Club, Target | Reported to have closed photo centers in 2020 and around 2022, from a single commercial site; not confirmed | n/a | [S, weak] |

What this tells me:
- **Price.** The incumbents sell in-store photo cards at about $0.35 to $4, mostly $0.50 to $1.50. The plan's online range is $1.50 to $3 a card. A kiosk carries hardware, rent or revenue share and service on top (05), so it cannot meet the in-store price, and it cannot add the online product's paper and back side either.
- **Direction of the market.** Big-box chains have been closing in-store photo, not opening it, and Card Isle moved from kiosks to design-online, print-at-shop (01). The demand is moving to the phone, with store pickup as a delivery option.
- **Where GreetHub could still differ:** AI help (pick best photos, write the letter, proof checker), designed templates, an optional illustrated border or portrait, and addressing or mail-for-me. All of these live on the phone, not at a counter.

Not found: current 2026 in-store holiday card prices (all figures above are from deal pages, mostly 2023 to 2025, and need checking), the number of US stores still hosting Kodak or Fujifilm photo kiosks, and whether any retailer photo lab offers a print API to outside brands today. Market intel's teardown (`docs/market/03-photo-cards-and-events.md`) may cover some of this.

## 5. Recommendation

1. **Keep kiosk photo cards in "Later", as the plan already does (section 5).** Nothing in the kiosk program changes for Christmas 2026 or Holiday 2027. The kiosk schedule starts S0 no earlier than May 2027 (00, update 2026-10-13), so Holiday 2027 is too soon for anything in a store.
2. **Do not add photo upload or batch printing to the kiosk.** The 02 section 7 decision (no photos at the kiosk) holds, and photo cards strengthen it.
3. **Allowed overlap, if a kiosk ever ships:** a "Holiday cards" tile that pairs the customer's phone by QR and hands off to the online photo-card flow (ships to home). Software only, no hardware, nothing stored on the kiosk. Treat it like the existing "book starter" hand-off (02 section 6, point 5).
4. **Cheap evidence instead of building.** Add two questions to the S0 interviews and the customer research plan for holiday-card senders: "Have you ordered photo cards for same-day store pickup? Why?" and "Would you finish an order started on a store screen on your own phone?" Zero cost; customer research owns the plan.
5. **Revisit only if** the online photo cards sell and data shows a meaningful share of December orders arriving after the ship cut-off. Even then, the first thing to test is a retail print partner (pickup-code model), not GreetHub hardware.

## 6. Cost sheet impact

None. No new R&D line, no BOM change, no change to `financial-inputs.csv`. Nothing to send to gh-cfo from this file; if recommendation 3 is ever built it is a small software item inside P0's existing scope.

## 7. Flags for others

- **Customer research:** the two S0 questions in 5.4.
- **Security and general counsel:** only if anyone proposes rendering customer photos on a public screen; that needs their review first.
- **Market intel:** confirm 2026 in-store prices and which US chains still run photo kiosks.
- **Owner:** nothing to decide now. Confirm, when convenient, that kiosk photo cards stay in "Later" and that no photo upload goes on any kiosk.

## Sources (read 2026-10-15)

- Kodak Moments Edge Order Station, 2025-01-30: https://www.retailcustomerexperience.com/news/kodak-moments-debuts-edge-order-station-for-retail-photo-departments/ [V]
- CVS and Bartell smartphone transfer via Kodak app: https://chaindrugreview.com/cvs-bartell-enable-smartphone-image-transfer-via-kodak-app [S]
- Walmart Photo pages and listing: https://photos3.walmart.com/about/special-offers, https://www.walmart.com/ip/13028105 [S]
- Walmart Black Friday 2023 deal: https://slickdeals.net/f/17096953-holiday-photo-cards-5x7-20-for-7-or-35-each-0-35 [S]
- CVS Photo pricing and pickup: https://www.couponcabin.com/coupons/cvs-photo/, https://hip2save.com/?p=10978074, https://www.toptenreviews.com/photo-cards-cvs-photo-review [S]
- Walgreens 5x7 premium photo cards: https://slickdeals.net/f/18327682-walgreens-6-free-same-day-5x7-premium-photo-cards, https://slickdeals.net/f/18051951-walgreens-photo-free-5x7-folded-greeting-card-free-pickup [S]
- Costco photo center closures: https://www.foxbusiness.com/lifestyle/costco-closing-all-in-store-photo-centers [S]
- Sam's Club and Target closures (single commercial source, weak): https://www.passportphotosnap.com/guides/sams-club-passport-photo [S]
- Kiosk folder files 00, 01, 02, 03, 04, 06 for internal figures.
