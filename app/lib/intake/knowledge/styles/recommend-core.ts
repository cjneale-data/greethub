/**
 * Rule-based style scoring. Client-safe: it needs only the slim picker fields, so the picker can rank "recommended for
 * you" in the browser. The server-side recommendStyles() (recommend.ts) adds free-text retrieval and IP-alias handling
 * on top of the same scores.
 */
import type { AgeBand, StyleTone } from "./types";

export type Scorable = {
  id: string;
  name: string;
  products: ("book" | "card")[];
  ageBands: AgeBand[];
  occasions: string[];
  tones: StyleTone[];
  whyThisOne: string;
  status: "stable" | "beta";
  consistency: { bookRating: number; cardRating: number };
  popularity: Popularity | { rating: Popularity };
};
type Popularity = "high" | "medium" | "niche" | "emerging" | "not_found";

export type StyleBrief = {
  product: "card" | "book";
  /** Brief occasion id (OCCASIONS) or an extended id such as "bedtime". */
  occasion?: string;
  /** Brief tone (funny, heartfelt, adventurous) or a library tone (silly, tender, adventurous, elegant, bold). */
  tone?: string;
  /** Book reading age. */
  readingAge?: "0-2" | "3-5" | "6-8" | string;
  /** Or the library age band directly. */
  ageBand?: AgeBand;
  /** Recipient age group for cards: baby, toddler, child, teen, adult, senior, pet. */
  recipientAge?: string;
  /** Books default to true: characters must stay recognisable across pages. */
  needsConsistency?: boolean;
  /** Free text. Used only by the server-side recommendStyles(). */
  query?: string;
  /** Beta styles (photo-real) are left out unless asked for. */
  includeBeta?: boolean;
  limit?: number;
};

export type StyleRecommendation = {
  styleId: string;
  name: string;
  score: number;
  reasons: string[];
  /** One plain-language line for the picker: why this one. */
  why: string;
  /** Set when the customer asked for a franchise look and this is the generic equivalent. */
  fromAlias?: boolean;
};

export const OCCASION_NAMES: Record<string, string> = {
  birthday: "a birthday", thank_you: "a thank-you", wedding: "a wedding", anniversary: "an anniversary", new_baby: "a new baby",
  get_well: "get well wishes", congratulations: "congratulations", mothers_day: "Mother's Day", fathers_day: "Father's Day",
  valentines: "Valentine's Day", christmas: "Christmas", graduation: "a graduation", sympathy: "a sympathy note", just_because: "a just-because note",
  bedtime: "bedtime", adventure: "an adventure", new_home: "a new home", back_to_school: "back to school", teacher: "a teacher thank-you", pet: "a pet", retirement: "a retirement",
};

const TONE_MAP: Record<string, StyleTone[]> = {
  funny: ["silly", "bold"],
  heartfelt: ["tender", "elegant"],
  adventurous: ["adventurous", "bold"],
  silly: ["silly"], tender: ["tender"], elegant: ["elegant"], bold: ["bold"],
};
const TONE_PHRASE: Record<StyleTone, string> = { silly: "a funny", tender: "a tender", adventurous: "an adventurous", elegant: "an elegant", bold: "a bold" };

export function bandsFor(b: StyleBrief): AgeBand[] {
  if (b.ageBand) return [b.ageBand];
  if (b.product === "book") {
    if (b.readingAge === "0-2") return ["0-3"];
    if (b.readingAge === "3-5") return ["4-7"];
    if (b.readingAge === "6-8") return ["4-7", "8-10"];
  }
  switch (b.recipientAge) {
    case "baby": case "toddler": return ["0-3"];
    case "child": return ["4-7"];
    case "teen": case "adult": case "senior": return ["8-10"];
    default: return [];
  }
}

export function scoreStyle(s: Scorable, b: StyleBrief): { score: number; reasons: string[]; occasionHit: boolean } | null {
  if (!s.products.includes(b.product)) return null;
  if (s.status === "beta" && !b.includeBeta) return null;
  let score = 0;
  const reasons: string[] = [];
  let occasionHit = false;
  if (b.occasion && s.occasions.includes(b.occasion)) {
    // The authored order lists the most central occasions first, which breaks ties between equal fits.
    score += 3 + 0.6 * (1 - s.occasions.indexOf(b.occasion) / s.occasions.length);
    occasionHit = true;
    reasons.push(`fits ${OCCASION_NAMES[b.occasion] ?? b.occasion.replaceAll("_", " ")}`);
  }
  const tones = b.tone ? (TONE_MAP[b.tone] ?? []) : [];
  if (tones.length) {
    if (s.tones.includes(tones[0])) { score += 2.5 + (s.tones[0] === tones[0] ? 0.4 : 0); reasons.push(`suits ${TONE_PHRASE[tones[0]]} feel`); }
    else if (tones[1] && s.tones.includes(tones[1])) { score += 1.5; reasons.push(`leans ${tones[1]}`); }
  }
  const bands = bandsFor(b);
  if (bands.length) {
    if (bands.some((x) => s.ageBands.includes(x))) { score += 2; reasons.push(`works for ages ${bands[0]}`); }
    else score -= 1;
  }
  if (b.product === "book") {
    if (b.needsConsistency !== false) {
      const d = (s.consistency.bookRating - 3) * 0.9;
      score += d;
      if (s.consistency.bookRating >= 4) reasons.push("keeps characters recognizable page to page");
    }
  } else score += (s.consistency.cardRating - 3) * 0.2;
  const pop = typeof s.popularity === "string" ? s.popularity : s.popularity.rating;
  score += pop === "high" ? 0.6 : pop === "medium" ? 0.3 : pop === "emerging" ? 0.2 : 0;
  return { score, reasons, occasionHit };
}

export function whyLine(s: Scorable, reasons: string[]): string {
  const fit = reasons.filter((r) => !r.startsWith("works for") && !r.startsWith("leans")).slice(0, 2);
  const tail = fit.length ? ` ${capitalize(fit.join(" and "))}.` : "";
  return `${s.whyThisOne}${tail}`;
}
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Rank styles with the rule score only. Used by the client picker. */
export function recommendFrom<T extends Scorable>(styles: readonly T[], b: StyleBrief): StyleRecommendation[] {
  const out: StyleRecommendation[] = [];
  for (const s of styles) {
    const r = scoreStyle(s, b);
    if (!r) continue;
    out.push({ styleId: s.id, name: s.name, score: round(r.score), reasons: r.reasons, why: whyLine(s, r.reasons) });
  }
  out.sort((a, c) => c.score - a.score || a.styleId.localeCompare(c.styleId));
  return out.slice(0, b.limit ?? out.length);
}
const round = (n: number) => Math.round(n * 100) / 100;
