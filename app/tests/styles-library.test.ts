import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { ART_STYLE_IDS, ART_STYLES, CreationBriefSchema, LEGACY_ART_STYLE_IDS, STYLE_IDS, resolveArtStyleId, styleStringFor } from "@greethub/shared";
import { STYLE_KB_DOCS } from "@/lib/intake/knowledge/styles/docs.generated";
import { allAliasPhrases, matchIpSafeAlias } from "@/lib/intake/knowledge/styles/ip-alias";
import { PICKER_STYLES } from "@/lib/intake/knowledge/styles/picker.generated";
import { STYLE_CATEGORIES, STYLE_LIBRARY } from "@/lib/intake/knowledge/styles/library.generated";
import ipTable from "@/lib/safety/ip-table.json";

const repo = path.resolve(__dirname, "..", "..");
const designDir = path.join(repo, "docs", "design");
const raw = JSON.parse(readFileSync(path.join(designDir, "style-library.json"), "utf8"));
const schema = JSON.parse(readFileSync(path.join(designDir, "style-library.schema.json"), "utf8"));

describe("style library: schema", () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  it("the whole library validates against docs/design/style-library.schema.json", () => {
    const ok = validate(raw);
    expect(ok, JSON.stringify(validate.errors?.slice(0, 5))).toBe(true);
  });

  it.each(raw.styles as { id: string }[])("style $id validates on its own", (style) => {
    const one = ajv.getSchema(`${schema.$id}#/definitions/style`)!;
    expect(one(style), JSON.stringify(one.errors?.slice(0, 3))).toBe(true);
  });

  it("the schema rejects a style with a missing field and a bad swatch", () => {
    const bad = structuredClone(raw);
    delete bad.styles[0].styleString;
    bad.styles[1].swatches[0].hex = "red";
    expect(validate(bad)).toBe(false);
  });

  it("has the required breadth: 20+ styles, 12+ for books, 12+ for cards, 8 to 12 categories, some shared", () => {
    const s = raw.styles;
    expect(s.length).toBeGreaterThanOrEqual(20);
    expect(s.filter((x: { products: string[] }) => x.products.includes("book")).length).toBeGreaterThanOrEqual(12);
    expect(s.filter((x: { products: string[] }) => x.products.includes("card")).length).toBeGreaterThanOrEqual(12);
    expect(s.filter((x: { products: string[] }) => x.products.length === 2).length).toBeGreaterThan(0);
    expect(raw.categories.length).toBeGreaterThanOrEqual(8);
    expect(raw.categories.length).toBeLessThanOrEqual(12);
  });
});

describe("style library: integrity", () => {
  const ids = STYLE_LIBRARY.map((s) => s.id);

  it("ids are unique and category ids are unique", () => {
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(STYLE_CATEGORIES.map((c) => c.id)).size).toBe(STYLE_CATEGORIES.length);
  });

  it("every style belongs to a real category and every category has at least two styles", () => {
    const cats = new Set(STYLE_CATEGORIES.map((c) => c.id));
    for (const s of STYLE_LIBRARY) expect(cats.has(s.category), s.id).toBe(true);
    for (const c of STYLE_CATEGORIES) expect(STYLE_LIBRARY.filter((s) => s.category === c.id).length, c.id).toBeGreaterThanOrEqual(2);
  });

  it("popularity sources point at listed sources, and each source has a URL, a date and a V/S/U tag", () => {
    const srcIds = new Set(raw.sources.map((s: { id: string }) => s.id));
    for (const s of STYLE_LIBRARY) for (const r of s.popularity.sources) expect(srcIds.has(r), `${s.id} cites ${r}`).toBe(true);
    for (const s of raw.sources) expect(["V", "S", "U"]).toContain(s.tag);
  });

  it("alias targets exist, every alias lives on exactly one style, and each phrase resolves back to its own style", () => {
    const seen = new Map<string, string>();
    for (const s of STYLE_LIBRARY) {
      for (const a of s.ipSafeAliases) {
        const key = a.toLowerCase();
        expect(seen.has(key) && seen.get(key) !== s.id, `${a} on two styles`).toBe(false);
        seen.set(key, s.id);
        const hit = matchIpSafeAlias(a);
        expect(hit, a).not.toBeNull();
        expect(ids).toContain(hit!.styleId);
      }
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it("the customer phrases from the brief map to the nearest generic style", () => {
    const cases: [string, string][] = [
      ["like a Disney movie", "soft_3d_animated"],
      ["Pixar-looking", "soft_3d_animated"],
      ["anime", "anime_inspired"],
      ["Studio Ghibli-like", "anime_inspired"],
      ["Dr. Seuss-y", "wonky_ink_cartoon"],
      ["Frozen-style", "soft_3d_animated"],
    ];
    for (const [phrase, id] of cases) expect(matchIpSafeAlias(`make it ${phrase} please`)?.styleId, phrase).toBe(id);
  });

  it("ordinary words are not mistaken for a franchise look", () => {
    for (const t of ["a frozen pond with ice skates", "my niece frozen yogurt party", "a simple watercolor garden", "cartoon animals"]) expect(matchIpSafeAlias(t), t).toBeNull();
  });

  it("legacy ids do not collide with current ids and all resolve", () => {
    for (const l of LEGACY_ART_STYLE_IDS) {
      expect((STYLE_IDS as readonly string[]).includes(l), l).toBe(false);
      expect(resolveArtStyleId(l)).toBeTruthy();
    }
  });

  it("swatches are valid hex and each style has a thumbnail file in docs/design/samples and app/public/styles", () => {
    for (const s of STYLE_LIBRARY) {
      for (const sw of s.swatches) expect(sw.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      const f = s.thumbnail.file!;
      for (const dir of [path.join(designDir, "samples"), path.join(__dirname, "..", "public", "styles")]) {
        const p = path.join(dir, f);
        expect(existsSync(p), p).toBe(true);
        expect(statSync(p).size, p).toBeLessThan(200_000);
      }
    }
  });

  it("card styles carry typography, layout and text-safe-zone guidance", () => {
    for (const s of STYLE_LIBRARY.filter((x) => x.products.includes("card"))) {
      expect(s.card, s.id).toBeTruthy();
      expect(s.card!.typography.display.length).toBeGreaterThan(0);
      expect(s.card!.textSafeZone.length).toBeGreaterThan(10);
    }
  });

  it("generated app files and markdown guides are in sync with the JSON source of truth", () => {
    for (const tool of ["build-knowledge.mjs", "build-style-docs.mjs"]) {
      expect(() => execFileSync("node", [path.join(designDir, "tools", tool), "--check"], { stdio: "pipe" }), tool).not.toThrow();
    }
    expect(PICKER_STYLES.length).toBe(STYLE_LIBRARY.length);
    expect(STYLE_KB_DOCS.length).toBe(STYLE_LIBRARY.length);
    for (const s of STYLE_LIBRARY) expect(existsSync(path.join(designDir, "styles", `${s.id}.md`)), s.id).toBe(true);
  });
});

describe("style library: IP safety of the text that reaches prompts", () => {
  const T = ipTable as unknown as { franchises: { names: string[] }[]; characters: { names: string[] }[]; brands: unknown[] };
  const protectedNames = new Set<string>();
  for (const f of T.franchises) f.names.forEach((n) => protectedNames.add(n.toLowerCase()));
  for (const c of T.characters) c.names.forEach((n) => protectedNames.add(n.toLowerCase()));
  for (const b of T.brands) if (typeof b === "string") protectedNames.add(b.toLowerCase());
  // Extra names that must never be a style reference.
  for (const n of ["pixar", "disney", "ghibli", "miyazaki", "dr seuss", "seuss", "eric carle", "marvel", "dreamworks", "beatrix potter", "aardman", "lego", "minecraft"]) protectedNames.add(n);
  const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  // Generic art words that customers also use as aliases; they describe a medium, not a franchise.
  const GENERIC = new Set(["anime", "manga", "kawaii", "superhero movie"]);
  const banned = [...protectedNames, ...allAliasPhrases()].filter((n) => !GENERIC.has(n));
  const hits = (text: string) => banned.filter((n) => n.length >= 3 && norm(text).includes(norm(n)));

  it("no style string, avoid list, tag, synonym or retrieval document names a franchise, studio, artist or alias phrase", () => {
    for (const s of STYLE_LIBRARY) {
      const texts = [s.styleString, ...s.avoid, ...s.tags, ...s.synonyms, s.description, s.whyThisOne, ...Object.values(s.look), ...s.bestFor, ...s.avoidFor];
      for (const t of texts) expect(hits(t), `${s.id}: "${t.slice(0, 60)}"`).toEqual([]);
    }
    for (const d of STYLE_KB_DOCS) expect(hits(d.text + " " + d.title), d.id).toEqual([]);
    for (const p of PICKER_STYLES) expect(hits(JSON.stringify(p)), p.id).toEqual([]);
  });

  it("every style string is a real style string: medium plus a not-a-photograph clause", () => {
    for (const s of STYLE_LIBRARY) {
      expect(s.styleString.length).toBeGreaterThan(150);
      expect(s.styleString.toLowerCase()).toMatch(/not photorealistic|not a photograph|not a real photograph|not a copy of any real photograph/);
      expect(s.styleString.toLowerCase()).not.toMatch(/in the style of|style of [a-z]+ [a-z]+ \(/);
    }
  });
});

describe("art style ids: backward compatibility", () => {
  it("accepts the six first-schema ids and the five CMO preset ids and resolves them to canonical ids", () => {
    const expected: Record<string, string> = {
      watercolor: "watercolor_wash",
      storybook_ink: "ink_wash",
      paper_cut: "paper_cut_collage",
      bold_flat: "bold_cartoon_pop",
      crayon: "crayon_pencil",
      storybook_3d: "soft_3d_animated",
      soft_watercolor: "watercolor_wash",
      bold_pop: "bold_cartoon_pop",
      cozy_gouache: "cozy_gouache",
      paper_collage: "paper_cut_collage",
      ink_wash: "ink_wash",
    };
    for (const [old, now] of Object.entries(expected)) {
      expect(resolveArtStyleId(old), old).toBe(now);
      expect(ART_STYLE_IDS as readonly string[]).toContain(now);
    }
  });

  const card = {
    product: "card", occasion: "birthday", recipient: { name: "Rosa", relationship: "Mum" }, tone: "funny", artStyle: "bold_flat",
    delivery: "ecard", messageWording: "Happy birthday, Rosa.",
  };

  it("a brief with an old id still parses and stores the canonical id", () => {
    for (const old of ["bold_flat", "bold_pop", "watercolor", "soft_watercolor", "storybook_3d"]) {
      const r = CreationBriefSchema.safeParse({ ...card, artStyle: old });
      expect(r.success, old).toBe(true);
      if (r.success) expect(r.data.artStyle).toBe(resolveArtStyleId(old));
    }
  });

  it("a brief with a new id parses and an unknown id is rejected", () => {
    expect(CreationBriefSchema.safeParse({ ...card, artStyle: "felt_thread" }).success).toBe(true);
    expect(CreationBriefSchema.safeParse({ ...card, artStyle: "photoreal" }).success).toBe(false);
    expect(CreationBriefSchema.safeParse({ ...card, artStyle: "" }).success).toBe(false);
  });

  it("styleStringFor reads the library string by id, current or legacy, and throws on an unknown id", () => {
    expect(styleStringFor("felt_thread")).toBe(STYLE_LIBRARY.find((s) => s.id === "felt_thread")!.styleString);
    expect(styleStringFor("bold_flat")).toBe(styleStringFor("bold_cartoon_pop"));
    expect(ART_STYLES.watercolor_wash.prompt).toBe(styleStringFor("watercolor"));
    expect(() => styleStringFor("nope")).toThrow();
  });
});
