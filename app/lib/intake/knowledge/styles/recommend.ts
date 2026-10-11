/**
 * recommendStyles(brief): rank the style library for a brief and, optionally, a free-text request such as
 * "something soft and watery for a baby shower". Server-side (and tests): it uses the full library, BM25 over the style
 * documents, and the IP-alias map. The client picker uses recommendFrom() with the slim data instead.
 */
import { Bm25KnowledgeBase } from "../bm25";
import { STYLE_KB_DOCS } from "./docs.generated";
import { STYLE_LIBRARY } from "./library.generated";
import { matchIpSafeAlias } from "./ip-alias";
import { scoreStyle, whyLine, type StyleBrief, type StyleRecommendation } from "./recommend-core";
import type { StyleEntry, StyleTone } from "./types";

export type { StyleBrief, StyleRecommendation } from "./recommend-core";

const styleKb = new Bm25KnowledgeBase(STYLE_KB_DOCS);
const byId = new Map(STYLE_LIBRARY.map((s) => [s.id, s]));
export const getStyle = (id: string): StyleEntry | undefined => byId.get(id as StyleEntry["id"]);

/** Occasion phrases customers use. Order matters: the more specific phrase goes first. */
const OCCASION_PHRASES: [RegExp, string][] = [
  [/\bbaby shower|new baby|newborn|christening|baptism|nursery|expecting\b/, "new_baby"],
  [/\bmother'?s day|for mum|for mom|for my mum|for my mom|for grandma|for nana\b/, "mothers_day"],
  [/\bfather'?s day|for dad|dad'?s|for my dad|for papa\b/, "fathers_day"],
  [/\bwedding|engagement|bride|groom\b/, "wedding"],
  [/\banniversary\b/, "anniversary"],
  [/\bsympathy|condolence|funeral|memorial|loss of\b/, "sympathy"],
  [/\bget well|feel better|recovery|hospital\b/, "get_well"],
  [/\bgraduat\w*/, "graduation"],
  [/\bchristmas|holiday|festive|xmas\b/, "christmas"],
  [/\bvalentine|love note|romantic\b/, "valentines"],
  [/\bthank|thanks|appreciat\w*/, "thank_you"],
  [/\bcongrat\w*|promotion|new job\b/, "congratulations"],
  [/\bbedtime|goodnight|sleepy\b/, "bedtime"],
  [/\bretire\w*/, "retirement"],
  [/\bnew home|housewarming|moving\b/, "new_home"],
  [/\bbirthday|bday\b/, "birthday"],
];
const TONE_PHRASES: [RegExp, StyleTone][] = [
  [/\bfunny|silly|goofy|hilarious|jokes?|humou?r|laugh|zany|wacky|cheeky\b/, "silly"],
  [/\bbold|loud|punchy|vibrant|bright|colou?rful|graphic\b/, "bold"],
  [/\bsoft|gentle|sweet|tender|heartfelt|loving|cozy|cosy|warm|dreamy|delicate\b/, "tender"],
  [/\belegant|classy|fancy|formal|refined|luxe|luxury|posh\b/, "elegant"],
  [/\badventur\w*|brave|explor\w*|quest|epic\b/, "adventurous"],
];

export type QueryIntent = { occasion?: string; tones: StyleTone[]; product?: "card" | "book"; ageBand?: "0-3" | "4-7" | "8-10" };

/** Pull occasion, tone and product hints out of a free-text request. Deterministic, no model call. */
export function parseQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase();
  const intent: QueryIntent = { tones: [] };
  for (const [re, o] of OCCASION_PHRASES) if (re.test(q)) { intent.occasion = o; break; }
  for (const [re, t] of TONE_PHRASES) if (re.test(q)) intent.tones.push(t);
  if (/\b(book|story|picture book|storybook)\b/.test(q)) intent.product = "book";
  else if (/\bcard\b/.test(q)) intent.product = "card";
  if (/\b(baby|newborn|toddler|board book)\b/.test(q)) intent.ageBand = "0-3";
  return intent;
}

const TONE_FOR_QUERY: Record<StyleTone, string> = { silly: "funny", bold: "funny", tender: "heartfelt", elegant: "heartfelt", adventurous: "adventurous" };

export function recommendStyles(brief: StyleBrief): StyleRecommendation[] {
  const query = brief.query?.trim() ?? "";
  const intent = query ? parseQueryIntent(query) : { tones: [] as StyleTone[] };
  const alias = query ? matchIpSafeAlias(query) : null;
  const merged: StyleBrief = {
    ...brief,
    occasion: brief.occasion ?? intent.occasion,
    tone: brief.tone ?? (intent.tones[0] ? TONE_FOR_QUERY[intent.tones[0]] : undefined),
    ageBand: brief.ageBand ?? intent.ageBand,
    includeBeta: brief.includeBeta ?? /\b(photo|photoreal\w*|realistic|lifelike|cinematic)\b/i.test(query),
  };

  // Free-text retrieval: normalise the BM25 score to 0..4 so it can tip a close call but not outvote the brief.
  const hits = query ? styleKb.searchSync(query, { k: 40, kinds: ["style_preset"], product: brief.product }) : [];
  const top = hits[0]?.score ?? 0;
  const text = new Map(hits.map((h) => [h.doc.styleId!, top ? (h.score / top) * 4 : 0]));

  const out: StyleRecommendation[] = [];
  for (const s of STYLE_LIBRARY) {
    const r = scoreStyle(s, merged);
    if (!r) continue;
    let score = r.score;
    const reasons = [...r.reasons];
    const t = text.get(s.id) ?? 0;
    if (t > 0) { score += t; if (t >= 2) reasons.push("matches the words you used"); }
    // Extra tones named in the text ("bold and funny") each earn a smaller bonus.
    for (const tone of intent.tones.slice(1)) if (s.tones.includes(tone)) score += 1;
    const fromAlias = alias?.styleId === s.id;
    if (fromAlias) { score += 10; reasons.unshift("the closest original style to the look you described"); }
    out.push({ styleId: s.id, name: s.name, score: Math.round(score * 100) / 100, reasons, why: whyLine(s, reasons), ...(fromAlias ? { fromAlias: true } : {}) });
  }
  out.sort((a, b) => b.score - a.score || a.styleId.localeCompare(b.styleId));
  return out.slice(0, brief.limit ?? 3);
}

