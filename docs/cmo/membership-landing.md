# Membership landing page (/membership)

CMO, 2026-10-14. Built at `app/app/(shop)/membership/page.tsx` (plan cards: shared `Plans` via `app/components/membership/LandingPlans.tsx`). Source of truth for tiers and numbers: `docs/finance/membership-plan.md` and `MEMBERSHIP_SPEC` in `app/packages/shared/src/membership.ts`. Every number on the page is read from the spec, never typed. Prices are the CFO's proposal and are **not approved** by the owner yet. This is not legal advice; section 7 lists what the attorney must review.

## 1. Positioning

Plus sells one thing people can picture: **a card that looks like you wrote it.** Own handwriting and a saved signature are the hook. Higher AI limits, drafts and the e-card are supporting reasons, kept to one benefit block. We lead with the feeling, not the feature table, and the table (the shared plan cards) sits in the middle of the page for people who compare.

The reassurance that matters as much as the pitch: **Free stays free.** The 8 preset hands and a typed signature work on every card, and nobody needs Plus to make a card or book. This guards against the "they paywalled what I had" reaction (CFO open question 4).

## 2. Headline options

1. **Your cards, in your own *handwriting.*** (chosen)
2. Write it once. Sign *every card.*
3. Sounds like you. Now it looks like *you.*
4. The card that looks like you *wrote it.*

Why 1: plainest statement of the benefit, searchable words ("handwriting", "cards"), and it echoes the home hero ("Cards that sound like *you.*") without repeating it. Option 3 is clever but depends on knowing the home line. Persimmon accent sits on "handwriting." only: the one persimmon moment in the hero.

## 3. Page copy

**SEO title:** GreetHub Plus: cards in your own handwriting
**Meta description:** Print every card in your own handwriting and sign it with your saved signature. Try GreetHub Plus free for 14 days, no card needed. Cancel anytime.
(Description only promises the trial while it is accurate; see section 7.)

### Hero
- H1: Your cards, in your own *handwriting.*
- Lede: Fill in one sheet with a pen. From then on, every card you make can carry your handwriting and your signature, so it reads like you sat down and wrote it.
- CTAs: **Start 14-day free trial** (dark; links to `/account/membership`, which sends guests to sign in and back) · See the plans (secondary, jumps to #plans)
- Line under CTAs: GreetHub Plus. 14 days free, no card needed. Then $3.99 a month or $35.99 a year. Cancel anytime.
- Visual: tilted "For Nonna" template cover plus the inside of the card with a note in a real self-hosted hand ("Looping cursive") signed "Maya" in a signature script ("Bold script"); plum sticker "Her hand. Her name." Caption: "Sample shown in two of our built-in styles. With Plus, it's your own." The caption keeps us honest: the sample is a preset font, not a customer's handwriting. Maya is the brand kit's fictional name; no real people (standing rule 5).

**Memberships off** (production until `GREETHUB_MEMBERSHIP=1`): the trial CTA and price line are replaced by a status panel, "**Memberships open soon.** Everything you can do today stays free until then." (same words as the account page), with CTAs Start a card · See the plans. Plan cards show "Opens soon"; the closing band reads "Memberships open soon. Until then, start a card with one of our handwriting styles." with Start a card.

### What Plus gives you (four benefits)
- **It looks like you wrote it.** Your own handwriting, printed on real cards. Keep up to 3 styles, say your everyday hand and your best one.
- **Sign once.** Save up to 5 signatures. Draw one with your finger, upload a photo of one on paper, or pick a style for your name.
- **Set it and forget it.** Turn on "Use on every new card" and each new card starts in your hand, already signed. You can still change any card.
- **Help when the words won't come.** 100 "Write it for me" messages a month (Free has 10), more redraws, drafts kept for a year, and 1 free e-card every month.
- Under the grid: **Free stays free.** Anyone can use our 8 handwriting styles and type their name as a signature on any card. You never need Plus to make a card or a picture book.

### Pick a plan
- H2: Pick a plan. Lede: Start free. Add Plus when you want your own hand on the card.
- The shared `Plans` component (monthly/yearly switch, Free / Plus / Card Club, fine print). Card Club shows **Coming soon** with a disabled button; it is never offered for sale (`PURCHASABLE_TIERS = ["plus"]`).

### How your handwriting gets on the card
1. **Print the sheet.** One page with a box for every letter, number and mark. Print it at actual size.
2. **Fill it in.** Write one character in each box with a dark pen, the way you normally write.
3. **Snap a photo.** Upload it in your account. We check every letter is there, then your cards can use your hand.
- Note: You can try one sheet on a free account and see it in your card preview. Printing it on a card needs Plus.

### Questions
- **How does the free trial work?** You get 14 days of Plus without giving us card details. When the trial ends you go back to Free, unless you choose to join. One trial per account. The monthly free e-card starts once you join.
- **Can I cancel anytime?** Yes. Go to Account, then Membership, and cancel in two clicks. No call, no chat. You keep Plus until the end of the time you've paid for, and you can turn it back on before then.
- **What happens to my handwriting if I cancel?** It stays saved in your account, and so do your signatures. Printing them on new cards needs Plus, so they're paused until you rejoin. Cards you've already paid for print as you approved them. You can delete your handwriting or signatures any time.
- **Is my signature safe?** Your handwriting sheet and signatures are private to your account. We use them only to print your own cards: never to sign anything else, never shared, and never used to train AI. They're deleted when you delete your account.
- **Do I need Plus to make a card?** No. Cards and picture books are for everyone. Plus adds your own handwriting, saved signatures and higher limits.
- **What is Card Club?** A plan we're still getting ready: everything in Plus, plus one mailed card a month with postage included and money off extra mailed cards. You can't join it yet.

### Closing band (plum)
- H2: Next card, in your own hand.
- Body: 14 days of Plus, free. No card details. Cancel anytime.
- CTA: Start 14-day free trial (sunny/marigold, so the persimmon moment on this screen stays the plan card button above it, not here)
- Below: See all card and book prices (link to /pricing).

## 4. Where it is linked
- Shop footer, Help column: "Membership" under Pricing (`app/components/shop/ShopShell.tsx`).
- Pricing page: "**Want cards in your own handwriting?** That comes with GreetHub Plus. See membership."
- Not in the top nav: membership is a second purchase, not the first one. Revisit once it is live and we see traffic.
- Not in the sitemap yet (`INDEXABLE_PATHS` in `app/lib/seo.ts`, Growth's file). Add `/membership` (priority 0.6, monthly) when the owner turns memberships on.

## 5. Verification of claims (checked against code and docs, 2026-10-14)
| Claim | Source |
|---|---|
| $3.99/mo, $35.99/yr, 14-day trial, 25% yearly saving | `MEMBERSHIP_SPEC` plus `annualSavingsPct` |
| 3 own styles printed; Free 1 style preview only | spec `own_handwriting_styles`, `own_handwriting_print`; membership-plan.md section 2 |
| 5 saved signatures: draw, upload, choose a style | spec `saved_signatures`; PLAN.md "Handwriting and signatures" |
| "Use on every new card" | spec `apply_to_new_cards` |
| 100 vs 10 "Write it for me" a month, 1 e-card a month, drafts 1 year | spec |
| Template sheet, dark pen, photo upload, every letter checked | PLAN.md, `components/shop/Writing.tsx` |
| Kept but paused after cancel, paid orders print as approved | membership-plan.md section 6 |
| Signature private, own cards only, never e-signature, never shared, never training, deleted with account | PLAN.md "Privacy" bullet; `Writing.tsx` notice |
| Cancel in two clicks, perks to end of period, turn back on | membership-plan.md section 6; account page |
| Card Club not buyable | `PURCHASABLE_TIERS` |

Not claimed on purpose: the 3-day trial reminder email (in the CFO rules, not verified as built), the 14-day first-charge refund (not in published terms), grandfathered prices (owner not approved). Add any of these only once built and approved.

## 6. Design notes
- One persimmon moment per screen: the H1 accent in the hero; the Plus button in the plan cards; the closing CTA uses sunny. Hero CTA is dark, not primary, to keep the hero to one accent.
- Real art only: template cover `for-nonna`; handwriting rendered live from the self-hosted fonts (no images of handwriting).
- Accessible: the hero sample is one `role="img"` with the note's full text as its label; FAQ uses native `details`; headings in order; checked at 390 px with no horizontal scroll.

## 7. For the owner's attorney (compliance notes, not legal advice)
1. **Auto-renewal disclosure (ROSCA; California ARL, Bus. & Prof. Code 17600 ff., and similar state laws).** The plan cards' fine print reads: "Paid plans renew automatically at the price shown until you cancel. Cancel anytime in your account; you keep your perks until the end of the period you paid for. Free trials need no card details from you here and end on their own unless you choose to join. Prices in US dollars; tax may apply." Is that "clear and conspicuous" enough on a landing page, or must it sit next to each Join button? The binding disclosure and affirmative consent belong in the checkout step (`/account/membership` and Stripe), which also needs review.
2. **Trial terms.** Because the trial takes no card and lapses to Free, there is no automatic conversion. Confirm we may say "no card needed" and "ends on its own" plainly, and whether any reminder is still required. If the trial ever starts taking a card, the copy, the reminder and the consent flow all change.
3. **Cancellation wording.** "Cancel in two clicks. No call, no chat." Must match the built flow exactly (online cancellation, FTC click-to-cancel principles and state laws). Confirm "you keep Plus until the end of the time you've paid for" matches the terms.
4. **Annual plan.** Renewal reminder before the yearly charge (some states require one); refund rules on annual plans.
5. **"Never used to train AI"** and "deleted when you delete your account" are promises; confirm they match the privacy policy and vendor terms.
6. **Card Club** shows a price while "Coming soon". Confirm showing an unbuyable price is acceptable, or hide the price until it opens.
7. **Pricing claims** ("save up to 25%") must stay true to the live Stripe prices.
