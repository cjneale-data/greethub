import type { CardBrief } from "@greethub/shared";
import { GUEST_PREVIEW_COST_ESTIMATE_USD, dailySpendCapUsd, isMockAi, mockDelayMs } from "./config";
import { mockFrontArt } from "./mock-art";
import { renderGuestFront } from "./guest-render";

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

export class PreviewFailed extends Error {}

/** Guest preview: front art only, low-res and watermarked. Mock mode returns brand-palette placeholder art. */
export async function generateGuestPreview(brief: CardBrief): Promise<PreviewResult> {
  const insideMessage = brief.messageWording ?? "";
  const title = `For ${brief.recipient.name}`;
  if (isMockAi()) {
    await sleep(mockDelayMs());
    return { front: mockFrontArt(brief.artStyle, title), insideMessage, title, mock: true, costUsd: 0 };
  }
  const res = await renderGuestFront(brief, 0.25);
  addSpend(res.ok ? res.costUsd || GUEST_PREVIEW_COST_ESTIMATE_USD : res.costUsd);
  if (!res.ok) throw new PreviewFailed(res.error);
  return { front: `data:image/jpeg;base64,${res.jpg.toString("base64")}`, insideMessage, title, mock: false, costUsd: res.costUsd };
}
