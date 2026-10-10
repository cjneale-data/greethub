import sharp from "sharp";
import type { ContentPart } from "./openrouter.js";

/** Downscale a photo for vision/reference use to keep input tokens low. */
export async function photoPart(buf: Buffer, maxEdge = 1024): Promise<ContentPart> {
  const jpg = await sharp(buf).rotate().resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  return { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpg.toString("base64")}` } };
}

export async function pngPart(buf: Buffer, maxEdge = 1024): Promise<ContentPart> {
  return photoPart(buf, maxEdge);
}

/** Pull the first JSON object out of a model reply that may have prose or code fences around it. */
export function extractJson<T = unknown>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in model reply");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
