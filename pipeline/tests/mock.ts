import sharp from "sharp";
import type { Ctx } from "../src/types.js";
import { MemoryLedger } from "../src/ledger.js";
import { OpenRouterClient, type FetchLike } from "../src/openrouter.js";
import { CreationBriefSchema } from "@greethub/shared";

/** A colourful full-bleed test image (no white border). */
export async function fakeArt(w = 256, h = 256): Promise<Buffer> {
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      raw[i] = (x * 255) / w;
      raw[i + 1] = 80 + (y * 100) / h;
      raw[i + 2] = 140;
    }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

export type MockOpts = {
  qaCount?: (n: number) => number;
  imageCost?: number;
  /** Extra fields for the vision QA reply on the nth QA call (IP flags). */
  qaIp?: (n: number) => Record<string, unknown>;
  /** Override the story JSON (to test output screening). */
  story?: (spreads: number) => Record<string, unknown>;
};

/** Routes by prompt content, mimicking OpenRouter responses including usage.cost. */
export function mockFetch(calls: { model: string; text: string }[] = [], o: MockOpts = {}): FetchLike {
  let qaN = 0;
  return async (_url, init) => {
    const body = JSON.parse(init.body);
    const user = body.messages.at(-1).content as { type: string; text?: string }[];
    const text = user.find((p) => p.type === "text")?.text ?? "";
    calls.push({ model: body.model, text });
    const ok = (message: unknown, cost: number) => ({
      ok: true,
      status: 200,
      text: async () => "",
      json: async () => ({ choices: [{ message }], usage: { prompt_tokens: 1000, completion_tokens: 200, cost } }),
    });
    if (body.image_config || body.modalities) {
      const art = await fakeArt(64, body.image_config?.aspect_ratio === "3:4" ? 85 : 64);
      return ok({ content: "", images: [{ image_url: { url: `data:image/png;base64,${art.toString("base64")}` } }] }, o.imageCost ?? 0.07);
    }
    if (text.startsWith("Picture-book illustration QA")) {
      qaN++;
      const expected = Number(/cast that must appear: (\d+)/.exec(text)![1]);
      return ok({ content: JSON.stringify({ character_count: o.qaCount ? o.qaCount(qaN) : expected, text_in_image: false, recognizable_protected_character: null, logo_or_brand_mark: false, slogan_or_trademarked_text: false, licensed_merch_on_clothing: false, character_lookalike_risk: 1, notes: "ok", ...(o.qaIp?.(qaN) ?? {}) }) }, 0.003);
    }
    if (text.startsWith("You are the art director")) return ok({ content: "MADISON: anchors... uniform yellow." }, 0.02);
    if (text.startsWith("Write a") && text.includes("picture book")) {
      const n = Number(/exactly (\d+) spreads/.exec(text)![1]);
      return ok(
        {
          content: JSON.stringify(o.story?.(n) ?? {
            title: "The Test Story",
            blurb: "A test blurb.",
            cover_scene: "cover scene",
            cover_characters: ["Madison"],
            pages: Array.from({ length: n }, (_, i) => ({ text: `Page ${i + 1} text. `.repeat(8), scene: `scene ${i + 1}`, characters: ["Madison"] })),
          }),
        },
        0.03,
      );
    }
    if (text.startsWith("Write a") && text.includes("greeting card")) {
      return ok(
        {
          content: JSON.stringify({
            title: "Happy Birthday",
            front_scene: "front",
            front_characters: ["Madison"],
            inside_scene: "inside",
            inside_characters: ["Madison"],
            message: "Happy birthday, Sam! Here is to another year.",
          }),
        },
        0.02,
      );
    }
    if (text.startsWith("Write one image-generation prompt")) {
      const ids = [...text.matchAll(/"id": "([^"]+)"/g)].map((m) => m[1]);
      return ok({ content: JSON.stringify(Object.fromEntries(ids.map((id) => [id, `Prompt for ${id}.`]))) }, 0.03);
    }
    return { ok: false, status: 400, text: async () => "unrouted", json: async () => ({}) };
  };
}

export const brief = (product: "card" | "book" = "book") =>
  CreationBriefSchema.parse(
    product === "book"
      ? {
          product: "book",
          occasion: "just_because",
          recipient: { name: "Maddy", relationship: "niece" },
          tone: "adventurous",
          artStyle: "watercolor",
          readingAge: "3-5",
          pageCount: 24,
          characters: [{ name: "Madison", ageBand: "child", role: "hero", photoIds: ["ph1"] }],
          storyIdea: "A flashlight adventure in the woods at night.",
          consent: { adultConfirmed: true, photoConsent: true },
        }
      : {
          product: "card",
          occasion: "birthday",
          recipient: { name: "Sam", relationship: "friend" },
          tone: "funny",
          artStyle: "bold_flat",
          characters: [{ name: "Madison", ageBand: "child", role: "birthday girl", photoIds: ["ph1"] }],
          messageWording: "Happy birthday!",
          delivery: "ecard",
          insideIllustration: true,
        },
  );

export async function testCtx(product: "card" | "book", workDir: string, f: FetchLike) {
  const ledger = new MemoryLedger();
  const client = new OpenRouterClient({ apiKey: () => "sk-test-key-0000", ledger, runId: "t", fetch: f, backoffMs: { network: 0, http: 0 }, log: () => {} });
  const photo = await fakeArt(64, 64);
  const ctx: Ctx = { client, workDir, brief: brief(product), imageSize: "1K", log: () => {}, photos: { get: async () => photo } };
  return { ctx, ledger };
}
