import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CARD_PX } from "../../../pipeline/src/layout/card";
import { PICKER_STYLES } from "../intake/knowledge/styles/picker.generated";
import type { StockCard } from "./types";

/** Front art for a stock card: app/public/stock/<id>.webp when it exists, else a clean placeholder drawn from the brief and style. No text in it, so it needs no fonts. */
export async function stockFrontArt(card: Pick<StockCard, "id" | "styleId" | "frontArtBrief">): Promise<Buffer> {
  const file = path.join(process.cwd(), "public", "stock", `${path.basename(card.id)}.webp`);
  if (existsSync(file)) return sharp(readFileSync(file)).resize(CARD_PX.w, CARD_PX.h, { fit: "cover" }).png().toBuffer();
  return placeholderFront(card);
}

function hash(s: string): () => number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Shapes are seeded by the art brief so each card looks different but the same card always looks the same. */
export async function placeholderFront(card: Pick<StockCard, "id" | "styleId" | "frontArtBrief">): Promise<Buffer> {
  const sw = PICKER_STYLES.find((s) => s.id === card.styleId)?.swatches ?? ["#FBF6EE", "#F6C9C0", "#FDE3D8", "#C8441F", "#2B1E18"];
  const [bg, a, b, accent, ink] = [sw[0], sw[1] ?? sw[0], sw[2] ?? sw[1], sw[3] ?? sw[0], sw[4] ?? "#2B1E18"];
  const rnd = hash(`${card.id}|${card.frontArtBrief ?? ""}`);
  const { w, h } = CARD_PX;
  const dots = Array.from({ length: 9 }, () => {
    const r = 60 + rnd() * 150;
    return `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h * 0.55).toFixed(0)}" r="${r.toFixed(0)}" fill="${rnd() > 0.5 ? a : b}" opacity="0.7"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${bg}"/>${dots.join("")}
<circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.22}" fill="${accent}"/>
<circle cx="${w / 2}" cy="${h * 0.42}" r="${w * 0.1}" fill="${bg}"/>
<path d="M0 ${h * 0.74} Q${w * 0.25} ${h * 0.66} ${w * 0.5} ${h * 0.74} T${w} ${h * 0.72} V${h} H0 Z" fill="${a}"/>
<path d="M0 ${h * 0.85} Q${w * 0.3} ${h * 0.78} ${w * 0.6} ${h * 0.86} T${w} ${h * 0.84} V${h} H0 Z" fill="${ink}" opacity="0.2"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
