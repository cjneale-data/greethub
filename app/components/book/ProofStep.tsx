"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PRICING, formatMoneyShort } from "@greethub/shared";
import { Badge, Button, Progress, TextField, Toggle } from "../brand";
import { assetUrl, bookApi } from "../../lib/book/client";
import type { StepProps } from "./types";
import { Checkbox, Modal, Notice } from "./ui";

type Slide = { id: string; label: string; text: string; heading?: string };

/** Proof viewer (UX spec 7): page-flip spreads, text left and art right, per-page re-roll, approve, hand off to the cart. */
export function ProofStep({ project, run, busy, notify, onAdded }: StepProps & { onAdded: (item: unknown) => void }) {
  const story = project.story!;
  const [title, setTitle] = useState(project.proof.title || story.title);
  const [dedication, setDedication] = useState(project.proof.dedication);
  const [digital, setDigital] = useState(project.proof.digitalCopy);
  const [ack, setAck] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rerollOpen, setRerollOpen] = useState(false);
  const [note, setNote] = useState("");
  const approved = project.proof.approved;

  const slides = useMemo<Slide[]>(
    () =>
      project.artOrder.map((id) => {
        const page = story.pages.find((p) => p.id === id);
        if (id === "cover") return { id, label: "Cover", heading: title, text: [`For ${project.brief.recipientName}`, dedication].filter(Boolean).join("\n\n") };
        if (id === "back") return { id, label: "Back cover", text: story.blurb };
        return { id, label: `Page ${id.slice(1)}`, text: page?.text ?? "" };
      }),
    [project.artOrder, story, title, dedication, project.brief.recipientName],
  );
  const slide = slides[Math.min(idx, slides.length - 1)];
  const art = project.art[slide.id];
  const version = art?.versions[art.current];
  const redrawing = art?.status === "redrawing" || (project.job?.kind === "reroll" && project.job.pages[slide.id]?.status === "redrawing");
  const jobActive = !!project.job && (project.job.status === "queued" || project.job.status === "running");
  const layoutRunning = project.job?.kind === "layout" && jobActive;
  const go = useCallback((d: number) => setIdx((i) => Math.max(0, Math.min(slides.length - 1, i + d))), [slides.length]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,[role=dialog]")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go]);

  const sku = project.brief.pageCount === 24 ? PRICING.skus.book_24 : PRICING.skus.book_32;
  const total = sku.cents + (digital ? PRICING.skus.book_digital.cents : 0);

  // lastJob reports re-roll failures after the job has been merged
  const rerollFailed = project.lastJob?.kind === "reroll" && project.lastJob.status === "failed" ? project.lastJob : null;
  const layoutFailed = project.lastJob?.kind === "layout" && project.lastJob.status === "failed";

  const reroll = async () => {
    setRerollOpen(false);
    const ok = await run(() => bookApi.action(project.id, "reroll", { pageId: slide.id, note: note.trim() || undefined }));
    if (ok) setNote("");
  };

  const approve = async () => {
    await run(() => bookApi.action(project.id, "approve-proof", { title, dedication, digitalCopy: digital, acknowledged: ack }));
  };

  // once the layout job has finished the book is approved: hand it to the cart
  const [handedOff, setHandedOff] = useState(false);
  async function addToCart() {
    try {
      const item = await bookApi.cartItem(project.id);
      await bookApi.addToCart(item);
      setHandedOff(true);
      onAdded(item);
    } catch (e) {
      notify((e as Error).message || "We couldn't add it to your cart.", () => void addToCart());
    }
  }

  return (
    <div className="gb-proof" data-testid="proof-step">
      <div className="gb-viewer">
        <div className="gb-spread" data-testid="spread" aria-live="polite">
          <div className="gb-spread__text">
            {slide.heading ? <h2 className="gb-spread__title">{slide.heading}</h2> : null}
            {slide.text.split("\n\n").map((t, i) => (
              <p key={i} data-testid={i === 0 ? "spread-text" : undefined}>
                {t}
              </p>
            ))}
            <span className="gb-spread__folio">{slide.label}</span>
          </div>
          <div className="gb-spread__art" key={`${slide.id}-${version?.file ?? "none"}`}>
            {version ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(project.id, version.file)} alt={`${slide.label} artwork`} data-testid="spread-art" />
            ) : null}
            {redrawing && (
              <div className="gb-busy" role="status">
                <Badge tone="new">Redrawing</Badge>
                <span>Drawing a new version</span>
              </div>
            )}
          </div>
        </div>

        <div className="gb-pager">
          <Button variant="secondary" size="sm" onClick={() => go(-1)} disabled={idx === 0} aria-label="Back to the previous page" data-testid="prev">
            ‹ Back
          </Button>
          <span className="gb-small" data-testid="spread-count">
            Spread {idx + 1} of {slides.length}
          </span>
          <Button variant="secondary" size="sm" onClick={() => go(1)} disabled={idx >= slides.length - 1} aria-label="Next page" data-testid="next">
            Next ›
          </Button>
        </div>

        <div className="gb-strip" role="list" aria-label="All pages">
          {slides.map((s, i) => {
            const v = project.art[s.id]?.versions[project.art[s.id].current];
            return (
              <button key={s.id} type="button" role="listitem" aria-current={i === idx} aria-label={s.label} onClick={() => setIdx(i)}>
                {v && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(project.id, v.file)} alt="" loading="lazy" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="gb-panel" aria-label="Book details">
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={approved || busy} maxLength={80} />
        <TextField label="Dedication" value={dedication} onChange={(e) => setDedication(e.target.value)} disabled={approved || busy} maxLength={200} />
        <Button variant="ghost" onClick={() => setRerollOpen(true)} disabled={approved || busy || jobActive || art?.status !== "done" || project.rerollsLeft < 1} data-testid="reroll-open">
          Redraw this page ({project.rerollsLeft} left)
        </Button>
        {project.rerollsLeft < 1 && <p className="gb-small">You&apos;ve used every redraw on this book.</p>}
        {rerollFailed && <Notice>{`We couldn't redraw ${rerollFailed.pageId === "cover" ? "the cover" : `page ${rerollFailed.pageId?.slice(1)}`}. The old drawing is still there, and you haven't lost a redraw.`}</Notice>}

        {approved || handedOff ? (
          <div className="gb-stack" data-testid="approved">
            <Notice tone="info">{handedOff ? "Added to your cart." : "Approved. Your print files are ready."}</Notice>
            <Button onClick={addToCart} data-testid="add-to-cart-after">
              {handedOff ? "Go to your cart" : "Add to cart"}
            </Button>
          </div>
        ) : (
          <>
            <Toggle checked={digital} onChange={setDigital}>
              Add a digital copy ({formatMoneyShort(PRICING.skus.book_digital.cents)})
            </Toggle>
            <Checkbox checked={ack} onChange={setAck} id="ack">
              I&apos;ve looked at every page and I&apos;m happy to print it.
            </Checkbox>
            <div className="gb-price">
              <span>Hardcover 8.5 x 8.5, {project.brief.pageCount} pages</span>
              <strong data-testid="price">{formatMoneyShort(total)}</strong>
            </div>
            {layoutRunning ? (
              <Progress value={60} label="Getting your print files ready" />
            ) : (
              <Button onClick={approve} disabled={!ack || busy || jobActive || !title.trim()} data-testid="add-to-cart">
                Add to cart
              </Button>
            )}
            <p className="gb-small">Printed books can&apos;t be changed after you pay.</p>
            {layoutFailed && <Notice>Something needs a fix before we can print. We&apos;re on it. Try again in a moment.</Notice>}
          </>
        )}
        {/* docs/legal/06 req 22: the report channel is linked on every proof page. */}
        <p className="gb-small">
          See something that shouldn&apos;t be here? <a href="/report">Report it</a>.
        </p>
      </aside>

      {rerollOpen && (
        <Modal title="What should change on this page?" onClose={() => setRerollOpen(false)}>
          <TextField multiline rows={3} placeholder="Optional: brighter sky, fewer trees..." value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} aria-label="What should change" />
          <p className="gb-small">{project.rerollsLeft} {project.rerollsLeft === 1 ? "redraw" : "redraws"} left on this book.</p>
          <div className="gb-row">
            <Button onClick={reroll} data-testid="reroll-go">
              Redraw this page
            </Button>
            <Button variant="ghost" onClick={() => setRerollOpen(false)}>
              Never mind
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
