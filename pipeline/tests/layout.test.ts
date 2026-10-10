import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { bookSpreads } from "@greethub/shared";
import { layoutBook, BOOK_PX, BOOK_GEOM } from "../src/layout/book.js";
import { layoutCard, CARD_PX } from "../src/layout/card.js";
import { fitText, newDoc, wrapLines } from "../src/layout/common.js";
import { fakeArt } from "./mock.js";

const tmp = () => mkdtempSync(join(tmpdir(), "gh-layout-"));

describe("geometry", () => {
  it("book is 8.75in square with bleed = 2625px at 300 DPI", () => {
    expect(BOOK_GEOM.w).toBe(630);
    expect(BOOK_PX).toBe(2625);
    expect(CARD_PX).toEqual({ w: 1575, h: 2175 });
  });
  it("24 and 32 page books need 11 and 15 spreads", () => {
    expect(bookSpreads(24)).toBe(11);
    expect(bookSpreads(32)).toBe(15);
  });
});

describe("text fit", () => {
  it("shrinks long text to fit and reports when it cannot", async () => {
    const { fonts } = await newDoc("t");
    const long = "word ".repeat(60);
    const fit = fitText(long, fonts.body, 300, 250, 24, 12);
    expect(fit.size).toBeLessThan(24);
    expect(fit.height).toBeLessThanOrEqual(250);
    expect(fitText(long, fonts.body, 300, 50, 24, 12).fitted).toBe(false);
    expect(fitText("short", fonts.body, 300, 200, 24, 12).size).toBe(24);
  });
  it("wraps on width and handles curly quotes (embedded TTF)", async () => {
    const { fonts } = await newDoc("t");
    const lines = wrapLines("“Let’s go on an adventure in the woods!” they said together.", fonts.body, 24, 200);
    expect(lines.length).toBeGreaterThan(1);
  });
});

describe("print PDFs", () => {
  it("24-page book interior has trim/bleed boxes and fonts embedded", async () => {
    const art = await fakeArt(128, 128);
    const spreads = Array.from({ length: 11 }, (_, i) => ({ text: `Spread ${i + 1}. ` + "Once upon a time there was a long sentence. ".repeat(i === 3 ? 30 : 3), art }));
    const rep = await layoutBook({ title: "The Test Story", blurb: "A blurb.", spreads, coverArt: art }, tmp(), "t");
    expect(rep.pageCount).toBe(24);
    expect(rep.textSizes[3]).toBeLessThan(rep.textSizes[0]);
    expect(rep.unfitted).toEqual([]);
    const pdf = await PDFDocument.load(readFileSync(rep.files.interior));
    expect(pdf.getPageCount()).toBe(24);
    const p = pdf.getPage(0);
    expect(p.getSize()).toEqual({ width: 630, height: 630 });
    expect(p.getTrimBox()).toEqual({ x: 9, y: 9, width: 612, height: 612 });
    expect(p.getBleedBox()).toEqual({ x: 0, y: 0, width: 630, height: 630 });
    const preview = await PDFDocument.load(readFileSync(rep.files.preview));
    expect(preview.getPageCount()).toBe(26);
    expect(readFileSync(rep.files.interior).length).toBeGreaterThan(60_000); // subsetted TTFs are embedded, not referenced
  });

  it("card print PDF is 5.25x7.25in with front + inside, and a watermarked guest proof", async () => {
    const art = await fakeArt(96, 128);
    const rep = await layoutCard({ title: "Hi", message: "Happy birthday! ".repeat(8), frontArt: art, insideArt: art }, tmp(), "c");
    expect(rep.pages).toBe(2);
    const pdf = await PDFDocument.load(readFileSync(rep.files.print));
    expect(pdf.getPage(0).getSize()).toEqual({ width: 378, height: 522 });
    expect(pdf.getPage(0).getTrimBox()).toEqual({ x: 9, y: 9, width: 360, height: 504 });
    expect(rep.messageFitted).toBe(true);
    expect(readFileSync(rep.files.guestProof).length).toBeGreaterThan(1000);
  });
});
