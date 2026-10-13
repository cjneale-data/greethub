# Greet Guide question bank

Owner: CMO with CTO. Every question maps to one CreationBrief field. The CTO should treat `field` names as proposals; rename in the Zod schema and keep this file in sync.

## 1. Rules for the Greet Guide

**Ask only what's missing.** Before each turn:
1. Compute `missing = required_fields - filled_fields` for the current product.
2. Fill from every source first: template defaults, the user's first message (extract several fields at once), saved People, past briefs (RAG), form edits.
3. Ask the first item of `missing` in the order below. Never re-ask a field that is filled, even if the user only implied it. Instead confirm in the brief card, not in chat.
4. If one message answers several fields, acknowledge in one line ("Got it: Rosa, your mom, birthday.") and ask the next missing one.
5. Optional fields are asked once, together, after the required ones: "Anything else I should know?" If the user says no, mark `optional_done = true`.
6. Maximum one question per turn. Maximum two sentences per turn. No question twice unless validation failed.
7. A field the user edits on the brief card overrides chat and is never re-asked.
8. Generation unlocks only when every required field passes validation. The Guide says what is missing: "One more thing: who's it for?"
9. Retrieval (saved People, past briefs) proposes values as chips ("Rosa (Mom)") and never fills silently.

**Voice for the Guide:** warm, short, first names, no exclamation marks in the intake (reserve the one per screen for the result). No therapeutic words. No emojis.

**Greeting (first turn):**
- Guest or account, no template: "Hi, I'm your Greet Guide. What are we making: a card or a picture book?"
- With a template: "Good pick. Let's make it yours. Who's it for?"
- Returning, with People: "Welcome back, {first name}. Who are we celebrating?" with Avatar chips of saved People.

---

## 2. Cards

### 2.1 Required, structured (chips / pickers), in order

| # | field | Exact question | Control | Options | Validation | If invalid |
|---|---|---|---|---|---|---|
| 1 | `product` | "Are we making a card or a picture book?" | ChipGroup | Card, Picture book | One of two | Re-show chips |
| 2 | `recipient.relationship` | "Who's it for?" | ChipGroup + free text "Someone else" | Mom, Dad, Partner, Child, Grandparent, Friend, Colleague, Teacher, Myself, Someone else | Required; free text 1-40 chars | "Pick one, or tell me who they are." |
| 3 | `recipient.name` | "What's their first name?" | TextField (+ People chips if account) | n/a | 1-40 chars, letters, spaces, hyphen, apostrophe | "Just a first name or nickname is fine." |
| 4 | `occasion` | "What's the occasion?" | ChipGroup (scrolls) | Birthday, Thank you, Wedding, Anniversary, New baby, Get well, Congratulations, Sympathy, Mother's Day, Father's Day, Valentine's Day, Christmas, Graduation, Retirement, Just because, Something else | One required; "Something else" asks for free text 1-60 chars | "Tell me the occasion in a few words." |
| 5 | `tone` | "What should it feel like?" | ChipGroup | Funny, Heartfelt, Adventurous (plus "Sweet and simple" if occasion is New baby or Sympathy) | One required | Re-show chips |
| 6 | `art_style` | "Pick a look." | Style picker: 5 preset tiles with a sample each (see templates.md) | The 5 presets | One required; default pre-selected from occasion/tone, user can accept in one tap | Re-show |
| 7 | `format` | "Mailed or digital?" | Segmented | Mailed, Digital | Required for checkout, not for preview. Ask after the preview if not set. | n/a |
| 8 | `ship.mode` | (only if Mailed) "Should we send it to you or straight to {name}?" | ChipGroup | To me, To {name} | Required if Mailed; asked at checkout if skipped | n/a |

Not asked in chat (collected at checkout): `ship.address`, `delivery_date`.

### 2.2 Required, unstructured

| # | field | Exact question | Control | Validation | If invalid |
|---|---|---|---|---|---|
| 9 | `idea` | "What should the picture show? A memory, a place, something they love, anything." | TextField multiline, chips of 3 suggestions based on occasion | Required; 5-500 chars; moderation passes; no copyrighted character or real public figure | Length: "A sentence or two is plenty." Guardrail: wording in section 4. |
| 10 | `message` | "What do you want to say inside? I can write it, or you can." | Segmented [Write it for me][I'll write it] then TextField | Required; 1-400 chars if user writes; if "Write it for me", a draft is proposed and must be accepted or edited | Over 400: "That's a lot for a card. Trim it to about 60 words, or shorten for me?" |

### 2.3 Optional (asked together, once)

| field | Exact question | Control | Validation |
|---|---|---|---|
| `inside_jokes` | "Any inside jokes or details only they'd get?" | TextField multiline | 0-300 chars |
| `include` | "Anything to include? Colors, a pet, a place." | TextField | 0-200 chars |
| `avoid` | "Anything to leave out?" | TextField | 0-200 chars |
| `inside_art` | "Want a small drawing inside too?" | Toggle | boolean, default off |
| `photo` | "Add a photo so the card looks like them." (accounts only) | Dropzone | JPG/PNG/HEIC, 600px, 10MB; consent rules in section 4 |
| `signoff` | "How do you sign off?" | TextField (placeholder: first name) | 1-40 chars; default = user's first name |

Required count for the card Progress bar: 8 (fields 1-6, 9, 10). Fields 7-8 are asked after the preview. Progress label: "{n} of 8 done".

---

## 3. Picture books

Required fields marked R. The Guide asks in this order.

### 3.1 Structured (chips / pickers / forms)

| # | field | Exact question | Control | Options | Validation | If invalid |
|---|---|---|---|---|---|---|
| 1 | `product` | (as card) | ChipGroup | | | |
| 2 | `occasion` R | "What's the book for?" | ChipGroup | Birthday, New baby, Christmas, Graduation, Anniversary, Moving house, Starting school, Just because, A family story, Something else | One required | |
| 3 | `recipient.name` R | "Who's the book for?" | TextField (People chips) | | 1-40 chars | |
| 4 | `reading_age` R | "How old is the reader?" | ChipGroup | 0-2, 3-5, 6-8, 9+, Grown-up | One required; sets sentence length and vocabulary | |
| 5 | `characters` R | "Who's in the story? Add up to four people. You can add a pet after." | Repeating form row: name TextField, age band ChipGroup (Baby, Child, Teen, Adult, Older adult), role ChipGroup (Hero, Sibling, Parent, Grandparent, Friend, Other), pronouns (he, she, they, or free text), pet toggle | | 1-4 people; names unique; age band required; pronouns as given, max 20 chars | "Add at least one person." |
| 6 | `tone` R | "What kind of story?" | ChipGroup | Funny, Heartfelt, Adventurous | One required | |
| 7 | `art_style` R | "Pick a look." | Style picker, 5 presets | | One required | |
| 8 | `page_count` R | "How long should it be?" | Segmented | 24 pages, 32 pages (price shown on each) | Required | |
| 9 | `pet` | "Is there a pet in the story?" | Toggle then name TextField + species ChipGroup (Dog, Cat, Rabbit, Bird, Other) | | If on: name 1-40, species required | |
| 10 | `ship.mode` | Asked at checkout | | | | |

### 3.2 Unstructured (free text, uploads)

| # | field | Exact question | Control | Validation | If invalid |
|---|---|---|---|---|---|
| 11 | `story_idea` R | "What's the story? A real memory, an adventure, a bedtime story. A few sentences is plenty." | TextField multiline + 3 suggestion chips | 20-1500 chars; moderation passes; no copyrighted characters; no real public figures | Short: "Tell me a bit more: where does it happen, and what goes wrong or right?" |
| 12 | `photos` R (accounts) | "Add a few clear photos of {name}. One clear face per photo works best." | Dropzone per character | 1-4 per character; JPG/PNG/HEIC; 600px short edge; 10MB; one face detected; moderation passes | "This one is too small. Try a bigger photo with one clear face." |
| 13 | `consent` R (if any minor) | Checkbox text in section 4 | Checkbox | Must be ticked per child | Continue disabled |
| 14 | `inside_jokes` | "Any inside jokes, favorite things, or sayings that should be in there?" | TextField | 0-500 | |
| 15 | `setting` | "Where does it happen? A real place or an invented one." | TextField | 0-200 | |
| 16 | `include` / `avoid` | "Anything to include?" / "Anything to keep out?" | TextField x2 | 0-300 each | |
| 17 | `dedication` | "What should the dedication say?" | TextField | 0-200; default empty | |
| 18 | `title` | "Got a title in mind? I can suggest some." | TextField + "Suggest titles" chip | 1-60 chars; moderation | |

Required count for the book Progress: 11 (fields 2-8, 11, 12, 13 if applicable). Label: "{n} of {total} done".

**Stage questions after the brief completes** (asked in the UI, not the chat): approve character sheet; edit and approve story; re-roll pages; approve proof. Wording is in ux-spec.md.

---

## 4. Content guardrails (exact wording)

**Copyrighted characters and brands** (detect in `idea`, `story_idea`, `include`, `title`, `message`):
- Guide: "I can't draw {character}. I can do something with the same spirit, though. How about {generic description}?" Chips: "Yes, do that" / "I'll rephrase".
- Examples of the rewrite: "like Meeko" -> "a friendly raccoon"; "Elsa" -> "an ice queen with a braid"; "Spider-Man" -> "a masked hero in a red and blue suit"; "Mickey" -> "a cheerful cartoon mouse". Rewrites are generic descriptions, never trademark names, and never imply the brand.
- If the user insists: "I can't use it, but I can use the idea. Want to try again?" Never offer a workaround that keeps the name in the prompt.
- Brand logos and wordmarks on clothing or items: "I'll leave the logo off and keep the style."

**Real public figures:**
- "I can't draw real public figures. I can draw someone inspired by what you like about them. What are they like?"

**Minors' photos (consent, accounts only):**
- Checkbox text (exact, shown for each character under 18, and for any photo the user marks as a child): "I'm an adult, and I'm this child's parent or legal guardian, or I have their parent or guardian's permission to use these photos. I understand GreetHub stores them privately and deletes them after 90 days unless I save {name} as a person."
- Short helper under it: "Photos stay private. Only the drawing machine and you can see them."
- Blocked case (user is under 18 or declines): "Photos of children need an adult's OK. Ask a parent or guardian to make the account, or describe {name} in words instead."
- Describe-instead path: the character is built from text (hair, eyes, skin tone, clothes) via fields: hair color, hair style, eye color, skin tone swatches, glasses toggle. Always available as an alternative to photos.
- Guests: photo upload of people is not available; prompt in ux-spec.md.

**Sensitive and harmful content** (violence, sexual content, hate, self-harm, real-person harassment, and anything involving a named private person in a harmful light):
- "That's not something I can make. I can do a card or book that's kind, funny or sweet. Want to try a different idea?"
- Sympathy and get-well cards are fully supported and use gentle wording: "I'm sorry for your loss" style drafts are offered, not inspirational platitudes.

**Photo moderation block:**
- "We can't use that photo. Try another where the person is clearly the one in it."

**Real-looking faces of unnamed adults and strangers:**
- Photos of people other than the user's own family and friends are not rejected automatically, but the checkbox for adults reads: "I have this person's OK to use their photo." (shown for any adult photo).

**Privacy line shown at first photo upload:** "Your photos are private, used only to draw this card or book, and deleted after 90 days unless you save the person."

---

## 5. Defaults and mappings

- Art-style default by occasion and tone (user can change): Birthday + Funny = Bold Cartoon Pop; Birthday + Heartfelt = Soft Watercolor; New baby = Soft Watercolor; Wedding/Anniversary = Ink and Wash; Christmas = Cozy Storybook Gouache; Thank you = Paper Cut Collage; Adventurous = Cozy Storybook Gouache. (Preset names are in templates.md.)
- `reading_age` -> page text length: 0-2 = 8-15 words per page; 3-5 = 20-35; 6-8 = 40-70; 9+ = 70-120; Grown-up = 40-100.
- Message length budget for a 5x7 card: 60 words in the inside message at default type size.
- Pronouns: use as given; do not infer from name or photo.

## 6. Output contract

The Guide returns a `CreationBrief` JSON validated by Zod. Required keys for card: `product, recipient{relationship,name}, occasion, tone, art_style, idea, message`. Required keys for book: `product, occasion, recipient{name}, reading_age, characters[], tone, art_style, page_count, story_idea, photos/consent per character`. Each filled field carries `source` (chat, form, template, people, rag) so the UI can mark pre-filled values and the brief card can show "from your saved person".
