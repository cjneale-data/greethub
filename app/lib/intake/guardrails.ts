/**
 * Content guardrails for the card creator. Pure functions, safe on client and server.
 * Wording is from docs/cmo/intake-questions.md section 4. The server re-runs everything; the client runs it
 * only to give feedback sooner.
 *
 * Sensitive-content moderation here is a rule-based first pass. The IP check (characters, brands, slogans, public figures)
 * lives in lib/safety and is data-driven; the server routes add the model-based screen on top (lib/safety/server.ts).
 */
import type { CardDraft } from "./draft";
import { fastScreen } from "../safety/fastpass";
import type { Detected, IpField } from "../safety/types";

export const SENSITIVE_MESSAGE =
  "That's not something I can make. I can do a card that's kind, funny or sweet. Want to try a different idea?";
export { PUBLIC_FIGURE_NOTE as PUBLIC_FIGURE_MESSAGE } from "../safety/fastpass";

/** Shown after a rewrite so the customer can edit instead of accepting (the rewrite has already been applied). */
export const REWRITE_CHIPS = ["I'll rephrase"] as const;
export const PHOTO_GUEST_MESSAGE = "Photos of people stay private, so we need an account. Make a free account to add photos.";

/* ---------- sensitive content ---------- */

// Grief vocabulary (died, passed away, loss) is deliberately NOT here: sympathy cards are fully supported.
const SENSITIVE: RegExp[] = [
  /\b(kill|murder|stab|shoot|strangle|torture)\s+(him|her|them|you|yourself|myself|everyone|people)\b/i,
  /\bkys\b/i,
  /\bmurder(s|ed|er|ers|ing)?\b/i,
  /\b(rape|rapes|raped|rapist|molest\w*|pedophil\w*)\b/i,
  /\b(porn\w*|nude|nudes|naked|erotic|blowjob|handjob|orgasm|fetish)\b/i,
  /\b(slut|whore|nigger|faggot|retard(ed)?|kike|spic|chink)\b/i,
  /\b(nazi|nazis|white power|genocide|ethnic cleansing|jihad)\b/i,
  /\b(terroris[mt]s?|bomb(ing|ings)?|massacre|school shooting)\b/i,
  /\b(self[- ]?harm|suicide note|cut(ting)? myself|end my life|kill myself)\b/i,
  /\b(gore|dismember\w*|decapitat\w*)\b/i,
];

/* ---------- text checks ---------- */

export type TextVerdict =
  | { ok: true; text: string }
  | { ok: false; kind: "sensitive" | "public_figure"; message: string }
  | { ok: false; kind: "copyright"; message: string; rewritten: string; detected: Detected[] };

/** Strip control characters and cap runaway whitespace before anything reaches a model or a prompt. */
export function cleanText(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]{3,}/g, "  ").trim();
}

/** Sensitive-content check only (rules). Used on its own where the IP screen runs separately. */
export function checkSensitive(raw: string): TextVerdict {
  const text = cleanText(raw);
  if (SENSITIVE.some((re) => re.test(text))) return { ok: false, kind: "sensitive", message: SENSITIVE_MESSAGE };
  return { ok: true, text };
}

/**
 * Synchronous check with the free rules: sensitive content, then the IP first pass (docs/legal/07: same theme, different
 * characters). `nameLike` fields (first names, relationships) only get the sensitive check: "Elsa" can be a grandma.
 * A "copyright" verdict carries the rewritten text and a friendly one-line note as its message. Never claims the result is legally safe.
 */
export function checkText(raw: string, opts: { nameLike?: boolean; field?: IpField; knownNames?: string[] } = {}): TextVerdict {
  const base = checkSensitive(raw);
  if (!base.ok || opts.nameLike) return base;
  const r = fastScreen({ text: base.text, field: opts.field ?? "card_idea", knownNames: opts.knownNames });
  if (r.verdict === "blocked") return { ok: false, kind: "public_figure", message: r.userNote };
  if (r.verdict === "rewritten") return { ok: false, kind: "copyright", message: r.userNote, rewritten: r.safeText, detected: r.detected };
  return base;
}

export const TEXT_FIELDS = ["relationship", "recipientName", "occasionOther", "idea", "message", "insideJokes", "include", "avoid", "signoff"] as const;
export type DraftField = (typeof TEXT_FIELDS)[number];
/** Name-like fields only get the sensitive check: "Elsa" can be a grandma. */
export const NAME_LIKE_FIELDS: readonly DraftField[] = ["recipientName", "relationship", "signoff"];
/** IP-screen field kind for each draft field. */
export const DRAFT_IP_FIELD: Record<DraftField, IpField> = {
  relationship: "brief_field",
  recipientName: "brief_field",
  occasionOther: "brief_field",
  idea: "card_idea",
  message: "card_message",
  insideJokes: "card_idea",
  include: "card_idea",
  avoid: "card_idea",
  signoff: "card_message",
};

export type DraftVerdict = { ok: true } | { ok: false; field: DraftField; verdict: Exclude<TextVerdict, { ok: true }> };

/** Names the customer gave for real people, so a niece called Elsa is never treated as a character. */
export const knownNamesOf = (d: CardDraft): string[] => [d.recipientName, d.relationship].filter((x): x is string => !!x);

/** Check every free-text field in a draft with the free rules. First failure wins. */
export function checkDraft(d: CardDraft): DraftVerdict {
  const knownNames = knownNamesOf(d);
  for (const field of TEXT_FIELDS) {
    const v = d[field];
    if (!v) continue;
    const verdict = checkText(v, { nameLike: NAME_LIKE_FIELDS.includes(field), field: DRAFT_IP_FIELD[field], knownNames });
    if (!verdict.ok) return { ok: false, field, verdict };
  }
  return { ok: true };
}

/** Guest cards are text-only in v1: any photo reference is refused. */
export function guestPhotoViolation(input: { photoIds?: unknown; characters?: { photoIds?: unknown[] }[]; placePhotoIds?: unknown[] }): string | null {
  const has = (v: unknown) => Array.isArray(v) && v.length > 0;
  if (has(input.photoIds) || has(input.placePhotoIds) || input.characters?.some((c) => has(c.photoIds))) return PHOTO_GUEST_MESSAGE;
  return null;
}
