import { connection } from "next/server";
import { fakeAllowed, json } from "@/lib/shop/api";
import { readDB } from "@/lib/shop/store";

/** Local only: the fake email adapter's outbox, newest first. */
export async function GET() {
  await connection();
  if (!fakeAllowed()) return json({ error: "Not available." }, 404);
  return json({ messages: readDB().outbox.slice().reverse() });
}
