import { json } from "@/lib/shop/api";
import { deleteSignature, publicView } from "@/lib/writing/service";
import { writingRoute } from "../../_lib";

export const DELETE = writingRoute<{ id: string }>(async ({ userId, params }) => json(publicView(await deleteSignature(userId, params.id))));
