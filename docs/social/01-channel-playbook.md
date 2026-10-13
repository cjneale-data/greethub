# Social channel playbook (Pinterest, Instagram, TikTok, community)

Owner: Social and Creator Partnerships Lead. Written 2026-10-12. Builds on docs/cmo/marketing-plan.md (section 3 and the paid-spend gate in section 5) and docs/PLAN.md "Platform assessment". Every number here is a guess unless a source is given.

## 0. Rules that apply to every post

1. **No real children, no customers, no family photos.** Our own posts use fictional, text-described families and product-in-hand shots of fictional sample books (docs/cmo/templates.md section 3). Never repost a customer's book, card, proof or photo, even with a tag, unless a signed release under docs/social/02 section 6 exists. Never a child's face or name in our posts.
2. **No style lookalikes.** Captions and hooks never name a living artist, studio, brand or franchise ("in the style of ..."). Use library style names only (docs/design/style-library.json). Comments asking for a character get the standard reply: "We can't draw characters owned by others, but we can make an original one your kid will love."
3. **Claims.** Only what the build does: "approve the look first", "your words lead the story", 90-day photo deletion. No "consistent", no "better than", no "no training" until legal confirms (CMO, PLAN.md). Label AI art plainly ("illustrated with AI from your story"). Platform AI-label rules for Meta, TikTok and Pinterest were not researched (legal/03 section 2, gap): check each before the first post.
4. **Links.** Every link is built with `trackedLink()` in `app/lib/social.ts` (UTM source, medium, campaign; `ref` for creators). Capture on arrival does not exist yet (DATA-003).
5. **Private pages cannot be pinned.** The creators, cart, checkout, orders and account pages send `<meta name="pinterest" content="nopin">` (Pinterest help, https://help.pinterest.com/en/business/article/prevent-saves-to-pinterest-from-your-site, read 2026-10-12). Pins go to Home, Browse and (later) occasion pages.
6. Voice: warm, plain, first names, one exclamation mark at most.

## 1. What we can post before there is real art

Today no real art exists (CX-01). Until the CMO's art set is approved, only these formats are allowed:
- Type-only quote cards (message ideas: "what to write in a sympathy card"), using brand colors, like `app/app/opengraph-image.tsx`.
- Screen captures of the Greet Guide chat and brief card (mock mode, fictional names), with no preview art shown.
- Founder "building it" posts (no product claims, no dates we can't keep).
Anything showing a finished book or card waits for the art set and a physical proof (owner orders proofs).

## 2. Pinterest (priority 1 organic)

- Why: planning platform, long pin life, holiday intent 6-8 weeks out (marketing plan). Fits a November launch better than SEO, which pays from about Feb 2027 (Growth).
- Boards at launch (6): Christmas cards, Christmas gift books for kids, Hanukkah cards, Thanksgiving thank-you notes, What to write in a card, Grandparent gifts.
- Pin types: message-idea quote pins (type only; available now), product-in-hand pins (after proofs), occasion idea pins linking to occasion pages (after Growth ships them).
- Cadence: 10 pins a week from launch (marketing plan), batch-made Monday. Fresh image per pin; one URL can carry many pins.
- Rich Pins: product Rich Pins need product metadata (price, availability) on a product page. We have no product pages and no Product schema (Growth deferred JSON-LD until real art and final prices). Do not apply for Rich Pins until both exist. Article Rich Pins can follow the guides.
- Save button: do not load Pinterest's pinit.js (third-party script, and the Head of Data rule bars third-party scripts on creator pages). If a save link is wanted on marketing pages, use `pinterestSaveUrl()` (plain link, no script) and only for approved marketing art.

## 3. Instagram (priority 2 organic; Meta is the main paid channel)

- Formats: Reels 15-25 s (process: brief → look approval → page flip), carousels (one occasion, 5 message ideas), Stories for cut-off dates.
- Cadence: 3 Reels + 2 carousels a week (guess). Creator posts get reshared to Stories only with a release (02 section 6).
- Bio link: Home with UTM (`trackedLink("/", { channel: "instagram", campaign: "bio" })`).
- Comments and DMs: reply within one business day. Any order or photo question goes to support (no order details in public comments). Delete comments that share a child's full name, school or location, and tell the poster why by DM.

## 4. TikTok (priority 3: creative discovery)

- Organic first: founder process videos, "what I'd write" card-message videos, and screen captures of the creator flow. Budget is $300/mo in the plan; Spark Ads only on creator posts with a release that covers paid use.
- Cadence: 3 a week (guess). Kill a hook after 3 posts below the account median.
- Never use a trending sound or meme that names a franchise character.

## 5. Community

- No forum or group at launch. Moderation load and children's content make an open group a risk before support exists (CX: no help page yet).
- Month 3+: a private "early makers" email list (opt-in only, CAN-SPAM rules in legal/03 section 7) for feedback and template requests. Opt-in storage needs Supabase (Growth).
- Later: a moderated Facebook group for grandparent gifters, only with a written moderation policy, two moderators and a takedown path.

## 6. 90-day calendar (organic; paid follows the CMO gate)

| Weeks | Pinterest | Instagram | TikTok | Creators (02) | Gate check |
|---|---|---|---|---|---|
| -4 to 0 (Oct to early Nov) | 6 boards, 30 type-only message pins | Handle claimed, 6 founder/process posts | 6 founder posts | Shortlist 40, no outreach until art + proof exist | Art set? Proof in hand? |
| 1-4 (Nov) | 10 pins/wk, Christmas + Hanukkah + Thanksgiving | 3 Reels/wk, cut-off Stories | 3/wk | Seed up to 20 only if gate items 1-4 pass by about Nov 10; else skip holiday seeding | Paid gate (CMO s5) |
| 5-8 (Dec) | Last-chance digital card pins after the mail cut-off | Gift-guide carousels, digital card push | 3/wk | First posts live; release signed before any reshare | Printer cut-off dates published |
| 9-13 (Jan to mid Feb) | Valentine's boards from Jan 2, thank-you notes | Valentine's carousels | 3/wk | Valentine's wave: couples and grandparent niches | Repeat on attribution data (DATA-003) |

If the creator seeding misses Nov 10, books gifted in late November can't be posted, delivered and seen before the Christmas cut-off, so move the whole wave to Valentine's.

## 7. Weekly measures (once DATA-003 lands)

Sessions, guest previews, sign-ups and orders by `utm_source`, `utm_campaign` and `ref`; saves and outbound clicks per pin; Reel 3 s view rate. Until capture exists, record only platform-native numbers and label them unattributed.
