import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdapters } from "@/lib/adapters";
import { CardDraftSchema, toCardBrief, type CardDraft } from "@/lib/intake/draft";
import { checkDraft, guestPhotoViolation } from "@/lib/intake/guardrails";
import { PreviewFailed, generateGuestPreview, underDailyCap } from "@/lib/intake/preview";
import { allow } from "@/lib/intake/rate-limit";

export const maxDuration = 180;

const GUEST_COOKIE = "gh_guest_card";
const Body = z.object({ draft: CardDraftSchema }).passthrough();

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: "Something went wrong on our side. Try again?" }, { status: 400 });

  // Guests are text-only: refuse any photo reference outright.
  const photo = guestPhotoViolation(raw as Record<string, never>);
  if (photo) return NextResponse.json({ error: "guest_photos", message: photo }, { status: 403 });

  const session = await getAdapters().auth.getSession();
  if (session.isGuest && req.cookies.get(GUEST_COOKIE)?.value === "1") {
    return NextResponse.json(
      { error: "guest_limit", message: "That's your free preview. Make a free account to keep going. Your card comes with you." },
      { status: 403 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`preview:${ip}`, 5, 10 * 60_000) || !underDailyCap()) {
    return NextResponse.json({ error: "rate_limited", message: "A lot of cards are being made right now. We're getting to yours." }, { status: 429 });
  }

  const draft = parsed.data.draft as CardDraft;
  const guard = checkDraft(draft);
  if (!guard.ok) return NextResponse.json({ error: "guardrail", field: guard.field, message: guard.verdict.message, kind: guard.verdict.kind }, { status: 422 });

  const built = toCardBrief(draft);
  if (!built.ok) {
    return NextResponse.json({ error: "incomplete", missing: built.missing.map((m) => ({ field: m.field, error: m.error })), message: built.missing[0]?.error }, { status: 422 });
  }

  try {
    const preview = await generateGuestPreview(built.brief);
    const res = NextResponse.json({ preview: { ...preview, createdAt: new Date().toISOString() } });
    if (session.isGuest) res.cookies.set(GUEST_COOKIE, "1", { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return res;
  } catch (e) {
    const code = e instanceof PreviewFailed ? e.message : "render_failed";
    return NextResponse.json({ error: "render_failed", code, message: "That one didn't come out. Nothing was charged. Try again?" }, { status: 502 });
  }
}
