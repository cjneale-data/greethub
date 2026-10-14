import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  SIGNATURE_FONT_IDS, isCustomStyle, isPresetStyle, presetById, signatureFontById,
  type CardWriting,
} from "@greethub/shared";
import { docs } from "../store";
import { newId } from "../shop/store";
import { checkText } from "../intake/guardrails";
import { extractSheet, renderHandwriting, signatureFromPhoto, signatureFromStrokes, SheetError, SignatureError, type RenderOptions, type Stroke } from "./glyphs";
import { writingPath, writingStorage } from "./storage";
import { MAX_CUSTOM_STYLES, MAX_SIGNATURES, type CustomStyle, type SignatureRec, type WritingProfile } from "./types";

export class WritingError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const empty = (): WritingProfile => ({ styles: [], signatures: [] });
const shortId = (prefix: "custom" | "sg") => newId(prefix).replace(/[^a-z0-9_]/g, "").toLowerCase();

export async function getWriting(userId: string): Promise<WritingProfile> {
  return (await docs().get("writing", userId)) ?? empty();
}

/** What the account page and the card creator see: no storage paths, no glyph boxes. */
export function publicView(p: WritingProfile) {
  return {
    defaultStyleId: p.defaultStyleId ?? null,
    defaultSignatureId: p.defaultSignatureId ?? null,
    applyToNewCards: !!p.applyToNewCards,
    styles: p.styles.map((s) => ({ id: s.id, name: s.name, missing: s.missing, createdAt: s.createdAt })),
    signatures: p.signatures.map((s) => ({ id: s.id, kind: s.kind, label: s.label, text: s.text, fontId: s.fontId, width: s.width, height: s.height, createdAt: s.createdAt })),
  };
}
export type WritingView = ReturnType<typeof publicView>;

const ownsStyle = (p: WritingProfile, id: string) => isPresetStyle(id) || p.styles.some((s) => s.id === id);
const ownsSignature = (p: WritingProfile, id: string) => p.signatures.some((s) => s.id === id);

export const DefaultsSchema = z.object({ defaultStyleId: z.string().max(64).nullable().optional(), defaultSignatureId: z.string().max(64).nullable().optional(), applyToNewCards: z.boolean().optional() });

export async function setDefaults(userId: string, input: unknown): Promise<WritingProfile> {
  const d = DefaultsSchema.parse(input);
  const cur = await getWriting(userId);
  if (d.defaultStyleId && !ownsStyle(cur, d.defaultStyleId)) throw new WritingError(404, "no_style", "We couldn't find that handwriting style.");
  if (d.defaultSignatureId && !ownsSignature(cur, d.defaultSignatureId)) throw new WritingError(404, "no_signature", "We couldn't find that signature.");
  return (await docs().mutate("writing", userId, (p) => {
    const next = p ?? empty();
    if (d.defaultStyleId !== undefined) next.defaultStyleId = d.defaultStyleId ?? undefined;
    if (d.defaultSignatureId !== undefined) next.defaultSignatureId = d.defaultSignatureId ?? undefined;
    if (d.applyToNewCards !== undefined) next.applyToNewCards = d.applyToNewCards;
    return next;
  }))!;
}

/* ---------- custom handwriting ---------- */

const nameOf = (raw: unknown, fallback: string) => (typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 40) : fallback);

export async function createCustomStyle(userId: string, input: { name?: string; data: Uint8Array }): Promise<{ profile: WritingProfile; style: CustomStyle }> {
  if (input.data.byteLength > MAX_UPLOAD_BYTES) throw new WritingError(413, "too_big", "That photo is over 12 MB. Try a smaller one.");
  const cur = await getWriting(userId);
  if (cur.styles.length >= MAX_CUSTOM_STYLES) throw new WritingError(422, "too_many", `You can keep up to ${MAX_CUSTOM_STYLES} handwriting styles. Delete one first.`);
  const name = nameOf(input.name, "My handwriting");
  const v = checkText(name, { nameLike: true });
  if (v && !v.ok) throw new WritingError(422, "bad_name", "Try a different name for this style.");
  let sheet;
  try {
    sheet = await extractSheet(input.data);
  } catch (e) {
    if (e instanceof SheetError) throw new WritingError(422, e.code, e.message);
    throw e;
  }
  const id = shortId("custom") as CustomStyle["id"];
  const sheetPath = writingPath(userId, `${id}.png`);
  await writingStorage().putPrivate(sheetPath, sheet.png, "image/png");
  const style: CustomStyle = { id, name, sheetPath, em: sheet.em, glyphs: sheet.glyphs, missing: sheet.missing, createdAt: new Date().toISOString() };
  let full = false;
  const profile = await commitOrClean(sheetPath, () =>
    docs().mutate("writing", userId, (p) => {
      const next = p ?? empty();
      full = next.styles.length >= MAX_CUSTOM_STYLES;
      if (full) return next;
      next.styles.push(style);
      next.defaultStyleId ??= id;
      return next;
    }),
  );
  if (full) {
    await removeQuietly(sheetPath);
    throw new WritingError(422, "too_many", `You can keep up to ${MAX_CUSTOM_STYLES} handwriting styles. Delete one first.`);
  }
  return { profile, style };
}

export async function deleteCustomStyle(userId: string, id: string): Promise<WritingProfile> {
  let gone: CustomStyle | undefined;
  const profile = (await docs().mutate("writing", userId, (p) => {
    const next = p ?? empty();
    gone = next.styles.find((s) => s.id === id);
    next.styles = next.styles.filter((s) => s.id !== id);
    if (next.defaultStyleId === id) next.defaultStyleId = undefined;
    return next;
  }))!;
  if (!gone) throw new WritingError(404, "no_style", "We couldn't find that handwriting style.");
  await removeQuietly(gone.sheetPath);
  return profile;
}

/** Message set in a member's own handwriting. Ownership is the lookup itself: only this user's profile is searched. */
export async function renderCustom(userId: string, styleId: string, text: string, o: RenderOptions) {
  const p = await getWriting(userId);
  const style = p.styles.find((s) => s.id === styleId);
  if (!style) throw new WritingError(404, "no_style", "We couldn't find that handwriting style.");
  const sheet = await writingStorage().read(style.sheetPath);
  return renderHandwriting({ sheet, em: style.em, glyphs: style.glyphs }, text, o);
}

/* ---------- signatures ---------- */

const StrokesSchema = z.object({
  kind: z.literal("drawn"),
  label: z.string().max(40).optional(),
  canvas: z.object({ w: z.number().int().min(50).max(2000), h: z.number().int().min(30).max(1000) }),
  strokes: z.array(z.array(z.object({ x: z.number(), y: z.number() })).max(2000)).max(60),
});
const TypedSchema = z.object({ kind: z.literal("typed"), label: z.string().max(40).optional(), text: z.string().trim().min(1).max(40), fontId: z.enum(SIGNATURE_FONT_IDS) });
export const SignatureInputSchema = z.discriminatedUnion("kind", [StrokesSchema, TypedSchema]);

async function addSignatureRec(userId: string, rec: SignatureRec): Promise<WritingProfile> {
  let full = false;
  const profile = await commitOrClean(rec.path, () =>
    docs().mutate("writing", userId, (p) => {
      const next = p ?? empty();
      full = next.signatures.length >= MAX_SIGNATURES;
      if (full) return next;
      next.signatures.push(rec);
      next.defaultSignatureId ??= rec.id;
      return next;
    }),
  );
  if (full) {
    if (rec.path) await removeQuietly(rec.path);
    throw new WritingError(422, "too_many", `You can keep up to ${MAX_SIGNATURES} signatures. Delete one first.`);
  }
  return profile;
}

/** Runs the profile write; if it fails, the file just stored for it is removed so nothing is left unreferenced. */
async function commitOrClean(path_: string | undefined, write: () => Promise<WritingProfile | undefined>): Promise<WritingProfile> {
  try {
    return (await write())!;
  } catch (e) {
    if (path_) await removeQuietly(path_);
    throw e;
  }
}

/** Storage deletes never block the user, but a failure is logged with the path so it can be retried by hand. */
async function removeQuietly(path_: string) {
  try {
    await writingStorage().remove(path_);
  } catch (e) {
    console.error("writing: private file not removed", { path: path_, error: e instanceof Error ? e.message : String(e) });
  }
}

async function roomForSignature(userId: string) {
  if ((await getWriting(userId)).signatures.length >= MAX_SIGNATURES) throw new WritingError(422, "too_many", `You can keep up to ${MAX_SIGNATURES} signatures. Delete one first.`);
}

export async function addSignature(userId: string, input: unknown): Promise<WritingProfile> {
  const parsed = SignatureInputSchema.safeParse(input);
  if (!parsed.success) throw new WritingError(400, "bad_request", "Sign in the box first.");
  await roomForSignature(userId);
  const id = shortId("sg") as SignatureRec["id"];
  const createdAt = new Date().toISOString();
  const s = parsed.data;
  if (s.kind === "typed") {
    const v = checkText(s.text, { nameLike: true });
    if (!v.ok) throw new WritingError(422, "bad_text", "Try just your name, or the name you sign cards with.");
    return addSignatureRec(userId, { id, kind: "typed", label: nameOf(s.label, s.text), text: s.text, fontId: s.fontId, createdAt });
  }
  let img;
  try {
    img = await signatureFromStrokes(s.strokes as Stroke[], s.canvas);
  } catch (e) {
    if (e instanceof SignatureError) throw new WritingError(422, e.code, e.message);
    throw e;
  }
  const p = writingPath(userId, `${id}.png`);
  await writingStorage().putPrivate(p, img.png, "image/png");
  return addSignatureRec(userId, { id, kind: "drawn", label: nameOf(s.label, "Drawn signature"), path: p, width: img.width, height: img.height, createdAt });
}

export async function uploadSignature(userId: string, input: { label?: string; data: Uint8Array }): Promise<WritingProfile> {
  if (input.data.byteLength > MAX_UPLOAD_BYTES) throw new WritingError(413, "too_big", "That photo is over 12 MB. Try a smaller one.");
  await roomForSignature(userId);
  let img;
  try {
    img = await signatureFromPhoto(input.data);
  } catch (e) {
    if (e instanceof SignatureError) throw new WritingError(422, e.code, e.message);
    throw e;
  }
  const id = shortId("sg") as SignatureRec["id"];
  const p = writingPath(userId, `${id}.png`);
  await writingStorage().putPrivate(p, img.png, "image/png");
  return addSignatureRec(userId, { id, kind: "uploaded", label: nameOf(input.label, "Uploaded signature"), path: p, width: img.width, height: img.height, createdAt: new Date().toISOString() });
}

export async function deleteSignature(userId: string, id: string): Promise<WritingProfile> {
  let gone: SignatureRec | undefined;
  const profile = (await docs().mutate("writing", userId, (p) => {
    const next = p ?? empty();
    gone = next.signatures.find((s) => s.id === id);
    next.signatures = next.signatures.filter((s) => s.id !== id);
    // Never promote another signature: with "every new card" on, that would sign cards with one they didn't pick.
    if (next.defaultSignatureId === id) next.defaultSignatureId = undefined;
    return next;
  }))!;
  if (!gone) throw new WritingError(404, "no_signature", "We couldn't find that signature.");
  if (gone.path) await removeQuietly(gone.path);
  return profile;
}

/** PNG of a drawn or uploaded signature, for its owner only. */
export async function signatureImage(userId: string, id: string): Promise<Buffer> {
  const s = (await getWriting(userId)).signatures.find((x) => x.id === id);
  if (!s?.path) throw new WritingError(404, "no_signature", "We couldn't find that signature.");
  return writingStorage().read(s.path);
}

/* ---------- print ---------- */

const FONT_DIR = () => path.join(process.cwd(), "public", "fonts", "handwriting");
export const fontBytes = (file: string) => readFile(path.join(FONT_DIR(), path.basename(file)));

/**
 * Everything the print layout needs for a card's inside, resolved and ownership-checked for `userId`
 * (null for a guest, who can only use presets and a typed signature). Throws WritingError(404) when the card points at a
 * custom style or saved signature the user doesn't own, so a forged brief can never print someone else's signature.
 */
export async function resolveCardWriting(userId: string | null, w: CardWriting | undefined) {
  const out: {
    messageFont?: Buffer;
    sizeScale?: number;
    renderMessage?: (text: string, o: RenderOptions) => Promise<{ png: Buffer; fitted: boolean }>;
    signatureImage?: Buffer;
    signatureText?: { text: string; font: Buffer };
  } = {};
  if (!w) return out;
  const profile = userId ? await getWriting(userId) : empty();
  if (w.message === "handwritten" && w.styleId) {
    const preset = presetById(w.styleId);
    if (preset) {
      out.messageFont = await fontBytes(preset.file);
      out.sizeScale = preset.sizeScale;
    } else if (isCustomStyle(w.styleId) && userId && profile.styles.some((s) => s.id === w.styleId)) {
      const styleId = w.styleId;
      out.renderMessage = async (text, o) => {
        const r = await renderCustom(userId, styleId, text, o);
        return { png: r.png, fitted: r.fitted && r.unsupported.length === 0 };
      };
    } else throw new WritingError(404, "no_style", "We couldn't find that handwriting style.");
  }
  const sig = w.signature;
  if (sig.kind === "typed") {
    // Typed on the card itself (guests too): screened like the sign-off before it can print.
    const v = checkText(sig.text, { nameLike: true });
    if (!v.ok) throw new WritingError(422, "bad_text", "Try just your name, or the name you sign cards with.");
    const font = signatureFontById(sig.fontId)!;
    out.signatureText = { text: sig.text, font: await fontBytes(font.file) };
  } else if (sig.kind === "saved") {
    const rec = profile.signatures.find((s) => s.id === sig.signatureId);
    if (!userId || !rec) throw new WritingError(404, "no_signature", "We couldn't find that signature.");
    if (rec.kind === "typed") out.signatureText = { text: rec.text!, font: await fontBytes(signatureFontById(rec.fontId!)!.file) };
    else out.signatureImage = await writingStorage().read(rec.path!);
  }
  return out;
}

/* ---------- export and deletion ---------- */

export async function exportWriting(userId: string) {
  const p = await getWriting(userId);
  return { ...publicView(p), note: "Handwriting sheets and signature images are private files. Ask support for copies, or download each signature from your account." };
}

export async function deleteWriting(userId: string): Promise<void> {
  const p = await docs().get("writing", userId);
  if (!p) return;
  for (const path_ of [...p.styles.map((s) => s.sheetPath), ...p.signatures.flatMap((s) => (s.path ? [s.path] : []))]) {
    await removeQuietly(path_);
  }
  await docs().remove("writing", userId);
}

export { SheetError, SignatureError };
