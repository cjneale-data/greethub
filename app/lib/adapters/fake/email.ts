import type { EmailAdapter } from "../types";
import { docs } from "../../store";
import { newId } from "../../shop/store";

/** Local email: prints to the server console and keeps the last 50 messages in the dev outbox (GET /api/dev/outbox). */
export const fakeEmail: EmailAdapter = {
  name: "fake",
  async send(msg) {
    const id = newId("em");
    await docs().insertIfAbsent("outbox", id, { id, to: msg.to, subject: msg.subject, text: msg.text, sentAt: new Date().toISOString(), tag: msg.tag });
    if (process.env.NODE_ENV !== "test") console.log(`[fake email] to=${msg.to} subject="${msg.subject}"`);
    return { id };
  },
};
