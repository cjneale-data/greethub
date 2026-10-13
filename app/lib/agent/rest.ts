import { HTTP_STATUS, TOOL_META, isToolName, toolError } from "@greethub/shared";
import { authenticate, bearerChallenge } from "./auth";
import { agentChannelEnabled } from "./config";
import { callTool } from "./dispatch";
import { AgentNotReady, getAgentDeps } from "./registry";

/**
 * REST surface: POST /api/agent/v1/<tool> with a JSON body = the tool input. Same pipeline as MCP. Bearer tokens or API keys only;
 * cookies are never read, so a browser session cannot call it (AGT-011 acceptance: no route accepts cookie auth).
 * TODO (AGT-011): GET /api/agent/v1/openapi.json generated from the shared Zod contract.
 */
const headers = { "Cache-Control": "no-store" };

export async function handleRestCall(req: Request, toolName: string): Promise<Response> {
  if (!agentChannelEnabled()) return Response.json({ error: toolError("not_found", "Not found.") }, { status: 404, headers });
  if (!isToolName(toolName)) return Response.json({ error: toolError("not_found", "Unknown tool.") }, { status: 404, headers });
  let deps;
  try {
    deps = getAgentDeps();
  } catch (e) {
    if (e instanceof AgentNotReady) return Response.json({ error: toolError("service_busy", "The assistant service is not available yet.", { retryable: true }) }, { status: 503, headers });
    throw e;
  }
  const auth = await authenticate(req, deps, [TOOL_META[toolName].scope]);
  if (!auth.ok) return Response.json({ error: toolError(auth.code, auth.message) }, { status: auth.status, headers: { ...headers, ...(auth.challenge ? { "WWW-Authenticate": auth.challenge } : {}) } });
  if (!auth.principal.tokenScopes.includes(TOOL_META[toolName].scope)) {
    return Response.json({ error: toolError("scope_insufficient", "This connection does not have permission for that action.") }, { status: 403, headers: { ...headers, "WWW-Authenticate": bearerChallenge({ error: "insufficient_scope", scope: [TOOL_META[toolName].scope] }) } });
  }
  let body: unknown = {};
  try {
    const text = await req.text();
    if (text.length > 64_000) return Response.json({ error: toolError("validation_failed", "Request too large.") }, { status: 413, headers });
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return Response.json({ error: toolError("validation_failed", "Body must be JSON.") }, { status: 400, headers });
  }
  const rid = req.headers.get("x-request-id");
  const out = await callTool(auth.principal, toolName, body, deps, rid && /^[A-Za-z0-9._:-]{1,128}$/.test(rid) ? rid : undefined);
  if (out.ok) return Response.json(out.data, { headers });
  const status = out.error.code === "validation_failed" ? 400 : HTTP_STATUS[out.error.code];
  return Response.json({ error: out.error }, { status, headers: { ...headers, ...(out.error.retryAfterSeconds ? { "Retry-After": String(out.error.retryAfterSeconds) } : {}) } });
}
