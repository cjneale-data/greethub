import type { ProjectView } from "./types";

export const STEPS = ["brief", "photos", "story", "sheet", "render", "proof"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_TITLES: Record<StepId, string> = {
  brief: "The idea",
  photos: "Meet the family",
  story: "The story",
  sheet: "The characters",
  render: "Drawing the pages",
  proof: "Your proof",
};

/** The slice of a project the stepper needs. Works with the stored document and with the browser view. */
export type StepperInput = Pick<ProjectView, "photosConfirmed" | "sheet" | "art" | "artOrder" | "proof"> & {
  story?: { approved: boolean } | null;
};

export function allPagesDone(p: Pick<StepperInput, "art" | "artOrder">): boolean {
  return p.artOrder.length > 0 && p.artOrder.every((id) => p.art[id]?.status === "done");
}

/** Which steps are complete. A step is complete only once the user has taken the decision that closes it. */
export function completedSteps(p: StepperInput | null): Record<StepId, boolean> {
  const brief = !!p; // a project exists only after the brief validated
  const photos = brief && !!p?.photosConfirmed;
  const story = photos && !!p?.story?.approved;
  const sheet = story && !!p?.sheet.approved;
  const render = sheet && allPagesDone(p!);
  const proof = render && !!p?.proof.approved;
  return { brief, photos, story, sheet, render, proof };
}

/** First step that still needs work. After the proof is approved it stays on "proof". */
export function currentStep(p: StepperInput | null): StepId {
  const done = completedSteps(p);
  for (const s of STEPS) if (!done[s]) return s;
  return "proof";
}

/** A step can be opened when every step before it is complete. */
export function canEnter(step: StepId, p: StepperInput | null): boolean {
  const done = completedSteps(p);
  return STEPS.slice(0, STEPS.indexOf(step)).every((s) => done[s]);
}

export function stepLabel(step: StepId): string {
  return `Step ${STEPS.indexOf(step) + 1} of ${STEPS.length}: ${STEP_TITLES[step]}`;
}

/** Editing locks: the brief locks once the story exists, photos once a model sheet has been drawn, the story once approved. */
export const briefLocked = (p: { story?: unknown }) => !!p.story;
export const photosLocked = (p: { sheet: { versions: unknown[] } }) => p.sheet.versions.length > 0;
export const storyLocked = (p: { story?: { approved: boolean } | null }) => !!p.story?.approved;

/** 0-100 for the render progress bar from per-page art state. */
export function renderPercent(p: Pick<StepperInput, "art" | "artOrder">): number {
  if (!p.artOrder.length) return 0;
  return Math.round((p.artOrder.filter((id) => p.art[id]?.status === "done").length / p.artOrder.length) * 100);
}
