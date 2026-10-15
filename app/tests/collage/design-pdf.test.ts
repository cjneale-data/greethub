import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  ALL_SIZES,
  MAX_INPUT_PIXELS,
  analyzePhoto,
  approvalState,
  autoCrop,
  autoPlace,
  checkDesign,
  cropRect,
  designTemplate,
  designTemplates,
  facesInFrame,
  fitText,
  getSize,
  loadDesignSpec,
  pageInches,
  photoQuality,
  renderCardPdf,
  renderPage,
  sizeFromDesignId,
  wrapMeasured,
  type PhotoInfo,
  type TextSlot,
} from "@/lib/collage";

const spec = loadDesignSpec(JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../docs/design/photo-events-templates.json"), "utf8")));

/** Synthetic photo: flat colour with a warm disc standing in for a face. No real people. */
async function synth(w: number, h: number, exif?: Record<string, string>) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#6a8caf"/><circle cx="${w / 2}" cy="${h / 3}" r="${Math.min(w, h) / 8}" fill="#e3a07c"/></svg>`;
  let img = sharp(Buffer.from(svg));
  if (exif) img = img.withExif({ IFD0: exif });
  return img.jpeg({ quality: 90 }).toBuffer();
}
const info = (id: string, width: number, height: number, faces?: PhotoInfo["faces"]): PhotoInfo => ({ id, width, height, focusX: 0.5, focusY: 0.5, focusSource: "given", faces });

describe("design JSON templates", () => {
  it("loads every layout in the spec", () => {
    expect(spec.layouts).toHaveLength(30);
    const all = designTemplates(spec);
    expect(all).toHaveLength(30);
    expect(all.filter((t) => t.side === "back").length).toBeGreaterThan(5);
  });

  it("maps design size ids to a preset and orientation", () => {
    expect(sizeFromDesignId("flat_7x5_l")).toMatchObject({ id: "flat_5x7", orientation: "landscape", trim: { w: 7, h: 5 } });
    expect(sizeFromDesignId("postcard_6x4_l").trim).toEqual({ w: 6, h: 4 });
    expect(sizeFromDesignId("details_4x6_p").trim).toEqual({ w: 4, h: 6 });
    expect(sizeFromDesignId("rsvp_5x3_5_l").trim).toEqual({ w: 5, h: 3.5 });
    expect(() => sizeFromDesignId("nope")).toThrow();
  });

  it("resolves roles through the theme: same layout, different type and colour", () => {
    const pines = designTemplate(spec, "full_bleed_band_p", "paper_pines");
    const wool = designTemplate(spec, "full_bleed_band_p", "red_wool");
    const h = (t: typeof pines) => t.slots.find((s) => s.id === "headline") as TextSlot;
    expect(h(pines).font).toBe("bricolage_grotesque");
    expect(h(pines).color).toBe("#2F4A3A");
    expect(h(wool).color).toBe("#FBF6EE");
    expect(wool.background).toBe("#9E3115");
    expect(h(pines).minPt).toBe(22);
  });

  it("keeps slots, rotation, z order and flags", () => {
    const t = designTemplate(spec, "polaroid_stack_p");
    expect(t.allowsOverlap).toBe(true);
    const p1 = t.slots.find((s) => s.id === "p1")!;
    expect(p1.rotate).toBe(-6);
    expect(p1.pivot).toEqual({ x: 1.75, y: 2.1 });
    expect(designTemplate(spec, "full_bleed_scrim_p").requiresContrastCheck).toBe(true);
    expect(designTemplate(spec, "std_garden_p").slots.find((s) => s.id === "p1")).toMatchObject({ mask: "circle", optional: true });
  });

  it("uses a Figtree stand-in for proposed fonts and the handwriting size scale", () => {
    const deco = designTemplate(spec, "inv_text_p", "evening_deco");
    const names = deco.slots.find((s) => s.kind === "text" && s.role === "names") as TextSlot | undefined;
    if (names) expect(names.font).toBe("figtree");
    const sign = designTemplate(spec, "back_from_block_p", "paper_pines").slots.find((s) => s.id === "signoff") as TextSlot;
    expect(sign.font).toBe("hw:kalam");
    expect(sign.sizePt).toBeCloseTo(18 * 1.05);
  });

  it("every layout puts photos and text inside the page, text inside the safe area", () => {
    for (const t of designTemplates(spec)) {
      const size = getSize(t.size, t.orientation);
      const page = pageInches(size);
      for (const s of t.slots) {
        if (s.rotate) continue;
        expect(s.x >= -size.bleed - 1e-6 && s.y >= -size.bleed - 1e-6 && s.x + s.w <= page.w - size.bleed + 1e-6 && s.y + s.h <= page.h - size.bleed + 1e-6, `${t.id}/${s.id}`).toBe(true);
        if (s.kind === "text" && t.id !== "postcard_back_6x4") {
          expect(s.x >= size.safe - 1e-6 && s.y >= size.safe - 1e-6 && s.x + s.w <= size.trim.w - size.safe + 1e-6 && s.y + s.h <= size.trim.h - size.safe + 1e-6, `${t.id}/${s.id} safe`).toBe(true);
        }
      }
    }
  });
});

describe("DPI check (design doc: warn under 200, red under 150, block under 100)", () => {
  const t = designTemplate(spec, "full_bleed_band_p"); // photo paints 5.25 x 5.625 in
  const size = getSize("flat_5x7");
  const level = (w: number, h: number) => {
    const p = info("p", w, h);
    return photoQuality(t, size, { photos: autoPlace(t, size, [p]) }, [p])[0];
  };
  it("sets the level and the upscale factor from the crop", () => {
    expect(level(2000, 2000).level).toBe("ok"); // 2000 / 5.25 = 381
    const warn = level(1000, 1000); // 190
    expect(warn.level).toBe("low");
    expect(warn.upscale).toBeCloseTo(1.69, 1);
    expect(level(700, 700).level).toBe("too_low"); // 133
    const blocked = level(450, 450); // 86
    expect(blocked.level).toBe("blocked");
    expect(blocked.upscale).toBeGreaterThan(3);
  });
  it("blocks approval for blocked photos and for red ones until acknowledged; amber never blocks", () => {
    const run = (w: number, h: number) => {
      const p = info("p", w, h);
      return checkDesign(t, size, { photos: autoPlace(t, size, [p]) }, [p]).filter((i) => i.kind === "photo_quality");
    };
    const amber = approvalState(run(1000, 1000));
    expect(amber.canApprove).toBe(true);
    const red = approvalState(run(700, 700));
    expect(red).toMatchObject({ canApprove: false, needsAck: ["p1"] });
    expect(approvalState(run(700, 700), ["p1"]).canApprove).toBe(true);
    expect(approvalState(run(450, 450), ["p1"]).canApprove).toBe(false);
  });
  it("optional empty photo slots do not block", () => {
    const garden = designTemplate(spec, "std_garden_p");
    const issues = checkDesign(garden, getSize("flat_5x7"), { photos: [] }, []);
    expect(issues.some((i) => i.kind === "empty_photo_slot")).toBe(false);
  });
});

describe("face-aware auto-crop", () => {
  const face = { x: 0.7, y: 0.1, w: 0.1, h: 0.14 };
  it("moves the crop window onto the faces", () => {
    const p = info("f", 4000, 3000, [face]);
    const { crop, facesOk } = autoCrop(p, 1, "center");
    expect(crop.focusX).toBeGreaterThan(0.6);
    expect(facesOk).toBe(true);
    const r = cropRect(p.width, p.height, 1, crop);
    expect(r.left + r.width).toBeGreaterThanOrEqual((face.x + face.w) * p.width);
  });
  it("puts faces in the upper third of slots that carry a text band below", () => {
    const p = info("f", 3000, 4000, [{ x: 0.4, y: 0.45, w: 0.2, h: 0.15 }]);
    const upper = autoCrop(p, 1.5, "upper").crop;
    const centre = autoCrop(p, 1.5, "center").crop;
    expect(upper.focusY).toBeGreaterThan(centre.focusY);
  });
  it("reports faces that cannot be kept in frame", () => {
    const wide = info("w", 4000, 1000, [{ x: 0.05, y: 0.3, w: 0.1, h: 0.3 }, { x: 0.85, y: 0.3, w: 0.1, h: 0.3 }]);
    expect(autoCrop(wide, 1, "center").facesOk).toBe(false);
    expect(facesInFrame(wide, 1, { focusX: 0.5, focusY: 0.5, zoom: 1 })).toBe(false);
  });
  it("autoPlace uses the faces; an explicit override still wins", () => {
    const t = designTemplate(spec, "full_bleed_band_p");
    const size = getSize("flat_5x7");
    const p = info("f", 4000, 3000, [face]);
    expect(autoPlace(t, size, [p])[0].crop.focusX).toBeGreaterThan(0.6);
    expect(autoPlace(t, size, [p], { overrides: { p1: { focusX: 0.2 } } })[0].crop.focusX).toBeCloseTo(0.2);
  });
});

describe("photo safety limits", () => {
  it("caps decoded images at 50 megapixels", async () => {
    expect(MAX_INPUT_PIXELS).toBe(50_000_000);
    const big = await sharp({ create: { width: 8000, height: 6500, channels: 3, background: "#808080" } }).png().toBuffer(); // 52 MP
    await expect(analyzePhoto("big", big)).rejects.toThrow();
    const t = designTemplate(spec, "full_bleed_band_p");
    await expect(renderPage({ template: t, size: getSize("flat_5x7"), design: { photos: [{ slotId: "p1", photoId: "big", crop: { focusX: 0.5, focusY: 0.5, zoom: 1 } }], text: {} }, photos: { big } }, { text: "none", dpi: 50 })).rejects.toThrow();
    const ok = await sharp({ create: { width: 7000, height: 7000, channels: 3, background: "#808080" } }).png().toBuffer(); // 49 MP
    expect((await analyzePhoto("ok", ok)).width).toBe(7000);
  }, 60_000);

  it("strips EXIF (GPS, descriptions) from everything it outputs", async () => {
    const marker = "SECRETPLACE-51.5N";
    const jpg = await synth(1200, 1600, { ImageDescription: marker, Copyright: marker });
    expect((await sharp(jpg).metadata()).exif).toBeTruthy();
    expect(jpg.includes(Buffer.from(marker))).toBe(true);
    const t = designTemplate(spec, "full_bleed_band_p");
    const size = getSize("flat_5x7");
    const design = { photos: autoPlace(t, size, [info("a", 1200, 1600)]), text: {} };
    const png = (await renderPage({ template: t, size, design, photos: { a: jpg } }, { text: "none" })).png;
    // sharp writes a tiny resolution-only EXIF block for the 300 DPI tag; nothing from the photo may survive.
    expect(png.includes(Buffer.from(marker))).toBe(false);
    expect(((await sharp(png).metadata()).exif ?? Buffer.alloc(0)).length).toBeLessThan(300);
    const { pdf } = await renderCardPdf({ size, front: { template: t, design, photos: { a: jpg } } });
    expect(Buffer.from(pdf).includes(Buffer.from(marker))).toBe(false);
    expect(Buffer.from(pdf).includes(Buffer.from("Exif"))).toBe(false);
  }, 60_000);
});

describe("text fitting", () => {
  const measure = (s: string, sz: number) => s.length * sz * 0.5;
  const slot = (o: Partial<TextSlot> = {}): TextSlot => ({ id: "t", kind: "text", x: 0, y: 0, w: 2, h: 0.5, font: "f", sizePt: 20, minPt: 10, color: "#000000", ...o });
  it("wraps by measured width", () => {
    expect(wrapMeasured("aaa bbb ccc", 30, 10, measure)).toEqual(["aaa", "bbb", "ccc"]);
  });
  it("shrinks to fit but never below minPt, and reports overflow", () => {
    expect(fitText("Hi", slot(), measure).size).toBe(20);
    const some = fitText("Season's greetings from all of us here", slot(), measure);
    expect(some.size).toBeLessThan(20);
    expect(some.size).toBeGreaterThanOrEqual(10);
    const long = fitText("word ".repeat(80), slot(), measure);
    expect(long.size).toBe(10);
    expect(long.overflow).toBe(true);
  });
});

describe("print PDF", () => {
  const text = {
    greeting: "Merry Christmas", names_year: "The Rivera family 2026", small_line: "Love from us", caption: "Last summer", message: "Hello there",
    letter_heading: "Dear friends", letter: "We hope your year was good. ".repeat(60), signoff: "Love, Sam", couple_names: "Sam and Alex", kicker: "Save the date",
    event_date: "June 6, 2027", place: "Portland", url: "greethub.com/x", reply_by_line: "Please reply by May 1", accept_line: "Joyfully accepts", decline_line: "Regretfully declines",
    return_address: "1 Main St", recipient_address: "A Friend\n2 Oak Ave", party_headline: "Mia turns 7", event_date_time: "Sat Jun 6, 2pm", venue_and_address: "The park", rsvp_line: "RSVP by May 20",
  };
  const photos = async () => {
    const out: Record<string, Uint8Array> = {};
    for (const id of ["a", "b", "c", "d", "e", "f"]) out[id] = await synth(1800, 2400);
    return out;
  };
  const place = (t: ReturnType<typeof designTemplate>, size: ReturnType<typeof getSize>) => {
    const infos = ["a", "b", "c", "d", "e", "f"].map((id) => info(id, 1800, 2400));
    return { photos: autoPlace(t, size, infos), text };
  };

  it("renders every layout to a PDF at its own size with bleed, trim box and a text fit report", async () => {
    const bytes = await photos();
    for (const t of designTemplates(spec)) {
      const size = getSize(t.size, t.orientation);
      const r = await renderCardPdf({ size, front: { template: t, design: place(t, size), photos: bytes } });
      const doc = await PDFDocument.load(r.pdf);
      const page = doc.getPage(0);
      expect(page.getWidth(), t.id).toBeCloseTo(pageInches(size).w * 72);
      expect(page.getHeight(), t.id).toBeCloseTo(pageInches(size).h * 72);
      expect(page.getTrimBox()).toMatchObject({ x: 9, y: 9, width: size.trim.w * 72, height: size.trim.h * 72 });
      expect(page.getBleedBox()).toMatchObject({ x: 0, y: 0 });
      expect(r.pages).toBe(1);
    }
  }, 240_000);

  it("renders a front and a back side as two pages", async () => {
    const bytes = await photos();
    const size = getSize("flat_5x7", "landscape");
    const front = designTemplate(spec, "hero_two_l");
    const back = designTemplate(spec, "back_letter_l");
    const r = await renderCardPdf({ size, front: { template: front, design: place(front, size), photos: bytes }, back: { template: back, design: place(back, size), photos: bytes } });
    expect(r.pages).toBe(2);
    expect((await PDFDocument.load(r.pdf)).getPageCount()).toBe(2);
    expect(r.textFit.some((f) => f.side === "back" && f.slotId === "body")).toBe(true);
    // the long letter spills from the first column into the second
    expect(r.textFit.some((f) => f.side === "back" && f.slotId === "body2")).toBe(true);
    expect(r.textFit.every((f) => f.sizePt >= 7)).toBe(true);
  }, 60_000);

  it("renders one design at every size (5x7, 4x6, 3.5x5, both orientations)", async () => {
    const bytes = await photos();
    const t = designTemplate(spec, "hero_two_p");
    for (const size of ALL_SIZES) {
      const r = await renderCardPdf({ size, front: { template: t, design: place(t, size), photos: bytes } });
      const doc = await PDFDocument.load(r.pdf);
      expect(doc.getPage(0).getWidth(), `${size.id} ${size.orientation}`).toBeCloseTo(pageInches(size).w * 72);
      expect(doc.getPage(0).getHeight()).toBeCloseTo(pageInches(size).h * 72);
    }
  }, 120_000);

  it("embeds handwriting fonts and reports stand-ins for brand faces not in the repo", async () => {
    const bytes = await photos();
    const size = getSize("flat_5x7");
    const t = designTemplate(spec, "back_from_block_p");
    const r = await renderCardPdf({ size, front: { template: t, design: place(t, size), photos: bytes } });
    expect(r.fontFallbacks).not.toContain("hw:kalam");
    expect(r.fontFallbacks).toContain("figtree");
  }, 60_000);

  it("rotated polaroids and masked photos render without error", async () => {
    const bytes = await photos();
    const size = getSize("flat_5x7");
    const t = designTemplate(spec, "polaroid_stack_p");
    const png = (await renderPage({ template: t, size, design: place(t, size), photos: bytes }, { text: "none", dpi: 100 })).png;
    expect((await sharp(png).metadata()).width).toBe(525);
    const g = designTemplate(spec, "std_garden_p");
    await renderPage({ template: g, size, design: place(g, size), photos: bytes }, { text: "none", dpi: 100 });
  }, 60_000);
});
