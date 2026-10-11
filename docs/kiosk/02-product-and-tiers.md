# 02. Product concept and the three tiers

Price and cost numbers are estimates; see 03 and 05. The brand rules come from `docs/cx/01-ux-ui-standards.md`: warm, plain, first names, one persimmon moment per screen, no red, 44 px touch targets, say what happens next, nothing charged until the customer has looked and said yes.

## 1. The product

One product, a **5x7 folded card** (10x7 in flat), same spec as the online card: front illustration, inside message on cream, optional inside illustration, tiny "Made with GreetHub" line. Existing print layout is `pipeline/src/layout/card.ts`: 5.25 x 7.25 in pages with 0.125 in bleed and 0.375 in safe margin, 1575 x 2175 px at 300 DPI, page 1 front, page 2 inside; the outside back is blank or branded by the printer template.

Kiosk additions (all new, not built):
- an **imposition step** that places back, front, inside-left and inside-right onto one 10.25 x 7.25 in duplex sheet (or two prints for Tier A). The current two-page PDF is not directly printable on a kiosk sheet;
- a **border-safe layout variant** with a built-in frame, because most office printers cannot print true edge-to-edge on custom sizes (printer-dependent [U], test in P0);
- an **envelope**: A7 (5.25 x 7.25 in), plain, with an optional printed flap or return mark;
- optional **mail it later**: customer enters the recipient address on the phone, GreetHub prints and mails from the existing printer partners (Prodigi/Gelato) instead of printing at the kiosk, charged at the online price. No stamps are sold at the kiosk in v1; a stamp vending function is out of scope (USPS rules and postage meters add certification burden [U]).

## 2. Three modes of making a card (the speed trick)

The online experience takes minutes and tens of seconds per image. A person at a counter will not wait. The kiosk offers three paths, chosen by the customer at the first screen:

| Path | What happens | Wait before print | Model cost [S/U] |
|---|---|---|---|
| **Quick pick** | Choose from about 60 to 120 pre-generated fronts (occasion x style), type the name, pick an AI-written message | 0 s of image time; message 2 to 4 s | about $0.02 |
| **Make it yours** | Pick a pre-generated style, add a saved Person ("Grandma") or describe a change; one image renders while the customer writes the message | about 16 s average at 2K (measured), hidden behind the message step | about $0.14 |
| **Totally custom** | Full guided chat, front plus inside art | 40 to 90 s; offered as "send to my phone, collect later" as well | about $0.36 |

Details in 04, section 4.

## 3. Tier A: tabletop/tablet with a small printer

- **Hardware:** 10 to 12 in tablet on a locking stand, a dye-sublimation photo printer that can do 5x7, a card reader, a tray of loose envelopes. BOM about $2.7k at 10 units (03).
- **What prints:** a **flat 5x7 photo print**, glossy, the front art with the message printed on the back or as a caption panel on a second small print. It does not fold. It is a note card or postcard-style card, honestly sold as such. The dye-sub paper is photo stock, not scored card stock. 5x7 capability of the DNP DS620A class is from general knowledge [U]; the Canon SELPHY CP1500 ($169 to $199 [S]) is 4x6 only [U] and is not suitable.
- **Flow (target under 3 minutes):**
  1. 0:00 Attract screen, "Make a card for someone". Tap.
  2. 0:10 Occasion chips, then "Who is it for?" with first name.
  3. 0:35 Three recommended styles (the existing style recommender) shown as large cards, plus "see all".
  4. 1:00 Pick Quick pick design, or Make it yours (render starts).
  5. 1:15 Message: three AI-written options plus "write my own" (on-screen keyboard, large-type mode).
  6. 1:50 Preview, big, with "Looks good, print it" and the price.
  7. 2:00 Tap card on reader. Receipt by email or QR.
  8. 2:15 Print 20 to 30 s. "Pick an envelope from the tray."
  9. 2:45 Optional: "Save this to your GreetHub account" QR.
- **Offline:** Quick pick works from a cached template pack and local fonts; AI message falls back to canned messages. Payment readers can take offline payments only with risk limits [U]; v1 disables sales when offline.
- **Fit:** gift shops, cafes, bookstores, event tables. Lowest cost, lowest margin per card, no jams from folding.

## 4. Tier B: freestanding kiosk

- **Hardware:** 21.5 in vertical touchscreen, mini PC, commercial duplex colour printer, a cassette of pre-scored 10x7 card blanks, an automatic fold module, an envelope dispenser, lockable steel enclosure with service doors, an unattended payment reader, LTE router, UPS, sensors. BOM about $12.0k at 10 units, $21.2k for one, $7.5k at 100 (03).
- **What prints:** the full folded 5x7: duplex colour print on a pre-scored 216 gsm (80 lb cover) class blank, folded, dropped to a chute with an envelope from a second slot. The customer inserts the card in the envelope (v1). Automatic insertion is a stretch goal and likely not worth its cost.
- **Flow:** as Tier A, plus: step 7 "Printing your card, about 40 seconds"; the screen shows the card being "written" with the recipient's name and a "what to write on the envelope" tip. Staff-free end to end.
- **Offline:** as Tier A. If the printer or stock sensor reports a fault, the kiosk stops selling, shows "Out of order, sorry", and pings service. A sale never starts without confirmed stock and printer-ready (file 04, section 8).
- **Fit:** grocery, drugstore, hospital lobby, university bookstore, airport. This is where unattended payment, security and ADA reach apply.

## 5. Tier C: countertop assisted-service unit

- **Hardware:** a tablet for the customer, a better counter printer (Fujifilm-class or pro inkjet), a trimmer and a crease tool, a drawer of stock and envelopes. BOM about $4.6k at 10 units. No payment reader by default: the clerk rings up a GreetHub SKU on the store's till; the kiosk shows the receipt code.
- **What prints:** the full folded 5x7 on proper stock, hand-creased and trimmed by staff or the customer. Slower (60 to 90 s, plus fold), but the stock and print quality can be better than Tier B because a human fixes the fold.
- **Flow:** as Tier A, but at step 7 the customer is told to pay at the till with a code. Staff enters the code in the store's POS (or scans the QR on the tablet); the kiosk releases the print on a webhook from GreetHub, not on trust.
- **Offline:** same as A; payment requires the till, which the store keeps.
- **Fit:** independent gift shops, photo counters, bookstores. Lowest PCI and sales-tax burden because the retailer takes the payment (05 and 06).

## 6. Saving the card to the customer's account

The kiosk is a signed-in or guest surface of the same app (04).

1. **Account QR:** a screen at the start and after printing shows a QR code. Customer scans with their phone camera (the kiosk has no camera), opens a GreetHub page, signs in by magic link or Google, taps "Link this kiosk session". The kiosk session now belongs to that account: saved People appear, the Greet Guide knows their past cards, and the finished card is saved to their drafts and order history.
2. **Without sign-in:** a guest session works without an account. After purchase the receipt page offers "Save this card to your account" by email magic link. The card file is held server-side for 24 hours (guest) and then purged unless claimed. Copy the retention to match `docs/legal` (90-day purge for photos; a text-only card has less to purge).
3. **Phone to kiosk ("start at home, print here"):** the phone draft shows a short pick-up code and a QR. At the kiosk, the customer taps "I have a card on my phone", types the 6-character code, or scans the kiosk's QR with the phone (kiosk-initiated pairing, no kiosk camera). Print and pay at the kiosk. Because the account already holds the draft and approved proof, the kiosk sale can skip the creation steps (about 45 seconds).
4. **Kiosk to phone ("started here, finish there"):** the kiosk offers "Continue on my phone", which hands over the whole brief and drafts through the QR link, e.g. for a custom card, a book, or mail-it-later with an address typed on a real keyboard.
5. **Books are phone-only.** The picture book needs photo upload, consent, and a model sheet approval (PLAN.md) that do not belong on a public screen. The kiosk can sell a "book starter" that hands over to the phone.

## 7. Photos at the kiosk: decision

**No photo upload at the kiosk in v1.** No camera on the kiosk, and no photo transfer from a stranger's phone to a public machine. Photos of people, especially children, need the adult gate and consent flow (`docs/legal/00-summary.md`) and a 90-day purge; the kiosk uses saved People that were created on the phone under that flow. Scribbler reports 20% of its cards use photo upload [V], so this is a deliberate product cost; revisit after the legal opinion.
