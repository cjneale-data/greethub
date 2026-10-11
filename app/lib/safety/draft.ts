/**
 * Server helper: run the IP screen (rules + live model when configured) over every free-text field of a card draft.
 * Returns the draft with rewrites applied and the customer-facing notes. Import from server code only.
 */
import type { CardDraft } from "../intake/draft";
import { DRAFT_IP_FIELD, NAME_LIKE_FIELDS, TEXT_FIELDS, knownNamesOf, type DraftField } from "../intake/guardrails";
import { screenFields } from "./server";

export type ScreenedDraft =
  | { ok: true; draft: CardDraft; notes: string[] }
  | { ok: false; field: DraftField; message: string };

export async function screenDraft(d: CardDraft): Promise<ScreenedDraft> {
  const known = knownNamesOf(d);
  const fields = TEXT_FIELDS.filter((f) => !NAME_LIKE_FIELDS.includes(f) && f in DRAFT_IP_FIELD && !!d[f]);
  if (!fields.length) return { ok: true, draft: d, notes: [] };
  const outs = await screenFields(fields.map((f) => ({ text: String(d[f]), field: DRAFT_IP_FIELD[f], knownNames: known })));
  const next: CardDraft = { ...d };
  const notes: string[] = [];
  for (let i = 0; i < fields.length; i++) {
    const r = outs[i];
    if (r.verdict === "blocked") return { ok: false, field: fields[i], message: r.userNote };
    if (r.verdict === "rewritten") {
      (next as Record<string, unknown>)[fields[i]] = r.safeText;
      if (r.userNote && !notes.includes(r.userNote)) notes.push(r.userNote);
    }
  }
  return { ok: true, draft: next, notes };
}
