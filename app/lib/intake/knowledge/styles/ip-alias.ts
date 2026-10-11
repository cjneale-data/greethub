/**
 * Maps customer phrases such as "like a movie from a big studio" or a franchise name to the nearest GENERIC style id.
 * The phrases live in docs/design/style-library.json (ipSafeAliases) and are matched here against customer text only.
 * They are never put into a prompt, a note shown to the customer, or a retrieval document. Server-side: this pulls in the full library.
 */
import { STYLE_LIBRARY } from "./library.generated";
import type { StyleEntry } from "./types";

const norm = (s: string) =>
  ` ${s.normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;

type Alias = { phrase: string; style: StyleEntry };
const ALIASES: Alias[] = STYLE_LIBRARY.flatMap((style) => style.ipSafeAliases.map((a) => ({ phrase: norm(a), style }))).sort((a, b) => b.phrase.length - a.phrase.length);

export type AliasMatch = { styleId: StyleEntry["id"]; styleName: string };

/** The generic style for a franchise-look request, or null. Longest phrase wins. Matching is on whole words. */
export function matchIpSafeAlias(text: string): AliasMatch | null {
  if (!text) return null;
  const t = norm(text);
  for (const a of ALIASES) if (t.includes(a.phrase)) return { styleId: a.style.id, styleName: a.style.name };
  return null;
}

/** All alias phrases (normalised). Used by tests to prove none leaks into a prompt. */
export const allAliasPhrases = (): string[] => ALIASES.map((a) => a.phrase.trim());
