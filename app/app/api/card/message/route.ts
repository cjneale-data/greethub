import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CardDraftSchema, type CardDraft } from "@/lib/intake/draft";
import { checkDraft } from "@/lib/intake/guardrails";
import { suggestMessage } from "@/lib/intake/mock-guide";

/** "Write it for me": a starter message from the sample-message knowledge base, filled with the recipient's name. */
export async function POST(req: NextRequest) {
  const parsed = z.object({ draft: CardDraftSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: "Something went wrong on our side. Try again?" }, { status: 400 });
  const draft = parsed.data.draft as CardDraft;
  const guard = checkDraft(draft);
  if (!guard.ok) return NextResponse.json({ error: "guardrail", message: guard.verdict.message }, { status: 422 });
  return NextResponse.json({ message: await suggestMessage(draft) });
}
