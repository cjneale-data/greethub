"use client";
import { useEffect, useState } from "react";
import { CARD_MESSAGE_BOX_PX, handwritingFamily, isCustomStyle, presetById, type CardWritingInput, type SignatureFontId } from "@greethub/shared";
import type { WritingView } from "@/lib/writing/service";
import { signatureImageUrl } from "./useWriting";
import "./writing.css";

/**
 * The inside of a card as it will print: the message typeset, in a preset handwriting face, or in the member's own
 * handwriting (rendered on the server), then the signature. Used by the card preview and the account page.
 */
export function HandwrittenInside({ text, writing, className = "gc-card__msg", savedSignatures, box: boxProp }: {
  text: string;
  writing?: CardWritingInput;
  className?: string;
  /** The member's saved signatures, so a saved typed one is set in its font rather than fetched as an image. */
  savedSignatures?: WritingView["signatures"];
  /** Render box for own handwriting, in pixels; its shape should match where the image is shown. */
  box?: { width: number; height: number };
}) {
  // Default to the print box (taller when no signature band is reserved) so line breaks match the printed card.
  const signed = (writing?.signature?.kind ?? "none") !== "none";
  const box = boxProp ?? { width: CARD_MESSAGE_BOX_PX.width, height: signed ? CARD_MESSAGE_BOX_PX.heightWithSignature : CARD_MESSAGE_BOX_PX.height };
  const styleId = writing?.message === "handwritten" ? writing.styleId : undefined;
  const preset = styleId ? presetById(styleId) : undefined;
  const custom = isCustomStyle(styleId) ? styleId : undefined;
  const [img, setImg] = useState<{ key: string; url: string; unsupported: string } | null>(null);
  const key = custom ? `${custom}\u0000${text}` : "";

  useEffect(() => {
    if (!custom || !text.trim()) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/account/writing/styles/${encodeURIComponent(custom)}/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, width: box.width, height: box.height }),
          signal: ctl.signal,
        });
        if (!r.ok) return;
        const unsupported = decodeURIComponent(r.headers.get("X-Unsupported") ?? "");
        const url = URL.createObjectURL(await r.blob());
        setImg((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return { key, url, unsupported };
        });
      } catch {
        /* keep the typed fallback */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [custom, text, key, box.width, box.height]);

  const raw = writing?.signature;
  const saved = raw?.kind === "saved" ? savedSignatures?.find((s) => s.id === raw.signatureId) : undefined;
  // A saved typed signature prints as text in its font; show it the same way.
  const sig = saved?.kind === "typed" ? { kind: "typed" as const, text: saved.text ?? "", fontId: (saved.fontId ?? "allura") as SignatureFontId } : raw;
  return (
    <div className="gw-inside">
      {custom && img?.key === key ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from our own render route */}
          <img className="gw-inside__own" src={img.url} alt={text} />
          {img.unsupported && (
            <span className="gw-inside__warn" role="status">
              Your handwriting has no {[...img.unsupported].join(" ")}. Pick a preset style or leave those out, or this card can&apos;t print.
            </span>
          )}
        </>
      ) : (
        <p className={className} style={preset ? { fontFamily: `"${handwritingFamily(preset.id)}", cursive`, fontSize: `${1.25 * preset.sizeScale}em`, lineHeight: 1.35 } : undefined}>
          {text}
        </p>
      )}
      {sig?.kind === "typed" && sig.text && (
        <span className="gw-inside__sig gw-inside__sig--typed" style={{ fontFamily: `"${handwritingFamily(sig.fontId)}", cursive` }}>
          {sig.text}
        </span>
      )}
      {sig?.kind === "saved" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="gw-inside__sig" src={signatureImageUrl(sig.signatureId)} alt="Your signature" />
      )}
    </div>
  );
}
