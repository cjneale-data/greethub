"use client";
import { Button, TextField, Toggle } from "@/components/brand";
import type { ArtStyleId } from "@greethub/shared";
import { OCCASIONS } from "@greethub/shared";
import type { CardDraft } from "@/lib/intake/draft";
import {
  FIELD_LABELS, LIMITS, OCCASION_LABELS, RELATIONSHIPS, TONE_LABELS, ideaSuggestions,
  type FieldKey, type Occasion, type Tone,
} from "@/lib/intake/fields";
import { checkText } from "@/lib/intake/guardrails";
import { StyleBrowser, type StyleSuggestion } from "@/components/styles/StyleBrowser";
import { ChipPicker } from "./widgets";

const toneEntries = Object.entries(TONE_LABELS) as [Tone, string][];
const occasionLabels = OCCASIONS.map((o) => OCCASION_LABELS[o]);

type Props = {
  field: FieldKey;
  draft: CardDraft;
  onPatch: (patch: Partial<CardDraft>) => void;
  /** Inline validation message from the required-field rules. */
  error?: string | null;
  onWriteMessage?: () => void;
  writing?: boolean;
  /** A generic style offered after a franchise-look request in chat (artStyle field only). */
  styleSuggestion?: StyleSuggestion | null;
};

/** One editable field, used by the Form tab and by the brief card's inline edit. Chat and form edit the same draft. */
export function FieldEditor({ field, draft, onPatch, error, onWriteMessage, writing, styleSuggestion }: Props) {
  const text = (key: "recipientName" | "idea" | "message" | "insideJokes" | "include" | "avoid" | "signoff", opts: { multiline?: boolean; placeholder?: string; hint?: string }) => {
    const value = draft[key] ?? "";
    const verdict = value ? checkText(value, { nameLike: key === "recipientName" || key === "signoff" }) : null;
    const guard = verdict && !verdict.ok ? verdict : null;
    const [, max] = LIMITS[key];
    const common = { label: FIELD_LABELS[field], value, maxLength: max + 100, error: guard?.message ?? (value ? error ?? undefined : undefined), hint: opts.hint, placeholder: opts.placeholder };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.multiline ? (
          <TextField multiline rows={key === "message" ? 4 : 3} {...common} onChange={(e) => onPatch({ [key]: e.target.value })} />
        ) : (
          <TextField {...common} onChange={(e) => onPatch({ [key]: e.target.value })} />
        )}
        {guard && guard.kind === "copyright" && (
          <div className="gc-actions" style={{ justifyContent: "flex-start" }}>
            <Button variant="secondary" size="sm" onClick={() => onPatch({ [key]: guard.rewritten })}>
              Use this version
            </Button>
            <span className="gc-hint">Original characters inspired by your idea. Edit it any time.</span>
          </div>
        )}
      </div>
    );
  };

  switch (field) {
    case "relationship":
      return (
        <ChipPicker ariaLabel="Who is it for" options={RELATIONSHIPS} otherLabel="Someone else" otherPlaceholder="Who are they to you?" value={draft.relationship} onChange={(v) => onPatch({ relationship: v })} />
      );
    case "recipientName":
      return text("recipientName", { placeholder: "Rosa", hint: "Just a first name or nickname is fine." });
    case "occasion": {
      const value = draft.occasion ? (draft.occasion === "other" ? "Something else" : OCCASION_LABELS[draft.occasion]) : undefined;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ChipPicker
            ariaLabel="Occasion"
            scroll
            options={occasionLabels}
            value={value}
            onChange={(label) => {
              const id = (Object.keys(OCCASION_LABELS) as Occasion[]).find((k) => OCCASION_LABELS[k] === label)!;
              onPatch({ occasion: id });
            }}
          />
          {draft.occasion === "other" && (
            <TextField aria-label="Occasion in a few words" placeholder="Tell me the occasion in a few words" maxLength={60} value={draft.occasionOther ?? ""} onChange={(e) => onPatch({ occasion: "other", occasionOther: e.target.value })} />
          )}
        </div>
      );
    }
    case "tone":
      return (
        <ChipPicker ariaLabel="Tone" options={toneEntries.map(([, l]) => l)} value={draft.tone ? TONE_LABELS[draft.tone] : undefined} onChange={(l) => onPatch({ tone: toneEntries.find(([, x]) => x === l)![0] })} />
      );
    case "artStyle":
      return <StyleBrowser product="card" value={draft.artStyle} brief={{ occasion: draft.occasion, tone: draft.tone }} suggestion={styleSuggestion} onChange={(id) => onPatch({ artStyle: id as ArtStyleId })} />;
    case "idea":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {text("idea", { multiline: true, placeholder: "A memory, a place, something they love", hint: "A sentence or two is plenty." })}
          <div className="gc-chips">
            {ideaSuggestions(draft.occasion).map((s) => (
              <button key={s} type="button" className="gh-chip" style={{ height: "auto", minHeight: 44, whiteSpace: "normal", textAlign: "left", padding: "8px 14px" }} onClick={() => onPatch({ idea: s })}>
                {s}
              </button>
            ))}
          </div>
        </div>
      );
    case "message": {
      const words = (draft.message ?? "").trim().split(/\s+/).filter(Boolean).length;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {text("message", { multiline: true, placeholder: "The words that go inside", hint: `${words} words. About 60 fits the card.` })}
          {onWriteMessage && (
            <div>
              <Button variant="secondary" size="sm" onClick={onWriteMessage} disabled={writing}>
                {writing ? "Writing..." : "Write it for me"}
              </Button>
            </div>
          )}
        </div>
      );
    }
    case "insideJokes":
      return text("insideJokes", { multiline: true, placeholder: "Details only they would get" });
    case "include":
      return text("include", { placeholder: "Colors, a pet, a place" });
    case "avoid":
      return text("avoid", { placeholder: "Anything to leave out" });
    case "signoff":
      return text("signoff", { placeholder: "Your first name" });
    case "insideIllustration":
      return (
        <Toggle checked={!!draft.insideIllustration} onChange={(v) => onPatch({ insideIllustration: v })}>
          Add a small drawing inside
        </Toggle>
      );
  }
}
