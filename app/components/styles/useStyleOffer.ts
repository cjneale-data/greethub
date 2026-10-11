"use client";
import { useEffect, useState } from "react";
import type { StyleSuggestion } from "./StyleBrowser";

/** Ask the server whether the text names a franchise look and, if so, which generic style to offer. Debounced; failures are silent. */
export function useStyleOffer(text: string, product: "card" | "book"): StyleSuggestion | null {
  const [offer, setOffer] = useState<StyleSuggestion | null>(null);
  const active = text.trim().length >= 4;
  useEffect(() => {
    if (!active) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/styles/offer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, product }), signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { offer: null }))
        .then((b: { offer: { styleId: string; note: string } | null }) => setOffer(b.offer ? { styleId: b.offer.styleId, note: b.offer.note } : null))
        .catch(() => undefined);
    }, 700);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [text, product, active]);
  return active ? offer : null;
}
