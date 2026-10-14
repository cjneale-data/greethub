"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ButtonLink, Segmented, TextField, Toggle } from "@/components/brand";
import { HANDWRITING_PRESETS, SIGNATURE_FONTS, handwritingFamily, type SignatureFontId } from "@greethub/shared";
import { checkText } from "@/lib/intake/guardrails";
import type { WritingView } from "@/lib/writing/service";
import { HandwrittenInside } from "@/components/writing/HandwrittenInside";
import { SignaturePad, type Stroke } from "@/components/writing/SignaturePad";
import { onRadioKeys, rovingTab } from "@/components/writing/radioKeys";
import { useMembership } from "@/components/membership/useMembership";
import "@/components/membership/membership.css";
import { signatureImageUrl, useWriting } from "@/components/writing/useWriting";
import { prepareUpload, UploadError, UPLOAD_ACCEPT } from "@/components/writing/prepareUpload";
import "@/components/writing/writing.css";
import { ErrorBox, Modal, SkeletonList } from "./ui";
import { api, useToast } from "./client";

const SAMPLE = "Happy birthday! Thinking of you today, with love.";

/** 11e Handwriting & signature: custom handwriting from a template sheet, signatures (style, draw, upload), defaults. */
export function WritingPage() {
  const toast = useToast();
  const { state, setView, reload } = useWriting();
  const { state: plan } = useMembership();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "style" | "signature"; id: string; name: string } | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.status === "guest") router.replace(`/login?next=${encodeURIComponent("/account/handwriting")}&reason=signin`);
  }, [state.status, router]);

  if (state.status === "guest") return null;
  const head = <h1 className="gs-h2" style={{ margin: 0 }}>Handwriting &amp; signature</h1>;
  if (state.status === "error") return <div className="gs-stack gs-stack--lg">{head}<ErrorBox message="Something broke on our side. It's not you. Try again in a minute." onRetry={reload} /></div>;
  if (state.status === "loading") return <div className="gs-stack gs-stack--lg">{head}<SkeletonList rows={3} h={120} /></div>;
  const view = state.view;

  /** Every write returns the fresh view; errors carry a friendly message. */
  async function send(url: string, init: RequestInit & { json?: unknown }, ok: string) {
    setBusy(true);
    const r = await api<WritingView>(url, init);
    setBusy(false);
    if (!r.ok) {
      toast(r.data.error ?? "That didn't work. Try again?");
      return false;
    }
    setView(r.data as WritingView);
    toast(ok);
    return true;
  }
  const setDefaults = (patch: Partial<Pick<WritingView, "defaultStyleId" | "defaultSignatureId" | "applyToNewCards">>) =>
    send("/api/account/writing", { method: "PUT", json: patch }, "Saved.");
  async function remove() {
    if (!confirm) return;
    const url = confirm.kind === "style" ? `/api/account/writing/styles/${confirm.id}` : `/api/account/writing/signatures/${confirm.id}`;
    setConfirm(null);
    await send(url, { method: "DELETE" }, "Deleted.");
  }

  return (
    <div className="gs-stack gs-stack--lg">
      {head}
      <p className="gs-muted" style={{ margin: 0 }}>Choose how the inside of your cards is written. You can still change it on any single card.</p>
      {plan.status === "ready" && plan.view.enabled && plan.view.tier === "free" && (
        <div className="gm-upsell">
          <p><strong>Plus</strong> prints cards in your own handwriting, keeps up to 5 signatures and puts them on every new card. 14 days free.</p>
          <ButtonLink href="/account/membership" size="sm">See Plus</ButtonLink>
        </div>
      )}

      <section className="gs-panel gs-stack" aria-labelledby="hw-defaults">
        <h2 id="hw-defaults" className="gs-h3" style={{ margin: 0 }}>Handwriting for your cards</h2>
        <div className="gw-styles" role="radiogroup" aria-label="Default handwriting" onKeyDown={onRadioKeys}>
          {[...HANDWRITING_PRESETS.map((p) => ({ id: p.id as string, name: p.name, family: handwritingFamily(p.id), note: p.note })), ...view.styles.map((s) => ({ id: s.id, name: s.name, family: "", note: "Your own handwriting" }))].map((s, i, all) => (
            <button key={s.id} type="button" role="radio" aria-checked={view.defaultStyleId === s.id} tabIndex={rovingTab(view.defaultStyleId === s.id, i, all.some((x) => x.id === view.defaultStyleId))} className="gw-style" disabled={busy} onClick={() => view.defaultStyleId !== s.id && setDefaults({ defaultStyleId: s.id })}>
              <span className="gw-style__sample" style={s.family ? { fontFamily: `"${s.family}", cursive` } : undefined}>{s.family ? "Happy birthday!" : "✎ Mine"}</span>
              <span className="gw-style__name">{s.name} {view.defaultStyleId === s.id && <Badge tone="new">Default</Badge>}</span>
              <span className="gs-small gs-muted">{s.note}</span>
            </button>
          ))}
        </div>
        <Toggle checked={view.applyToNewCards} onChange={(v) => (v && !view.defaultStyleId && !view.defaultSignatureId ? toast("Pick a handwriting style or add a signature first.") : void setDefaults({ applyToNewCards: v }))}>
          Use my default handwriting and signature on every new card
        </Toggle>
      </section>

      <OwnHandwriting view={view} busy={busy} onCreated={(v, missing) => { setView(v); toast(missing.length ? `Saved. ${missing.length} box${missing.length === 1 ? " was" : "es were"} blank, so we'll borrow from the other case there.` : "Saved. That's your handwriting."); }} onDelete={(id, name) => setConfirm({ kind: "style", id, name })} />

      <Signatures view={view} busy={busy} send={send} setDefault={(id) => setDefaults({ defaultSignatureId: id })} onDelete={(id, name) => setConfirm({ kind: "signature", id, name })} />

      <p className="gs-small gs-muted" style={{ margin: 0 }}>
        Your handwriting sheet and signatures are private. We only use them to print your own cards, never to sign anything else, and they&apos;re deleted with your account.
      </p>

      {confirm && (
        <Modal title={`Delete ${confirm.name}?`} onClose={() => setConfirm(null)} actions={<><Button variant="ghost" onClick={() => setConfirm(null)}>Keep</Button><Button variant="dark" onClick={remove}>Delete</Button></>}>
          <p>Cards you&apos;ve already ordered keep it. New cards can&apos;t use it.</p>
        </Modal>
      )}
    </div>
  );
}

function OwnHandwriting({ view, busy, onCreated, onDelete }: { view: WritingView; busy: boolean; onCreated: (v: WritingView, missing: string[]) => void; onDelete: (id: string, name: string) => void }) {
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("My handwriting");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  async function upload(f: File) {
    setUploading(true);
    setErr("");
    const fd = new FormData();
    try {
      fd.set("file", await prepareUpload(f, 2800), "sheet.jpg");
    } catch (e) {
      setUploading(false);
      return setErr(e instanceof UploadError ? e.message : "We couldn't read that photo. Try another.");
    }
    fd.set("name", name);
    const r = await fetch("/api/account/writing/styles", { method: "POST", body: fd }).catch(() => null);
    setUploading(false);
    if (file.current) file.current.value = "";
    const body = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) return setErr(body.error ?? "We couldn't read that sheet. Try again?");
    onCreated(body as WritingView, body.missing ?? []);
  }
  return (
    <section className="gs-panel gs-stack" aria-labelledby="hw-own">
      <h2 id="hw-own" className="gs-h3" style={{ margin: 0 }}>Your own handwriting</h2>
      <ol className="gw-steps gs-small">
        <li><a className="gs-link" href="/api/account/writing/template" target="_blank" rel="noopener">Open the handwriting sheet</a> and print it at 100% (actual size).</li>
        <li>Write one character in each box with a dark pen, sitting on the dotted line.</li>
        <li>Take a straight-on photo in good light with the whole sheet and all its black squares showing, and upload it here.</li>
      </ol>
      {view.styles.length < 3 ? (
        <div className="gs-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}><TextField label="Name this style" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></div>
          <input ref={file} type="file" accept={UPLOAD_ACCEPT} hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          <Button type="button" disabled={busy || uploading} onClick={() => file.current?.click()}>{uploading ? "Reading your sheet..." : "Upload a photo of the sheet"}</Button>
        </div>
      ) : (
        <p className="gs-small gs-muted" style={{ margin: 0 }}>You have 3 styles, the most we keep. Delete one to add another.</p>
      )}
      {err && <ErrorBox message={err} />}
      {view.styles.map((s) => (
        <div key={s.id} className="gs-stack gs-stack--sm">
          <div className="gs-row gs-row--between">
            <strong>{s.name}</strong>
            <Button size="sm" variant="ghost" onClick={() => onDelete(s.id, s.name)}>Delete</Button>
          </div>
          <div className="gw-sigcard" style={{ minHeight: 140 }}>
            <HandwrittenInside text={SAMPLE} box={{ width: 1100, height: 240 }} writing={{ message: "handwritten", styleId: s.id, signature: { kind: "none" } }} />
          </div>
          {s.missing.length > 0 && (
            <p className="gs-small gs-muted" style={{ margin: 0 }}>
              Blank boxes: {s.missing.join(" ")}. <button type="button" className="gs-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={() => toast("Fill those boxes on a new sheet and upload it as a new style.")}>Fix this</button>
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

function Signatures({ view, busy, send, setDefault, onDelete }: {
  view: WritingView;
  busy: boolean;
  send: (url: string, init: RequestInit & { json?: unknown }, ok: string) => Promise<boolean>;
  setDefault: (id: string | null) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [tab, setTab] = useState<"Choose a style" | "Draw" | "Upload">("Choose a style");
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState<SignatureFontId>("allura");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const verdict = typed.trim() ? checkText(typed, { nameLike: true }) : null;
  const full = view.signatures.length >= 5;

  async function upload(f: File) {
    setUploading(true);
    setErr("");
    const fd = new FormData();
    try {
      fd.set("file", await prepareUpload(f, 3000), "signature.jpg");
    } catch (e) {
      setUploading(false);
      return setErr(e instanceof UploadError ? e.message : "We couldn't read that photo. Try another.");
    }
    const r = await fetch("/api/account/writing/signatures", { method: "POST", body: fd }).catch(() => null);
    setUploading(false);
    if (file.current) file.current.value = "";
    const body = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) return setErr(body.error ?? "We couldn't read that photo. Try again?");
    await send("/api/account/writing", { method: "GET" }, "Saved. That's your signature.");
  }

  return (
    <section className="gs-panel gs-stack" aria-labelledby="hw-sig">
      <h2 id="hw-sig" className="gs-h3" style={{ margin: 0 }}>Signature</h2>
      {view.signatures.length > 0 && (
        <div className="gs-grid">
          {view.signatures.map((s) => (
            <div key={s.id} className="gs-stack gs-stack--sm">
              <div className="gw-sigcard">
                {s.kind === "typed" ? (
                  <span style={{ fontFamily: `"${handwritingFamily(s.fontId ?? "allura")}", cursive`, fontSize: 34 }}>{s.text}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signatureImageUrl(s.id)} alt={s.label} />
                )}
              </div>
              <div className="gs-row">
                {view.defaultSignatureId === s.id ? <Badge tone="new">Default</Badge> : <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDefault(s.id)}>Make default</Button>}
                <Button size="sm" variant="ghost" onClick={() => onDelete(s.id, s.label)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {full ? (
        <p className="gs-small gs-muted" style={{ margin: 0 }}>You have 5 signatures, the most we keep. Delete one to add another.</p>
      ) : (
        <>
          <Segmented options={["Choose a style", "Draw", "Upload"]} value={tab} onChange={(v) => { setErr(""); setTab(v as typeof tab); }} />
          {tab === "Choose a style" && (
            <div className="gs-stack">
              <TextField label="Your name" value={typed} maxLength={40} onChange={(e) => setTyped(e.target.value)} error={verdict && !verdict.ok ? "Try just your name, or the name you sign cards with." : undefined} />
              <div className="gw-styles gw-styles--sig" role="radiogroup" aria-label="Signature style" onKeyDown={onRadioKeys}>
                {SIGNATURE_FONTS.map((f) => (
                  <button key={f.id} type="button" role="radio" aria-checked={font === f.id} tabIndex={font === f.id ? 0 : -1} className="gw-style" onClick={() => setFont(f.id)}>
                    <span className="gw-style__sample gw-style__sample--sig" style={{ fontFamily: `"${handwritingFamily(f.id)}", cursive` }}>{typed.trim() || "Your name"}</span>
                    <span className="gw-style__name">{f.name}</span>
                  </button>
                ))}
              </div>
              <div><Button disabled={busy || !typed.trim() || (verdict ? !verdict.ok : false)} onClick={() => void send("/api/account/writing/signatures", { method: "POST", json: { kind: "typed", text: typed.trim(), fontId: font } }, "Saved.").then((ok) => ok && setTyped(""))}>Adopt this signature</Button></div>
            </div>
          )}
          {tab === "Draw" && (
            <SignaturePad busy={busy} onSave={(strokes: Stroke[], canvas) => void send("/api/account/writing/signatures", { method: "POST", json: { kind: "drawn", strokes, canvas } }, "Saved. That's your signature.")} />
          )}
          {tab === "Upload" && (
            <div className="gs-stack">
              <p className="gs-small gs-muted" style={{ margin: 0 }}>Sign in dark pen on plain white paper, then take a close, straight-on photo. We keep just the ink.</p>
              <input ref={file} type="file" accept={UPLOAD_ACCEPT} hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
              <div><Button disabled={busy || uploading} onClick={() => file.current?.click()}>{uploading ? "Reading your signature..." : "Upload a photo"}</Button></div>
            </div>
          )}
          {err && <ErrorBox message={err} />}
        </>
      )}
    </section>
  );
}
