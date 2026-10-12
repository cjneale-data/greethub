import { SCOPES, type Grant, type Scope } from "@greethub/shared";
import { agentConfig, isSandbox } from "./config";
import type { AgentDeps } from "./deps";
import { getApiKeyStore, keyMatches, keyPrefix, looksLikeApiKey } from "./keys";
import { getAdapters } from "../adapters";

/**
 * Agent authentication. Separate from the site's cookie auth on purpose (06 section 1.2): agent routes never read cookies, so the
 * fake-auth stand-in cannot leak into them. Two credential types: OAuth access tokens (JWT, verified by a TokenVerifier) and
 * API keys (ghk_...). Both resolve to a grant that is loaded fresh from the GrantStore on every call.
 */
export type TokenClaims = { sub: string; clientId: string; grantId: string; scopes: string[] };
export interface TokenVerifier {
  /**
   * Verify signature, iss, aud (== mcpResourceUrl), exp. Return null for anything invalid.
   * TODO (AGT-010): JWKS-based verifier once the authorization server is chosen (Supabase OAuth server vs custom).
   */
  verify(token: string): Promise<TokenClaims | null>;
}
let verifier: TokenVerifier | null = null;
export const setTokenVerifier = (v: TokenVerifier | null) => void (verifier = v);

export type Principal = { userId: string; clientId: string; grant: Grant; via: "oauth" | "api_key"; tokenScopes: Scope[] };

export type AuthFailure = {
  ok: false;
  status: 401 | 403 | 503;
  code: "unauthorized" | "scope_insufficient" | "service_busy";
  message: string;
  /** Value for the WWW-Authenticate header (MCP authorization spec: resource_metadata, scope). */
  challenge?: string;
};
export type AuthResult = { ok: true; principal: Principal } | AuthFailure;

export const protectedResourceMetadataUrl = () => new URL("/.well-known/oauth-protected-resource", new URL(agentConfig().mcpResourceUrl).origin).toString();

export function bearerChallenge(opts: { scope?: string[]; error?: "invalid_token" | "insufficient_scope" } = {}): string {
  const parts = [`resource_metadata="${protectedResourceMetadataUrl()}"`];
  if (opts.error) parts.unshift(`error="${opts.error}"`);
  if (opts.scope?.length) parts.push(`scope="${opts.scope.join(" ")}"`);
  return `Bearer ${parts.join(", ")}`;
}

const asScopes = (s: string[]): Scope[] => s.filter((x): x is Scope => (SCOPES as readonly string[]).includes(x));

export async function authenticate(req: Request, deps: AgentDeps, requestedScopes: Scope[] = ["cards:read"]): Promise<AuthResult> {
  // Hard rule (06 section 1.2): never run agent routes on the stand-in auth outside the sandbox.
  if (!isSandbox() && process.env.NODE_ENV === "production" && getAdapters().auth.name === "fake") {
    return { ok: false, status: 503, code: "service_busy", message: "The assistant service is not available yet." };
  }
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(header);
  const unauthorized = (message = "Sign in to GreetHub to continue."): AuthFailure => ({
    ok: false, status: 401, code: "unauthorized", message, challenge: bearerChallenge({ scope: requestedScopes, error: m ? "invalid_token" : undefined }),
  });
  if (!m) return unauthorized();
  const token = m[1];

  let grantId: string | null = null;
  let via: Principal["via"] = "oauth";
  let tokenScopes: Scope[] | null = null;

  if (looksLikeApiKey(token)) {
    via = "api_key";
    const store = getApiKeyStore();
    const rec = store ? await store.findByPrefix(keyPrefix(token)) : null;
    if (!rec || !keyMatches(token, rec)) return unauthorized();
    if (rec.revokedAt || (rec.expiresAt && new Date(rec.expiresAt) <= deps.now())) return unauthorized();
    grantId = rec.grantId;
  } else {
    const claims = verifier ? await verifier.verify(token) : null;
    if (!claims) return unauthorized();
    grantId = claims.grantId;
    tokenScopes = asScopes(claims.scopes);
  }

  const grant = await deps.grants.get(grantId);
  if (!grant || grant.revokedAt || (grant.expiresAt && new Date(grant.expiresAt) <= deps.now())) return unauthorized();
  // The effective scopes are the intersection of what the token carries and what the grant still allows.
  const effective = tokenScopes ? tokenScopes.filter((s) => grant.scopes.includes(s)) : grant.scopes;
  return { ok: true, principal: { userId: grant.userId, clientId: grant.clientId, grant, via, tokenScopes: effective } };
}
