/** "thank_you" -> "Thank you". Occasion ids are snake_case in the catalog. */
export const occasionLabel = (id: string) => {
  const t = id.replace(/_/g, " ");
  return (t.charAt(0).toUpperCase() + t.slice(1)).replace("Mothers day", "Mother's Day").replace("Fathers day", "Father's Day").replace("Valentines", "Valentine's");
};

/** The one view of a card the browse grid needs. No price: tiles never show one (docs/cx/stock-cards-ux.md section 3). */
export type TileCard = { id: string; title: string; occasion: string; tone: string; preview: string; alt: string };
