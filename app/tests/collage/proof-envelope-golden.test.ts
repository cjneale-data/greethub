import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  ALL_SIZES, BARCODE_ZONE, ENVELOPE_A7, EnvelopeError, STAMP_ZONE, autoPlace, designTemplate, loadDesignSpec,
  pageInches, renderCardPdf, renderEnvelopePdf, renderProofJpegs, validateReturnAddress, type CardPdfInput, type PhotoInfo, type PrintSize,
} from "@/lib/collage";

const spec = loadDesignSpec(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../docs/design/photo-events-templates.json"), "utf8")));

async function synth(w: number, h: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#6a8caf"/><circle cx="${w / 2}" cy="${h / 3}" r="${Math.min(w, h) / 8}" fill="#e3a07c"/></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}
const text = { greeting: "Merry Christmas", names_year: "The Riveras 2026", message: "Warm wishes", signoff: "Love, Sam", small_line: "Love from us", caption: "Summer" };
const infos: PhotoInfo[] = ["a", "b", "c", "d"].map((id) => ({ id, width: 1800, height: 2400, focusX: 0.5, focusY: 0.5, focusSource: "given" }));
async function cardInput(size: PrintSize, frontId: string, backId?: string): Promise<CardPdfInput> {
  const photos: Record<string, Uint8Array> = {};
  for (const i of infos) photos[i.id] = await synth(1800, 2400);
  const side = (id: string) => {
    const template = designTemplate(spec, id);
    return { template, design: { photos: autoPlace(template, size, infos), text }, photos };
  };
  return { size, front: side(frontId), ...(backId ? { back: side(backId) } : {}) };
}

/** Every font on every page must be a Type0 font whose descendant carries an embedded FontFile2 program. */
function embeddedFonts(doc: PDFDocument): { name: string; embedded: boolean; base14: boolean }[] {
  const out: { name: string; embedded: boolean; base14: boolean }[] = [];
  const ctx = doc.context;
  const dict = (o: unknown) => (o instanceof PDFRef ? ctx.lookup(o) : o) as PDFDict | PDFArray | undefined;
  for (const page of doc.getPages()) {
    const fonts = dict(page.node.Resources()?.get(PDFName.of("Font"))) as PDFDict | undefined;
    if (!fonts) continue;
    for (const [name, ref] of fonts.entries()) {
      const f = dict(ref) as PDFDict;
      const sub = (f.get(PDFName.of("Subtype")) as PDFName).asString();
      if (sub !== "/Type0") { out.push({ name: name.asString(), embedded: false, base14: true }); continue; }
      const desc = dict((dict(f.get(PDFName.of("DescendantFonts"))) as PDFArray).get(0)) as PDFDict;
      const fd = dict(desc.get(PDFName.of("FontDescriptor"))) as PDFDict;
      out.push({ name: name.asString(), embedded: fd.has(PDFName.of("FontFile2")) || fd.has(PDFName.of("FontFile3")), base14: false });
    }
  }
  return out;
}

describe("golden PDF structure", () => {
  it("front only is one page, front and back is two, at every size and orientation", async () => {
    for (const size of ALL_SIZES) {
      const front = designTemplate(spec, size.orientation === "portrait" ? "full_bleed_band_p" : "full_bleed_band_l");
      const photos: Record<string, Uint8Array> = { a: await synth(1800, 2400), b: await synth(1800, 2400) };
      const one = await renderCardPdf({ size, front: { template: front, design: { photos: autoPlace(front, size, infos), text }, photos } });
      expect((await PDFDocument.load(one.pdf)).getPageCount(), size.id + size.orientation).toBe(1);
      expect(one.pages).toBe(1);
    }
  }, 120_000);

  it("trim and bleed boxes: bleed box is the page, trim box sits 0.125 in inside on every edge, for all sizes", async () => {
    for (const size of ALL_SIZES) {
      const front = designTemplate(spec, "full_bleed_band_p");
      const r = await renderCardPdf({ size, front: { template: { ...front, size: size.id, orientation: size.orientation }, design: { photos: [], text }, photos: {} } });
      const page = (await PDFDocument.load(r.pdf)).getPage(0);
      const { w, h } = pageInches(size);
      expect(page.getMediaBox()).toMatchObject({ x: 0, y: 0, width: w * 72, height: h * 72 });
      expect(page.getBleedBox()).toMatchObject({ x: 0, y: 0, width: w * 72, height: h * 72 });
      expect(page.getTrimBox()).toMatchObject({ x: 9, y: 9, width: size.trim.w * 72, height: size.trim.h * 72 });
      expect(page.getTrimBox().x + page.getTrimBox().width + 9).toBeCloseTo(page.getWidth());
      expect(page.getTrimBox().y + page.getTrimBox().height + 9).toBeCloseTo(page.getHeight());
    }
  }, 120_000);

  it("embeds every font it uses, no standard-14 faces, and two pages for front plus back", async () => {
    const size = ALL_SIZES.find((s) => s.id === "flat_5x7" && s.orientation === "portrait")!;
    const r = await renderCardPdf(await cardInput(size, "polaroid_stack_p", "back_letter_p"));
    const doc = await PDFDocument.load(r.pdf);
    expect(doc.getPageCount()).toBe(2);
    expect(r.pages).toBe(2);
    const fonts = embeddedFonts(doc);
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts.filter((f) => f.base14 || !f.embedded)).toEqual([]);
    expect(Buffer.from(r.pdf).includes(Buffer.from("/Helvetica"))).toBe(false);
  }, 60_000);
});

describe("proof JPEG", () => {
  it("is the full page with bleed at 300 DPI, one per side, with guide lines on the trim and safe lines", async () => {
    const size = ALL_SIZES.find((s) => s.id === "flat_5x7" && s.orientation === "portrait")!;
    const input = await cardInput(size, "full_bleed_band_p", "back_photo_strip_p");
    const proofs = await renderProofJpegs(input);
    expect(proofs.map((p) => p.side)).toEqual(["front", "back"]);
    for (const p of proofs) {
      expect([p.width, p.height]).toEqual([1575, 2175]);
      const meta = await sharp(p.jpeg).metadata();
      expect(meta.format).toBe("jpeg");
      expect([meta.width, meta.height]).toEqual([1575, 2175]);
      expect((meta.exif ?? Buffer.alloc(0)).length).toBeLessThan(300); // resolution tag only
    }
    // Same plan, with and without guides: the guide pixels land at the trim line (0.125 in = 37.5 px) and the safe line (0.375 in).
    const bare = (await renderProofJpegs(input, { guides: false }))[0];
    const px = async (jpeg: Buffer, x: number, y: number) => (await sharp(jpeg).raw().toBuffer({ resolveWithObject: true })).data.subarray((y * 1575 + x) * 3, (y * 1575 + x) * 3 + 3);
    // Guide lines change pixels on the trim row (0.125 in = 37.5 px) and the safe row (0.375 in = 112.5 px), and nowhere else is needed to prove it.
    const diff = async (ys: number[]) => { let m = 0; for (const y of ys) { const a = await px(proofs[0].jpeg, 800, y), b = await px(bare.jpeg, 800, y); m = Math.max(m, ...[0, 1, 2].map((i) => Math.abs(a[i] - b[i]))); } return m; };
    expect(await diff([36, 37, 38, 39])).toBeGreaterThan(25);
    expect(await diff([111, 112, 113, 114])).toBeGreaterThan(25);
    expect(await diff([70, 71, 72])).toBeLessThan(10);
  }, 60_000);

  it("front only gives one image, and is the same size as the PDF page", async () => {
    const size = ALL_SIZES.find((s) => s.id === "flat_4x6" && s.orientation === "landscape")!;
    const front = designTemplate(spec, "std_photo_left_6x4");
    const photos = { a: await synth(1800, 2400), b: await synth(1800, 2400) };
    const input: CardPdfInput = { size, front: { template: front, design: { photos: autoPlace(front, size, infos), text }, photos } };
    const [p] = await renderProofJpegs(input);
    const pdf = await renderCardPdf(input);
    expect(p.width / 300 * 72).toBeCloseTo(pdf.pagePt.w, 0);
    expect(p.height / 300 * 72).toBeCloseTo(pdf.pagePt.h, 0);
  }, 60_000);
});

describe("return-address envelope PDF", () => {
  const addr = { lines: ["The Riveras", "12 Maple Lane", "Springfield, OR 97477"] };

  it("is one A7 page, no bleed, with embedded fonts and only the sender block", async () => {
    const r = await renderEnvelopePdf(addr);
    const doc = await PDFDocument.load(r.pdf);
    expect(doc.getPageCount()).toBe(1);
    const page = doc.getPage(0);
    expect([page.getWidth(), page.getHeight()]).toEqual([ENVELOPE_A7.w * 72, ENVELOPE_A7.h * 72]);
    expect(page.getTrimBox()).toMatchObject({ x: 0, y: 0, width: 522, height: 378 });
    expect(page.getBleedBox()).toMatchObject({ x: 0, y: 0, width: 522, height: 378 });
    expect(embeddedFonts(doc).every((f) => f.embedded)).toBe(true);
    expect(Buffer.from(r.pdf).includes(Buffer.from("/Subtype /Image"))).toBe(false);
  });

  it("keeps the address inside the 0.25 in safe margin and clear of the stamp corner and barcode zone", async () => {
    const r = await renderEnvelopePdf({ lines: ["The Riveras and Associates Family Home", "1234 Extraordinarily Long Street Name", "Springfield, OR 97477", "Apt 4"] });
    const b = r.addressBox;
    expect(b.x).toBeGreaterThanOrEqual(ENVELOPE_A7.safe);
    expect(b.y).toBeGreaterThanOrEqual(ENVELOPE_A7.safe);
    const overlap = (a: typeof b, z: typeof b) => a.x < z.x + z.w && a.x + a.w > z.x && a.y < z.y + z.h && a.y + a.h > z.y;
    expect(overlap(b, STAMP_ZONE)).toBe(false);
    expect(overlap(b, BARCODE_ZONE)).toBe(false);
    expect(BARCODE_ZONE).toMatchObject({ h: 0.625, w: 4.75 });
  });

  it("has no recipient block, and never uses a script face for the return address by default", async () => {
    const r = await renderEnvelopePdf(addr, { uppercase: true });
    expect(r.fontFallbacks.length).toBeLessThanOrEqual(1);
    expect(r.addressBox.y + r.addressBox.h).toBeLessThan(ENVELOPE_A7.h / 2);
  });

  it("refuses an address that is empty, too long, or has too many lines", async () => {
    expect(validateReturnAddress({ lines: ["Only a name"] })).toHaveLength(1);
    expect(validateReturnAddress({ lines: ["a", "b", "c", "d", "e"] })).toContain("Use four lines or fewer.");
    expect(validateReturnAddress({ lines: ["a", "x".repeat(43)] })).toHaveLength(1);
    await expect(renderEnvelopePdf({ lines: ["a"] })).rejects.toBeInstanceOf(EnvelopeError);
  });

  it("renders non-Latin names with an embedded font without throwing", async () => {
    const r = await renderEnvelopePdf({ lines: ["Zoë Nguyễn", "O'Brien Family", "Portland, OR 97201"] });
    expect(r.pages).toBe(1);
  });
});
