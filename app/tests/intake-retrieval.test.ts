import { describe, expect, it } from "vitest";
import { Bm25KnowledgeBase, fillTemplate, getKnowledgeBase, tokenize } from "@/lib/intake/knowledge/bm25";
import { KB_DOCS } from "@/lib/intake/knowledge/data";
import { suggestMessage } from "@/lib/intake/mock-guide";

describe("knowledge retrieval (BM25)", () => {
  const kb = new Bm25KnowledgeBase();

  it("tokenizes with stopword removal and light stemming", () => {
    expect(tokenize("The candles are burning")).toEqual(["candle", "burn"]);
  });

  it("finds the occasion tip for an occasion query", async () => {
    const hits = await kb.search("sympathy card gentle words", { k: 1 });
    expect(hits[0].doc.id).toBe("tip-sympathy");
  });

  it("filters by kind and boosts the matching occasion", async () => {
    const hits = await kb.search("message wishes", { kinds: ["sample_message"], occasion: "new_baby", k: 2 });
    expect(hits.every((h) => h.doc.kind === "sample_message")).toBe(true);
    expect(hits[0].doc.occasion).toBe("new_baby");
  });

  it("surfaces style presets for style questions", async () => {
    const hits = await kb.search("elegant wedding fine line wash", { kinds: ["style_preset"], k: 1 });
    expect(hits[0].doc.styleId).toBe("ink_wash");
  });

  it("returns nothing for gibberish and is deterministic", async () => {
    expect(await kb.search("zzzzqqq")).toEqual([]);
    expect(await kb.search("birthday cake")).toEqual(await kb.search("birthday cake"));
  });

  it("has a sample message and a tip for every common occasion", () => {
    for (const o of ["birthday", "thank_you", "wedding", "new_baby", "sympathy", "christmas"]) {
      expect(KB_DOCS.some((d) => d.kind === "occasion_tip" && d.occasion === o)).toBe(true);
      expect(KB_DOCS.some((d) => d.kind === "sample_message" && d.occasion === o)).toBe(true);
    }
  });

  it("builds a starter message filled with the recipient name, under the 400 char limit", async () => {
    const m = await suggestMessage({ recipientName: "Rosa", occasion: "birthday", tone: "funny" });
    expect(m).toContain("Rosa");
    expect(m).not.toContain("{name}");
    expect(m.length).toBeLessThanOrEqual(400);
    expect(fillTemplate("Hi {name} and {name}", "Sam")).toBe("Hi Sam and Sam");
  });

  it("is reachable through the shared interface", async () => {
    expect((await getKnowledgeBase().search("get well soup", { k: 1 })).length).toBe(1);
  });
});
