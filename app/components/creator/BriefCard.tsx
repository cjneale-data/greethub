"use client";
import { useState } from "react";
import { Badge, Button, Progress } from "@/components/brand";
import { describeOccasion, progress, validateField, type CardDraft } from "@/lib/intake/draft";
import { FIELD_LABELS, REQUIRED_FIELDS, TONE_LABELS, styleLabel, type FieldKey, type RequiredField } from "@/lib/intake/fields";
import { FieldEditor } from "./FieldEditor";
import "./creator.css";

const DISPLAY_ORDER: FieldKey[] = [...REQUIRED_FIELDS, "insideJokes", "include", "avoid", "signoff", "insideIllustration"];

function valueOf(field: FieldKey, d: CardDraft): string {
  switch (field) {
    case "relationship": return d.relationship ?? "";
    case "recipientName": return d.recipientName ?? "";
    case "occasion": return describeOccasion(d);
    case "tone": return d.tone ? TONE_LABELS[d.tone] : "";
    case "artStyle": return styleLabel(d.artStyle);
    case "idea": return d.idea ?? "";
    case "message": return d.message ?? "";
    case "insideJokes": return d.insideJokes ?? "";
    case "include": return d.include ?? "";
    case "avoid": return d.avoid ?? "";
    case "signoff": return d.signoff ?? "";
    case "insideIllustration": return d.insideIllustration ? "Yes" : "";
  }
}

const SOURCE_NOTE: Record<string, string> = { people: "From your saved person", template: "From the template", rag: "Suggested" };

/** Live, editable summary of the brief: white panel, rows of label + value, tap a row to edit it in place. */
export function BriefCard({
  draft, onPatch, onWriteMessage, writing, saved,
}: {
  draft: CardDraft;
  onPatch: (patch: Partial<CardDraft>) => void;
  onWriteMessage?: () => void;
  writing?: boolean;
  saved?: boolean;
}) {
  const [open, setOpen] = useState<FieldKey | null>(null);
  const [more, setMore] = useState(false);
  const p = progress(draft);
  return (
    <section className="gc-brief" aria-label="Your card brief">
      <div className="gc-brief__head">
        <h2 className="gc-panel__title">Your card</h2>
        <div className="gc-draftbar">
          {saved && <span className="gc-hint" role="status">Draft kept on this device</span>}
          <Badge tone="draft">Draft</Badge>
        </div>
      </div>
      <div className="gc-progress">
        <Progress value={p.percent} label={p.label} />
      </div>
      <div className="gc-brief__row" style={{ marginTop: 12 }}>
        <span className="gc-brief__label">Product</span>
        <span className="gc-brief__value">Card</span>
        <span />
      </div>
      {DISPLAY_ORDER.filter((f) => more || (REQUIRED_FIELDS as readonly string[]).includes(f) || !!valueOf(f, draft) || open === f).map((f) => {
        const v = valueOf(f, draft);
        const required = (REQUIRED_FIELDS as readonly string[]).includes(f);
        const err = required ? validateField(f as RequiredField, draft) : null;
        const isOpen = open === f;
        const note = SOURCE_NOTE[draft.sources?.[f] ?? ""];
        return (
          <div className="gc-brief__row" key={f} data-field={f}>
            <span className="gc-brief__label">{FIELD_LABELS[f]}</span>
            <span className={`gc-brief__value ${v ? "" : "gc-brief__empty"}`}>
              {v ? (f === "message" || f === "idea" ? v : v) : "—"}
              {note && v ? <span className="gc-hint" style={{ display: "block", textAlign: "left" }}>{note}</span> : null}
            </span>
            <Button variant="ghost" size="sm" className="gc-brief__editbtn" aria-expanded={isOpen} aria-label={`${isOpen ? "Done editing" : "Edit"} ${FIELD_LABELS[f].toLowerCase()}`} onClick={() => setOpen(isOpen ? null : f)}>
              {isOpen ? "Done" : v ? "Edit" : "Add"}
            </Button>
            {isOpen && (
              <div className="gc-brief__edit">
                <FieldEditor field={f} draft={draft} onPatch={(patch) => onPatch(patch)} error={err} onWriteMessage={f === "message" ? onWriteMessage : undefined} writing={writing} />
              </div>
            )}
          </div>
        );
      })}
      <div style={{ paddingTop: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => setMore(!more)} aria-expanded={more}>
          {more ? "Fewer details" : "More details (optional)"}
        </Button>
      </div>
    </section>
  );
}
