import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mockDelayMs } from "../config";
import { PAGE_ID } from "../constants";
import type { AssetVersion, PagePlanLite } from "../types";
import { nextVersionFile, type BookEngine, type EngineCtx, type StoryOut } from "./types";

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SKIES = [
  ["#F6C9C0", "#FDE3D8"],
  ["#F5B83D", "#FBF6EE"],
  ["#5B2A4B", "#E6CFDD"],
  ["#EE5A36", "#FDE3D8"],
  ["#2B1E18", "#6B5A50"],
  ["#E6CFDD", "#F3EADB"],
];
const BODY = ["#EE5A36", "#5B2A4B", "#F5B83D", "#C8441F"];

function figure(x: number, y: number, scale: number, color: string) {
  const s = scale;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-45" y="40" width="90" height="150" rx="38" fill="${color}"/>
    <circle cx="0" cy="0" r="62" fill="#FBF6EE" stroke="#2B1E18" stroke-width="5"/>
    <circle cx="-22" cy="-8" r="7" fill="#2B1E18"/><circle cx="22" cy="-8" r="7" fill="#2B1E18"/>
    <path d="M-24 18 Q0 40 24 18" fill="none" stroke="#2B1E18" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}

/** Placeholder illustration: sky, hills and one simple figure per visible character. 1:1. */
export function pageSvg(opts: { idx: number; label: string; names: string[]; version: number }): string {
  const [a, b] = SKIES[opts.idx % SKIES.length];
  const n = Math.max(1, Math.min(opts.names.length, 4));
  const figs = Array.from({ length: n }, (_, i) => figure(500 + (i - (n - 1) / 2) * 230, 520, n > 2 ? 1 : 1.25, BODY[(i + opts.idx) % BODY.length])).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="1000" height="1000" fill="url(#g)"/>
  <circle cx="${200 + (opts.idx % 5) * 150}" cy="190" r="86" fill="#F5B83D"/>
  <path d="M0 780 Q250 640 520 760 T1000 720 V1000 H0Z" fill="#5B2A4B" opacity="0.88"/>
  <path d="M0 860 Q300 770 600 850 T1000 830 V1000 H0Z" fill="#2B1E18" opacity="0.9"/>
  ${figs}
  <text x="500" y="945" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="30" font-weight="700" fill="#FBF6EE">${esc(opts.label)}${opts.version > 1 ? ` (v${opts.version})` : ""}</text>
  <text x="500" y="75" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="26" font-weight="600" fill="#2B1E18" opacity="0.7">Placeholder art</text>
</svg>`;
}

export function sheetSvg(names: string[], version: number): string {
  const n = Math.max(1, names.length);
  const step = 900 / n;
  const figs = names
    .map((nm, i) => {
      const x = 50 + step * (i + 0.5);
      return `${figure(x, 420, n > 3 ? 0.9 : 1.15, BODY[i % BODY.length])}<text x="${x}" y="760" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="34" font-weight="700" fill="#2B1E18">${esc(nm)}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <rect width="1000" height="1000" fill="#F3EADB"/>${figs}
  <text x="500" y="940" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="26" fill="#6B5A50">Placeholder model sheet (v${version})</text>
</svg>`;
}

const BEATS = [
  "{hero} woke up and noticed something odd. The whole house was holding its breath.",
  "{hero} grabbed a flashlight and tiptoed to the door. {others}Every floorboard seemed to whisper.",
  "Outside, the moon hung low and the trees leaned in close. {hero} took one small, brave step.",
  "Something rustled in the grass. {hero} stopped. Something rustled back.",
  "Two round, shining eyes peeked out from the bushes. {hero} did not run. {hero} waved.",
  "It was only a curious little fox! It tilted its head, as if to say hello.",
  "Together they followed a path of silver leaves, deeper into the quiet woods.",
  "A tiny owl hooted a riddle. {hero} laughed, because the answer was easy.",
  "The path bent and the woods opened up. There, glowing softly, was a surprise nobody expected.",
  "{hero} reached out. The glow was warm, and it hummed a little tune.",
  "One by one the woodland friends gathered round. Nobody was afraid anymore.",
  "They shared a snack, told a joke, and counted every star they could find.",
  "The sky began to turn pink. It was time to head home, and {hero} knew the way.",
  "Back at the door, {hero} looked over a shoulder. The woods winked goodnight.",
  "And in the warm, quiet house, {hero} fell asleep smiling, already dreaming of tomorrow.",
];

export function mockStory(ctx: EngineCtx): StoryOut {
  const { brief, characters } = ctx.job.input;
  const names = characters.map((c) => c.name);
  const hero = names[0] ?? "Our hero";
  const others = names.length > 1 ? `${names.slice(1).join(" and ")} followed close behind. ` : "";
  const n = ctx.job.input.spreads;
  const short = brief.readingAge === "0-2";
  const long = brief.readingAge === "6-8";
  const fill = (s: string) => s.replaceAll("{hero}", hero).replaceAll("{others}", others);
  const pages: PagePlanLite[] = [
    { id: PAGE_ID.cover, kind: "cover", scene: `Cover: ${names.join(", ")} at the edge of the woods`, characters: names, textZone: "top 30% of the image: calm, empty sky or wall for the title" },
  ];
  for (let i = 0; i < n; i++) {
    let text = fill(BEATS[i % BEATS.length]);
    if (short) text = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    if (long) text += ` ${fill(BEATS[(i + 7) % BEATS.length])}`;
    pages.push({ id: `p${i + 1}`, kind: "spread", scene: `Scene ${i + 1}`, characters: i % 3 === 2 ? names.slice(0, 1) : names, text });
  }
  const title = brief.storyIdea ? `${hero} and the Night Woods` : `${hero}'s Big Adventure`;
  return { title, blurb: `${hero} sets out on a ${brief.tone || "gentle"} adventure and finds out the dark is friendlier than it looks.`, pages };
}

export function createMockEngine(opts: { delayMs?: number; failPageIds?: string[] } = {}): BookEngine {
  const delay = () => sleep(opts.delayMs ?? mockDelayMs());
  const fail = new Set(opts.failPageIds ?? (process.env.GREETHUB_MOCK_FAIL_PAGE ?? "").split(",").filter(Boolean));
  const existing = (dir: string) => {
    mkdirSync(dir, { recursive: true });
    return readdirSync(dir);
  };
  return {
    async story(ctx) {
      await delay();
      return mockStory(ctx);
    },
    async sheet(ctx) {
      await delay();
      const file = nextVersionFile(existing(ctx.imagesDir), "modelsheet", "svg");
      const v = Number(/_v(\d+)\./.exec(file)![1]);
      writeFileSync(path.join(ctx.imagesDir, file), sheetSvg(ctx.job.input.characters.map((c) => c.name), v), "utf8");
      return { file, createdAt: new Date().toISOString(), model: "mock" };
    },
    async preparePages() {
      await delay();
    },
    async renderPage(ctx, page, o): Promise<AssetVersion | null> {
      await delay();
      // GREETHUB_MOCK_FAIL_PAGE makes a page fail during the page loop (a retry succeeds) so failed-page states are testable.
      if (fail.has(page.id)) {
        // fails for the whole first job that touches the page (so the automatic retry fails too); later jobs succeed
        const marker = path.join(ctx.imagesDir, `.mockfail_${page.id}`);
        mkdirSync(ctx.imagesDir, { recursive: true });
        if (!existsSync(marker)) writeFileSync(marker, ctx.job.id);
        if (readFileSync(marker, "utf8") === ctx.job.id) return null;
      }
      const files = existing(ctx.imagesDir);
      const file = nextVersionFile(files, page.id, "svg");
      const v = Number(/_v(\d+)\./.exec(file)![1]);
      const idx = page.id === PAGE_ID.cover ? 0 : page.id === PAGE_ID.back ? 99 : Number(page.id.slice(1));
      const label = page.id === PAGE_ID.cover ? "Cover" : page.id === PAGE_ID.back ? "Back cover" : `Page ${idx}`;
      writeFileSync(path.join(ctx.imagesDir, file), pageSvg({ idx, label, names: page.characters, version: v }), "utf8");
      return { file, createdAt: new Date().toISOString(), model: "mock", qaNote: o.note ? `Asked for: ${o.note.slice(0, 80)}` : undefined };
    },
    async layout() {
      await delay();
      return {}; // no PDFs in mock mode
    },
  };
}
