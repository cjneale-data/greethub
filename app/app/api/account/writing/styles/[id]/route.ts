import { json } from "@/lib/shop/api";
import { deleteCustomStyle, publicView } from "@/lib/writing/service";
import { writingRoute } from "../../_lib";

export const DELETE = writingRoute<{ id: string }>(async ({ userId, params }) => json(publicView(await deleteCustomStyle(userId, params.id))));
