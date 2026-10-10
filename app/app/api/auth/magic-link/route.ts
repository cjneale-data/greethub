import { getAdapters } from "@/lib/adapters";
import { fakeAllowed, json } from "@/lib/shop/api";
import { EMAIL_RE, safeNext } from "@/lib/shop/session";

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
    return json({ error: "Something broke on our side. It's not you. Try again in a minute." }, 500);
  }
}
