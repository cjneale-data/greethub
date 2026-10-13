import { connection } from "next/server";
import { fakeAllowed, json } from "@/lib/shop/api";
import { docs } from "@/lib/store";

/** Local only: the fake email adapter's outbox, newest first. */
export async function GET() {
  await connection();
  if (!fakeAllowed()) return json({ error: "Not available." }, 404);
  return json({ messages: (await docs().all("outbox")).slice(-50).reverse() });
}
