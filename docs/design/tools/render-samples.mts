// Render small sample thumbnails for the style library (one neutral original scene, no photos, no real people).
// Run from pipeline/:  node node_modules/tsx/dist/cli.mjs ../docs/design/tools/render-samples.mts <styleId> [<styleId> ...]
// Reads the API key from the OPENROUTER_API_KEY env var, falling back to the same app/.env.local line the book engine
// reads. The key is never printed. A hard cap applies to the CUMULATIVE ledger in docs/design/samples/cost_ledger.jsonl.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { OpenRouterClient } from "../../../pipeline/src/openrouter.ts";
import { FileLedger } from "../../../pipeline/src/ledger.ts";
import { guardLines } from "../../../pipeline/src/stages/prompts.ts";

const CAP_USD = 0.45;
const root = resolve(process.cwd(), "..");
const sharp = createRequire(join(root, "pipeline", "package.json"))("sharp");
const samples = join(root, "docs", "design", "samples");
mkdirSync(samples, { recursive: true });

function readKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const f = join(root, "app", ".env.local");
  if (existsSync(f)) for (const line of readFileSync(f, "utf8").split(/\r?\n/)) if (line.startsWith("OPENROUTER_API_KEY=")) return line.slice(19).trim().replace(/^["']|["']$/g, "");
  return "";
}

const lib = JSON.parse(readFileSync(join(root, "docs", "design", "style-library.json"), "utf8"));
const ledger = new FileLedger(join(samples, "cost_ledger.jsonl"));
const client = new OpenRouterClient({ apiKey: readKey, ledger, runId: `style-samples-${Date.now()}`, spendCapUsd: CAP_USD, log: (m) => console.error(m), backoffMs: { network: 5000, http: 4000 }, maxAttempts: 2 });

const CHARACTER_SCENE = "A small child with a round face, short chestnut hair and a yellow raincoat sits in a sunny meadow beside a small orange fox. Wildflowers in the grass, a few soft trees in the distance, open sky. Both characters look happily at each other. Square composition.";
const ORNAMENT_SCENE = "A greeting card front: a centered round wreath of leaves and small flowers with a calm empty center, and a tiny orange fox curled up at the base of the wreath. Square composition.";
const CARD_ONLY_NO_CHARACTER = new Set(["botanical_gouache", "hand_lettered_type", "foil_luxe", "deco_geometric", "maximalist_pattern"]);

for (const id of process.argv.slice(2)) {
  const s = lib.styles.find((x: { id: string }) => x.id === id);
  if (!s) { console.error("unknown style", id); continue; }
  if (ledger.totalUsd() >= CAP_USD - 0.03) { console.error(`budget guard: spent ${ledger.totalUsd().toFixed(3)}; stopping`); break; }
  const ornament = CARD_ONLY_NO_CHARACTER.has(id);
  const prompt = [
    ornament ? ORNAMENT_SCENE : CHARACTER_SCENE,
    `GLOBAL STYLE: ${s.styleString}`,
    guardLines({ id: "sample", kind: "card_front", scene: "", characters: ornament ? [] : ["child", "fox"] } as never),
  ].join("\n\n");
  const out = await client.image({ content: [{ type: "text", text: prompt }], stage: "style_sample", label: id, size: "1K", aspectRatio: "1:1" });
  if (!out) { console.error("no image for", id); continue; }
  const jpg = await sharp(out.data).resize(640, 640, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  writeFileSync(join(samples, `${id}.jpg`), jpg);
  console.error(`saved ${id}.jpg (${jpg.length} bytes) via ${out.model}; ledger total $${ledger.totalUsd().toFixed(4)}`);
}
console.error(`ledger total $${ledger.totalUsd().toFixed(4)}`);
