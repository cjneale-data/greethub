import { getDeps } from "@/app/api/book/_lib/handler";
import { exportUserBookData } from "@/lib/book/privacy";
import { NOT_SIGNED_IN, json, signedIn } from "@/lib/shop/api";
import { exportUserData } from "@/lib/shop/accountService";

/** Export-my-data (legal 06 req 28): the shop record plus books and their consent records from the book store. */
export async function GET() {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  const books = await exportUserBookData(getDeps(), u.userId);
  return new Response(JSON.stringify({ ...(await exportUserData(u.userId)), books }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=greethub-my-data.json", "Cache-Control": "no-store" },
  });
}
