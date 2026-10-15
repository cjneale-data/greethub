import { buildPreview, type ImportCandidate } from "./list";
import { MAX_IMPORT_ROWS, MAX_VCARD_BYTES, importSizeError, textBytes } from "./csv";
import { cleanText } from "./normalize";
import type { AddressPurpose, Clock, ImportPreview, Recipient, RecipientDraft } from "./types";

/**
 * Basic vCard import (versions 2.1, 3.0 and 4.0, as exported by Apple Contacts, iCloud, Google and Outlook).
 * Reads FN, N, ADR and EMAIL. Phone numbers, photos, birthdays, notes and everything else are ignored and never stored.
 */

type Prop = { name: string; params: Record<string, string[]>; value: string };
export type VCardContact = { fullName: string; given: string; family: string; adr?: RecipientDraft; email?: string };

function decodeQuotedPrintable(s: string): string {
  const bytes: number[] = [];
  const raw = s.replace(/=\r?\n/g, "");
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(raw.slice(i + 1, i + 3))) {
      bytes.push(parseInt(raw.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(...new TextEncoder().encode(raw[i]));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Unfolds continuation lines (RFC 6350 3.2) and vCard 2.1 quoted-printable soft breaks. */
function unfold(text: string): string[] {
  const physical = text.replace(/^﻿/, "").split(/\r\n|\r|\n/);
  const out: string[] = [];
  for (const line of physical) {
    const prev = out.length ? out[out.length - 1] : undefined;
    if (prev !== undefined && /^[ \t]/.test(line)) out[out.length - 1] = prev + line.slice(1);
    else if (prev !== undefined && /QUOTED-PRINTABLE/i.test(prev.split(":")[0]) && prev.endsWith("=")) out[out.length - 1] = prev.slice(0, -1) + line;
    else out.push(line);
  }
  return out;
}

function parseProp(line: string): Prop | undefined {
  // The value starts at the first colon not inside a quoted parameter value.
  let inQ = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQ = !inQ;
    else if (line[i] === ":" && !inQ) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return undefined;
  const [rawName, ...rawParams] = line.slice(0, colon).split(";");
  const name = rawName.replace(/^[^.]*\./, "").toUpperCase(); // drop "item1." groups
  const params: Record<string, string[]> = {};
  for (const p of rawParams) {
    const eq = p.indexOf("=");
    // vCard 2.1 bare params ("ADR;HOME:") are TYPE values.
    const key = eq < 0 ? "TYPE" : p.slice(0, eq).toUpperCase();
    const vals = (eq < 0 ? p : p.slice(eq + 1)).replace(/"/g, "").split(",").map((v) => v.trim().toUpperCase());
    params[key] = [...(params[key] ?? []), ...vals];
  }
  let value = line.slice(colon + 1);
  if ((params.ENCODING ?? []).includes("QUOTED-PRINTABLE")) value = decodeQuotedPrintable(value);
  return { name, params, value };
}

/** Splits a structured value on unescaped semicolons, then unescapes \n \, \; \\. */
function components(value: string): string[] {
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "\\" && i + 1 < value.length) {
      const n = value[i + 1];
      cur += n === "n" || n === "N" ? "\n" : n;
      i++;
    } else if (c === ";") {
      parts.push(cur);
      cur = "";
    } else cur += c;
  }
  parts.push(cur);
  return parts;
}
const unescape = (v: string) => components(v).join(";");

function hasType(p: Prop, t: string): boolean {
  return (p.params.TYPE ?? []).includes(t) || (t === "PREF" && p.params.PREF !== undefined);
}

function adrToDraft(p: Prop): RecipientDraft {
  // ADR: PO box ; extended address ; street ; locality ; region ; postal code ; country
  const [poBox = "", ext = "", street = "", city = "", region = "", zip = "", country = ""] = components(p.value);
  const streetLines = street.split("\n").map((s) => cleanText(s)).filter(Boolean);
  let line1 = streetLines[0] ?? "";
  const line2Parts = [...streetLines.slice(1), cleanText(ext)].filter(Boolean);
  if (!line1 && poBox.trim()) line1 = /box/i.test(poBox) ? cleanText(poBox) : `PO Box ${cleanText(poBox)}`;
  return { line1, line2: line2Parts.join(", ") || undefined, city: cleanText(city), region: cleanText(region), postalCode: cleanText(zip), country: cleanText(country) };
}

/** Parses every contact in a .vcf file. */
export function parseVCards(text: string): VCardContact[] {
  const contacts: VCardContact[] = [];
  let props: Prop[] | undefined;
  for (const line of unfold(text)) {
    const t = line.trim();
    if (/^BEGIN:VCARD$/i.test(t)) {
      props = [];
      continue;
    }
    if (/^END:VCARD$/i.test(t)) {
      if (props) contacts.push(toContact(props));
      props = undefined;
      continue;
    }
    if (!props || !t) continue;
    const p = parseProp(line);
    if (p) props.push(p);
  }
  return contacts;
}

function toContact(props: Prop[]): VCardContact {
  const first = (n: string) => props.find((p) => p.name === n);
  const n = first("N");
  const [family = "", given = ""] = n ? components(n.value) : [];
  const fn = first("FN");
  const fullName = cleanText(fn ? unescape(fn.value) : [given, family].filter(Boolean).join(" "), 120);
  const adrs = props.filter((p) => p.name === "ADR");
  // Home first (that's where cards go), then preferred, then the first one.
  const adr = adrs.find((p) => hasType(p, "HOME")) ?? adrs.find((p) => hasType(p, "PREF")) ?? adrs[0];
  const emails = props.filter((p) => p.name === "EMAIL");
  const email = emails.find((p) => hasType(p, "PREF")) ?? emails[0];
  return {
    fullName,
    given: cleanText(given, 80),
    family: cleanText(family, 80),
    adr: adr ? adrToDraft(adr) : undefined,
    email: email ? cleanText(unescape(email.value).replace(/^mailto:/i, ""), 254) : undefined,
  };
}

export const MAX_VCARD_LINES = 50_000;
export const MAX_VCARD_CONTACTS = 20_000;

export type VCardImportOptions = Clock & { purpose?: AddressPurpose; existing?: Recipient[] };

/** Reads a .vcf file into the same preview as CSV. Contacts without a street address are skipped, not errors. */
export function importVCard(text: string, opts: VCardImportOptions = {}): ImportPreview {
  const fail = (fatal: string): ImportPreview => ({ source: "vcard", rows: [], counts: { total: 0, ok: 0, error: 0, duplicate: 0, skipped: 0 }, fatal });
  const tooBig = text.length > MAX_VCARD_BYTES ? importSizeError(text.length, "vcard") : importSizeError(textBytes(text), "vcard");
  if (tooBig) return fail(tooBig);
  // Cheap counts first, so a file of a million short lines never reaches the parser.
  let lines = 1;
  for (let i = text.indexOf("\n"); i >= 0 && lines <= MAX_VCARD_LINES; i = text.indexOf("\n", i + 1)) lines++;
  const blocks = text.match(/^BEGIN:VCARD/gim)?.length ?? 0;
  if (lines > MAX_VCARD_LINES || blocks > MAX_VCARD_CONTACTS) return fail("That file is too big. Export a smaller group of contacts.");
  const contacts = parseVCards(text);
  if (contacts.length === 0) return fail("We couldn't find any contacts in that file.");
  const candidates: ImportCandidate[] = contacts.map((c, i) => {
    const names = c.fullName ? [c.fullName] : [];
    const draft: RecipientDraft = { householdName: c.fullName, names, ...(c.adr ?? {}), email: c.email };
    const hasAddress = !!c.adr && !!(c.adr.line1 || c.adr.city || c.adr.postalCode);
    return { row: i + 1, draft, skip: hasAddress ? undefined : "No postal address on this contact" };
  });
  const withAddress = candidates.filter((c) => !c.skip).length;
  if (withAddress > MAX_IMPORT_ROWS) return fail(`That file has more than ${MAX_IMPORT_ROWS.toLocaleString("en-US")} contacts with addresses. Export a smaller group.`);
  return buildPreview("vcard", candidates, opts.existing ?? [], opts);
}
