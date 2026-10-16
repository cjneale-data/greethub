import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { StorageAdapter } from "../adapters/types";
import { moderatePhoto, type ModerationWarning } from "../book/moderation";
import { readImageInfo } from "../book/imageInfo";
import { analyzePhoto } from "../collage/place";
import { PHOTO_CARD_LIMITS, PHOTO_RETENTION_DAYS, type IntakeLimits } from "./constants";
import { SetError, type StoredPhoto } from "./types";

export type SetStorage = StorageAdapter & { read(path: string): Promise<Buffer> };

export const newSetId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

/** Ids end up in storage paths: letters, digits, dash and underscore only. */
export const safeSegment = (s: string) => {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(s)) throw new SetError(400, "bad_id", "That id isn't valid.");
  return s;
};

const BLOCKED = "We can't use that photo. Try another one.";

/** HEIC and HEIF files start with an ISO box: size, "ftyp", then a brand. The browser normally converts them first. */
function looksHeic(b: Uint8Array): boolean {
  if (b.length < 12) return false;
  const t = Buffer.from(b.subarray(4, 12)).toString("latin1");
  return t.startsWith("ftyp") && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(t.slice(4, 8));
}

export type IngestResult = { photo: StoredPhoto; warnings: ModerationWarning[] };

/**
 * One photo in, one stored photo out. Order matters and mirrors book addPhoto (security 2.1): byte cap, type sniff from
 * the bytes, size floors, free local clean-up, then the paid moderation call, then storage. Nothing is stored when
 * moderation blocks, halts or is unavailable. The caller has already checked consent (nothing here runs without it).
 *
 * Clean-up: decode with a pixel limit, apply EXIF orientation, cap the long edge, re-encode as JPEG. sharp writes no
 * metadata unless asked, so EXIF (GPS, device, time) and ICC are gone from both the original and the preview.
 * HEIC is converted if this sharp build can decode it; otherwise the customer is asked to convert (415).
 */
export async function ingestPhoto(
  d: { storage: SetStorage; mock: boolean; now?: () => Date },
  input: { userId: string; setId: string; data: Uint8Array; consentId: string; limits?: IntakeLimits; photoId?: string; deleteBy?: Date },
): Promise<IngestResult> {
  const lim = input.limits ?? PHOTO_CARD_LIMITS;
  const now = (d.now ?? (() => new Date()))();
  if (input.data.byteLength > lim.maxBytes) throw new SetError(413, "too_big", "That photo is over 10 MB. Try a smaller one.");

  const heic = looksHeic(input.data);
  const info = readImageInfo(input.data);
  if (!info && !heic) throw new SetError(415, "bad_type", "We can only use JPG, PNG or HEIC photos.");
  if (info && info.width * info.height > lim.maxPixels) throw new SetError(422, "too_large", "That photo is too large to process. Try a smaller one.");
  if (info && Math.min(info.width, info.height) < lim.minShortEdge) throw new SetError(422, "too_small", "This one is too small to print well. Try a bigger photo.");

  // Free local decode and clean-up first, so metadata never reaches the moderation vendor in live mode.
  let cleaned: { data: Buffer; width: number; height: number };
  try {
    const out = await sharp(input.data, { limitInputPixels: lim.maxPixels })
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize({ width: lim.maxEdge, height: lim.maxEdge, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: lim.jpegQuality })
      .toBuffer({ resolveWithObject: true });
    cleaned = { data: out.data, width: out.info.width, height: out.info.height };
  } catch {
    if (heic) throw new SetError(415, "heic_unsupported", "We couldn't read that HEIC photo. Save it as a JPG and try again.");
    throw new SetError(422, "unreadable", "We couldn't read that photo. Try another one.");
  }
  if (heic && Math.min(cleaned.width, cleaned.height) < lim.minShortEdge) throw new SetError(422, "too_small", "This one is too small to print well. Try a bigger photo.");

  // Mock markers (GH_TEST_MODERATION:<kind>) live in the raw bytes, which the re-encode drops, so mock mode checks the raw upload.
  const mod = await moderatePhoto(d.mock && !heic ? input.data : cleaned.data, {
    contentType: d.mock && !heic ? (info?.type ?? "image/jpeg") : "image/jpeg",
    userId: input.userId,
    projectId: input.setId,
    mock: d.mock,
  });
  if (mod.halt || !mod.ok) throw new SetError(422, "photo_blocked", BLOCKED);
  if (mod.unavailable) throw new SetError(503, "photo_check_unavailable", "We couldn't check that photo just now. Try again in a moment.");

  const preview = await sharp(cleaned.data)
    .resize({ width: lim.previewEdge, height: lim.previewEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  const focus = await analyzePhoto("x", cleaned.data)
    .then((a): NonNullable<StoredPhoto["focus"]> => ({ x: a.focusX, y: a.focusY, source: a.focusSource === "attention" ? "attention" : "center" }))
    .catch((): NonNullable<StoredPhoto["focus"]> => ({ x: 0.5, y: 0.5, source: "center" }));

  const id = input.photoId ?? newSetId("ph");
  const base = `photo-sets/${safeSegment(input.userId)}/${safeSegment(input.setId)}`;
  const path = `${base}/photos/${safeSegment(id)}.jpg`;
  const previewPath = `${base}/previews/${id}.jpg`;
  await d.storage.putPrivate(path, cleaned.data, "image/jpeg");
  await d.storage.putPrivate(previewPath, preview, "image/jpeg");

  return {
    photo: {
      id,
      path,
      previewPath,
      contentType: "image/jpeg",
      bytes: cleaned.data.byteLength,
      width: cleaned.width,
      height: cleaned.height,
      createdAt: now.toISOString(),
      consentId: input.consentId,
      expiresAt: (input.deleteBy ?? new Date(now.getTime() + PHOTO_RETENTION_DAYS * 86_400_000)).toISOString(),
      focus,
    },
    warnings: mod.warnings,
  };
}
