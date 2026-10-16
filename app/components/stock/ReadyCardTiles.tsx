"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import "@/components/shop/home-gallery.css";
import "./stock.css";
import { occasionLabel, type TileCard } from "./labels";

const RESTING_TILT = [-2.5, 1.5, -1, 2.5];

/**
 * Ready Card tiles. Same motion as the home gallery (reveal, tilt, cover opens on hover/focus, all off under reduced motion),
 * but no price anywhere, and a "Ready to send" label in text on every tile.
 */
export function ReadyCardTiles({ cards }: { cards: TileCard[] }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>(".hg__card"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      tiles.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    tiles.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [cards]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const card = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      card.style.setProperty("--rx", `${((0.5 - y) * 12).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((x - 0.5) * 14).toFixed(2)}deg`);
      card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    });
  };
  const onLeave = (e: PointerEvent<HTMLElement>) => {
    cancelAnimationFrame(frame.current);
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={root} className="hg__grid rc-grid">
      {cards.map((t, i) => (
        <Link
          key={t.id}
          href={`/ready-cards/${t.id}`}
          className="hg__card"
          aria-label={`${t.title}. Ready to send. Choose this card.`}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={{ "--i": i, "--tilt": `${RESTING_TILT[i % RESTING_TILT.length]}deg`, "--par": 0 } as CSSProperties}
        >
          <span className="hg__tilt">
            <span className="hg__book">
              <span className="hg__inside">
                <span className="hg__eyebrow">{occasionLabel(t.occasion)}</span>
                <span className="hg__title">{t.title}</span>
                <span className="hg__go">Choose this card <span aria-hidden="true">→</span></span>
              </span>
              <span className="hg__cover rc-cover" data-tone={i % 3}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.preview} alt="" loading="lazy" draggable={false} style={{ display: "none" }} onLoad={(e) => { e.currentTarget.style.display = ""; }} />
                <span className="rc-cover__title" aria-hidden="true">{t.title}</span>
                <span className="hg__glare" aria-hidden="true" />
              </span>
            </span>
          </span>
          <span className="hg__caption rc-caption">
            <span className="rc-badge">Ready to send</span>
            <span className="rc-caption__title">{t.title}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
