import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadyCardEditor } from "@/components/stock/ReadyCardEditor";
import { SkeletonList } from "@/components/shop/ui";
import { getCard } from "@/lib/stock/catalog";
import { STOCK_LIMITS } from "@/lib/stock/config";
import { stockPriceInfo } from "@/lib/stock/pricing";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = getCard((await params).id);
  if (!card) return { title: "Card not found | GreetHub", robots: { index: false, follow: false } };
  return pageMetadata({ title: `${card.title}: Ready Card | GreetHub`, description: "Already drawn. Edit the message, add your signature, send.", path: `/ready-cards/${card.id}`, noPin: true });
}

async function Editor({ params }: Props) {
  const card = getCard((await params).id);
  if (!card) notFound();
  const pick = (p: ReturnType<typeof stockPriceInfo>) => ({ allInCents: p.allInCents, merchandiseCents: p.merchandiseCents, postageCents: p.postageCents });
  return (
    <ReadyCardEditor
      card={{ id: card.id, title: card.title, occasion: card.occasion, alt: card.altText, preview: card.frontArt.preview, defaultMessage: card.defaultMessage, suggestions: card.messageSuggestions ?? [] }}
      limits={{ maxChars: STOCK_LIMITS.maxChars, maxLines: STOCK_LIMITS.maxLines, maxWordChars: STOCK_LIMITS.maxWordChars }}
      prices={{ mailed: pick(stockPriceInfo("mailed")), digital: pick(stockPriceInfo("digital")) }}
    />
  );
}

export default function ReadyCardPage({ params }: Props) {
  return (
    <div className="gs-page">
      <Suspense fallback={<SkeletonList rows={2} h={220} />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}
