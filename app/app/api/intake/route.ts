import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isMockAi } from "@/lib/intake/config";
import { CardDraftSchema, applyPatch, missingRequired, nextField, progress, type CardDraft } from "@/lib/intake/draft";
import { REWRITE_CHIPS, checkDraft, checkText, cleanText } from "@/lib/intake/guardrails";
import { liveGuideTurn, polish } from "@/lib/intake/live-guide";
import { mockGuideTurn } from "@/lib/intake/mock-guide";
import { quickRepliesFor } from "@/lib/intake/quick-replies";
import { QUESTIONS } from "@/lib/intake/fields";
import { allow } from "@/lib/intake/rate-limit";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(40),
  draft: CardDraftSchema,
  /** Replaces the last user message for processing (used when the user accepts a generic rewrite). */
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

  // Guardrails run before any model sees the text.
  const verdict = checkText(userText);
  if (!verdict.ok) {
    const base = respond(verdict.message, draft);
    if (verdict.kind === "copyright") {
      const body = await base.json();
      return NextResponse.json({ ...body, quickReplies: [...REWRITE_CHIPS], guardrail: { kind: "copyright", rewritten: verdict.rewritten } });
    }
    const body = await base.json();
    return NextResponse.json({ ...body, quickReplies: [], guardrail: { kind: verdict.kind } });
  }

  let reply = "";
  let patch: Partial<CardDraft> = {};
  let usedFallback = false;
  if (!isMockAi()) {
    try {
      const out = await liveGuideTurn(messages.map((m, i) => (i === messages.length - 1 && override ? { ...m, content: userText } : m)), draft);
      patch = out.patch;
      // The server owns which question comes next: keep the model's acknowledgement, replace its question.
      const after = nextField(applyPatch(draft, patch, "chat"));
      const ack = polish(out.reply).split(/(?<=[.?])\s+/).filter((x) => x && !x.includes("?")).slice(0, 1).join(" ");
      reply = after ? `${ack} ${QUESTIONS[after]}`.trim() : polish(out.reply);
    } catch {
      usedFallback = true;
    }
  }
  if (isMockAi() || usedFallback) {
    const t = await mockGuideTurn(userText, draft);
    reply = t.reply;
    patch = t.patch;
  }

  // Validate model output: drop any patched field that fails the guardrails.
  const merged = applyPatch(draft, patch, "chat");
  const check = checkDraft(merged);
  let final = merged;
  if (!check.ok) {
    final = { ...merged, [check.field]: draft[check.field] };
    reply = check.verdict.message;
  }
  if (!reply) reply = nextField(final) ? QUESTIONS[nextField(final)!] : "That's everything I need. Check the card, then make your preview.";
  return respond(reply, final, usedFallback ? { degraded: true } : {});
}
