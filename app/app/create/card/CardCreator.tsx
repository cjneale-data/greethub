"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Progress, Segmented, TextField, Toast } from "@/components/brand";
import { BriefCard, ChatBubble, FieldEditor, Modal, Sheet, TypingBubble } from "@/components/creator";
import { applyPatch, CardDraftSchema, disabledHint, emptyDraft, insideText, isComplete, mergeServerDraft, missingRequired, progress, validateField, type CardDraft } from "@/lib/intake/draft";
import { getDraftStorage, type StoredChat, type StoredPreview } from "@/lib/intake/draft-storage";
import { FIELD_LABELS, OPTIONAL_FIELDS, REQUIRED_FIELDS, type FieldKey } from "@/lib/intake/fields";
import { PHOTO_GUEST_MESSAGE } from "@/lib/intake/guardrails";
import { openingTurn } from "@/lib/intake/quick-replies";
import { HandwrittenInside } from "@/components/writing/HandwrittenInside";
import { useWriting } from "@/components/writing/useWriting";
import { isPaidFeatureOn, useMembership } from "@/components/membership/useMembership";
import { api, useSession } from "@/components/shop/client";
import type { Draft } from "@/lib/shop/types";

type LockKey = "second" | "reroll" | "save" | "proof" | "photo" | "people";
const LOCKS: Record<LockKey, { title: string; text: string }> = {
  second: { title: "That's your free preview", text: "That's your free preview. Make a free account to keep going. Your card comes with you." },
  reroll: { title: "Want another go", text: "Not quite right? Make a free account to redraw it." },
  save: { title: "Keep this for later", text: "Want to come back to this? Make a free account and we'll keep it." },
  proof: { title: "See the full-size proof", text: "Make a free account to see the full-size proof." },
  photo: { title: "Photos stay private", text: PHOTO_GUEST_MESSAGE },
  people: { title: "Save people", text: "Save Grandma once and skip the typing next time. Make a free account to save people." },
};
/** Signed in, the account locks above don't apply. These steps aren't built yet (docs/PLAN.md, signed-in card path). */
const NOT_YET: Partial<Record<LockKey, { title: string; text: string }>> = {
  proof: { title: "Ordering cards is coming soon", text: "The full-size proof and ordering aren't switched on yet. Save this as a draft and it'll be waiting in your account." },
  photo: { title: "No photos on cards", text: "Cards are drawn from your words, not photos. Tell the guide what makes them them." },
};
/** Previews are data URLs; past this size they stay out of the account draft (the brief is enough to redraw). */
const MAX_SAVED_PREVIEW = 200_000;

const ONE_LINERS = ["Sharpening the pencils.", "Mixing the colors.", "Choosing the paper.", "Adding the last touches."];
const GREETING_ERR = "Something went wrong on our side. Try again?";

type Bubble = { role: "guide" | "user"; text: string };
const toBubbles = (c: StoredChat): Bubble[] => c.map((m) => ({ role: m.role === "assistant" ? "guide" : "user", text: m.content }));

/** Snapshot of the fields that change the picture, so we can tell when a preview is out of date. */
const pictureKey = (d: CardDraft) => JSON.stringify([d.occasion, d.occasionOther, d.tone, d.artStyle, d.idea, d.recipientName, d.include, d.avoid]);

export function CardCreator() {
  const storage = useMemo(() => getDraftStorage(), []);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<CardDraft>(emptyDraft());
  const [chat, setChat] = useState<StoredChat>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"Chat" | "Form">("Chat");
  const [preview, setPreview] = useState<StoredPreview | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderErr, setRenderErr] = useState<string | null>(null);
  const [pct, setPct] = useState(8);
  const [liner, setLiner] = useState(0);
  const [side, setSide] = useState<"front" | "inside">("front");
  const [lock, setLock] = useState<LockKey | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState<{ text: string; retry?: () => void } | null>(null);
  const [writing, setWriting] = useState(false);
  const [pendingRewrite, setPendingRewrite] = useState<string | null>(null);
  const [styleOffer, setStyleOffer] = useState<{ styleId: string; note: string } | null>(null);
  const [chatErr, setChatErr] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const session = useSession();
  const signedIn = session.signedIn;
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const openedDraft = useRef(false);
  const draftRef = useRef(draft);
  const chatRef = useRef(chat);
  useEffect(() => {
    draftRef.current = draft;
    chatRef.current = chat;
  }, [draft, chat]);

  /* ---- load / save the guest draft ---- */
  useEffect(() => {
    let live = true;
    storage.load().then((s) => {
      if (!live) return;
      if (s) {
        setDraft(s.draft);
        setChat(s.chat);
        if (s.preview) {
          setPreview(s.preview);
          setPreviewKey(pictureKey(s.draft));
        }
        const o = openingTurn(s.draft);
        setQuick(s.chat.length ? (o.next ? o.quickReplies : []) : o.quickReplies);
      }
      if (!s || !s.chat.length) {
        const o = openingTurn(s?.draft ?? emptyDraft());
        setChat([{ role: "assistant", content: o.reply }]);
        setQuick(o.quickReplies);
      }
      setHydrated(true);
    });
    return () => {
      live = false;
    };
  }, [storage]);

  /* ---- a saved account draft (?draft= from the account's Continue button) ---- */
  useEffect(() => {
    if (!hydrated || !session.loaded || !session.signedIn || openedDraft.current) return;
    const id = new URL(window.location.href).searchParams.get("draft");
    if (!id) return;
    openedDraft.current = true;
    void api<{ drafts: Draft[] }>("/api/account/drafts").then((r) => {
      const saved = r.ok ? r.data.drafts.find((d) => d.id === id && d.kind === "card") : undefined;
      const brief = saved?.brief as { draft?: unknown; chat?: StoredChat; preview?: StoredPreview } | undefined;
      const parsed = CardDraftSchema.safeParse(brief?.draft);
      if (!saved || !parsed.success) return setToast({ text: "We couldn't open that draft. It may have been deleted." });
      const d = parsed.data as CardDraft;
      setDraft(d);
      setDraftId(saved.id);
      if (Array.isArray(brief?.chat) && brief.chat.length) setChat(brief.chat);
      setQuick([]);
      setPreview(brief?.preview ?? null);
      setPreviewKey(brief?.preview ? pictureKey(d) : null);
    });
  }, [hydrated, session.loaded, session.signedIn]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => storage.save({ draft, chat, preview: preview ?? undefined, updatedAt: new Date().toISOString() }), 250);
    return () => clearTimeout(t);
  }, [hydrated, draft, chat, preview, storage]);

  useEffect(() => {
    // Also on mode: switching Form back to Chat remounts the log at the top.
    const log = chatEnd.current?.parentElement;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chat, typing, mode]);

  /* ---- a member's default handwriting and signature, when they asked for it on every new card ---- */
  const { state: writingState } = useWriting();
  const { state: planState } = useMembership();
  useEffect(() => {
    if (!hydrated || writingState.status !== "ready" || !writingState.view.applyToNewCards || !isPaidFeatureOn(planState, "apply_to_new_cards")) return;
    const v = writingState.view;
    if (draftRef.current.writing || (!v.defaultStyleId && !v.defaultSignatureId)) return;
    setDraft((d) =>
      d.writing
        ? d
        : applyPatch(d, {
            writing: {
              message: v.defaultStyleId ? "handwritten" : "typed",
              styleId: v.defaultStyleId ?? undefined,
              signature: v.defaultSignatureId ? { kind: "saved", signatureId: v.defaultSignatureId as `sg_${string}` } : { kind: "none" },
            },
          }, "form"),
    );
  }, [hydrated, writingState, planState]);

  /* ---- rendering progress theatre ---- */
  useEffect(() => {
    if (!rendering) return;
    const a = setInterval(() => setPct((p) => Math.min(92, p + (95 - p) * 0.06)), 600);
    const b = setInterval(() => setLiner((l) => (l + 1) % ONE_LINERS.length), 2500);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [rendering]);

  /* ---- editing the brief directly (chips, pickers, text) ---- */
  const patchDraft = useCallback((patch: Partial<CardDraft>) => {
    setDraft((d) => applyPatch(d, patch, "form"));
  }, []);

  /* ---- chat ---- */
  async function send(text: string, override?: string) {
    {
      const clean = text.trim();
      if (!clean) return;
      setChatErr(false);
      setPendingRewrite(null);
      const history: StoredChat = [...chatRef.current, { role: "user", content: clean }];
      setChat(history);
      setQuick([]);
      setInput("");
      setTyping(true);
      const sent = draftRef.current;
      try {
        const res = await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-12), draft: sent, override }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? GREETING_ERR);
        setDraft((cur) => mergeServerDraft(sent, cur, body.draft as CardDraft));
        setChat([...history, { role: "assistant", content: body.reply }]);
        setQuick(body.quickReplies ?? []);
        if (body.guardrail?.kind === "copyright") setPendingRewrite(body.guardrail.rewritten);
        if (body.styleOffer) setStyleOffer({ styleId: body.styleOffer.styleId, note: body.styleOffer.note });
      } catch (e) {
        setChat(history);
        setChatErr(true);
        setToast({ text: e instanceof Error && e.message ? e.message : GREETING_ERR, retry: () => void send(clean, override) });
      } finally {
        setTyping(false);
      }
    }
  }

  const onQuick = (label: string) => {
    if (label === "Yes, do that" && pendingRewrite) return void send("Yes, do that", pendingRewrite);
    if (label === "I'll rephrase") {
      setChat((c) => [...c, { role: "user", content: label }, { role: "assistant", content: "Okay. Tell me again in your own words." }]);
      setQuick([]);
      setPendingRewrite(null);
      return;
    }
    if (label === "I'll write it") {
      setChat((c) => [...c, { role: "user", content: label }, { role: "assistant", content: "Go ahead and type it below." }]);
      setQuick([]);
      return;
    }
    void send(label);
  };

  const writeMessage = async () => {
    setWriting(true);
    try {
      const res = await fetch("/api/card/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? GREETING_ERR);
      patchDraft({ message: body.message });
      if (body.ipNote) setToast({ text: body.ipNote });
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : GREETING_ERR, retry: () => void writeMessage() });
    } finally {
      setWriting(false);
    }
  };

  /* ---- guest preview ---- */
  const makePreview = async () => {
    if (!isComplete(draft) || rendering) return;
    setRendering(true);
    setRenderErr(null);
    setPct(8);
    setLiner(0);
    try {
      const res = await fetch("/api/card/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft }) });
      const body = await res.json();
      if (res.status === 403 && body.error === "guest_limit") {
        setLock("second");
        return;
      }
      if (!res.ok) throw new Error(body.message ?? "That one didn't come out. Nothing was charged. Try again?");
      setPct(100);
      setPreview(body.preview);
      if (body.ipNote) setToast({ text: body.ipNote });
      setPreviewKey(pictureKey(draft));
      setSide("front");
    } catch (e) {
      setRenderErr(e instanceof Error ? e.message : "That one didn't come out. Nothing was charged. Try again?");
    } finally {
      setRendering(false);
    }
  };

  /* ---- signed in: save to the account ---- */
  const saveToAccount = async (quiet = false): Promise<boolean> => {
    setSaving(true);
    const keepPreview = preview && preview.front.length <= MAX_SAVED_PREVIEW ? preview : undefined;
    const name = draft.recipientName?.trim();
    const r = await api<{ draft: Draft }>("/api/account/drafts", {
      method: "POST",
      json: { id: draftId ?? undefined, kind: "card", title: name ? `Card for ${name}` : "Untitled card", brief: { draft, chat, preview: keepPreview } },
    });
    setSaving(false);
    if (!r.ok) {
      setToast({ text: r.data.error ?? "That draft didn't save. Try again?", retry: () => void saveToAccount(quiet) });
      return false;
    }
    setDraftId(r.data.draft.id);
    const url = new URL(window.location.href);
    url.searchParams.set("draft", r.data.draft.id);
    window.history.replaceState(null, "", url.toString());
    if (!quiet) setToast({ text: "Saved to your drafts." });
    return true;
  };

  /** Guests get the sign-up prompt; signed in, the action runs (or says honestly that it isn't built yet). */
  const gate = (key: LockKey) => {
    if (!signedIn) return setLock(key);
    if (key === "save") return void saveToAccount();
    if (key === "reroll") return void makePreview();
    if (key === "second") {
      return void saveToAccount(true).then((ok) => {
        if (!ok) return;
        startOver();
        setDraftId(null);
        window.history.replaceState(null, "", window.location.pathname);
        setToast({ text: "Saved to your drafts. Here's a fresh card." });
      });
    }
    setLock(key);
  };

  const changeSomething = () => {
    setMode("Chat");
    setChat((c) => [...c, { role: "assistant", content: "What should change?" }]);
    setQuick([]);
    document.getElementById("gc-composer")?.focus();
  };

  const startOver = () => {
    void storage.clear();
    setDraft(emptyDraft());
    setPreview(null);
    setPreviewKey(null);
    setRenderErr(null);
    setPendingRewrite(null);
    setStyleOffer(null);
    setChatErr(false);
    setSide("front");
    const o = openingTurn(emptyDraft());
    setChat([{ role: "assistant", content: o.reply }]);
    setQuick(o.quickReplies);
  };

  const p = progress(draft);
  const complete = isComplete(draft);
  const stale = !!preview && previewKey !== null && previewKey !== pictureKey(draft);
  const name = draft.recipientName?.trim();
  const hint = disabledHint(draft);

  /* ---- preview pane ---- */
  const previewPane = (
    <section className="gc-panel gc-preview" aria-label="Card preview" aria-busy={rendering}>
      <div className="gc-row" style={{ width: "100%" }}>
        <h2 className="gc-panel__title">{name ? `${name}'s card` : "Your card"}</h2>
        {preview && !rendering ? (
          <Segmented options={["Front", "Inside"]} value={side === "front" ? "Front" : "Inside"} onChange={(v) => setSide(v === "Front" ? "front" : "inside")} />
        ) : null}
      </div>

      {rendering ? (
        <>
          <div className="gc-card gc-card--blank">
            <div className="gc-card__face gc-skel" aria-hidden="true" />
          </div>
          <div style={{ width: "100%" }} className="gc-progress">
            <Progress value={pct} label={`Drawing ${name ? `${name}'s` : "your"} card`} />
          </div>
          <p className="gc-hint" role="status">
            {ONE_LINERS[liner]} It takes a minute or so, and you can stay on this page.
          </p>
        </>
      ) : preview ? (
        <>
          <div className="gc-card" data-side={side} data-testid="preview-card">
            <div className="gc-card__inner">
              <div className="gc-card__face">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="gc-card__img" src={preview.front} alt={`Front of the card for ${name ?? "your recipient"}, low-resolution preview`} />
              </div>
              <div className="gc-card__face gc-card__face--inside">
                <HandwrittenInside text={insideText(draft) || preview.insideMessage} writing={draft.writing} savedSignatures={writingState.status === "ready" ? writingState.view.signatures : undefined} />
              </div>
            </div>
            <button type="button" className="gc-card__tap" aria-label="Flip the card" onClick={() => setSide((s) => (s === "front" ? "inside" : "front"))} />
          </div>
          <p className="gc-hint">Tap the card to flip it. Low-resolution preview, AI-illustrated.</p>
          {stale && <p className="gc-hint">You&apos;ve changed the card since this preview. {signedIn ? "Press Re-roll for a new picture." : "A new picture needs a free account."}</p>}
          <div className="gc-actions">
            <Button onClick={() => gate("proof")}>Looks good</Button>
            <Button variant="secondary" onClick={changeSomething}>
              Change something
            </Button>
            <Button variant="ghost" onClick={() => gate("reroll")}>
              Re-roll
            </Button>
          </div>
          <div className="gc-actions">
            <Button variant="ghost" size="sm" onClick={() => gate("save")}>
              {saving ? "Saving" : "Save draft"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => gate("second")}>
              Start another card
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="gc-card gc-card--blank" data-testid="preview-empty">
            <div className="gc-card__face">
              <span>{complete ? "Ready when you are." : "Your card shows up here once the details are in."}</span>
            </div>
          </div>
          {renderErr && (
            <p className="gc-err" role="alert">
              {renderErr}
            </p>
          )}
          <Button size="lg" disabled={!complete} onClick={makePreview} data-testid="make-preview">
            {renderErr ? "Try again" : "Make my preview"}
          </Button>
          {!complete && hint && <p className="gc-hint">{hint}</p>}
          {complete && <p className="gc-hint">One free preview, no account needed. It is low resolution and watermarked.</p>}
        </>
      )}
    </section>
  );

  /* ---- chat / form pane ---- */
  const chatPane = (
    <section className="gc-panel" aria-label="Greet Guide">
      <div className="gc-row">
        <h2 className="gc-panel__title">Greet Guide</h2>
        <Segmented options={["Chat", "Form"]} value={mode} onChange={(v) => setMode(v as "Chat" | "Form")} />
      </div>
      <p className="gc-hint" style={{ textAlign: "left" }}>You&apos;re chatting with an AI. Your words are checked before anything is drawn.</p>
      <div className="gc-progress">
        <Progress value={p.percent} label={`${p.label}`} />
      </div>

      {mode === "Chat" ? (
        <>
          <div className="gc-chat" role="log" aria-live="polite" aria-label="Conversation with the Greet Guide" tabIndex={0}>
            {!hydrated ? (
              <>
                <div className="gc-skel" style={{ height: 52, width: "70%", borderRadius: 22 }} />
                <div className="gc-skel" style={{ height: 36, width: "40%", borderRadius: 22 }} />
              </>
            ) : (
              toBubbles(chat).map((b, i) => (
                <ChatBubble key={i} role={b.role}>
                  {b.text}
                </ChatBubble>
              ))
            )}
            {typing && <TypingBubble />}
            <div ref={chatEnd} />
          </div>
          {!typing && quick.length > 0 && (
            <div className="gc-chips" role="group" aria-label="Quick replies">
              {quick.map((q) => (
                <button key={q} type="button" className="gh-chip" onClick={() => onQuick(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {chatErr && (
            <p className="gc-err" role="alert">
              That didn&apos;t send. Try again?
            </p>
          )}
          <form
            className="gc-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Button type="button" variant="ghost" size="sm" aria-label="Add a photo" onClick={() => gate("photo")}>
              + Photo
            </Button>
            <TextField id="gc-composer" aria-label="Say anything" placeholder="Say anything..." value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
            <Button type="submit" variant="secondary" disabled={!input.trim() || typing}>
              Send
            </Button>
          </form>
        </>
      ) : (
        <FormPane draft={draft} onPatch={patchDraft} onWriteMessage={writeMessage} writing={writing} styleOffer={styleOffer} />
      )}
    </section>
  );

  return (
    <>
      <header className="gc-head">
        <h1 className="gc-h1">Start a card</h1>
        <p className="gc-sub">Chat it through, or fill in the card yourself. Either way you end up with the same card.</p>
      </header>

      <div className="gc-grid">
        <div className="gc-area-preview">{previewPane}</div>
        <div className="gc-area-drawer gc-only-mobile">
          <Button variant="secondary" style={{ width: "100%" }} onClick={() => setDrawer(true)}>
            View your card ({p.done} of {p.total})
          </Button>
        </div>
        <div className="gc-area-chat">{chatPane}</div>
        <div className="gc-area-brief gc-only-desktop">
          <BriefCard draft={draft} onPatch={patchDraft} onWriteMessage={writeMessage} writing={writing} saved={hydrated} />
          <div style={{ marginTop: 8 }}>
            <Button variant="ghost" size="sm" onClick={startOver}>
              Start over
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Your card">
        <BriefCard draft={draft} onPatch={patchDraft} onWriteMessage={writeMessage} writing={writing} saved={hydrated} />
        <Button variant="ghost" size="sm" onClick={startOver}>
          Start over
        </Button>
      </Sheet>

      <Modal open={!!lock} title={lock ? (signedIn && NOT_YET[lock] ? NOT_YET[lock].title : LOCKS[lock].title) : ""} onClose={() => setLock(null)}>
        {lock && signedIn && NOT_YET[lock] ? (
          <>
            <p>{NOT_YET[lock].text}</p>
            <div className="gc-modal__actions">
              {lock === "proof" && <Button onClick={() => { setLock(null); void saveToAccount(); }}>Save draft</Button>}
              <Button variant="ghost" onClick={() => setLock(null)}>
                OK
              </Button>
            </div>
          </>
        ) : lock && (
          <>
            <p>{LOCKS[lock].text}</p>
            {lock !== "second" && missingRequired(draft).length < REQUIRED_FIELDS.length && <p>Your card comes with you.</p>}
            <div className="gc-modal__actions">
              <ButtonLink href="/signup?next=/create/card">Make a free account</ButtonLink>
              <Button variant="ghost" onClick={() => setLock(null)}>
                Not now
              </Button>
            </div>
          </>
        )}
      </Modal>

      {toast && (
        <div className="gc-toasts" role="status">
          <Toast
            action={toast.retry ? "Retry" : "OK"}
            onAction={() => {
              const r = toast.retry;
              setToast(null);
              r?.();
            }}
          >
            {toast.text}
          </Toast>
        </div>
      )}
      <span className="gc-sr">
        <Badge tone="draft">Draft</Badge>
      </span>
    </>
  );
}

/** Form mode: every brief field as a control, in the order of the question bank. Same draft as the chat. */
function FormPane({ draft, onPatch, onWriteMessage, writing, styleOffer }: { draft: CardDraft; onPatch: (p: Partial<CardDraft>) => void; onWriteMessage: () => void; writing: boolean; styleOffer: { styleId: string; note: string } | null }) {
  const section = (f: FieldKey) => {
    const required = (REQUIRED_FIELDS as readonly string[]).includes(f);
    const err = required ? validateField(f as (typeof REQUIRED_FIELDS)[number], draft) : null;
    return (
      <fieldset key={f} style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {!["recipientName", "idea", "message", "insideJokes", "include", "avoid", "signoff"].includes(f) && (
          <legend style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, padding: 0 }}>{FIELD_LABELS[f]}</legend>
        )}
        <FieldEditor field={f} draft={draft} onPatch={onPatch} styleSuggestion={f === "artStyle" ? styleOffer : null} error={f === "artStyle" || f === "occasion" || f === "tone" ? undefined : err} onWriteMessage={f === "message" ? onWriteMessage : undefined} writing={writing} />
      </fieldset>
    );
  };
  return (
    <form className="gc-col" onSubmit={(e) => e.preventDefault()} aria-label="Card details form">
      {REQUIRED_FIELDS.map(section)}
      <h3 className="gc-panel__title" style={{ fontSize: 17 }}>
        Optional
      </h3>
      {OPTIONAL_FIELDS.map(section)}
    </form>
  );
}
