# GreetHub launch checklist: what only the owner can do

Written 2026-10-10. Vendor dashboards change their menus often. The steps below name the pages and settings you need, but I have not clicked through these dashboards. If a button has moved, look for the setting by name. Never paste a secret into chat, a commit, or a screenshot. Put each one in `app/.env.local` (local) and in the Vercel project settings (online). Both are covered by `.gitignore` or kept out of the repo.

Legend: **YOU** = needs your identity, money, signature or decision. **ME** = I do it once you hand over the item.

---

## Part 1. Why I can't do these myself

| Category | Examples | Why |
|---|---|---|
| Accounts in your name | Supabase, Vercel, Stripe, Lulu, Prodigi, Resend, domain registrar, Google Cloud | Each needs your email, a verification step, and often a payment card or ID. |
| Money | Stripe activation and bank account, OpenRouter credit, vendor plans, domain, legal fees, ad budget | I can't spend money or hold a payment method. |
| Legal identity and signatures | Business entity, EIN, trademark filing, attorney engagement, accepting vendor terms, DMCA agent registration | These need a person or legal entity to sign. |
| Secrets I shouldn't hold | API keys, webhook secrets, OAuth secrets | You create them. I only read them from env files. |
| Real-world confirmation | Ordering a physical proof, checking print quality, family release forms, testing on your phone | Needs a person and a mailbox. |
| Decisions that are yours | State of formation, investors, arbitration clause, Illinois policy, prices, brand claims | The legal summary lists these. |
| Things I haven't built yet | Supabase adapter, under-18 lockout, takedown registration, image moderation, photo-expiry email | I can build these after step 2. |

---

## Part 2. Order of operations

1. Business basics (entity, bank account, domain, email) - Part 3
2. Supabase - Part 4
3. Vercel (hosting) - Part 5
4. OpenRouter key and spend limit - Part 6
5. Stripe test mode - Part 7
6. Resend (email) - Part 8
7. Lulu and Prodigi sandboxes - Part 9
8. Legal and compliance tasks - Part 10
9. Physical proofs and go-live - Part 11

You can start the build with steps 2 to 4 alone. Stripe, Resend and the printers can follow.

---

## Part 3. Business basics (YOU)

1. **Pick a state and entity type.** An LLC is the usual starting point unless you plan to take investors (then a Delaware C-corp is common). The legal summary asks you for this. A registered agent or your home state both work. Check `docs/legal/04-business-setup.md` for cost ranges and talk to an attorney or accountant before filing.
2. **File the entity** on the state's Secretary of State website.
3. **Get an EIN** free at irs.gov (search "apply for an EIN online").
4. **Open a business bank account** and keep GreetHub money separate from personal money.
5. **Buy a domain.** Use Cloudflare Registrar or Namecheap. First check that "GreetHub" is available and run a trademark search (USPTO Trademark Search at uspto.gov) before spending on branding.
6. **Set up business email** (Google Workspace or similar), for example `hello@yourdomain`. You'll need an address for support and for the legal pages.
7. **Give me:** the company name, mailing address, and support email. I'll put them in the footer and policy pages.

---

## Part 4. Supabase (database, login, photo storage)

**Needed for:** real login, saved drafts, orders, private photo storage.

1. Go to supabase.com, click **Start your project**, and sign up (GitHub login or email).
2. Create an **organization** (name it GreetHub).
3. Click **New project**. Set:
   - Name: `greethub-dev`
   - Database password: generate a strong one and save it in a password manager.
   - Region: the one closest to your customers (US East for a US launch).
   - Plan: Free is fine for development. Plan to move to Pro (about $25/month, verify on their pricing page) before real customers, because Free projects pause after inactivity and have no backups.
4. Wait for the project to finish provisioning.
5. Open **Project Settings > API** (or **Connect**). Copy these three values:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon / public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key -> `SUPABASE_SERVICE_ROLE_KEY` (**secret**, never expose in browser code)
6. Open **Authentication > Providers**. Make sure **Email** is enabled. Turn on **Anonymous sign-ins** (used for guest drafts).
7. Open **Authentication > URL Configuration**. Set Site URL to `http://localhost:3000` for now. After step 5 of Part 5, add your Vercel URL and final domain to Redirect URLs.
8. Open **Database > Extensions** and enable `vector` (pgvector) for the later knowledge base.
9. Open **Storage** and note that private buckets for photos will be created by migration. You don't need to make them by hand.
10. Optional Google login: in Google Cloud Console create an OAuth client (type Web application), set the authorized redirect URI to the callback URL shown on Supabase's Google provider page, and paste the client ID and secret into Supabase.
11. **Put the three values in `app/.env.local`** (create the file by copying `app/.env.example`), then tell me "Supabase is ready". Do not paste the keys into chat.
12. **ME:** write the Supabase auth and store adapter, the database migrations (users, people, briefs, creations, orders, addresses, cost ledger), row-level security rules, private photo buckets, and the 90-day photo purge job.

---

## Part 5. Vercel (hosting)

**Needed for:** the public preview URL and the final site. This is also the "done" gate.

1. Create a GitHub account if you don't have one, then create a **private** repository named `greethub`.
2. **ME or YOU:** push the local repo. From `C:\Users\seejn\greethub`:
   - `git remote add origin https://github.com/<you>/greethub.git`
   - `git push -u origin master` (use `main` if that is your branch name)
   I can run this once you create the repo and give me permission, but you must log in to GitHub on this machine first.
3. Go to vercel.com and sign up with GitHub. The Hobby plan is for non-commercial use only, so a business needs the **Pro** plan (about $20/user/month, verify on their pricing page).
4. Click **Add New > Project**, import the `greethub` repo.
5. Set **Root Directory** to `app`. Framework should auto-detect Next.js.
6. Open **Environment Variables** and add every variable from `app/.env.example` that you have so far. Use the Preview and Production scopes. Leave out ones you don't have yet.
7. Also set `NEXT_PUBLIC_SITE_URL` to the Vercel URL once you see it, and make sure the fake providers are off (do **not** set `GREETHUB_ALLOW_FAKE=1` in Production).
8. Click **Deploy**. Note: the book rendering runs for several minutes. A detached local worker won't work on Vercel. **ME:** I'll move long jobs to a queue (Inngest or Supabase queues) before the first online test. Expect this to be a real chunk of work.
9. Add the preview URL to Supabase redirect URLs (Part 4, step 7).
10. When you have a domain: Vercel **Settings > Domains > Add**, then add the DNS records it shows at your registrar.

---

## Part 6. OpenRouter (AI models)

1. Go to openrouter.ai, sign in, open **Settings > Keys** and click **Create Key**.
2. Name it `greethub-site`. Set a **credit limit** on this key (for example $20) so a bug can't run up a bill.
3. Add credit under **Credits** (card needed). About $0.25 per card and $1.26 to $1.64 per 24 to 32 page book, plus testing. Start with $20 to $50.
4. Put it in `.env.local` and Vercel as `OPENROUTER_API_KEY`. Also set `GENERATION_DAILY_SPEND_CAP_USD` (for example `10`).
5. **Rotate the old key** in `C:\Users\seejn\book\.env`, since several agents have used it.
6. **Retention check (YOU, legal blocker):** in OpenRouter **Settings > Privacy**, review the data-logging and training settings, and look for zero-data-retention options. The legal agent could not confirm a route for the Gemini image models. Ask OpenRouter support, or contact Google directly, before real children's photos are used. See `docs/legal/02-children-photos-privacy.md`.

---

## Part 7. Stripe (payments), test mode first

1. Go to stripe.com and create an account with your business email.
2. Stay in **Test mode** (toggle in the dashboard). You can explore without activating the business.
3. Open **Developers > API keys**. Copy:
   - Publishable key (`pk_test_...`) -> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key (`sk_test_...`) -> `STRIPE_SECRET_KEY`
4. Turn on **Stripe Tax** under Settings > Tax and add your business address (test mode works for this).
5. After the Vercel preview is live: **Developers > Webhooks > Add endpoint**:
   - URL: `https://<your-preview-url>/api/webhooks/stripe`
   - Event: `checkout.session.completed` (the build may ask for more; the app's `/api/webhooks/stripe` route is the reference)
   - Copy the **Signing secret** (`whsec_...`) -> `STRIPE_WEBHOOK_SECRET`
6. For local testing, install the Stripe CLI and run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. It prints a local signing secret.
7. Test with card `4242 4242 4242 4242`, any future date, any CVC. Use `4000 0000 0000 0002` for a decline.
8. **Later, to go live (YOU):** finish **Activate account** (legal name, EIN, bank account, ID verification, product description). Then repeat steps 3 and 5 in live mode with the live keys.

---

## Part 8. Resend (email)

1. Go to resend.com, sign up, and open **API Keys > Create API Key**. Put it in `RESEND_API_KEY`.
2. For testing, use Resend's test sender address, and set `EMAIL_FROM` to it.
3. For launch: **Domains > Add Domain**, add the DNS records (SPF, DKIM, and a DMARC record) at your registrar, wait until it shows **Verified**, then set `EMAIL_FROM` to something like `GreetHub <hello@yourdomain>`.

---

## Part 9. Print partners

### Lulu (books)
1. Create an account at lulu.com, then go to the Lulu developer portal (developers.lulu.com) to get API credentials. Lulu keeps a separate **sandbox**; ask for sandbox access and use that first.
2. Copy the client key and client secret -> `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`. Set `LULU_API_BASE` to the sandbox base URL the portal shows.
3. **YOU:** choose the book product. The plan is 8.5 x 8.5 in hardcover casewrap. Tell me what Lulu's product code (pod_package_id) is for that, or let me look it up through their API once the key is in.
4. **ME:** run the real adapter against the sandbox, use their cover-dimensions API to build the wraparound cover and spine, and fix any file validation errors.
5. **YOU, before launch:** order one real printed book with your own card and check colour, trim, and the 234 DPI quality concern.

### Prodigi (cards)
1. Sign up at prodigi.com and open the dashboard to find the **Sandbox** API key. Put it in `PRODIGI_API_KEY` and set `PRODIGI_API_BASE` to the sandbox URL.
2. **YOU / ME:** pick the greeting-card product. The current SKU in the code is a placeholder. Browse their product catalogue, pick the 5x7 folded card, and give me the SKU, or let me query it once the key is in.
3. **YOU, before launch:** order a real sample card and check it.
4. If Prodigi doesn't work out, Gelato is the fallback in the plan.

---

## Part 10. Legal and compliance (YOU, with an attorney)

Everything here comes from `docs/legal/`. I can't give legal advice and the drafts are research.

1. **Hire an attorney** (a privacy or small-business lawyer). Take them `docs/legal/00-summary.md` first.
2. **Get a written opinion on children's photos going to AI vendors** before any real photo is uploaded. This is the top blocker.
3. **Answer the six open questions:** state and investors, zero-retention fallback, Illinois (accept the risk or block uploads), arbitration and class-action waiver, Eye Story family releases, legal and insurance budgets.
4. **Trademark:** run a clearance search and consider filing for "GreetHub" (USPTO).
5. **Register a DMCA agent** with the US Copyright Office (copyright.gov/dmca-directory) so takedown notices are valid. Needs your company details and a small fee.
6. **Review and approve** the Terms, Privacy Policy, Acceptable Use and Refund policies in `docs/legal/05-policies-draft.md`. Then tell me and I'll replace the stub pages.
7. **Insurance:** quote cyber and media liability coverage.
8. **Sales tax:** use Stripe Tax and talk to an accountant about registering in states where you owe tax.
9. **Eye Story:** get written permission from the family before using the book as a public sample.
10. **Data vendors:** sign the data-processing terms offered by Supabase, Vercel, Stripe, Resend, and OpenRouter where they exist. The legal files list them.

---

## Part 11. Go-live gates

**What I can do once Parts 4 to 9 are done:**
- Build the Supabase adapter and migrations.
- Move rendering to a hosted queue.
- Run the real Stripe, Lulu, Prodigi, and Resend paths in test mode.
- Build the under-18 lockout, takedown form handling, content reporting, image moderation, and the photo-expiry email.
- Write and run the Playwright end-to-end test against the preview URL (the "done" gate).

**What needs you:**
1. Physical proof orders for one card and one book.
2. Open the preview on your own phone and click through everything.
3. Attorney sign-off (Part 10).
4. Switch Stripe, Lulu, and Prodigi to live keys.
5. Confirm the Illinois decision and the retention answer.
6. Press the launch button: swap the domain, set production env vars, confirm fakes are off.

---

## Quick reference: every secret and where it goes

| Variable | From | Used for |
|---|---|---|
| `OPENROUTER_API_KEY`, `GENERATION_DAILY_SPEND_CAP_USD` | OpenRouter | Text and image models, spend cap |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Login, database, photo storage |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe | Payments |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend | Email |
| `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_API_BASE` | Lulu | Book printing |
| `PRODIGI_API_KEY`, `PRODIGI_API_BASE` | Prodigi | Card printing |
| `PRINTER_WEBHOOK_SECRET`, `SESSION_SECRET` | You generate (long random strings) | Printer webhook check, session cookies |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Google Cloud (optional) | Google sign-in |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL or domain | Links, redirects |

To generate the two random secrets in PowerShell: `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | % {[char]$_})`
