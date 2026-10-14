# Member portal review

Head of CX, 2026-10-14. Walked live on `localhost:3101` (fake mode) with Playwright at 1280x900 and 390x844, with fresh sign-ups each run, plus axe and a keyboard pass. Screenshots are in the session scratchpad `scratchpad/cx/` (outside the repo). The names below are those files.

## Verdict

The portal is calm, on-brand and mostly honest. Skeletons, retry boxes, undo on address delete and a double-confirmed account deletion are all in place. The new Handwriting page is the strongest screen: the sheet, upload, typed, drawn and uploaded signatures all worked, its error copy is good, and the default carried into the card creator ("Neat print handwriting · your saved signature"). The portal is not launch-ready, though. "Download my data" exports almost nothing, a member in the creator is told to "Sign in", Orders drops out of the account frame, and the sub-nav, modals, chips and focus ring miss our own standards (01) in ways that hurt keyboard and phone users. None of this is large work. Most fixes are under a day.

## Findings

### P0

**P0-1 Data export returns only books.** /account/delete → `/api/account/export`. Live JSON keys: `["books"]`. Profile, addresses, drafts, people, orders and handwriting are all missing. The cause is that `exportUserData()` is async and is spread without `await` in `app/api/account/export/route.ts`. This hurts every member who uses their legal access right (legal 06 req 28), and the page copy promises much more. Fix: `...(await exportUserData(u.userId))`, plus a vitest that asserts every key. Evidence: `desktop-20-delete-sent.png` (promise copy) and the logged export keys.

### P1

**P1-1 Signed-in members see "Sign in" in the creator, with no way back to their account.** /create/card and /create/book use the static `SiteNav`, which always renders "Sign in". This confuses returning members right where they spend money, and it pairs with CX-46. Fix: make `SiteNav` session-aware (avatar plus "Your account") or reuse `ShopNav`. Evidence: `desktop-36-creator-form.png`, `mobile-46-m-creator-top.png`.

**P1-2 Orders leaves the account frame.** /orders has no sub-nav at either size, a bigger H1 and a different column. On mobile, tapping the "Orders" chip makes the chips disappear. Members lose their place. Fix: move it to `/account/orders` (redirect `/orders`) inside `AccountFrame`, or wrap the page in the frame. Evidence: `desktop-07-orders.png`, `mobile-41-m-orders.png`.

**P1-3 Address empty-state button does nothing.** "Add an address" links to `#`, so the URL changes and no modal opens. This hurts first-time members, since it is the only call to action on the page. Fix: make the empty-state action open the same modal. Evidence: `desktop-03-addresses.png`.

**P1-4 Modals break the standard.** There is no focus trap (25 Tabs leave the dialog and land on the page behind it), no close button, and validation shows "Required" five times with no error summary or `role=alert`. State is a free-text input, not a select. People shows the same "Required" problem. Keyboard and screen-reader users get lost, and everyone gets scolded. Fix: add a trap, an X button and an error summary to the shared `Modal`, use the field-specific messages from 01 §6, and make State a select. Evidence: `desktop-12b-address-modal-focus-escaped.png`, `desktop-13-address-modal-errors.png`, `desktop-16-people-modal-errors.png`.

**P1-5 Focus ring is the old tint glow.** Buttons, chips and sub-nav links use `box-shadow: 0 0 0 4px #FDE3D8` (about 1.2:1 on paper), not the 3px persimmon-ink outline from CX-20. This hurts keyboard users on every portal page. Fix: one rule in `styles/components.css` for `.gh-btn`, `.gh-chip`, `.gs-subnav a` and `[role=radio]`. Evidence: `desktop-23-focus-lastname.png`.

**P1-6 Mobile sub-nav hides where you are.** There are 7 chips in a scroller with no fade edge, and the active chip is off-screen on Handwriting and Delete (x=559 on a 390 screen). "Delete account" sits next to everyday items. Fix: `scrollIntoView({inline:"center"})` on the active chip, add a fade edge, and move Delete and Export into a "Privacy & data" page (see the IA below). Evidence: `mobile-41-m-account-delete.png`, `mobile-41-m-account-handwriting.png`.

**P1-7 Touch targets are 36px.** This covers the sub-nav chips, the filter chips, all `sm` buttons (Delete, Make default, Clear, Save signature, the Draw/Upload tabs) and the 17px "Open the handwriting sheet" link. No coarse-pointer hit area exists, which misses brand rule 01 §5 (44px). Fix: add a `@media (pointer:coarse)` min-height of 44 to `.gh-btn--sm` and `.gh-chip`. Evidence: logged target sizes and `mobile-45-m-hw-full.png`.

**P1-8 Welcome toast is wrong and doubled.** A brand-new member with no card sees "You're in. Your card's saved." twice, and on a phone both toasts cover Save changes. The doubling may be a dev StrictMode effect; recheck in a build. Fix: show "You're in." unless a card draft was carried over, fire the toast once, and offset toasts above the tab bar. Evidence: `mobile-40-m-welcome.png`.

### P2

- **No page titles.** Every /account page reads the site default title; only /orders has its own. Add `metadata.title` per page ("Your addresses | GreetHub"). `desktop-02-profile.png`.
- **Two persimmon moments.** The header "Start a card" is still persimmon-ink on account pages (CX-25), and Handwriting adds two more primary buttons. `desktop-06-handwriting.png`.
- **The "always on" switch still exists (CX-30).** Also, the version label "2026-10-draft-1" is shown. `desktop-02-profile.png`.
- **People.** The empty state has no button, the age chips are unlabeled lowercase `aria-pressed` buttons (not a radiogroup), and rows read "used in 0". `mobile-43-m-people-toast.png`.
- **Drafts.** Filtering to Books shows "Nothing saved yet" even when cards exist. Use the "Nothing for that filter" copy. "Duplicate" toasts "Saved." `desktop-25-drafts-filter-empty.png`.
- **Handwriting.** Clicking the selected style un-sets the default, which radios should not do. The "Use on every new card" toggle can be turned on with no default chosen. "Mine" tiles show a glyph, not a sample of the member's own writing. The sheet is an SVG with no PDF, and the page does not tell phone-only members they need a printer. "Fix this" opens a toast instead of acting. `desktop-30-hw-top.png`, `desktop-34-hw-full.png`.
- **Delete-confirm with a bad token** says "Send a new one?" but gives no link or button. `desktop-22-delete-confirm-badtoken.png`.
- **The email field** looks editable but is read-only, and there is no "Change email" path. `desktop-02-profile.png`.
- **axe** found one serious color-contrast node on every page, which traces to the Next dev indicator. Re-run on a build to confirm the portal itself is clean.

## Quick wins (each 30 minutes or less)

1. Add the `await` in the export route (P0-1).
2. Point the address empty-state action at the modal (P1-3).
3. Make the welcome toast conditional and single (P1-8).
4. Add the 3px ink `:focus-visible` outline rule (P1-5).
5. Add the coarse-pointer 44px rule (P1-7).
6. Add `metadata.title` on the six account pages.
7. Scroll the active chip into view on mobile.
8. Replace "Required" with field-specific messages in Addresses and People.
9. Give the bad-token page a "Send a new link" button back to /account/delete.
10. Make the header "Start a card" `dark` on account pages.

## Where Membership should live

**IA.** Group the sub-nav into three sets, and use the same order for the mobile chips:
- **Make:** Drafts, People, Handwriting
- **Buy:** Orders, **Membership**, Addresses
- **You:** Profile, **Privacy & data** (Download my data, Delete account)

Membership gets its own route, `/account/membership`. It also gets a small status line on Profile ("Free member" or "Plus, renews Dec 3") and a badge next to the avatar in the header menu. Billing details stay in Stripe's customer portal, linked from the page.

**What members need to see:**
- **Current plan:** name, price, billing period, and the next charge date and amount in plain words.
- **What's included and what's used this period:** for example, "2 of 3 cards left this month" and "Free shipping on." Show it as a meter with a text label, not color alone.
- **Upgrade or change plan:** compare plans, then a confirm screen with the prorated amount before any charge (principle 2).
- **Manage:** update the card, view invoices and receipts, cancel.

**Key states:**
- Free: a soft upsell, no dark patterns.
- Trial: the end date, with a reminder email 3 days before.
- Active.
- Past due: say what we did and what to do ("Your card was declined. Your perks stay on until Dec 10. Update card").
- Cancelled, still active until the period ends: a "Turn it back on" button.
- Ended.
- Paused, if offered.

Cancellation must be as easy as sign-up: two clicks, with no forced chat or call. Auto-renew disclosure and cancellation flows fall under state automatic-renewal laws and the FTC negative-option rule. That needs the owner's attorney (not legal advice). The data export must then include the membership and billing history.
