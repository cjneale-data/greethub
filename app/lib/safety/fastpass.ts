/**
 * Free first-pass IP screen (also the MOCK implementation of the IP-safety service). Deterministic, no network.
 * Data lives in ip-table.json. See docs/legal/07-ip-safety-design.md for the rule it implements:
 *
 *   SAME THEME, DIFFERENT CHARACTERS. A replacement never aims for "slightly looks like" the original.
 *   Names, hair/body colour and style, costume silhouette and palette, props, sidekicks and setting are all changed.
 *
 * Limits: this catches the fixed list, common misspellings, leetspeak, spaced letters, a few other languages and a
 * small set of descriptions. The live classifier (service.ts) is what catches the long tail.
 */
import table from "./ip-table.json";
import { editDistance, normName, normalize, type Norm } from "./normalize";
import { PRINTED_FIELDS, okResult, type Detected, type DetectedKind, type IpInput, type IpResult } from "./types";

export const PUBLIC_FIGURE_NOTE = "I can't draw real public figures. I can draw someone inspired by what you like about them. What are they like?";
export const BRAND_ONLY_NOTE = "A brand name on its own is something I can't draw. What's the idea behind it? I'll build the picture from that.";

type CharEntry = {
  id: string;
  franchise: string;
  names: string[];
  strong?: string[];
  ambiguous?: boolean;
  /** false: a bare mention with no franchise cue is NOT flagged (common words like Sonic). */
  bare?: boolean;
  fuzzy?: boolean;
  newName: string;
  design: string;
  note: string;
  theme: string[];
  descriptors: string[];
};
type FranchiseEntry = { id: string; names: string[]; caseSensitiveName?: string; cues?: string[]; contextWords?: string[]; replacement: string; note: string; theme: string[] };
type SloganEntry = { text: string; common?: boolean; sentiment: string; alt: string };
type FigureGroup = { names: string[]; ambiguous?: boolean; not?: string[] };

const T = table as unknown as {
  familyCues: string[];
  weakFamilyCues: string[];
  franchises: FranchiseEntry[];
  characters: CharEntry[];
  brands: string[];
  publicFigures: FigureGroup[];
  slogans: SloganEntry[];
  styleOfKnown: string[];
  styleOfReplacement: string;
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const B = "(?<![\\p{L}\\p{N}])";
const E = "(?![\\p{L}\\p{N}])";
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const joinTokens = (nn: string, sep: string) => nn.split(" ").map(esc).join(sep);
/** CJK names have no spaces between words, so they match without word boundaries. */
const phraseRe = (nn: string) => (CJK.test(nn) ? new RegExp(joinTokens(nn, " ?"), "gu") : new RegExp(`${B}${joinTokens(nn, " ?")}(?:s)?${E}`, "gu"));
const stripArticle = (s: string) => s.replace(/^(an|a|the)\s+/i, "");

/* ------------------------------------------------------------ compiled table */

type Matcher = { re: RegExp; test: RegExp; nn: string; strong: boolean };
type CompiledChar = { e: CharEntry; matchers: Matcher[]; fuzzyNames: string[]; descriptors: RegExp[] };
type CompiledFranchise = { f: FranchiseEntry; matchers: Matcher[]; cues: string[] };
type CompiledSlogan = { s: SloganEntry; nn: string; re: RegExp };

let compiled: {
  chars: CompiledChar[];
  franchises: CompiledFranchise[];
  brands: Matcher[];
  slogans: CompiledSlogan[];
  figures: { g: FigureGroup; matchers: Matcher[]; not: RegExp | null }[];
  family: RegExp;
  weakFamily: RegExp;
  styleKnown: Set<string>;
} | null = null;

function compile() {
  if (compiled) return compiled;
  const m = (name: string, strong: boolean): Matcher => {
    const nn = normName(name);
    return { re: phraseRe(nn), test: new RegExp(phraseRe(nn).source, "u"), nn, strong };
  };
  const chars = T.characters.map((e) => {
    const strongSet = new Set((e.strong ?? []).map(normName));
    const matchers = e.names.map((n) => m(n, !e.ambiguous || strongSet.has(normName(n)))).filter((x) => x.nn.length >= 2);
    const fuzzyNames = e.fuzzy ? matchers.filter((x) => x.strong && x.nn.replace(/ /g, "").length >= 7).map((x) => x.nn) : [];
    return { e, matchers, fuzzyNames, descriptors: (e.descriptors ?? []).map((d) => new RegExp(`${B}(?:${d})${E}`, "gu")) };
  });
  const franchises = T.franchises.map((f) => ({ f, matchers: f.names.map((n) => m(n, true)), cues: (f.cues ?? []).map(normName) }));
  const brands = T.brands.map((n) => m(n, true));
  const slogans = T.slogans.map((s) => ({ s, nn: normName(s.text), re: phraseRe(normName(s.text)) }));
  const figures = T.publicFigures.map((g) => ({
    g,
    matchers: g.names.map((n) => m(n, !g.ambiguous)),
    not: g.not?.length ? new RegExp(g.not.map((n) => `${B}${joinTokens(normName(n), " ")}${E}`).join("|"), "u") : null,
  }));
  const cueRe = (cues: string[], words: number) => new RegExp(`${B}(?:${cues.map((c) => joinTokens(normName(c), " ")).join("|")})(?: [^ ]+){0,${words}} ?$`, "u");
  compiled = {
    chars,
    franchises,
    brands,
    slogans,
    figures,
    family: cueRe(T.familyCues, 2),
    weakFamily: cueRe(T.weakFamilyCues, 1),
    styleKnown: new Set(T.styleOfKnown.map(normName)),
  };
  return compiled;
}

/* ------------------------------------------------------------ helpers */

/** Strips control characters and caps runaway whitespace. */
export function cleanInput(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]{3,}/g, "  ").trim();
}

type Hit = {
  start: number; // original offsets
  end: number;
  kind: DetectedKind;
  entry?: CharEntry;
  franchise?: FranchiseEntry;
  slogan?: SloganEntry;
  replacement?: string;
  confidence: number;
  /** The customer's own words (never logged). */
  original: string;
};

const wordsAfter = (s: string, at: number, n: number) => s.slice(at).trim().split(" ").slice(0, n);
const tail = (norm: Norm, at: number, len: number) => norm.s.slice(Math.max(0, at - len), at).trimEnd() + " ";

const AS_CHARACTER_BEFORE = /(?:^| )(?:as|like|dressed as|dress up as|dressed up as|costume of|cosplay as|cosplaying|draw|drawing|make|picture of|looks like) ?$/u;
const AS_CHARACTER_AFTER = /^(?: and [^ ]+)? from |^ the (?:snow|ice|frozen|princess|queen|mouse|snowman)/u;
const GENERIC_CUES = ["movie", "film", "cartoon", "disney", "pixar", "nintendo", "marvel", "costume", "cosplay", "fan art", "fanart", "character", "characters", "franchise", "tv show", "video game", "from the", "princess"];

const FROZEN_FOOD_WORDS = new Set(["yogurt", "yoghurt", "pizza", "peas", "pond", "lake", "food", "foods", "dessert", "treat", "treats", "fruit", "berries", "custard", "margarita", "drink", "drinks", "ground", "river", "section", "aisle", "meal", "meals", "waffles", "dinner", "vegetables", "veg", "corn", "shrimp", "fish", "turkey", "tundra", "solid", "toes", "fingers", "hands", "feet", "in", "over", "stiff", "assets", "account", "shoulder"]);

function isFrozenFranchise(f: FranchiseEntry, orig: string, original: string, norm: Norm, i: number, j: number): boolean {
  const after = wordsAfter(norm.s, j, 2);
  const cuePresent = (f.cues ?? []).some((c) => c !== "frozen" && new RegExp(`${B}${esc(normName(c))}${E}`, "u").test(norm.s));
  if (cuePresent) return true;
  if (after[0] && FROZEN_FOOD_WORDS.has(after[0])) return false;
  if ((f.contextWords ?? []).some((w) => after.includes(w))) return true;
  const prevChar = original.slice(0, norm.start[i]).trimEnd().slice(-1);
  const sentenceStart = prevChar === "" || /[.!?\n:]/.test(prevChar);
  const capital = orig === "Frozen" || orig === "FROZEN";
  return capital && !sentenceStart;
}

/* ------------------------------------------------------------ detection */

function detect(input: IpInput, text: string, norm: Norm): { hits: Hit[]; blockedPerson: Hit[] } {
  const c = compile();
  const hits: Hit[] = [];
  const blockedPerson: Hit[] = [];
  const known = new Set<string>();
  for (const k of input.knownNames ?? []) {
    const nk = normName(k);
    if (!nk) continue;
    known.add(nk);
    for (const tok of nk.split(" ")) if (tok.length >= 2) known.add(tok);
  }
  const orig = (i: number, j: number) => text.slice(norm.start[i], norm.end[j - 1]);
  const span = (i: number, j: number) => ({ start: norm.start[i], end: norm.end[j - 1], original: orig(i, j) });
  const ideaLike = ["card_idea", "story_idea", "character_note", "reroll_note", "image_prompt"].includes(input.field);
  const textHas = (phrase: string) => new RegExp(`${B}${joinTokens(phrase, " ?")}${E}`, "u").test(norm.s);

  // franchises
  const franchiseSeen = new Set<string>();
  for (const cf of c.franchises) {
    for (const mt of cf.matchers) {
      for (const mm of norm.s.matchAll(mt.re)) {
        const i = mm.index!;
        const j = i + mm[0].length;
        if (cf.f.id === "frozen" && !isFrozenFranchise(cf.f, orig(i, j), text, norm, i, j)) continue;
        hits.push({ ...span(i, j), kind: "franchise", franchise: cf.f, confidence: 0.9 });
        franchiseSeen.add(cf.f.id);
      }
    }
  }

  // characters
  for (const cc of c.chars) {
    const own = new Set(cc.matchers.map((x) => x.nn));
    const sameFranchise = c.chars.filter((o) => o.e.franchise === cc.e.franchise && o.e.id !== cc.e.id);
    const franchiseEntry = c.franchises.find((f) => f.f.id === cc.e.franchise);
    const cueMatches = (self: string): boolean => {
      if (cc.matchers.some((x) => x.strong && x.nn !== self && textHas(x.nn))) return true;
      if (franchiseSeen.has(cc.e.franchise)) return true;
      if (franchiseEntry && franchiseEntry.cues.some((cu) => textHas(cu) && !own.has(cu))) return true;
      if (sameFranchise.some((o) => o.matchers.some((x) => !own.has(x.nn) && textHas(x.nn)))) return true;
      return GENERIC_CUES.some(textHas);
    };
    for (const mt of cc.matchers) {
      for (const mm of norm.s.matchAll(mt.re)) {
        const i = mm.index!;
        const j = i + mm[0].length;
        let confidence = 0.95;
        if (!mt.strong) {
          const before = norm.s.slice(Math.max(0, i - 24), i).trimEnd();
          const after = norm.s.slice(j, j + 40);
          const asChar = AS_CHARACTER_BEFORE.test(before) || AS_CHARACTER_AFTER.test(after);
          if (c.family.test(tail(norm, i, 40))) continue; // "my niece Elsa"
          const weakFam = c.weakFamily.test(tail(norm, i, 30));
          const isKnown = known.has(mt.nn) || mm[0].split(" ").every((t) => known.has(t));
          if (isKnown && !asChar) continue;
          if (cueMatches(mt.nn)) confidence = 0.85;
          else if (weakFam) continue; // "our neighbour Belle"
          else if (ideaLike && !isKnown && cc.e.bare !== false) confidence = 0.6;
          else continue;
        }
        hits.push({ ...span(i, j), kind: "character", entry: cc.e, confidence });
      }
    }
    // descriptions ("the snowman who loves warm hugs")
    for (const re of cc.descriptors) {
      for (const mm of norm.s.matchAll(re)) {
        const i = mm.index!;
        hits.push({ ...span(i, i + mm[0].length), kind: "character", entry: cc.e, confidence: 0.75 });
      }
    }
    // misspellings
    if (cc.fuzzyNames.length) {
      const words = [...norm.s.matchAll(/[^ ]+/gu)].map((w) => ({ w: w[0], i: w.index! }));
      for (let a = 0; a < words.length; a++) {
        for (let len = 1; len <= 3 && a + len <= words.length; len++) {
          const slice = words.slice(a, a + len);
          const squashed = slice.map((x) => x.w).join("");
          if (squashed.length < 6) continue;
          if (len > 1 && (slice[0].w.length < 3 || slice[len - 1].w.length < 3)) continue;
          const i = slice[0].i;
          const j = slice[len - 1].i + slice[len - 1].w.length;
          if (cc.matchers.some((x) => x.test.test(norm.s.slice(i, j)))) continue;
          for (const fn of cc.fuzzyNames) {
            const target = fn.replace(/ /g, "");
            const maxD = target.length >= 10 ? 2 : 1;
            if (squashed !== target && editDistance(squashed, target, maxD) <= maxD) {
              hits.push({ ...span(i, j), kind: "character", entry: cc.e, confidence: 0.7 });
              break;
            }
          }
        }
      }
    }
  }

  // brands
  for (const mt of c.brands) {
    for (const mm of norm.s.matchAll(mt.re)) {
      const i = mm.index!;
      hits.push({ ...span(i, i + mm[0].length), kind: "brand", replacement: "", confidence: 0.95 });
    }
  }

  // slogans
  for (const cs of c.slogans) {
    for (const mm of norm.s.matchAll(cs.re)) {
      const i = mm.index!;
      const sp = span(i, i + mm[0].length);
      if (cs.s.common) {
        // Everyday phrases count as a slogan only when they stand alone, are quoted, are Title Cased or are labelled as one.
        const whole = norm.s === cs.nn || norm.s === `${cs.nn}s`;
        const quoted = /["“”]/.test(text.slice(Math.max(0, sp.start - 1), sp.start)) || /["“”]/.test(text.slice(sp.end, sp.end + 1));
        const words = sp.original.split(/\s+/);
        const title = words.length >= 2 && words.every((w) => /^\p{Lu}/u.test(w));
        const labelled = /(?:slogan|tagline|motto|catchphrase|catch phrase|saying)\W+(?:\w+\W+){0,3}$/i.test(text.slice(Math.max(0, sp.start - 40), sp.start));
        if (!(whole || quoted || title || labelled)) continue;
        hits.push({ ...sp, kind: "slogan", slogan: cs.s, confidence: 0.7 });
      } else {
        hits.push({ ...sp, kind: "slogan", slogan: cs.s, confidence: 0.9 });
      }
    }
  }

  // "in the style of X", "X style", "like a X movie"
  const styleRe = /(?:in|with) the (?:\w+ )?style of ([^,.;!?\n]{2,40})|(?:in|with) (?:an? )?([^,.;!?\n]{2,24}?)[- ]style(?= |$|[,.;!?])|(?:like|as) (?:an? )?([^,.;!?\n]{2,24}?) (?:movie|film|cartoon|show)(?= |$|[,.;!?])|(?:^|[ ,])([\p{L}]{3,20}) style(?= |$|[,.;!?])/giu;
  for (const mm of text.matchAll(styleRe)) {
    const x = (mm[1] ?? mm[2] ?? mm[3] ?? mm[4] ?? "").trim();
    const nx = normName(x);
    const knownStyle = [...c.styleKnown].some((k) => nx === k || nx.startsWith(`${k} `) || nx.endsWith(` ${k}`));
    const proper = /^\p{Lu}/u.test(x) && mm[1] !== undefined;
    if (!knownStyle && !proper) continue;
    if (/^(a |an |the )?(vintage|classic|retro|old|children|childrens|picture|watercolou?r|storybook|fairy)/i.test(x)) continue;
    const start = mm.index! + (mm[0].startsWith(" ") || mm[0].startsWith(",") ? 1 : 0);
    hits.push({ start, end: mm.index! + mm[0].length, kind: "franchise", original: x, replacement: T.styleOfReplacement, confidence: 0.85 });
  }

  // public figures
  for (const cf of c.figures) {
    for (const mt of cf.matchers) {
      for (const mm of norm.s.matchAll(mt.re)) {
        const i = mm.index!;
        const j = i + mm[0].length;
        if (!mt.strong) {
          if (cf.not?.test(norm.s)) continue;
          if (c.family.test(tail(norm, i, 40)) || c.weakFamily.test(tail(norm, i, 30))) continue;
          if (known.has(mt.nn)) continue;
        }
        blockedPerson.push({ ...span(i, j), kind: "person", confidence: mt.strong ? 0.95 : 0.7 });
      }
    }
  }
  return { hits, blockedPerson };
}

/* ------------------------------------------------------------ rewrite */

const listNice = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const vowel = (s: string) => /^[aeiou]/i.test(s.trim());
const fixTrailingArticle = (out: string, following: string): string =>
  following.trim()
    ? out.replace(/(^|\s)(a|an)(\s+)$/i, (_m, pre: string, art: string, sp: string) => `${pre}${art[0] === "A" ? (vowel(following) ? "An" : "A") : vowel(following) ? "an" : "a"}${sp}`)
    : out;

/** One-line, friendly, brand-voice note. At most one exclamation mark (we use none). Never claims legal safety. */
export function composeNote(kinds: Set<DetectedKind>, themeKept: string[], printed: boolean): string {
  if (kinds.has("character") || kinds.has("franchise")) {
    const themes = themeKept.slice(0, 3);
    return themes.length
      ? `Kept the idea (${listNice(themes)}) and made original characters. Edit anything you like.`
      : "Kept your idea and made original characters. Edit anything you like.";
  }
  if (kinds.has("slogan")) {
    return printed
      ? "That line is a well-known slogan, so I swapped in an original one with the same feeling. Edit it any time."
      : "Left a well-known slogan out and kept the rest of your idea. Edit anything you like.";
  }
  if (kinds.has("brand")) return "Left the brand name off and kept the rest of your idea. Edit anything you like.";
  return "";
}

export function fastScreen(input: IpInput): IpResult {
  const text = cleanInput(input.text);
  if (!text) return okResult(text);
  const printed = PRINTED_FIELDS.includes(input.field);
  const norm = normalize(text);
  const { hits, blockedPerson } = detect(input, text, norm);

  if (blockedPerson.length) {
    return {
      verdict: "blocked",
      safeText: "",
      userNote: PUBLIC_FIGURE_NOTE,
      detected: blockedPerson.map((h) => ({ kind: "person", original: h.original, confidence: h.confidence })),
      themeKept: [],
      engine: "rules",
    };
  }
  if (!hits.length) return okResult(text);

  // keep the longest hit when spans overlap
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: Hit[] = [];
  for (const h of hits) {
    const last = kept[kept.length - 1];
    if (last && h.start < last.end) {
      if (h.end - h.start > last.end - last.start && h.start <= last.start) kept[kept.length - 1] = h;
      continue;
    }
    kept.push(h);
  }

  const introduced = new Set<string>();
  const themeKept: string[] = [];
  const pushTheme = (xs: string[]) => xs.forEach((x) => !themeKept.includes(x) && themeKept.push(x));
  let out = "";
  let cursor = 0;
  let removed = false;
  for (const h of kept) {
    out += text.slice(cursor, h.start);
    cursor = h.end;
    let rep = "";
    if (h.kind === "character" && h.entry) {
      pushTheme(h.entry.theme);
      if (printed || introduced.has(h.entry.id)) rep = h.entry.newName;
      else {
        rep = `${h.entry.newName} (${h.entry.design})`;
        introduced.add(h.entry.id);
      }
    } else if (h.kind === "franchise" && h.franchise) {
      pushTheme(h.franchise.theme);
      rep = stripArticle(h.franchise.replacement);
    } else if (h.kind === "franchise") {
      rep = h.replacement ?? "";
    } else if (h.kind === "slogan" && h.slogan) {
      rep = printed ? h.slogan.alt : "";
    }
    if (!rep) removed = true;
    out = fixTrailingArticle(out, rep || text.slice(cursor));
    out += rep;
  }
  out += text.slice(cursor);
  out = out.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").replace(/\(\s+/g, "(").trim();
  if (removed) out = out.replace(/([.!?,;])(\s*[.,;])+/g, "$1");

  const detected: Detected[] = kept.map((h) => ({ kind: h.kind, original: h.original, confidence: h.confidence }));
  const kinds = new Set(detected.map((d) => d.kind));
  if (!/[\p{L}\p{N}]/u.test(out)) {
    return { verdict: "blocked", safeText: "", userNote: BRAND_ONLY_NOTE, detected, themeKept, engine: "rules" };
  }
  return { verdict: "rewritten", safeText: out, userNote: composeNote(kinds, themeKept, printed), detected, themeKept, engine: "rules" };
}

/** Table accessors for tests and docs. */
export const IP_TABLE = {
  characters: T.characters,
  franchises: T.franchises,
  brands: T.brands,
  slogans: T.slogans,
  publicFigures: T.publicFigures,
  version: (table as { version: number }).version,
};
