"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { TEMPLATES, templateHref, templateImage } from "@/lib/shop/templates";
import "./home-gallery.css";

const CARDS = TEMPLATES.filter((t) => t.product === "card").slice(0, 8);
const RESTING_TILT = [-2.5, 1.5, -1, 2.5];

/**
 * The home page card gallery. No prices: it is for looking. Four layers of motion, all CSS-driven from a few custom properties:
 *  1. scroll reveal  - each card rises and settles as it enters (IntersectionObserver sets .is-in)
 *  2. scroll parallax - columns drift at different speeds (--p is the section's progress through the viewport)
 *  3. pointer tilt + glare - the card follows the cursor in 3D and a highlight tracks it (--rx --ry --mx --my)
 *  4. open on hover - the cover swings open to show the title; the other cards dim so the one you're on is the star
 * Touch devices get 1 and 2. prefers-reduced-motion gets none of them (the CSS and the effects below both check it).
 */
export function HomeGallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".hg__card"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    cards.forEach((c) => io.observe(c));

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const p = Math.max(-1, Math.min(1, (window.innerHeight / 2 - mid) / (window.innerHeight / 2 + r.height / 2)));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const frame = useRef(0);
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
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  return (
    <section ref={root} className="hg" id="cards" aria-labelledby="hg-title">
      <div className="hg__glow hg__glow--a" aria-hidden="true" />
      <div className="hg__glow hg__glow--b" aria-hidden="true" />
      <div className="hg__head">
        <h2 className="gs-h2" id="hg-title">Who are we celebrating?</h2>
        <p className="hg__lede">Pick a look to start from. You can change everything.</p>
      </div>
      <div className="hg__grid">
        {CARDS.map((t, i) => (
          <Link
            key={t.id}
            href={templateHref(t)}
            className="hg__card"
            aria-label={`${t.title}. Start with this card.`}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={
              {
                "--i": i,
                "--tilt": `${RESTING_TILT[i % RESTING_TILT.length]}deg`,
                "--par": [-34, 14, -18, 30][i % 4],
              } as CSSProperties
            }
          >
            <span className="hg__tilt">
              <span className="hg__book">
                <span className="hg__inside">
                  <span className="hg__eyebrow">{t.occasionLabel}</span>
                  <span className="hg__title">{t.title}</span>
                  <span className="hg__go">Make this card <span aria-hidden="true">→</span></span>
                </span>
                <span className="hg__cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={templateImage(t.id, 800)} alt="" loading="lazy" draggable={false} />
                  <span className="hg__glare" aria-hidden="true" />
                </span>
              </span>
            </span>
            <span className="hg__caption" aria-hidden="true">{t.title}</span>
          </Link>
        ))}
      </div>
      <p className="hg__more">
        <Link className="gs-link" href="/browse">See all templates</Link>
      </p>
    </section>
  );
}
