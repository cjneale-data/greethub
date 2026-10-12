import { TOOL_INPUTS, TOOL_META, TOOL_NAMES, type Scope, type ToolName } from "@greethub/shared";
import { z } from "zod";

/** MCP tool descriptors generated from the shared Zod contract. Deterministic order (prompt-cache friendly, 05 section 10). */
export type McpTool = {
  name: ToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  annotations: { title: string; readOnlyHint: boolean; destructiveHint: boolean; openWorldHint: boolean; idempotentHint: boolean };
  securitySchemes: { type: "oauth2"; scopes: Scope[] }[];
  _meta: Record<string, unknown>;
};

// TODO (AGT-002): per-tool output Zod schemas. Until then outputs are a permissive object that always carries schemaVersion.
const OUTPUT_SCHEMA = { type: "object", properties: { schemaVersion: { type: "integer" } }, additionalProperties: true };

let cache: McpTool[] | null = null;
export function allMcpTools(): McpTool[] {
  if (cache) return cache;
  cache = TOOL_NAMES.map((name) => {
    const meta = TOOL_META[name];
    const inputSchema = z.toJSONSchema(TOOL_INPUTS[name], { io: "input" }) as Record<string, unknown>;
    delete inputSchema.$schema;
    return {
      name,
      title: meta.title,
      description: meta.description,
      inputSchema,
      outputSchema: OUTPUT_SCHEMA,
      annotations: { title: meta.title, readOnlyHint: meta.readOnlyHint, destructiveHint: meta.destructiveHint, openWorldHint: meta.openWorldHint, idempotentHint: meta.idempotentHint },
      securitySchemes: [{ type: "oauth2", scopes: [meta.scope] }],
      _meta: { securitySchemes: [{ type: "oauth2", scopes: [meta.scope] }] },
    };
  });
  return cache;
}

/** tools/list returns only tools the token's scopes allow (02 section 2). */
export const toolsForScopes = (scopes: Scope[]) => allMcpTools().filter((t) => scopes.includes(TOOL_META[t.name].scope));
