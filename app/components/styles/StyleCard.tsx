"use client";
import Image from "next/image";
import type { PickerStyle } from "@/lib/intake/knowledge/styles/types";

/** One selectable style: sample thumbnail (or a clean swatch placeholder when no render exists), name, short description, optional "why this one" line. */
export function StyleCard({
  style, selected, why, tabIndex, onSelect, testId,
}: {
  style: PickerStyle;
  selected: boolean;
  why?: string;
  tabIndex: number;
  onSelect: () => void;
  testId?: string;
}) {
  const sample = style.thumbnail.rendered && style.thumbnail.file;
  return (
    <button type="button" role="radio" aria-checked={selected} tabIndex={tabIndex} className="sbc" onClick={onSelect} data-testid={testId} data-style-id={style.id}>
      <span className="sbc__media">
        {sample ? (
          <Image src={`/styles/${style.thumbnail.file}`} alt="" width={320} height={320} unoptimized loading="lazy" />
        ) : (
          <span className="sbc__placeholder" aria-hidden="true">
            {style.swatches.slice(0, 5).map((c, i) => (
              <i key={i} style={{ background: c }} />
            ))}
          </span>
        )}
        <span className="sbc__tag">{sample ? "Sample" : "Colors only"}</span>
      </span>
      <span className="sbc__swatches" aria-hidden="true">
        {style.swatches.map((c, i) => (
          <i key={i} style={{ background: c }} />
        ))}
      </span>
      <span className="sbc__name">
        {style.name}
        {style.status === "beta" ? " (beta)" : ""}
      </span>
      <span className="sbc__desc">{style.description}</span>
      {why && <span className="sbc__why">{why}</span>}
      <span className="sbc__check" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
