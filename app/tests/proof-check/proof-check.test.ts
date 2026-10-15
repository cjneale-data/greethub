import { describe, expect, it } from "vitest";
import { checkProof, expectedYear, findDates, type ProofInput } from "@/lib/proof-check";
import { checkNames } from "@/lib/proof-check/names";
import type { PhotoInfo, Template, TextSlot } from "@/lib/collage";
import { getSize } from "@/lib/collage";

const NOW = new Date(Date.UTC(2026, 9, 15));
const size = getSize("flat_5x7");
const txt = (id: string, o: Partial<TextSlot> = {}): TextSlot => ({ id, kind: "text", x: 0.5, y: 0.5, w: 4, h: 0.6, font: "f", sizePt: 20, minPt: 10, color: "#000", ...o });
const tpl = (slots: Template["slots"], side: "front" | "back" = "front"): Template => ({ id: "t", name: "t", size: "flat_5x7", orientation: "portrait", background: "#fff", slots, side });
const front = tpl([
  { id: "p1", kind: "photo", x: 0, y: 0, w: 5, h: 4, bleed: true },
  txt("headline", { role: "headline", bind: "greeting", y: 4.2 }),
  txt("names", { role: "names", bind: "names_year", y: 5 }),
]);
const photoOk: PhotoInfo = { id: "a", width: 2400, height: 2400, focusX: 0.5, focusY: 0.5, focusSource: "given" };
const base = (text: Record<string, string>, over: Partial<ProofInput> = {}): ProofInput => ({
  kind: "holiday", now: NOW, size, photos: [photoOk],
  sides: [{ side: "front", template: front, design: { photos: [{ slotId: "p1", photoId: "a", crop: { focusX: 0.5, focusY: 0.5, zoom: 1 } }], text } }],
  ...over,
});
const good = { greeting: "Merry Christmas", names_year: "The Riveras 2026" };
const rules = (r: ReturnType<typeof checkProof>) => r.findings.map((f) => f.rule);

describe("proof checker: year", () => {
  it("is clean for the current holiday year", () => expect(checkProof(base(good)).findings).toEqual([]));
  it("warns on last year, a missing year, and a stray year", () => {
    expect(checkProof(base({ ...good, names_year: "The Riveras 2025" })).warnings.map((w) => w.rule)).toEqual(["year"]);
    expect(rules(checkProof(base({ ...good, names_year: "The Riveras" })))).toEqual(["year"]);
    expect(checkProof(base({ ...good, names_year: "The Riveras 2026 (since 2019)" })).warnings).toHaveLength(1);
  });
  it("New Year cards want the coming year from July; generic cards have no year rule", () => {
    expect(expectedYear("new_year", NOW)).toBe(2027);
    expect(expectedYear("new_year", new Date(Date.UTC(2027, 0, 2)))).toBe(2027);
    expect(rules(checkProof(base({ ...good, names_year: "The Riveras 2026" }, { kind: "new_year" })))).toEqual(["year"]);
    expect(checkProof(base({ ...good, names_year: "The Riveras" }, { kind: "generic" })).findings).toEqual([]);
  });
});

describe("proof checker: names", () => {
  const back = tpl([txt("message", { bind: "message" }), txt("names", { role: "names", bind: "names_year" })], "back");
  it("warns on Riveras vs Rivera's across sides, and a dismissal sticks", () => {
    const input = base(good);
    input.sides.push({ side: "back", template: back, design: { photos: [], text: { message: "From the Rivera’s home", names_year: "The Riveras 2026" } } });
    const r = checkProof(input);
    const n = r.warnings.filter((w) => w.rule === "names");
    expect(n).toHaveLength(1);
    const again = checkProof({ ...input, dismissed: [n[0].id] });
    expect(again.open.filter((f) => f.rule === "names")).toEqual([]);
    expect(again.findings.filter((f) => f.rule === "names")[0].id).toBe(n[0].id);
  });
  it("does not warn on plain holiday words, one family name used the same way, or Rivera vs Riveras", () => {
    expect(checkNames(["Merry Christmas from the Riveras", "Happy Holidays, Love Riveras", "Warmest wishes, the Rivera family"])).toEqual([]);
  });
  it("warns on near spellings in different slots, not in one slot", () => {
    expect(checkNames(["The Rivera family", "Love, Rivara"])).toHaveLength(1);
    expect(checkNames(["Anna and Hanna"])).toEqual([]);
  });
  it("compares against the entered family name", () => {
    expect(checkNames(["The Rivara family"], "Rivera")[0].reason).toBe("differs_from_family_name");
    expect(checkNames(["The Rivera family"], "Rivera")).toEqual([]);
  });
});

describe("proof checker: dates", () => {
  it("reads common formats", () => {
    const d = (s: string) => findDates(s)[0];
    expect(d("Saturday, June 12, 2027")).toMatchObject({ month: 5, day: 12, year: 2027, weekday: 6 });
    expect(d("Sat 6/12/27")).toMatchObject({ month: 5, day: 12, year: 2027, weekday: 6 });
    expect(d("6.12.27")).toMatchObject({ month: 5, day: 12, year: 2027 });
    expect(d("12 June 2027")).toMatchObject({ month: 5, day: 12, year: 2027 });
    expect(d("June 12th")).toMatchObject({ month: 5, day: 12, year: undefined });
    expect(d("Saturday\nJune 12, 2027")).toMatchObject({ weekday: 6 });
    expect(findDates("Call 555-123-4567 in May 2027")).toEqual([]);
  });
  const wd = (s: string, k: ProofInput["kind"] = "generic") =>
    checkProof(base({ greeting: "Party", names_year: s }, { kind: k })).findings.filter((f) => f.rule === "weekday" || f.rule === "past_date" || f.rule === "date_not_real");
  it("flags a wrong weekday (a Monday called Saturday) and passes right ones", () => {
    expect(wd("Saturday, June 14, 2027").map((f) => f.rule)).toEqual(["weekday"]);
    expect(wd("Sat 6/12/27")).toEqual([]);
    expect(wd("Friday, December 24, 2026").map((f) => f.rule)).toEqual(["weekday"]);
  });
  it("sweeps every day of 2026 to 2028 for the weekday rule", () => {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2029, 0, 1); t += 86400000) {
      const dt = new Date(t), y = dt.getUTCFullYear();
      const date = `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${y}`;
      const right = names[dt.getUTCDay()], wrong = names[(dt.getUTCDay() + 3) % 7];
      const ok = findDates(`${right}, ${date}`)[0], bad = findDates(`${wrong}, ${date}`)[0];
      const actual = (x: typeof ok) => new Date(Date.UTC(x.year!, x.month, x.day)).getUTCDay();
      expect(actual(ok) === ok.weekday, date).toBe(true);
      expect(actual(bad) === bad.weekday, date).toBe(false);
    }
    expect(wd("Tuesday, February 29, 2028").filter((f) => f.rule === "weekday")).toEqual([]);
    expect(wd("Wednesday, February 29, 2028").map((f) => f.rule)).toEqual(["weekday"]);
  });
  it("flags past dates (with a year) and blocks dates that do not exist", () => {
    expect(wd("Sunday, June 14, 2025").map((f) => f.rule).sort()).toEqual(["past_date", "weekday"]);
    expect(wd("June 12, 2025").map((f) => f.rule)).toEqual(["past_date"]);
    expect(wd("June 12")).toEqual([]);
    const r = checkProof(base({ greeting: "Party", names_year: "February 30, 2027" }, { kind: "generic" }));
    expect(r.blockers.map((f) => f.rule)).toEqual(["date_not_real"]);
    expect(r.blockers[0].dismissible).toBe(false);
  });
});

describe("proof checker: required fields, overflow, photos, approval", () => {
  it("blocks empty required text and empty required photos", () => {
    const t = tpl([{ id: "p1", kind: "photo", x: 0, y: 0, w: 5, h: 4 }, txt("names", { role: "names", bind: "names_year" })]);
    const r = checkProof({ ...base({}), sides: [{ side: "front", template: t, design: { photos: [], text: {} } }], kind: "generic" });
    expect(r.blockers.map((f) => f.rule).sort()).toEqual(["required_photo", "required_text"]);
  });
  it("warns when a name slot still holds the sample words", () => {
    const t = tpl([txt("names", { role: "names", bind: "names_year", placeholder: "The Smiths" })]);
    const r = checkProof({ ...base({}), kind: "generic", sides: [{ side: "front", template: t, design: { photos: [], text: {} } }] });
    expect(r.findings.map((f) => [f.rule, f.severity])).toEqual([["required_text", "warning"]]);
  });
  it("blocks overflow, from real fit data or an estimate", () => {
    const long = { ...good, greeting: "word ".repeat(80) };
    expect(checkProof(base(long)).blockers.map((f) => f.rule)).toEqual(["text_overflow"]);
    const fit = checkProof(base(good, { textFit: [{ side: "front", slotId: "headline", sizePt: 10, overflow: true, lines: 9 }] }));
    expect(fit.blockers.map((f) => f.slotId)).toEqual(["headline"]);
  });
  it("DPI: under 100 cannot be dismissed, 100-149 needs Print it anyway, 150-199 is a warning", () => {
    const at = (px: number, over: Partial<ProofInput> = {}) => checkProof(base(good, { photos: [{ ...photoOk, width: px, height: px }], ...over }));
    expect(at(400).blockers[0]).toMatchObject({ rule: "photo_dpi", dismissible: false });
    expect(at(400, { acknowledged: ["p1"] }).open.some((f) => f.rule === "photo_dpi")).toBe(true);
    const red = at(600);
    expect(red.blockers[0].acknowledgeKey).toBe("p1");
    expect(red.open).toHaveLength(1);
    expect(at(600, { acknowledged: ["p1"] }).open).toEqual([]);
    expect(at(900).warnings[0].rule).toBe("photo_dpi");
    expect(at(1500).findings).toEqual([]);
  });
  it("needs both ticks and no open blockers; warnings do not stop approval; read-back lists words", () => {
    const warn = { ...good, names_year: "The Riveras 2025" };
    const none = checkProof(base(warn));
    expect(none.canApprove).toBe(false);
    expect(none.reasons).toContain('Tick "I checked names and dates"');
    const ok = checkProof(base(warn, { confirmed: { namesDatesChecked: true, approvalText: true } }));
    expect(ok.canApprove).toBe(true);
    expect(checkProof(base(warn, { confirmed: { namesDatesChecked: true } })).canApprove).toBe(false);
    const blocked = checkProof(base({ ...good, greeting: "word ".repeat(80) }, { confirmed: { namesDatesChecked: true, approvalText: true } }));
    expect(blocked.canApprove).toBe(false);
    expect(ok.readBack.map((r) => r.text)).toEqual(["Merry Christmas", "The Riveras 2025"]);
  });
});
