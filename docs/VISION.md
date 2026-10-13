# GreetHub vision (from the founder)

Source: CJ Neale's voice-recorded vision session, 11 October 2026. The AI transcript is kept verbatim in [vision/2026-10-11-ceo-session-1-transcript.txt](vision/2026-10-11-ceo-session-1-transcript.txt). This page is a cleaned-up reading of that transcript. The transcription has errors ("breeding cards", "green hub", "Drag system"); where a reading is a guess it is marked *[?]*. If a point matters to a decision and the wording is unclear, check the transcript and ask the owner instead of guessing.

This is the founder's direction for where GreetHub is going. [PLAN.md](PLAN.md) is the approved build plan for launch. Where the two disagree, do not quietly pick one: flag it to the owner (see "Open differences" below).

## Why GreetHub exists

- The idea started in 2022, watching his wife buy greeting cards four or five times a month: a birthday, an anniversary, someone in hospital. Each card cost $5 to $6 and 30 to 40 minutes of her day to go to a store, pick one, mail it.
- Online cards were simpler and had more choice, but cost more. Store cards cover many occasions but none are truly personal; people hunt for one that is "funny and somewhat applicable" and write their own note inside.
- In 2022 image models were not good enough and the first chat-based card generator never took shape, so the idea was shelved.
- In 2026 it came back. Making a picture book of his mother-in-law's made-up "Eye Story" for Christmas (his wife wrote it down verbatim, he built an AI routing system to illustrate it) showed how good the models are, how simple orchestration between them is, and how cheap it was: about $1 in OpenRouter tokens.

## Mission

**Increase thoughtfulness everywhere.** GreetHub is a greeting-card generation center whose purpose is to increase human interaction through greeting cards. People are siloed on the internet; a greeting card is one of the few real touches left between people. Every feature should serve that, and should be **as frictionless as possible**.

## The product

1. **Two deliverables: greeting cards and picture books.**
   - Both can be bought **without an account**.
   - Both are fully generated from a chat or a form, backed by a RAG system *[? transcript: "Drag system model"]*.
   - A subagent orchestrates the image-generation and content-creation models, then packages the result into a final file shown to the customer as a preview.
2. **No card or book is ever sold without a preview.** We are asking for their money, so they must see exactly what they will get. Without this from the outset we will drown in customer-service issues.
3. **GreetHub as an MCP / integration layer for AI agents.** People already use AI agents synced to their calendars and Outlook. GreetHub should be available to those agents, so that someone chatting with ChatGPT (or another assistant) can say "send a greeting card to this person for this reason" and the card is created and added to their GreetHub account.
4. **Members-only platform (monthly subscription).** The AI-agent integration is for members only. Members also get tools to schedule cards, do bulk sends and manage contact lists *[? transcript: "create contactless"]*.
5. **Personalization.** Same image and content generation, plus capturing a member's **handwriting style** so they can add digital handwritten notes to their cards.
6. **In-person kiosks (later).** Think of the Redbox movie-rental kiosk at a CVS checkout. A customer enters their inputs and the kiosk prints the exact card they want on the spot, and they pay there. Two wins:
   - Customers get the card that is exactly right for the person, instantly.
   - Retailers (Target, CVS, Walmart) free up a lot of floor space now spent displaying every card, cut the capital tied up in card inventory, and reduce theft (cards are an easy theft item).

These advantages (agent integration, personalization, kiosks) are what the founder sees as setting GreetHub up for long-term success *[? transcript: "court manages", likely "core advantages"]*.

## How the company runs

- GreetHub is a startup. Today CJ Neale is the only human working on it.
- **Every role in the company has an AI agent assigned to it** (CFO, CMO, legal and all the sub-roles; see `.claude/agents/`). Each agent holds deep context for its role, so any human who joins, at any time, has the business context of someone who has been here from the start: what was done, what changed, what worked and what did not. Agents should write down decisions, results and lessons in their docs folders with that reader in mind.
- **Dynamic equity for humans** on the Slicing Pie / Grunt Fund model: time, effort, cash and ideas are all tracked to give a fair, transparent split, which gives clarity and a simple framework as investors come on. See `docs/equity/`.

## Where it is heading

- GreetHub has long-term growth potential, but first the system and models must reliably deliver what we promise the customer.
- Long term: bring printing and shipping in-house to cut shipping cost, raise margins and scale quickly on internal processes. For now, fulfilment goes through print vendors and US mail.

## Owner decisions since the session

- **13 Oct 2026, access tiers.** This replaces "bought without an account" above. You need a free account to make cards and books; visitors can only browse. The AI-assistant connector (MCP) and the other member features (scheduling, bulk sends, contact lists, digital handwriting) need a paid monthly membership. Membership follows launch. PLAN.md ("Access tiers", M8) has the detail.
