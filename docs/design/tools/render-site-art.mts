// Render the site's sample art: the 12 template covers (docs/cmo/templates.md section 2) and the style swatches that are
// still placeholders. Fictional subjects only, no photos, no real people. Brief: docs/cmo/templates.md section 3.
// Run from pipeline/:
//   node node_modules/tsx/dist/cli.mjs ../docs/design/tools/render-site-art.mts render [slot ...]       3 candidates per slot (resumable)
//   node node_modules/tsx/dist/cli.mjs ../docs/design/tools/render-site-art.mts publish <slot>=<n> ...  write the chosen candidate as the site asset
// Slots are `tpl:<templateId>` or `style:<styleId>`; with no slots, `render` does every template and every unrendered style.
// Candidates go to pipeline/runs/site-art (gitignored). Every publish appends a line to docs/design/site-art/approval-log.csv.
// Reads OPENROUTER_API_KEY from the env or app/.env.local; the key is never printed. Hard cap on the cumulative ledger below.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { OpenRouterClient } from "../../../pipeline/src/openrouter.ts";
import { FileLedger } from "../../../pipeline/src/ledger.ts";
import { guardLines } from "../../../pipeline/src/stages/prompts.ts";
import { hasWhiteBorder, visionCheck } from "../../../pipeline/src/stages/qa.ts";
import { IMAGE_HARDENING_LINES } from "../../../pipeline/src/safety/index.ts";

const CAP_USD = 7;
const CANDIDATES = 3;
const PROMPT_VERSION = "site-art-v1";
const root = resolve(process.cwd(), "..");
const sharp = createRequire(join(root, "pipeline", "package.json"))("sharp");
const art = join(root, "docs", "design", "site-art");
const work = join(root, "pipeline", "runs", "site-art");
mkdirSync(art, { recursive: true });
mkdirSync(work, { recursive: true });

function readKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const f = join(root, "app", ".env.local");
  if (existsSync(f)) for (const line of readFileSync(f, "utf8").split(/\r?\n/)) if (line.startsWith("OPENROUTER_API_KEY=")) return line.slice(19).trim().replace(/^["']|["']$/g, "");
  return "";
}

const libPath = join(root, "docs", "design", "style-library.json");
const lib = JSON.parse(readFileSync(libPath, "utf8"));
const styleString = (id: string) => lib.styles.find((s: { id: string }) => s.id === id).styleString as string;

// Same scenes as render-samples.mts so new swatches sit beside the existing ones.
const CHARACTER_SCENE = "A small child with a round face, short chestnut hair and a yellow raincoat sits in a sunny meadow beside a small orange fox. Wildflowers in the grass, a few soft trees in the distance, open sky. Both characters look happily at each other. Square composition.";
const ORNAMENT_SCENE = "A greeting card front: a centered round wreath of leaves and small flowers with a calm empty center, and a tiny orange fox curled up at the base of the wreath. Square composition.";
const CARD_ONLY_NO_CHARACTER = new Set(["botanical_gouache", "hand_lettered_type", "foil_luxe", "deco_geometric", "maximalist_pattern"]);

// Cover prompts from docs/cmo/templates.md section 2; styles from app/lib/shop/templates.ts. `cast` drives the count line and the vision check.
const TEMPLATES: { id: string; style: string; scene: string; cast: string[] }[] = [
  { id: "big-birthday", style: "bold_cartoon_pop", cast: [], scene: "A giant lopsided birthday cake with too many candles, confetti raining over a bright teal background, empty space at the top for nothing but sky." },
  { id: "for-nonna", style: "watercolor_wash", cast: [], scene: "A sunlit kitchen table with a blue bowl of lemons, a cup of tea and a bunch of wildflowers in a jug, warm morning light through a window." },
  { id: "hello-little-one", style: "watercolor_wash", cast: ["a sleeping baby fox"], scene: "A sleeping baby fox curled in a crescent moon cradle among soft clouds and tiny stars, pastel peach and sage." },
  { id: "thanks-coach", style: "paper_cut_collage", cast: [], scene: "A cut-paper whistle and clipboard beside a crooked trophy on a plum background, layered shapes in orange and mustard. The clipboard is blank." },
  { id: "just-wanted-you-to-know", style: "ink_wash", cast: [], scene: "A single hand-drawn bunch of daisies tied with twine lying on a soft blush wash, generous white space." },
  { id: "forever-starting-now", style: "ink_wash", cast: [], scene: "Two overlapping olive branches forming a loose heart shape, gold accents and dusty rose washes, elegant open space." },
  { id: "get-well-grumpy-bear", style: "bold_cartoon_pop", cast: ["a grumpy bear in striped pajamas"], scene: "An original cartoon bear in striped pajamas wrapped in a blanket with a thermometer and a huge mug of soup, comically glum, bright yellow wall." },
  { id: "merry-and-bright", style: "cozy_gouache", cast: [], scene: "A snowy cabin with glowing windows, a lit fir tree and a small trail of footprints, deep plum night sky with amber lamplight." },
  { id: "mum-you-did-it", style: "paper_cut_collage", cast: [], scene: "A big layered paper flower in blush, persimmon and mustard with a small cut-paper teapot beside it, plum background." },
  { id: "our-summer", style: "cozy_gouache", cast: [], scene: "A small wooden rowboat on a calm lake at golden hour with a picnic basket and fishing rods, forested shoreline, warm gouache light." },
  { id: "night-the-moon-came-down", style: "watercolor_wash", cast: ["a small child seen as a silhouette from behind", "a small dog"], scene: "A glowing round moon resting on a hilltop at night while a small child silhouette and a dog look up at it, deep blue and soft gold." },
  { id: "day-we-moved-in", style: "bold_cartoon_pop", cast: ["a cat"], scene: "A packed removal truck with a wobbling tower of boxes, a houseplant riding up front and a cat perched on top, bright suburban street. Plain unmarked truck and boxes." },
];

type Slot = { slot: string; kind: "tpl" | "style"; id: string; prompt: string; cast: string[]; size: "1K" | "2K"; aspect: string };

function coverPrompt(t: (typeof TEMPLATES)[number]): string {
  const n = t.cast.length;
  return [
    `A greeting card cover illustration, portrait 4:5. ${t.scene}`,
    `GLOBAL STYLE: ${styleString(t.style)}`,
    "FULL-BLEED: the illustration runs edge to edge on all four sides. No white border, no frame, no margin, no vignette fading to white or paper.",
    "FRAMING: the main subject sits fully inside the frame with calm space around it; nothing important in the outer 10%.",
    n === 0 ? "COUNT: no people appear in this image." : `COUNT: EXACTLY ${n} character${n === 1 ? "" : "s"}: ${t.cast.join(", ")}. No other people or animals.`,
    "All characters are original designs, not resembling any existing cartoon, film, game or toy character.",
    "No text, letters, numbers or words anywhere in the image.",
    ...IMAGE_HARDENING_LINES,
  ].join("\n");
}

function slots(): Slot[] {
  const out: Slot[] = TEMPLATES.map((t) => ({ slot: `tpl:${t.id}`, kind: "tpl", id: t.id, prompt: coverPrompt(t), cast: t.cast, size: "2K", aspect: "4:5" }));
  for (const s of lib.styles) {
    if (s.thumbnail.rendered) continue;
    const ornament = CARD_ONLY_NO_CHARACTER.has(s.id);
    const prompt = [
      ornament ? ORNAMENT_SCENE : CHARACTER_SCENE,
      `GLOBAL STYLE: ${s.styleString}`,
      guardLines({ id: "sample", kind: "card_front", scene: "", characters: ornament ? [] : ["child", "fox"] } as never),
    ].join("\n\n");
    out.push({ slot: `style:${s.id}`, kind: "style", id: s.id, prompt, cast: ornament ? [] : ["child", "fox"], size: "1K", aspect: "1:1" });
  }
  return out;
}

const candFile = (slot: string, n: number) => join(work, `${slot.replace(":", "__")}__${n}.jpg`);
const metaPath = join(work, "candidates.json");
type Meta = Record<string, { model: string; size: string; whiteBorder: boolean; text: boolean | null; ipFlags: string[] | null; count: number | null; notes: string; promptVersion: string }>;
const loadMeta = (): Meta => (existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {});

async function render(only: string[]) {
  const ledger = new FileLedger(join(art, "cost_ledger.jsonl"));
  const client = new OpenRouterClient({ apiKey: readKey, ledger, runId: `site-art-${Date.now()}`, spendCapUsd: CAP_USD, log: (m) => console.error(m), backoffMs: { network: 5000, http: 4000 }, maxAttempts: 2 });
  const meta = loadMeta();
  const jobs: { s: Slot; n: number }[] = [];
  for (const s of slots()) if (!only.length || only.includes(s.slot)) for (let n = 1; n <= CANDIDATES; n++) if (!existsSync(candFile(s.slot, n))) jobs.push({ s, n });
  console.error(`${jobs.length} candidates to render; ledger so far $${ledger.totalUsd().toFixed(4)} of $${CAP_USD}`);

  const one = async ({ s, n }: { s: Slot; n: number }) => {
    if (ledger.totalUsd() >= CAP_USD - 0.15) { console.error(`budget guard: stop before ${s.slot}#${n}`); return; }
    const label = `${s.slot}#${n}`;
    const out = await client.image({ content: [{ type: "text", text: s.prompt }], stage: "site_art", label, size: s.size, aspectRatio: s.aspect });
    if (!out) { console.error(`no image for ${label}`); return; }
    const whiteBorder = await hasWhiteBorder(out.data);
    const v = await visionCheck(client, out.data, `${label}:qa`, s.cast.length, s.cast);
    writeFileSync(candFile(s.slot, n), await sharp(out.data).jpeg({ quality: 92 }).toBuffer());
    meta[label] = { model: out.model, size: out.size, whiteBorder, text: v?.raw.text_in_image ?? null, ipFlags: v ? v.ip.flags : null, count: v?.raw.character_count ?? null, notes: v?.raw.notes ?? "", promptVersion: PROMPT_VERSION };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.error(`saved ${label} border=${whiteBorder} text=${meta[label].text} ip=${JSON.stringify(meta[label].ipFlags)} count=${meta[label].count}; ledger $${ledger.totalUsd().toFixed(4)}`);
  };
  // Three at a time: well under OpenRouter rate limits, about a third of the wall time.
  const queue = [...jobs];
  await Promise.all(Array.from({ length: 3 }, async () => { for (let j = queue.shift(); j; j = queue.shift()) await one(j); }));
  console.error(`done; ledger total $${ledger.totalUsd().toFixed(4)}`);
}

async function publish(picks: string[]) {
  const meta = loadMeta();
  const logPath = join(art, "approval-log.csv");
  if (!existsSync(logPath)) writeFileSync(logPath, "date,slot,candidate,files,model,size,prompt_version,qa_white_border,qa_text,qa_ip_flags,approved_by\n");
  const pubTpl = join(root, "app", "public", "templates");
  const masters = join(art, "masters");
  mkdirSync(pubTpl, { recursive: true });
  mkdirSync(masters, { recursive: true });
  let libChanged = false;
  for (const p of picks) {
    // `<slot>=<n>@<pct>` trims pct% off every edge first, for a painted paper margin the white-border check cannot see.
    const [slot, pick] = p.split("=");
    const [nStr, trimStr] = pick.split("@");
    const n = Number(nStr);
    const file = candFile(slot, n);
    let src: Buffer = readFileSync(file);
    if (trimStr) {
      const { width, height } = await sharp(src).metadata();
      const dx = Math.round((width * Number(trimStr)) / 100), dy = Math.round((height * Number(trimStr)) / 100);
      src = await sharp(src).extract({ left: dx, top: dy, width: width - 2 * dx, height: height - 2 * dy }).toBuffer();
    }
    const m = meta[`${slot}#${n}`];
    if (!m) throw new Error(`no candidate ${slot}#${n}`);
    if (m.text || (m.ipFlags && m.ipFlags.length) || m.whiteBorder) throw new Error(`${slot}#${n} failed QA; pick another`);
    const [kind, id] = slot.split(":");
    const files: string[] = [];
    if (kind === "tpl") {
      writeFileSync(join(masters, `${id}.webp`), await sharp(src).resize(1600, 2000, { fit: "cover" }).webp({ quality: 88 }).toBuffer());
      files.push(`docs/design/site-art/masters/${id}.webp`);
      for (const w of [400, 800, 1200]) {
        writeFileSync(join(pubTpl, `${id}-${w}.webp`), await sharp(src).resize(w, w * 1.25, { fit: "cover" }).webp({ quality: 80 }).toBuffer());
        files.push(`app/public/templates/${id}-${w}.webp`);
      }
    } else {
      const jpg = await sharp(src).resize(640, 640, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      writeFileSync(join(root, "app", "public", "styles", `${id}.jpg`), jpg);
      writeFileSync(join(root, "docs", "design", "samples", `${id}.jpg`), jpg);
      files.push(`app/public/styles/${id}.jpg`, `docs/design/samples/${id}.jpg`);
      const s = lib.styles.find((x: { id: string }) => x.id === id);
      s.thumbnail = { file: `${id}.jpg`, rendered: true, note: `Rendered ${new Date().toISOString().slice(0, 10)} at 1K (${PROMPT_VERSION}, best of ${CANDIDATES}). Sample of the style, not yet reviewed against a print proof.` };
      libChanged = true;
    }
    appendFileSync(logPath, [new Date().toISOString().slice(0, 10), slot, pick, files.join(" "), m.model, m.size, m.promptVersion, m.whiteBorder, m.text, (m.ipFlags ?? []).join("|") || "none", "Claude (pending owner review)"].join(",") + "\n");
    console.error(`published ${slot} from candidate ${n}`);
  }
  if (libChanged) writeFileSync(libPath, JSON.stringify(lib, null, 2) + "\n");
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "render") await render(rest);
else if (cmd === "publish") await publish(rest);
else console.error("usage: render-site-art.mts render [slot ...] | publish <slot>=<n> ...");
