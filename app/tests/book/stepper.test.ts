import { describe, expect, it } from "vitest";
import { canEnter, completedSteps, currentStep, renderPercent, stepLabel, STEPS, type StepperInput } from "../../lib/book/stepper";

const base = (): StepperInput => ({
  photosConfirmed: false,
  story: null,
  sheet: { versions: [], freeRedosUsed: 0, approved: false, notes: {} },
  art: {},
  artOrder: [],
  proof: { title: "", dedication: "", digitalCopy: false, approved: false },
});

const withArt = (ids: string[], status: "done" | "pending"): Pick<StepperInput, "art" | "artOrder"> => ({
  artOrder: ids,
  art: Object.fromEntries(ids.map((id) => [id, { status, versions: [], current: 0 }])),
});

describe("book stepper", () => {
  it("starts on the brief with no project", () => {
    expect(currentStep(null)).toBe("brief");
    expect(canEnter("photos", null)).toBe(false);
    expect(canEnter("brief", null)).toBe(true);
  });

  it("walks the six steps in order as decisions are made", () => {
    const p = base();
    expect(currentStep(p)).toBe("photos");
    p.photosConfirmed = true;
    expect(currentStep(p)).toBe("story");
    p.story = { approved: false };
    expect(currentStep(p)).toBe("story");
    p.story = { approved: true };
    expect(currentStep(p)).toBe("sheet");
    p.sheet.approved = true;
    expect(currentStep(p)).toBe("render");
    Object.assign(p, withArt(["cover", "p1"], "pending"));
    expect(currentStep(p)).toBe("render");
    Object.assign(p, withArt(["cover", "p1"], "done"));
    expect(currentStep(p)).toBe("proof");
    expect(completedSteps(p).proof).toBe(false);
    p.proof.approved = true;
    expect(completedSteps(p).proof).toBe(true);
    expect(currentStep(p)).toBe("proof");
  });

  it("never lets a later step open before the earlier ones are closed", () => {
    const p = base();
    p.story = { approved: true }; // approved story but photos never confirmed
    for (const s of ["story", "sheet", "render", "proof"] as const) expect(canEnter(s, p)).toBe(false);
    p.photosConfirmed = true;
    expect(canEnter("story", p)).toBe(true);
    expect(canEnter("sheet", p)).toBe(true);
    expect(canEnter("render", p)).toBe(false);
  });

  it("cannot skip the sheet approval to reach the render step", () => {
    const p = base();
    p.photosConfirmed = true;
    p.story = { approved: true };
    expect(canEnter("render", p)).toBe(false);
    p.sheet.approved = true;
    expect(canEnter("render", p)).toBe(true);
  });

  it("labels steps and computes render percent", () => {
    expect(stepLabel("photos")).toBe("Step 2 of 6: Meet the family");
    expect(STEPS).toHaveLength(6);
    expect(renderPercent(withArt([], "done"))).toBe(0);
    const half = { artOrder: ["a", "b"], art: { a: { status: "done" as const, versions: [], current: 0 }, b: { status: "pending" as const, versions: [], current: 0 } } };
    expect(renderPercent(half)).toBe(50);
  });
});
