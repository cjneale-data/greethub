import { beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderPage } from "../src/stages/render";
import { ipFromVision } from "../src/stages/qa";
import { guardLines } from "../src/stages/prompts";
import { writeStory } from "../src/stages/copy";
import { IpBlockedError, LOOKALIKE_RISK_FAIL_AT, sanitizeImagePrompt } from "../src/safety/index";
import { clearSafetyEvents, recordedSafetyEvents } from "../../app/lib/safety/events";
import { fakeArt, mockFetch, testCtx } from "./mock";

const tmp = () => mkdtempSync(join(tmpdir(), "gh-safe-"));
const page = { id: "front", kind: "card_front" as const, scene: "a snowy hill", characters: ["Madison"] };
async function sheetFile(dir: string) {
  const f = join(dir, "sheet.png");
  writeFileSync(f, await fakeArt(64, 64));
  return f;
}
beforeEach(() => clearSafetyEvents());

describe("vision IP flags", () => {
  it("passes a clean reply and fails each hard flag", () => {
    expect(ipFromVision({ character_lookalike_risk: 2 }).flags).toEqual([]);
    expect(ipFromVision({ recognizable_protected_character: "Elsa" }).flags).toEqual(["protected_character"]);
    expect(ipFromVision({ recognizable_protected_character: "none" }).flags).toEqual([]);
    expect(ipFromVision({ logo_or_brand_mark: true }).flags).toEqual(["logo"]);
    expect(ipFromVision({ slogan_or_trademarked_text: true }).flags).toEqual(["slogan"]);
    expect(ipFromVision({ licensed_merch_on_clothing: true }).flags).toEqual(["licensed_merch"]);
  });
  it("fails at the documented look-alike threshold, not below it", () => {
    expect(ipFromVision({ character_lookalike_risk: LOOKALIKE_RISK_FAIL_AT - 1 }).flags).toEqual([]);
    expect(ipFromVision({ character_lookalike_risk: LOOKALIKE_RISK_FAIL_AT }).flags).toEqual(["lookalike_risk"]);
    expect(ipFromVision({ character_lookalike_risk: 99 }).lookalikeRisk).toBe(10);
  });
});

describe("render: IP re-roll and block", () => {
  it("re-rolls once with a hardened prompt that names the problem, then passes", async () => {
    const dir = tmp();
    const calls: { model: string; text: string }[] = [];
    const { ctx, ledger } = await testCtx("card", dir, mockFetch(calls, { qaIp: (n) => (n === 1 ? { recognizable_protected_character: "Elsa", character_lookalike_risk: 9 } : {}) }));
    const r = await renderPage(ctx, page, "A snowy scene.", await sheetFile(dir), { visionQa: true });
    expect(r?.ipBlocked).toBeFalsy();
    expect(r?.attempts).toBe(2);
    const second = calls.filter((c) => c.text.includes("A snowy scene."))[1].text;
    expect(second).toContain("FIX THIS");
    expect(second).toContain("Elsa");
    expect(second).toContain("FIX THIS (second attempt)");
    expect(ledger.entries().filter((e) => e.label === "front#reroll" && e.kind === "image").length).toBe(1);
    expect(ledger.entries().some((e) => e.label === "qa_front#reroll")).toBe(true);
    const names = recordedSafetyEvents().map((e) => e.event_name);
    expect(names).toContain("ip_output_flagged");
    expect(names).toContain("ip_output_rerolled");
    expect(JSON.stringify(recordedSafetyEvents())).not.toMatch(/Elsa/);
  });

  it("blocks the page after the single re-roll fails again, and deletes the file", async () => {
    const dir = tmp();
    const { ctx, ledger } = await testCtx("card", dir, mockFetch([], { qaIp: () => ({ logo_or_brand_mark: true }) }));
    const r = await renderPage(ctx, page, "A snowy scene.", await sheetFile(dir), { visionQa: true });
    expect(r?.ipBlocked).toBe(true);
    expect(r?.ipFlags).toEqual(["logo"]);
    expect(r?.file).toBe("");
    expect(ledger.entries().filter((e) => e.kind === "image").length).toBe(2); // exactly one re-roll
    const final = recordedSafetyEvents().filter((e) => e.event_name === "ip_output_flagged").at(-1);
    expect(final?.props.is_final).toBe(true);
  });

  it("does not flag a clean page", async () => {
    const dir = tmp();
    const { ctx, ledger } = await testCtx("card", dir, mockFetch());
    const r = await renderPage(ctx, page, "A snowy scene.", await sheetFile(dir), { visionQa: true });
    expect(r?.attempts).toBe(1);
    expect(r?.qa?.ip?.flags).toEqual([]);
    expect(ledger.entries().filter((e) => e.kind === "image").length).toBe(1);
  });
});

describe("prompt hardening and sanitiser", () => {
  it("every guard block carries the logo, licensed-character and clothing rules", () => {
    const g = guardLines(page);
    expect(g).toContain("no logos, brand marks, trademarks, licensed or franchise characters");
    expect(g).toContain("No printed characters, logos, emblems");
    expect(g).toContain("redraw that clothing plain");
  });
  it("last-mile sanitiser rewrites protected names and keeps a cast member called Elsa", () => {
    const a = sanitizeImagePrompt("Pikachu and Elsa on a hill, wearing Nike shoes.", ["Elsa"]);
    expect(a.changed).toBe(true);
    expect(a.text.toLowerCase()).not.toContain("pikachu");
    expect(a.text.toLowerCase()).not.toContain("nike");
    expect(a.text).toContain("Elsa");
    expect(sanitizeImagePrompt("A calm frozen pond.", []).changed).toBe(false);
  });
  it("throws for a real public figure", () => {
    expect(() => sanitizeImagePrompt("Taylor Swift on stage", [])).toThrow(IpBlockedError);
  });
});

describe("story output screening", () => {
  it("rewrites protected names the model wrote into printed text and scenes", async () => {
    const { ctx } = await testCtx(
      "book",
      tmp(),
      mockFetch([], {
        story: (n) => ({
          title: "Mickey Mouse and the Night",
          blurb: "A tale.",
          cover_scene: "cover",
          cover_characters: ["Madison"],
          pages: Array.from({ length: n }, (_, i) => ({ text: i === 0 ? "Madison met Spider-Man. To infinity and beyond!" : "Page text.", scene: "Pikachu on a roof", characters: ["Madison"] })),
        }),
      }),
    );
    const s = await writeStory(ctx, 2);
    expect(JSON.stringify(s).toLowerCase()).not.toMatch(/mickey|spider-man|pikachu|infinity/);
    expect(s.pages[1].text).toContain("Madison");
    expect(recordedSafetyEvents().some((e) => e.event_name === "ip_output_flagged" && (e.props.flags as string[]).includes("story_text"))).toBe(true);
  });
});
