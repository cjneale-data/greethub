# Kiosk review, committee 2026-10-15

Author: Kiosk Program Lead. Sources: docs/PLAN.md (Platform assessment, Kiosk; Cut from launch; item 10), docs/kiosk/00 and 07.

## Done vs plan
- Phase approved so far: none. The plan's phase is research and paper design only. No hardware bought, no contractors, no retailer or operator commitments, no cash spent.
- Delivered (docs/kiosk/): 00 recommendation, 01 market and precedent, 02 product and tiers, 03 hardware BOM, 04 software architecture (s14 built-vs-needed), 05 unit economics, 06 compliance, 07 R&D plan and costs, 08/CSV financial inputs, 09 open questions, photo-cards-fit.
- Revised 2026-10-13: "GO on P0 now" replaced by new stage S0 (evidence before spend, about $100 to $500, after launch) and a five-part start gate before P0 ($35k base) can begin.
- Finance workbook v3 already carries the kiosk shifted 6 months (P0 at M7, G0 default 0). Cost sheet is current. Not done: finance/README.md still shows v2 "Core + kiosk" figures (gh-cfo to refresh).
- Not yet possible: P0 test plan results and G0 verdict. There is nothing to test until S0 passes. Costs are estimates [U]; no real quotes yet.

## Off the launch path?
Yes, correctly. PLAN.md lists the kiosk under "Not on the launch path" and "Cut from launch", and schedules S0 after Valentine's 2027. Reasons hold: P0 is about two thirds of the CFO's $54k peak funding need and earns nothing; the app has no signed-in card path, card print PDF, durable store or hosted queue; the card has no differentiator yet. Base-case 36-month cash is about -$1.76M, so no kiosk spend should compete with launch.
- Gap to fix: PLAN.md has no kiosk milestone line. Add: "Kiosk: research only until start gate S0 (docs/kiosk/07)."

## What it needs from launch work (no new asks; these are existing launch items)
- Supabase store and auth (SEC-18), durable spend ledger (SEC-10, per-device token caps, not per IP or cookie), hosted job queue (SEC-21).
- Signed-in card path with approval, card print PDF, and a print path that uses the approved message verbatim.
- Data from the live store for the S0 gate: printed-card orders per month, reprint/complaint rate on Prodigi 5x7 cards, printed vs digital share, repeat card buyers. Need gh-data to expose these (no customer content) and gh-fulfillment for reprint rate. Gate needs 3 months and 150+ printed cards, under 5% complaints.
- Nothing here should delay launch.

## Owner actions
1. Confirm kiosk stays research-only until S0 (PLAN.md item 10).
2. Decide whether to open an informal licensing talk with an operator (Scribbler/Fujifilm, Card Isle). Optional; no terms offered.
3. Optional S0 items: order 5 printed cards (about $55) for a blind compare; informal talks with up to 3 known hosts.
4. Later, only if S0 passes: written approval of P0 budget and dates; attorney review of unattended AI-printed sales. No hardware spend or retailer commitment is requested now.
