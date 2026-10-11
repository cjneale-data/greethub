import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StyleBrowser } from "@/components/styles/StyleBrowser";
import { PICKER_CATEGORIES, PICKER_STYLES } from "@/lib/intake/knowledge/styles/picker.generated";

const render = (props: Partial<Parameters<typeof StyleBrowser>[0]> = {}) =>
  renderToStaticMarkup(createElement(StyleBrowser, { product: "card", onChange: () => undefined, ...props }));

describe("style picker markup", () => {
  it("shows Recommended for you first, with a why line per recommendation, when the brief has signal", () => {
    const html = render({ brief: { occasion: "new_baby", tone: "heartfelt" } });
    expect(html.indexOf("Recommended for you")).toBeGreaterThan(-1);
    expect(html.indexOf("Recommended for you")).toBeLessThan(html.indexOf("Browse all looks"));
    expect(html.match(/class="sbc__why"/g)?.length).toBe(3);
    expect(html).toContain("Soft Watercolor");
  });

  it("falls back to Popular picks when nothing is known yet", () => {
    expect(render()).toContain("Popular picks");
  });

  it("lists every card style once in the browse grid and every category as a radio chip, as a radiogroup", () => {
    const html = render();
    const cardStyles = PICKER_STYLES.filter((s) => s.products.includes("card"));
    for (const s of cardStyles) expect(html).toContain(`data-testid="style-all-${s.id}"`);
    for (const c of PICKER_CATEGORIES) expect(html).toContain(c.name.replaceAll("&", "&amp;"));
    expect(html).toContain('role="radiogroup"');
    expect(html).not.toContain("aria-pressed");
  });

  it("books never show card-only styles", () => {
    const html = render({ product: "book" });
    for (const id of ["foil_luxe", "hand_lettered_type", "botanical_gouache", "deco_geometric", "maximalist_pattern"]) expect(html).not.toContain(`style-all-${id}`);
  });

  it("marks the chosen style, announces it, and keeps one tab stop per group", () => {
    const html = render({ value: "bold_cartoon_pop", brief: { occasion: "birthday", tone: "funny" } });
    expect(html).toContain("Chosen: Bold Cartoon Pop.");
    expect(html).toMatch(/aria-checked="true"[^>]*tabindex="0"[^>]*data-testid="style-all-bold_cartoon_pop"/);
  });

  it("shows honest thumbnails: a Sample tag only where a render exists, otherwise Colors only", () => {
    const html = render();
    expect(html).toContain("Sample");
    expect(html).toContain("Colors only");
    expect(html).toContain("/styles/bold_cartoon_pop.jpg");
    expect(html).not.toContain("/styles/ink_wash.jpg");
  });

  it("offers the generic style with a one-tap button when a franchise look was asked for", () => {
    const html = render({ suggestion: { styleId: "soft_3d_animated", note: "We make our own looks, so here is the closest one: Soft 3D Animated." } });
    expect(html).toContain("We make our own looks");
    expect(html).toContain("Use Soft 3D Animated");
  });
});
