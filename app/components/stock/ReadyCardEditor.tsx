"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Segmented } from "@/components/brand";
import { WritingPicker } from "@/components/writing/WritingPicker";
import { api, setCartCount, useSession, useToast } from "@/components/shop/client";
import { formatMoney, type CardWritingInput } from "@greethub/shared";
import { occasionLabel } from "./labels";
import "./stock.css";

export type EditorCard = { id: string; title: string; occasion: string; alt: string; preview: string; defaultMessage: string; suggestions: string[] };
export type EditorPrices = { mailed: { allInCents: number; merchandiseCents: number; postageCents: number }; digital: { allInCents: number; merchandiseCents: number; postageCents: number } };
type Limits = { maxChars: number; maxLines: number; maxWordChars: number };

const DELIVERY = ["We mail it to them", "We mail it to me", "Send by email"] as const;
type Creation = { id: string; message: string; updatedAt: string };
type Fit = { fits: boolean; charsLeft: number; reason?: string };

/** Local mirror of lib/stock/fit.ts so typing never waits on the server. The server re-checks everything. */
function fitOf(message: string, l: Limits): Fit & { text: string | null } {
  const text = message.replace(/\r\n/g, "\n").trim();
  const chars = [...text].length;
  const lines = text ? text.split("\n").length : 0;
  const base = { charsLeft: l.maxChars - chars };
  if (!text) return { ...base, fits: false, reason: "empty", text: "Add a few words for the inside." };
  if (chars > l.maxChars) return { ...base, fits: false, reason: "too_long", text: `That's a bit long for the space. We'll fit up to ${l.maxChars} characters. Trim a few words?` };
  if (lines > l.maxLines) return { ...base, fits: false, reason: "lines", text: "That's a lot of short lines. Try fewer line breaks." };
  if (text.split(/\s+/).some((w) => [...w].length > l.maxWordChars)) return { ...base, fits: false, reason: "word", text: "One of those words is too long to fit. Check for a missing space." };
  return { ...base, fits: true, text: null };
}

/**
 * Ready Card editor: change the words, optional handwriting (members), choose digital or mailed, see the price, add to cart.
 * No chat, no render wait for art. The price first appears here, above the main button (docs/cx/stock-cards-ux.md section 3).
 */
export function ReadyCardEditor({ card, limits, prices }: { card: EditorCard; limits: Limits; prices: EditorPrices }) {
  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const [creation, setCreation] = useState<Creation | null>(null);
  const [message, setMessage] = useState(card.defaultMessage);
  const [writing, setWriting] = useState<CardWritingInput | undefined>(undefined);
  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]>(DELIVERY[0]);
  const [status, setStatus] = useState<"starting" | "ready" | "saving" | "error">("starting");
  const [serverErr, setServerErr] = useState("");
  const [announce, setAnnounce] = useState("");
  const [imgOk, setImgOk] = useState(true);
  const [adding, setAdding] = useState(false);
  const latest = useRef({ message, writing });
  const [savedSig, setSavedSig] = useState(JSON.stringify({ message: card.defaultMessage, writing: undefined }));
  const saved = useRef(JSON.stringify({ message: card.defaultMessage, writing: undefined }));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef<Promise<boolean>>(Promise.resolve(true));
  const startedRef = useRef(false);
  useEffect(() => { latest.current = { message, writing }; });

  const fit = fitOf(message, limits);

  // Start (or resume) the draft once. A guest can do this; paying needs an account.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const key = `rc:${card.id}`;
      let id: string | null = null;
      try { id = sessionStorage.getItem(key); } catch { /* private window */ }
      if (id) {
        const r = await api<Creation & { writing?: CardWritingInput }>(`/api/stock/creations/${id}`);
        if (r.ok) {
          setCreation(r.data);
          setMessage(r.data.message);
          setWriting(r.data.writing);
          saved.current = JSON.stringify({ message: r.data.message, writing: r.data.writing });
          setSavedSig(saved.current);
          setStatus("ready");
          return;
        }
      }
      const r = await api<Creation>("/api/stock/creations", { method: "POST", json: { stockId: card.id } });
      if (!r.ok) { setServerErr(r.data.error ?? ""); return setStatus("error"); }
      try { sessionStorage.setItem(key, r.data.id); } catch { /* ignore */ }
      setCreation(r.data);
      setStatus("ready");
    })();
  }, [card.id]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!creation) return false;
    const { message: m, writing: w } = latest.current;
    const sig = JSON.stringify({ message: m, writing: w });
    if (sig === saved.current) return true;
    if (!fitOf(m, limits).fits) return false;
    setStatus("saving");
    const r = await api<Creation>(`/api/stock/creations/${creation.id}`, { method: "PATCH", json: { message: m, writing: w ?? null } });
    if (!r.ok) {
      setServerErr(r.data.error ?? "We lost you for a second. Trying again.");
      setStatus("error");
      return false;
    }
    saved.current = sig;
    setSavedSig(sig);
    setServerErr("");
    setCreation(r.data);
    setImgOk(true);
    setStatus("ready");
    return true;
  }, [creation, limits]);

  // Autosave a moment after typing stops (never every keystroke).
  useEffect(() => {
    if (!creation) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { inflight.current = inflight.current.then(save); }, 700);
    return () => clearTimeout(timer.current);
  }, [message, writing, creation, save]);

  // The character count is announced at pauses, not on every key.
  useEffect(() => {
    const t = setTimeout(() => setAnnounce(fit.fits ? `${fit.charsLeft} characters left` : fit.text ?? ""), 900);
    return () => clearTimeout(t);
  }, [fit.fits, fit.charsLeft, fit.text]);

  const format = delivery === "Send by email" ? "digital" : "mailed";
  const mailTo = delivery === "We mail it to me" ? "buyer" : "recipient";
  const price = prices[format];
  const dirty = JSON.stringify({ message, writing }) !== savedSig;

  async function addToCart() {
    if (!creation) return;
    setAdding(true);
    clearTimeout(timer.current);
    const ok = await (inflight.current = inflight.current.then(save));
    if (!ok) { setAdding(false); return; }
    const r = await api<{ items: unknown[] }>(`/api/stock/creations/${creation.id}/cart`, { method: "POST", json: { format, mailTo: format === "mailed" ? mailTo : undefined } });
    setAdding(false);
    if (!r.ok) {
      const msg = r.data.error ?? "That didn't work. Try again?";
      setServerErr(msg);
      return toast(msg);
    }
    setCartCount(r.data.items?.length ?? 0);
    router.push("/cart");
  }

  const previewSrc = creation ? `/api/stock/creations/${creation.id}/preview?v=${encodeURIComponent(creation.updatedAt)}` : "";
  const errId = "rce-msg-err";
  const hint = fit.text ?? serverErr;

  return (
    <div className="gs-stack gs-stack--lg">
      <div>
        <p className="gs-small gs-muted" style={{ margin: "0 0 4px" }}><Link className="gs-link" href="/ready-cards">Ready Cards</Link> / {occasionLabel(card.occasion)}</p>
        <h1 className="gs-h2" style={{ margin: 0 }}>{card.title}</h1>
        <p className="gs-muted" style={{ margin: "6px 0 0" }}>Already designed. Change the words, add your handwriting, send.</p>
      </div>

      <div className="rce">
        <section className="rce__preview" aria-label="Card preview">
          <div className="rce__stage">
            <div className="rce__inside" style={{ opacity: creation && imgOk ? 0 : 1 }}>{message}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {creation && imgOk && <img src={previewSrc} alt={`Front: ${card.alt} Inside: ${message.trim()}`} onError={() => setImgOk(false)} style={{ opacity: status === "saving" || dirty ? 0.6 : 1 }} />}
          </div>
          <p className="gs-small gs-muted rce__note">Preview. Printed ink may look a little different.</p>
        </section>

        <div className="rce__form">
          <div className="rce__field">
            <label htmlFor="rce-msg">Your message inside</label>
            <textarea
              id="rce-msg"
              className="rce__area"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={!fit.fits}
              aria-describedby={`${errId} rce-count`}
              spellCheck
            />
            <div className="rce__meta">
              <span id="rce-count" className="gs-small gs-muted">{fit.fits ? `${fit.charsLeft} characters left` : `${Math.abs(fit.charsLeft)} ${fit.charsLeft < 0 ? "over" : "to go"}`}</span>
              {message !== card.defaultMessage && (
                <button type="button" className="gs-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }} onClick={() => setMessage(card.defaultMessage)}>Put it back the way it was</button>
              )}
            </div>
            <p id={errId} className="rce__err" role={hint ? "alert" : undefined}>{hint}</p>
            <span className="gs-small gs-muted" aria-live="polite" role="status" style={{ position: "absolute", left: -9999 }}>{announce}</span>
          </div>

          {card.suggestions.length > 0 && (
            <div className="rce__field">
              <span className="rce__legend" id="rce-sugg">Try a different line</span>
              <div className="rce__chips" role="group" aria-labelledby="rce-sugg">
                {card.suggestions.map((s) => (
                  <button key={s} type="button" className="gh-chip" onClick={() => setMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="rce__field">
            <span className="rce__legend">Hand-touch</span>
            {session.signedIn ? (
              <WritingPicker value={writing} onChange={setWriting} />
            ) : (
              <div className="rce__lock">
                <p>Add your own handwriting and signature with a free account.</p>
                <p><Link className="gs-link" href={`/signup?next=${encodeURIComponent(`/ready-cards/${card.id}`)}`}>Make a free account</Link></p>
              </div>
            )}
          </div>

          <div className="rce__field">
            <span className="rce__legend" id="rce-del">How should it get there?</span>
            <Segmented options={[...DELIVERY]} value={delivery} onChange={(v) => setDelivery(v as (typeof DELIVERY)[number])} />
            <p className="gs-small gs-muted" style={{ margin: 0 }}>You&apos;ll add the name and address on the next screen, before you pay.</p>
          </div>

          <div className="rce__bar">
            <p className="rce__price" id="rce-price">
              <strong>{formatMoney(price.allInCents)}</strong>{" "}
              {format === "mailed" ? "printed and mailed, before tax" : "to send by email, before tax"}
              {format === "mailed" && <span className="gs-small"> ({formatMoney(price.merchandiseCents)} card + {formatMoney(price.postageCents)} postage)</span>}
            </p>
            <Button type="button" variant="dark" size="lg" onClick={addToCart} disabled={!creation || !fit.fits || adding || status === "starting"} aria-describedby="rce-price">
              {adding ? "Adding..." : "Add to cart"}
            </Button>
            {status === "error" && !creation && (
              <p className="rce__err" role="alert">{serverErr || "We lost you for a second."} <button type="button" className="gs-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }} onClick={() => router.refresh()}>Try again</button></p>
            )}
          </div>
          <p className="gs-small gs-muted" style={{ margin: 0 }}>Want it about one person? <Link className="gs-link" href="/create/card">Want it drawn just for them? Make one from scratch.</Link></p>
        </div>
      </div>
    </div>
  );
}
