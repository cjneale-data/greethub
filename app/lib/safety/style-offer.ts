/**
 * Franchise-look requests become an offer of the nearest GENERIC style (docs/design/03-selection-guide.md section 5).
 * "Make it like a famous movie" never reaches a prompt: the style library maps customer phrases (ipSafeAliases) to a style
 * id, and the only things shown to the customer or sent onward are the generic style's own name and a friendly note.
 * Server-side: it uses the full style library.
 */
import { matchIpSafeAlias } from "../intake/knowledge/styles/ip-alias";
import { getStyle } from "../intake/knowledge/styles/recommend";
import type { IpInput, IpResult, IpSafetyService } from "./types";

export type StyleOffer = { styleId: string; styleName: string; note: string };

/** Fields where a look request is meaningful (not printed card text). */
const OFFER_FIELDS: ReadonlySet<string> = new Set(["chat", "card_idea", "story_idea", "brief_field", "character_note", "reroll_note"]);

/** The generic style for a franchise-look request in `text`, with a one-line note. Null when nothing matches. */
export function styleOfferFor(text: string, product?: "card" | "book"): StyleOffer | null {
  const hit = matchIpSafeAlias(text);
  if (!hit) return null;
  const style = getStyle(hit.styleId);
  if (!style || (product && !style.products.includes(product))) return null;
  return {
    styleId: style.id,
    styleName: style.name,
    note: `We make our own looks, so here is the closest one: ${style.name}. ${style.whyThisOne} Change it any time.`,
  };
}

/** Wrap a safety service so every result for a look-request field carries a styleOffer. Rewrites and blocks are untouched. */
export function withStyleOffers(inner: IpSafetyService): IpSafetyService {
  const attach = (input: IpInput, r: IpResult): IpResult => {
    if (!OFFER_FIELDS.has(input.field) || r.verdict === "blocked") return r;
    const offer = styleOfferFor(input.text);
    return offer ? { ...r, styleOffer: offer } : r;
  };
  return {
    name: inner.name,
    async screen(input) {
      return attach(input, await inner.screen(input));
    },
    async screenBatch(inputs) {
      const out = await inner.screenBatch(inputs);
      return out.map((r, i) => attach(inputs[i], r));
    },
  };
}
