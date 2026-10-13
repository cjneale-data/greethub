import { describe, expect, it } from "vitest";
import { insideText, mergeServerDraft, toCardBrief, type CardDraft } from "@/lib/intake/draft";

const full: CardDraft = {
  relationship: "Friend",
  recipientName: "Rosa",
  occasion: "birthday",
  tone: "heartfelt",
  artStyle: "watercolor_wash",
  idea: "A lemon tree in a sunny yard",
  message: "Happy birthday, Rosa. Here's to another year of long walks.",
};

describe("insideText", () => {
  it("adds the sign-off on its own line", () => {
    expect(insideText({ ...full, signoff: "Sam" })).toBe(`${full.message}\n\nSam`);
  });
  it("does not repeat a sign-off the message already ends with", () => {
    expect(insideText({ ...full, message: "Happy birthday. Love, Sam.", signoff: "Sam" })).toBe("Happy birthday. Love, Sam.");
  });
  it("is just the message with no sign-off", () => {
    expect(insideText(full)).toBe(full.message);
  });
  it("is what the brief carries as the printed wording", () => {
    const b = toCardBrief({ ...full, signoff: "Sam" });
    expect(b.ok && b.brief.messageWording).toBe(`${full.message}\n\nSam`);
  });
});

describe("mergeServerDraft", () => {
  it("keeps a form edit made while the guide was thinking", () => {
    const sent: CardDraft = { relationship: "Friend" };
    const cur: CardDraft = { relationship: "Friend", tone: "funny" };
    const server: CardDraft = { relationship: "Friend", recipientName: "Rosa", sources: { recipientName: "chat" } };
    const out = mergeServerDraft(sent, cur, server);
    expect(out).toMatchObject({ relationship: "Friend", recipientName: "Rosa", tone: "funny" });
    expect(out.sources?.recipientName).toBe("chat");
  });
  it("lets the server change or clear a field it touched", () => {
    const sent: CardDraft = { idea: "old idea here", occasion: "other", occasionOther: "Retirement" };
    const server: CardDraft = { idea: "new idea here", occasion: "birthday" };
    const out = mergeServerDraft(sent, sent, server);
    expect(out.idea).toBe("new idea here");
    expect(out.occasion).toBe("birthday");
    expect(out.occasionOther).toBeUndefined();
  });
});
