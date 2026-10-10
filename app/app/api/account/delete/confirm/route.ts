import { getAdapters } from "@/lib/adapters";
import { json } from "@/lib/shop/api";
import { consumeDeleteToken, deleteAccount } from "@/lib/shop/accountService";
import { sendTemplate } from "@/lib/shop/mail";

/** Step 2: the emailed link lands on a page that POSTs here. Deletes the account and signs out. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string };
  const userId = b.token ? consumeDeleteToken(b.token) : null;
  if (!userId) return json({ error: "That link has expired. Send a new one?" }, 410);
  const who = deleteAccount(userId);
  await getAdapters().auth.signOut();
  if (who.email) await sendTemplate("accountDeleted", { to: who.email }).catch(() => undefined);
  return json({ deleted: true, firstName: who.firstName ?? null });
}
