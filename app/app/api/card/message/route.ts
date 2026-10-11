import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CardDraftSchema, type CardDraft } from "@/lib/intake/draft";
import { checkDraft, knownNamesOf } from "@/lib/intake/guardrails";
import { suggestMessage } from "@/lib/intake/mock-guide";
import { screenDraft } from "@/lib/safety/draft";
import { screenField } from "@/lib/safety/server";

/** "Write it for me": a starter message from the sample-message knowledge base, filled with the recipient's name. */
export async function POST(req: NextRequest) {
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
