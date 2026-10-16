# Contacts import, event links and the later assistant channel

Owner: Integrations. Version 2026-10-15. Status: PROPOSED (wave 1). Plan: docs/products/photo-cards-and-events-plan.md section 4.4. Architecture: docs/cto/photo-events-architecture.md. Engine: `app/lib/recipients/` (shop engineer).

Not legal advice. Items marked [V] were read on 2026-10-15 from the URL given; items marked [NV] are my knowledge, not verified, and must be checked before relying on them.

## 1. Recommendation

1. **Phase 1 (Christmas 2026): no live contacts integration.** CSV and vCard upload already exist in `app/lib/recipients/` (`importCsv`, `importVCard`, `buildPreview`, `commitImport`). Ship those only.
2. **Phase 2 (save the dates, Jan to Mar 2027): add "Import from Google Contacts" only if** the owner accepts the verification work in section 3 and there is demand evidence from Phase 1 (people who abandon at "type 80 addresses"). Until Google verification clears, the vCard path (section 4) covers Google users too, because Google Contacts exports vCard and CSV.
3. **Apple/iCloud: vCard export only.** There is no public Apple API for reading a person's contacts from a web server (section 4).
4. **Event page links (section 5) and the AI-assistant channel (section 6)** reuse the same recipient engine and never expose addresses to an agent.

Principle across all channels: the import produces an `ImportPreview`, the customer reviews it on greethub.com, and only `commitImport` saves. Nothing imported is saved or mailed unreviewed. Imported rows are other people's personal data (plan section 7): minimal fields, never logged, deleted with the account.

## 2. Google People API import

### 2.1 What we call
- `GET https://people.googleapis.com/v1/people/me/connections` with `personFields=names,addresses,emailAddresses` only. No phone numbers, birthdays, photos, organizations, relations or memberships are requested, which matches what `vcard.ts` already ignores. `pageSize` is 1 to 1000, default 100 [V: https://developers.google.com/people/api/rest/v1/people.connections/list, 2026-10-15]. Our list cap is `MAX_LIST_SIZE` 1000 and `MAX_IMPORT_ROWS` 1000, so one page of 1000 is the most we will ever fetch; stop and tell the customer to pick a Google contact label if more come back.
- Do not request `requestSyncToken`. We do a one-time pull per click, so sync tokens (which expire after 7 days [V, same URL]) are not needed.
- Map to `RecipientDraft` and pass through `buildPreview("google"-style candidates)`. Note: `ImportPreview.source` is currently typed `"csv" | "vcard"` while `RecipientSource` already has `"google"`. Ask for `ImportPreview["source"]` to accept `"google"` (shop engineer).
- Contacts with no postal address are dropped before preview (count shown: "12 contacts had no address"), as the vCard importer does.

### 2.2 Scopes (minimal)
- Use **`https://www.googleapis.com/auth/contacts.readonly`** only. The `contacts` scope also allows write; the list method accepts either [V]. We never write to the customer's Google account.
- Request it **separately from sign-in** (incremental authorization, only when the customer taps "Import from Google"). Google's user data policy says to request only what current features need and in context, not for future features [V: https://developers.google.com/terms/api-services-user-data-policy, 2026-10-15]. Today's sign-in route (`app/app/api/auth/google/route.ts`, via `getAdapters().auth.signInWithGoogle`) must keep identity-only scopes. Do not add contacts to sign-in.
- Do not request `contacts.other.readonly` ("Other contacts", auto-saved addresses of people the customer merely emailed): it would pull in people the customer never chose, and it is a privacy surprise. [NV] scope name.

### 2.3 Verification requirements
Classification: I believe `contacts.readonly` is a **sensitive** scope, not restricted [NV: a search on 2026-10-15 did not confirm it; check Google's OAuth scope list in the Cloud console OAuth consent screen before committing]. Sensitive scope verification requires [V: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification, 2026-10-15]:
- A privacy policy on the same domain as the home page, linked on the consent screen, disclosing how the app accesses, uses, stores or shares Google user data. Needs an attorney-reviewed addition to the policy (flag for the owner's attorney).
- An unlisted YouTube demo video showing the customer starting and granting access.
- A written justification per sensitive scope, including why a narrower scope is not enough.
- Domain ownership verified in Google Search Console.
- Typical review: 3 to 5 business days (plan for 2 to 4 weeks with a round of questions; this is my estimate [NV]).
- Until verified, an unverified-app user cap applies and customers see a warning screen. The cap number was not confirmed [NV]. Do not launch to the public unverified.
- If the scope turned out to be restricted, an annual third-party security assessment (Letter of Assessment) would apply [V: user data policy page says this depends on the API and number of users or grants]. That would end this feature for a company our size; fall back to vCard.

Limited Use [V, user data policy]: use only for the user-facing import feature; no ads or sale to brokers; humans may read the data only with the user's agreement, for security or legal reasons, or in aggregate; applies to derived data too. Consequences for us: contacts never feed marketing, the product's analytics, or model training or evals (the page I fetched has no AI/ML clause either way, so treat the ban as the safe reading and ask the attorney). Support staff do not open a customer's imported list without the customer's request.

### 2.4 Token handling: no long-term storage
- Use the **authorization code flow with PKCE** and `access_type=online` (no refresh token requested). Access tokens last about an hour [NV], which is plenty for a one-shot pull.
- Exchange the code server-side, call People API once, build the preview, then **discard the access token** in the same request. The token is held in memory only: never in a cookie, DocStore, log line, error report or analytics event. Revoke it (`https://oauth2.googleapis.com/revoke`) right after the pull [NV: endpoint].
- Client ID and secret live only in server environment variables (names to be agreed with DevOps; never in client code or docs). Redirect URI is a fixed `https://greethub.com/api/contacts/google/callback`, with a signed `state` bound to the session to stop CSRF and login-CSRF.
- **Justification test for refresh tokens:** a stored refresh token would only be justified by "keep my list in sync with Google". Holiday and wedding lists are static snapshots (the order freezes a recipient snapshot anyway, architecture section 1), so it is not justified. If it ever is, it needs an owner decision, encryption at rest with a key outside the database, a visible "disconnect" button, and deletion on account delete.
- The preview (not the token) is stored in the customer's draft import session for at most 24 hours [proposed, Privacy ops to set], then dropped unless committed.
- Customer can see in their Google account permissions page that access is granted; we also say "We read your contacts once, keep only the people you pick, and don't keep access."

### 2.5 UX notes (hand to CX)
- Show a checklist of contacts with an address, all unticked or "select all", with search by name and Google label (labels need `memberships`; skip in v1, tell people to export a label as vCard instead).
- Say plainly which fields we read. One exclamation mark at most.
- Errors: user declines consent returns to the manual import page with CSV and vCard options; quota 429 on the first page ("additional fixed quota" for first-page full sync [V]) shows "Google is busy, try again or upload a file".

## 3. Rate limits and abuse
- Per account: 5 Google import starts per hour, 20 per day. Per IP hash: as the shop import routes. Cap one import at `MAX_IMPORT_ROWS`. The security teammate sets final numbers (docs/security/02).
- The callback only accepts a `state` we issued in the last 10 minutes and for the same signed-in account.
- Import is for the signed-in account's own contacts; the People API only returns the consenting Google account's data, so there is no enumeration risk of other users.

## 4. Apple and iCloud via vCard
- Apple does not offer a web API to read a person's iCloud contacts to a third party server [NV: check developer.apple.com before saying so publicly]. The reliable path is the customer's own export.
- Instructions (to be verified against current iOS and macOS before CX writes copy) [NV]: on a Mac, Contacts app, select contacts or a group, File, Export, Export vCard. On iCloud.com, Contacts, select all, Export vCard. On iPhone there is no direct vCard file export of many contacts, so point to iCloud.com or share a group via Mac.
- Upload goes to the existing `importVCard`, which handles vCard 2.1, 3.0 and 4.0 and already reads only FN, N, ADR and EMAIL. Size guard exists (`MAX_IMPORT_BYTES * 5` for vCard text, 1000 contacts with addresses).
- Same export path works for Google (Contacts, Export, vCard or Google CSV, whose headers `csv.ts` already maps), Outlook and Yahoo. This is the fallback for every provider and the only Phase 1 path.
- Security for uploads: parse in memory, do not store the raw file, strip photo fields before anything is persisted (vcard.ts already ignores them), reject files over the size limit before parsing, and never echo file contents in errors. Parsing is plain text, no external fetches (vCard `PHOTO;VALUE=uri` or `URL` values must never be fetched server-side, to avoid SSRF).

## 5. Event page links
Applies to Phase 3 save the dates and invitations (architecture section 6: `app/app/e/[slug]/page.tsx`, per-guest `?g=<token>`).
- **Printed link or QR on the card** points to the unlisted event slug (random, unguessable). One slug per event, not per guest, on paper: per-guest tokens on printed cards would mean one print file per recipient, which the flat-card printer path does not do in v1.
- **Digital send** (email or text the customer sends from their own device) may use per-guest links `?g=<token>`. We email only to guests who have an email on file and who have not replied, capped per day (Resend), sent from GreetHub, never from the customer's mailbox (no Gmail scopes, none requested).
- **Import to guest list:** the host can create guests from a recipient list (`Guest.recipientId`). Import brings household names and party size is entered by the host, never guessed from contacts.
- Links in cards are the customer's content: the host owns them, we check them with the proof checker (https only, resolves to our event page or a safe allow-listed registry domain) and the T&S abuse process can disable a slug (same 404 for disabled, wrong and unknown).
- Event pages carry `noindex`, no guest data in analytics, no tracking pixels. RSVP replies are the host's data and deleted with the host.
- Calendar add (`.ics` download) is a static file served from the event page, no Google Calendar scope needed.

## 6. Later: AI-assistant channel ("send our holiday cards to the usual list")
Out of scope until P1 of docs/integrations/06 shows people connect; the tool spec today limits batch to 3 drafts and says so (05-tool-spec.md section 8). Design so it is a small step later:
- New read tool `list_recipient_lists`: returns `{ listId, name, count, lastUsed }`. **Never returns names, addresses or emails**, consistent with `list_people` (05 section 5.2).
- New write tool `request_batch_approval`: input `{ idempotencyKey, designId (existing approved draft), recipientListId, delivery }`. It creates a pending batch order from a frozen snapshot of the list (architecture's recipient snapshot) and returns an approval URL. The assistant never sees the addresses, never confirms them, and never pays: **batch always requires the human approval page**, even for customers with `cards:send_auto`. Autopay does not apply to batches in v1.
- The approval page shows count, the full-size proof, quantity price, postage, total, and the list with address validation problems highlighted. Customer must tick "I checked the proof and the list".
- Scope: a new `batch:request_send`, granted only by an explicit step-up on greethub.com, not in the default scope set. A per-grant cap on recipients per request (for example 50 at first) and on spend, enforced server side against the customer's cap (02 section 5).
- Quantity quotas: max one pending batch per grant; 3 requests per day.
- Prompt injection: names in lists and calendar or email text the assistant read are untrusted. The tool accepts only IDs for lists and designs, never free-text recipient data in a batch call; a new recipient via `add_person` stays one at a time, unconfirmed, adults only.
- Contacts import stays on greethub.com (customer authorizes Google there); an assistant cannot trigger an import or receive Google tokens. Do not accept a Google contacts token passed through an agent.
- Minors: lists can include children's names for households ("The Riveras"); `names` is not printed by default. Assistants get counts only.

## 7. Backlog (proposed, for the PM)
| # | Item | Needs | Est |
|---|---|---|---|
| C1 | `ImportPreview.source` accepts `"google"`; mapper `googlePersonToDraft` in `app/lib/recipients` | shop engineer | 0.5 d |
| C2 | Google OAuth connect and callback routes (PKCE, online, no stored token), preview UI | C1, owner's Google Cloud project | 3 d |
| C3 | Google verification package (privacy text, video, justification, domain) | owner, attorney | owner work, 2 to 4 weeks |
| C4 | vCard export help copy for Apple, Google, Outlook | CX | 0.5 d |
| C5 | `list_recipient_lists`, `request_batch_approval`, approval page for batches | integrations P1 live and connecting | later |

## 8. Owner asks and open questions
1. Create the Google Cloud project and OAuth consent screen (owner only), verify the domain in Search Console, and decide whether Google Contacts import is worth the verification work. Default: not before Phase 2, vCard only until then.
2. Attorney: privacy policy wording for Google user data, Limited Use statement, and whether uploading a customer's contacts (third-party data) needs added wording or consent in Terms (see docs/legal/04-business-setup and 06-product-requirements).
3. Confirm the current scope classification of `contacts.readonly` and the unverified user cap in the Google console [NV].
4. Privacy ops: retention for the import preview (24 hours proposed) and for the recipient snapshot.
5. Do not give assistants any batch send power in P1 to P3 without the owner revisiting section 6.

## Sources read 2026-10-15
- https://developers.google.com/people/api/rest/v1/people.connections/list
- https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- https://developers.google.com/terms/api-services-user-data-policy
- Not read (session limit hit): https://support.google.com/cloud/answer/13464321 (scope classification, unverified user cap).
