import type { CardDraft } from "./draft";
import { OCCASION_LABELS, RELATIONSHIPS, TONE_LABELS, ideaSuggestions, QUESTIONS, type RequiredField } from "./fields";
import { PICKER_STYLES } from "./knowledge/styles/picker.generated";
import { recommendFrom } from "./knowledge/styles/recommend-core";
import { nextField } from "./draft";

/** Chip suggestions shown under the guide bubble for the field being asked. Free text is always accepted. */
export function quickRepliesFor(field: RequiredField | null, d: CardDraft): string[] {
  switch (field) {
    case "relationship": return [...RELATIONSHIPS];
    case "occasion": return Object.values(OCCASION_LABELS);
    case "tone": return Object.values(TONE_LABELS);
    case "artStyle":
      // Top recommendations for this card, by name. The full browsable list is the style picker.
      return recommendFrom(PICKER_STYLES, { product: "card", occasion: d.occasion, tone: d.tone, limit: 5 }).map((r) => r.name);
    case "idea": return ideaSuggestions(d.occasion);
    case "message": return ["Write it for me", "I'll write it"];
    default: return [];
  }
}


export function openingTurn(draft: CardDraft): { reply: string; next: RequiredField | null; quickReplies: string[] } {
  const next = nextField(draft);
  return {
    reply: next ? `Hi, I'm your Greet Guide, an AI. Let's make a card. ${QUESTIONS[next]}` : "Your card is ready for a preview.",
    next,
    quickReplies: quickRepliesFor(next, draft),
  };
}
