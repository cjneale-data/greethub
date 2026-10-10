import { getAdapters } from "@/lib/adapters";
import { json } from "@/lib/shop/api";
import { safeNext } from "@/lib/shop/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { next?: string; accepted?: boolean; signup?: boolean };
  if (body.signup && !body.accepted) return json({ error: "Tick the box to confirm you are 18 or older and agree to the Terms and Privacy Policy." }, 400);
  try {
    const { url } = await getAdapters().auth.signInWithGoogle(safeNext(body.next), { accepted: !!body.accepted });
    return json({ url });
  } catch (err) {
    console.error("google sign-in failed", err);
    return json({ error: "Google isn't available right now. Use the email link instead." }, 501);
  }
}
