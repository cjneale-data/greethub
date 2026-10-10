import { MAX_PHOTO_BYTES, MIN_PHOTO_SHORT_EDGE } from "./constants";

/** Browser only. Validates a picked photo, converts HEIC, downsizes to at most 1600px and re-encodes as JPEG. */
export class PhotoError extends Error {}

const MAX_EDGE = 1600;
const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
const okType = (f: File) => /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name) || isHeic(f);

async function decode(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!okType(file)) throw new PhotoError("We can use JPG, PNG or HEIC photos.");
  if (file.size > MAX_PHOTO_BYTES) throw new PhotoError("That photo is over 10 MB. Try a smaller one.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(file);
  } catch {
    if (!isHeic(file)) throw new PhotoError("We couldn't read that photo. Try a JPG or PNG.");
    try {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      bitmap = await decode(Array.isArray(out) ? out[0] : out);
    } catch {
      throw new PhotoError("We couldn't read that HEIC photo. Try a JPG or PNG.");
    }
  }

  if (Math.min(bitmap.width, bitmap.height) < MIN_PHOTO_SHORT_EDGE) {
    bitmap.close();
    throw new PhotoError("This one is too small. Try a bigger photo with one clear face.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("Your browser can't prepare photos. Try another one.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new PhotoError("We couldn't prepare that photo. Try another.");
  return { blob, width, height };
}
