import { describe, expect, it } from "vitest";
import { emptyDraft, isComplete, nextField } from "@/lib/intake/draft";
import { mockGuideTurn } from "@/lib/intake/mock-guide";

describe("mock Greet Guide", () => {
  it("fills several fields from one message and asks only the next missing one", async () => {
    const t = await mockGuideTurn("It's for my mum, Rosa, her birthday", emptyDraft());
    expect(t.draft).toMatchObject({ relationship: "Mom", recipientName: "Rosa", occasion: "birthday" });
    expect(t.next).toBe("tone");
    expect(t.reply).toContain("Got it");
    expect(t.reply).toContain("What should it feel like?");
    expect(t.reply.split("?").length - 1).toBe(1);
  });

  it("walks a whole brief to completion with chip answers", async () => {
    let d = emptyDraft();
    for (const msg of ["Friend", "Sam", "Thank you", "Funny", "Bold Cartoon Pop", "A crooked trophy on a plum wall", "Write it for me"]) {
      d = (await mockGuideTurn(msg, d)).draft;
    }
    expect(isComplete(d)).toBe(true);
    expect(d.message).toContain("Sam");
    expect(d.artStyle).toBe("bold_cartoon_pop");
  });

  it("re-asks with the validation wording when the answer does not parse", async () => {
    const d = (await mockGuideTurn("Mum", emptyDraft())).draft;
    expect(nextField(d)).toBe("recipientName");
    const t = await mockGuideTurn("12345", d);
    expect(t.next).toBe("recipientName");
    expect(t.reply).toContain("Just a first name or nickname is fine.");
  });

  it("never uses exclamation marks", async () => {
    const t = await mockGuideTurn("Mum Rosa birthday funny", emptyDraft());
    expect(t.reply).not.toContain("!");
  });
});
