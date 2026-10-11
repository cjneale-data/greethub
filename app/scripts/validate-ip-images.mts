/**
 * Budgeted live validation of the output vision check and the "same theme, different characters" rule.
 *   node ../pipeline/node_modules/tsx/dist/cli.mjs scripts/validate-ip-images.mts <outDir> <capUsd>
 * Renders: 2 x the themed example (two icy sisters, birthday card; the final prompt contains NO real franchise names)
 * and 1 x a control that describes a famous mouse without naming it, to prove the check can fire.
 * Saves small review JPGs and a JSON summary. The key is read from the environment or app/.env.local and never printed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { FileLedger } from "../../pipeline/src/ledger.js";
import { OpenRouterClient } from "../../pipeline/src/openrouter.js";
import { visionCheck } from "../../pipeline/src/stages/qa.js";
import { guardLines } from "../../pipeline/src/stages/prompts.js";
import { fastScreen } from "../lib/safety/fastpass";

const [outDir, cap] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
if (!process.env.OPENROUTER_API_KEY && existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) if (l.startsWith("OPENROUTER_API_KEY=")) process.env.OPENROUTER_API_KEY = l.slice(19).trim().replace(/^["']|["']$/g, "");
}
const ledger = new FileLedger(join(outDir, "cost_ledger.jsonl"));
const client = new OpenRouterClient({ apiKey: () => process.env.OPENROUTER_API_KEY ?? "", ledger, runId: "ip-validate", spendCapUsd: Number(cap), log: () => {} });

const customer = "Anna and Elsa from Frozen on a birthday card: two sisters, icy winter magic, a snowy castle, sparkle";
const screened = fastScreen({ text: customer, field: "card_idea" });
console.log("verdict:", screened.verdict, "| note:", screened.userNote);
console.log("safe idea:", screened.safeText);
const leak = /elsa|anna|frozen|arendelle|olaf|disney/i.test(screened.safeText);
if (leak) throw new Error("franchise name leaked into the safe text");

const base = (scene: string) =>
  [
    "A heartfelt greeting card front illustration for a birthday. 3:4 portrait.",
    `Scene: ${scene}`,
    "GLOBAL STYLE: soft storybook gouache illustration, warm rounded shapes, gentle painterly texture.",
    "Keep the subject centered with calm space around it.",
    guardLines({ id: "front", kind: "card_front", scene: "", characters: [] }).replace(/COUNT: no people or animals appear in this image\./, "COUNT: the characters named in the scene appear, and nobody else."),
  ].join("\n");

const jobs: { label: string; scene: string }[] = [
  { label: "themed_1", scene: screened.safeText },
  { label: "themed_2", scene: screened.safeText },
  { label: "control_mouse", scene: "A cartoon mouse with huge round black ears, red shorts with two white buttons, big yellow shoes and white gloves, waving at a birthday party" },
];

const summary: unknown[] = [];
for (const j of jobs) {
  const img = await client.image({ content: [{ type: "text", text: base(j.scene) }], stage: "render", label: j.label, size: "1K", aspectRatio: "3:4" });
  if (!img) {
    summary.push({ label: j.label, error: "no image" });
    continue;
  }
  const jpg = await sharp(img.data).resize(480, 640, { fit: "inside" }).jpeg({ quality: 72 }).toBuffer();
  writeFileSync(join(outDir, `${j.label}.jpg`), jpg);
  const v = await visionCheck(client, img.data, `qa_${j.label}`, 2, ["the characters in the scene"]);
  summary.push({ label: j.label, model: img.model, ip: v?.ip ?? null, raw: v?.raw ?? null, spentSoFar: Number(ledger.totalUsd().toFixed(4)) });
  console.log(j.label, JSON.stringify(v?.ip), "spent", ledger.totalUsd().toFixed(4));
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify({ customer, screened: { verdict: screened.verdict, note: screened.userNote, safeText: screened.safeText }, results: summary, totalUsd: Number(ledger.totalUsd().toFixed(4)) }, null, 2));
console.log("total", ledger.totalUsd().toFixed(4));
