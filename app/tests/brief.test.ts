import { describe, expect, it } from "vitest";
import { CreationBriefSchema, isReadyToGenerate, missingFields, plannedRenders, ART_STYLES } from "@greethub/shared";

const address = { name: "Sam Lee", line1: "1 Main St", city: "Austin", region: "TX", postalCode: "78701", country: "us" };
const card = {
  product: "card",
  occasion: "birthday",
  recipient: { name: "Sam", relationship: "brother" },
  tone: "funny",
  artStyle: "watercolor",
  characters: [{ name: "Sam", ageBand: "adult", role: "birthday boy" }],
  messageWording: "Happy birthday, old man.",
  delivery: "print_mail",
  mailTo: "recipient",
  shipTo: address,
};
const book = {
  product: "book",
  occasion: "just_because",
  recipient: { name: "Madison", relationship: "granddaughter" },
  tone: "adventurous",
  artStyle: "storybook_ink",
  readingAge: "3-5",
  pageCount: 24,
  characters: [{ name: "Madison", ageBand: "child", role: "hero", photoIds: ["ph_1"] }],
  storyIdea: "Three cousins sneak out for a flashlight adventure in the woods.",
  consent: { adultConfirmed: true, photoConsent: true },
};

describe("CreationBrief", () => {
  it("accepts a complete card and normalizes defaults", () => {
    const r = CreationBriefSchema.safeParse(card);
    expect(r.success).toBe(true);
    if (r.success && r.data.product === "card") {
      expect(r.data.insideIllustration).toBe(false);
      expect(r.data.shipTo?.country).toBe("US");
      expect(r.data.characters[0].photoIds).toEqual([]);
    }
  });

  it("accepts a complete book", () => {
    expect(CreationBriefSchema.safeParse(book).success).toBe(true);
  });

  it("rejects unknown product", () => {
    expect(CreationBriefSchema.safeParse({ ...card, product: "mug" }).success).toBe(false);
  });

  it("requires ship-to and recipient choice only for printed cards", () => {
    const { shipTo, mailTo, ...rest } = card;
    void shipTo; void mailTo;
    expect(missingFields({ ...rest, delivery: "print_mail" } as never).map((m) => m.path)).toEqual(expect.arrayContaining(["shipTo", "mailTo"]));
    expect(isReadyToGenerate({ ...rest, delivery: "ecard" } as never)).toBe(true);
  });

  it("needs some message source on a card", () => {
    const { messageWording, ...rest } = card;
    void messageWording;
    expect(missingFields(rest as never).map((m) => m.path)).toContain("messageWording");
    expect(isReadyToGenerate({ ...rest, memory: "The summer we got lost at the lake." } as never)).toBe(true);
  });

  it("requires occasionOther when occasion is other", () => {
    expect(isReadyToGenerate({ ...card, occasion: "other" } as never)).toBe(false);
    expect(isReadyToGenerate({ ...card, occasion: "other", occasionOther: "Retirement" } as never)).toBe(true);
  });

  it("limits characters to 4, and books need at least 1", () => {
    const c = { name: "A", ageBand: "child", role: "kid" };
    expect(isReadyToGenerate({ ...book, characters: [c, c, c, c] } as never)).toBe(true);
    expect(isReadyToGenerate({ ...book, characters: [c, c, c, c, c] } as never)).toBe(false);
    expect(isReadyToGenerate({ ...book, characters: [] } as never)).toBe(false);
  });

  it("blocks books without consent, and only 24 or 32 pages", () => {
    expect(isReadyToGenerate({ ...book, consent: { adultConfirmed: true, photoConsent: false } } as never)).toBe(false);
    expect(isReadyToGenerate({ ...book, pageCount: 28 } as never)).toBe(false);
    expect(isReadyToGenerate({ ...book, pageCount: 32 } as never)).toBe(true);
  });

  it("reports missing fields for an empty draft", () => {
    const paths = missingFields({ product: "book" }).map((m) => m.path);
    expect(paths).toEqual(expect.arrayContaining(["occasion", "recipient", "tone", "artStyle", "readingAge", "pageCount", "storyIdea", "consent"]));
  });

  it("rejects malformed delivery dates and bad art styles", () => {
    expect(isReadyToGenerate({ ...card, deliveryDate: "next tuesday" } as never)).toBe(false);
    expect(isReadyToGenerate({ ...card, artStyle: "photoreal" } as never)).toBe(false);
  });

  it("plans renders per product", () => {
    const c = CreationBriefSchema.parse(card);
    const b = CreationBriefSchema.parse(book);
    expect(plannedRenders(c).total).toBe(2);
    expect(plannedRenders(b).total).toBe(13);
    expect(plannedRenders(CreationBriefSchema.parse({ ...book, pageCount: 32 })).total).toBe(17);
  });

  it("every style preset carries a non-photoreal prompt", () => {
    for (const s of Object.values(ART_STYLES)) expect(s.prompt.toLowerCase()).toContain("not photorealistic");
  });
});
