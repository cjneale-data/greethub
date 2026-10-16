# Shop engineering review, 2026-10-15

Read: docs/PLAN.md, app/lib/shop, app/lib/adapters, app/app/(shop), app/app/api/{cart,checkout,orders,account,auth,webhooks}, app/tests/shop. Nothing was run for this review (no tests, no live calls), so "built" means code present, not verified today.

## Built / mock / missing

| Area | State | Notes |
|---|---|---|
| Cart | Built | lib/shop/cartService.ts, /api/cart, (shop)/cart. Prices only from packages/shared pricing.ts. |
| Checkout | Built, fake-pay walk | checkoutService.ts, /api/checkout, /checkout/fake and /success. Pending checkout stores totals; webhook compares pre-tax amounts. |
| Stripe | Real adapter coded, unexercised | real/stripe.ts + stripeSignature.ts, behind STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET. Test-mode keys never used. Automatic tax assumes Stripe Tax is switched on. Fake webhook refused outside local/opted-in previews. |
| Webhook | Built, tested | handlePaymentWebhook: signature, replay dedupe (processed_events), async-payment wait, amount-mismatch halt, membership events routed to lib/membership. tests/shop/stripe.test.ts. |
| Orders | Built | orderState.ts (pure state machine, tested), orderService.ts (create idempotent, submit, refresh, scrub), /api/orders, tracking page, admin advance. |
| Accounts | Built | accountService.ts: export and delete (email-confirmed link). Fake auth by default; supabaseAuth coded, unexercised. |
| Email | Built; Resend real adapter coded, unexercised | Fake adapter writes to outbox (/api/dev/outbox). Needs RESEND_API_KEY and a verified sender domain; EMAIL_FROM falls back to hello@example.com. |
| Book printer (Lulu) | Coded, never run against sandbox | Package id marked VERIFY; interior/cover validation is a TODO (lulu.ts:49). |
| Card printer (Prodigi) | Coded, never run against sandbox | SKU from env. |
| Print file URLs | Missing | orderService.ts:106 TODO: signed URLs for interior/cover/card PDFs not resolved, so a real printer submit has no files. Blocks live fulfillment. |
| Photo-card cart | Library only, not wired | lib/shop/photoCard (cart, tiered pricing config, checkout lines, batch jobs with mock render). No imports from any route or page. Flat-card printer is fake only; vendor pick due Oct 24. |
| Photo storage purge on account delete | Missing | accountService.ts:188 TODO. Privacy exposure once uploads are live. |
| Cancel button / proof approval wording | Not checked in this pass | CX must-fix items; confirm against docs/cx/05-backlog.md. No cancel route found under /api/orders. |

## Open items by priority

P0 (blocks launch)
1. Resolve print-file URLs and submit to Lulu/Prodigi sandbox end to end (M-L). Needs owner keys.
2. Stripe test-mode run: Checkout, tax, webhook delivery, then reconcile with finance (M). Needs owner keys.
3. Account-delete photo purge (S) and verify the same path covers photo sets.
4. Lulu spec verification and validate-interior/cover calls (M).

P1
5. Wire photo cards into cart, checkout and order submit; add a flat-card real adapter after vendor pick (L).
6. Order cancel before print (S-M), confirm proof-approval wording (S).
7. Real Resend: domain verification, sender, bounce handling, plain-text parity check (S).
8. Tests for printer webhooks and account deletion (S); no shop test file covers them in tests/shop.

P2
9. Marketing email infrastructure (below) (M).
10. Supabase auth live run (M).

## Email: triggers that exist in code

Transactional only, all through lib/shop/mail.ts `send()`, one tag each (Resend tag "kind"):
- magic_link: fake auth sign-in.
- delete_confirm and account_deleted: /api/account/delete and /confirm.
- order_confirmed: on paid webhook, new order only.
- shipped: per item, on printer status change to shipped.
- needs_attention: printer validation/submit failure, our-side delay notice.
Template style: plain text first, minimal HTML, one button, first names.

Not in code, so growth lifecycle emails have no trigger today:
- delivered, review/reorder ask, abandoned cart or draft, occasion reminders (annual, birthday), welcome, proof ready, membership billing notices, holiday cutoff reminders (cutoff data exists in fulfillmentOps.ts but nothing sends).
- Cron: vercel.json has only the privacy purge. No scheduled sender, queue, or retry for failed emails (failures are console.error only).
- No unsubscribe, preference store, or marketing-consent flag on users. Needed before any non-transactional send (CAN-SPAM; ask the attorney about consent for emailing recipients/guests).
- Adapter limit: EmailAdapter.send takes to/subject/text/html/tag; no batch, scheduling or headers (List-Unsubscribe).

Proposed build for growth (M): a `lifecycle` module with trigger functions (delivered, abandoned_draft, occasion_reminder), a daily cron, a suppression/consent table, and idempotent send keys. Growth supplies copy and timing; engineering supplies triggers.

## Owner asks
Stripe, Resend, Lulu, Prodigi, Supabase accounts and keys; sender domain; Stripe Tax activation; flat-card vendor decision (Oct 24); attorney review of marketing-email consent.
