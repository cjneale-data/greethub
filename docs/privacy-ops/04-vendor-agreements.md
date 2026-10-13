# 04. Vendor agreements and renewals tracker

Status 2026-10-12. Built from docs/data/06 s7 and docs/legal/02 s10, which I did not re-verify against vendor sites this session (no web reads). "Status" is what the repo docs say; "not found" means no evidence in the repo. Signing or accepting any agreement is an **owner** action.

## 1. Processors and sub-processors

| Vendor | Gets | DPA / terms | Sub-processor notices | Retention to confirm | Status (repo evidence) |
|---|---|---|---|---|---|
| Supabase | everything operational, photos | DPA in ToS (data/06 cites v1, 1 Aug 2026) | subscribe | backup window (req 29) | Not in use yet (SEC-18). Not accepted. |
| Vercel | requests, logs, env; today also `/tmp` data | DPA with Pro plan | subscribe | runtime log retention; log drain 30 days | Plan tier not confirmed in repo. |
| OpenRouter | photos, prompts | **no DPA found** | n/a | ZDR on every photo call (`live.ts`, `moderation.ts` send `provider.zdr: true`) | Written ZDR/retention/training position not on file (req 8, 57). |
| Google (Gemini, via OpenRouter) | photos, prompts | paid tier only | n/a | no training on paid tier | Route and tier not confirmed in writing (req 9). |
| Anthropic (via OpenRouter) | text, vision QA images | via OpenRouter | n/a | | Not confirmed in writing. |
| Stripe | email, name, address, payment | online DPA | subscribe | Stripe's own legal retention | Not accepted (not found). |
| Resend | email, first name, message content | DPA | subscribe | sent-mail log retention | Not accepted (not found). |
| Lulu | book print PDFs, ship-to | API terms plus DPA | ask | artwork and address retention after fulfilment | Not signed; questions open (req 57). |
| Prodigi | card print files, ship-to | DPA referenced in terms | ask | same | Not signed. |
| Error tracking (Sentry or similar) | error traces | to sign | | scrub bodies | Not chosen (PLAN DevOps). |
| Helpdesk | tickets, may include photos | to sign | | 24 months proposed | Not chosen. |

The privacy policy draft (legal/05 s3) lists vendors by category. When a vendor is added or changes route (for example a second printer such as Gelato, or a new image model provider), update this table, data/06 s7, the consent box B wording (`CONSENT_TEXT.b` names "OpenRouter, Google, Anthropic" and "Lulu, Prodigi"), and `DELETION_VENDORS`. A change to box B wording bumps `CONSENT_WORDING_VERSION` and re-prompts everyone; that is intended.

## 2. Renewals and recurring obligations

| Item | Cycle | Next due | Owner | Status |
|---|---|---|---|---|
| DMCA designated agent (US Copyright Office directory) | renew every 3 years from registration (legal/04, source marked [S]) | registration date + 3 years, minus 30 days for a reminder | Owner | **Not registered.** Footer shows `[PLACEHOLDER]` DMCA text (PLAN Head of CX). Required before launch (req 23). |
| Policy and vendor terms review | yearly (req 53) | before launch, then each October | Owner, attorney | Not started |
| Sub-processor notice inbox | monthly read | first Monday | Privacy ops | No subscriptions yet |
| Cyber / media insurance | yearly | bind before launch (req 56) | Owner | Not bound |
| ZDR re-test (`https://openrouter.ai/api/v1/endpoints/zdr`) | quarterly, and on any model change | before launch | CTO | Not run this session (no paid or web calls) |

When the DMCA agent is registered, record here: registration date, registration number, the renewal date, and where the confirmation is filed (outside the repo). Update the site footer and Terms s9 in the same week.

## 3. Owner asks from this tracker

1. Accept or sign DPAs: Supabase, Vercel, Stripe, Resend, Lulu, Prodigi. Request a DPA and a written ZDR and no-training statement from OpenRouter.
2. Register the DMCA agent and send the registration date so the renewal can be calendared.
3. Choose the privacy email address and mailbox, so requests and sub-processor notices have a home.
