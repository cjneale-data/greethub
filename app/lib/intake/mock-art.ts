import type { ArtStyleId } from "@greethub/shared";

/** Brand-palette placeholder art for mock mode: a watermarked 600x840 SVG data URL. No network, no cost. */
import { PICKER_STYLES } from "./knowledge/styles/picker.generated";

/** Placeholder palette per style, taken from the style library swatches. */
const paletteFor = (id: ArtStyleId): [string, string, string, string] => {
  const sw = PICKER_STYLES.find((s) => s.id === id)?.swatches ?? ["#FBF6EE", "#F6C9C0", "#FDE3D8", "#C8441F", "#2B1E18"];
  return [sw[3] ?? sw[0], sw[0], sw[1], sw[4] ?? sw[2]];
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function mockFrontArt(style: ArtStyleId, caption: string): string {
  const [bg, a, b, ink] = paletteFor(style);
  const marks: string[] = [];
  for (let y = 100; y < 840; y += 170) {
    for (let x = -40; x < 600; x += 280) {
      marks.push(`<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})" font-family="sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,0.5)" stroke="rgba(43,30,24,0.25)" stroke-width="1">GreetHub preview</text>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840">
<rect width="600" height="840" fill="${bg}"/>
<circle cx="440" cy="190" r="86" fill="${b}"/>
<path d="M0 560 Q150 470 300 560 T600 540 V840 H0 Z" fill="${a}"/>
<path d="M0 650 Q200 580 380 660 T600 630 V840 H0 Z" fill="${ink}" opacity="0.22"/>
<g fill="${ink}" opacity="0.9"><rect x="296" y="400" width="8" height="170" rx="4"/><circle cx="300" cy="388" r="36" fill="${b}"/><circle cx="300" cy="388" r="14" fill="${a}"/></g>
<g><rect x="150" y="460" width="6" height="110" rx="3" fill="${ink}"/><circle cx="153" cy="450" r="24" fill="${a}"/><rect x="450" y="480" width="6" height="90" rx="3" fill="${ink}"/><circle cx="453" cy="470" r="22" fill="${b}"/></g>
<text x="300" y="760" text-anchor="middle" font-family="sans-serif" font-size="22" fill="${ink}" opacity="0.8">${esc(caption.slice(0, 40))}</text>
${marks.join("")}
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
