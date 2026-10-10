/**
 * Content guardrails for the card creator. Pure functions, safe on client and server.
 * Wording is from docs/cmo/intake-questions.md section 4. The server re-runs everything; the client runs it
 * only to give feedback sooner.
 *
 * Moderation here is a rule-based first pass. TODO: add a model-based moderation call on the server once
 * a moderation endpoint is chosen (the rules stay as the cheap pre-filter).
 */
import type { CardDraft } from "./draft";

export const SENSITIVE_MESSAGE =
  "That's not something I can make. I can do a card that's kind, funny or sweet. Want to try a different idea?";
export const PUBLIC_FIGURE_MESSAGE =
  "I can't draw real public figures. I can draw someone inspired by what you like about them. What are they like?";
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

/* ---------- real public figures ---------- */

const PUBLIC_FIGURES = [
  "donald trump", "trump", "joe biden", "biden", "barack obama", "obama", "kamala harris", "vladimir putin", "putin",
  "taylor swift", "beyonce", "kim kardashian", "elon musk", "jeff bezos", "mark zuckerberg", "lionel messi", "messi",
  "cristiano ronaldo", "ronaldo", "lebron james", "oprah", "the pope", "pope francis", "king charles", "queen elizabeth",
  "justin bieber", "ariana grande", "drake", "kanye", "elvis", "michael jackson", "tom cruise", "brad pitt",
];

/* ---------- copyrighted characters and brands -> generic descriptions ---------- */

type Rewrite = { names: string[]; generic: string };
const CHARACTERS: Rewrite[] = [
  { names: ["meeko"], generic: "a friendly raccoon" },
  { names: ["elsa"], generic: "an ice queen with a braid" },
  { names: ["spider-man", "spiderman", "spider man"], generic: "a masked hero in a red and blue suit" },
  { names: ["mickey mouse", "mickey"], generic: "a cheerful cartoon mouse" },
  { names: ["minnie mouse", "minnie"], generic: "a cheerful cartoon mouse with a big bow" },
  { names: ["mario", "super mario"], generic: "a cheerful plumber in red overalls and a cap" },
  { names: ["luigi"], generic: "a cheerful plumber in green overalls and a cap" },
  { names: ["pikachu"], generic: "a small yellow electric mouse with rosy cheeks" },
  { names: ["batman"], generic: "a caped hero in a dark mask" },
  { names: ["superman"], generic: "a caped hero in a blue suit" },
  { names: ["wonder woman"], generic: "a warrior hero with a golden rope" },
  { names: ["iron man"], generic: "a hero in a red and gold armored suit" },
  { names: ["hulk"], generic: "a big green strongman" },
  { names: ["hello kitty"], generic: "a sweet white kitten with a bow" },
  { names: ["winnie the pooh", "winnie-the-pooh", "pooh bear"], generic: "a honey-loving teddy bear in a little red shirt" },
  { names: ["peppa pig", "peppa"], generic: "a cheerful little pig in a red dress" },
  { names: ["bluey"], generic: "a playful blue puppy" },
  { names: ["paw patrol"], generic: "a team of rescue puppies" },
  { names: ["spongebob", "sponge bob"], generic: "a cheerful yellow sea sponge" },
  { names: ["snoopy"], generic: "a daydreaming white beagle" },
    { names: ["moana"], generic: "a brave island girl who sails the sea" },
  { names: ["simba"], generic: "a young lion cub" },
  { names: ["dora the explorer", "dora"], generic: "a curious young explorer with a backpack" },
  { names: ["elmo"], generic: "a fuzzy red puppet monster" },
  { names: ["cookie monster"], generic: "a fuzzy blue monster who loves cookies" },
  { names: ["sonic"], generic: "a speedy blue hedgehog" },
  { names: ["darth vader"], generic: "a tall dark knight in a black helmet and cape" },
  { names: ["yoda", "baby yoda", "grogu"], generic: "a tiny wise green creature with big ears" },
  { names: ["harry potter"], generic: "a young wizard with round glasses" },
  { names: ["hogwarts"], generic: "a castle school for young wizards" },
  { names: ["barbie"], generic: "a glamorous fashion doll" },
  { names: ["thomas the tank engine", "thomas the tank"], generic: "a cheerful blue steam engine with a face" },
  { names: ["bugs bunny"], generic: "a wisecracking gray rabbit" },
  { names: ["tweety"], generic: "a small yellow canary" },
  { names: ["homer simpson", "bart simpson"], generic: "a goofy yellow cartoon dad" },
  { names: ["olaf"], generic: "a cheerful snowman" },
  { names: ["mulan"], generic: "a brave young warrior" },
  { names: ["rapunzel"], generic: "a princess with impossibly long golden hair" },
  { names: ["cinderella"], generic: "a girl in a sparkling ball gown and glass slippers" },
];
/** Brands and logos: names are removed, never replaced with a lookalike. */
const BRANDS = ["nike", "adidas", "gucci", "louis vuitton", "chanel", "coca-cola", "coca cola", "pepsi", "mcdonald's", "mcdonalds", "starbucks", "apple logo", "supreme", "disney", "pixar", "marvel", "dc comics", "nintendo", "pokemon", "pokémon", "lego", "star wars", "minecraft", "fortnite"];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (name: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, "giu");

export type RewriteHit = { name: string; generic: string };

/** Replace copyrighted character names with generic descriptions. Brand names are dropped. */
export function rewriteCopyrighted(text: string): { text: string; hits: RewriteHit[] } {
  let out = text;
  const hits: RewriteHit[] = [];
  for (const c of CHARACTERS) {
    for (const n of [...c.names].sort((a, b) => b.length - a.length)) {
      const re = wordRe(n);
      const m = out.match(re);
      if (m) {
        hits.push({ name: m[0], generic: c.generic });
        out = out.replace(re, c.generic);
        // "Meeko the raccoon" -> "a friendly raccoon", not "a friendly raccoon the raccoon"
        const noun = c.generic.split(" ").pop()!;
        out = out.replace(new RegExp(`${escapeRe(c.generic)}\\s+(?:the|a|an)\\s+${escapeRe(noun)}`, "i"), c.generic);
      }
    }
  }
  for (const b of BRANDS) {
    const re = wordRe(b);
    const m = out.match(re);
    if (m) {
      hits.push({ name: m[0], generic: "" });
      out = out.replace(re, "").replace(/\s{2,}/g, " ").trim();
    }
  }
  return { text: out, hits };
}

export function copyrightMessage(hits: RewriteHit[]): string {
  const withGeneric = hits.find((h) => h.generic);
  if (!withGeneric) return "I'll leave the logo off and keep the style. Sound good?";
  return `I can't draw ${withGeneric.name}. I can do something with the same spirit, though. How about ${withGeneric.generic}?`;
}

export const REWRITE_CHIPS = ["Yes, do that", "I'll rephrase"] as const;

/* ---------- text checks ---------- */

export type TextVerdict =
  | { ok: true; text: string }
  | { ok: false; kind: "sensitive" | "public_figure"; message: string }
  | { ok: false; kind: "copyright"; message: string; rewritten: string; hits: RewriteHit[] };

/** Strip control characters and cap runaway whitespace before anything reaches a model or a prompt. */
export function cleanText(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]{3,}/g, "  ").trim();
}

/** `nameLike` fields (first names, relationships) only get the sensitive-content check: "Elsa" can be a grandma. */
export function checkText(raw: string, opts: { nameLike?: boolean } = {}): TextVerdict {
  const text = cleanText(raw);
  if (SENSITIVE.some((re) => re.test(text))) return { ok: false, kind: "sensitive", message: SENSITIVE_MESSAGE };
  if (opts.nameLike) return { ok: true, text };
  const lower = text.toLowerCase();
  if (PUBLIC_FIGURES.some((n) => wordRe(n).test(lower))) return { ok: false, kind: "public_figure", message: PUBLIC_FIGURE_MESSAGE };
  const rw = rewriteCopyrighted(text);
  if (rw.hits.length) return { ok: false, kind: "copyright", message: copyrightMessage(rw.hits), rewritten: rw.text, hits: rw.hits };
  return { ok: true, text };
}

const TEXT_FIELDS = ["relationship", "recipientName", "occasionOther", "idea", "message", "insideJokes", "include", "avoid", "signoff"] as const;

export type DraftVerdict = { ok: true } | { ok: false; field: (typeof TEXT_FIELDS)[number]; verdict: Exclude<TextVerdict, { ok: true }> };

/** Check every free-text field in a draft. First failure wins. */
export function checkDraft(d: CardDraft): DraftVerdict {
  for (const field of TEXT_FIELDS) {
    const v = d[field];
    if (!v) continue;
    const verdict = checkText(v, { nameLike: field === "recipientName" || field === "relationship" || field === "signoff" });
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
