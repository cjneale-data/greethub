import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { CardBrief } from "@greethub/shared";
import { GUEST_PREVIEW_COST_ESTIMATE_USD, dailySpendCapUsd, isMockAi, mockDelayMs, redact } from "./config";
import { mockFrontArt } from "./mock-art";

export type PreviewResult = { front: string; insideMessage: string; title: string; mock: boolean; costUsd: number };

/** In-process spend guard. TODO: replace with the Supabase cost_ledger daily sum once it exists. */
const spend = { day: "", usd: 0 };
export function spendToday(): number {
  const day = new Date().toISOString().slice(0, 10);
  if (spend.day !== day) Object.assign(spend, { day, usd: 0 });
  return spend.usd;
}
export const addSpend = (usd: number) => {
  spendToday();
  spend.usd += usd;
};
export const underDailyCap = () => spendToday() + GUEST_PREVIEW_COST_ESTIMATE_USD <= dailySpendCapUsd();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Repo root of the monorepo (app/ sits inside it next to pipeline/). */
const pipelineDir = () => resolve(process.cwd(), "..", "pipeline");

function runPipeline(briefFile: string, outDir: string, cap: number): Promise<{ ok: boolean; file?: string; costUsd?: number; error?: string }> {
  const dir = pipelineDir();
  const tsx = join(dir, "node_modules", "tsx", "dist", "cli.mjs");
  const runner = resolve(process.cwd(), "lib", "intake", "pipeline-runner.mjs");
  if (!existsSync(tsx)) return Promise.resolve({ ok: false, error: "pipeline_not_installed" });
  return new Promise((done) => {
    // The child inherits env (including the OpenRouter key). Nothing from it is logged.
    const child = spawn(process.execPath, [tsx, runner, briefFile, outDir, String(cap)], { cwd: dir, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (b) => (out += b));
    const timer = setTimeout(() => child.kill(), 180_000);
    child.on("close", () => {
      clearTimeout(timer);
      try {
        done(JSON.parse(out.trim().split("\n").pop() ?? "{}"));
      } catch {
        done({ ok: false, error: "runner_output_unreadable" });
      }
    });
    child.on("error", (e) => done({ ok: false, error: redact(String(e.message)) }));
  });
}

export class PreviewFailed extends Error {}

/** Guest preview: front art only, low-res and watermarked. Mock mode returns brand-palette placeholder art. */
export async function generateGuestPreview(brief: CardBrief): Promise<PreviewResult> {
  const insideMessage = brief.messageWording ?? "";
  const title = `For ${brief.recipient.name}`;
  if (isMockAi()) {
    await sleep(mockDelayMs());
    return { front: mockFrontArt(brief.artStyle, title), insideMessage, title, mock: true, costUsd: 0 };
  }
  const work = mkdtempSync(join(tmpdir(), "greethub-guest-"));
  try {
    const briefFile = join(work, "brief.json");
    writeFileSync(briefFile, JSON.stringify(brief), "utf8");
    const res = await runPipeline(briefFile, work, 0.15);
    if (!res.ok || !res.file) throw new PreviewFailed(res.error ?? "render_failed");
    addSpend(res.costUsd ?? GUEST_PREVIEW_COST_ESTIMATE_USD);
    const jpg = readFileSync(res.file);
    return { front: `data:image/jpeg;base64,${jpg.toString("base64")}`, insideMessage, title, mock: false, costUsd: res.costUsd ?? 0 };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
