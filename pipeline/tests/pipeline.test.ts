import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBook, runCard } from "../src/run";
import { mockFetch, testCtx } from "./mock";

const tmp = () => mkdtempSync(join(tmpdir(), "gh-run-"));

describe("end to end with mocks", () => {
  it("card: identity, model sheet, 2 renders, PDF, ledger", async () => {
    const calls: { model: string; text: string }[] = [];
    const { ctx, ledger } = await testCtx("card", tmp(), mockFetch(calls));
    const r = await runCard(ctx, { visionQa: true });
    expect(r.renders.map((x) => x.id)).toEqual(["front", "inside"]);
    const stages = ledger.entries().map((e) => e.stage);
    expect(stages.filter((s) => s === "modelsheet" || s === "render").length).toBe(3);
    expect(ledger.entries().every((e) => e.costUsd >= 0 && e.runId === "t")).toBe(true);
    const renders = calls.filter((c) => c.text.includes("FULL-BLEED"));
    expect(renders.length).toBe(2);
    expect(renders[0].text.startsWith("The FIRST attached image")).toBe(true);
    expect(r.costUsd).toBeCloseTo(ledger.totalUsd());
  });

  it("book: renders cover + spreads and lays out the interior", async () => {
    const { ctx, ledger } = await testCtx("book", tmp(), mockFetch());
    const r = await runBook(ctx, { spreads: 3 });
    expect(r.renders.map((x) => x.id)).toEqual(["cover", "p1", "p2", "p3"]);
    expect((r.layout as { pageCount: number }).pageCount).toBe(2 + 2 * 3);
    expect(ledger.entries().filter((e) => e.kind === "image").length).toBe(5);
  });

  it("the approval gate stops before any page render", async () => {
    const { ctx, ledger } = await testCtx("book", tmp(), mockFetch());
    await expect(runBook(ctx, { approveModelSheet: () => false })).rejects.toThrow(/not approved/);
    expect(ledger.entries().filter((e) => e.stage === "render").length).toBe(0);
  });

  it("QA failure triggers exactly one automatic re-roll", async () => {
    const { ctx, ledger } = await testCtx("card", tmp(), mockFetch([], { qaCount: () => 9 }));
    const r = await runCard(ctx, { visionQa: true });
    expect(r.renders.every((x) => x.attempts === 2)).toBe(true);
    expect(ledger.entries().filter((e) => e.label === "front#reroll").length).toBe(1);
  });
});
