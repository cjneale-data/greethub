import { handleRestCall } from "@/lib/agent/rest";


export async function POST(req: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return handleRestCall(req, tool);
}
