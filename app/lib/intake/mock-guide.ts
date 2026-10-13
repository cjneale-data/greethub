import type { CardDraft } from "./draft";
import { applyPatch, describeOccasion, missingRequired, nextField } from "./draft";
import {
  OCCASION_LABELS, QUESTIONS, RELATIONSHIPS, STYLE_CARDS, TONE_LABELS,
  type Occasion, type RequiredField, type Tone,
} from "./fields";
import { fillTemplate, getKnowledgeBase } from "./knowledge/bm25";
import { findStyleInText } from "./knowledge/styles/find-style";
import { quickRepliesFor } from "./quick-replies";

/** Deterministic Greet Guide used in mock mode and as the fallback when a live call fails. No network. */

const REL_WORDS: [RegExp, string][] = [
  [/\b(mum|mom|mother|mummy|mommy|mama)\b/i, "Mom"],
  [/\b(dad|father|daddy|papa)\b/i, "Dad"],
  [/\b(wife|husband|partner|girlfriend|boyfriend|fianc[eé]e?|spouse)\b/i, "Partner"],
  [/\b(son|daughter|child|kid|baby)\b/i, "Child"],
  [/\b(grandma|grandpa|grandmother|grandfather|nan|nana|nonna|nonno|gran|granny|grandparent)\b/i, "Grandparent"],
  [/\b(friend|bestie|mate|buddy)\b/i, "Friend"],
  [/\b(colleague|coworker|co-worker|boss|manager)\b/i, "Colleague"],
  [/\bteacher\b/i, "Teacher"],
  [/\b(myself|me)\b/i, "Myself"],
];
const OCC_WORDS: [RegExp, Occasion][] = [
  [/\bbirthday|bday\b/i, "birthday"],
  [/\bthank/i, "thank_you"],
  [/\bwedding\b/i, "wedding"],
  [/\banniversary\b/i, "anniversary"],
  [/\bnew baby|newborn|baby shower|just had a baby|new arrival\b/i, "new_baby"],
  [/\bget well|feel better|recover\b/i, "get_well"],
  [/\bcongrat/i, "congratulations"],
  [/\bmother'?s day\b/i, "mothers_day"],
  [/\bfather'?s day\b/i, "fathers_day"],
  [/\bvalentine/i, "valentines"],
  [/\bchristmas|xmas\b/i, "christmas"],
  [/\bgraduat/i, "graduation"],
  [/\bsympathy|condolence|funeral|passed away\b/i, "sympathy"],
  [/\bjust because|no reason\b/i, "just_because"],
];
const TONE_WORDS: [RegExp, Tone][] = [
  [/\b(funny|hilarious|joke|silly|humou?r|laugh)\b/i, "funny"],
  [/\b(heartfelt|sweet|sentimental|warm|touching|sincere|loving)\b/i, "heartfelt"],
  [/\b(adventur\w*)\b/i, "adventurous"],
];

const STOPNAMES = new Set(["my", "the", "a", "an", "for", "is", "it", "its", "to", "and", "mum", "mom", "dad", "birthday", "card", "make", "need", "want"]);

function findName(text: string): string | undefined {
  // "Rosa", "her name is Rosa", "my mum, Rosa", "for Rosa"
  const m =
    text.match(/\b(?:name is|called|named)\s+([\p{Lu}][\p{L}'’-]{0,38})/u) ??
    text.match(/\b(?:mum|mom|dad|wife|husband|partner|friend|son|daughter|sister|brother|teacher|boss|nan|nana|gran|grandma|grandpa|nonna)[,\s]+(?:is\s+|called\s+|named\s+)?([\p{Lu}][\p{L}'’-]{0,38})/u) ??
    text.match(/\bfor\s+(?:my\s+\w+\s+)?([\p{Lu}][\p{L}'’-]{0,38})/u);
  const n = m?.[1];
  return n && !STOPNAMES.has(n.toLowerCase()) ? n : undefined;
}

export function extractPatch(input: string, next: RequiredField | null): Partial<CardDraft> {
  const text = input.trim();
  const patch: Partial<CardDraft> = {};
  if (!text) return patch;
  const lower = text.toLowerCase();

  // Exact chip labels first.
  const relChip = RELATIONSHIPS.find((r) => r.toLowerCase() === lower);
  const occChip = (Object.entries(OCCASION_LABELS) as [Occasion, string][]).find(([, l]) => l.toLowerCase() === lower);
  const toneChip = (Object.entries(TONE_LABELS) as [Tone, string][]).find(([, l]) => l.toLowerCase() === lower);
  const styleChip = STYLE_CARDS.find((s) => s.label.toLowerCase() === lower);

  if (next === "idea") {
    if (text.length >= 5) patch.idea = text.slice(0, 500);
    return patch;
  }
  if (next === "message") {
    if (/^write it for me$/i.test(text)) return patch; // handled by the caller (needs the draft)
    if (/^i'?ll write it$/i.test(text)) return patch;
    if (text.length >= 2) patch.message = text.slice(0, 400);
    return patch;
  }

  if (relChip && relChip !== "Someone else") patch.relationship = relChip;
  else {
    for (const [re, rel] of REL_WORDS) if (re.test(text)) { patch.relationship = rel; break; }
  }
  if (occChip) patch.occasion = occChip[0];
  else for (const [re, o] of OCC_WORDS) if (re.test(text)) { patch.occasion = o; break; }
  if (toneChip) patch.tone = toneChip[0];
  else for (const [re, t] of TONE_WORDS) if (re.test(text)) { patch.tone = t; break; }
  if (styleChip) patch.artStyle = styleChip.id;
  else if (next === "artStyle" || /(style|look)/i.test(text)) {
    const found = findStyleInText(text);
    if (found) patch.artStyle = found;
  }

  const name = findName(text);
  if (name) patch.recipientName = name;

  if (next === "recipientName" && !patch.recipientName) {
    const bare = text.replace(/^(it'?s|its|her name is|his name is|their name is|name is)\s+/i, "").replace(/[.!]+$/, "");
    if (/^[\p{L}][\p{L}\p{M} '’-]{0,39}$/u.test(bare)) patch.recipientName = bare.replace(/^./u, (c) => c.toUpperCase());
  }
  if (next === "relationship" && !patch.relationship && text.length <= 40 && !relChip) patch.relationship = text.replace(/[.!]+$/, "");
  if (next === "occasion" && !patch.occasion && (occChip ? false : text.length <= 60) && /^[\p{L}][\p{L}\p{M}\p{N} '’,-]*$/u.test(text)) {
    patch.occasion = "other";
    patch.occasionOther = text;
  }
  return patch;
}

/** A starter message from the sample-message knowledge base, filled with the recipient's name. */
export async function suggestMessage(d: CardDraft): Promise<string> {
  const name = d.recipientName || "you";
  const q = `${describeOccasion(d)} ${d.tone ?? ""} message`;
  const hits = await getKnowledgeBase().search(q, { k: 1, kinds: ["sample_message"], occasion: d.occasion, tone: d.tone });
  const base = hits[0]?.doc.text ?? "{name}, I'm thinking of you today. I hope it's a good one.";
  const sig = d.signoff ? ` ${d.signoff}.` : "";
  return (fillTemplate(base, name) + sig).slice(0, 400);
}

function ack(patch: Partial<CardDraft>, d: CardDraft): string {
  const bits: string[] = [];
  if (patch.recipientName) bits.push(patch.recipientName);
  if (patch.relationship) bits.push(`your ${patch.relationship.toLowerCase()}`);
  if (patch.occasion) bits.push(describeOccasion(d).toLowerCase());
  if (patch.tone) bits.push(patch.tone);
  if (patch.artStyle) bits.push(STYLE_CARDS.find((s) => s.id === patch.artStyle)?.label.toLowerCase() ?? "");
  if (bits.length) return `Got it: ${bits.filter(Boolean).join(", ")}.`;
  if (patch.idea) return "Nice picture.";
  if (patch.message) return "Lovely, that's the inside sorted.";
  return "";
}

export type GuideTurn = { reply: string; patch: Partial<CardDraft>; draft: CardDraft; next: RequiredField | null; quickReplies: string[] };

/** One mock turn: extract fields from the user's text, then ask the next missing question. */
export async function mockGuideTurn(userText: string, draft: CardDraft): Promise<GuideTurn> {
  const before = nextField(draft);
  let patch = extractPatch(userText, before);
  let writeForMe = false;
  if (before === "message" && /^write it for me$/i.test(userText.trim())) {
    patch = { message: await suggestMessage(draft) };
    writeForMe = true;
  }
  let d = applyPatch(draft, patch, "chat");
  // Once the tone and occasion are known, a style chip is pre-selected by default but only confirmed when asked.
  const next = nextField(d);
  let reply: string;
  if (writeForMe) {
    reply = "Here's a draft. Edit it on the card, or tell me what to change.";
  } else if (!next) {
    reply = `${ack(patch, d)} That's everything I need. Check the card, then make your preview.`.trim();
  } else if (!Object.keys(patch).length && !before) {
    reply = "Hi, I'm your Greet Guide. " + QUESTIONS[next];
  } else if (!Object.keys(patch).length) {
    const err = missingRequired(d).find((m) => m.field === before)?.error;
    reply = `${err ?? "Try that once more."} ${QUESTIONS[before!]}`;
  } else {
    reply = `${ack(patch, d)} ${QUESTIONS[next]}`.trim();
  }
  d = d.sources ? d : { ...d, sources: {} };
  return { reply, patch, draft: d, next, quickReplies: quickRepliesFor(next, d) };
}

