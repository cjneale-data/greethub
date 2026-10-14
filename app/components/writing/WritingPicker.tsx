"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, TextField, Toggle } from "@/components/brand";
import {
  HANDWRITING_PRESETS, SIGNATURE_FONTS, handwritingFamily, type CardSignature, type CardWritingInput, type SignatureFontId,
} from "@greethub/shared";
import { checkText } from "@/lib/intake/guardrails";
import { onRadioKeys, rovingTab } from "./radioKeys";
import { signatureImageUrl, useWriting } from "./useWriting";
import "./writing.css";

/**
 * Card creator control for the inside: handwritten or typed message, which handwriting, and a signature.
 * Guests get the preset styles and a typed signature; members also see their own handwriting and saved signatures.
 */
export function WritingPicker({ value, onChange, signoff }: { value?: CardWritingInput; onChange: (w: CardWritingInput | undefined) => void; signoff?: string }) {
  const { state } = useWriting();
  const view = state.status === "ready" ? state.view : null;
  const w: CardWritingInput = value ?? { message: "typed", signature: { kind: "none" } };
  const handwritten = w.message === "handwritten";
  const sig = w.signature ?? { kind: "none" };
  const [typedName, setTypedName] = useState(sig.kind === "typed" ? sig.text : (signoff ?? "").replace(/^(love|with love|cheers|best|xo+|from)[,!]?\s*/i, ""));
  const nameVerdict = typedName.trim() ? checkText(typedName, { nameLike: true }) : null;
  const set = (patch: Partial<CardWritingInput>) => {
    const next = { ...w, ...patch };
    onChange(next.message === "typed" && (next.signature?.kind ?? "none") === "none" ? undefined : next);
  };
  const setSig = (s: CardSignature) => set({ signature: s });

  const styles = [
    ...HANDWRITING_PRESETS.map((p) => ({ id: p.id as string, name: p.name, family: handwritingFamily(p.id), note: p.note })),
    ...(view?.styles ?? []).map((s) => ({ id: s.id as string, name: s.name, family: "", note: "Your own handwriting" })),
  ];

  return (
    <div className="gw-picker">
      <Toggle checked={handwritten} onChange={(v) => set({ message: v ? "handwritten" : "typed", styleId: v ? (w.styleId ?? view?.defaultStyleId ?? "kalam") : w.styleId })}>
        Write the message by hand
      </Toggle>

      {handwritten && (
        <div className="gw-styles" role="radiogroup" aria-label="Handwriting style" onKeyDown={onRadioKeys}>
          {styles.map((s, i) => (
            <button key={s.id} type="button" role="radio" aria-checked={w.styleId === s.id} tabIndex={rovingTab(w.styleId === s.id, i, styles.some((x) => x.id === w.styleId))} className="gw-style" onClick={() => set({ styleId: s.id })}>
              <span className="gw-style__sample" style={s.family ? { fontFamily: `"${s.family}", cursive` } : undefined}>
                {s.family ? "Happy birthday!" : "✎ Mine"}
              </span>
              <span className="gw-style__name">{s.name}</span>
              <span className="gs-small gs-muted">{s.note}</span>
            </button>
          ))}
        </div>
      )}
      {handwritten && state.status === "guest" && (
        <p className="gs-small gs-muted" style={{ margin: 0 }}>
          Want it in your own handwriting? <Link className="gs-link" href="/signup?next=/account/handwriting">Make a free account</Link> and fill in one sheet.
        </p>
      )}
      {handwritten && view && view.styles.length === 0 && (
        <p className="gs-small gs-muted" style={{ margin: 0 }}>
          <Link className="gs-link" href="/account/handwriting">Create your own handwriting</Link> from one printed sheet.
        </p>
      )}

      <fieldset className="gw-sig">
        <legend className="gw-sig__legend">Signature</legend>
        <div className="gw-sig__opts" role="radiogroup" aria-label="Signature" onKeyDown={onRadioKeys}>
          <button type="button" role="radio" aria-checked={sig.kind === "none"} tabIndex={sig.kind === "none" || (sig.kind === "saved" && !view?.signatures.some((s) => s.id === sig.signatureId)) ? 0 : -1} className="gh-chip" onClick={() => setSig({ kind: "none" })}>None</button>
          <button type="button" role="radio" aria-checked={sig.kind === "typed"} tabIndex={sig.kind === "typed" ? 0 : -1} className="gh-chip" onClick={() => setSig({ kind: "typed", text: typedName.trim() || "Me", fontId: sig.kind === "typed" ? sig.fontId : "allura" })}>Type my name</button>
          {view?.signatures.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={sig.kind === "saved" && sig.signatureId === s.id} tabIndex={sig.kind === "saved" && sig.signatureId === s.id ? 0 : -1} className="gh-chip gw-sig__saved" onClick={() => setSig({ kind: "saved", signatureId: s.id as `sg_${string}` })}>
              {s.kind === "typed" ? (
                <span style={{ fontFamily: `"${handwritingFamily(s.fontId ?? "allura")}", cursive`, fontSize: 20 }}>{s.text}</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signatureImageUrl(s.id)} alt={s.label} />
              )}
            </button>
          ))}
        </div>
        {sig.kind === "typed" && (
          <div className="gw-sig__typed">
            <TextField
              label="Name to sign"
              value={typedName}
              maxLength={40}
              error={nameVerdict && !nameVerdict.ok ? "Try just your name, or the name you sign cards with." : undefined}
              onChange={(e) => {
                setTypedName(e.target.value);
                if (e.target.value.trim()) setSig({ kind: "typed", text: e.target.value.trim(), fontId: sig.fontId });
              }}
            />
            <div className="gw-styles gw-styles--sig" role="radiogroup" aria-label="Signature style" onKeyDown={onRadioKeys}>
              {SIGNATURE_FONTS.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={sig.fontId === f.id} tabIndex={sig.fontId === f.id ? 0 : -1} className="gw-style" onClick={() => setSig({ kind: "typed", text: typedName.trim() || "Me", fontId: f.id as SignatureFontId })}>
                  <span className="gw-style__sample gw-style__sample--sig" style={{ fontFamily: `"${handwritingFamily(f.id)}", cursive` }}>{typedName.trim() || "Your name"}</span>
                  <span className="gw-style__name">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {state.status === "guest" ? (
          <p className="gs-small gs-muted" style={{ margin: 0 }}>Members can draw or upload a real signature and reuse it on every card.</p>
        ) : view && view.signatures.length === 0 ? (
          <p className="gs-small gs-muted" style={{ margin: 0 }}>
            <Link className="gs-link" href="/account/handwriting">Draw or upload your signature</Link> to reuse it on every card.
          </p>
        ) : null}
      </fieldset>
      {(handwritten || sig.kind !== "none") && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>Use typed text, no signature</Button>
      )}
    </div>
  );
}
