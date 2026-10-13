import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isMockAi } from "@/lib/intake/config";
import { CardDraftSchema, applyPatch, missingRequired, nextField, progress, type CardDraft } from "@/lib/intake/draft";
import { DRAFT_IP_FIELD, NAME_LIKE_FIELDS, REWRITE_CHIPS, checkDraft, checkSensitive, cleanText, knownNamesOf, type DraftField } from "@/lib/intake/guardrails";
import { liveGuideTurn, polish } from "@/lib/intake/live-guide";
import { mockGuideTurn } from "@/lib/intake/mock-guide";
import { quickRepliesFor } from "@/lib/intake/quick-replies";
import { QUESTIONS } from "@/lib/intake/fields";
import { addSpend, spendToday } from "@/lib/intake/preview";
import { allow } from "@/lib/intake/rate-limit";
import { dailySpendCapUsd } from "@/lib/intake/config";
import { screenField, screenFields } from "@/lib/safety/server";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(40),
  draft: CardDraftSchema,
  /** Replaces the last user message for processing (kept for older clients). */
  override: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`intake:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: "rate_limited", message: "A lot of cards are being made right now. We're getting to yours." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: "Something went wrong on our side. Try again?" }, { status: 400 });

  const { messages, override } = parsed.data;
  const draft = parsed.data.draft as CardDraft;
  const last = messages[messages.length - 1];
  const userText = cleanText(override ?? (last.role === "user" ? last.content : ""));
  const respond = (reply: string, d: CardDraft, extra: Record<string, unknown> = {}) => {
    const next = nextField(d);
    return NextResponse.json({
      reply,
      draft: d,
      next,
      quickReplies: quickRepliesFor(next, d),
      missing: missingRequired(d).map((m) => m.field),
      progress: progress(d),
      mock: isMockAi(),
      ...extra,
    });
  };

  // Guardrails run before any model sees the text: sensitive content first, then the IP screen (rules, plus a model call when live).
  const sens = checkSensitive(userText);
  if (!sens.ok) {
    const body = await respond(sens.message, draft).json();
    return NextResponse.json({ ...body, quickReplies: [], guardrail: { kind: sens.kind } });
  }
  const known = knownNamesOf(draft);
  const earlier = messages.filter((m) => m.role === "user").slice(0, -1).map((m) => m.content);
  const screened = await screenField(userText, "chat", { knownNames: known, history: earlier });
  if (screened.verdict === "blocked") {
    const body = await respond(screened.userNote, draft).json();
    return NextResponse.json({ ...body, quickReplies: [], guardrail: { kind: "public_figure" } });
  }
  // A rewrite is applied right away: original characters inspired by the idea. The customer sees a note and can rephrase.
  const text = screened.verdict === "rewritten" ? screened.safeText : userText;
  let ipNote = screened.verdict === "rewritten" ? screened.userNote : "";
  // A franchise-look request ("like a famous movie") gets the nearest original style offered, never copied.
  const styleOffer = screened.styleOffer ?? null;

  let reply = "";
  let patch: Partial<CardDraft> = {};
  let usedFallback = false;
  // Over the shared daily cap the free rule-based guide answers instead (it still fills the brief).
  const live = !isMockAi() && spendToday() < dailySpendCapUsd();
  if (live) {
    try {
      const out = await liveGuideTurn(messages.map((m, i) => (i === messages.length - 1 && (override || screened.verdict === "rewritten") ? { ...m, content: text } : m)), draft);
      patch = out.patch;
      addSpend(out.costUsd);
      // The server owns which question comes next: keep the model's acknowledgement, replace its question.
      const after = nextField(applyPatch(draft, patch, "chat"));
      const ack = polish(out.reply).split(/(?<=[.?])\s+/).filter((x) => x && !x.includes("?")).slice(0, 1).join(" ");
      reply = after ? `${ack} ${QUESTIONS[after]}`.trim() : polish(out.reply);
    } catch {
      usedFallback = true;
    }
  }
  if (!live || usedFallback) {
    const t = await mockGuideTurn(text, draft);
    reply = t.reply;
    patch = t.patch;
  }

  // Screen what the model wrote into the brief too: its output can name protected things as well.
  const patchRec = patch as Record<string, unknown>;
  const toScreen = (Object.keys(patchRec) as DraftField[]).filter((k) => k in DRAFT_IP_FIELD && typeof patchRec[k] === "string" && patchRec[k] && !NAME_LIKE_FIELDS.includes(k));
  if (toScreen.length) {
    const outs = await screenFields(toScreen.map((k) => ({ text: String(patchRec[k]), field: DRAFT_IP_FIELD[k], knownNames: known })));
    toScreen.forEach((k, i) => {
      const r = outs[i];
      if (r.verdict === "rewritten") {
        patchRec[k] = r.safeText;
        ipNote ||= r.userNote;
      } else if (r.verdict === "blocked") delete patchRec[k];
    });
  }

  // Validate model output: drop any patched field that fails the guardrails.
  const merged = applyPatch(draft, patch, "chat");
  const check = checkDraft(merged);
  let final = merged;
  if (!check.ok && check.verdict.kind !== "copyright") {
    final = { ...merged, [check.field]: draft[check.field] };
    reply = check.verdict.message;
  } else if (!check.ok && check.verdict.kind === "copyright") {
    // Rules still found something the first screen missed: apply the rewrite instead of refusing.
    final = { ...merged, [check.field]: check.verdict.rewritten };
    ipNote ||= check.verdict.message;
  }
  if (!reply) reply = nextField(final) ? QUESTIONS[nextField(final)!] : "That's everything I need. Check the card, then make your preview.";
  if (ipNote) {
    const body = await respond(`${ipNote} ${reply}`.trim(), final, usedFallback ? { degraded: true } : {}).json();
    return NextResponse.json({ ...body, quickReplies: [...(styleOffer ? [styleOffer.styleName] : []), ...REWRITE_CHIPS, ...(body.quickReplies ?? [])], ipNote, ...(styleOffer ? { styleOffer } : {}) });
  }
  if (styleOffer && !final.artStyle) {
    const body = await respond(`${styleOffer.note} ${reply}`.trim(), final, usedFallback ? { degraded: true } : {}).json();
    return NextResponse.json({ ...body, quickReplies: [styleOffer.styleName, ...(body.quickReplies ?? []).filter((q: string) => q !== styleOffer.styleName)], styleOffer });
  }
  return respond(reply, final, usedFallback ? { degraded: true } : {});
}
