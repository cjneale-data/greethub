import { describe, expect, it } from "vitest";
import {
  MAX_IMPORT_BYTES, MAX_LIST_SIZE, MAX_VCARD_BYTES, addRecipient, addressKey, blockText, commitImport, exportCsv, formatEnvelope, formatReturnAddress,
  importCsv, importSizeError, importVCard, newList, parseCsv, parseOneLineAddress, scrubSnapshot, snapshotRecipients, suggestHouseholdName, updateRecipient,
  usStateCode, validateRecipient, MAX_CSV_CELLS, MAX_VCARD_LINES, MAX_VCARD_CONTACTS, type Recipient, type RecipientList,
} from "../../lib/recipients";

const NOW = new Date("2026-10-15T12:00:00Z");
let n = 0;
const newId = () => `rc_${String(++n).padStart(16, "0")}`;
const clock = { now: NOW, newId };
const rivera = { householdName: "The Riveras", names: ["Ana Rivera", "Luis Rivera"], line1: "12 Elm Street", line2: "Apt 4", city: "Springfield", region: "illinois", postalCode: "62704" };
const list = (): RecipientList => newList("u1", "Holiday 2026", { now: NOW, newId: () => "rl_1" });

describe("normalize", () => {
  it("maps states and one-line addresses", () => {
    expect(usStateCode("N.Y.")).toBe("NY");
    expect(parseOneLineAddress("12 Elm St, Apt 4, Springfield, IL 62704")).toMatchObject({ line1: "12 Elm St", line2: "Apt 4", city: "Springfield", region: "IL", postalCode: "62704" });
  });
  it("reads West Virginia as WV, not Virginia", () => {
    expect(parseOneLineAddress("1 Main St, Charleston West Virginia 25301")).toMatchObject({ city: "Charleston", region: "WV" });
  });
  it("suggests household names", () => {
    expect(suggestHouseholdName(["Ana Rivera"])).toBe("Ana Rivera");
    expect(suggestHouseholdName(["Ana Rivera", "Luis Rivera"])).toBe("Ana and Luis Rivera");
    expect(suggestHouseholdName(["Ana Rivera", "Luis Rivera", "Mia Rivera"])).toBe("The Rivera Family");
    expect(suggestHouseholdName(["Ana Rivera", "Sam Lee"])).toBe("Ana Rivera and Sam Lee");
  });
  it("gives the same key for the same mailbox however it was typed", () => {
    const a = { line1: "12 Elm Street", line2: "Apt. 4", city: "Springfield", region: "IL", postalCode: "62704-1234", country: "US" };
    const b = { line1: "12 ELM ST", line2: "#4", city: "springfield", region: "Illinois", postalCode: "62704", country: "usa" };
    expect(addressKey(a)).toBe(addressKey(b));
  });
});

describe("validateRecipient", () => {
  it("cleans and builds a recipient with tags and no phone", () => {
    const v = validateRecipient({ ...rivera, tags: ["Family", "family", " Work "], phone: "555-0100" } as never, clock);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.recipient.address).toMatchObject({ region: "IL", country: "US", name: "The Riveras" });
    expect(v.recipient.tags).toEqual(["family", "work"]);
    expect(JSON.stringify(v.recipient)).not.toContain("555-0100");
    expect("phone" in v.recipient.address).toBe(false);
  });
  it("pads a ZIP that lost its leading zero and says so", () => {
    const v = validateRecipient({ ...rivera, region: "MA", postalCode: "2134" }, clock);
    expect(v.ok && v.recipient.address.postalCode).toBe("02134");
    expect(v.warnings.join(" ")).toMatch(/leading zero/);
  });
  it("allows PO boxes for mail but not for parcels", () => {
    const po = { ...rivera, line1: "PO Box 12", line2: "" };
    expect(validateRecipient(po, { ...clock, purpose: "mail" }).ok).toBe(true);
    const ship = validateRecipient(po, { ...clock, purpose: "ship" });
    expect(!ship.ok && ship.errors.line1).toMatch(/PO box/i);
  });
  it("reports fixable errors in plain words", () => {
    const v = validateRecipient({ names: [], line1: "", city: "", region: "ZZ", postalCode: "1", email: "nope" }, clock);
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.errors.householdName).toBeTruthy();
    expect(v.errors.email).toBe("Check the email address");
    expect(v.errors.region).toBeTruthy();
  });
  it("rejects countries we don't mail to", () => {
    expect(validateRecipient({ ...rivera, country: "France" }, clock).ok).toBe(false);
  });
});

describe("list", () => {
  it("adds, refuses duplicates, and allows them on request", () => {
    const a = addRecipient(list(), rivera, clock);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const dup = addRecipient(a.list, { ...rivera, householdName: "Rivera family", line1: "12 ELM ST", line2: "#4" }, clock);
    expect(!dup.ok && dup.duplicateOf).toBe(a.recipient.id);
    expect(addRecipient(a.list, rivera, { ...clock, allowDuplicate: true }).ok).toBe(true);
  });
  it("caps a list at 500", () => {
    const l = list();
    l.recipients = Array.from({ length: MAX_LIST_SIZE }, (_, i) => ({ id: `rc_${i}`, address: { line1: String(i) } }) as unknown as Recipient);
    const r = addRecipient(l, rivera, clock);
    expect(!r.ok && r.full).toBe(true);
  });
  it("keeps the postal check when the address is unchanged, clears it when it moves, refuses copies", () => {
    const a = addRecipient(list(), rivera, clock);
    if (!a.ok) throw new Error("setup");
    const checked = { ...a.recipient, validation: { status: "valid" as const, at: NOW.toISOString(), provider: "fake" } };
    let l: RecipientList = { ...a.list, recipients: [checked] };
    const same = updateRecipient(l, checked.id, { email: "ANA@example.com" }, clock);
    expect(same.ok && same.recipient.validation?.status).toBe("valid");
    expect(same.ok && same.recipient.email).toBe("ana@example.com");
    const moved = updateRecipient(l, checked.id, { line1: "99 Oak Ave" }, clock);
    expect(moved.ok && moved.recipient.validation).toBeUndefined();
    const other = addRecipient(l, { ...rivera, line1: "5 Pine Rd", line2: "" }, clock);
    if (!other.ok) throw new Error("setup");
    l = other.list;
    const copy = updateRecipient(l, other.recipient.id, { line1: "12 Elm Street", line2: "Apt 4" }, clock);
    expect(!copy.ok && copy.duplicateOf).toBe(checked.id);
  });
  it("re-suggests the household line when names change and it was our suggestion", () => {
    const a = addRecipient(list(), { ...rivera, householdName: undefined }, clock);
    if (!a.ok) throw new Error("setup");
    expect(a.recipient.householdName).toBe("Ana and Luis Rivera");
    const u = updateRecipient(a.list, a.recipient.id, { names: ["Ana Rivera"] }, clock);
    expect(u.ok && u.recipient.householdName).toBe("Ana Rivera");
  });
});

const CSV = [
  "Name,Address,City,State,ZIP,Email",
  '"Ana & Luis Rivera","12 Elm St, Apt 4",Springfield,IL,62704,ana@example.com',
  "Sam Lee,5 Pine Rd,Boston,MA,2134,",
  "Sam Lee,5 PINE ROAD,Boston,Massachusetts,02134,",
  ",,,,,",
  "No Street,,Boston,MA,02134,",
].join("\r\n");

describe("CSV import", () => {
  it("parses quotes, commas, newlines in cells and the BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, ""y""","line1\nline2"')).toEqual([["a", "b"], ['x, "y"', "line1\nline2"]]);
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("makes a preview with spreadsheet row numbers, errors and duplicates", () => {
    const p = importCsv(CSV, clock);
    expect(p.fatal).toBeUndefined();
    expect(p.rows.map((r) => [r.row, r.status])).toEqual([[2, "ok"], [3, "ok"], [4, "duplicate"], [6, "error"]]);
    expect(p.rows[0].recipient?.householdName).toBe("Ana & Luis Rivera");
    expect(p.rows[1].warnings.join(" ")).toMatch(/leading zero/);
    expect(p.rows[2].duplicateOf).toEqual({ row: 3 });
    expect(p.rows[3].errors.line1).toBeTruthy();
    expect(p.counts).toEqual({ total: 4, ok: 2, error: 1, duplicate: 1, skipped: 0 });
  });
  it("marks rows that match the list already", () => {
    const a = addRecipient(list(), { ...rivera, line1: "5 Pine Rd", line2: "", city: "Boston", region: "MA", postalCode: "02134" }, clock);
    if (!a.ok) throw new Error("setup");
    const p = importCsv(CSV, { ...clock, existing: a.list.recipients });
    const row3 = p.rows.find((r) => r.row === 3);
    expect(row3?.status).toBe("duplicate");
    expect(row3?.duplicateOf).toEqual({ recipientId: a.recipient.id });
  });
  it("splits a one-line address and says so", () => {
    const p = importCsv('Name,Full address\nAna Rivera,"12 Elm St, Springfield, IL 62704"', clock);
    expect(p.rows[0].status).toBe("ok");
    expect(p.rows[0].warnings.join(" ")).toMatch(/one line/);
  });
  it("fails clearly when columns are missing", () => {
    expect(importCsv("Foo,Bar\n1,2", clock).fatal).toMatch(/couldn't find a column/);
    expect(importCsv("", clock).fatal).toMatch(/empty/);
  });
  it("splits a Names column and suggests the envelope line", () => {
    const p = importCsv("Names,Address,City,State,ZIP\nAna Rivera; Luis Rivera,12 Elm St,Springfield,IL,62704", clock);
    expect(p.rows[0].recipient?.names).toEqual(["Ana Rivera", "Luis Rivera"]);
    expect(p.rows[0].recipient?.householdName).toBe("Ana and Luis Rivera");
  });
  it("never imports phone numbers", () => {
    const p = importCsv("Name,Address,City,State,ZIP,Phone\nAna Rivera,12 Elm St,Springfield,IL,62704,555-0100", clock);
    expect(p.rows[0].status).toBe("ok");
    expect(JSON.stringify(p)).not.toContain("555-0100");
    expect(p.columns?.ignored).toContain("Phone");
  });
  it("caps rows", () => {
    const rows = Array.from({ length: 1001 }, (_, i) => `P${i},${i} Elm St,Springfield,IL,62704`);
    expect(importCsv(["Name,Address,City,State,ZIP", ...rows].join("\n"), clock).fatal).toMatch(/more than 1,000/);
  });
});

describe("import size limit (checked before parsing)", () => {
  it("importSizeError works on a byte count alone, so callers can reject by file.size or Content-Length", () => {
    expect(importSizeError(MAX_IMPORT_BYTES)).toBeUndefined();
    expect(importSizeError(MAX_IMPORT_BYTES + 1)).toMatch(/too big/);
    expect(importSizeError(MAX_VCARD_BYTES, "vcard")).toBeUndefined();
    expect(importSizeError(MAX_VCARD_BYTES + 1, "vcard")).toMatch(/too big/);
    expect(importSizeError(Number.NaN)).toBeTruthy();
    expect(importSizeError(-1)).toBeTruthy();
  });
  it("importCsv rejects an oversized file without parsing it", () => {
    const p = importCsv("Name,Address,City,State,ZIP\n" + "x".repeat(MAX_IMPORT_BYTES), clock);
    expect(p.fatal).toMatch(/too big/);
    expect(p.rows).toEqual([]);
  });
  it("counts bytes, not characters: multi-byte text over the limit is refused", () => {
    const big = "é".repeat(MAX_IMPORT_BYTES / 2 + 10);
    expect(big.length).toBeLessThan(MAX_IMPORT_BYTES);
    expect(importCsv(big, clock).fatal).toMatch(/too big/);
  });
  it("rejects a CSV record with too many cells", () => {
    const wide = "Name,Address,City,State,ZIP\nAna," + ",".repeat(MAX_CSV_CELLS + 5);
    expect(importCsv(wide, clock).fatal).toMatch(/columns/);
  });
  it("rejects a vCard file with too many lines or contacts, address or not", () => {
    expect(importVCard("BEGIN:VCARD\n" + "X:1\n".repeat(MAX_VCARD_LINES) + "END:VCARD", clock).fatal).toMatch(/too big/);
    expect(importVCard("BEGIN:VCARD\nEND:VCARD\n".repeat(MAX_VCARD_CONTACTS + 1), clock).fatal).toMatch(/too big/);
  });
  it("importVCard rejects an oversized file", () => {
    expect(importVCard("x".repeat(MAX_VCARD_BYTES + 1), clock).fatal).toMatch(/too big/);
  });
});

describe("CSV export", () => {
  it("round-trips through import", () => {
    const a = addRecipient(list(), rivera, clock);
    if (!a.ok) throw new Error("setup");
    const back = importCsv(exportCsv(a.list.recipients), clock);
    expect(back.rows[0].status).toBe("ok");
    expect(back.rows[0].recipient).toMatchObject({ householdName: "The Riveras", names: ["Ana Rivera", "Luis Rivera"] });
    expect(back.rows[0].recipient?.address).toMatchObject({ line1: "12 Elm Street", line2: "Apt 4", city: "Springfield", region: "IL", postalCode: "62704" });
  });
  it("neutralizes spreadsheet formulas (= + - @ tab CR)", () => {
    const evil = ['=HYPERLINK("http://x")', "+1+1", "-2", "@SUM(A1)", "\tcmd", "\rcmd"];
    const recipients = evil.map(
      (e, i) =>
        ({ id: `rc_${i}`, householdName: e, names: [e], address: { name: e, line1: e, line2: e, city: e, region: "IL", postalCode: "62704", country: "US" }, tags: [], source: "manual", createdAt: "", updatedAt: "" }) as Recipient,
    );
    const out = exportCsv(recipients);
    const rows = parseCsv(out.replace(/^﻿/, "")).slice(1).filter((r) => r.some(Boolean));
    expect(rows).toHaveLength(evil.length);
    for (const row of rows) {
      for (const cell of [row[0], row[2], row[3], row[4]]) expect(cell).toMatch(/^'[=+\-@\t\r]/);
    }
    expect(out.startsWith("﻿")).toBe(true);
    expect(exportCsv(recipients, { bom: false }).startsWith("﻿")).toBe(false);
  });
  it("keeps the guard when a file we exported is imported and exported again", () => {
    const evil = [{ id: "rc_1", householdName: "=cmd|' /C calc'!A0", names: ["Ana"], address: { name: "x", line1: "12 Elm St", city: "Springfield", region: "IL", postalCode: "62704", country: "US" }, tags: [], source: "manual", createdAt: "", updatedAt: "" }] as Recipient[];
    const back = importCsv(exportCsv(evil), clock).rows[0].recipient!;
    expect(back.householdName.startsWith("=")).toBe(true);
    expect(parseCsv(exportCsv([back]).replace(/^﻿/, ""))[1][0]).toMatch(/^'=/);
  });
  it("does not export phone numbers", () => {
    const a = addRecipient(list(), rivera, clock);
    if (!a.ok) throw new Error("setup");
    expect(exportCsv(a.list.recipients).split("\r\n")[0]).not.toMatch(/phone/i);
  });
});

const VCF = [
  "BEGIN:VCARD", "VERSION:3.0", "FN:Ana Rivera", "N:Rivera;Ana;;;", "TEL;TYPE=CELL:555-0100", "EMAIL;TYPE=HOME:Ana@Example.com",
  "ADR;TYPE=WORK:;;1 Work Plaza;Chicago;IL;60601;USA", "ADR;TYPE=HOME:;;12 Elm Street\\, Unit 4;Springfield;IL;62704;USA",
  "NOTE:a note that is ignored", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "FN:No Address", "END:VCARD",
  "BEGIN:VCARD", "VERSION:2.1", "FN:Sam Lee", "ADR;HOME:;;5 Pine Rd;Boston;MA;02134;US", "END:VCARD",
].join("\r\n");

describe("vCard import", () => {
  it("prefers the home address, skips contacts without one, ignores phones", () => {
    const p = importVCard(VCF, clock);
    expect(p.rows.map((r) => r.status)).toEqual(["ok", "skipped", "ok"]);
    expect(p.rows[0].recipient?.address.line1).toBe("12 Elm Street, Unit 4");
    expect(p.rows[0].recipient?.email).toBe("ana@example.com");
    expect(p.rows[0].recipient?.source).toBe("vcard");
    expect(JSON.stringify(p)).not.toContain("555-0100");
    expect(p.rows[1].reason).toMatch(/No postal address/);
  });
  it("unfolds long lines and fails on non-vCard input", () => {
    const folded = "BEGIN:VCARD\r\nFN:Ana Ri\r\n vera\r\nADR:;;12 Elm St;Springfield;IL;62704;US\r\nEND:VCARD";
    expect(importVCard(folded, clock).rows[0].recipient?.householdName).toBe("Ana Rivera");
    expect(importVCard("hello", clock).fatal).toMatch(/couldn't find any contacts/);
  });
});

describe("commitImport", () => {
  it("adds good rows, skips duplicates, and re-checks the list as it is now", () => {
    const p = importCsv(CSV, clock);
    const r = commitImport(list(), p, clock);
    expect(r.added).toHaveLength(2);
    expect(r.skippedAsDuplicate).toBe(1);
    const again = commitImport(r.list, p, clock);
    expect(again.added).toHaveLength(0);
    expect(again.skippedAsDuplicate).toBe(3);
  });
  it("can keep a ticked duplicate", () => {
    const r = commitImport(list(), importCsv(CSV, clock), { ...clock, keepDuplicateRows: [4] });
    expect(r.added).toHaveLength(3);
  });
  it("does not trust a preview sent back from the browser", () => {
    const p = importCsv(CSV, clock);
    p.rows[0].recipient!.address.line1 = "";
    p.rows[1].recipient!.id = "../../etc";
    p.rows[1].recipient!.source = "manual";
    (p.rows[1].recipient as unknown as { isAdmin: boolean }).isAdmin = true;
    const r = commitImport(list(), p, clock);
    expect(r.invalid).toBe(1);
    expect(r.added).toHaveLength(1);
    expect(r.added[0].id).toMatch(/^rc_/);
    expect(r.added[0].source).toBe("csv");
    expect("isAdmin" in r.added[0]).toBe(false);
  });
  it("stops at the list cap", () => {
    const l = list();
    l.recipients = Array.from({ length: MAX_LIST_SIZE - 1 }, (_, i) => ({ id: `rc_${i}`, address: { line1: `${i} X St`, city: "A", region: "IL", postalCode: "11111", country: "US" } }) as unknown as Recipient);
    const r = commitImport(l, importCsv(CSV, clock), clock);
    expect(r.added).toHaveLength(1);
    expect(r.overLimit).toBe(1);
  });
});

describe("snapshotRecipients (freeze at checkout)", () => {
  const base = () => commitImport(list(), importCsv(CSV, clock), clock).list;
  it("copies id, household and address only, as a deep copy", () => {
    const l = base();
    const s = snapshotRecipients(l, [l.recipients[0].id, l.recipients[0].id, l.recipients[1].id], clock);
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.snapshot.listId).toBe("rl_1");
    expect(s.snapshot.recipients).toHaveLength(2);
    expect(Object.keys(s.snapshot.recipients[0]).sort()).toEqual(["address", "householdName", "id"]);
    expect(JSON.stringify(s.snapshot)).not.toContain("ana@example.com");
    l.recipients[0].address.line1 = "changed after checkout";
    expect(s.snapshot.recipients[0].address.line1).not.toBe("changed after checkout");
  });
  it("refuses missing, undeliverable, oversized and empty selections", () => {
    const l = base();
    expect(snapshotRecipients(l, []).ok).toBe(false);
    const gone = snapshotRecipients(l, ["rc_nope"]);
    expect(!gone.ok && gone.missing).toEqual(["rc_nope"]);
    expect(snapshotRecipients(l, l.recipients.map((r) => r.id), { maxRecipients: 1 }).ok).toBe(false);
    l.recipients[0].validation = { status: "undeliverable", at: NOW.toISOString(), provider: "fake" };
    const bad = snapshotRecipients(l, [l.recipients[0].id]);
    expect(!bad.ok && bad.undeliverable).toEqual([l.recipients[0].id]);
  });
  it("scrubs addresses after the reprint window", () => {
    const l = base();
    const s = snapshotRecipients(l, [l.recipients[0].id], clock);
    if (!s.ok) throw new Error("setup");
    const scrubbed = scrubSnapshot(s.snapshot);
    expect(JSON.stringify(scrubbed)).not.toMatch(/Elm|Springfield|62704|Rivera/);
    expect(scrubbed.recipients[0].id).toBe(l.recipients[0].id);
  });
});

describe("envelopes", () => {
  const r = { householdName: "The Riveras", address: { name: "x", line1: "12 Elm Street", line2: "Apartment 4", city: "Springfield", region: "IL", postalCode: "62704", country: "US" } };
  it("standard block", () => {
    expect(blockText(formatEnvelope(r))).toBe("The Riveras\n12 Elm Street\nApartment 4\nSpringfield, IL 62704");
  });
  it("USPS block: uppercase, abbreviated, unit on the street line", () => {
    expect(formatEnvelope(r, { style: "usps" }).lines).toEqual(["THE RIVERAS", "12 ELM ST APT 4", "SPRINGFIELD IL 62704"]);
  });
  it("prints the country only outside the US, and warns on long lines", () => {
    expect(formatEnvelope({ ...r, address: { ...r.address, country: "CA" } }).lines.at(-1)).toBe("Canada");
    expect(formatEnvelope({ ...r, householdName: "A".repeat(60) }).warnings[0]).toMatch(/Line 1/);
  });
  it("return address uses the sender's chosen name and no country", () => {
    const b = formatReturnAddress({ ...r.address, country: "US" }, { name: "The Nguyens" });
    expect(b.lines[0]).toBe("The Nguyens");
    expect(b.lines).not.toContain("United States");
  });
});
