"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, ChipGroup, Segmented, TemplateCard } from "@/components/brand";
import { OCCASION_FILTERS, TEMPLATES, templateHref, templatePrice, type Template } from "@/lib/shop/templates";
import { EmptyState, Modal } from "./ui";

const TONES = ["Any", "Funny", "Heartfelt", "Adventurous"];

export function Browse({ limit, compact }: { limit?: number; compact?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const product = sp.get("product") === "book" ? "Picture books" : "Cards";
  const [occasion, setOccasion] = useState("All");
  const [tone, setTone] = useState("Any");
  const [open, setOpen] = useState<Template | null>(null);
  const setProduct = (v: string) => router.replace(v === "Cards" ? "/browse?product=card" : "/browse?product=book", { scroll: false });

  const list = TEMPLATES.filter((t) => (compact ? true : t.product === (product === "Cards" ? "card" : "book")))
    .filter((t) => occasion === "All" || t.occasionLabel === occasion)
    .filter((t) => tone === "Any" || t.tone === tone.toLowerCase());
  const shown = limit ? list.slice(0, limit) : list;

  return (
    <div>
      {!compact && (
        <div className="gs-filters">
          <div className="gs-row gs-row--between">
            <h1 className="gs-h2" style={{ margin: 0 }}>{product}</h1>
            <Segmented options={["Cards", "Picture books"]} value={product} onChange={setProduct} />
          </div>
          <div className="gs-filter-row">
            <span>Occasion</span>
            <div className="gs-scroll-x">
              <ChipGroup options={["All", ...OCCASION_FILTERS.filter((o) => TEMPLATES.some((t) => t.occasion === o.id && t.product === (product === "Cards" ? "card" : "book"))).map((o) => o.label)]} value={occasion} onChange={setOccasion} />
            </div>
          </div>
          <div className="gs-filter-row">
            <span>Tone</span>
            <div className="gs-scroll-x">
              <ChipGroup options={TONES} value={tone} onChange={setTone} />
            </div>
          </div>
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState message="Nothing for that mix yet. Try fewer filters, or start from a blank page." actions={[{ label: "Start from a blank page", href: product === "Cards" ? "/create/card" : "/create/book" }]} />
      ) : (
        <div className="gs-templates">
          {shown.map((t, i) => (
            <TemplateCard key={t.id} title={t.title} aside={templatePrice(t)} tone={t.tile} tilt={i % 6} placeholderLabel={t.placeholder} image={t.image} onClick={() => setOpen(t)} />
          ))}
          {!compact && !limit && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
              <Button variant="secondary" onClick={() => router.push(product === "Cards" ? "/create/card" : "/create/book")}>
                Start from a blank page
              </Button>
            </div>
          )}
        </div>
      )}
      {open && (
        <Modal
          title={open.title}
          onClose={() => setOpen(null)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setOpen(null)}>Not now</Button>
              <Button onClick={() => router.push(templateHref(open))}>Use this template</Button>
            </>
          }
        >
          <div className="gs-template-preview">
            <div>
              <TemplateCard title={open.title} tone={open.tile} placeholderLabel={open.placeholder} image={open.image} />
            </div>
            <div className="gs-stack gs-stack--sm">
              <div className="gs-row">
                {open.isNew && <Badge tone="new">New</Badge>}
                <Badge tone="draft">{open.product === "card" ? "Card" : "Picture book"}</Badge>
              </div>
              <p style={{ margin: 0 }}>
                {open.occasionLabel}, {open.tone}. Drawn in {open.styleLabel.toLowerCase()}.
              </p>
              <p className="gs-muted gs-small" style={{ margin: 0 }}>Change anything you like.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
