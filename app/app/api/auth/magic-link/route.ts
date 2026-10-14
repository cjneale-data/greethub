import { getAdapters } from "@/lib/adapters";
import { fakeAllowed, json } from "@/lib/shop/api";
import { EMAIL_RE, safeNext } from "@/lib/shop/session";
import { MagicLinkError } from "@/lib/adapters/real/supabaseAuth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; next?: string; accepted?: boolean; signup?: boolean };
  const email = (body.email ?? "").trim();
  if (!EMAIL_RE.test(email)) return json({ error: "That email doesn't look right. Check for typos." }, 400);
  if (body.signup && !body.accepted) return json({ error: "Tick the box to confirm you are 18 or older and agree to the Terms and Privacy Policy." }, 400);
  try {
    const { devLink } = await getAdapters().auth.sendMagicLink(email, safeNext(body.next), { accepted: !!body.accepted });
    return json({ sent: true, ...(fakeAllowed() && devLink ? { devLink } : {}) });
  } catch (err) {
    console.error("magic link failed", err);
    const reason = err instanceof MagicLinkError ? err.reason : "unavailable";
    if (reason === "invalid_email") return json({ error: "We can't send to that email address. Check it, or try another one.", code: reason }, 400);
    if (reason === "rate_limited") return json({ error: "We're sending a lot of sign-in emails right now. Try again in a few minutes.", code: reason }, 429);
    return json({ error: "Something broke on our side. It's not you. Try again in a minute." }, 500);
  }
}
