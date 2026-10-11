"use client";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/brand";
import { PICKER_CATEGORIES, PICKER_STYLES } from "@/lib/intake/knowledge/styles/picker.generated";
import { recommendFrom, type StyleBrief } from "@/lib/intake/knowledge/styles/recommend-core";
import { StyleCard } from "./StyleCard";
import "./styles.css";

export type StyleSuggestion = { styleId: string; note: string };

/** Arrow keys move the choice inside a radiogroup (roving tabindex), as the UX standards require for single choice. */
function arrowKeys(e: KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
  if (!keys.includes(e.key)) return;
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'));
  const i = radios.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
  const next = radios[(i + step + radios.length) % radios.length];
  next.focus();
  next.click();
}

/**
 * Style picker for the card and book creators. Shows "Recommended for you" first (with a plain-language why line),
 * then every look grouped into categories a customer can browse. Data comes from the generated style library; the
 * recommendation is the same rule score the Greet Guide uses (recommend-core).
 */
export function StyleBrowser({
  product, value, onChange, brief, suggestion, testIdPrefix = "style",
}: {
  product: "card" | "book";
  /** Selected style id (canonical), or empty. */
  value?: string;
  onChange: (id: string) => void;
  /** What we already know: occasion, tone (funny, heartfelt, adventurous), readingAge for books. */
  brief?: Omit<StyleBrief, "product" | "query" | "limit">;
  /** A generic style offered because the customer asked for a franchise look. */
  suggestion?: StyleSuggestion | null;
  testIdPrefix?: string;
}) {
  const uid = useId();
  const [category, setCategory] = useState<string>("all");

  const available = useMemo(() => PICKER_STYLES.filter((s) => s.products.includes(product)), [product]);
  const recs = useMemo(() => recommendFrom(available, { ...brief, product, limit: 3 }), [available, brief, product]);
  const hasSignal = !!(brief?.occasion || brief?.tone || brief?.readingAge);

  const categories = PICKER_CATEGORIES.filter((c) => available.some((s) => s.category === c.id));
  const shown = available.filter((s) => category === "all" || s.category === category);
  const picked = available.find((s) => s.id === value);
  const pickedWhy = picked ? (recs.find((r) => r.styleId === picked.id)?.why ?? picked.whyThisOne) : "";
  const activeCategory = categories.find((c) => c.id === category);
  const suggested = suggestion ? available.find((s) => s.id === suggestion.styleId) : undefined;

  const filters = [{ id: "all", name: "All looks", n: available.length }, ...categories.map((c) => ({ id: c.id, name: c.name, n: available.filter((s) => s.category === c.id).length }))];

  return (
    <div className="sb" data-testid={`${testIdPrefix}-browser`}>
      {suggested && suggestion && (
        <div className="sb__offer" role="status">
          <p>{suggestion.note}</p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => onChange(suggested.id)}>
              {`Use ${suggested.name}`}
            </Button>
          </div>
        </div>
      )}

      <section aria-labelledby={`${uid}-rec`} className="sb">
        <h3 className="sb__section-title" id={`${uid}-rec`}>
          {hasSignal ? "Recommended for you" : "Popular picks"}
        </h3>
        <p className="sb__hint">{hasSignal ? "Picked from what you have told us so far." : "Tell us the occasion and the feel, and these will change."}</p>
        <div className="sb__grid" role="radiogroup" aria-labelledby={`${uid}-rec`} onKeyDown={arrowKeys}>
          {recs.map((r, i) => {
            const s = available.find((x) => x.id === r.styleId)!;
            const rovingHere = recs.some((x) => x.styleId === value) ? s.id === value : i === 0;
            return <StyleCard key={s.id} style={s} selected={s.id === value} why={r.why} tabIndex={rovingHere ? 0 : -1} onSelect={() => onChange(s.id)} testId={`${testIdPrefix}-${s.id}`} />;
          })}
        </div>
      </section>

      <section aria-labelledby={`${uid}-all`} className="sb">
        <h3 className="sb__section-title" id={`${uid}-all`}>
          Browse all looks
        </h3>
        <div className="sb__filters" role="radiogroup" aria-label="Look categories" onKeyDown={arrowKeys}>
          {filters.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={category === c.id} tabIndex={category === c.id ? 0 : -1} className="gh-chip" onClick={() => setCategory(c.id)}>
              {c.name}
              <span className="sb__chip-n">{c.n}</span>
            </button>
          ))}
        </div>
        {activeCategory && <p className="sb__hint">{activeCategory.blurb}</p>}
        <div className="sb__grid sb__grid--wide" role="radiogroup" aria-label={activeCategory ? activeCategory.name : "All looks"} onKeyDown={arrowKeys}>
          {shown.map((s, i) => {
            const rovingHere = shown.some((x) => x.id === value) ? s.id === value : i === 0;
            return <StyleCard key={s.id} style={s} selected={s.id === value} tabIndex={rovingHere ? 0 : -1} onSelect={() => onChange(s.id)} testId={`${testIdPrefix}-all-${s.id}`} />;
          })}
        </div>
      </section>

      <p className="sb__status" role="status" aria-live="polite">
        {picked ? `Chosen: ${picked.name}. ${pickedWhy}` : "No look chosen yet."}
      </p>
    </div>
  );
}
