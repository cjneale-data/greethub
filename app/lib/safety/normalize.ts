/**
 * Text normaliser for IP matching. Folds case, accents, full-width letters, common look-alike letters,
 * zero-width characters, leetspeak (h4rry p0tter) and spaced-out letters (E L S A, e.l.s.a), and keeps a map
 * from every normalised character back to the customer's original text so a match can be replaced in place.
 * Pure; no dependencies.
 */

export type Norm = {
  /** Normalised text: lowercase letters/digits separated by single spaces. */
  s: string;
  /** For each char of `s`, the start offset in the original string. */
  start: number[];
  /** For each char of `s`, the end offset (exclusive) in the original string. */
  end: number[];
};

const HOMOGLYPH: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "һ": "h", "к": "k", "м": "m", "т": "t", "в": "b", "н": "h",
  "ο": "o", "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ρ": "p", "τ": "t", "υ": "u", "χ": "x",
};
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i", "+": "t", "|": "l" };
const ZERO_WIDTH = /[​-‏⁠﻿­‪-‮]/;
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);
const isApostrophe = (c: string) => c === "'" || c === "’" || c === "`" || c === "´" || c === "‘";

/** Folds one original character into zero or more normalised characters. */
function fold(c: string): string {
  const d = c.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  let out = "";
  for (const ch of d) out += HOMOGLYPH[ch] ?? ch;
  return out;
}

export function normalize(text: string): Norm {
  const chars: string[] = [];
  const start: number[] = [];
  const end: number[] = [];
  const cps: { ch: string; at: number }[] = [];
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    cps.push({ ch, at: i });
    i += ch.length;
  }
  const push = (ch: string, at: number, to: number) => {
    chars.push(ch);
    start.push(at);
    end.push(to);
  };
  for (let k = 0; k < cps.length; k++) {
    const { ch, at } = cps[k];
    const to = at + ch.length;
    if (ZERO_WIDTH.test(ch)) continue;
    if (isApostrophe(ch)) {
      // possessive 's disappears with its apostrophe: "Elsa's" -> "elsa"
      const nx = cps[k + 1]?.ch;
      const after = cps[k + 2]?.ch;
      if (nx && /s/i.test(nx) && !isLetter(after) && isLetter(cps[k - 1]?.ch)) k++;
      continue;
    }
    const prev = cps[k - 1]?.ch;
    const next = cps[k + 1]?.ch;
    if (LEET[ch] && ((isLetter(prev) && isLetter(next)) || (/[0-9]/.test(ch) && (isLetter(prev) || isLetter(next)) && !/[0-9]/.test(prev ?? "") && !/[0-9]/.test(next ?? "")))) {
      push(LEET[ch], at, to);
      continue;
    }
    if (/[\p{L}\p{N}]/u.test(ch)) {
      for (const f of fold(ch)) push(f, at, to);
      continue;
    }
    // any other character is a separator; runs collapse to one space
    if (chars.length && chars[chars.length - 1] !== " ") push(" ", at, to);
  }
  while (chars[chars.length - 1] === " ") {
    chars.pop();
    start.pop();
    end.pop();
  }
  while (chars[0] === " ") {
    chars.shift();
    start.shift();
    end.shift();
  }

  // Spaced-out letters: "e l s a" -> "elsa"
  const joined = chars.join("");
  const drop = new Set<number>();
  const run = /(?<![\p{L}\p{N}])\p{L}(?: \p{L}){2,}(?![\p{L}\p{N}])/gu;
  for (const m of joined.matchAll(run)) {
    for (let i = m.index!; i < m.index! + m[0].length; i++) if (joined[i] === " ") drop.add(i);
  }
  if (!drop.size) return { s: joined, start, end };
  const s2: string[] = [];
  const st2: number[] = [];
  const en2: number[] = [];
  chars.forEach((c, i) => {
    if (drop.has(i)) return;
    s2.push(c);
    st2.push(start[i]);
    en2.push(end[i]);
  });
  return { s: s2.join(""), start: st2, end: en2 };
}

/** Normal form of a table name: same folding, so "Spider-Man" and "spider man" compare equal. */
export function normName(name: string): string {
  return normalize(name).s;
}

/** Levenshtein distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
