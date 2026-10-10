import { z } from "zod";
import { ART_STYLE_IDS } from "./styles";

/* ---------- structured fields (chips, pickers, forms) ---------- */

export const OCCASIONS = [
  "birthday", "thank_you", "wedding", "anniversary", "new_baby", "get_well", "congratulations",
  "mothers_day", "fathers_day", "valentines", "christmas", "graduation", "sympathy", "just_because", "other",
] as const;
export const TONES = ["funny", "heartfelt", "adventurous"] as const;
export const READING_AGES = ["0-2", "3-5", "6-8"] as const;
export const AGE_BANDS = ["baby", "toddler", "child", "teen", "adult", "senior", "pet"] as const;
export const CARD_DELIVERY = ["print_mail", "ecard", "pdf"] as const;
export const BOOK_PAGE_COUNTS = [24, 32] as const;
export const MAX_CHARACTERS = 4;

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "Required").max(max);

export const AddressSchema = z.object({
  name: required(120),
  line1: required(200),
  line2: text(200).optional(),
  city: required(100),
  region: required(100),
  postalCode: required(20),
  country: z.string().length(2, "Use a 2-letter country code").toUpperCase(),
  phone: text(30).optional(),
});
export type Address = z.infer<typeof AddressSchema>;

export const CharacterSchema = z.object({
  name: required(60),
  ageBand: z.enum(AGE_BANDS),
  role: required(80), // e.g. "birthday girl", "big brother", "Grandma"
  pronouns: text(30).optional(), // as the user gives them, free text
  /** Upload ids (private storage) of reference photos for this character. */
  photoIds: z.array(z.string().min(1)).max(4).default([]),
  /** Saved "Person" to reuse an approved character sheet. */
  personId: z.string().optional(),
});
export type Character = z.infer<typeof CharacterSchema>;

export const RecipientSchema = z.object({
  name: required(60),
  relationship: required(60),
});

/* ---------- unstructured fields (free text and uploads) ---------- */

const UnstructuredShape = {
  storyIdea: text(2000).optional(),
  memory: text(2000).optional(),
  insideJokes: text(1000).optional(),
  messageWording: text(1200).optional(),
  settingDetails: text(800).optional(),
  include: z.array(text(120)).max(20).default([]),
  avoid: z.array(text(120)).max(20).default([]),
  /** Upload ids of place or object photos (people photos live on characters). */
  placePhotoIds: z.array(z.string().min(1)).max(6).default([]),
};

const CommonShape = {
  schemaVersion: z.literal(1).default(1),
  occasion: z.enum(OCCASIONS),
  occasionOther: text(80).optional(),
  recipient: RecipientSchema,
  tone: z.enum(TONES),
  artStyle: z.enum(ART_STYLE_IDS),
  characters: z.array(CharacterSchema).max(MAX_CHARACTERS).default([]),
  /** Optional pet, kept apart from the 1-4 human main characters so limits stay clear. */
  pet: CharacterSchema.optional(),
  shipTo: AddressSchema.optional(),
  /** ISO date YYYY-MM-DD the item should arrive by. */
  deliveryDate: z.iso.date().optional(),
  ...UnstructuredShape,
};

const occasionOtherCheck = (b: { occasion: string; occasionOther?: string }, ctx: z.RefinementCtx) => {
  if (b.occasion === "other" && !b.occasionOther?.trim()) {
    ctx.addIssue({ code: "custom", path: ["occasionOther"], message: "Tell us the occasion" });
  }
};

/* ---------- card ---------- */

export const CardBriefBase = z.object({
  ...CommonShape,
  product: z.literal("card"),
  delivery: z.enum(CARD_DELIVERY),
  mailTo: z.enum(["buyer", "recipient"]).optional(),
  insideIllustration: z.boolean().default(false),
});

const cardRules = (b: z.infer<typeof CardBriefBase>, ctx: z.RefinementCtx) => {
  occasionOtherCheck(b, ctx);
  if (!b.messageWording?.trim() && !b.memory?.trim() && !b.storyIdea?.trim()) {
    ctx.addIssue({ code: "custom", path: ["messageWording"], message: "Give us the message or a memory to build it from" });
  }
  if (b.delivery === "print_mail") {
    if (!b.shipTo) ctx.addIssue({ code: "custom", path: ["shipTo"], message: "Ship-to address required for printed cards" });
    if (!b.mailTo) ctx.addIssue({ code: "custom", path: ["mailTo"], message: "Choose who receives the card" });
  }
};
export const CardBriefSchema = CardBriefBase.superRefine(cardRules);

/* ---------- picture book ---------- */

export const BookBriefBase = z.object({
  ...CommonShape,
  product: z.literal("book"),
  readingAge: z.enum(READING_AGES),
  pageCount: z.union([z.literal(24), z.literal(32)]),
  characters: z.array(CharacterSchema).min(1, "At least one main character").max(MAX_CHARACTERS),
  storyIdea: z.string().trim().min(10, "Describe the story in a sentence or two").max(2000),
  dedication: text(300).optional(),
  /** Photos of minors: only from a signed-in adult who ticks consent. */
  consent: z.object({
    adultConfirmed: z.literal(true, { error: "Confirm you are an adult" }),
    photoConsent: z.literal(true, { error: "Consent to use these photos is required" }),
    recordedAt: z.iso.datetime().optional(),
  }),
});
export const BookBriefSchema = BookBriefBase.superRefine(occasionOtherCheck);

/* ---------- union + helpers ---------- */

export const CreationBriefSchema = z.discriminatedUnion("product", [CardBriefBase, BookBriefBase]).superRefine((b, ctx) => {
  if (b.product === "card") cardRules(b, ctx);
  else occasionOtherCheck(b, ctx);
});

export type CardBrief = z.infer<typeof CardBriefSchema>;
export type BookBrief = z.infer<typeof BookBriefSchema>;
export type CreationBrief = CardBrief | BookBrief;
export type CreationBriefInput = z.input<typeof CreationBriefSchema>;

/** A partially filled brief, as the chat intake and forms build it up. Only `product` is needed to know which fields apply. */
export type BriefDraft = { product: "card" | "book" } & Record<string, unknown>;

export type MissingField = { path: string; message: string };

/** Fields still needed before generation may run. Empty array means the draft is a complete, valid brief. */
export function missingFields(draft: BriefDraft): MissingField[] {
  const res = CreationBriefSchema.safeParse(draft);
  if (res.success) return [];
  const seen = new Set<string>();
  const out: MissingField[] = [];
  for (const issue of res.error.issues) {
    const path = issue.path.join(".");
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ path, message: issue.message });
  }
  return out;
}

export function isReadyToGenerate(draft: BriefDraft): boolean {
  return missingFields(draft).length === 0;
}

/** Story spreads in a book: title page + N text/art spreads + The End = pageCount (24 -> 11, 32 -> 15). */
export function bookSpreads(pageCount: 24 | 32): number {
  return (pageCount - 2) / 2;
}

/** Image renders a finished brief will cost, before re-rolls: used for pricing and spend caps. */
export function plannedRenders(brief: CreationBrief): { modelSheet: number; pages: number; total: number } {
  if (brief.product === "card") {
    const pages = brief.insideIllustration ? 2 : 1;
    return { modelSheet: 1, pages, total: 1 + pages };
  }
  // one art page per spread, plus front and back cover
  const pages = bookSpreads(brief.pageCount) + 2;
  return { modelSheet: 1, pages, total: 1 + pages };
}
