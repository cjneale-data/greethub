import type { CSSProperties } from "react";

const TILTS = [-2, 2, -1.5, 3, -3, 1];
const TONES = {
  blush: ["#F6C9C0", "#F9D7D0", "#5B2A4B"],
  marigold: ["#F5B83D", "#F8C964", "#2B1E18"],
  cream: ["#F3EADB", "#F8F1E6", "#6B5A50"],
} as const;

/** tilt < 10 and a non-negative integer is an index into the preset tilts; anything else is degrees. */
export function tiltDegrees(tilt: number): number {
  return Number.isInteger(tilt) && tilt >= 0 && tilt < 10 ? TILTS[tilt % TILTS.length] : tilt;
}

export function TemplateCard({
  title,
  aside,
  image,
  tone = "blush",
  tilt = 0,
  placeholderLabel = "cover image",
  onClick,
}: {
  title: string;
  aside?: string;
  image?: string;
  tone?: keyof typeof TONES;
  tilt?: number;
  placeholderLabel?: string;
  onClick?: () => void;
}) {
  const [a, b, fg] = TONES[tone];
  const ph = { "--a": a, "--b": b, color: fg } as CSSProperties;
  // Only a clickable card is a button. A display-only card (cart line, drafts) was a nameless, do-nothing tab stop (axe button-name).
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className="gh-card" style={{ transform: `rotate(${tiltDegrees(tilt)}deg)` }} {...(onClick ? { type: "button" as const, onClick } : {})}>
      <div className="gh-card__media">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" />
        ) : (
          <div className="gh-placeholder" style={ph}>
            {placeholderLabel}
          </div>
        )}
      </div>
      <div className="gh-card__meta">
        <span className="gh-card__title">{title}</span>
        {aside && <span className="gh-card__aside">{aside}</span>}
      </div>
    </Tag>
  );
}
