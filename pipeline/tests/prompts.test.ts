import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { guardLines, renderLead } from "../src/stages/prompts.js";
import { hasWhiteBorder } from "../src/stages/qa.js";
import { fakeArt } from "./mock.js";

describe("prompt guard lines", () => {
  const page = { id: "p1", kind: "spread" as const, scene: "s", characters: ["Madison", "Lee", "Louisa"], textZone: "top 30% sky" };
  it("has FULL-BLEED, FRAMING, exact count, outfit and teeth lines", () => {
    const g = guardLines(page);
    expect(g).toContain("FULL-BLEED");
    expect(g).toContain("No white border");
    expect(g).toContain("FRAMING");
    expect(g).toContain("top 30% sky");
    expect(g).toContain("EXACTLY 3 cast members appear: Madison, Lee, Louisa");
    expect(g).toContain("locked outfit");
    expect(g).toContain("full row of teeth");
    expect(g).toContain("No text, letters");
  });
  it("singular and zero counts read correctly", () => {
    expect(guardLines({ ...page, characters: ["Sam"] })).toContain("EXACTLY 1 cast member appears: Sam");
    expect(guardLines({ ...page, characters: [] })).toContain("no people or animals");
  });
  it("render lead puts the model sheet first as the authority", () => {
    const lead = renderLead(["A", "B"], ["A"]);
    expect(lead.startsWith("The FIRST attached image is the approved character model sheet (left to right: A, B)")).toBe(true);
    expect(lead).toContain("authority");
    expect(lead).toContain("ONLY for likeness");
  });
});

describe("white border QA", () => {
  it("flags a white frame and passes full-bleed art", async () => {
    const art = await fakeArt(256, 256);
    const framed = await sharp(art).extend({ top: 20, bottom: 20, left: 20, right: 20, background: "#ffffff" }).png().toBuffer();
    expect(await hasWhiteBorder(framed)).toBe(true);
    expect(await hasWhiteBorder(art)).toBe(false);
  });
});

describe("style library in the pipeline", () => {
  const brief = (artStyle: string) => ({ artStyle }) as never;

  it("reads the style string by id from the shared style library, for new and legacy ids", async () => {
    const { styleOf } = await import("../src/stages/identity.js");
    const { STYLE_STRINGS } = await import("@greethub/shared");
    expect(styleOf(brief("felt_thread"))).toBe(STYLE_STRINGS.felt_thread);
    expect(styleOf(brief("bold_flat"))).toBe(STYLE_STRINGS.bold_cartoon_pop);
    expect(styleOf(brief("watercolor"))).toBe(STYLE_STRINGS.watercolor_wash);
    expect(() => styleOf(brief("not_a_style"))).toThrow();
  });

  it("the IP-safety hardening lines are still appended to every page, whatever the style", async () => {
    const { IMAGE_HARDENING_LINES } = await import("../src/safety/index.js");
    const { STYLE_IDS } = await import("@greethub/shared");
    const g = guardLines({ id: "p", kind: "spread", scene: "s", characters: ["Sam"] });
    for (const line of IMAGE_HARDENING_LINES) expect(g).toContain(line);
    expect(STYLE_IDS.length).toBeGreaterThanOrEqual(20);
  });
});
