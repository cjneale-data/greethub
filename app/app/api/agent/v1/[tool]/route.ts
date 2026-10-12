import { handleRestCall } from "@/lib/agent/rest";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return handleRestCall(req, tool);
}
