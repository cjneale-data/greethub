import { ReadyCardsBrowse } from "@/components/stock/ReadyCardsBrowse";
import { listCards } from "@/lib/stock/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Ready Cards: cards you can send today | GreetHub",
  description: "Already drawn, ready for your words. Thank yous, birthdays, get wells and more. Pick one, make the message yours, and we print and mail it.",
  path: "/ready-cards",
});

export default function ReadyCardsPage() {
  const cards = listCards().map((c) => ({ id: c.id, title: c.title, occasion: c.occasion, tone: c.tone, preview: c.frontArt.preview, alt: c.altText }));
  return (
    <div className="gs-page">
      <ReadyCardsBrowse cards={cards} />
    </div>
  );
}
