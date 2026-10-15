import { buildPreview, type ImportCandidate } from "./list";
import { cleanText, parseOneLineAddress, splitNames, suggestHouseholdName } from "./normalize";
import type { AddressPurpose, Clock, ImportPreview, Recipient, RecipientDraft } from "./types";

/** Big enough for a 1,000-row guest list with long cells; small enough to parse in a request. */
export const MAX_IMPORT_BYTES = 1_000_000;
export const MAX_IMPORT_ROWS = 1000;
/** A record wider than this is not an address list (a 1 MB file of empty cells would pass the row cap). */
export const MAX_CSV_CELLS = 100;
/** vCard files carry photos and notes we ignore, so they get more room than CSV. */
export const MAX_VCARD_BYTES = MAX_IMPORT_BYTES * 5;

/**
 * Size gate. Call it with `file.size` or Content-Length BEFORE reading the body into memory, and again with the
 * text (importCsv and importVCard do) so a caller that forgot still gets the limit. Returns the message to show, or undefined if it fits.
 */
export function importSizeError(bytes: number, kind: "csv" | "vcard" = "csv"): string | undefined {
  if (!Number.isFinite(bytes) || bytes < 0) return "We couldn't read that file.";
  if (kind === "vcard") return bytes > MAX_VCARD_BYTES ? "That file is too big. Export a smaller group of contacts." : undefined;
  return bytes > MAX_IMPORT_BYTES ? "That file is too big. Split it into files of up to 1,000 people." : undefined;
}

/** UTF-8 size of a string. Callers check `text.length` first, since a string longer than the limit is already too big. */
export function textBytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/* ---------- RFC 4180 parser ---------- */

function detectDelimiter(text: string): string {
  let inQ = false;
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const c of text) {
    if (c === '"') inQ = !inQ;
    else if (!inQ && (c === "\n" || c === "\r")) break;
    else if (!inQ && c in counts) counts[c]++;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

/**
 * Parses CSV (comma, semicolon or tab; detected from the header line). Handles quoted fields with commas,
 * doubled quotes and line breaks, CRLF, and Excel's byte-order mark. Returns every record, blank ones included,
 * so record numbers line up with spreadsheet rows.
 */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const s = input.replace(/^﻿/, "");
  const d = delimiter ?? detectDelimiter(s);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field.trim() === "") {
      field = "";
      inQ = true;
    } else if (c === d) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (c === "\r" && s[i + 1] === "\n") i++;
    } else {
      field += c;
    }
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ---------- header mapping ---------- */

export type CsvField =
  | "householdName" | "names" | "fullName" | "firstName" | "lastName" | "partnerName" | "oneLine"
  | "line1" | "line2" | "city" | "region" | "postalCode" | "country" | "email";

/** Normalized header (lowercase letters and digits only) -> field. Covers our own export, Google, Outlook, Apple Numbers and hand-made spreadsheets. */
const HEADER_SYNONYMS: Record<string, CsvField> = {};
const syn = (field: CsvField, ...headers: string[]) => headers.forEach((h) => (HEADER_SYNONYMS[h] = field));
syn("householdName", "household", "householdname", "addressee", "addressto", "envelopename", "nameonenvelope", "mailingname", "envelope", "envelopeline", "salutation", "formalname");
syn("names", "names", "guests", "guestnames", "people", "members");
syn("fullName", "name", "fullname", "contactname", "guest", "guestname", "recipient", "recipientname", "displayname");
syn("firstName", "firstname", "first", "givenname", "fname", "forename");
syn("lastName", "lastname", "last", "surname", "familyname", "lname");
syn("partnerName", "partner", "partnername", "partnerfirstname", "spouse", "spousename", "guest2", "secondguest", "plusone", "plusonename");
syn("oneLine", "fulladdress", "mailingaddress", "formattedaddress", "address1formatted", "homeaddressformatted", "completeaddress");
syn("line1", "address", "address1", "addressline1", "street", "streetaddress", "street1", "line1", "address1street", "homestreet", "streetline1");
syn("line2", "address2", "addressline2", "street2", "line2", "apt", "apartment", "unit", "suite", "aptsuite", "aptunit", "address1extendedaddress", "homestreet2", "streetline2");
syn("city", "city", "town", "locality", "address1city", "homecity", "citytown");
syn("region", "state", "province", "region", "stateprovince", "st", "address1region", "homestate", "stateregion");
syn("postalCode", "zip", "zipcode", "postalcode", "postcode", "zippostalcode", "postal", "address1postalcode", "homepostalcode", "zipcodepostalcode");
syn("country", "country", "countrycode", "address1country", "homecountry", "homecountryregion", "countryregion");
syn("email", "email", "emailaddress", "email1value", "email1", "mail");
// Phone numbers are deliberately not imported: a mailed card doesn't need them (data minimization).

const normHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

export function mapHeaders(headers: string[]): { index: Partial<Record<CsvField, number>>; mapped: Record<string, string>; ignored: string[] } {
  const index: Partial<Record<CsvField, number>> = {};
  const mapped: Record<string, string> = {};
  const ignored: string[] = [];
  headers.forEach((h, i) => {
    const field = HEADER_SYNONYMS[normHeader(h)];
    if (field && index[field] === undefined) {
      index[field] = i;
      mapped[field] = cleanText(h, 80);
    } else if (cleanText(h)) {
      ignored.push(cleanText(h, 80));
    }
  });
  return { index, mapped, ignored };
}

function missingColumns(ix: Partial<Record<CsvField, number>>): string[] {
  const missing: string[] = [];
  const hasName = ["householdName", "names", "fullName", "firstName", "lastName"].some((f) => ix[f as CsvField] !== undefined);
  if (!hasName) missing.push("a name");
  const split = ix.city !== undefined && ix.region !== undefined && ix.postalCode !== undefined;
  const oneLine = ix.oneLine !== undefined || (ix.line1 !== undefined && ix.city === undefined && ix.postalCode === undefined);
  if (ix.line1 === undefined && ix.oneLine === undefined) missing.push("the street address");
  else if (!split && !oneLine) {
    if (ix.city === undefined) missing.push("city");
    if (ix.region === undefined) missing.push("state");
    if (ix.postalCode === undefined) missing.push("ZIP code");
  }
  return missing;
}

function rowToCandidate(cells: string[], ix: Partial<Record<CsvField, number>>, row: number): ImportCandidate {
  // Undo our own export's formula guard ('=...) so a round trip is lossless.
  const get = (f: CsvField) => (ix[f] === undefined ? "" : (cells[ix[f]!] ?? "").replace(/^'(?=[=+\-@])/, ""));
  const warnings: string[] = [];

  let names: string[] = [];
  if (get("names")) names = splitNames(get("names"));
  else {
    const first = cleanText(get("firstName"), 80);
    const last = cleanText(get("lastName"), 80);
    const full = cleanText(get("fullName"), 120) || [first, last].filter(Boolean).join(" ");
    if (full) names.push(full);
    const partner = cleanText(get("partnerName"), 120);
    if (partner) names.push(!partner.includes(" ") && last ? `${partner} ${last}` : partner);
  }
  const householdName = cleanText(get("householdName"), 200) || suggestHouseholdName(names);

  const draft: RecipientDraft = {
    householdName,
    names,
    line1: get("line1"),
    line2: get("line2"),
    city: get("city"),
    region: get("region"),
    postalCode: get("postalCode"),
    country: get("country"),
    email: get("email"),
  };

  // One-line addresses: a "Full address" column, or a lone "Address" column with no city/state/ZIP columns.
  const useOneLine = ix.oneLine !== undefined ? !!get("oneLine") && !draft.city : ix.city === undefined && ix.postalCode === undefined;
  if (useOneLine) {
    const raw = get("oneLine") || get("line1");
    const parsed = raw ? parseOneLineAddress(raw) : undefined;
    if (parsed) {
      Object.assign(draft, { line1: parsed.line1, line2: draft.line2 || parsed.line2, city: parsed.city, region: parsed.region, postalCode: parsed.postalCode, country: draft.country || parsed.country });
      warnings.push("We split this address from one line. Check the street, city, state and ZIP.");
    } else if (raw) {
      draft.line1 = raw;
    }
  }
  return { row, draft, warnings };
}

export type CsvImportOptions = Clock & { purpose?: AddressPurpose; existing?: Recipient[] };

/**
 * Reads a CSV address list into a preview: every row validated, with per-row errors and duplicates marked.
 * Blank rows are dropped. Row numbers are spreadsheet rows (header = 1).
 */
export function importCsv(text: string, opts: CsvImportOptions = {}): ImportPreview {
  const fail = (fatal: string): ImportPreview => ({ source: "csv", rows: [], counts: { total: 0, ok: 0, error: 0, duplicate: 0, skipped: 0 }, fatal });
  const tooBig = text.length > MAX_IMPORT_BYTES ? importSizeError(text.length) : importSizeError(textBytes(text));
  if (tooBig) return fail(tooBig);
  const records = parseCsv(text);
  if (records.some((r) => r.length > MAX_CSV_CELLS)) return fail(`That file has more than ${MAX_CSV_CELLS} columns in a row. Check it is a plain address list.`);
  const headerAt = records.findIndex((r) => r.some((c) => c.trim() !== ""));
  if (headerAt < 0) return fail("That file is empty.");
  const { index, mapped, ignored } = mapHeaders(records[headerAt]);
  const missing = missingColumns(index);
  if (missing.length) {
    return { ...fail(`We couldn't find a column for ${missing.join(", ")}. Name your columns like Name, Address, City, State, ZIP.`), columns: { mapped, ignored } };
  }
  const candidates: ImportCandidate[] = [];
  for (let i = headerAt + 1; i < records.length; i++) {
    const cells = records[i];
    if (!cells.some((c) => c.trim() !== "")) continue;
    if (candidates.length >= MAX_IMPORT_ROWS) {
      return { ...fail(`That file has more than ${MAX_IMPORT_ROWS.toLocaleString("en-US")} people. Split it into smaller files.`), columns: { mapped, ignored } };
    }
    candidates.push(rowToCandidate(cells, index, i + 1));
  }
  const preview = buildPreview("csv", candidates, opts.existing ?? [], opts);
  return { ...preview, columns: { mapped, ignored } };
}

/* ---------- export ---------- */

export const EXPORT_HEADERS = ["Household name", "Names", "Address line 1", "Address line 2", "City", "State", "ZIP", "Country", "Email"] as const;

/** Stops a spreadsheet treating a cell as a formula (CSV injection): =, +, -, @, tab and CR at the start. */
function safeCell(v: string | undefined): string {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n;\t]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of a list, in a shape `importCsv` reads back. CRLF line endings and a BOM so Excel opens it as UTF-8. */
export function exportCsv(recipients: Recipient[], opts: { bom?: boolean } = {}): string {
  const lines = [EXPORT_HEADERS.join(",")];
  for (const r of recipients) {
    const a = r.address;
    lines.push([r.householdName, r.names.join("; "), a.line1, a.line2, a.city, a.region, a.postalCode, a.country, r.email].map(safeCell).join(","));
  }
  return (opts.bom === false ? "" : "﻿") + lines.join("\r\n") + "\r\n";
}
