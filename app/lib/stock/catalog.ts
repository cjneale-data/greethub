import raw from "./catalog.json";
import { isMockAi } from "../intake/config";
import { STOCK_PLACEHOLDER_ART } from "./config";
import type { StockCard } from "./types";

/**
 * Catalog loader. SOURCE OF TRUTH is docs/design/stock-cards.json (Head of Design). lib/stock/catalog.json is a verbatim
 * copy so the app can import it at runtime and on Vercel. Keep in sync with:
 *   cp docs/design/stock-cards.json app/lib/stock/catalog.json   (a test fails if the two differ)
 * Art is not rendered yet: previews are placeholders under /stock/, and nothing is IP-reviewed, so cards only sell in mock mode.
 */
type RawCard = {
  id: string;
  occasion: string;
  tone: string;
  title: string;
  styleId: string;
  frontArtBrief: string;
  defaultInside: string;
  altText: string;
  messageSuggestions?: string[];
};

export const CATALOG_VERSION: string = raw.version;
export const CATALOG_STATUS: string = raw.status;
const catalogReviewed = raw.status === "approved" || raw.status === "live";

function toCard(c: RawCard): StockCard {
  return {
    id: c.id,
    title: c.title,
    occasion: c.occasion,
    tone: c.tone,
    styleId: c.styleId,
    altText: c.altText,
    defaultMessage: c.defaultInside,
    messageSuggestions: c.messageSuggestions,
    frontArt: { preview: `${STOCK_PLACEHOLDER_ART}/${c.id}-800.webp`, print: `stock/${c.id}/front-print.png` },
    insideLayout: "message",
    frontArtBrief: c.frontArtBrief,
    status: "live",
    addedAt: raw.updated,
    ipReviewed: catalogReviewed,
  };
}

const ALL: StockCard[] = (raw.cards as RawCard[]).map(toCard);
const BY_ID = new Map(ALL.map((c) => [c.id, c]));

/** May this card be shown and sold? Live, and IP-reviewed unless we are in mock mode. */
export const isSellable = (c: StockCard): boolean => c.status === "live" && (c.ipReviewed || isMockAi());

export function listCards(f: { occasion?: string; tone?: string } = {}): StockCard[] {
  return ALL.filter((c) => isSellable(c) && (!f.occasion || c.occasion === f.occasion) && (!f.tone || c.tone === f.tone));
}

export const getCard = (id: string): StockCard | undefined => {
  const c = BY_ID.get(id);
  return c && isSellable(c) ? c : undefined;
};

export function listOccasions(): { occasion: string; count: number }[] {
  const n = new Map<string, number>();
  for (const c of listCards()) n.set(c.occasion, (n.get(c.occasion) ?? 0) + 1);
  return [...n].map(([occasion, count]) => ({ occasion, count }));
}
