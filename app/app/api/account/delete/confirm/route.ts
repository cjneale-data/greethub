import { getAdapters } from "@/lib/adapters";
import { deleteUserBookData } from "@/lib/book/privacy";
import { getDeps } from "@/app/api/book/_lib/handler";
import { json } from "@/lib/shop/api";
import { consumeDeleteToken, deleteAccount } from "@/lib/shop/accountService";
import { sendTemplate } from "@/lib/shop/mail";

/** Step 2: the emailed link lands on a page that POSTs here. Deletes the account and signs out. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string };
  const userId = b.token ? await consumeDeleteToken(b.token) : null;
  if (!userId) return json({ error: "That link has expired. Send a new one?" }, 410);
  // Book projects, photos, renders and jobs live in the book store, not the shop DB (legal 06 req 28, SEC-23).
  // Remove them first: if that fails, stop and say so rather than tell the customer their photos are gone.
  try {
    await deleteUserBookData(getDeps(), userId);
  } catch (err) {
    console.error("account deletion: book data purge failed", (err as Error)?.message);
    return json({ error: "We couldn't finish deleting your data. Send a new link and try again." }, 500);
  }
  const who = await deleteAccount(userId);
  await getAdapters().auth.signOut();
  if (who.email) await sendTemplate("accountDeleted", { to: who.email }).catch(() => undefined);
  return json({ deleted: true, firstName: who.firstName ?? null });
}
