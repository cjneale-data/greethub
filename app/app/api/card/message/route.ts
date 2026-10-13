import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CardDraftSchema, type CardDraft } from "@/lib/intake/draft";
import { checkDraft, knownNamesOf } from "@/lib/intake/guardrails";
import { suggestMessage } from "@/lib/intake/mock-guide";
import { allow } from "@/lib/intake/rate-limit";
import { screenDraft } from "@/lib/safety/draft";
import { screenField } from "@/lib/safety/server";

/** "Write it for me": a starter message from the sample-message knowledge base, filled with the recipient's name. */
export async function POST(req: NextRequest) {
  // Each call can run the live IP screen (paid). Same in-memory limiter as intake until SEC-07 makes it durable.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`message:${ip}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited", message: "That's a lot of messages in a row. Give it a minute and try again." }, { status: 429 });
  }
  const parsed = z.object({ draft: CardDraftSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: "Something went wrong on our side. Try again?" }, { status: 400 });
  const screened = await screenDraft(parsed.data.draft as CardDraft);
  if (!screened.ok) return NextResponse.json({ error: "guardrail", message: screened.message }, { status: 422 });
  const draft = screened.draft;
  const guard = checkDraft(draft);
  if (!guard.ok && guard.verdict.kind !== "copyright") return NextResponse.json({ error: "guardrail", message: guard.verdict.message }, { status: 422 });
  // The suggested message is printed on the card: screen the output too (slogans, trademarked phrases).
  const out = await suggestMessage(draft);
  const safe = await screenField(out, "card_message", { knownNames: knownNamesOf(draft) });
  if (safe.verdict === "blocked") return NextResponse.json({ error: "guardrail", message: safe.userNote }, { status: 422 });
  return NextResponse.json({ message: safe.verdict === "rewritten" ? safe.safeText : out, ...(safe.verdict === "rewritten" ? { ipNote: safe.userNote } : {}) });
}
