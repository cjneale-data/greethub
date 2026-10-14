import sharp from "sharp";
import { TEMPLATE_GLYPHS } from "@greethub/shared";
import { GRID, templateSvg } from "@/lib/writing/glyphs";

const cache = new Map<string, Promise<Buffer>>();

/** A "filled-in" template: the real template plus one dark character per box, as a phone photo would see it. Cached per
 *  options: these renders are CPU-heavy and the suite runs in parallel with time-sensitive tests. */
export function filledSheet(opts: { rotate?: number; skip?: string[] } = {}): Promise<Buffer> {
  const key = JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, render(opts));
  return cache.get(key)!;
}

async function render(opts: { rotate?: number; skip?: string[] }) {
  const skip = new Set(opts.skip ?? []);
  const ink = TEMPLATE_GLYPHS.map((ch, i) => {
    if (skip.has(ch)) return "";
    const x = GRID.x0 + (i % GRID.cols) * GRID.cellW + GRID.cellW / 2;
    const y = GRID.y0 + Math.floor(i / GRID.cols) * GRID.cellH + 0.2 + (GRID.cellH - 0.25) * 0.7;
    const t = ch.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    return `<text x="${x * 100}" y="${y * 100}" text-anchor="middle" font-family="serif" font-size="46" fill="#1a1a40">${t}</text>`;
  }).join("");
  const page = templateSvg().replace("</svg>", `${ink}</svg>`);
  const flat = await sharp(Buffer.from(page), { density: 110 }).flatten({ background: "#fff" }).png().toBuffer();
  let img = sharp(flat).extend({ top: 60, bottom: 60, left: 60, right: 60, background: "#9a9a9a" });
  if (opts.rotate) img = sharp(await img.png().toBuffer()).rotate(opts.rotate, { background: "#9a9a9a" });
  return img.jpeg({ quality: 88 }).toBuffer();
}
