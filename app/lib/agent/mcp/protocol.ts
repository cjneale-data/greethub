import { TOOL_META, isToolName, toolError, type ToolError } from "@greethub/shared";
import { authenticate, bearerChallenge, type Principal } from "../auth";
import { agentChannelEnabled, agentConfig } from "../config";
import { callTool } from "../dispatch";
import { AgentNotReady, getAgentDeps } from "../registry";
import { toolsForScopes } from "./tools";

/**
 * Minimal Streamable HTTP MCP server (JSON-RPC 2.0 over POST, JSON responses, no SSE, stateless).
 * Hand-rolled on purpose for the framework so no new dependency is added before AGT-012 decides between `mcp-handler` 2.x and this;
 * swapping later only replaces this file and keeps lib/agent/dispatch.ts. Supports initialize, ping, tools/list, tools/call.
 * Auth failures are real HTTP 401/403 with WWW-Authenticate (Claude and ChatGPT need that to start linking); other tool errors are
 * results with isError: true and structuredContent equal to the ToolError (05 section 3).
 */
type RpcId = string | number | null;
type RpcRequest = { jsonrpc: "2.0"; id?: RpcId; method: string; params?: Record<string, unknown> };

const rpcResult = (id: RpcId | undefined, result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const rpcError = (id: RpcId | undefined, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const noStore = { "Cache-Control": "no-store" };
const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { ...noStore, ...headers } });

export const SERVER_INFO = { name: "greethub", title: "GreetHub", version: "0.1.0" };

function toolResult(data: unknown, isError: boolean, meta?: Record<string, unknown>) {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data, isError, ...(meta ? { _meta: meta } : {}) };
}

async function handleOne(msg: RpcRequest, principal: Principal, requestId: string): Promise<unknown | null> {
  const deps = getAgentDeps();
  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      const supported = agentConfig().supportedProtocolVersions as readonly string[];
      return rpcResult(msg.id, {
        protocolVersion: supported.includes(asked) ? asked : supported[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "GreetHub makes personalised greeting cards. Create a draft, show the user the preview, then ask them to approve it on greethub.com. You cannot see addresses or photos.",
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, { tools: toolsForScopes(principal.tokenScopes) });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      if (!isToolName(name)) return rpcError(msg.id, -32602, `Unknown tool: ${name.slice(0, 64)}`);
      if (!principal.tokenScopes.includes(TOOL_META[name].scope)) {
        // Hidden from tools/list but called anyway. Handled as an HTTP 403 by the caller via this sentinel.
        return { __insufficientScope: TOOL_META[name].scope, id: msg.id };
      }
      const out = await callTool(principal, name, msg.params?.arguments, deps, requestId);
      if (out.ok) return rpcResult(msg.id, toolResult(out.data, false));
      return rpcResult(msg.id, toolResult(out.error, true, out.error.code === "unauthorized" ? { "mcp/www_authenticate": [bearerChallenge({ error: "invalid_token" })] } : undefined));
    }
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method.slice(0, 64)}`);
  }
}

export function failureResponse(status: number, error: ToolError, challenge?: string) {
  return jsonResponse({ error }, status, challenge ? { "WWW-Authenticate": challenge } : {});
}

export async function handleMcpPost(req: Request): Promise<Response> {
  if (!agentChannelEnabled()) return jsonResponse({ error: toolError("service_busy", "This service is not available.") }, 404);
  let deps;
  try {
    deps = getAgentDeps();
  } catch (e) {
    if (e instanceof AgentNotReady) return failureResponse(503, toolError("service_busy", "The assistant service is not available yet.", { retryable: true }));
    throw e;
  }
  // The size cap protects the parser; MCP requests are small.
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 256_000) return jsonResponse(rpcError(null, -32600, "Request too large"), 413);

  const auth = await authenticate(req, deps);
  if (!auth.ok) return failureResponse(auth.status, toolError(auth.code, auth.message, { retryable: auth.status === 503 }), auth.challenge);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(rpcError(null, -32700, "Parse error"), 400);
  }
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as RpcRequest[];
  if (!msgs.length || msgs.some((m) => !m || m.jsonrpc !== "2.0" || typeof m.method !== "string")) return jsonResponse(rpcError(null, -32600, "Invalid Request"), 400);

  const results: unknown[] = [];
  for (const m of msgs) {
    const r = await handleOne(m, auth.principal, requestId);
    if (r && typeof r === "object" && "__insufficientScope" in r) {
      const scope = (r as { __insufficientScope: string }).__insufficientScope;
      return failureResponse(403, toolError("scope_insufficient", "This connection does not have permission for that action.", { retryable: false }), bearerChallenge({ error: "insufficient_scope", scope: [scope] }));
    }
    if (r !== null && m.id !== undefined) results.push(r);
  }
  if (!results.length) return new Response(null, { status: 202, headers: noStore });
  return jsonResponse(batch ? results : results[0]);
}

