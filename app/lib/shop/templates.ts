import { PRICING, formatMoneyShort, OCCASIONS, STYLE_NAMES, type ArtStyleId } from "@greethub/shared";

/** The 12 starter templates from docs/cmo/templates.md. Cover art is generated once and added as static assets later; until then tiles use the brand placeholder. */
export type Template = {
  id: string;
  title: string;
  occasion: (typeof OCCASIONS)[number];
  occasionLabel: string;
  product: "card" | "book";
  tone: "funny" | "heartfelt" | "adventurous";
  /** Style library id (docs/design/style-library.json). The CMO preset ids in docs/cmo/templates.md resolve to these. */
  style: ArtStyleId;
  /** Display name, always the style library name (STYLE_NAMES) so tiles and the picker agree. */
  styleLabel: string;
  placeholder: string;
  tile: "blush" | "marigold" | "cream";
  isNew?: boolean;
  /** Static cover path once the art exists, e.g. /templates/big-birthday.jpg */
  image?: string;
};

const T = (t: Omit<Template, "styleLabel">): Template => ({ ...t, styleLabel: STYLE_NAMES[t.style] });

export const TEMPLATES: Template[] = [
  T({ id: "big-birthday", title: "Big Birthday", occasion: "birthday", occasionLabel: "Birthday", product: "card", tone: "funny", style: "bold_cartoon_pop", placeholder: "lopsided cake", tile: "marigold" }),
  T({ id: "for-nonna", title: "For Nonna", occasion: "birthday", occasionLabel: "Birthday", product: "card", tone: "heartfelt", style: "watercolor_wash", placeholder: "lemons and tea", tile: "cream" }),
  T({ id: "hello-little-one", title: "Hello, Little One", occasion: "new_baby", occasionLabel: "New baby", product: "card", tone: "heartfelt", style: "watercolor_wash", placeholder: "sleeping fox", tile: "blush", isNew: true }),
  T({ id: "thanks-coach", title: "Thanks, Coach", occasion: "thank_you", occasionLabel: "Thank you", product: "card", tone: "funny", style: "paper_cut_collage", placeholder: "whistle and trophy", tile: "marigold" }),
  T({ id: "just-wanted-you-to-know", title: "Just Wanted You to Know", occasion: "just_because", occasionLabel: "Just because", product: "card", tone: "heartfelt", style: "ink_wash", placeholder: "daisies", tile: "blush" }),
  T({ id: "forever-starting-now", title: "Forever, Starting Now", occasion: "wedding", occasionLabel: "Wedding", product: "card", tone: "heartfelt", style: "ink_wash", placeholder: "olive branches", tile: "cream" }),
  T({ id: "get-well-grumpy-bear", title: "Get Well, Grumpy Bear", occasion: "get_well", occasionLabel: "Get well", product: "card", tone: "funny", style: "bold_cartoon_pop", placeholder: "bear with soup", tile: "marigold" }),
  T({ id: "merry-and-bright", title: "Merry and Bright", occasion: "christmas", occasionLabel: "Christmas", product: "card", tone: "heartfelt", style: "cozy_gouache", placeholder: "snowy cabin", tile: "cream" }),
  T({ id: "mum-you-did-it", title: "Mom, You Did It", occasion: "mothers_day", occasionLabel: "Mother's Day", product: "card", tone: "heartfelt", style: "paper_cut_collage", placeholder: "paper flower", tile: "blush" }),
  T({ id: "our-summer", title: "Our Summer", occasion: "just_because", occasionLabel: "Just because", product: "book", tone: "adventurous", style: "cozy_gouache", placeholder: "rowboat at dusk", tile: "marigold" }),
  T({ id: "night-the-moon-came-down", title: "The Night the Moon Came Down", occasion: "birthday", occasionLabel: "Birthday", product: "book", tone: "adventurous", style: "watercolor_wash", placeholder: "moon on a hill", tile: "blush" }),
  T({ id: "day-we-moved-in", title: "The Day We Moved In", occasion: "other", occasionLabel: "Moving house", product: "book", tone: "funny", style: "bold_cartoon_pop", placeholder: "moving truck", tile: "cream" }),
];

/** Price shown on a tile's aside: the cheapest way to get it. */
export function templatePrice(t: Template): string {
  return formatMoneyShort(t.product === "card" ? PRICING.skus.card_mailed.cents : PRICING.skus.book_24.cents);
}

export function templateHref(t: Template): string {
  const q = new URLSearchParams({ template: t.id, occasion: t.occasion, tone: t.tone, style: t.style });
  if (t.occasion === "other") q.set("occasionOther", t.occasionLabel);
  return `/create/${t.product}?${q.toString()}`;
}

export const OCCASION_FILTERS = Array.from(new Map(TEMPLATES.map((t) => [t.occasion, t.occasionLabel])).entries()).map(([id, label]) => ({ id, label }));
