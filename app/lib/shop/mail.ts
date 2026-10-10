import { getAdapters } from "../adapters";
import { formatMoney } from "@greethub/shared";
import type { Order, OrderItem } from "./types";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const abs = (p: string) => (p.startsWith("http") ? p : site() + p);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Plain-text first, with a minimal HTML twin: logo word, one persimmon-ink button (brand: one primary button per email). */
function wrap(text: string, button?: { label: string; href: string }) {
  const paras = text.split("\n\n").map((p) => `<p style="margin:0 0 16px">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const btn = button
    ? `<p style="margin:24px 0"><a href="${esc(abs(button.href))}" style="background:#C8441F;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;display:inline-block">${esc(button.label)}</a></p>`
    : "";
  const html = `<div style="font-family:Figtree,Arial,sans-serif;color:#2B1E18;background:#FBF6EE;padding:28px;max-width:560px"><div style="font-weight:800;font-size:22px;margin-bottom:20px">GreetHub</div>${paras}${btn}</div>`;
  const textOut = button ? `${text}\n\n${button.label}: ${abs(button.href)}` : text;
  return { text: textOut, html };
}

async function send(to: string, subject: string, body: string, tag: string, button?: { label: string; href: string }) {
  const { text, html } = wrap(body, button);
  return getAdapters().email.send({ to, subject, text, html, tag });
}

const itemLine = (i: OrderItem) => `${i.title}${i.quantity > 1 ? ` x${i.quantity}` : ""}, ${i.description}`;

export async function sendOrderConfirmed(order: Order) {
  const first = order.firstName || "there";
  const dest = order.items.find((i) => i.shipTo)?.shipTo;
  const body = [
    `Hi ${first},`,
    `Thanks for your order. Here's what's on its way:`,
    order.items.map(itemLine).join("\n"),
    `${dest ? `Sending to: ${dest.name}, ${dest.city}\n` : ""}Total paid: ${formatMoney(order.totals.totalCents)}`,
    `We'll email you when it ships, with a tracking link.`,
    `If anything looks off, just reply to this email.\n\nThe GreetHub team`,
  ].join("\n\n");
  return send(order.email, `Thanks, ${first}. We've got it.`, body, "order_confirmed", { label: "Track your order", href: `/orders/${order.id}` });
}

export async function sendShipped(order: Order, item: OrderItem) {
  const first = order.firstName || "there";
  const who = item.recipientName || "you";
  const f = item.fulfillment;
  const body = [
    `Hi ${first},`,
    `Good news: your ${item.kind} for ${who} has shipped${f?.carrier ? ` with ${f.carrier}` : ""}.`,
    f?.trackingUrl ? `Track it: ${f.trackingUrl}` : `Tracking shows up here as soon as the carrier has it.`,
    `The GreetHub team`,
  ].join("\n\n");
  return send(order.email, `Your ${item.kind}'s on its way to ${who}.`, body, "shipped", { label: "Track your order", href: `/orders/${order.id}` });
}

export async function sendNeedsAttention(order: Order, item: OrderItem, reason: string) {
  const who = item.recipientName || "you";
  const body = [`Hi ${order.firstName || "there"},`, `We hit a snag before printing: ${reason}. Here's how to sort it out: open your order. Nothing has been charged twice.`, `The GreetHub team`].join("\n\n");
  return send(order.email, `One thing to fix on ${who}'s ${item.kind}`, body, "needs_attention", { label: "Open order", href: `/orders/${order.id}` });
}

export async function sendTemplate(kind: "magicLink", args: { to: string; link: string }): Promise<unknown>;
export async function sendTemplate(kind: "deleteConfirm", args: { to: string; link: string }): Promise<unknown>;
export async function sendTemplate(kind: "accountDeleted", args: { to: string }): Promise<unknown>;
export async function sendTemplate(kind: string, args: { to: string; link?: string }) {
  switch (kind) {
    case "magicLink":
      return send(args.to, "Your GreetHub sign-in link", "Click to sign in. This link works for 15 minutes and only once. If you didn't ask for it, ignore this email.", "magic_link", { label: "Sign in", href: args.link! });
    case "deleteConfirm":
      return send(args.to, "Confirm deleting your GreetHub account", "You asked us to delete your account. Click to confirm. This link works for 15 minutes. If this wasn't you, ignore this email and nothing changes.", "delete_confirm", { label: "Delete my account", href: args.link! });
    case "accountDeleted":
      return send(args.to, "Your GreetHub account is gone", "As you asked, we removed your profile, photos, drafts and addresses. Open orders will still ship. Take care.", "account_deleted");
  }
}
