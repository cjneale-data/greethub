import { OCCASIONS, STYLE_NAMES, TONES, resolveArtStyleId, type ArtStyleId } from "@greethub/shared";
import { PICKER_STYLES } from "./knowledge/styles/picker.generated";
import { recommendFrom } from "./knowledge/styles/recommend-core";

export type Occasion = (typeof OCCASIONS)[number];
export type Tone = (typeof TONES)[number];

/** Card brief fields in the order the Greet Guide asks them (docs/cmo/intake-questions.md section 2). */
export const REQUIRED_FIELDS = ["relationship", "recipientName", "occasion", "tone", "artStyle", "idea", "message"] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];
export const OPTIONAL_FIELDS = ["insideJokes", "include", "avoid", "insideIllustration", "signoff"] as const;
export type OptionalField = (typeof OPTIONAL_FIELDS)[number];
export type FieldKey = RequiredField | OptionalField;

/** `product` is always "card" here and counts as the first of eight required items on the progress bar. */
export const REQUIRED_COUNT = REQUIRED_FIELDS.length + 1;

export const RELATIONSHIPS = ["Mom", "Dad", "Partner", "Child", "Grandparent", "Friend", "Colleague", "Teacher", "Myself", "Someone else"] as const;

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: "Birthday",
  thank_you: "Thank you",
  wedding: "Wedding",
  anniversary: "Anniversary",
  new_baby: "New baby",
  get_well: "Get well",
  congratulations: "Congratulations",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines: "Valentine's Day",
  christmas: "Christmas",
  graduation: "Graduation",
  sympathy: "Sympathy",
  just_because: "Just because",
  other: "Something else",
};

export const TONE_LABELS: Record<Tone, string> = { funny: "Funny", heartfelt: "Heartfelt", adventurous: "Adventurous" };

/** Card styles for chips and lists. Generated data (docs/design/style-library.json); swatch holds hex values. */
export const STYLE_CARDS: { id: ArtStyleId; label: string; hint: string; swatch: string[] }[] = PICKER_STYLES.filter((s) => s.products.includes("card") && s.status === "stable").map((s) => ({
  id: s.id,
  label: s.name,
  hint: s.description,
  swatch: s.swatches.slice(0, 3),
}));
export const styleLabel = (id?: ArtStyleId | string) => {
  const canon = resolveArtStyleId(id);
  return canon ? (STYLE_NAMES[canon] ?? "") : "";
};

/** The picker's first suggestion for a card, from the style library's occasion and tone fit (docs/design/03-selection-guide.md). */
export function defaultStyle(occasion?: Occasion, tone?: Tone): ArtStyleId {
  return (recommendFrom(PICKER_STYLES, { product: "card", occasion, tone, limit: 1 })[0]?.styleId ?? "watercolor_wash") as ArtStyleId;
}

/** Exact question wording from the CMO question bank. */
export const QUESTIONS: Record<RequiredField, string> = {
  relationship: "Who's it for?",
  recipientName: "What's their first name?",
  occasion: "What's the occasion?",
  tone: "What should it feel like?",
  artStyle: "Pick a look.",
  idea: "What should the picture show? A memory, a place, something they love, anything.",
  message: "What do you want to say inside? I can write it, or you can.",
};

export const FIELD_LABELS: Record<FieldKey, string> = {
  relationship: "Who for",
  recipientName: "Name",
  occasion: "Occasion",
  tone: "Tone",
  artStyle: "Style",
  idea: "Picture",
  message: "Message",
  insideJokes: "Inside jokes",
  include: "Include",
  avoid: "Leave out",
  insideIllustration: "Inside drawing",
  signoff: "Sign-off",
};

const IDEA_SUGGESTIONS: Partial<Record<Occasion, string[]>> & { default: string[] } = {
  birthday: ["A giant lopsided cake with too many candles", "Their favorite place at golden hour", "Something they collect or love to do"],
  new_baby: ["A sleeping fox curled in a crescent moon", "Tiny shoes on a windowsill", "Soft clouds with a little star"],
  thank_you: ["A bunch of wildflowers in a jug", "A cup of tea on a sunny table", "A cut-paper sun with a big smile"],
  default: ["A memory the two of you share", "A place they love", "Something they are always doing"],
};
export const ideaSuggestions = (o?: Occasion) => (o && IDEA_SUGGESTIONS[o]) || IDEA_SUGGESTIONS.default;

export const LIMITS = {
  relationship: [1, 40],
  recipientName: [1, 40],
  occasionOther: [1, 60],
  idea: [5, 500],
  message: [1, 400],
  insideJokes: [0, 300],
  include: [0, 200],
  avoid: [0, 200],
  signoff: [0, 40],
} as const;

export const NAME_PATTERN = /^[\p{L}][\p{L}\p{M} '’-]*$/u;
