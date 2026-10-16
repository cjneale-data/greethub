import { checkDesign, fitText, paintOrder, slotText, type CardSideDesign, type PhotoInfo, type PrintSize, type TextFit, type TextSlot } from "@/lib/collage";
import { MONTH_NAMES, WEEKDAY_NAMES, findDates, findYears, weekdayOf } from "./dates";
import { checkNames } from "./names";

/**
 * Proof checker v1: rules only, no model, pure (the clock comes in as `now`). Run it at "Review" and again on every edit.
 *
 * Two severities, matching the proof step (docs/cx/07-photo-events-ux.md):
 *  - blocker: the card cannot be approved while it stands. Dismissible blockers (a red-DPI photo) clear with "Print it
 *    anyway"; the rest (empty required photo, overflowing text, a photo under 100 DPI, a date that does not exist) can only be fixed.
 *  - warning: shown with "Fix it" or "It's right". Dismissing sends the finding's id in `dismissed`.
 * Approval also needs the two ticks: "I checked names and dates" and the legal approval text (owned by the UI).
 */

export type ProofKind = "holiday" | "new_year" | "generic";
export type Side = "front" | "back";

export type ProofRule =
  | "year" | "names" | "weekday" | "date_not_real" | "past_date" | "required_text" | "required_photo" | "text_overflow" | "photo_dpi" | "text_outside_safe";

export type Finding = {
  /** Stable across runs for the same problem, so a dismissal survives re-checking. Changes when the words change. */
  id: string;
  rule: ProofRule;
  severity: "blocker" | "warning";
  side?: Side;
  slotId?: string;
  message: string;
  /** "It's right" is available (warnings, plus red-DPI photos via acknowledge). */
  dismissible: boolean;
  /** For a red-DPI blocker: "Print it anyway" id. */
  acknowledgeKey?: string;
};

export type ProofInput = {
  kind: ProofKind;
  now: Date;
  sides: { side: Side; template: CardSideDesign["template"]; design: CardSideDesign["design"] }[];
  size: PrintSize;
  photos: PhotoInfo[];
  /** Real fit results from renderCardPdf. Without them overflow is estimated at 0.5 em per glyph. */
  textFit?: TextFit[];
  /** Customer-entered family name, when the intake collected one. */
  familyName?: string;
  /** Text slot ids (or binds) that must hold words. Default: non-optional slots whose role or bind names a headline or names. */
  requiredText?: string[];
  /** Finding ids the customer dismissed with "It's right". */
  dismissed?: string[];
  /** Photo slot ids the customer ticked "Print it anyway" for. */
  acknowledged?: string[];
  confirmed?: { namesDatesChecked?: boolean; approvalText?: boolean };
};

export type ProofResult = {
  findings: Finding[];
  blockers: Finding[];
  warnings: Finding[];
  /** Findings still standing after dismissals and acknowledgements. */
  open: Finding[];
  /** The ticks the approve button needs, in order. */
  confirmations: { id: "names_dates_checked" | "approval_text"; required: true; ticked: boolean }[];
  canApprove: boolean;
  /** Plain reasons the approve button is off, for the UI. */
  reasons: string[];
  /** The words on the card, one slot per line in slot order (the read-back panel). */
  readBack: { side: Side; slotId: string; text: string }[];
};

/** The year a holiday card must show. Holiday: this calendar year. New Year: the coming year from July on. */
export function expectedYear(kind: ProofKind, now: Date): number | undefined {
  const y = now.getUTCFullYear();
  if (kind === "holiday") return y;
  if (kind === "new_year") return now.getUTCMonth() >= 6 ? y + 1 : y;
  return undefined;
}

const fmt = (month: number, day: number, year?: number) => `${MONTH_NAMES[month]} ${day}${year ? `, ${year}` : ""}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const looksRequired = (s: TextSlot) => /headline|name/i.test(`${s.role ?? ""} ${s.bind ?? ""} ${s.id}`);

export function checkProof(input: ProofInput): ProofResult {
  const { now } = input;
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, "id"> & { key: string }) => {
    const { key, ...rest } = f;
    findings.push({ ...rest, id: `${f.rule}:${f.side ?? "card"}:${f.slotId ?? ""}:${slug(key)}` });
  };
  const readBack: ProofResult["readBack"] = [];
  const texts: { side: Side; slot: TextSlot; text: string }[] = [];

  for (const s of input.sides) {
    const flowTargets = new Set(s.template.slots.flatMap((x) => (x.kind === "text" && x.flowTo ? [x.flowTo] : [])));
    for (const slot of paintOrder(s.template.slots)) {
      if (slot.kind !== "text") continue;
      const text = slotText(slot, s.design).trim();
      if (flowTargets.has(slot.id)) continue; // the overflow half of a two-column letter reads as part of its source
      if (text) readBack.push({ side: s.side, slotId: slot.id, text });
      texts.push({ side: s.side, slot, text });
    }
  }
  const allText = texts.map((t) => t.text).filter(Boolean);

  // Required fields.
  for (const t of texts) {
    const isReq = input.requiredText ? (input.requiredText.includes(t.slot.id) || (t.slot.bind && input.requiredText.includes(t.slot.bind))) : !t.slot.optional && looksRequired(t.slot);
    const own = input.sides.find((x) => x.side === t.side)!.design.text;
    const typed = (own[t.slot.id] ?? (t.slot.bind ? own[t.slot.bind] : undefined) ?? "").trim();
    if (isReq && !t.text)
      push({ rule: "required_text", severity: "blocker", side: t.side, slotId: t.slot.id, key: "empty", dismissible: false, message: "This card needs words here." });
    else if (isReq && !typed && t.slot.placeholder && /name/i.test(`${t.slot.role ?? ""} ${t.slot.bind ?? ""}`))
      push({ rule: "required_text", severity: "warning", side: t.side, slotId: t.slot.id, key: "sample", dismissible: true, message: `This still shows the sample words "${t.slot.placeholder}". Add your names.` });
  }

  // Photos: empty required slots, DPI, text past the safe line.
  for (const s of input.sides) {
    for (const i of checkDesign(s.template, input.size, s.design, input.photos)) {
      if (i.kind === "empty_photo_slot") {
        if (!i.optional) push({ rule: "required_photo", severity: "blocker", side: s.side, slotId: i.slotId, key: "empty", dismissible: false, message: i.message });
      } else if (i.kind === "photo_quality") {
        if (i.level === "blocked") push({ rule: "photo_dpi", severity: "blocker", side: s.side, slotId: i.slotId, key: "blocked", dismissible: false, message: i.message });
        else if (i.level === "too_low") push({ rule: "photo_dpi", severity: "blocker", side: s.side, slotId: i.slotId, key: "too-low", dismissible: false, acknowledgeKey: i.slotId, message: i.message });
        else push({ rule: "photo_dpi", severity: "warning", side: s.side, slotId: i.slotId, key: "low", dismissible: true, message: i.message });
      } else if (i.kind === "text_outside_safe") {
        push({ rule: "text_outside_safe", severity: "warning", side: s.side, slotId: i.slotId, key: "safe", dismissible: true, message: i.message });
      }
    }
  }

  // Text overflow: the real fit when we have it, else a rough estimate.
  const fits: TextFit[] = input.textFit ?? estimateFit(input);
  for (const f of fits) {
    if (f.overflow) push({ rule: "text_overflow", severity: "blocker", side: f.side, slotId: f.slotId, key: "overflow", dismissible: false, message: "This text does not fit. Shorten it or make the box bigger." });
  }

  // Year.
  const want = expectedYear(input.kind, now);
  if (want !== undefined) {
    const years = [...new Set(allText.flatMap(findYears))];
    if (!years.length) push({ rule: "year", severity: "warning", key: "missing", dismissible: true, message: `This card does not show a year. Holiday cards this season say ${want}.` });
    for (const y of years.filter((v) => v !== want)) {
      push({ rule: "year", severity: "warning", key: String(y), dismissible: true, message: `The card says ${y}. This season is ${want}.` });
    }
  }

  // Names.
  for (const n of checkNames(allText, input.familyName)) {
    const [a, b] = n.forms;
    const message =
      n.reason === "plural_vs_possessive" ? `"${a}" and "${b}" both appear. Is it the plural or the possessive?`
      : n.reason === "differs_from_family_name" ? `"${b}" is spelled a little differently from "${a}". Is that right?`
      : `"${a}" and "${b}" look like the same name spelled two ways.`;
    push({ rule: "names", severity: "warning", key: n.forms.join("-"), dismissible: true, message });
  }

  // Dates: weekday, nonexistent, past.
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const t of texts) {
    for (const d of findDates(t.text)) {
      const label = d.text;
      if (!d.exists) {
        push({ rule: "date_not_real", severity: "blocker", side: t.side, slotId: t.slot.id, key: label, dismissible: false, message: `${fmt(d.month, d.day, d.year)} is not a real date.` });
        continue;
      }
      if (d.weekday !== undefined) {
        const years = d.year !== undefined ? [d.year] : [now.getUTCFullYear(), now.getUTCFullYear() + 1];
        if (!years.some((y) => d.day <= new Date(Date.UTC(y, d.month + 1, 0)).getUTCDate() && weekdayOf(y, d.month, d.day) === d.weekday)) {
          const real = d.year !== undefined ? ` is a ${WEEKDAY_NAMES[weekdayOf(d.year, d.month, d.day)]}` : " falls on a different day";
          push({ rule: "weekday", severity: "warning", side: t.side, slotId: t.slot.id, key: label, dismissible: true, message: `"${label}": ${fmt(d.month, d.day, d.year)}${real}, not ${WEEKDAY_NAMES[d.weekday]}.` });
        }
      }
      if (d.year !== undefined && Date.UTC(d.year, d.month, d.day) < today) {
        push({ rule: "past_date", severity: "warning", side: t.side, slotId: t.slot.id, key: label, dismissible: true, message: `${fmt(d.month, d.day, d.year)} has already passed.` });
      }
    }
  }

  const dismissed = new Set(input.dismissed ?? []);
  const acked = new Set(input.acknowledged ?? []);
  const open = findings.filter((f) => {
    if (f.severity === "warning") return !dismissed.has(f.id);
    if (f.acknowledgeKey) return !acked.has(f.acknowledgeKey);
    return true;
  });
  const openBlockers = open.filter((f) => f.severity === "blocker");
  const c = input.confirmed ?? {};
  const confirmations: ProofResult["confirmations"] = [
    { id: "names_dates_checked", required: true, ticked: !!c.namesDatesChecked },
    { id: "approval_text", required: true, ticked: !!c.approvalText },
  ];
  const reasons: string[] = [];
  if (openBlockers.length) reasons.push(`${openBlockers.length} ${openBlockers.length === 1 ? "problem" : "problems"} to fix first`);
  if (!c.namesDatesChecked) reasons.push("Tick \"I checked names and dates\"");
  if (!c.approvalText) reasons.push("Tick the approval box");
  return {
    findings,
    blockers: findings.filter((f) => f.severity === "blocker"),
    warnings: findings.filter((f) => f.severity === "warning"),
    open,
    confirmations,
    canApprove: reasons.length === 0,
    reasons,
    readBack,
  };
}

function estimateFit(input: ProofInput): TextFit[] {
  const out: TextFit[] = [];
  for (const s of input.sides) {
    const targets = new Set(s.template.slots.flatMap((x) => (x.kind === "text" && x.flowTo ? [x.flowTo] : [])));
    for (const slot of s.template.slots) {
      if (slot.kind !== "text" || slot.flowTo || targets.has(slot.id)) continue;
      const shown = slotText(slot, s.design).trim();
      if (!shown) continue;
      const text = slot.uppercase ? shown.toUpperCase() : shown;
      const laid = fitText(text, slot, (str, sz) => str.length * sz * (0.5 + (slot.letterSpacing ?? 0)), slot.checkbox ? 0.25 : 0);
      out.push({ side: s.side, slotId: slot.id, sizePt: laid.size, overflow: laid.overflow, lines: laid.lines.length });
    }
  }
  return out;
}

export { findDates, findYears } from "./dates";
export { checkNames } from "./names";
