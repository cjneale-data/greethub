import { getCartItem } from "@/lib/book/service";
import { route } from "../../../_lib/handler";

/** The approved book as a NewCartItem (see packages/shared/src/cart.ts). The cart reads this. */
export const GET = route<{ id: string }>(async ({ user, d, params }) => ({ item: await getCartItem(d, user.userId, params.id) }));
