import { agentChannelEnabled } from "@/lib/agent/config";
import { protectedResourceMetadata } from "@/lib/agent/oauth-metadata";

/** RFC 9728 protected resource metadata for the MCP server. 404 while the channel is off. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!agentChannelEnabled()) return new Response(null, { status: 404 });
  return Response.json(protectedResourceMetadata(), { headers: { "Cache-Control": "public, max-age=300" } });
}
