import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { CardBriefSchema, CardWritingSchema } from "@greethub/shared";
import { setDocStoreForTest } from "@/lib/store";
import { deleteAccount, exportUserData } from "@/lib/shop/accountService";
import { getBookStorage } from "@/lib/book/storage";
import { CardDraftSchema, mergeServerDraft, toCardBrief, type CardDraft } from "@/lib/intake/draft";
import {
  addSignature, createCustomStyle, deleteCustomStyle, deleteSignature, getWriting, publicView, renderCustom, resolveCardWriting,
  setDefaults, signatureImage, uploadSignature, WritingError,
} from "@/lib/writing/service";
import { filledSheet } from "./sheet-fixture";
import { makeMember } from "../membership-fixture";

const A = "u_alice";
const B = "u_bob";
const strokes = { kind: "drawn", canvas: { w: 400, h: 150 }, strokes: [[{ x: 10, y: 50 }, { x: 60, y: 20 }, { x: 110, y: 70 }, { x: 160, y: 30 }, { x: 220, y: 60 }, { x: 260, y: 40 }, { x: 300, y: 55 }, { x: 330, y: 50 }]] };
const files = () => {
  const root = path.join(process.env.GREETHUB_DATA_DIR!, "storage", "writing");
  return fs.existsSync(root) ? fs.readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith(".png")) : [];
};

beforeEach(async () => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-writing-"));
  setDocStoreForTest(null);
  // Saved signatures and printing own handwriting are Plus perks (docs/finance/membership-plan.md); A is a member.
  await makeMember(A, "plus");
});

describe("card writing schema", () => {
  it("needs a style for a handwritten message and only accepts preset or custom ids", () => {
    expect(CardWritingSchema.safeParse({ message: "handwritten" }).success).toBe(false);
    expect(CardWritingSchema.safeParse({ message: "handwritten", styleId: "comic_sans" }).success).toBe(false);
    expect(CardWritingSchema.safeParse({ message: "handwritten", styleId: "kalam" }).success).toBe(true);
    expect(CardWritingSchema.safeParse({ message: "handwritten", styleId: "custom_abc123def4" }).success).toBe(true);
    expect(CardWritingSchema.safeParse({ signature: { kind: "typed", text: "Sam", fontId: "papyrus" } }).success).toBe(false);
    expect(CardWritingSchema.parse({}).signature).toEqual({ kind: "none" });
  });

  it("rides the card draft through a chat round-trip and lands on the brief", () => {
    const writing = { message: "handwritten" as const, styleId: "kalam", signature: { kind: "typed" as const, text: "Sam", fontId: "allura" as const } };
    const draft: CardDraft = { relationship: "Friend", recipientName: "Rosa", occasion: "birthday", tone: "heartfelt", artStyle: "watercolor_wash", idea: "A lemon tree in the sun", message: "Happy birthday!", writing };
    const echoed = CardDraftSchema.parse(draft) as CardDraft;
    expect(mergeServerDraft(draft, draft, echoed).writing).toEqual(writing);
    const b = toCardBrief(draft);
    expect(b.ok && b.brief.writing?.styleId).toBe("kalam");
    expect(CardBriefSchema.safeParse({ ...(b.ok ? b.brief : {}), writing: { message: "handwritten" } }).success).toBe(false);
  });
});

describe("signatures", () => {
  it("saves typed, drawn and uploaded signatures, the first becoming the default", async () => {
    let p = await addSignature(A, { kind: "typed", text: "Alice", fontId: "allura" });
    expect(p.defaultSignatureId).toBe(p.signatures[0].id);
    p = await addSignature(A, strokes);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400"><rect width="900" height="400" fill="#f4f1ea"/><path d="M100 250 C 200 80, 300 380, 420 200 S 640 150, 800 240" stroke="#111" stroke-width="10" fill="none"/></svg>`;
    p = await uploadSignature(A, { data: await sharp(Buffer.from(svg)).jpeg().toBuffer() });
    expect(p.signatures.map((s) => s.kind)).toEqual(["typed", "drawn", "uploaded"]);
    expect(files()).toHaveLength(2);
    const img = await signatureImage(A, p.signatures[1].id);
    expect((await sharp(img).metadata()).format).toBe("png");
    // The view never carries storage paths.
    expect(JSON.stringify(publicView(p))).not.toContain("writing/");
  });

  it("screens a typed signature and caps how many are kept", async () => {
    await expect(addSignature(A, { kind: "typed", text: "kys loser", fontId: "allura" })).rejects.toBeInstanceOf(WritingError);
    for (let i = 0; i < 5; i++) await addSignature(A, { kind: "typed", text: `Al ${i}`, fontId: "allura" });
    await expect(addSignature(A, { kind: "typed", text: "One more", fontId: "allura" })).rejects.toMatchObject({ code: "too_many" });
  });

  it("only shows, defaults or deletes a signature for its owner", async () => {
    const p = await addSignature(A, strokes);
    const id = p.signatures[0].id;
    await expect(signatureImage(B, id)).rejects.toMatchObject({ status: 404 });
    await expect(setDefaults(B, { defaultSignatureId: id })).rejects.toMatchObject({ status: 404 });
    await expect(deleteSignature(B, id)).rejects.toMatchObject({ status: 404 });
    const after = await deleteSignature(A, id);
    expect(after.signatures).toHaveLength(0);
    expect(after.defaultSignatureId).toBeUndefined();
    expect(files()).toHaveLength(0);
  });

  it("does not promote another signature when the default is deleted", async () => {
    let p = await addSignature(A, { kind: "typed", text: "Alice", fontId: "allura" });
    p = await addSignature(A, { kind: "typed", text: "Al", fontId: "great_vibes" });
    expect(p.defaultSignatureId).toBe(p.signatures[0].id);
    p = await deleteSignature(A, p.signatures[0].id);
    expect(p.signatures).toHaveLength(1);
    expect(p.defaultSignatureId).toBeUndefined();
  });
});

describe("own handwriting", () => {
  it("builds a style from a sheet photo, renders it for the owner only, and deletes the sheet", async () => {
    const { style, profile } = await createCustomStyle(A, { name: "Alice writes", data: await filledSheet({ rotate: 2 }) });
    expect(profile.defaultStyleId).toBe(style.id);
    expect(style.missing).toEqual([]);
    const r = await renderCustom(A, style.id, "Hello Rosa", { width: 600, height: 300 });
    expect(r.fitted).toBe(true);
    await expect(renderCustom(B, style.id, "Hello", { width: 600, height: 300 })).rejects.toMatchObject({ status: 404 });
    await deleteCustomStyle(A, style.id);
    expect(files()).toHaveLength(0);
    expect((await getWriting(A)).defaultStyleId).toBeUndefined();
  }, 30_000);

  it("explains an unreadable sheet instead of saving it", async () => {
    const blank = await sharp({ create: { width: 900, height: 1100, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    await expect(createCustomStyle(A, { data: blank })).rejects.toMatchObject({ code: "no_markers", status: 422 });
    expect((await getWriting(A)).styles).toHaveLength(0);
  });
});

describe("print resolution", () => {
  it("gives guests presets and a typed signature, and refuses anything saved", async () => {
    const out = await resolveCardWriting(null, CardWritingSchema.parse({ message: "handwritten", styleId: "kalam", signature: { kind: "typed", text: "Sam", fontId: "allura" } }));
    expect(out.messageFont?.length).toBeGreaterThan(1000);
    expect(out.signatureText?.text).toBe("Sam");
    await expect(resolveCardWriting(null, CardWritingSchema.parse({ signature: { kind: "saved", signatureId: "sg_abcdef123" } }))).rejects.toMatchObject({ status: 404 });
    await expect(resolveCardWriting(null, CardWritingSchema.parse({ signature: { kind: "typed", text: "kys loser", fontId: "allura" } }))).rejects.toMatchObject({ code: "bad_text" });
  });

  it("never prints another member's signature or handwriting", async () => {
    const p = await addSignature(A, strokes);
    const sig = { kind: "saved" as const, signatureId: p.signatures[0].id };
    expect((await resolveCardWriting(A, CardWritingSchema.parse({ signature: sig }))).signatureImage?.length).toBeGreaterThan(100);
    await expect(resolveCardWriting(B, CardWritingSchema.parse({ signature: sig }))).rejects.toMatchObject({ status: 404 });
    const { style } = await createCustomStyle(A, { data: await filledSheet() });
    const own = await resolveCardWriting(A, CardWritingSchema.parse({ message: "handwritten", styleId: style.id }));
    expect((await own.renderMessage!("Hi", { width: 500, height: 200 })).fitted).toBe(true);
    // A character this hand can't write makes the message unprintable rather than silently dropped.
    expect((await own.renderMessage!("Hi José", { width: 500, height: 200 })).fitted).toBe(false);
    await expect(resolveCardWriting(B, CardWritingSchema.parse({ message: "handwritten", styleId: style.id }))).rejects.toMatchObject({ status: 404 });
  }, 30_000);
});

describe("export and deletion", () => {
  it("exports the writing summary and deletes every private file with the account", async () => {
    await addSignature(A, strokes);
    await createCustomStyle(A, { data: await filledSheet() });
    await setDefaults(A, { applyToNewCards: true });
    const ex = await exportUserData(A);
    expect(ex.handwritingAndSignatures.signatures).toHaveLength(1);
    expect(ex.handwritingAndSignatures.styles).toHaveLength(1);
    expect(ex.handwritingAndSignatures.applyToNewCards).toBe(true);
    expect(files()).toHaveLength(2);
    await deleteAccount(A);
    expect(files()).toHaveLength(0);
    expect((await getWriting(A)).signatures).toHaveLength(0);
    // Local storage is the same disk the book photos use.
    expect(getBookStorage().localPath("writing/x/y.png")).toContain("storage");
  }, 30_000);
});
