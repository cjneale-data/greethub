/**
 * Photo moderation seam (docs/legal/06 req 17, 18). Runs on every upload BEFORE the photo is stored or sent to any
 * image model.
 *
 * Live: one vision call to a cheap classifier through OpenRouter (default google/gemini-2.5-flash-lite, override with
 * GREETHUB_MODERATION_MODEL; a paid route, never a ":free" one, because photos must not go to unpaid tiers, req 9).
 * Hard blocks: nudity or sexual content, sexual content involving minors, graphic violence.
 * Warning only (never blocks): a large visible logo or a licensed-character costume; the image prompts redraw such
 * clothing plain.
 *
 * Mock mode (GREETHUB_MOCK_AI=1 or no key): passes everything unless the bytes contain the test marker
 * "GH_TEST_MODERATION:<sexual|minor_sexual|violence|logo|costume>" so the flow can be tested without a network.
 *
 * CSAM hook: a "minor_sexual" result HALTS processing. The image is not stored, not displayed and not forwarded, and
 * `csamHook` is called with metadata only (no image bytes). The legal reporting procedure is a TODO for the attorney
 * in docs/legal/07-ip-safety-design.md section 9.
 */
import { isMockMode } from "./config";

export type ModerationCategory = "sexual" | "minor_sexual" | "violence";
export type ModerationWarning = "logo" | "licensed_costume";
export type PhotoModeration = {
  ok: boolean;
  category?: ModerationCategory;
  warnings: ModerationWarning[];
  /** True for suspected CSAM: callers must stop all processing of this upload and must not store or forward it. */
  halt?: boolean;
  /** True when the classifier could not run; uploads fail closed with a retry message. */
  unavailable?: boolean;
};

export const MODERATION_MODEL = "google/gemini-2.5-flash-lite";
const moderationModel = () => process.env.GREETHUB_MODERATION_MODEL?.trim() || MODERATION_MODEL;

/** Metadata-only event passed to the CSAM hook. Never contains image bytes or the user's text. */
export type CsamSuspicion = { at: string; userId?: string; projectId?: string };
type CsamHook = (e: CsamSuspicion) => void | Promise<void>;
let csamHook: CsamHook = (e) => {
  // TODO(attorney, legal 07 s9): replace with the approved procedure (NCMEC CyberTipline report, preservation duty, account ban).
  console.error(`[csam-suspected] at=${e.at} project=${e.projectId ?? "?"} (image not stored, not forwarded)`);
};
export const setCsamHook = (h: CsamHook) => void (csamHook = h);

const PROMPT =
  "You are a safety classifier for a family gift-book service. Look at the photo and answer ONLY JSON: " +
  '{"sexual": bool (nudity or sexual content), "minor_sexual": bool (any sexualised or sexual depiction of a person who looks under 18; ordinary clothed family photos, swimwear on a beach and bath-time baby photos are NOT this), ' +
  '"violence": bool (graphic violence, gore, weapons being used on people), "logo": bool (a large, clearly visible brand logo), "licensed_costume": bool (a licensed cartoon or film character costume or print)}. ' +
  "Be precise: ordinary family photos are all false.";

export async function moderatePhoto(data: Uint8Array, opts: { contentType?: string; userId?: string; projectId?: string; mock?: boolean } = {}): Promise<PhotoModeration> {
  const mock = opts.mock ?? isMockMode();
  if (mock) return mockModerate(data, opts);
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, warnings: [], unavailable: true };
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: moderationModel(),
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: `data:${opts.contentType ?? "image/jpeg"};base64,${Buffer.from(data).toString("base64")}` } }] }],
        max_tokens: 200,
        temperature: 0,
        provider: { zdr: true },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { ok: false, warnings: [], unavailable: true };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const a = raw.indexOf("{");
    const b = raw.lastIndexOf("}");
    if (a < 0 || b < a) return { ok: false, warnings: [], unavailable: true };
    return await interpret(JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>, opts);
  } catch {
    return { ok: false, warnings: [], unavailable: true };
  }
}

/** Turns the classifier's booleans into a verdict. Exported for tests. */
export async function interpret(j: Record<string, unknown>, opts: { userId?: string; projectId?: string } = {}): Promise<PhotoModeration> {
  const warnings: ModerationWarning[] = [];
  if (j.logo === true) warnings.push("logo");
  if (j.licensed_costume === true) warnings.push("licensed_costume");
  if (j.minor_sexual === true) {
    await csamHook({ at: new Date().toISOString(), userId: opts.userId, projectId: opts.projectId });
    return { ok: false, category: "minor_sexual", warnings: [], halt: true };
  }
  if (j.sexual === true) return { ok: false, category: "sexual", warnings };
  if (j.violence === true) return { ok: false, category: "violence", warnings };
  return { ok: true, warnings };
}

async function mockModerate(data: Uint8Array, opts: { userId?: string; projectId?: string }): Promise<PhotoModeration> {
  const head = Buffer.from(data.subarray(0, Math.min(data.length, 4096))).toString("latin1");
  const m = /GH_TEST_MODERATION:([a-z_]+)/.exec(head);
  if (!m) return { ok: true, warnings: [] };
  const k = m[1];
  return interpret({ sexual: k === "sexual", minor_sexual: k === "minor_sexual", violence: k === "violence", logo: k === "logo", licensed_costume: k === "costume" }, opts);
}
