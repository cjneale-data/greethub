"use client";

/**
 * Browser only. Shrinks a handwriting-sheet or signature photo before upload: hosted functions cap request bodies
 * (Vercel at 4.5 MB) and a full-size phone photo is often bigger. Converts HEIC, honours EXIF rotation, re-encodes JPEG.
 * 2800 px on the long edge keeps the sheet at ~250 px per inch, well above what extraction needs.
 */
export class UploadError extends Error {}

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
const okType = (f: File) => /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name) || isHeic(f);
export const UPLOAD_ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif";

export async function prepareUpload(file: File, maxEdge = 2800): Promise<Blob> {
  if (!okType(file)) throw new UploadError("We can use JPG, PNG or HEIC photos.");
  if (file.size > 40 * 1024 * 1024) throw new UploadError("That photo is over 40 MB. Try a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (!isHeic(file)) throw new UploadError("We couldn't read that photo. Try a JPG or PNG.");
    try {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
      bitmap = await createImageBitmap(Array.isArray(out) ? out[0] : out, { imageOrientation: "from-image" });
    } catch {
      throw new UploadError("We couldn't read that HEIC photo. Try a JPG or PNG.");
    }
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UploadError("Your browser can't prepare photos. Try another one.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  if (!blob) throw new UploadError("We couldn't prepare that photo. Try another.");
  return blob;
}
