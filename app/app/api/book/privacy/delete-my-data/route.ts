import { deleteUserBookData } from "@/lib/book/privacy";
import { route } from "../../_lib/handler";

/** Delete-my-data hook for the account deletion flow: removes every book, photo and render for the signed-in user. */
export const POST = route(async ({ user, d }) => ({ deleted: await deleteUserBookData(d, user.userId) }));
