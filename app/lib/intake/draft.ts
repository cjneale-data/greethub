import { ArtStyleField, CardBriefSchema, CardWritingSchema, OCCASIONS, TONES, type ArtStyleId, type CardBrief, type CardWritingInput } from "@greethub/shared";
import { z } from "zod";
import {
  LIMITS, NAME_PATTERN, OCCASION_LABELS, QUESTIONS, REQUIRED_COUNT, REQUIRED_FIELDS,
  type FieldKey, type Occasion, type RequiredField, type Tone,
} from "./fields";

export type FieldSource = "chat" | "form" | "template" | "people" | "rag";

/** Flat, UI-friendly draft of a card brief. `toCardBrief` maps it onto the shared CreationBrief schema. */
export type CardDraft = {
  relationship?: string;
  recipientName?: string;
  occasion?: Occasion;
  occasionOther?: string;
  tone?: Tone;
  artStyle?: ArtStyleId;
  idea?: string;
  message?: string;
  insideJokes?: string;
  include?: string;
  avoid?: string;
  insideIllustration?: boolean;
  signoff?: string;
  /** Handwritten message and signature (packages/shared/src/handwriting.ts). */
  writing?: CardWritingInput;
  optionalDone?: boolean;
  sources?: Partial<Record<FieldKey, FieldSource>>;
};

export const emptyDraft = (): CardDraft => ({});

/** Zod shape for anything arriving over the wire (chat tool calls, form posts). Strings are trimmed and length-capped. */
const str = (max: number) => z.string().trim().max(max);
export const CardDraftSchema = z.object({
  relationship: str(LIMITS.relationship[1]).optional(),
  recipientName: str(LIMITS.recipientName[1]).optional(),
  occasion: z.enum(OCCASIONS).optional(),
  occasionOther: str(LIMITS.occasionOther[1]).optional(),
  tone: z.enum(TONES).optional(),
  artStyle: ArtStyleField.optional(),
  idea: str(LIMITS.idea[1]).optional(),
  message: str(LIMITS.message[1]).optional(),
  insideJokes: str(LIMITS.insideJokes[1]).optional(),
  include: str(LIMITS.include[1]).optional(),
  avoid: str(LIMITS.avoid[1]).optional(),
  insideIllustration: z.boolean().optional(),
  signoff: str(LIMITS.signoff[1]).optional(),
  writing: CardWritingSchema.optional(),
  optionalDone: z.boolean().optional(),
  sources: z.record(z.string(), z.enum(["chat", "form", "template", "people", "rag"])).optional(),
});

/* ---------- field validation (messages are the CMO's "if invalid" wording) ---------- */

export function validateField(field: RequiredField, d: CardDraft): string | null {
  const len = (v: string | undefined, [min, max]: readonly [number, number]) => {
    const n = (v ?? "").trim().length;
    return n >= min && n <= max;
  };
  switch (field) {
    case "relationship":
      return len(d.relationship, LIMITS.relationship) && d.relationship!.trim() !== "Someone else" ? null : "Pick one, or tell me who they are.";
    case "recipientName":
      return len(d.recipientName, LIMITS.recipientName) && NAME_PATTERN.test(d.recipientName!.trim()) ? null : "Just a first name or nickname is fine.";
    case "occasion":
      if (!d.occasion) return "Tell me the occasion in a few words.";
      if (d.occasion === "other" && !len(d.occasionOther, LIMITS.occasionOther)) return "Tell me the occasion in a few words.";
      return null;
    case "tone":
      return d.tone ? null : "Pick a tone.";
    case "artStyle":
      return d.artStyle ? null : "Pick a look.";
    case "idea":
      return len(d.idea, LIMITS.idea) ? null : "A sentence or two is plenty.";
    case "message":
      if (len(d.message, LIMITS.message)) return null;
      return (d.message ?? "").trim().length > LIMITS.message[1] ? "That's a lot for a card. Trim it to about 60 words, or shorten for me?" : "Add the words for inside.";
  }
}

export type MissingItem = { field: RequiredField; question: string; error: string };

/** Required fields not yet valid, in asking order. Empty means the draft is complete. */
export function missingRequired(d: CardDraft): MissingItem[] {
  return REQUIRED_FIELDS.flatMap((field) => {
    const error = validateField(field, d);
    return error ? [{ field, question: QUESTIONS[field], error }] : [];
  });
}

export function nextField(d: CardDraft): RequiredField | null {
  return missingRequired(d)[0]?.field ?? null;
}

/** "{n} of 8 done". Product counts as done. */
export function progress(d: CardDraft): { done: number; total: number; percent: number; label: string } {
  const done = REQUIRED_COUNT - missingRequired(d).length;
  return { done, total: REQUIRED_COUNT, percent: Math.round((done / REQUIRED_COUNT) * 100), label: `${done} of ${REQUIRED_COUNT} done` };
}

const HINTS: Record<RequiredField, string> = {
  relationship: "Add a recipient to continue.",
  recipientName: "Add their name to continue.",
  occasion: "Pick an occasion to continue.",
  tone: "Pick a tone to continue.",
  artStyle: "Pick a look to continue.",
  idea: "Say what the picture should show.",
  message: "Add the words for inside.",
};
/** Hint for the disabled primary button, naming the first thing missing. */
export function disabledHint(d: CardDraft): string | null {
  const first = missingRequired(d)[0];
  return first ? HINTS[first.field] : null;
}

/* ---------- mapping to the shared schema ---------- */

const splitList = (v?: string) =>
  (v ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

/** What goes inside the card: the message, then the sign-off on its own line unless the message already ends with it. */
export function insideText(d: CardDraft): string {
  const msg = (d.message ?? "").trim();
  const sign = (d.signoff ?? "").trim();
  if (!msg || !sign) return msg;
  if (msg.replace(/[.!,\s]+$/, "").toLowerCase().endsWith(sign.toLowerCase())) return msg;
  return `${msg}\n\n${sign}`;
}

/**
 * Merge a guide reply into the live draft. `sent` is the draft the request carried, `cur` is the draft now (form edits may
 * have happened while the guide was thinking). Only fields the server actually changed overwrite `cur`.
 */
export function mergeServerDraft(sent: CardDraft, cur: CardDraft, server: CardDraft): CardDraft {
  const next: CardDraft = { ...cur, sources: { ...(cur.sources ?? {}) } };
  const keys = new Set([...Object.keys(sent), ...Object.keys(server)].filter((k) => k !== "sources")) as Set<keyof CardDraft>;
  for (const k of keys) {
    if (JSON.stringify(server[k]) === JSON.stringify(sent[k])) continue;
    if (server[k] === undefined) delete next[k];
    else (next as Record<string, unknown>)[k] = server[k];
    const src = server.sources?.[k as FieldKey];
    if (src) next.sources![k as FieldKey] = src;
  }
  return next;
}

/** Preview-time brief: delivery defaults to an e-card. Mailed delivery and ship-to are collected at checkout. */
export function toCardBrief(d: CardDraft): { ok: true; brief: CardBrief } | { ok: false; missing: MissingItem[] } {
  const missing = missingRequired(d);
  if (missing.length) return { ok: false, missing };
  const parsed = CardBriefSchema.safeParse({
    product: "card",
    occasion: d.occasion,
    occasionOther: d.occasion === "other" ? d.occasionOther : undefined,
    recipient: { name: d.recipientName, relationship: d.relationship },
    tone: d.tone,
    artStyle: d.artStyle,
    storyIdea: d.idea,
    messageWording: insideText(d),
    insideJokes: d.insideJokes || undefined,
    include: splitList(d.include),
    avoid: splitList(d.avoid),
    insideIllustration: !!d.insideIllustration,
    writing: d.writing,
    delivery: "ecard",
  });
  if (parsed.success) return { ok: true, brief: parsed.data };
  return { ok: false, missing: parsed.error.issues.map((i) => ({ field: "message" as RequiredField, question: "", error: i.message })) };
}

export const isComplete = (d: CardDraft) => toCardBrief(d).ok;

/** Merge a patch into a draft. Undefined values are ignored; an empty string clears an optional text field. */
export function applyPatch(d: CardDraft, patch: Partial<CardDraft>, source: FieldSource = "chat"): CardDraft {
  const next: CardDraft = { ...d, sources: { ...(d.sources ?? {}) } };
  for (const k of Object.keys(patch) as (keyof CardDraft)[]) {
    if (k === "sources") continue;
    const v = patch[k];
    if (v === undefined) continue;
    (next as Record<string, unknown>)[k] = v;
    if (k !== "optionalDone") next.sources![k as FieldKey] = source;
  }
  if (patch.occasion && patch.occasion !== "other") delete next.occasionOther;
  return next;
}

export function describeOccasion(d: CardDraft): string {
  if (!d.occasion) return "";
  return d.occasion === "other" ? (d.occasionOther ?? "Something else") : OCCASION_LABELS[d.occasion];
}
