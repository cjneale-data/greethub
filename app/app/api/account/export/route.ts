import { NOT_SIGNED_IN, json, signedIn } from "@/lib/shop/api";
import { exportUserData } from "@/lib/shop/accountService";

export async function GET() {
  const u = await signedIn();
  if (!u) return json(NOT_SIGNED_IN, 401);
  return new Response(JSON.stringify(exportUserData(u.userId), null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=greethub-my-data.json", "Cache-Control": "no-store" },
  });
}
