"use client";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { TEMPLATES, templateImage } from "@/lib/shop/templates";
import "./home-gallery.css";

const DECK = ["night-the-moon-came-down", "big-birthday", "for-nonna", "merry-and-bright", "hello-little-one"]
  .map((id) => TEMPLATES.find((t) => t.id === id))
  .filter((t): t is NonNullable<typeof t> => Boolean(t));

/** Where a layer sits relative to the front card: 0 front, 1 and 2 fanned behind it, "out" flying off as it fades, "hide" waiting. */
function slot(i: number, active: number, n: number): "0" | "1" | "2" | "out" | "hide" {
  const r = (i - active + n) % n;
  if (r === 0) return "0";
  if (r === 1) return "1";
  if (r === 2) return "2";
  return r === n - 1 ? "out" : "hide";
}

/**
 * The hero card pile. The cards cross-fade through the deck (front card flies off and fades, the next slides forward),
 * and the whole pile leans toward the cursor. Decorative: aria-hidden, no focusable content, and it holds still for
 * prefers-reduced-motion or a hidden tab.
 */
export function HeroShowcase() {
  const [active, setActive] = useState(0);
  const pile = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (!timer) timer = setInterval(() => setActive((a) => (a + 1) % DECK.length), 3800);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = pile.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", (((clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      el.style.setProperty("--py", (((clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    pile.current?.style.setProperty("--px", "0");
    pile.current?.style.setProperty("--py", "0");
  };

  return (
    <div ref={pile} className="gh-hero__pile hs" aria-hidden="true" onPointerMove={onMove} onPointerLeave={onLeave}>
      {DECK.map((t, i) => (
        <div key={t.id} className="hs__card" data-slot={slot(i, active, DECK.length)} style={{ "--d": i % 3 } as CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={templateImage(t.id, 800)} alt="" draggable={false} loading={i === 0 ? "eager" : "lazy"} />
        </div>
      ))}
      <span className="hs__sticker">Love, Maya</span>
    </div>
  );
}
