/**
 * Guest card preview, rendered in the request: one 1K front render, the output IP check with one hardened re-roll, then
 * the pipeline's watermarked low-res guest proof. The pipeline modules are bundled into the server from source rather
 * than spawned through the pipeline's tsx, because a Vercel function only ships app/ and a child process that needs
 * pipeline/node_modules can't start there. Their packages (sharp, pdf-lib, zod) resolve from app/node_modules
 * (next.config.ts). The key is read at call time and never logged.
 */
import type { CardBrief } from "@greethub/shared";
import { styleStringFor } from "@greethub/shared";
import { MemoryLedger } from "../../../pipeline/src/ledger";
import { OpenRouterClient } from "../../../pipeline/src/openrouter";
import { guardLines } from "../../../pipeline/src/stages/prompts";
import { visionCheck } from "../../../pipeline/src/stages/qa";
import { guestProof } from "../../../pipeline/src/layout/card";
import { PAGE_BLOCKED_MESSAGE, logOutputFlagged, logOutputRerolled, rerollAddendum, sanitizeImagePrompt } from "../../../pipeline/src/safety/index";
import type { IpVisionResult } from "../../../pipeline/src/types";
import { guestGuardLines } from "./guest-prompt";
import { openRouterKey, redact } from "./config";

export type GuestRender = { ok: true; jpg: Buffer; costUsd: number; model: string } | { ok: false; error: string; costUsd: number };

export async function renderGuestFront(brief: CardBrief, capUsd: number): Promise<GuestRender> {
  const ledger = new MemoryLedger();
  const client = new OpenRouterClient({
    apiKey: () => openRouterKey() ?? "",
    ledger,
    runId: `guest-${Date.now()}`,
    spendCapUsd: capUsd,
    log: (m) => console.error(redact(m)),
  });
  try {
    const occasion = brief.occasion === "other" ? brief.occasionOther : String(brief.occasion).replaceAll("_", " ");
    const prompt = [
      `A ${brief.tone} greeting card front illustration for a ${occasion}. 3:4 portrait.`,
      `Scene: ${sanitizeImagePrompt(String(brief.storyIdea ?? ""), [brief.recipient?.name ?? ""]).text}`,
      brief.include?.length ? `Include: ${sanitizeImagePrompt(brief.include.join("; "), []).text}.` : "",
      brief.avoid?.length ? `Leave out: ${sanitizeImagePrompt(brief.avoid.join("; "), []).text}.` : "",
      `GLOBAL STYLE: ${styleStringFor(brief.artStyle)}`,
      "Keep the subject centered with calm space around it.",
      // Real cast from the brief; with none, a neutral count line (never "no people or animals" for a scene that has them).
      guestGuardLines(guardLines, brief),
    ]
      .filter(Boolean)
      .join("\n");
    // Render, run the output IP check, re-roll once with a hardened prompt that names the problem, then block (docs/legal/07).
    let img: Awaited<ReturnType<OpenRouterClient["image"]>> = null;
    let flaggedFirst: IpVisionResult["flags"] = [];
    let addendum = "";
    for (let roll = 1; roll <= 2; roll++) {
      img = await client.image({ content: [{ type: "text", text: addendum ? prompt + "\n\n" + addendum : prompt }], stage: "render", label: roll === 1 ? "guest_front" : "guest_front#reroll", size: "1K", aspectRatio: "3:4" });
      if (!img) return { ok: false, error: "render_failed", costUsd: ledger.totalUsd() };
      const v = await visionCheck(client, img.data, roll === 1 ? "qa_guest_front" : "qa_guest_front#reroll", 0, []);
      const flags = v?.ip.flags ?? [];
      if (roll === 2 && flaggedFirst.length) logOutputRerolled({ pageId: "guest_front", flags: flaggedFirst, passedAfterReroll: flags.length === 0 });
      if (!flags.length) break;
      logOutputFlagged({ pageId: "guest_front", flags, lookalikeRisk: v!.ip.lookalikeRisk, isFinal: roll === 2 });
      if (roll === 2) return { ok: false, error: "ip_blocked: " + PAGE_BLOCKED_MESSAGE, costUsd: ledger.totalUsd() };
      flaggedFirst = flags;
      addendum = rerollAddendum(flags, v!.ip.recognizableProtectedCharacter);
    }
    return { ok: true, jpg: await guestProof(img!.data), costUsd: ledger.totalUsd(), model: img!.model };
  } catch (e) {
    return { ok: false, error: redact(String((e as Error)?.message ?? e)), costUsd: ledger.totalUsd() };
  }
}
