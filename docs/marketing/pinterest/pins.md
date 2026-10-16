# Pinterest pins (30, type-only), draft 2026-10-16

Owner: Social. Draft only: no account exists, nothing is posted. Boards are defined in boards.md. Window: Oct 19 to Nov 17, 2026 (W1 Oct 19-25, W2 Oct 26-Nov 1, W3 Nov 2-8, W4 Nov 9-17). Schedule: W1 8 pins, W2 8, W3 7, W4 7. If account setup slips, shift the whole grid; do not compress.

No pin shows a price, a delivery date, a statistic, a testimonial, a person, a child or a protected character. No pin mentions photo cards, events or mail-for-me. Message examples were written fresh for this file. Three pins (05, 22, 28) use an existing template cover; the other 27 are text over brand colors.

## Conventions

**Destination and UTM.** Every link is built with `trackedLink()` (app/lib/social.ts), which sets `utm_source=pinterest`, `utm_medium=social`, `utm_campaign` and `utm_content`. Codes are lowercase letters, digits and dashes, 3 to 32 characters. Pattern:

`<path>?utm_source=pinterest&utm_medium=social&utm_campaign=pin-<occasion>&utm_content=p<NN>`

Example, pin 01: `/christmas-cards?utm_source=pinterest&utm_medium=social&utm_campaign=pin-christmas-cards&utm_content=p01`. Each pin below lists its path, campaign and content. Capture on arrival (DATA-003) is not built, so results are platform-native saves and outbound clicks only, labelled unattributed.

| Campaign code | Path |
|---|---|
| pin-christmas-cards | /christmas-cards |
| pin-christmas-books | /christmas-picture-books |
| pin-hanukkah-cards | /hanukkah-cards |
| pin-thanksgiving-cards | /thanksgiving-cards |
| pin-birthday-mom | /birthday-cards-for-mom |
| pin-grandma-cards | /cards-for-grandma-from-the-kids |
| pin-new-baby-cards | /new-baby-cards |
| pin-teacher-thanks | /teacher-thank-you-cards |
| pin-cards-hub | /cards-hub |

**Layouts** (1000x1500 px, brand/README.md tokens; safe margin 80 px; headline Bricolage Grotesque 800, at least 96 px; support line Figtree 600, at least 40 px; small "greethub" wordmark bottom-center in the logo variant that suits the background; no text shadows; one persimmon moment per pin; never persimmon on marigold).

- **L1 Plum:** background plum #5B2A4B; headline paper #FBF6EE; one accent word marigold #F5B83D; plum-variant logo.
- **L2 Blush:** background blush #F6C9C0; all text plum #5B2A4B; no accent color; light logo.
- **L3 Paper:** background paper #FBF6EE; headline cocoa #2B1E18; one accent phrase persimmon-ink #C8441F; light logo.
- **L4 Marigold:** background marigold #F5B83D; all text cocoa #2B1E18 (no persimmon); light logo.
- **L5 Cover:** background paper #FBF6EE; the named cover file (WebP, 4:5; the 1200 version) placed at 800x1000 px, top 80 px, centered, radius 22, raised shadow from brand/README.md, tilt -2 degrees; headline Bricolage Grotesque 700 cocoa, about 64 px, below it; light logo at the bottom. Cover must be the Design-approved render (check 5). If not approved by the pin's week, publish the fallback layout named in the pin.

## Sympathy: none, and why

No sympathy pin is included. A pin that links to a card-making page beside someone's loss reads as selling, whatever the wording, and the sympathy page is on the attorney list (CMO review, owner decision 7). If the owner wants one later, keep it plain: destination a message-ideas page, one gentle on-image line such as "It is okay to write only a few words.", no call to action in the description, and the attorney has seen the page first.

## Board 1: Christmas Card Ideas and Messages

**Pin 01** | W1 | L1 Plum
- Title: What to Write in a Christmas Card: Short, Warm Lines That Sound Like You
- Description: Not sure what to write in a Christmas card? Start with something you would say out loud: a memory from the year, a thank-you, a wish for the next one. Two or three honest sentences beat a long verse. Save this for card-writing night. #christmascards #cardmessages
- On-image text: What to write in a Christmas card
- Layout: L1; accent word "write" in marigold; support line "Two honest sentences are enough." in blush.
- Destination: /christmas-cards | pin-christmas-cards | p01

**Pin 02** | W1 | L3 Paper
- Title: Christmas Card Wording for Family: Skip the Stock Verse
- Description: Christmas card wording for family works best when it sounds like you. Try: "Thinking of you this season. The house is louder and happier when you are in it." Change the details, keep the warmth. Pin it for when the cards come out. #christmascards #christmasmessages
- On-image text: Skip the stock verse. Write what you would say out loud.
- Layout: L3; accent phrase "out loud" in persimmon-ink.
- Destination: /christmas-cards | pin-christmas-cards | p02

**Pin 03** | W2 | L2 Blush
- Title: Christmas Card Messages for Neighbors and Friends
- Description: A short Christmas note for a neighbor or friend goes a long way. Try: "Thank you for the small kindnesses this year. Wishing you a quiet, cozy holiday." Name one specific thing they did and the card will feel personal. Save for your holiday card list. #christmascards
- On-image text: To the neighbors who waved all year.
- Layout: L2; headline only.
- Destination: /christmas-cards | pin-christmas-cards | p03

**Pin 04** | W2 | L4 Marigold
- Title: Funny Christmas Card Messages That Still Feel Kind
- Description: A little humor makes a Christmas card easier to write and more fun to open. Try: "Merry Christmas from our house to yours. The tree is up, mostly straight." Keep the joke on yourself, not on the reader. #christmascards #funnycards
- On-image text: Merry Christmas. The tree is up, mostly straight.
- Layout: L4; cocoa text only.
- Destination: /christmas-cards | pin-christmas-cards | p04

**Pin 05** | W3 | L5 Cover (merry-and-bright-1200.webp; fallback L1 with the same headline)
- Title: Cozy Christmas Card Ideas: A Snowy Cabin and Your Own Words
- Description: A cozy winter scene and a few honest lines make a Christmas card worth keeping. Write about the year, not only the season: one thing that made you laugh, one thing you are grateful for. See more Christmas card ideas at GreetHub. #christmascards
- On-image text: A card that sounds like you.
- Layout: L5 with merry-and-bright-1200.webp (snowy cabin, lit tree, plum night sky; I viewed the 400 px version, no text or people in the art). Persimmon not used on this pin. AI-content label applies (check 3).
- Destination: /christmas-cards | pin-christmas-cards | p05

**Pin 06** | W4 | L3 Paper
- Title: Christmas Card Messages for Far-Away Family
- Description: When family is far away, a Christmas card carries a bit of home. Try: "We miss you at the table. Know we are thinking of you today and every day." Add one memory you share and it will feel like a visit. #christmascards #familymessages
- On-image text: We miss you at the table.
- Layout: L3; accent word "miss" in persimmon-ink.
- Destination: /christmas-cards | pin-christmas-cards | p06

## Board 2: Christmas Gift Books for Kids (gated: pull the board if the Nov 13 go/no-go is no-go; publish pin 10 on Nov 14 or later)

**Pin 07** | W2 | L1 Plum
- Title: Christmas Picture Book Ideas for Kids: 5 Story Plots to Start From
- Description: Looking for a Christmas gift for a child that is more than a toy? A story built around your own family can be it. Plots to start from: a snowy visit to grandma, the night the tree lit up, a very long walk to see the lights, baking with grandpa, the missing mitten. #christmasgifts #picturebooks
- On-image text: Five Christmas story ideas for your kid's book
- Layout: L1; accent word "story" in marigold.
- Destination: /christmas-picture-books | pin-christmas-books | p07

**Pin 08** | W2 | L3 Paper
- Title: Christmas Gift for Kids: A Story About Grandma's Snowy Visit
- Description: Story idea for a Christmas picture book: grandma arrives in a snowstorm and the whole family ends up baking, singing and building a lopsided snowman. Add the real details only you know, like the favorite mug or the family joke, and the story becomes yours. #christmasgifts #picturebooks
- On-image text: Story idea: Grandma's snowy visit
- Layout: L3; accent word "snowy" in persimmon-ink.
- Destination: /christmas-picture-books | pin-christmas-books | p08

**Pin 09** | W3 | L2 Blush
- Title: Bedtime Story Gift Ideas for Christmas, Made From Your Own Words
- Description: A bedtime story written from your own words, with your own family details, can be read again and again. Start by jotting down three small moments from this year. Those are your pages. Save this for gift planning. #christmasgifts #bedtimestories
- On-image text: A bedtime story, made from your own words.
- Layout: L2; headline only.
- Destination: /christmas-picture-books | pin-christmas-books | p09

**Pin 10** | W4 (Nov 14 or later, after the Nov 13 go) | L1 Plum
- Title: Christmas Gift for a Child: A Hardcover Storybook Made From Your Story
- Description: Write the story, choose the look, and give a custom hardcover storybook. Think about the story you tell at bedtime and start there. Planning a gift for your own kids or for grandkids? Save this idea. #christmasgifts #picturebooks
- On-image text: Write the story. Choose the look. Give the book.
- Layout: L1; accent word "Give" in marigold.
- Destination: /christmas-picture-books | pin-christmas-books | p10

## Board 3: Hanukkah Cards and Greetings (have someone who celebrates read pins 11 to 14 first)

**Pin 11** | W3 | L1 Plum
- Title: What to Write in a Hanukkah Card: Simple, Warm Messages
- Description: A Hanukkah card does not need a long message. Try: "Wishing you light, warmth and time together this Hanukkah." Add one line about something you are glad to share with them. Save for card-writing time. #hanukkah #cardmessages
- On-image text: What to write in a Hanukkah card
- Layout: L1; accent word "write" in marigold. No religious symbols drawn.
- Destination: /hanukkah-cards | pin-hanukkah-cards | p11

**Pin 12** | W3 | L3 Paper
- Title: Hanukkah Wishes for Family Near and Far
- Description: Hanukkah wishes for far-away family: "Thinking of you this Hanukkah. We wish we were at your table." Keep it short and personal; one real memory is better than a generic blessing. Pin it for when you sit down to write. #hanukkah #hanukkahcards
- On-image text: Wishing we were at your table this Hanukkah.
- Layout: L3; accent phrase "your table" in persimmon-ink.
- Destination: /hanukkah-cards | pin-hanukkah-cards | p12

**Pin 13** | W4 | L2 Blush
- Title: Hanukkah Card Messages for Grandparents and Kids
- Description: A Hanukkah note for a grandparent can be as simple as what you would say on a call: "We love you and we are thinking of you tonight." Kids can add a line of their own. Spoken-style wording tends to feel the warmest. #hanukkah
- On-image text: Write it the way you would say it.
- Layout: L2; headline only.
- Destination: /hanukkah-cards | pin-hanukkah-cards | p13

**Pin 14** | W4 | L4 Marigold
- Title: Hanukkah Thank-You Note Wording for Gifts
- Description: Thank-you notes after Hanukkah gifts are easiest in three parts: name the gift, say how you will use it, say you are glad to have them. Example: "Thank you for the book. We read it the first night." Short and sincere is plenty. #hanukkah #thankyounotes
- On-image text: Name the gift. Say how you will use it.
- Layout: L4; cocoa text only.
- Destination: /hanukkah-cards | pin-hanukkah-cards | p14

## Board 4: Thanksgiving Thank-You Notes

**Pin 15** | W1 | L3 Paper
- Title: Thanksgiving Thank-You Note Ideas: What to Write to the Host
- Description: After a Thanksgiving dinner, a thank-you note to the host is remembered. Try: "Thank you for the meal, the laughter and the leftovers. We felt at home." Mention one dish or moment by name. #thanksgiving #thankyounotes
- On-image text: Thank you for the meal, the laughter and the leftovers.
- Layout: L3; accent word "laughter" in persimmon-ink.
- Destination: /thanksgiving-cards | pin-thanksgiving-cards | p15

**Pin 16** | W1 | L1 Plum
- Title: Thanksgiving Card Message for Far-Away Family
- Description: If you cannot be at the table this year, a Thanksgiving card says you are there in spirit. Try: "Grateful for you today and every day. Save us some pie." A little humor keeps it light. #thanksgiving #cardmessages
- On-image text: Grateful for you. Save us some pie.
- Layout: L1; accent word "Grateful" in marigold.
- Destination: /thanksgiving-cards | pin-thanksgiving-cards | p16

**Pin 17** | W1 | L2 Blush
- Title: Thank-You Note Ideas for Thanksgiving: Neighbors, Teachers, Coworkers
- Description: Thanksgiving is a good moment to thank people who do small things all year: a neighbor, a teacher, a coworker. Three lines is enough: what they did, why it mattered, and thank you. Save a few lines to adapt. #thanksgiving #thankyou
- On-image text: What they did. Why it mattered. Thank you.
- Layout: L2; headline only.
- Destination: /thanksgiving-cards | pin-thanksgiving-cards | p17

**Pin 18** | W2 | L4 Marigold
- Title: Short Thanksgiving Messages for a Card
- Description: Short Thanksgiving card messages to borrow: "Grateful for you." "Wishing you a full table and a full heart." "Thank you for being part of our year." Change the words until they sound like you. #thanksgiving #cardmessages
- On-image text: Wishing you a full table and a full heart.
- Layout: L4; cocoa text only.
- Destination: /thanksgiving-cards | pin-thanksgiving-cards | p18

## Board 5: What to Write in a Card

**Pin 19** | W1 | L3 Paper
- Title: Birthday Card Message for Mom: What to Write When Words Are Hard
- Description: A birthday card for mom does not need to be poetry. Try: "Thank you for every time you showed up. I notice, and I am grateful." One specific memory beats any general praise. Save this for her birthday card. #birthdaycard #cardmessages
- On-image text: Thank you for every time you showed up.
- Layout: L3; accent phrase "showed up" in persimmon-ink.
- Destination: /birthday-cards-for-mom | pin-birthday-mom | p19

**Pin 20** | W2 | L4 Marigold
- Title: Funny Birthday Wishes for Mom That She Will Actually Laugh At
- Description: Funny birthday card ideas for mom, kept kind: "Happy birthday to the person who taught me everything, including where to hide the good snacks." Make the joke about a real habit and aim it with love. #birthdaycard #funnycards
- On-image text: Thanks for teaching me where to hide the good snacks.
- Layout: L4; cocoa text only.
- Destination: /birthday-cards-for-mom | pin-birthday-mom | p20

**Pin 21** | W2 | L1 Plum
- Title: What to Write in a New Baby Card: Simple Messages for New Parents
- Description: New baby card messages that feel real: "Congratulations. Rest when you can, and tell us when you want company or a hot meal." Warm and practical lands better than flowery. Save for your next baby visit. #newbaby #cardmessages
- On-image text: What to write in a new baby card
- Layout: L1; accent word "write" in marigold.
- Destination: /new-baby-cards | pin-new-baby-cards | p21

**Pin 22** | W3 | L5 Cover (hello-little-one-1200.webp; fallback L2 with the same headline)
- Title: New Baby Card Ideas: Hello, Little One
- Description: A gentle new baby card with a sleeping fox on a crescent moon, plus wording to borrow: "Welcome to the world, little one. We cannot wait to meet you." Add something only you would say to the new parents. #newbaby #babycards
- On-image text: Hello, little one.
- Layout: L5 with hello-little-one-1200.webp (sleeping fox on a moon among peach and sage clouds; viewed, no text or people). Persimmon not used. AI-content label applies (check 3).
- Destination: /new-baby-cards | pin-new-baby-cards | p22

**Pin 23** | W3 | L2 Blush
- Title: Teacher Thank-You Note: What to Write as a Parent
- Description: A teacher thank-you note works best when it is specific: "Thank you for noticing what makes each kid tick. You made this year feel safe and fun." Leave your child's name and school off anything you post publicly. #teacherthankyou #thankyounotes
- On-image text: Thank you for noticing what makes each kid tick.
- Layout: L2; headline only.
- Destination: /teacher-thank-you-cards | pin-teacher-thanks | p23

**Pin 24** | W4 | L3 Paper
- Title: Thank-You Card for a Teacher: Three Lines That Say It All
- Description: No time for a long letter? Use three lines: what you noticed, what changed, thank you. Example: "You made reading feel like a treat. We saw the difference at home. Thank you." Specific beats long every time. #teacherthankyou
- On-image text: What you noticed. What changed. Thank you.
- Layout: L3; accent phrase "Thank you" in persimmon-ink.
- Destination: /teacher-thank-you-cards | pin-teacher-thanks | p24

**Pin 25** | W1 | L4 Marigold
- Title: How to Write a Card That Sounds Like You in 3 Steps
- Description: Three steps to a card that sounds like you: say who it is for, add one real detail only you would know, then end with a wish for them. No verse needed. Save this for the next card you are dreading. #cardmessages #howtowrite
- On-image text: Who it is for. One real detail. A wish.
- Layout: L4; cocoa text only.
- Destination: /cards-hub | pin-cards-hub | p25

## Board 6: Grandparent Gifts and Notes from the Kids

**Pin 26** | W1 | L2 Blush
- Title: What Kids Can Write to Grandma: Simple Card Notes
- Description: Cards for grandma from the kids can be as simple as what a child says out loud. Ask: what do you like doing with grandma? What do you want to tell her? Write their words down exactly as they say them. #grandma #cardsforgrandma
- On-image text: Ask the kids. Write down exactly what they say.
- Layout: L2; headline only. No child's name, age or drawing shown.
- Destination: /cards-for-grandma-from-the-kids | pin-grandma-cards | p26

**Pin 27** | W2 | L3 Paper
- Title: Card for Grandma From Kids Who Cannot Write Yet
- Description: Little kids can still make grandma's card: they say it, you write it. Try three questions: what did we do together, what is your favorite thing about her, what do you hope we do next. Their answers are the card. #grandma #cardsforgrandma
- On-image text: They say it. You write it. That is the card.
- Layout: L3; accent phrase "That is the card." in persimmon-ink.
- Destination: /cards-for-grandma-from-the-kids | pin-grandma-cards | p27

**Pin 28** | W3 | L5 Cover (for-nonna-1200.webp; fallback L2 with the same headline)
- Title: Birthday Card for Grandma: Warm Wording and a Sunny Kitchen Table
- Description: A birthday card for grandma can say what a visit to her kitchen feels like: "Your table is my favorite place in the world. Happy birthday." Add one detail of your own: the tea, the lemons, the song she hums. #grandma #birthdaycard
- On-image text: For grandma, with love.
- Layout: L5 with for-nonna-1200.webp (sunlit kitchen table, lemons, tea, wildflowers; viewed, no text or people). Persimmon not used. AI-content label applies (check 3).
- Destination: /cards-for-grandma-from-the-kids | pin-grandma-cards | p28

**Pin 29** | W4 | L1 Plum
- Title: Grandparent Gift Ideas From the Grandkids: A Card in Their Own Words
- Description: A grandparent gift that sounds like the kids: collect a few sentences, a favorite memory and one thing they want to say, and put them together in a card. Save for birthdays, holidays or just because. #grandparentgifts #grandma
- On-image text: A gift in the grandkids' own words.
- Layout: L1; accent word "own" in marigold.
- Destination: /cards-hub | pin-cards-hub | p29

**Pin 30** | W4 | L3 Paper
- Title: Thank-You Note to a Grandparent: What to Write
- Description: A thank-you note to a grandparent can name one thing: "Thank you for the Saturday pancakes. It is the best part of my week." Be specific and it will mean more. Kids can say it and you can write it down. #grandma #thankyounotes
- On-image text: Thank you for the Saturday pancakes.
- Layout: L3; accent word "pancakes" in persimmon-ink.
- Destination: /cards-for-grandma-from-the-kids | pin-grandma-cards | p30

## Schedule at a glance

| Week | Pins |
|---|---|
| W1, Oct 19-25 (8) | 01, 02, 15, 16, 17, 19, 25, 26 |
| W2, Oct 26-Nov 1 (8) | 03, 04, 07, 08, 18, 20, 21, 27 |
| W3, Nov 2-8 (7) | 05, 09, 11, 12, 22, 23, 28 |
| W4, Nov 9-17 (7) | 06, 10 (Nov 14 or later), 13, 14, 24, 29, 30 |

Not used this window because they fall outside it: valentines-day-cards and mothers-day-cards (draft from Jan 2 and Mar 1 per the social review).

## Checks before publishing

1. **Account.** Owner opens Pinterest Business under the brand email and picks the handle (trademark knockout with the attorney is still open). Nothing is created by Social.
2. **Claimed domain.** Claim the production site in Pinterest (meta tag or DNS). It needs the production domain, which the owner has not set (CMO owner input 2). Do not pin links to a preview or localhost domain.
3. **AI-content label wording needs research.** Pinterest's AI-label rules were not researched (docs/legal/03 section 2 gap). Pins 05, 22 and 28 show AI-illustrated art; the 27 type-only pins do not. Before any of the three goes live: read Pinterest's current policy on AI-generated and AI-modified content, get the owner's approval of the label line ("illustrated with AI from your story" is the playbook draft), and the attorney's view. If unresolved, publish the L3/L1/L2 fallbacks only.
4. **Destination pages must exist first.** No occasion page was found in app/ on 2026-10-16 for any of the 12 slugs. A pin whose link 404s wastes its first weeks. Each pin goes live only after its page returns 200 with real content (Growth ships the pages). Re-check each link by hand, including the UTM string.
5. **Cover art approved.** The 12 files in app/public/templates exist, but the CMO review says art approval (B10) is open. Design/CMO must approve the three covers used here, and the IP vision-check log entry must exist.
6. **Books gate.** Board 2 depends on the Nov 13 books go/no-go. Pins 07 to 09 are idea content, pin 10 is an offer-like pin and waits until Nov 14. If no-go, set the board to secret.
7. **No invite-only or availability wording** in any pin or board until the CMO confirms it. No prices, dates or "order by" lines.
8. **Hanukkah read-through** by someone who celebrates, before pins 11 to 14.
9. **Pinterest save button.** Do not load pinit.js; no Rich Pins until product pages and Product schema exist (playbook section 2).
10. **Alt text** on every pin (one plain sentence). Description text in this file is final only after the owner has read it; counts: titles under 100 characters, descriptions under 500, 3 hashtags at most.
11. **Comments.** Delete any comment that shares a child's full name, school or location and tell the poster why (playbook section 3).
12. **Keywords are guesses.** No Pinterest Trends or search-volume data was available. Review saves and outbound clicks after week 2 and replace the weakest pins.
