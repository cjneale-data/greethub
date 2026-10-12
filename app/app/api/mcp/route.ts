import { handleMcpPost } from "@/lib/agent/mcp/protocol";

/**
 * Remote MCP server (Streamable HTTP, stateless, JSON responses). Off unless AGENT_CHANNEL_ENABLED=1.
 * Bearer auth only: this route never reads cookies, so it is exempt from the cookie-origin checks (docs/integrations/06 section 1.3).
 * Hostname mcp.greethub.com maps here at deploy time.
 */

export async function POST(req: Request) {
  return handleMcpPost(req);
}

const notAllowed = () => new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
// No server-initiated streams or sessions yet; clients fall back to POST only.
export const GET = notAllowed;
export const DELETE = notAllowed;
