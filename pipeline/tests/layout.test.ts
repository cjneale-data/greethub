import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import sharp from "sharp";
import { bookSpreads, CARD_MESSAGE_BOX_PX } from "@greethub/shared";
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

describe("handwritten card inside", () => {
  const font = (f: string) => readFileSync(join(import.meta.dirname, "..", "..", "app", "public", "fonts", "handwriting", f));
  /** BaseFont names of every font dictionary in the PDF (object streams are compressed, so read them through pdf-lib). */
  const fontNames = async (path: string) => {
    const pdf = await PDFDocument.load(readFileSync(path));
    return pdf.context
      .enumerateIndirectObjects()
      .map(([, o]) => (o instanceof PDFDict && o.get(PDFName.of("Type")) === PDFName.of("Font") ? String(o.get(PDFName.of("BaseFont")) ?? "") : ""))
      .filter(Boolean);
  };

  it("sets the message in a preset handwriting face and a typed signature in a signature face, both embedded", async () => {
    const art = await fakeArt(96, 128);
    const rep = await layoutCard(
      { title: "Hi", message: "Happy birthday, Rosa!\nLove from all of us.", frontArt: art, writing: { messageFont: font("kalam.ttf"), sizeScale: 1.05, signatureText: { text: "Sam", font: font("allura.ttf") } } },
      tmp(),
      "hw",
    );
    expect(rep.messageFitted).toBe(true);
    const names = await fontNames(rep.files.print);
    expect(names.some((n) => /Kalam/.test(n))).toBe(true);
    expect(names.some((n) => /Allura/.test(n))).toBe(true);
  });

  it("places a rendered own-handwriting message and a signature image, and passes through the renderer's fit", async () => {
    const art = await fakeArt(96, 128);
    const ink = await sharp({ create: { width: 400, height: 120, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } } }).png().toBuffer();
    const boxes: { width: number; height: number }[] = [];
    const render = (fitted: boolean) => async (_t: string, box: { width: number; height: number }) => {
      boxes.push(box);
      return { png: await sharp({ create: { width: box.width, height: box.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: ink, top: 10, left: 10 }]).png().toBuffer(), fitted };
    };
    const ok = await layoutCard({ title: "Hi", message: "Hello", frontArt: art, writing: { renderMessage: render(true), signatureImage: ink } }, tmp(), "own");
    expect(ok.messageFitted).toBe(true);
    // 300 DPI box inside the safe area, shortened to leave room for the signature: exactly what the preview renders.
    expect(boxes[0]).toEqual({ width: CARD_MESSAGE_BOX_PX.width, height: CARD_MESSAGE_BOX_PX.heightWithSignature });
    expect(boxes[0].height).toBeLessThan(CARD_PX.h - 600);
    const pdf = await PDFDocument.load(readFileSync(ok.files.print));
    expect(pdf.getPageCount()).toBe(2);
    const over = await layoutCard({ title: "Hi", message: "Hello", frontArt: art, writing: { renderMessage: render(false) } }, tmp(), "own2");
    expect(over.messageFitted).toBe(false);
    await layoutCard({ title: "Hi", message: "Hello", frontArt: art, writing: { renderMessage: render(true) } }, tmp(), "own3");
    expect(boxes[2]).toEqual({ width: CARD_MESSAGE_BOX_PX.width, height: CARD_MESSAGE_BOX_PX.height });
  });
});
