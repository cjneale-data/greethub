import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  FOUR_GRID,
  FULL_BLEED,
  SAMPLE_TEMPLATES,
  TWO_UP,
  TemplateError,
  analyzePhoto,
  autoPlace,
  checkDesign,
  cropRect,
  effectiveDpi,
  fitTemplate,
  getSize,
  insideRect,
  pagePixels,
  paintRect,
  panCrop,
  parseTemplates,
  photoQuality,
  photoSlots,
  qualityLevel,
  renderPage,
  safeRect,
  swapPhotos,
  wrapText,
  type PhotoInfo,
  type PrintSizeId,
} from "@/lib/collage";

/** Synthetic photo: flat grey with one warm, saturated disc (stands in for a face). No real people. */
async function synth(w: number, h: number, disc?: { x: number; y: number; r: number }, color = "#7f7f7f") {
  const d = disc ? `<circle cx="${disc.x}" cy="${disc.y}" r="${disc.r}" fill="#e3a07c"/><circle cx="${disc.x}" cy="${disc.y}" r="${disc.r * 0.5}" fill="#c0392b"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/>${d}</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

const info = (id: string, width: number, height: number, focusX = 0.5, focusY = 0.5): PhotoInfo => ({ id, width, height, focusX, focusY, focusSource: "given" });
const s57 = getSize("flat_5x7");

describe("sizes", () => {
  it("adds 0.125 in bleed per side at 300 DPI", () => {
    expect(pagePixels(getSize("flat_5x7"))).toEqual({ width: 1575, height: 2175 });
    expect(pagePixels(getSize("flat_4x6"))).toEqual({ width: 1275, height: 1875 });
    expect(pagePixels(getSize("flat_3_5x5"))).toEqual({ width: 1125, height: 1575 });
    expect(pagePixels(getSize("flat_5x7", "landscape"))).toEqual({ width: 2175, height: 1575 });
  });
  it("safe area is 0.25 in inside the trim", () => {
    expect(safeRect(s57)).toEqual({ x: 0.25, y: 0.25, w: 4.5, h: 6.5 });
  });
});

describe("geometry", () => {
  it("pushes bleed slots out to the page edge only on trim edges", () => {
    expect(paintRect(FULL_BLEED.slots[0], s57)).toEqual({ x: -0.125, y: -0.125, w: 5.25, h: 7.25 });
    const tl = paintRect(FOUR_GRID.slots[0], s57);
    expect(tl.x).toBe(-0.125);
    expect(tl.y).toBe(-0.125);
    expect(tl.x + tl.w).toBeCloseTo(2.47);
    expect(tl.y + tl.h).toBeCloseTo(2.75);
    const text = FULL_BLEED.slots.find((s) => s.id === "headline")!;
    expect(paintRect(text, s57)).toEqual({ x: text.x, y: text.y, w: text.w, h: text.h });
  });
  it("sample templates keep all text inside the safe area at every size", () => {
    for (const id of ["flat_5x7", "flat_4x6", "flat_3_5x5"] as PrintSizeId[]) {
      const size = getSize(id);
      for (const t of SAMPLE_TEMPLATES) {
        const fitted = fitTemplate(t, size);
        for (const s of fitted.slots) if (s.kind === "text") expect(insideRect(s, safeRect(size)), `${t.id}/${s.id} on ${id}`).toBe(true);
      }
    }
  });
  it("scales slots and point sizes to a smaller card", () => {
    const t = fitTemplate(TWO_UP, getSize("flat_4x6"));
    expect(t.size).toBe("flat_4x6");
    const p1 = t.slots.find((s) => s.id === "photo1")!;
    expect(p1.w).toBeCloseTo(4);
    const head = t.slots.find((s) => s.id === "headline")!;
    expect(head.kind === "text" && head.sizePt).toBeCloseTo(24 * 0.8);
  });
});

describe("crop math", () => {
  it("zoom 1 is the largest crop with the slot aspect", () => {
    expect(cropRect(4000, 3000, 1, { focusX: 0.5, focusY: 0.5, zoom: 1 })).toEqual({ left: 500, top: 0, width: 3000, height: 3000 });
    expect(cropRect(3000, 4000, 2, { focusX: 0.5, focusY: 0.5, zoom: 1 })).toEqual({ left: 0, top: 1250, width: 3000, height: 1500 });
  });
  it("centres on the focus and clamps inside the photo", () => {
    expect(cropRect(4000, 3000, 1, { focusX: 0.9, focusY: 0.5, zoom: 1 })).toEqual({ left: 1000, top: 0, width: 3000, height: 3000 });
    expect(cropRect(4000, 3000, 1, { focusX: 0, focusY: 0, zoom: 1 }).left).toBe(0);
    const z = cropRect(4000, 3000, 1, { focusX: 0.25, focusY: 0.25, zoom: 2 });
    expect(z).toEqual({ left: 250, top: 0, width: 1500, height: 1500 });
  });
  it("clamps zoom to 1..4", () => {
    expect(cropRect(1000, 1000, 1, { focusX: 0.5, focusY: 0.5, zoom: 0.2 }).width).toBe(1000);
    expect(cropRect(1000, 1000, 1, { focusX: 0.5, focusY: 0.5, zoom: 99 }).width).toBe(250);
  });
  it("pans by a fraction of the slot and stops at the edge", () => {
    const start = { focusX: 0.5, focusY: 0.5, zoom: 2 };
    const moved = panCrop(1000, 1000, 1, start, 0.2, 0);
    // picture moves right by 20% of a 500 px crop, so the window moves left 100 px
    expect(cropRect(1000, 1000, 1, moved).left).toBe(150);
    const far = panCrop(1000, 1000, 1, start, 5, 5);
    expect(cropRect(1000, 1000, 1, far)).toMatchObject({ left: 0, top: 0 });
  });
});

describe("analyzePhoto", () => {
  it("finds the salient disc deterministically", async () => {
    const img = await synth(1200, 800, { x: 950, y: 220, r: 110 });
    const a = await analyzePhoto("p1", img);
    const b = await analyzePhoto("p1", img);
    expect(a).toEqual(b);
    expect(a.width).toBe(1200);
    expect(a.height).toBe(800);
    expect(a.focusSource).toBe("attention");
    expect(a.focusX).toBeGreaterThan(0.6);
    expect(a.focusY).toBeLessThan(0.45);
  });
  it("reports oriented size for EXIF-rotated photos", async () => {
    const img = await sharp(await synth(600, 400)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const a = await analyzePhoto("r", img);
    expect([a.width, a.height]).toEqual([400, 600]);
  });
});

describe("autoPlace", () => {
  const photos = [info("a", 4000, 3000, 0.3, 0.4), info("b", 3000, 4000), info("c", 2000, 2000), info("d", 1000, 1000), info("e", 800, 600)];
  it("fills slots by priority, then area, in photo order", () => {
    const placed = autoPlace(FOUR_GRID, s57, photos);
    expect(placed.map((p) => [p.slotId, p.photoId])).toEqual([["photo1", "a"], ["photo2", "b"], ["photo3", "c"], ["photo4", "d"]]);
    expect(placed[0].crop).toEqual({ focusX: 0.3, focusY: 0.4, zoom: 1 });
    expect(photoSlots(TWO_UP).map((s) => s.id)).toEqual(["photo1", "photo2"]);
  });
  it("leaves slots empty when photos run out", () => {
    expect(autoPlace(FOUR_GRID, s57, photos.slice(0, 2))).toHaveLength(2);
  });
  it("aspect strategy gives wide slots wide photos", () => {
    const wideFirst = autoPlace(TWO_UP, s57, [info("tall", 3000, 4000), info("wide", 4000, 2500)], { strategy: "aspect" });
    expect(wideFirst.find((p) => p.slotId === "photo1")!.photoId).toBe("wide");
  });
  it("applies overrides: pinned photo, empty slot, crop", () => {
    const placed = autoPlace(FOUR_GRID, s57, photos, { overrides: { photo1: { photoId: "c", zoom: 2 }, photo2: { photoId: null }, photo3: { focusX: 0.1 } } });
    expect(placed.find((p) => p.slotId === "photo1")).toEqual({ slotId: "photo1", photoId: "c", crop: { focusX: 0.5, focusY: 0.5, zoom: 2 } });
    expect(placed.find((p) => p.slotId === "photo2")).toBeUndefined();
    expect(placed.find((p) => p.slotId === "photo3")).toMatchObject({ photoId: "a", crop: { focusX: 0.1, focusY: 0.4 } });
    expect(placed.find((p) => p.slotId === "photo4")!.photoId).toBe("b");
  });
  it("swaps two slots", () => {
    const placed = autoPlace(TWO_UP, s57, photos.slice(0, 2));
    const swapped = swapPhotos(placed, "photo1", "photo2", photos);
    expect(swapped.find((p) => p.slotId === "photo1")!.photoId).toBe("b");
    expect(swapped.find((p) => p.slotId === "photo2")!.photoId).toBe("a");
  });
});

describe("quality", () => {
  it("computes effective DPI and levels", () => {
    expect(effectiveDpi({ width: 1500, height: 1500 }, { w: 5, h: 5 })).toBe(300);
    expect(qualityLevel(300)).toBe("ok");
    expect(qualityLevel(200)).toBe("ok");
    expect(qualityLevel(199)).toBe("low");
    expect(qualityLevel(150)).toBe("low");
    expect(qualityLevel(149)).toBe("too_low");
    expect(qualityLevel(100)).toBe("too_low");
    expect(qualityLevel(99)).toBe("blocked");
  });
  it("warns below 200 DPI on the painted (bled) slot", () => {
    // Full bleed 5x7 paints 5.25 x 7.25 in: 1575 x 2175 px needed for 300 DPI.
    const big = info("big", 3000, 4000);
    const mid = info("mid", 900, 1200); // about 165 DPI
    const soft = info("soft", 700, 960); // about 132 DPI
    const tiny = info("tiny", 480, 640); // about 88 DPI
    for (const [p, level] of [[big, "ok"], [mid, "low"], [soft, "too_low"], [tiny, "blocked"]] as const) {
      const design = { photos: autoPlace(FULL_BLEED, s57, [p]) };
      const [q] = photoQuality(FULL_BLEED, s57, design, [p]);
      expect(q.level).toBe(level);
      if (level !== "ok") expect(q.message).toBeTruthy();
    }
    const [q] = photoQuality(FULL_BLEED, s57, { photos: autoPlace(FULL_BLEED, s57, [big]) }, [big]);
    expect(q.dpi).toBe(552); // crop 2897 x 4000 px over 5.25 x 7.25 in
  });
  it("zooming in lowers DPI", () => {
    const p = info("p", 2000, 2000);
    const z1 = photoQuality(FOUR_GRID, s57, { photos: autoPlace(FOUR_GRID, s57, [p]) }, [p])[0].dpi;
    const z3 = photoQuality(FOUR_GRID, s57, { photos: autoPlace(FOUR_GRID, s57, [p], { overrides: { photo1: { zoom: 4 } } }) }, [p])[0].dpi;
    expect(z3).toBeLessThan(z1 / 3.9);
    expect(z3).toBeLessThan(200);
  });
  it("checkDesign lists low DPI, empty slots and text past the safe area", () => {
    const p = info("p", 400, 400);
    const bad = { ...TWO_UP, slots: [...TWO_UP.slots, { id: "edge", kind: "text" as const, x: 0.05, y: 0.1, w: 2, h: 0.5, font: "body", sizePt: 10, color: "#000000" }] };
    const issues = checkDesign(bad, s57, { photos: autoPlace(bad, s57, [p]) }, [p]);
    expect(issues.map((i) => `${i.kind}:${i.slotId}`).sort()).toEqual(["empty_photo_slot:photo2", "photo_quality:photo1", "text_outside_safe:edge"]);
  });
});

describe("parseTemplates", () => {
  it("round-trips the samples through JSON in all three wrappers", () => {
    const json = JSON.parse(JSON.stringify(SAMPLE_TEMPLATES));
    expect(parseTemplates(json)).toEqual(SAMPLE_TEMPLATES);
    expect(parseTemplates({ version: 1, templates: json })).toHaveLength(3);
    expect(parseTemplates(json[0])[0].id).toBe("full-bleed");
  });
  it("fills defaults and rejects bad input", () => {
    const t = parseTemplates({ id: "x", name: "X", size: "flat_4x6", slots: [{ id: "p", kind: "photo", x: 0, y: 0, w: 4, h: 6 }] })[0];
    expect(t.orientation).toBe("portrait");
    expect(t.background).toMatch(/^#/);
    expect(() => parseTemplates({ id: "x", name: "X", size: "flat_9x9", slots: [] })).toThrow(TemplateError);
    expect(() => parseTemplates({ id: "x", name: "X", size: "flat_5x7", slots: [{ id: "a", kind: "photo", x: 0, y: 0, w: 1, h: 1 }, { id: "a", kind: "photo", x: 1, y: 0, w: 1, h: 1 }] })).toThrow(/duplicate/);
    expect(() => parseTemplates({ id: "x", name: "X", size: "flat_5x7", slots: [{ id: "t", kind: "text", x: 0, y: 0, w: 1, h: 1, font: "body", sizePt: 10, color: "red" }] })).toThrow(/colour/);
  });
});

describe("wrapText", () => {
  it("wraps and truncates to maxLines", () => {
    expect(wrapText("one two three four", 100, 40)).toEqual(["one", "two", "three", "four"]);
    const t = wrapText("one two three four", 100, 40, 2);
    expect(t).toHaveLength(2);
    expect(t[1].endsWith("…")).toBe(true);
  });
});

describe("renderPage", () => {
  it("renders full-bleed pages at 300 DPI for every size and template", async () => {
    const photos = { a: await synth(1600, 2200, { x: 800, y: 600, r: 200 }, "#3060a0"), b: await synth(1600, 1200), c: await synth(900, 900), d: await synth(900, 900) };
    const infos = await Promise.all(Object.entries(photos).map(([id, b]) => analyzePhoto(id, b)));
    for (const id of ["flat_5x7", "flat_4x6", "flat_3_5x5"] as PrintSizeId[]) {
      const size = getSize(id);
      for (const t of SAMPLE_TEMPLATES) {
        const fitted = fitTemplate(t, size);
        const design = { photos: autoPlace(fitted, size, infos), text: { headline: "Happy holidays" } };
        const out = await renderPage({ template: t, size, design, photos }, { text: "boxes" });
        const meta = await sharp(out.png).metadata();
        expect([meta.width, meta.height], `${t.id} on ${id}`).toEqual([pagePixels(size).width, pagePixels(size).height]);
        expect(meta.format).toBe("png");
        expect(meta.density).toBe(300);
      }
    }
  }, 60_000);

  it("puts the photo in the bleed and the background elsewhere", async () => {
    const red = await sharp({ create: { width: 2000, height: 2800, channels: 3, background: "#ff0000" } }).jpeg().toBuffer();
    const size = getSize("flat_5x7");
    const design = { photos: autoPlace(FOUR_GRID, size, [info("r", 2000, 2800)]), text: {} };
    const out = await renderPage({ template: FOUR_GRID, size, design, photos: { r: red } }, { text: "none" });
    const { data, info: i } = await sharp(out.png).raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => [...data.subarray((y * i.width + x) * i.channels, (y * i.width + x) * i.channels + 3)];
    const [r0, g0, b0] = px(2, 2); // in the bleed, top-left slot
    expect(r0).toBeGreaterThan(200);
    expect(g0).toBeLessThan(60);
    expect(b0).toBeLessThan(60);
    // top-right slot is empty: neutral placeholder tile, not red
    expect(px(i.width - 5, 5)[0]).toBeLessThan(240);
    expect(px(i.width - 5, 5)[1]).toBeGreaterThan(200);
    // gutter between columns (x = 2.5 in + bleed) shows the cream background
    const gx = Math.round((2.5 + 0.125) * 300);
    expect(px(gx, 300)).toEqual([0xfb, 0xf6, 0xef]);
  });

  it("renders SVG text and preview guides without failing, and a low-DPI preview", async () => {
    const size = getSize("flat_4x6");
    const out = await renderPage(
      { template: FULL_BLEED, size, design: { photos: [], text: { headline: "Save the date", names: "Sam & Alex <3" } }, photos: {} },
      { text: "svg", guides: true, dpi: 100 },
    );
    expect([out.width, out.height]).toEqual([425, 625]);
  });
});
