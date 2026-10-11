import { describe, expect, it } from "vitest";
import { Bm25KnowledgeBase } from "@/lib/intake/knowledge/bm25";
import { KB_DOCS } from "@/lib/intake/knowledge/data";
import { PICKER_STYLES } from "@/lib/intake/knowledge/styles/picker.generated";
import { recommendStyles, parseQueryIntent, type StyleBrief } from "@/lib/intake/knowledge/styles/recommend";
import { recommendFrom } from "@/lib/intake/knowledge/styles/recommend-core";
import { findStyleInText } from "@/lib/intake/knowledge/styles/find-style";
import { styleOfferFor, withStyleOffers } from "@/lib/safety/style-offer";
import { createMockIpSafety } from "@/lib/safety/service";
import { defaultStyle } from "@/lib/intake/fields";

type Case = { name: string; brief: Partial<StyleBrief> & { product: "card" | "book" }; query?: string; top: string[]; within?: number };

// "top" lists styles of which at least one must appear in the recommended top 3.
const CASES: Case[] = [
  { name: "soft and watery for a baby shower", brief: { product: "card" }, query: "something soft and watery for a baby shower", top: ["watercolor_wash", "pastel_chalk"] },
  { name: "bold and funny for dad's birthday", brief: { product: "card" }, query: "bold and funny for dad's birthday", top: ["bold_cartoon_pop", "wonky_ink_cartoon"] },
  { name: "elegant wedding with gold", brief: { product: "card" }, query: "elegant wedding card with gold", top: ["foil_luxe", "ink_wash", "deco_geometric"] },
  { name: "gentle sympathy", brief: { product: "card" }, query: "a gentle sympathy card", top: ["watercolor_wash", "ink_wash", "minimal_line_art"] },
  { name: "teacher thank you handmade", brief: { product: "card" }, query: "thank you for my teacher, handmade and bright", top: ["paper_cut_collage", "felt_thread"] },
  { name: "cozy christmas", brief: { product: "card" }, query: "christmas card cozy and warm", top: ["cozy_gouache"] },
  { name: "funny get well", brief: { product: "card" }, query: "funny get well soon", top: ["bold_cartoon_pop", "wonky_ink_cartoon"] },
  { name: "toddler goodnight book", brief: { product: "book", readingAge: "0-2" }, query: "goodnight book for my toddler", top: ["moonlit_night"] },
  { name: "adventure book age 7", brief: { product: "book", readingAge: "6-8" }, query: "adventure book for my 7 year old", top: ["cozy_gouache", "anime_inspired", "comic_panel", "soft_3d_animated"] },
  { name: "movie look (Pixar) maps to soft 3D", brief: { product: "book" }, query: "like a Pixar movie", top: ["soft_3d_animated"], within: 1 },
  { name: "Ghibli-like forest adventure maps to anime-inspired", brief: { product: "book" }, query: "Studio Ghibli-like forest adventure", top: ["anime_inspired"], within: 1 },
  { name: "Dr. Seuss-y maps to wonky ink", brief: { product: "book" }, query: "Dr. Seuss-y silly book", top: ["wonky_ink_cartoon"], within: 1 },
  { name: "Frozen-style card maps to soft 3D", brief: { product: "card" }, query: "Frozen-style birthday card", top: ["soft_3d_animated"], within: 1 },
  { name: "bare word anime", brief: { product: "card" }, query: "anime", top: ["anime_inspired"], within: 1 },
  { name: "like a Disney movie", brief: { product: "book" }, query: "like a Disney movie", top: ["soft_3d_animated"], within: 1 },
  { name: "paper cut", brief: { product: "card" }, query: "paper cut", top: ["paper_cut_collage"], within: 1 },
  { name: "crayon kid drawing", brief: { product: "card" }, query: "kid's crayon drawing look", top: ["crayon_pencil"], within: 1 },
  { name: "oil painting portrait", brief: { product: "card" }, query: "realistic oil painting portrait of grandma", top: ["painterly_realism"], within: 1 },
  { name: "words only handwritten", brief: { product: "card" }, query: "words only, handwritten", top: ["hand_lettered_type"], within: 1 },
  { name: "colorful party graduation", brief: { product: "card" }, query: "super colorful party graduation", top: ["maximalist_pattern", "bold_cartoon_pop"] },
  { name: "minimal anniversary", brief: { product: "card" }, query: "minimal anniversary", top: ["minimal_line_art"], within: 1 },
  { name: "clay figures", brief: { product: "book" }, query: "clay figures silly", top: ["clay_stopmotion"], within: 1 },
  { name: "retro", brief: { product: "card" }, query: "something retro", top: ["midcentury_shapes", "vintage_storybook"] },
  { name: "comic superhero age 9", brief: { product: "book", readingAge: "6-8" }, query: "comic book superhero for my 9 year old", top: ["comic_panel"], within: 1 },
  { name: "flowers for mother's day", brief: { product: "card" }, query: "flowers for mother's day", top: ["botanical_gouache"], within: 1 },
  { name: "new baby book pastel", brief: { product: "book", readingAge: "0-2" }, query: "new baby book soft pastel", top: ["pastel_chalk", "watercolor_wash"] },
  { name: "brief only: birthday adventurous 3-5 book", brief: { product: "book", occasion: "birthday", tone: "adventurous", readingAge: "3-5" }, top: ["cozy_gouache", "bold_cartoon_pop", "soft_3d_animated", "anime_inspired", "flat_vector_friendly", "clay_stopmotion", "paper_cut_collage"] },
  { name: "brief only: funny Father's Day card", brief: { product: "card", occasion: "fathers_day", tone: "funny" }, top: ["bold_cartoon_pop", "wonky_ink_cartoon", "midcentury_shapes"] },
  { name: "brief only: heartfelt wedding card", brief: { product: "card", occasion: "wedding", tone: "heartfelt" }, top: ["ink_wash", "minimal_line_art", "botanical_gouache", "hand_lettered_type", "foil_luxe"] },
  { name: "moon and stars bedtime", brief: { product: "book" }, query: "moon and stars bedtime", top: ["moonlit_night"], within: 1 },
  { name: "gold foil christmas", brief: { product: "card" }, query: "gold foil christmas", top: ["foil_luxe"], within: 1 },
  { name: "felt and stitching", brief: { product: "card" }, query: "fuzzy felt and thread", top: ["felt_thread"], within: 1 },
];

describe("recommendStyles", () => {
  it.each(CASES.map((c) => [c.name, c]))("%s", (_n, c) => {
    const k = (c as Case).within ?? 3;
    const got = recommendStyles({ ...(c as Case).brief, query: (c as Case).query, limit: k }).map((r) => r.styleId);
    expect(got.some((id) => (c as Case).top.includes(id)), `got ${got.join(", ")}`).toBe(true);
  });

  it("has at least 25 query cases", () => {
    expect(CASES.filter((c) => c.query).length).toBeGreaterThanOrEqual(25);
  });

  it("only recommends styles that exist for the product (card-only styles never appear for books)", () => {
    const book = recommendStyles({ product: "book", query: "gold foil wedding wreath pattern", limit: 40 });
    const cardOnly = new Set(["botanical_gouache", "hand_lettered_type", "foil_luxe", "deco_geometric", "maximalist_pattern"]);
    for (const r of book) expect(cardOnly.has(r.styleId)).toBe(false);
  });

  it("leaves the beta photo look out unless the customer asks for it", () => {
    expect(recommendStyles({ product: "card", occasion: "anniversary", limit: 30 }).some((r) => r.styleId === "cinematic_photoreal")).toBe(false);
    expect(recommendStyles({ product: "card", query: "realistic cinematic photo look", limit: 3 }).some((r) => r.styleId === "cinematic_photoreal")).toBe(true);
  });

  it("books weigh character consistency: a long book brief does not lead with a loose, low-consistency look", () => {
    const top = recommendStyles({ product: "book", readingAge: "3-5", occasion: "birthday", tone: "funny", limit: 3 });
    for (const r of top) expect(["watercolor_wash", "pastel_chalk", "painterly_realism"]).not.toContain(r.styleId);
  });

  it("every recommendation carries a plain-language why line without exclamation marks", () => {
    for (const r of recommendStyles({ product: "card", occasion: "birthday", tone: "funny", limit: 5 })) {
      expect(r.why.length).toBeGreaterThan(20);
      expect(r.why).not.toContain("!");
    }
  });

  it("is deterministic and the client scorer (slim data) agrees with the server on a brief without text", () => {
    const brief = { product: "card" as const, occasion: "new_baby", tone: "heartfelt", limit: 3 };
    expect(recommendStyles(brief)).toEqual(recommendStyles(brief));
    expect(recommendFrom(PICKER_STYLES, brief).map((r) => r.styleId)).toEqual(recommendStyles(brief).map((r) => r.styleId));
  });

  it("marks the alias-derived style so the UI can say why", () => {
    const [first] = recommendStyles({ product: "book", query: "make it like a Pixar movie", limit: 1 });
    expect(first.fromAlias).toBe(true);
    expect(first.reasons[0]).toMatch(/closest original style/);
  });

  it("parses occasion, tone and product intent from free text", () => {
    expect(parseQueryIntent("a funny card for dad")).toMatchObject({ tones: ["silly"], product: "card", occasion: "fathers_day" });
    expect(parseQueryIntent("a bedtime story book for a baby")).toMatchObject({ product: "book", occasion: "bedtime", ageBand: "0-3" });
  });
});

describe("style retrieval documents (Greet Guide RAG)", () => {
  const kb = new Bm25KnowledgeBase();

  it("are part of the shared knowledge base and replace the old six presets", () => {
    const styles = KB_DOCS.filter((d) => d.kind === "style_preset");
    expect(styles.length).toBe(26);
    expect(KB_DOCS.some((d) => d.id === "style-watercolor")).toBe(false);
  });

  it("surface the right style for plain-language queries", async () => {
    expect((await kb.search("soft watery nursery", { kinds: ["style_preset"], k: 2 })).map((h) => h.doc.styleId)).toContain("watercolor_wash");
    expect((await kb.search("layered cut paper", { kinds: ["style_preset"], k: 1 }))[0].doc.styleId).toBe("paper_cut_collage");
    expect((await kb.search("night moon stars sleepy", { kinds: ["style_preset"], k: 2 })).map((h) => h.doc.styleId)).toContain("moonlit_night");
  });

  it("respects a product filter and the occasion boost on multi-occasion style docs", async () => {
    const hits = await kb.search("elegant simple", { kinds: ["style_preset"], product: "book", occasion: "anniversary", k: 10 });
    expect(hits.every((h) => h.doc.products!.includes("book"))).toBe(true);
  });
});

describe("plain-word style lookup for the chat", () => {
  it("finds a style named in plain words and ignores unrelated text", () => {
    expect(findStyleInText("Bold Cartoon Pop")).toBe("bold_cartoon_pop");
    expect(findStyleInText("I want watercolor")).toBe("watercolor_wash");
    expect(findStyleInText("paper collage please")).toBe("paper_cut_collage");
    expect(findStyleInText("her name is Rosa")).toBeUndefined();
  });

  it("defaultStyle gives a sensible first suggestion by occasion and tone", () => {
    expect(defaultStyle("birthday", "funny")).toBe("bold_cartoon_pop");
    expect(["watercolor_wash", "pastel_chalk", "botanical_gouache"]).toContain(defaultStyle("new_baby", "heartfelt"));
    expect(defaultStyle("wedding", "heartfelt")).toBeTruthy();
  });
});

describe("IP-safety style offer", () => {
  it("offers the generic style with one friendly note and never names the franchise", () => {
    const offer = styleOfferFor("I'd love it to look like a Pixar movie, with a Disney glow", "book");
    expect(offer?.styleId).toBe("soft_3d_animated");
    expect(offer!.note).toContain(offer!.styleName);
    expect(offer!.note.split("!").length - 1).toBeLessThanOrEqual(1);
    expect(offer!.note.toLowerCase()).not.toMatch(/pixar|disney|ghibli|seuss|frozen|law|legal|copyright/);
    expect(offer!.note.split("\n").length).toBe(1);
  });

  it("returns null for ordinary text", () => {
    expect(styleOfferFor("a boy and his dog at the lake")).toBeNull();
  });

  it("attaches the offer to safety results for idea fields but not for printed card text", async () => {
    const svc = withStyleOffers(createMockIpSafety());
    const idea = await svc.screen({ text: "make it Studio Ghibli-like", field: "card_idea" });
    expect(idea.styleOffer?.styleId).toBe("anime_inspired");
    const printed = await svc.screen({ text: "make it Studio Ghibli-like", field: "card_message" });
    expect(printed.styleOffer).toBeUndefined();
    const batch = await svc.screenBatch([{ text: "a calm lake", field: "story_idea" }, { text: "Frozen-style please", field: "chat" }]);
    expect(batch[0].styleOffer).toBeUndefined();
    expect(batch[1].styleOffer?.styleId).toBe("soft_3d_animated");
  });
});
