import { addressKey, cleanText, suggestHouseholdName } from "./normalize";
import { defaultId, toDraft, validateRecipient } from "./validate";
import type { AddressPurpose, Clock, ImportPreview, PreviewRow, Recipient, RecipientDraft, RecipientErrors, RecipientList, RecipientSnapshot, RecipientSource } from "./types";

/** CTO architecture: max 500 per list. Bigger than the largest order (300 cards). */
export const MAX_LIST_SIZE = 500;
const ID_SHAPE = /^rc_[a-f0-9]{16}$/;
export const MAX_LISTS_PER_USER = 25;

export function recipientKey(r: Recipient): string {
  return addressKey(r.address);
}

export function newList(userId: string, name: string, opts: Clock = {}): RecipientList {
  const now = (opts.now ?? new Date()).toISOString();
  const id = opts.newId ? opts.newId() : "rl_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return { id, userId, name: cleanText(name, 60) || "My list", recipients: [], createdAt: now, updatedAt: now };
}

export function renameList(list: RecipientList, name: string, opts: Clock = {}): RecipientList {
  return { ...list, name: cleanText(name, 60) || list.name, updatedAt: (opts.now ?? new Date()).toISOString() };
}

export type AddResult =
  | { ok: true; list: RecipientList; recipient: Recipient; warnings: string[] }
  | { ok: false; errors: RecipientErrors; warnings: string[]; duplicateOf?: string; full?: boolean };

/** Adds one recipient typed by hand. Refuses a second envelope to the same address unless `allowDuplicate`. */
export function addRecipient(
  list: RecipientList,
  draft: RecipientDraft,
  opts: Clock & { purpose?: AddressPurpose; allowDuplicate?: boolean; source?: RecipientSource } = {},
): AddResult {
  if (list.recipients.length >= MAX_LIST_SIZE) return { ok: false, errors: {}, warnings: [], full: true };
  const v = validateRecipient(draft, opts);
  if (!v.ok) return { ok: false, errors: v.errors, warnings: v.warnings };
  const key = recipientKey(v.recipient);
  const dup = list.recipients.find((r) => recipientKey(r) === key);
  if (dup && !opts.allowDuplicate) return { ok: false, errors: {}, warnings: v.warnings, duplicateOf: dup.id };
  const now = (opts.now ?? new Date()).toISOString();
  return { ok: true, list: { ...list, recipients: [...list.recipients, v.recipient], updatedAt: now }, recipient: v.recipient, warnings: v.warnings };
}

export type UpdateResult =
  | { ok: true; list: RecipientList; recipient: Recipient; warnings: string[] }
  | { ok: false; errors: RecipientErrors; warnings: string[]; notFound?: boolean; duplicateOf?: string };

/**
 * Applies an edit; the result is validated in full, keeping the id, source and created date. An address change
 * clears the postal check (it was for the old address). Refuses to turn one entry into a copy of another unless
 * `allowDuplicate`.
 */
export function updateRecipient(
  list: RecipientList,
  id: string,
  patch: Partial<RecipientDraft>,
  opts: Clock & { purpose?: AddressPurpose; allowDuplicate?: boolean } = {},
): UpdateResult {
  const cur = list.recipients.find((r) => r.id === id);
  if (!cur) return { ok: false, errors: {}, warnings: [], notFound: true };
  const merged = { ...toDraft(cur), ...patch };
  // New people and the envelope line was our suggestion (not typed by hand): suggest it again from the new names.
  if (patch.names && patch.householdName === undefined && cur.householdName === suggestHouseholdName(cur.names)) merged.householdName = undefined;
  const sameAddressCheck = cur.validation;
  const v0 = validateRecipient(merged, { ...opts, id: cur.id, source: cur.source, createdAt: cur.createdAt });
  if (!v0.ok) return { ok: false, errors: v0.errors, warnings: v0.warnings };
  const key = recipientKey(v0.recipient);
  const v = key === recipientKey(cur) && sameAddressCheck ? { ...v0, recipient: { ...v0.recipient, validation: sameAddressCheck } } : v0;
  const dup = list.recipients.find((r) => r.id !== id && recipientKey(r) === key);
  if (dup && !opts.allowDuplicate) return { ok: false, errors: {}, warnings: v.warnings, duplicateOf: dup.id };
  const now = (opts.now ?? new Date()).toISOString();
  return { ok: true, list: { ...list, recipients: list.recipients.map((r) => (r.id === id ? v.recipient : r)), updatedAt: now }, recipient: v.recipient, warnings: v.warnings };
}

export function removeRecipients(list: RecipientList, ids: string[], opts: Clock = {}): RecipientList {
  const drop = new Set(ids);
  return { ...list, recipients: list.recipients.filter((r) => !drop.has(r.id)), updatedAt: (opts.now ?? new Date()).toISOString() };
}

/* ---------- import preview (shared by CSV and vCard) ---------- */

export type ImportCandidate = { row: number; draft: RecipientDraft; warnings?: string[]; skip?: string };

/**
 * Validates every candidate and marks duplicates by normalized address: against the list the person is importing
 * into, and against earlier rows of the same file. Nothing is saved; `commitImport` does that.
 */
export function buildPreview(
  source: ImportPreview["source"],
  candidates: ImportCandidate[],
  existing: Recipient[] = [],
  opts: Clock & { purpose?: AddressPurpose } = {},
): ImportPreview {
  const seen = new Map<string, { row: number } | { recipientId: string }>();
  for (const r of existing) seen.set(recipientKey(r), { recipientId: r.id });
  const rows: PreviewRow[] = [];
  const recipientSource: RecipientSource = source;
  for (const c of candidates) {
    if (c.skip) {
      rows.push({ row: c.row, status: "skipped", draft: c.draft, errors: {}, warnings: c.warnings ?? [], reason: c.skip });
      continue;
    }
    const v = validateRecipient(c.draft, { ...opts, source: recipientSource, newId: opts.newId ?? defaultId });
    const warnings = [...(c.warnings ?? []), ...v.warnings];
    if (!v.ok) {
      rows.push({ row: c.row, status: "error", draft: v.draft, errors: v.errors, warnings });
      continue;
    }
    const key = recipientKey(v.recipient);
    const prior = seen.get(key);
    if (prior) {
      rows.push({ row: c.row, status: "duplicate", draft: toDraft(v.recipient), recipient: v.recipient, errors: {}, warnings, duplicateOf: prior });
      continue;
    }
    seen.set(key, { row: c.row });
    rows.push({ row: c.row, status: "ok", draft: toDraft(v.recipient), recipient: v.recipient, errors: {}, warnings });
  }
  return { source, rows, counts: countRows(rows) };
}

export function countRows(rows: PreviewRow[]): ImportPreview["counts"] {
  const counts = { total: rows.length, ok: 0, error: 0, duplicate: 0, skipped: 0 };
  for (const r of rows) counts[r.status === "ok" ? "ok" : r.status]++;
  return counts;
}

/**
 * Saves the good rows of a preview into the list. Duplicates are left out unless the person ticked them
 * (`keepDuplicateRows`). Re-checks against the list as it is now, since it may have changed since the preview.
 *
 * The preview travels through the browser (people fix rows in place), so nothing in it is trusted: every row is
 * validated again from its fields, the source is forced to the preview's file type, and an id that is malformed or
 * already on the list is replaced.
 */
export function commitImport(
  list: RecipientList,
  preview: ImportPreview,
  opts: Clock & { purpose?: AddressPurpose; keepDuplicateRows?: number[]; onlyRows?: number[] } = {},
): { list: RecipientList; added: Recipient[]; skippedAsDuplicate: number; invalid: number; overLimit: number } {
  if (preview.fatal) return { list, added: [], skippedAsDuplicate: 0, invalid: 0, overLimit: 0 };
  const keep = new Set(opts.keepDuplicateRows ?? []);
  const only = opts.onlyRows ? new Set(opts.onlyRows) : undefined;
  const keys = new Set(list.recipients.map(recipientKey));
  const ids = new Set(list.recipients.map((r) => r.id));
  const source: RecipientSource = preview.source === "vcard" ? "vcard" : "csv";
  const added: Recipient[] = [];
  let skippedAsDuplicate = 0;
  let invalid = 0;
  let overLimit = 0;
  for (const row of preview.rows) {
    if (!row.recipient || (only && !only.has(row.row))) continue;
    if (row.status !== "ok" && !(row.status === "duplicate" && keep.has(row.row))) {
      if (row.status === "duplicate") skippedAsDuplicate++;
      continue;
    }
    const claimed = typeof row.recipient.id === "string" && ID_SHAPE.test(row.recipient.id) && !ids.has(row.recipient.id) ? row.recipient.id : undefined;
    const v = validateRecipient(toDraft(row.recipient), { ...opts, source, id: claimed, newId: opts.newId ?? defaultId });
    if (!v.ok) {
      invalid++;
      continue;
    }
    const key = recipientKey(v.recipient);
    if (keys.has(key) && !keep.has(row.row)) {
      skippedAsDuplicate++;
      continue;
    }
    if (list.recipients.length + added.length >= MAX_LIST_SIZE) {
      overLimit++;
      continue;
    }
    keys.add(key);
    ids.add(v.recipient.id);
    added.push(v.recipient);
  }
  const now = (opts.now ?? new Date()).toISOString();
  return { list: added.length ? { ...list, recipients: [...list.recipients, ...added], updatedAt: now } : list, added, skippedAsDuplicate, invalid, overLimit };
}

/* ---------- freeze at checkout ---------- */

export type SnapshotResult =
  | { ok: true; snapshot: RecipientSnapshot }
  | { ok: false; error: string; missing: string[]; invalid: string[]; undeliverable: string[] };

/**
 * The recipients a mail-for-me or addressed-envelope line is paid for, copied out of the list (CTO principle 3).
 * Every chosen id must exist, still pass the mailing rules, and not be marked undeliverable. Order follows `ids`
 * with repeats dropped. The snapshot holds only id, household line and address: no emails, names or tags.
 */
export function snapshotRecipients(list: RecipientList, ids: string[], opts: Clock & { maxRecipients?: number } = {}): SnapshotResult {
  const unique = [...new Set(ids)];
  const byId = new Map(list.recipients.map((r) => [r.id, r]));
  const missing: string[] = [];
  const invalid: string[] = [];
  const undeliverable: string[] = [];
  const out: RecipientSnapshot["recipients"] = [];
  for (const id of unique) {
    const r = byId.get(id);
    if (!r) {
      missing.push(id);
      continue;
    }
    if (r.validation?.status === "undeliverable") {
      undeliverable.push(id);
      continue;
    }
    const v = validateRecipient(toDraft(r), { id: r.id, purpose: "mail", source: r.source, createdAt: r.createdAt, now: opts.now });
    if (!v.ok) {
      invalid.push(id);
      continue;
    }
    out.push({ id: r.id, householdName: v.recipient.householdName, address: { ...v.recipient.address } });
  }
  const fail = (error: string): SnapshotResult => ({ ok: false, error, missing, invalid, undeliverable });
  if (unique.length === 0) return fail("Pick at least one person to mail to.");
  if (opts.maxRecipients !== undefined && unique.length > opts.maxRecipients) return fail(`That's more than ${opts.maxRecipients} people for one order.`);
  if (missing.length) return fail("Some people are no longer on this list. Pick them again.");
  if (invalid.length || undeliverable.length) return fail("Some addresses need a fix before we can mail them.");
  return { ok: true, snapshot: { listId: list.id, takenAt: (opts.now ?? new Date()).toISOString(), recipients: out } };
}

/** Removes every address from a snapshot once the order is closed and the reprint window has passed. Ids stay for the audit trail. */
export function scrubSnapshot(s: RecipientSnapshot): RecipientSnapshot {
  return {
    ...s,
    recipients: s.recipients.map((r) => ({ id: r.id, householdName: "", address: { name: "", line1: "", city: "", region: "", postalCode: "", country: r.address.country } })),
  };
}
