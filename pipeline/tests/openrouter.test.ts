import { describe, expect, it } from "vitest";
import { MemoryLedger, SpendCapExceeded } from "../src/ledger";
import { OpenRouterClient, isRetryable, type FetchLike } from "../src/openrouter";

const okImg = { ok: true, status: 200, text: async () => "", json: async () => ({ choices: [{ message: { images: [{ image_url: { url: "data:image/png;base64,AAAA" } }] } }], usage: { cost: 0.05 } }) };
const noImg = { ok: true, status: 200, text: async () => "", json: async () => ({ choices: [{ message: { content: "refused" } }], usage: { cost: 0.001 } }) };
const http = (status: number) => ({ ok: false, status, text: async () => "err", json: async () => ({}) });

function client(script: (model: string, n: number) => unknown, extra: Partial<ConstructorParameters<typeof OpenRouterClient>[0]> = {}) {
  const ledger = new MemoryLedger();
  const models: string[] = [];
  let n = 0;
  const f: FetchLike = async (_u, init) => {
    const body = JSON.parse(init.body);
    models.push(body.model);
    const r = script(body.model, ++n);
    if (r === "throw") throw new Error("ECONNRESET");
    return r as never;
  };
  const c = new OpenRouterClient({ apiKey: () => "sk-secret-123456789", ledger, runId: "r", fetch: f, backoffMs: { network: 0, http: 0 }, log: () => {}, ...extra });
  return { c, ledger, models };
}
const args = { content: [{ type: "text" as const, text: "x" }], stage: "render", label: "p1", size: "1K" as const, aspectRatio: "1:1" };

describe("retry rules", () => {
  it("classifies statuses", () => {
    expect([400, 401, 402, 404].some(isRetryable)).toBe(false);
    expect([429, 500, 502, 503].every(isRetryable)).toBe(true);
  });

  it("never retries HTTP 400 on a model, then falls to the next model", async () => {
    const { c, models } = client((m) => (m.includes("nano-banana") ? http(400) : okImg));
    const r = await c.image(args);
    expect(models).toEqual(["google/gemini-nano-banana-2.1", "google/gemini-3.1-flash-image"]);
    expect(r?.model).toBe("google/gemini-3.1-flash-image");
  });

  it("retries 429 up to 3 attempts, then falls through", async () => {
    const { c, models } = client((m) => (m.includes("nano-banana") ? http(429) : okImg));
    await c.image(args);
    expect(models.filter((m) => m.includes("nano-banana")).length).toBe(3);
  });

  it("retries 5xx and succeeds on the same model", async () => {
    const { c, models } = client((_m, n) => (n < 3 ? http(503) : okImg));
    const r = await c.image(args);
    expect(models.length).toBe(3);
    expect(r?.model).toBe("google/gemini-nano-banana-2.1");
  });

  it("retries network errors", async () => {
    const { c, ledger } = client((_m, n) => (n === 1 ? "throw" : okImg));
    expect(await c.image(args)).not.toBeNull();
    expect(ledger.entries().map((e) => e.status)).toEqual(["network_error", "ok"]);
  });

  it("walks the full chain and returns null when nothing yields an image", async () => {
    const { c, models } = client(() => noImg);
    expect(await c.image(args)).toBeNull();
    expect(models).toEqual(["google/gemini-nano-banana-2.1", "google/gemini-3.1-flash-image", "google/gemini-3-pro-image"]);
  });

  it("caps the requested size at what each model supports", async () => {
    const sizes: string[] = [];
    const ledger = new MemoryLedger();
    const f: FetchLike = async (_u, init) => {
      const b = JSON.parse(init.body);
      sizes.push(b.image_config.image_size);
      return (b.model.includes("pro") ? okImg : noImg) as never;
    };
    const c = new OpenRouterClient({ apiKey: () => "k", ledger, runId: "r", fetch: f, backoffMs: { network: 0, http: 0 }, log: () => {} });
    await c.image({ ...args, size: "4K" });
    expect(sizes).toEqual(["4K", "4K", "2K"]);
  });
});

describe("cost ledger", () => {
  it("records every attempt, reads cost from usage, and never stores the key", async () => {
    const { c, ledger } = client((_m, n) => (n === 1 ? http(429) : okImg));
    await c.image(args);
    const e = ledger.entries();
    expect(e.map((x) => [x.status, x.costUsd, x.costSource])).toEqual([
      ["http_error", 0, "none"],
      ["ok", 0.05, "openrouter_usage"],
    ]);
    expect(JSON.stringify(e)).not.toContain("sk-secret");
    expect(e[1]).toMatchObject({ stage: "render", label: "p1", kind: "image", imageSize: "1K", attempt: 2 });
    expect(ledger.totalUsd()).toBeCloseTo(0.05);
  });

  it("computes cost when usage.cost is absent", async () => {
    const { c, ledger } = client(() => ({
      ok: true,
      status: 200,
      text: async () => "",
      json: async () => ({ choices: [{ message: { content: "hi" } }], usage: { prompt_tokens: 1_000_000, completion_tokens: 100_000 } }),
    }));
    await c.text({ content: [{ type: "text", text: "x" }], stage: "story", label: "s" });
    expect(ledger.entries()[0]).toMatchObject({ costSource: "computed", costUsd: 3 + 1.5 });
  });

  it("stops before a call once the spend cap is reached", async () => {
    const { c } = client(() => okImg, { spendCapUsd: 0.05 });
    await c.image(args);
    await expect(c.image(args)).rejects.toBeInstanceOf(SpendCapExceeded);
  });
});
