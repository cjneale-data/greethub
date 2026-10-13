import { describe, expect, it } from "vitest";
import { guardLines } from "../../pipeline/src/stages/prompts";
import { NEUTRAL_COUNT_LINE, guestCast, guestGuardLines } from "@/lib/intake/guest-prompt";

describe("guest preview guard lines", () => {
  it("does not forbid people or animals when the brief has no cast", () => {
    const g = guestGuardLines(guardLines, {});
    expect(g).not.toContain("no people or animals");
    expect(g).toContain(NEUTRAL_COUNT_LINE);
    expect(g).toContain("FULL-BLEED");
    expect(g).toContain("No text, letters");
  });
  it("passes the real cast, pet included", () => {
    const brief = { characters: [{ name: "Rosa" }], pet: { name: "Biscuit" } };
    expect(guestCast(brief)).toEqual(["Rosa", "Biscuit"]);
    expect(guestGuardLines(guardLines, brief)).toContain("EXACTLY 2 cast members appear: Rosa, Biscuit");
  });
  it("never refers guests to a model sheet they don't have", () => {
    expect(guestGuardLines(guardLines, {})).not.toContain("model sheet");
    expect(guestGuardLines(guardLines, { characters: [{ name: "Rosa" }] })).not.toContain("model sheet");
  });
});
