import { getAdapters } from "@/lib/adapters";
import { json, signedIn } from "@/lib/shop/api";
import { getCartItems } from "@/lib/shop/cartService";
import { getUser } from "@/lib/shop/accountService";

export async function GET() {
  const adapters = getAdapters();
  const s = await adapters.auth.getSession();
  const user = s.isGuest ? null : await signedIn();
  const profile = user ? await getUser(user.userId) : undefined;
  const cartCount = (await getCartItems(s.userId)).reduce((n, i) => n + i.quantity, 0);
  return json({
    signedIn: !!user,
    isGuest: s.isGuest,
    email: user?.email ?? null,
    firstName: profile?.firstName ?? null,
    cartCount,
    fake: { auth: adapters.auth.name === "fake", payments: adapters.payments.name === "fake", printers: adapters.bookPrinter.fake },
  });
}
