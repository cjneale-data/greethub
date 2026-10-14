import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { TEMPLATE_GLYPHS } from "@greethub/shared";
import { filledSheet } from "./sheet-fixture";
import {
  GRID, MARKERS, extractSheet, findMarkers, homography, renderHandwriting, signatureFromPhoto, signatureFromStrokes, templateSvg,
  SheetError, SignatureError,
} from "@/lib/writing/glyphs";

describe("homography", () => {
  it("maps the four registration points exactly and interpolates between them", () => {
    const dst: [number, number][] = [[10, 20], [410, 30], [5, 600], [420, 610]];
    const H = homography(MARKERS, dst);
    const map = ([x, y]: [number, number]) => {
      const w = H[6] * x + H[7] * y + H[8];
      return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
    };
    MARKERS.forEach((m, i) => {
      const [u, v] = map(m);
      expect(u).toBeCloseTo(dst[i][0], 6);
      expect(v).toBeCloseTo(dst[i][1], 6);
    });
  });
});

describe("handwriting template sheet", () => {
  it("has one box per template character, four registration squares and an orientation mark", () => {
    const svg = templateSvg();
    expect(TEMPLATE_GLYPHS.length).toBeLessThanOrEqual(GRID.cols * GRID.rows);
    expect(svg.match(/fill="#000"/g)?.length).toBe(5);
    expect(svg).toContain("Print at 100%");
  });

  it("finds the squares on a plain render of the template", async () => {
    const { data, info } = await sharp(Buffer.from(templateSvg()), { density: 72 }).flatten({ background: "#fff" }).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
    const pts = findMarkers({ data: new Uint8Array(data), w: info.width, h: info.height });
    expect(pts).not.toBeNull();
    MARKERS.forEach(([x, y], i) => {
      expect(pts![i][0]).toBeCloseTo(x * 72, -1);
      expect(pts![i][1]).toBeCloseTo(y * 72, -1);
    });
  });

  it("reads every filled box from a rotated photo of the sheet", async () => {
    const out = await extractSheet(await filledSheet({ rotate: 4 }));
    expect(out.missing).toEqual([]);
    expect(Object.keys(out.glyphs)).toHaveLength(TEMPLATE_GLYPHS.length);
    // A descender sits lower than its cell baseline; a cap does not.
    expect(out.glyphs.g.h - out.glyphs.g.baseline).toBeGreaterThan(out.glyphs.A.h - out.glyphs.A.baseline + 5);
    const meta = await sharp(out.png).metadata();
    expect(meta.channels).toBe(4);
  }, 30_000);

  it("reads a sheet photographed sideways or upside down the right way up", async () => {
    const upright = await extractSheet(await filledSheet());
    for (const turn of [90, 180]) { // 270 takes the same path as 90
      const out = await extractSheet(await filledSheet({ rotate: turn }));
      expect(out.missing, `rotated ${turn}`).toEqual([]);
      // Same letter in the same box: a wide W stays wider than a narrow i, and g keeps its descender.
      expect(out.glyphs.W.w).toBeGreaterThan(out.glyphs.i.w * 1.7);
      expect(out.glyphs.g.h - out.glyphs.g.baseline).toBeGreaterThan(out.glyphs.A.h - out.glyphs.A.baseline + 5);
      expect(Math.abs(out.glyphs.M.w - upright.glyphs.M.w)).toBeLessThan(upright.glyphs.M.w * 0.15);
    }
  }, 60_000);

  it("lists blank optional boxes, and refuses a sheet missing a letter in both cases or a digit", async () => {
    const out = await extractSheet(await filledSheet({ skip: ["Q", "@", "#"] }));
    expect(out.missing.sort()).toEqual(["#", "@", "Q"]);
    await expect(extractSheet(await filledSheet({ skip: ["Q", "q", "7"] }))).rejects.toMatchObject({ code: "missing_required", message: expect.stringContaining("Q 7") });
  }, 30_000);

  it("rejects a photo without the registration squares", async () => {
    const blank = await sharp({ create: { width: 800, height: 1000, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    await expect(extractSheet(blank)).rejects.toBeInstanceOf(SheetError);
  });

  it("renders text that fits the box, with unsupported characters reported", async () => {
    const out = await extractSheet(await filledSheet());
    const style = { sheet: out.png, em: out.em, glyphs: out.glyphs };
    const r = await renderHandwriting(style, "Happy birthday, Rosa!\nLove, Sam ✿", { width: 1200, height: 600 });
    expect(r.fitted).toBe(true);
    expect(r.unsupported).toEqual(["✿"]);
    const { data } = await sharp(r.png).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
    expect(data.some((v) => v > 200)).toBe(true);
    const long = await renderHandwriting(style, "word ".repeat(400), { width: 400, height: 200 });
    expect(long.fitted).toBe(false);
  }, 30_000);
});

describe("signatures", () => {
  it("turns drawn strokes into a cropped ink image", async () => {
    const s = await signatureFromStrokes([[{ x: 10, y: 50 }, { x: 40, y: 20 }, { x: 70, y: 60 }, { x: 120, y: 30 }, { x: 200, y: 55 }], [{ x: 60, y: 70 }, { x: 180, y: 72 }, { x: 190, y: 74 }, { x: 195, y: 75 }]], { w: 400, h: 150 });
    expect(s.width).toBeGreaterThan(100);
    expect(s.height).toBeLessThan(450);
  });

  it("rejects empty or out-of-range strokes", async () => {
    await expect(signatureFromStrokes([], { w: 400, h: 150 })).rejects.toBeInstanceOf(SignatureError);
    await expect(signatureFromStrokes([Array.from({ length: 10 }, () => ({ x: 1e9, y: 1 }))], { w: 400, h: 150 })).rejects.toBeInstanceOf(SignatureError);
  });

  it("lifts a signature off a photo of paper and rejects a blank page", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="900" height="500" fill="#f2efe8"/><path d="M120 300 C 200 120, 260 420, 340 260 S 520 180, 760 290" stroke="#14143c" stroke-width="9" fill="none"/></svg>`;
    const photo = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    const s = await signatureFromPhoto(photo);
    expect(s.width).toBeGreaterThan(500);
    expect(s.width).toBeLessThan(900);
    const blank = await sharp({ create: { width: 900, height: 500, channels: 3, background: "#f2efe8" } }).jpeg().toBuffer();
    await expect(signatureFromPhoto(blank)).rejects.toBeInstanceOf(SignatureError);
  });
});
