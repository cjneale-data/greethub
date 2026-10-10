import { BriefFormSchema } from "@/lib/book/schemas";
import { createProject, listProjects } from "@/lib/book/service";
import { parseBody, readJson, route } from "../_lib/handler";

export const GET = route(async ({ user, d }) => ({ projects: await listProjects(d, user.userId) }));

export const POST = route(async ({ req, user, d }) => {
  const body = parseBody(BriefFormSchema, ((await readJson(req)) as { brief?: unknown })?.brief);
  return { project: await createProject(d, user.userId, body) };
});
