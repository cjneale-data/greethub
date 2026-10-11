import { describe, expect, it } from "vitest";
import { CardBriefSchema } from "@greethub/shared";
import { applyPatch, disabledHint, emptyDraft, isComplete, missingRequired, progress, toCardBrief, type CardDraft } from "@/lib/intake/draft";

const full: CardDraft = {
  relationship: "Mum",
  recipientName: "Rosa",
  occasion: "birthday",
  tone: "heartfelt",
  artStyle: "watercolor_wash",
  idea: "Her garden at golden hour",
  message: "Happy birthday, Rosa. Love you.",
};

describe("brief completion", () => {
  it("lists missing fields in the question-bank order", () => {
    expect(missingRequired(emptyDraft()).map((m) => m.field)).toEqual(["relationship", "recipientName", "occasion", "tone", "artStyle", "idea", "message"]);
  });

  it("is complete only when every required field validates", () => {
    expect(isComplete(full)).toBe(true);
    for (const key of Object.keys(full) as (keyof CardDraft)[]) {
      expect(isComplete({ ...full, [key]: undefined }), `without ${key}`).toBe(false);
    }
  });

  it("maps a complete draft onto the shared CardBrief schema", () => {
    const r = toCardBrief(full);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(CardBriefSchema.safeParse(r.brief).success).toBe(true);
      expect(r.brief.delivery).toBe("ecard");
      expect(r.brief.recipient).toEqual({ name: "Rosa", relationship: "Mum" });
    }
  });

  it("rejects bad names, short ideas, long messages and a bare 'Someone else'", () => {
    expect(isComplete({ ...full, recipientName: "R0sa<script>" })).toBe(false);
    expect(isComplete({ ...full, idea: "hi" })).toBe(false);
    expect(isComplete({ ...full, message: "x".repeat(401) })).toBe(false);
    expect(isComplete({ ...full, relationship: "Someone else" })).toBe(false);
    expect(isComplete({ ...full, occasion: "other" })).toBe(false);
    expect(isComplete({ ...full, occasion: "other", occasionOther: "Retirement lunch" })).toBe(true);
  });

  it("reports progress out of 8 with product counted", () => {
    expect(progress(emptyDraft()).label).toBe("1 of 8 done");
    expect(progress(full).label).toBe("8 of 8 done");
    expect(progress({ relationship: "Mum", recipientName: "Rosa" }).done).toBe(3);
  });

  it("names what is missing on the disabled button", () => {
    expect(disabledHint({})).toBe("Add a recipient to continue.");
    expect(disabledHint(full)).toBeNull();
  });

  it("applyPatch records the source and lets later edits override earlier ones", () => {
    let d = applyPatch(emptyDraft(), { recipientName: "Rosa" }, "chat");
    d = applyPatch(d, { recipientName: "Rosie" }, "form");
    expect(d.recipientName).toBe("Rosie");
    expect(d.sources?.recipientName).toBe("form");
    d = applyPatch(d, { occasion: "other", occasionOther: "x" });
    d = applyPatch(d, { occasion: "birthday" });
    expect(d.occasionOther).toBeUndefined();
  });
});
