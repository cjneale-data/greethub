import { DEFAULT_REQUEST_SCOPES, SCOPES } from "@greethub/shared";
import { agentConfig } from "./config";

/**
 * OAuth discovery documents (docs/integrations/02 section 2). The authorization server itself (authorize, token, register, revoke,
 * consent screen) is NOT built: AGT-010 first spikes Supabase Auth's OAuth server vs a small custom AS. Until AGENT_AUTH_ISSUER is set
 * the resource metadata lists no authorization server, so no client can complete linking.
 * TODO (AGT-010): serve RFC 8414 AS metadata (S256 only, authorization_response_iss_parameter_supported, CIMD support, DCR), consent page
 * with frame-ancestors 'none' and CSRF, RFC 7009 revocation, CIMD fetcher with SSRF blocks.
 */
export function protectedResourceMetadata() {
  const c = agentConfig();
  return {
    resource: c.mcpResourceUrl, // must equal the URL the user typed, including path
    authorization_servers: c.authIssuer ? [c.authIssuer] : [],
    scopes_supported: [...SCOPES].filter((s) => s !== "cards:send_auto" && s !== "rules:manage"), // send_auto only via web step-up
    default_scopes: DEFAULT_REQUEST_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "GreetHub",
  };
}
