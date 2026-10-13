# Questions for the owner's accountant

Prepared by finance ops, 2026-10-12. Research and bookkeeping prep, not tax or legal advice. Background: `docs/legal/03-ecommerce-tax-consumer.md` (sales tax) and `docs/legal/04-business-setup.md` (entity). Any tax position here needs the accountant to decide it.

## Sales tax registration and nexus

1. Home state: we have physical nexus where the owner lives or works. Which permit, and must it be in place before the first test-mode or first live sale? Filing frequency at launch volume (about 160 orders a month in the model)?
2. Drop-ship: Lulu prints books and Prodigi prints cards from their own facilities. Does either printer's location create nexus for GreetHub in that state? Which states do they ship from (owner to ask the printers)?
3. Economic nexus: is Stripe Tax threshold monitoring enough to track $100,000 or 200 transactions per state, given that some states count gross or exempt sales and some differ? Our holiday peak (Nov-Dec) can cross a transaction count fast. Should we register in high-volume states (CA, TX, NY, FL) before we cross?
4. Product taxability: printed hardcover books, printed greeting cards, digital PDF books and digital e-cards. Which Stripe product tax codes fit each? The app sends no tax code per line today, so the account default applies to every line.
5. Shipping: we charge postage per printed item and an express surcharge per order. Taxable in which states? Should postage be its own Stripe line with a shipping tax code?
6. Bundles: if a customer buys a printed book and its digital copy, must they be taxed separately?
7. Sourcing address: Stripe works out tax from the address it has. Our checkout collects ship-to addresses on our own page, per printed item, and does not pass them to Stripe today, so Stripe may use the billing address. One order can ship to several states. Which address must be used? Do we need one Stripe line per destination?
8. Resale certificates: should we give Lulu and Prodigi a resale or exemption certificate so they do not charge us tax? From which state, and before registration?
9. Recipient gifting: a card mailed by the buyer in state A to a recipient in state B. Confirm that tax follows the delivery address.
10. Stripe Tax plan: Basic (0.5% per Checkout transaction, calculation only) versus Complete (from $90 a month with filings). At what volume or state count should we switch? Or use a separate filing service?

## Income tax, books and revenue

11. Cash or accrual basis? If accrual, recognise revenue at payment, shipment or delivery? The app records payment and shipment dates, but no delivered date (orders stop at "shipped").
12. Digital goods are delivered at once; printed goods ship 3-10 days later. Is a deferred revenue account (2500) needed at month end?
13. Model and image usage (OpenRouter): COGS for customer orders and opex for development. Is a ledger-based allocation acceptable while per-order cost data is incomplete?
14. Guest previews (free, no revenue): COGS or marketing?
15. Launch engineering done by AI agents and contractors: deductible now, or Section 174 capitalisation? How should the owner's own time be recorded (if at all)?
16. Founder equity tracking (Slicing Pie, see the board director's equity docs): any bookkeeping or tax effect before a formal equity grant? (Attorney too.)

## Creators, affiliates and 1099s

17. Commissions (10% of attributed sales) to US creators: 1099-NEC above the threshold? Which W-9 and payout records must we keep?
18. Gifted books to creators (about $20 cost each, plus fees): are they income to the creator and reportable by us? Book at cost to 6110?
19. The 10% customer discount: contra-revenue (4800). Confirm that tax is charged on the discounted price.
20. If creator payouts go through a payout platform (none chosen), who issues the 1099?

## Payments and records

21. Stripe fees: record them per order (we will store them) or as monthly totals?
22. Chargebacks and refunds after the period closes: reverse in the current month or restate?
23. Record retention: how long to keep order, tax and invoice records? Customer names and addresses are removed after account deletion and delivery (privacy promise). Can the books keep order ids and amounts only?
24. Bank: one operating account plus a tax reserve account to hold collected sales tax until filing?

## Owner asks (we do not do these)

- Choose and engage the accountant; register for sales tax; sign resale certificates; open the bank and Stripe live accounts; choose the Stripe Tax plan; choose an accounting system; file every return.
