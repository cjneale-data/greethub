import { connection } from "next/server";
import { agentChannelEnabled } from "@/lib/agent/config";
import { protectedResourceMetadata } from "@/lib/agent/oauth-metadata";

/** RFC 9728 protected resource metadata for the MCP server. 404 while the channel is off. */

export async function GET() {
  await connection(); // read env per request, not at build time
  if (!agentChannelEnabled()) return new Response(null, { status: 404 });
  return Response.json(protectedResourceMetadata(), { headers: { "Cache-Control": "public, max-age=300" } });
}
