import { ART_STYLES, OCCASIONS, TONES, type ArtStyleId } from "@greethub/shared";

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

export const RELATIONSHIPS = ["Mum", "Dad", "Partner", "Child", "Grandparent", "Friend", "Colleague", "Teacher", "Myself", "Someone else"] as const;

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

/** Display data for the style picker. `swatch` entries are brand token names, not hex values. */
export const STYLE_CARDS: { id: ArtStyleId; label: string; hint: string; swatch: [string, string, string] }[] = [
  { id: "watercolor", label: "Soft Watercolor", hint: "Warm, gentle, picture-book soft", swatch: ["--gh-blush", "--gh-cream", "--gh-persimmon-tint"] },
  { id: "bold_flat", label: "Bold Cartoon Pop", hint: "Thick lines, bright flat color", swatch: ["--gh-marigold", "--gh-persimmon", "--gh-plum"] },
  { id: "storybook_3d", label: "Cozy Storybook", hint: "Lamplit, rich and rounded", swatch: ["--gh-plum", "--gh-marigold", "--gh-cream"] },
  { id: "paper_cut", label: "Paper Cut Collage", hint: "Layered shapes, mid-century", swatch: ["--gh-persimmon", "--gh-marigold", "--gh-blush"] },
  { id: "storybook_ink", label: "Ink and Wash", hint: "Fine lines, loose color, calm", swatch: ["--gh-twine", "--gh-blush", "--gh-cocoa-40"] },
  { id: "crayon", label: "Crayon and Pencil", hint: "Homemade, wobbly and joyful", swatch: ["--gh-marigold", "--gh-blush", "--gh-twine"] },
];
export const styleLabel = (id?: ArtStyleId) => (id ? (STYLE_CARDS.find((s) => s.id === id)?.label ?? ART_STYLES[id]?.label ?? "") : "");

/** docs/cmo/templates.md "defaults by occasion and tone", mapped onto the schema's style ids. */
export function defaultStyle(occasion?: Occasion, tone?: Tone): ArtStyleId {
  if (occasion === "birthday" && tone === "funny") return "bold_flat";
  if (occasion === "wedding" || occasion === "anniversary" || occasion === "sympathy") return "storybook_ink";
  if (occasion === "christmas" || tone === "adventurous") return "storybook_3d";
  if (occasion === "thank_you" || occasion === "graduation") return "paper_cut";
  if (occasion === "get_well" && tone === "funny") return "bold_flat";
  return "watercolor";
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
