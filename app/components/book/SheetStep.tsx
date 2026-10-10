"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ChipGroup, Progress, TextField } from "../brand";
import { assetUrl, bookApi } from "../../lib/book/client";
import type { StepProps } from "./types";
import { Notice, Skeleton } from "./ui";

/** Character sheet approval (UX spec 6c): the gate before any page is drawn. */
export function SheetStep({ project, run, busy, onApproved }: StepProps & { onApproved: () => void }) {
  const latest = project.sheet.versions.at(-1);
  const working = project.job?.kind === "sheet" && (project.job.status === "queued" || project.job.status === "running");
  const failed = !working && project.lastJob?.kind === "sheet" && project.lastJob.status === "failed" && !latest;
  const started = useRef(false);
  const [verdict, setVerdict] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (latest || working || failed || started.current) return;
    started.current = true;
    void run(() => bookApi.action(project.id, "generate-sheet"));
  }, [latest, working, failed, run, project.id]);

  const people = project.brief.characters;
  const free = project.sheetFreeRedosLeft;
  const redoLabel = free > 0 ? `Redo the sheet (${free} free ${free === 1 ? "redo" : "redos"} left)` : project.rerollsLeft > 0 ? "Redo (uses a re-roll)" : "No redos left";
  const redoOk = (free > 0 || project.rerollsLeft > 0) && !busy && !working;

  const redo = () => {
    const sent = Object.fromEntries(people.filter((c) => verdict[c.id] === "Something's off" && notes[c.id]?.trim()).map((c) => [c.name, notes[c.id].trim()]));
    void run(() => bookApi.action(project.id, "redo-sheet", { notes: sent }));
  };
  const approve = async () => {
    if (await run(() => bookApi.action(project.id, "approve-sheet"))) {
      if (await run(() => bookApi.action(project.id, "start-render"))) onApproved();
    }
  };

  if (failed) {
    return (
      <div className="gb-narrow">
        <Notice action={{ label: "Try again", onClick: () => void run(() => bookApi.action(project.id, "generate-sheet")) }}>{project.lastJob?.error ?? "We couldn't draw the characters."}</Notice>
      </div>
    );
  }

  return (
    <div className="gb-narrow" data-testid="sheet-step">
      <section className="gb-panel">
        <h2 className="gb-h2">Meet the family</h2>
        {working && <Progress value={55} label={latest ? "Drawing them again" : "Drawing the characters"} />}
        {latest ? (
          <button type="button" className="gb-sheet" onClick={() => setZoom(true)} aria-label="Zoom in on the character sheet" data-testid="sheet-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(project.id, latest.file)} alt={`Character sheet: ${people.map((c) => c.name).join(", ")}`} style={working ? { opacity: 0.4 } : undefined} />
          </button>
        ) : (
          <div className="gb-sheet" aria-busy="true" style={{ cursor: "default" }}>
            <Skeleton h={640} />
          </div>
        )}
        {latest && !working && (
          <>
            <h3 className="gb-h2" style={{ fontSize: 18 }}>
              Do these look like them?
            </h3>
            {people.map((c) => (
              <div className="gb-stack" key={c.id} style={{ gap: "var(--gh-s-2)" }}>
                <span className="gb-label" style={{ margin: 0 }}>
                  {c.name}
                </span>
                <ChipGroup options={["Looks right", "Something's off"]} value={verdict[c.id]} onChange={(v) => setVerdict({ ...verdict, [c.id]: v })} />
                {verdict[c.id] === "Something's off" && (
                  <TextField placeholder="What should change?" value={notes[c.id] ?? ""} maxLength={300} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} aria-label={`What should change about ${c.name}`} />
                )}
              </div>
            ))}
          </>
        )}
      </section>
      <div className="gb-row">
        <Button onClick={approve} disabled={!latest || busy || working} data-testid="approve-sheet">
          Looks right, draw the book
        </Button>
        <Button variant="secondary" onClick={redo} disabled={!redoOk || !latest} data-testid="redo-sheet">
          {redoLabel}
        </Button>
      </div>
      <p className="gb-small">Pages are drawn after you say yes. Changing a character later means redrawing the pages.</p>
      {zoom && latest && (
        <button type="button" className="gb-zoom" onClick={() => setZoom(false)} aria-label="Close zoom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl(project.id, latest.file)} alt="Character sheet, enlarged" />
        </button>
      )}
    </div>
  );
}
