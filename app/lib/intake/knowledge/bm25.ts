import { KB_DOCS } from "./data";
import type { KbDoc, KbHit, KnowledgeBase, SearchOptions } from "./types";

const STOP = new Set(
  "a an the and or but of to in on for with at by from is are was were be been it its this that these those i you he she they we my your our their me us them as if so do does did not no can could would should will just about into than then there what who how when where which".split(" "),
);

/** Lowercase, split on non-letters, drop stopwords, crude plural/ing stemming. Enough for a few dozen docs. */
export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("ies") ? t.slice(0, -3) + "y" : t.length > 4 && t.endsWith("ing") ? t.slice(0, -3) : t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
}

/** Okapi BM25 over title (weighted by repetition) plus text. */
export class Bm25KnowledgeBase implements KnowledgeBase {
  private docs: { doc: KbDoc; tf: Map<string, number>; len: number }[];
  private df = new Map<string, number>();
  private avgLen: number;

  constructor(
    docs: KbDoc[] = KB_DOCS,
    private k1 = 1.4,
    private b = 0.75,
  ) {
    this.docs = docs.map((doc) => {
      const toks = [...tokenize(doc.title), ...tokenize(doc.title), ...tokenize(doc.text), ...tokenize(`${doc.occasion ?? ""} ${doc.tone ?? ""}`)];
      const tf = new Map<string, number>();
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      return { doc, tf, len: toks.length };
    });
    this.avgLen = this.docs.reduce((n, d) => n + d.len, 0) / Math.max(1, this.docs.length);
  }

  async search(query: string, opts: SearchOptions = {}): Promise<KbHit[]> {
    return this.searchSync(query, opts);
  }

  /** Same as search(), without the promise: the scoring is in-process and synchronous. */
  searchSync(query: string, opts: SearchOptions = {}): KbHit[] {
    const { k = 3, kinds, occasion, tone, product } = opts;
    const q = tokenize(query);
    const N = this.docs.length;
    const hits: KbHit[] = [];
    for (const d of this.docs) {
      if (kinds && !kinds.includes(d.doc.kind)) continue;
      if (product && d.doc.products && !d.doc.products.includes(product)) continue;
      let score = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen));
      }
      if (occasion && (d.doc.occasion === occasion || d.doc.occasions?.includes(occasion))) score += 2 + score * 0.5;
      if (tone && (d.doc.tone === tone || d.doc.tones?.includes(tone)) && score > 0) score += 0.75;
      if (score > 0) hits.push({ doc: d.doc, score });
    }
    return hits.sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id)).slice(0, k);
  }
}

let shared: KnowledgeBase | undefined;
/** Swap this for a pgvector-backed implementation once Supabase is wired. */
export function getKnowledgeBase(): KnowledgeBase {
  return (shared ??= new Bm25KnowledgeBase());
}

/** Fill a sample message template with the recipient's first name. */
export const fillTemplate = (text: string, name: string) => text.replaceAll("{name}", name);
