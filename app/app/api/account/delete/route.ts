import { fakeAllowed, json, NOT_SIGNED_IN, signedIn } from "@/lib/shop/api";
import { createDeleteToken, openOrderCount } from "@/lib/shop/accountService";
import { sendTemplate } from "@/lib/shop/mail";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Step 1: ask for deletion. We email a confirmation link; nothing is deleted until it is clicked. */
export async function POST(req: Request) {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const b = (await req.json().catch(() => ({}))) as { confirmText?: string; acknowledgeOpenOrders?: boolean };
  if (b.confirmText !== "DELETE") return json({ error: "Type DELETE to confirm." }, 400);
  if (openOrderCount(u.userId) > 0 && !b.acknowledgeOpenOrders) return json({ error: "Tick the box so we know you've seen the open order." }, 400);
  const token = createDeleteToken(u.userId);
  const path = `/account/delete/confirm?token=${token}`;
  await sendTemplate("deleteConfirm", { to: u.email, link: site() + path });
  return json({ sent: true, ...(fakeAllowed() ? { devLink: path } : {}) });
}
