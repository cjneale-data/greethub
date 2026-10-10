// Guest card preview runner. Spawned by lib/intake/preview.ts with cwd = pipeline/ via the pipeline's tsx:
//   node pipeline/node_modules/tsx/dist/cli.mjs app/lib/intake/pipeline-runner.mjs <brief.json> <outDir> <capUsd>
// One 1K front render (no model sheet, no people photos), then the pipeline's own watermarked low-res guest proof.
// The API key is read from the inherited environment only and is never printed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [briefFile, outDir, cap] = process.argv.slice(2);
const root = resolve(process.cwd());
const src = (p) => pathToFileURL(join(root, "src", p)).href;

const { ART_STYLES } = await import(pathToFileURL(join(root, "..", "app", "packages", "shared", "src", "index.ts")).href);
const { OpenRouterClient } = await import(src("openrouter.ts"));
const { FileLedger } = await import(src("ledger.ts"));
const { guardLines } = await import(src("stages/prompts.ts"));
const { guestProof } = await import(src("layout/card.ts"));

try {
  const brief = JSON.parse(readFileSync(briefFile, "utf8"));
  mkdirSync(outDir, { recursive: true });
  const ledger = new FileLedger(join(outDir, "cost_ledger.jsonl"));
  const client = new OpenRouterClient({
    apiKey: () => process.env.OPENROUTER_API_KEY ?? "",
    ledger,
    runId: `guest-${Date.now()}`,
    spendCapUsd: Number(cap) || 0.15,
    log: (m) => console.error(m),
  });
  const occasion = brief.occasion === "other" ? brief.occasionOther : String(brief.occasion).replaceAll("_", " ");
  const prompt = [
    `A ${brief.tone} greeting card front illustration for a ${occasion}. 3:4 portrait.`,
    `Scene: ${brief.storyIdea}`,
    brief.include?.length ? `Include: ${brief.include.join("; ")}.` : "",
    brief.avoid?.length ? `Leave out: ${brief.avoid.join("; ")}.` : "",
    `GLOBAL STYLE: ${ART_STYLES[brief.artStyle].prompt}`,
    "Keep the subject centered with calm space around it.",
    guardLines({ id: "front", kind: "card_front", scene: "", characters: [] }),
  ]
    .filter(Boolean)
    .join("\n");
  const img = await client.image({ content: [{ type: "text", text: prompt }], stage: "render", label: "guest_front", size: "1K", aspectRatio: "3:4" });
  if (!img) throw new Error("render_failed");
  const jpg = await guestProof(img.data);
  const file = join(outDir, "guest_proof.jpg");
  writeFileSync(file, jpg);
  console.log(JSON.stringify({ ok: true, file, costUsd: ledger.totalUsd(), model: img.model }));
} catch (e) {
  const msg = String(e?.message ?? e).replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");
  console.log(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
}
