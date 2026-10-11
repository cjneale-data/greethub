# 06. Compliance and legal

Research to brief the owner and a licensed attorney; not legal advice. Sources read 2026-10-11 where linked. Tags [V] primary page fetched, [S] secondary or search snippet, [U] unverified or my judgment. Builds on `docs/legal/00-summary.md` and `03-ecommerce-tax-consumer.md` (read), which assume online-only sales; the kiosk adds physical-presence, in-person payment and public-device issues.

## 1. Electrical and radio certification

| Item | What | Cost and time | Source |
|---|---|---|---|
| **UL/ETL (NRTL) listing**, ITE and AV safety (UL 62368-1 family) | Retailers, landlords and insurers usually require a Nationally Recognized Testing Laboratory mark on a mains-powered public machine. Components with their own listing (printer, PC, PSU) help, but the enclosure, wiring and the assembled system get evaluated | Third-party testing about $5,000 to $15,000 and 8 to 12 weeks; another source $3,000 to $30,000+; ongoing factory audits for a listed product | [S] Alibaba seller blogs, vendor-affiliated (https://seller.alibaba.com/blogs/2026/southeast-asia/electronics/ce-ul-fcc-certification-guide-alibaba-b2b ), read 2026-10-11 |
| **Field evaluation** of a one-off pilot unit | Lets a pilot unit in a store carry an NRTL field label without full listing | $2,500 to $8,000 per unit [U] | [U] |
| **FCC Part 15** | A kiosk with no radio of its own is an unintentional radiator: Supplier's Declaration of Conformity with test report; with Wi-Fi/LTE use **pre-certified modules** to avoid intentional-radiator certification | About $500 to $2,000 verification; $4,000 for a module-level Part 15 test in SparkFun's report; LTE router carries its own certification | [S] https://news.sparkfun.com/3124 |
| Carrier certification | Only if designing our own cellular module, which we will not | | [U] |

Budget in the plan: $0 in P0, $4k to $8k pre-compliance in P1 (low/high), field evaluation for pilot units in P2 ($0 / $7.5k / $18k), full listing and FCC in P3 ($12k / $30k / $60k) plus $5k to $15k in P4 for revisions. Get quotes from an NRTL (UL, Intertek ETL, CSA) before relying on any figure.

Tier A and C use listed consumer or office equipment in a plain shroud; verify with the host's insurer whether that is enough [U].

## 2. Payment and PCI

- **Stripe Terminal** with Stripe-supplied readers: the kiosk app never touches card data. WisePOS E: "end-to-end encryption, P2PE ready" [V https://docs.stripe.com/terminal/payments/setup-reader/bbpos-wisepos-e]. Likely SAQ type is P2PE-style [U]; ask Stripe in writing and keep the attestation.
- **Unattended (Tier B):** Verifone UX700 only; generally available in the US; Visa, Mastercard, American Express and Discover only; mandatory disclosures and signage before completing; physical or digital receipt; fines and chargebacks for non-compliance [V https://docs.stripe.com/terminal/unattended-readers]. Stripe's statement that the reader price tier is "Smart Advanced" is [V https://support.stripe.com/questions/pricing-for-stripe-terminal]; the price itself was not found.
- Unattended transactions have different chargeback and card-network rules than attended ones [U]; talk to Stripe about fraud and dispute handling and the right Merchant Category Code for a vending-style kiosk.
- If Tier C is paid at the retailer's till, GreetHub is a vendor, not the merchant of record at the register; the PCI scope is the retailer's. A prepaid voucher model needs an attorney view on gift-card and escheat rules [U].
- Fee: 2.7% + $0.05 card-present per TechRadar [S, undated]; Stripe's current page was not fetched (404 on the pricing URL tried). Verify before pricing.

## 3. Accessibility (ADA)

- Title III covers a place of public accommodation; a kiosk in a store or hospital is part of the host's facility, so the host will ask for ADA conformance and may require it by contract [U].
- Reach range for an operable part: 15 in minimum to 48 in maximum above floor, unobstructed forward reach, with different limits when reaching over an obstruction [S https://www.access-board.gov/ada/guides/chapter-3-operable-parts/ via search; obstructed-reach figures conflicted across sources, verify in the official 2010 text]. Clear floor space and approach per sections 308 and 309 [S].
- Software side: WCAG 2.2 AA, speech output and tactile controls; the sue-prone risk is real for the web (3,117 federal website suits in 2025 [S] per `docs/legal/00-summary.md`) and the same plaintiffs' bar knows kiosks [U].
- Plan: hire an accessibility reviewer for the enclosure in P3, publish an accessibility statement, include a "need help?" phone/QR channel.

## 4. Sales tax at the point of sale

- A kiosk sale is a face-to-face retail sale of tangible personal property: collect tax at the **location's combined state, county, city and special district rate** [U]. Unlike online, rates come from the kiosk address.
- GreetHub owning the kiosk creates **physical presence** in that state, so it must register and file in every state where a unit sits, from the first sale (the online threshold of $100,000 or 200 transactions [S, `docs/legal/03`] no longer applies) [U]. Budget a sales-tax service or CPA ($500 to $2,000 setup per `docs/legal/00-summary.md` plus recurring filing).
- Whether Stripe Tax calculates tax for Terminal payments in the way it does for Checkout is not verified here; check before building [U].
- Hosts that sell the card themselves (Tier C till) would charge and remit tax as the seller; GreetHub invoices the host wholesale. This is a real advantage for the licence and flat-fee models.
- Local sales-tax treatment of a custom printed greeting card (tangible) vs digital items (varies) is as in `docs/legal/03` section 1; the kiosk card is tangible and generally taxable [U].
- Personal property tax on kiosk equipment in some counties [U].
- Consumer rules for in-person sales: price display, refund policy sign, receipts. Refund policy: a card that printed wrongly (jam, bad print) is replaced or refunded on the spot; one that printed correctly is final, with that said on screen before payment (CX rule: the proof is the contract).

## 5. Location agreements and insurance

Attorney-drafted standard agreement covering: grant of space and power, term and termination (30 days for pilot), revenue share and reporting, who owns the unit, access for service, what the host does (reset, call service), data (the kiosk collects no host-customer data beyond sales), host indemnity for theft/vandalism vs GreetHub's, signage, hours, relocation, insolvency, removal, no exclusivity, force majeure.

Insurance (estimate [U], tie to `docs/legal/04` lines for the base company policies): commercial general liability naming the host as additional insured (customers can trip over machines; paper cuts; printed content), property cover for the unit (theft, vandalism), cyber and media/IP already planned for the online business (`docs/legal/00-summary.md`), product liability for the hardware (heat, electrical). The kiosk adds about $20 to $70 a unit a month allocation in the model; hosts and airports often require $1M to $2M limits and certificate-holder status [U].

## 6. Privacy for a public device

- Collect the minimum: first names, message text, optional email for receipt. No photos, no camera, no location, no microphone, no third-party trackers (04 section 9).
- Public posting of notices: a short privacy notice on the kiosk and at checkout, link by QR, consistent with the website's policies (`docs/legal/05`). Update the policies for kiosk sessions and the 24-hour guest retention.
- Children: kiosks are public and will be used by minors. The Greet Guide AI disclosure remains. A kiosk-only rule: customers under 18 can make a Quick pick card, but no saved People or account link without an adult signed-in (existing 18+ gate) [U]. COPPA applicability to a kiosk with typed first names of children is an attorney question.
- Typed content visible to the next person: wipe on session end, privacy filter on the screen (a physical film) [U], no screen recording.
- Biometrics: no camera, no face matching; the kiosk never receives face-sheet images.
- Breach plan: the kiosk stores nothing sensitive at rest; if a device is stolen the disk is encrypted and the token revoked.

## 7. IP and trademark: what customers may print

- The IP-safety layer from `docs/legal/07-ip-safety-design.md` (cited by the design guide, not re-read here) applies unchanged: no franchise, studio or artist names in prompts; "same theme, different characters"; output vision check on. Screen text typed on a public kiosk is more likely to be provocative or a test; apply the moderation and profanity filter before print.
- Printed output is a physical artifact: GreetHub makes the product, so the editorial and IP responsibility is stronger than for a tool a customer uses privately [U]. Keep the takedown path, the DMCA agent, and an incident log per device.
- Brand marks on the card: the small "Made with GreetHub" line; trademark clearance of the GreetHub name is still open (`docs/legal/00-summary.md` item 7). A kiosk wrap puts the mark on a public device, so clear the name first.
- Hate, harassment, threats and impersonation in the message text: reject at the kiosk; the product refuses rather than prints.
- Upstream: no indemnity for image-model IP claims was found (`docs/legal/00-summary.md`), which persists for kiosks.

## 8. Other items

- Printed-material consumer safety (inks and papers): standard [U].
- Fire code for machines in hospitals and airports; host-specific requirements [U].
- Waste/recycling of toner, cartridges (extended producer rules in some states) [U].
- Mail-it-later: same Mail/Internet merchandise rule (30-day default shipping, refunds within seven working days) as `docs/legal/03` section 3.

## 9. Attorney checklist for the kiosk

1. Location agreement template and insurance clauses; indemnity allocation.
2. Entity and tax: sales-tax registration in each kiosk state; seller-of-record choice per tier; resale certificates for card stock and envelopes; personal-property tax.
3. Payment: unattended payments terms with Stripe; chargeback and refund policy signage; receipts; any state law on vending or coin-op machines [U].
4. Privacy: public-device notice, minors, 24-hour guest retention, update of Terms, Privacy, AUP, Refund policies for kiosk; Illinois BIPA position given no camera.
5. ADA: a written opinion or consultant review; accessibility statement.
6. IP: prints of customer text, moderation standard, takedown for printed goods, trademark clearance of GreetHub for kiosk branding.
7. Product safety and certification: NRTL requirement, field labels for pilot, product liability cover.
8. Licence/white-label agreement terms (Tier D) with an operator.
9. Insurance broker review of exclusions for unattended machines.
10. Employment/contractor classification for field service technicians.

Estimated legal spend in the R&D plan: P0 $0 to $2k; P2 $6k to $25k (base $12k); P3 $8k to $30k (base $15k); P4 $3k to $20k. These are in addition to the online launch legal budget of about $7k to $27k in `docs/legal/00-summary.md`.
