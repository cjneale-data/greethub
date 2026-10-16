"use client";
import { useMemo, useState } from "react";
import { ButtonLink, ChipGroup } from "@/components/brand";
import { EmptyState } from "@/components/shop/ui";
import { ReadyCardTiles } from "./ReadyCardTiles";
import { TierSwitch } from "./TierSwitch";
import { occasionLabel, type TileCard } from "./labels";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ready Cards browse: occasion and tone chips over a tile grid. */
export function ReadyCardsBrowse({ cards }: { cards: TileCard[] }) {
  const occasions = useMemo(() => [...new Set(cards.map((c) => c.occasion))], [cards]);
  const tones = useMemo(() => [...new Set(cards.map((c) => c.tone))], [cards]);
  const [occasion, setOccasion] = useState("All");
  const [tone, setTone] = useState("Any");
  const list = cards.filter((c) => (occasion === "All" || occasionLabel(c.occasion) === occasion) && (tone === "Any" || cap(c.tone) === tone));

  return (
    <div className="gs-stack gs-stack--lg">
      <div className="gs-filters">
        <div className="gs-row gs-row--between" style={{ flexWrap: "wrap" }}>
          <h1 className="gs-h2" style={{ margin: 0 }}>Cards you can send today</h1>
          <TierSwitch current="ready" />
        </div>
        <p className="gs-muted" style={{ margin: 0 }}>Already designed. Change the words, add your handwriting, send.</p>
        <div className="gs-filter-row">
          <span>Occasion</span>
          <div className="gs-scroll-x"><ChipGroup options={["All", ...occasions.map(occasionLabel)]} value={occasion} onChange={setOccasion} /></div>
        </div>
        {tones.length > 1 && (
          <div className="gs-filter-row">
            <span>Tone</span>
            <div className="gs-scroll-x"><ChipGroup options={["Any", ...tones.map(cap)]} value={tone} onChange={setTone} /></div>
          </div>
        )}
        <p className="gs-small gs-muted" style={{ margin: 0 }} aria-live="polite">{list.length} {list.length === 1 ? "card" : "cards"}</p>
      </div>
      {list.length === 0 ? (
        <EmptyState message="Nothing for that mix yet. Try fewer filters, or make one just for them." actions={[{ label: "Make one from scratch", href: "/create/card" }]} />
      ) : (
        <ReadyCardTiles key={`${occasion}|${tone}`} cards={list} />
      )}
      <div className="rc-compare">
        <p style={{ margin: 0 }}><strong>Ready Cards:</strong> artwork made ahead, words made yours. <strong>Made for you:</strong> artwork drawn new from your story.</p>
        <ButtonLink variant="secondary" href="/create/card">Want it drawn just for them? Make one from scratch</ButtonLink>
      </div>
    </div>
  );
}
