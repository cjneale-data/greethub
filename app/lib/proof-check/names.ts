/** Name spelling checks for the proof checker. Heuristic and rules only: every hit is a warning the customer can dismiss. */

const STOP = new Set(
  `merry christmas happy holidays holiday season seasons greetings love wishing warm warmest wishes joy joyful peace noel hanukkah
  kwanzaa year years with from the and our your this that thank thanks cheers best family families dear hello hope have
  wonderful bright blessings celebrate celebrating together home sweet dreams winter cozy magic magical jolly merriest
  happiest hugs kisses always forever more most please save date party invite`.split(/\s+/),
);

export const normalizeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Capitalised words of 4+ letters, apostrophes and hyphens kept inside the word, common holiday words dropped. */
export function nameTokens(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\p{Lu}[\p{L}'’-]*/gu)) {
    const t = m[0].replace(/’/g, "'").replace(/[-']+$/, (x) => (x === "'" ? x : ""));
    const bare = normalizeName(t.replace(/'s?$/i, ""));
    if (bare.length >= 4 && !STOP.has(bare)) out.push(t);
  }
  return out;
}

export type NameForm = { raw: string; base: string; stem: string; possessive: boolean };

export function nameForm(raw: string): NameForm {
  const n = normalizeName(raw.replace(/’/g, "'"));
  const possessive = /'s$/.test(n) || /s'$/.test(n);
  const base = n.replace(/'s$/, "").replace(/'$/, "");
  return { raw, base, stem: base.replace(/s$/, ""), possessive };
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export type NameIssue = { forms: string[]; reason: "plural_vs_possessive" | "spelled_two_ways" | "differs_from_family_name" };

/**
 * `slots` is the text of each slot (all sides). Flags:
 *  - "Riveras" in one place and "Rivera's" in another (plural or possessive, one of them wrong);
 *  - two spellings one or two letters apart in different slots ("Rivera" / "Rivara"); same-slot pairs are left alone,
 *    since "Anna and Hanna" is deliberate;
 *  - any word within one or two letters of `familyName` but not equal to it (when the customer entered one).
 */
export function checkNames(slots: string[], familyName?: string): NameIssue[] {
  const issues: NameIssue[] = [];
  const seen = new Set<string>();
  const add = (i: NameIssue) => {
    const k = i.reason + ":" + i.forms.map(normalizeName).sort().join("|");
    if (!seen.has(k)) { seen.add(k); issues.push(i); }
  };
  const per = slots.map((s) => [...new Set(nameTokens(s))].map(nameForm));
  const list = [...new Map(per.flat().map((f) => [f.raw.toLowerCase(), f])).values()];

  for (const a of list) {
    if (!a.possessive) continue;
    for (const b of list) {
      if (!b.possessive && b.base.endsWith("s") && b.base.slice(0, -1) === a.base && a.base.length >= 4) add({ forms: [b.raw, a.raw], reason: "plural_vs_possessive" });
    }
  }
  for (let i = 0; i < per.length; i++) {
    for (let j = i + 1; j < per.length; j++) {
      for (const a of per[i]) for (const b of per[j]) {
        if (a.stem === b.stem) continue;
        if (per[i].some((x) => x.stem === b.stem) || per[j].some((x) => x.stem === a.stem)) continue;
        const d = editDistance(a.stem, b.stem);
        const limit = Math.min(a.stem.length, b.stem.length) >= 7 ? 2 : 1;
        if (d >= 1 && d <= limit) add({ forms: [a.raw, b.raw], reason: "spelled_two_ways" });
      }
    }
  }
  const fam = familyName ? nameForm(familyName.trim()) : undefined;
  if (fam && fam.stem.length >= 3) {
    for (const f of list) {
      const d = editDistance(f.stem, fam.stem);
      if (d >= 1 && d <= (fam.stem.length >= 7 ? 2 : 1) && f.stem.length >= 4) add({ forms: [fam.raw, f.raw], reason: "differs_from_family_name" });
    }
  }
  return issues;
}
