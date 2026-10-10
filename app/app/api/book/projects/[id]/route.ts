import { BriefFormSchema } from "@/lib/book/schemas";
import { getProject, updateBrief } from "@/lib/book/service";
import { parseBody, readJson, route } from "../../_lib/handler";

export const GET = route<{ id: string }>(async ({ user, d, params }) => ({ project: await getProject(d, user.userId, params.id) }));

export const PATCH = route<{ id: string }>(async ({ req, user, d, params }) => {
  const body = parseBody(BriefFormSchema, ((await readJson(req)) as { brief?: unknown })?.brief);
  return { project: await updateBrief(d, user.userId, params.id, body) };
});
