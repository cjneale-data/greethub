/**
 * Server-only factory for the IP-safety service. Mock (rules only, free) when GREETHUB_MOCK_AI=1 or no OpenRouter key;
 * otherwise rules plus one Sonnet call. The key is read from env at call time and never logged.
 * Do not import this from client components.
 */
import { TEXT_MODEL, isMockAi, openRouterKey, redact } from "../intake/config";
import { logInputResult } from "./events";
import { createLiveIpSafety, createMockIpSafety, type ModelCaller } from "./service";
import type { IpField, IpInput, IpResult, IpSafetyService } from "./types";

const spend = { usd: 0 };
export const ipScreenSpendUsd = () => spend.usd;

export const openRouterCaller: ModelCaller = async ({ system, user }) => {
  const key = openRouterKey();
  if (!key) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 3000,
        temperature: 0,
        usage: { include: true },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error(redact(`ip screen: OpenRouter ${res.status}`));
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { cost?: number } };
    spend.usd += json.usage?.cost ?? 0;
    return json.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error(redact(`ip screen failed: ${(e as Error).name}`));
    return null;
  }
};

let live: IpSafetyService | null = null;
const mock = createMockIpSafety();

export function getIpSafety(forceMock?: boolean): IpSafetyService {
  if (forceMock ?? isMockAi()) return mock;
  return (live ??= createLiveIpSafety(openRouterCaller));
}

/** Screen one field and log the data event. */
export async function screenField(text: string, field: IpField, opts: { knownNames?: string[]; history?: string[]; mock?: boolean } = {}): Promise<IpResult> {
  const input: IpInput = { text, field, knownNames: opts.knownNames, history: opts.history };
  const r = await getIpSafety(opts.mock).screen(input);
  logInputResult(field, text, r);
  return r;
}

/** Screen several fields in one round trip, logging one event per changed field. */
export async function screenFields(inputs: IpInput[], opts: { mock?: boolean } = {}): Promise<IpResult[]> {
  const out = await getIpSafety(opts.mock).screenBatch(inputs);
  out.forEach((r, i) => logInputResult(inputs[i].field, inputs[i].text, r));
  return out;
}
