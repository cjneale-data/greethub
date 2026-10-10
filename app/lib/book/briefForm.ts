import { BookBriefSchema, MAX_CHARACTERS, type BookBrief } from "@greethub/shared";
import type { BriefForm, CharacterForm } from "./types";

export function newCharacterId(): string {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyBriefForm(): BriefForm {
  return {
    occasion: "",
    occasionOther: "",
    recipientName: "",
    relationship: "",
    tone: "",
    readingAge: "",
    pageCount: 24,
    artStyle: "",
    storyIdea: "",
    settingDetails: "",
    dedication: "",
    characters: [{ id: "c_first0001", name: "", ageBand: "", role: "", pronouns: "" }],
  };
}

export type FieldErrors = Record<string, string>;

export const isPet = (c: CharacterForm) => !!c.isPet || c.ageBand === "pet";

/** Maps the form onto the shared schema. `photoIds` come from uploads; consent is filled by the caller. */
export function formToBrief(
  f: BriefForm,
  photoIdsByCharacter: Record<string, string[]> = {},
  consent: { adultConfirmed: boolean; photoConsent: boolean; recordedAt?: string } = { adultConfirmed: true, photoConsent: true },
): unknown {
  const toChar = (c: CharacterForm) => ({
    name: c.name,
    ageBand: isPet(c) ? "pet" : c.ageBand,
    role: c.role,
    pronouns: c.pronouns || undefined,
    photoIds: photoIdsByCharacter[c.id] ?? [],
  });
  const people = f.characters.filter((c) => !isPet(c));
  const pet = f.characters.find(isPet);
  return {
    product: "book",
    occasion: f.occasion,
    occasionOther: f.occasion === "other" ? f.occasionOther : undefined,
    recipient: { name: f.recipientName, relationship: f.relationship },
    tone: f.tone,
    artStyle: f.artStyle,
    readingAge: f.readingAge,
    pageCount: f.pageCount,
    characters: people.map(toChar),
    pet: pet ? toChar(pet) : undefined,
    storyIdea: f.storyIdea,
    settingDetails: f.settingDetails || undefined,
    dedication: f.dedication || undefined,
    consent,
  };
}

const FRIENDLY: Record<string, string> = {
  occasion: "Pick the occasion.",
  tone: "Pick what kind of story.",
  artStyle: "Pick a look.",
  readingAge: "How old is the reader?",
  recipientName: "Just a first name or nickname is fine.",
  relationship: "Tell us who they are to you.",
  storyIdea: "Tell me a bit more: where does it happen, and what goes wrong or right?",
  characters: "Add at least one person.",
  occasionOther: "Tell me the occasion in a few words.",
};

function fieldKey(path: string, f: BriefForm): string {
  if (path.startsWith("recipient.name")) return "recipientName";
  if (path.startsWith("recipient.relationship")) return "relationship";
  const m = /^characters\.(\d+)\.(\w+)/.exec(path);
  if (m) {
    // the schema indexes the people-only list; the form indexes every row
    const people = f.characters.map((c, i) => ({ c, i })).filter((x) => !isPet(x.c));
    const row = people[Number(m[1])]?.i ?? Number(m[1]);
    return `characters.${row}.${m[2]}`;
  }
  const pm = /^pet\.(\w+)/.exec(path);
  if (pm) return `characters.${f.characters.findIndex(isPet)}.${pm[1]}`;
  return path.split(".")[0];
}

/** Validates the form as the step-1 gate. Keys are form field names; character rows use `characters.<row>.<field>`. */
export function validateBriefForm(f: BriefForm): { ok: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const res = BookBriefSchema.safeParse(formToBrief(f));
  if (!res.success) {
    for (const issue of res.error.issues) {
      const key = fieldKey(issue.path.join("."), f);
      if (errors[key]) continue;
      errors[key] = FRIENDLY[key] ?? (/^characters\.\d+\./.test(key) ? "Required" : issue.message);
    }
  }
  const seen = new Set<string>();
  f.characters.forEach((c, i) => {
    const k = c.name.trim().toLowerCase();
    if (k && seen.has(k)) errors[`characters.${i}.name`] = "Each character needs a different name.";
    seen.add(k);
  });
  const people = f.characters.filter((c) => !isPet(c));
  if (people.length > MAX_CHARACTERS) errors.characters = `Up to ${MAX_CHARACTERS} people, plus a pet.`;
  if (people.length === 0 && !errors.characters) errors.characters = FRIENDLY.characters;
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Full pipeline brief: form + uploaded photo ids + recorded consent. Throws if the schema rejects it. */
export function buildBookBrief(f: BriefForm, photoIdsByCharacter: Record<string, string[]>, recordedAt: string): BookBrief {
  return BookBriefSchema.parse(formToBrief(f, photoIdsByCharacter, { adultConfirmed: true, photoConsent: true, recordedAt }));
}
