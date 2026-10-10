import type { EmailAdapter } from "../types";
import { updateDB, newId } from "../../shop/store";

/** Local email: prints to the server console and keeps the last 50 messages in the dev outbox (GET /api/dev/outbox). */
export const fakeEmail: EmailAdapter = {
  name: "fake",
  async send(msg) {
    const id = newId("em");
    updateDB((db) => {
      db.outbox.push({ id, to: msg.to, subject: msg.subject, text: msg.text, sentAt: new Date().toISOString(), tag: msg.tag });
      if (db.outbox.length > 50) db.outbox.splice(0, db.outbox.length - 50);
    });
    if (process.env.NODE_ENV !== "test") console.log(`[fake email] to=${msg.to} subject="${msg.subject}"`);
    return { id };
  },
};
