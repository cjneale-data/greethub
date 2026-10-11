import type { KbDoc } from "./types";
import { STYLE_KB_DOCS } from "./styles/docs.generated";

/**
 * Seed knowledge base for the Greet Guide: occasion tips, sample messages, style presets, format constraints.
 * Source material: docs/cmo/templates.md and docs/cmo/intake-questions.md. Retrieval is grounding only;
 * it never fills a required field by itself.
 */
export const KB_DOCS: KbDoc[] = [
  /* ---- occasion tips ---- */
  { id: "tip-birthday", kind: "occasion_tip", occasion: "birthday", title: "Birthday cards", text: "Birthday cards work best with one clear visual joke or one specific detail: the cake with too many candles, their favorite place, a hobby they can't stop talking about. Funny leans on exaggeration. Heartfelt leans on one real memory. Keep the message to two or three sentences and end on a wish." },
  { id: "tip-thank_you", kind: "occasion_tip", occasion: "thank_you", title: "Thank-you cards", text: "Name the specific thing the person did and what it made possible. Specific beats effusive. A flower bunch, a cup of tea or a small token makes a warm front. Keep it short and sincere." },
  { id: "tip-wedding", kind: "occasion_tip", occasion: "wedding", title: "Wedding cards", text: "Wedding cards suit calm, elegant art with open space: botanical sprigs, two olive branches, soft washes. Keep the message warm and brief, name both people, and wish them a particular thing such as laughter at the dinner table." },
  { id: "tip-anniversary", kind: "occasion_tip", occasion: "anniversary", title: "Anniversary cards", text: "Anniversary cards land when they name the number of years or one small ritual only the two of them share, like Sunday pancakes. Elegant ink and wash styles suit grown-up anniversaries. Keep the message personal and unhurried." },
  { id: "tip-new_baby", kind: "occasion_tip", occasion: "new_baby", title: "New baby cards", text: "New baby cards want soft pastel art: a sleeping fox in a crescent moon, tiny shoes, clouds and stars. Keep the tone sweet and simple. Mention the baby's name if the parents have shared it, and wish the parents rest as well as joy." },
  { id: "tip-get_well", kind: "occasion_tip", occasion: "get_well", title: "Get well cards", text: "Get well cards can be funny if the friendship is, such as a glum bear in pajamas with a huge mug of soup. Never promise recovery dates. Offer something concrete like a visit or a meal. Keep it light and short." },
  { id: "tip-congratulations", kind: "occasion_tip", occasion: "congratulations", title: "Congratulations cards", text: "Congratulations cards celebrate the effort as much as the result. Name what they did, bold flat colors and confetti suit the mood, and one line of pride beats three of generic cheer." },
  { id: "tip-mothers_day", kind: "occasion_tip", occasion: "mothers_day", title: "Mother's Day cards", text: "Mother's Day cards are strongest with one specific memory or habit: her tea, her garden, the thing she says. Layered paper flowers and warm washes are popular. Skip generic poetry and say one real thing." },
  { id: "tip-fathers_day", kind: "occasion_tip", occasion: "fathers_day", title: "Father's Day cards", text: "Father's Day cards work with gentle humor about his habits: the grill, the car, the terrible jokes. Bold cartoon styles suit funny cards. Heartfelt ones name one thing he taught you." },
  { id: "tip-valentines", kind: "occasion_tip", occasion: "valentines", title: "Valentine's Day cards", text: "Valentine's cards read best when they reference something only the two of you share. Keep it playful or quietly warm, and avoid cliche poetry. Ink and wash or watercolor suit romantic cards." },
  { id: "tip-christmas", kind: "occasion_tip", occasion: "christmas", title: "Christmas cards", text: "Christmas cards suit cozy lamplit scenes: a snowy cabin, a lit tree, footprints in snow. Rich plum, amber and green palettes read as Christmas without any text. Keep the message to a warm wish for the year ahead." },
  { id: "tip-graduation", kind: "occasion_tip", occasion: "graduation", title: "Graduation cards", text: "Graduation cards celebrate the work and look ahead. Paper collage and bold flat styles feel modern. Mention one thing they pushed through, then one thing you are excited to see next." },
  { id: "tip-sympathy", kind: "occasion_tip", occasion: "sympathy", title: "Sympathy cards", text: "Sympathy cards use gentle, plain words and calm art such as soft botanicals in ink and wash. Say you are thinking of them, name the person who has died if you knew them, offer something specific and small. Avoid platitudes and avoid inspirational slogans. No jokes." },
  { id: "tip-just_because", kind: "occasion_tip", occasion: "just_because", title: "Just because cards", text: "Just because cards can be about anything. Pick one detail the person loves, then say plainly why you are thinking of them. These are often the cards people keep." },
  { id: "tip-other", kind: "occasion_tip", occasion: "other", title: "Other occasions", text: "For an occasion without a preset, ask what happened and who the card is for, then match the tone: funny for milestones with friends, heartfelt for family, calm for hard moments." },

  /* ---- sample messages ---- */
  { id: "msg-birthday-funny", kind: "sample_message", occasion: "birthday", tone: "funny", title: "Birthday, funny", text: "Happy birthday, {name}. We saved you the biggest slice, and we did not count the candles. Please don't ask us to." },
  { id: "msg-birthday-heartfelt", kind: "sample_message", occasion: "birthday", tone: "heartfelt", title: "Birthday, heartfelt", text: "Happy birthday, {name}. Every year with you has been better than the one before. Here's to another one." },
  { id: "msg-thank_you-heartfelt", kind: "sample_message", occasion: "thank_you", tone: "heartfelt", title: "Thank you, heartfelt", text: "{name}, thank you. You didn't have to, and you did anyway. It made a real difference, and I won't forget it." },
  { id: "msg-thank_you-funny", kind: "sample_message", occasion: "thank_you", tone: "funny", title: "Thank you, funny", text: "{name}, you are officially a legend. I'd say I owe you one, but we both know it's more like twelve. Thank you." },
  { id: "msg-wedding-heartfelt", kind: "sample_message", occasion: "wedding", tone: "heartfelt", title: "Wedding, heartfelt", text: "{name}, congratulations. May your home be full of laughter, good food and the kind of quiet that only comes from loving someone well." },
  { id: "msg-anniversary-heartfelt", kind: "sample_message", occasion: "anniversary", tone: "heartfelt", title: "Anniversary, heartfelt", text: "Happy anniversary, {name}. Still the best part of my day. Here's to many more ordinary Sundays with you." },
  { id: "msg-new_baby-heartfelt", kind: "sample_message", occasion: "new_baby", tone: "heartfelt", title: "New baby, heartfelt", text: "Welcome to the world, little one. {name}, we're so happy for you. Get some sleep when you can, and call us for anything." },
  { id: "msg-get_well-funny", kind: "sample_message", occasion: "get_well", tone: "funny", title: "Get well, funny", text: "{name}, get well soon. The soup is on me, and the blanket fort is waiting. Please come back before I run out of jokes." },
  { id: "msg-get_well-heartfelt", kind: "sample_message", occasion: "get_well", tone: "heartfelt", title: "Get well, heartfelt", text: "Thinking of you, {name}. Rest as much as you need. I'll be round with dinner this week, no need to answer the door." },
  { id: "msg-congratulations-heartfelt", kind: "sample_message", occasion: "congratulations", tone: "heartfelt", title: "Congratulations, heartfelt", text: "{name}, you did it. I watched how hard you worked for this, and I'm so proud of you. Go celebrate." },
  { id: "msg-mothers_day-heartfelt", kind: "sample_message", occasion: "mothers_day", tone: "heartfelt", title: "Mother's Day, heartfelt", text: "Happy Mother's Day, {name}. Thank you for everything you do that nobody notices. I notice. I love you." },
  { id: "msg-fathers_day-funny", kind: "sample_message", occasion: "fathers_day", tone: "funny", title: "Father's Day, funny", text: "Happy Father's Day, {name}. Thanks for the terrible jokes. I've started telling them myself, which is your fault." },
  { id: "msg-christmas-heartfelt", kind: "sample_message", occasion: "christmas", tone: "heartfelt", title: "Christmas, heartfelt", text: "Merry Christmas, {name}. Wishing you a warm house, a full table and a really good year ahead." },
  { id: "msg-graduation-heartfelt", kind: "sample_message", occasion: "graduation", tone: "heartfelt", title: "Graduation, heartfelt", text: "Congratulations, {name}. All those late nights paid off. We can't wait to see what you do next." },
  { id: "msg-sympathy-heartfelt", kind: "sample_message", occasion: "sympathy", tone: "heartfelt", title: "Sympathy, heartfelt", text: "{name}, I'm so sorry for your loss. I'm thinking of you. I'll call this week, and I'm here whenever you want company or quiet." },
  { id: "msg-just_because-heartfelt", kind: "sample_message", occasion: "just_because", tone: "heartfelt", title: "Just because, heartfelt", text: "{name}, no reason, I just wanted you to know I'm thinking of you and I'm glad you're in my life." },
  { id: "msg-just_because-funny", kind: "sample_message", occasion: "just_because", tone: "funny", title: "Just because, funny", text: "{name}, this card has no occasion. I'm just that kind of person. You're welcome." },


  /* ---- format, print and guardrail constraints ---- */
  { id: "fmt-size", kind: "format", title: "Card size and message length", text: "The card is a folded 5 by 7 inch card with the illustration on the front and the message inside. The inside message fits about 60 words at default type size; over 400 characters is too long. A short message of two or three sentences reads best." },
  { id: "fmt-art", kind: "format", title: "What the picture can show", text: "The picture can show a memory, a place, an animal, an object or a scene. It never contains words or letters, since typography is added separately. Guest cards are text-only: no photos of people." },
  { id: "fmt-guardrail", kind: "format", title: "Characters and public figures", text: "Copyrighted characters and brands are rewritten to generic descriptions: a friendly raccoon instead of a named cartoon raccoon. Real public figures are not drawn; describe what you like about them instead." },
  { id: "fmt-delivery", kind: "format", title: "Mailed or digital", text: "Cards can be mailed to the buyer, mailed straight to the recipient, or sent as a digital card. Delivery and address are collected at checkout, after the preview." },

  /* ---- art styles: generated from docs/design/style-library.json by docs/design/tools/build-knowledge.mjs ---- */
  ...STYLE_KB_DOCS,
];
