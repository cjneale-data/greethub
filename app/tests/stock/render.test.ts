import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { listCards } from "@/lib/stock/catalog";
import { renderStockPdf, renderStockPreview, stockInsideCapacity } from "@/lib/stock/render";
import type { StockCreation } from "@/lib/stock/types";

import { vi } from "vitest";
vi.setConfig({ testTimeout: 90000 });

beforeEach(() => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-stock-render-"));
  process.env.GREETHUB_MOCK_AI = "1";
});

const card = () => listCards()[0];
const make = (over: Partial<StockCreation> = {}): StockCreation => ({
  id: "sc_test", userId: "u_member", stockId: card().id, message: card().defaultMessage, status: "draft", messageFitted: true,
  screening: { ok: true, at: "x" }, createdAt: "x", updatedAt: "x", ...over,
});
const fontNames = (doc: PDFDocument) => {
  const out: string[] = [];
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFDict && o.get(PDFName.of("Type")) === PDFName.of("FontDescriptor")) out.push(String(o.get(PDFName.of("FontName"))));
  }
  return out;
};
const box = (page: ReturnType<PDFDocument["getPage"]>, b: "TrimBox" | "BleedBox") => {
  const r = b === "TrimBox" ? page.getTrimBox() : page.getBleedBox();
  return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100);
};

describe("renderStockPdf", () => {
  it("makes a 2 page 5x7 print PDF with bleed and trim boxes and embedded fonts", async () => {
    const { pdf, overflow } = await renderStockPdf(make());
    expect(overflow).toBe(false);
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(2);
    for (const i of [0, 1]) {
      const p = doc.getPage(i);
      expect(p.getSize()).toEqual({ width: 378, height: 522 }); // 5.25 x 7.25 in
      expect(box(p, "BleedBox")).toEqual([0, 0, 378, 522]);
      expect(box(p, "TrimBox")).toEqual([9, 9, 360, 504]); // 5 x 7 in, 0.125 in bleed
    }
    expect(fontNames(doc).some((n) => /Andika/.test(n))).toBe(true);
  });

  it("reports overflow instead of clipping silently", async () => {
    const ok = await renderStockPdf(make({ message: "Happy birthday, with love." }));
    const big = await renderStockPdf(make({ message: "word ".repeat(400) }));
    expect(ok.overflow).toBe(false);
    expect(big.overflow).toBe(true);
    expect((await PDFDocument.load(big.pdf)).getPageCount()).toBe(2);
  });

  it("counts the sign-off toward the fit", async () => {
    const near = "a few kind words ".repeat(stockInsideCapacity({ handwriting: false }).maxChars / 17 - 2).trim();
    expect((await renderStockPdf(make({ message: near }))).overflow).toBe(false);
    expect((await renderStockPdf(make({ message: near, signOff: "Love, ".padEnd(40, "x") + "\n\n\n\n" }))).overflow).toBe(true);
  });

  it("uses a member's preset handwriting font and typed signature", async () => {
    const writing = { message: "handwritten" as const, styleId: "kalam" as const, signature: { kind: "typed" as const, text: "Sam", fontId: "allura" as const } };
    const { pdf, overflow } = await renderStockPdf(make({ writing }));
    expect(overflow).toBe(false);
    const names = fontNames(await PDFDocument.load(pdf)).join(" ");
    expect(names).toMatch(/Kalam/i);
    expect(names).toMatch(/Allura/i);
  });

  it("gives guests the typeset inside only", async () => {
    const writing = { message: "handwritten" as const, styleId: "kalam" as const, signature: { kind: "typed" as const, text: "Sam", fontId: "allura" as const } };
    const { pdf } = await renderStockPdf(make({ userId: "g_0123456789abcdef", writing }));
    const names = fontNames(await PDFDocument.load(pdf)).join(" ");
    expect(names).not.toMatch(/Kalam|Allura/i);
    expect(names).toMatch(/Andika/);
  });

  it("refuses an unknown card", async () => {
    await expect(renderStockPdf(make({ stockId: "nope" }))).rejects.toThrow("unknown_stock_card");
  });
});

describe("renderStockPreview", () => {
  it("is a PNG of front and inside side by side", async () => {
    const png = await renderStockPreview(make(), { watermark: false });
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(1350);
    expect(meta.height).toBe(930);
  });
  it("watermarks by default and not when asked", async () => {
    const a = await sharp(await renderStockPreview(make())).raw().toBuffer();
    const b = await sharp(await renderStockPreview(make(), { watermark: false })).raw().toBuffer();
    expect(Buffer.compare(a, b)).not.toBe(0);
  });
  it("draws handwriting and the signature when the member has them", async () => {
    const writing = { message: "handwritten" as const, styleId: "kalam" as const, signature: { kind: "typed" as const, text: "Sam", fontId: "allura" as const } };
    const typed = await renderStockPreview(make(), { watermark: false });
    const hand = await renderStockPreview(make({ writing }), { watermark: false });
    expect(Buffer.compare(Buffer.from(typed), Buffer.from(hand))).not.toBe(0);
  });
  it("draws the inside in ink (not blank paper)", async () => {
    const { data, info } = await sharp(await renderStockPreview(make(), { watermark: false })).raw().toBuffer({ resolveWithObject: true });
    let dark = 0;
    for (let y = 100; y < 700; y++) for (let x = 700; x < 1240; x++) if (data[(y * info.width + x) * info.channels] < 110) dark++;
    expect(dark).toBeGreaterThan(500);
  });
});

describe("stockInsideCapacity", () => {
  it("measures real numbers (pinned; the layout box is 3.85 x 5.55 in, 4.7 in with a signature)", () => {
    const t = stockInsideCapacity({ handwriting: false });
    const h = stockInsideCapacity({ handwriting: true });
    console.log("capacity typeset", t, "handwriting", h);
    expect(t.maxChars).toBeGreaterThan(h.maxChars);
    expect(t.maxChars).toBeGreaterThan(420); // the CTO's about-420 fits even at the floor size
    expect(h.maxChars).toBeGreaterThan(180);
  });
  it("agrees with layoutCard: capacity fits, one more paragraph of text does not", async () => {
    const cap = stockInsideCapacity({ handwriting: false });
    const sample = "Thank you for being such a good friend to us all this year. ".repeat(40);
    expect((await renderStockPdf(make({ message: sample.slice(0, cap.maxChars).trim() }))).overflow).toBe(false);
    expect((await renderStockPdf(make({ message: sample.slice(0, cap.maxChars + 200).trim() }))).overflow).toBe(true);
  });
});
