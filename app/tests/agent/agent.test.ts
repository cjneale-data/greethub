import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TOOL_INPUTS, TOOL_META, TOOL_NAMES, DEFAULT_REQUEST_SCOPES, GrantLimitsSchema, type Grant, type Scope } from "@greethub/shared";
import { createMemoryDeps } from "@/lib/agent/memory";
import { setAgentDepsForTest } from "@/lib/agent/registry";
import { setTokenVerifier } from "@/lib/agent/auth";
import { handleMcpPost } from "@/lib/agent/mcp/protocol";
import { handleRestCall } from "@/lib/agent/rest";
import { authorize } from "@/lib/agent/policy";
import { callTool } from "@/lib/agent/dispatch";
import { allMcpTools, toolsForScopes } from "@/lib/agent/mcp/tools";
import { generateApiKey, hashApiKey, looksLikeApiKey } from "@/lib/agent/keys";
import { agentPrintedTextRules } from "@/lib/agent/safety";

const grant = (over: Partial<Grant> = {}): Grant => ({
  grantId: "grt_test1", userId: "u_1", clientId: "https://claude.ai/x", clientTier: "known", mode: "send_with_approval",
  scopes: [...DEFAULT_REQUEST_SCOPES], limits: GrantLimitsSchema.parse({}), createdAt: "2026-01-01T00:00:00Z", expiresAt: null, revokedAt: null, autonomyEnabledAt: null, ...over,
});
const principalOf = (g: Grant) => ({ userId: g.userId, clientId: g.clientId, grant: g, via: "oauth" as const, tokenScopes: g.scopes as Scope[] });

let mem: ReturnType<typeof createMemoryDeps>;
beforeEach(() => {
  process.env.AGENT_CHANNEL_ENABLED = "1";
  mem = createMemoryDeps();
  setAgentDepsForTest(mem.deps);
  mem.addGrant(grant());
  setTokenVerifier({ verify: async (t) => (t === "good" ? { sub: "u_1", clientId: "https://claude.ai/x", grantId: "grt_test1", scopes: DEFAULT_REQUEST_SCOPES } : null) });
});
afterEach(() => {
  delete process.env.AGENT_CHANNEL_ENABLED;
  setAgentDepsForTest(null);
  setTokenVerifier(null);
});

const rpc = (method: string, params?: unknown, token = "good") =>
  handleMcpPost(new Request("http://x/api/mcp", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }));

describe("tool contract", () => {
  it("every tool has title, description, explicit hints, short name and a scope", () => {
    for (const n of TOOL_NAMES) {
      const m = TOOL_META[n];
      expect(n.length).toBeLessThanOrEqual(64);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(10);
      expect(typeof m.readOnlyHint).toBe("boolean");
      expect(typeof m.destructiveHint).toBe("boolean");
      expect(m.openWorldHint).toBe(false);
      expect(TOOL_INPUTS[n]).toBeDefined();
    }
    expect(TOOL_NAMES).toHaveLength(16);
  });
  it("write tools take an idempotency key; read tools do not; money tools are destructive", () => {
    for (const n of TOOL_NAMES) {
      const hasKey = "idempotencyKey" in TOOL_INPUTS[n].shape;
      expect(hasKey).toBe(TOOL_META[n].needsIdempotencyKey);
      if (TOOL_META[n].readOnlyHint) expect(TOOL_META[n].destructiveHint).toBe(false);
    }
    expect(TOOL_META.approve_and_pay.destructiveHint).toBe(true);
    expect(TOOL_META.cancel_order.destructiveHint).toBe(true);
  });
  it("assistants cannot create minors", () => {
    const r = TOOL_INPUTS.add_person.safeParse({ idempotencyKey: "k", name: "A", relationship: "b", ageBand: "child" });
    expect(r.success).toBe(false);
  });
  it("tools/list is scope filtered and deterministic, send_auto tool hidden by default", () => {
    const names = toolsForScopes(DEFAULT_REQUEST_SCOPES).map((t) => t.name);
    expect(names).not.toContain("approve_and_pay");
    expect(names).toContain("create_card_draft");
    expect(toolsForScopes(DEFAULT_REQUEST_SCOPES).map((t) => t.name)).toEqual(names);
    expect(allMcpTools()[0].inputSchema).not.toHaveProperty("$schema");
  });
});

describe("MCP endpoint", () => {
  it("returns 404 when the channel is off", async () => {
    delete process.env.AGENT_CHANNEL_ENABLED;
    expect((await rpc("ping")).status).toBe(404);
  });
  it("401 with resource_metadata when unauthenticated or token invalid", async () => {
    for (const t of ["", "bad"]) {
      const res = await rpc("tools/list", {}, t);
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toContain("resource_metadata=");
    }
  });
  it("initialize negotiates a supported version", async () => {
    const body = await (await rpc("initialize", { protocolVersion: "2025-11-25" })).json();
    expect(body.result.protocolVersion).toBe("2025-11-25");
    expect(body.result.capabilities.tools).toBeDefined();
  });
  it("tools/call get_quote matches pricing", async () => {
    const body = await (await rpc("tools/call", { name: "get_quote", arguments: { product: "card_mailed" } })).json();
    expect(body.result.isError).toBe(false);
    expect(body.result.structuredContent.totalCents).toBe(1098);
    expect(body.result.structuredContent.withinYourLimits).toBe(true);
    expect(JSON.parse(body.result.content[0].text)).toEqual(body.result.structuredContent);
  });
  it("unbuilt tools say so; validation errors list fields", async () => {
    const a = await (await rpc("tools/call", { name: "list_people", arguments: {} })).json();
    expect(a.result.isError).toBe(true);
    expect(a.result.structuredContent.code).toBe("not_implemented");
    const b = await (await rpc("tools/call", { name: "get_quote", arguments: { product: "book" } })).json();
    expect(b.result.structuredContent.code).toBe("validation_failed");
  });
  it("calling a tool outside the token scopes is an HTTP 403 with insufficient_scope", async () => {
    const res = await rpc("tools/call", { name: "approve_and_pay", arguments: { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" } });
    expect(res.status).toBe(403);
    expect(res.headers.get("www-authenticate")).toContain("insufficient_scope");
  });
  it("revoked grant stops working immediately", async () => {
    mem.addGrant(grant({ revokedAt: "2026-02-01T00:00:00Z" }));
    expect((await rpc("tools/list")).status).toBe(401);
  });
  const post = (body: string) => handleMcpPost(new Request("http://x/api/mcp", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer good" }, body }));
  it("refuses JSON-RPC batches and oversized bodies without a content-length", async () => {
    const batch = await post(JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", id: 2, method: "ping" }]));
    expect(batch.status).toBe(400);
    const big = await post(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping", params: { pad: "x".repeat(300_000) } }));
    expect(big.status).toBe(413);
    expect((await post(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }))).status).toBe(202);
  });
  it("get_account_limits reports a user pause and ignores autonomy still in cooling-off", async () => {
    mem.kill.paused.add("u_1");
    mem.addGrant(grant({ mode: "autonomous", autonomyEnabledAt: new Date().toISOString() }));
    const out = await callTool(principalOf(grant()), "get_account_limits", {}, mem.deps);
    // A paused user is denied by policy before the handler runs; check the handler view with the pause lifted.
    expect(!out.ok && out.error.code).toBe("service_busy");
    mem.kill.paused.delete("u_1");
    const ok = await callTool(principalOf(grant({ mode: "autonomous", autonomyEnabledAt: new Date().toISOString() })), "get_account_limits", {}, mem.deps);
    expect(ok.ok && ok.data.autonomyEnabled).toBe(false);
    expect(ok.ok && ok.data.paused).toBe(false);
  });
});

describe("REST endpoint", () => {
  it("ignores cookies and needs a bearer token", async () => {
    const res = await handleRestCall(new Request("http://x", { method: "POST", headers: { cookie: "gh_session=abc" }, body: "{}" }), "get_account_limits");
    expect(res.status).toBe(401);
  });
  it("runs a read tool", async () => {
    const res = await handleRestCall(new Request("http://x", { method: "POST", headers: { authorization: "Bearer good" }, body: "{}" }), "get_account_limits");
    expect(res.status).toBe(200);
    expect((await res.json()).draftsLeftToday).toBe(10);
  });
  it("404 for unknown tool", async () => {
    expect((await handleRestCall(new Request("http://x", { method: "POST", headers: { authorization: "Bearer good" } }), "nope")).status).toBe(404);
  });
});

describe("policy", () => {
  const draftArgs = { idempotencyKey: "k", occasion: "thank_you", recipient: { name: "Priya", relationship: "colleague" }, tone: "heartfelt" };
  it("kill switches deny", async () => {
    mem.kill.paused.add("u_1");
    const d = await authorize(principalOf(grant()), "list_orders", {}, mem.deps);
    expect(d.decision).toBe("deny");
    mem.kill.paused.clear();
    process.env.AGENT_CHANNEL_PAUSED = "1";
    expect((await authorize(principalOf(grant()), "list_orders", {}, mem.deps)).decision).toBe("deny");
    delete process.env.AGENT_CHANNEL_PAUSED;
  });
  it("enforces the daily draft limit", async () => {
    mem.setUsage("grt_test1", { draftsToday: 10 });
    const d = await authorize(principalOf(grant()), "create_card_draft", draftArgs, mem.deps);
    expect(d.decision === "deny" && d.error.code).toBe("quota_exceeded");
  });
  it("model budget pool exhausted denies drafts", async () => {
    mem.setBudgetUsd(0.01);
    const d = await authorize(principalOf(grant()), "create_card_draft", draftArgs, mem.deps);
    expect(d.decision === "deny" && d.error.code).toBe("spend_cap_reached");
  });
  it("rate limits writes per grant", async () => {
    let last = "allow";
    for (let i = 0; i < 25; i++) last = (await authorize(principalOf(grant()), "add_person", { idempotencyKey: "k", name: "Pat", relationship: "friend", ageBand: "adult" }, mem.deps)).decision;
    expect(last).toBe("deny");
  });
  it("money caps: per card, monthly", async () => {
    const g = grant({ scopes: [...DEFAULT_REQUEST_SCOPES] });
    const p = principalOf(g);
    expect((await authorize(p, "request_approval", { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" }, mem.deps, { quoteCents: 2000 })).decision).toBe("deny");
    mem.setUsage("grt_test1", { spentMonthCents: 4500 });
    const d = await authorize(p, "request_approval", { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" }, mem.deps, { quoteCents: 1098 });
    expect(d.decision === "deny" && d.reasons[0]).toBe("monthly_cap");
    mem.setUsage("grt_test1", {});
    expect((await authorize(p, "request_approval", { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" }, mem.deps, { quoteCents: 1098 })).decision).toBe("allow");
  });
  it("without a quote a spend tool is refused (safe default while drafts are stubbed)", async () => {
    const d = await authorize(principalOf(grant()), "request_approval", { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" }, mem.deps);
    expect(d.decision === "deny" && d.error.code).toBe("draft_not_ready");
  });
  it("approve_and_pay requires autonomy, cooling-off, allowlist, first-N and no anomaly flag", async () => {
    const long = new Date(Date.now() - 48 * 3600_000).toISOString();
    const g = grant({ mode: "autonomous", scopes: [...DEFAULT_REQUEST_SCOPES, "cards:send_auto"], autonomyEnabledAt: long, limits: GrantLimitsSchema.parse({ recipientAllowlist: ["per_x"] }) });
    mem.addGrant(g);
    const facts = { quoteCents: 1098, recipient: { personId: "per_x", agentUsable: true, ageBand: "adult", addressStatus: "confirmed" as const } };
    const args = { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" };
    let d = await authorize(principalOf(g), "approve_and_pay", args, mem.deps, facts);
    expect(d.decision === "require_approval" && d.reasons).toContain("first_n_for_recipient");
    mem.setCardsToRecipient("grt_test1", "per_x", 3);
    expect((await authorize(principalOf(g), "approve_and_pay", args, mem.deps, facts)).decision).toBe("allow");
    await mem.deps.abuse.flag("grt_test1", "injection");
    d = await authorize(principalOf(g), "approve_and_pay", args, mem.deps, facts);
    expect(d.decision === "require_approval" && d.reasons).toContain("anomaly");
    const fresh = { ...g, autonomyEnabledAt: new Date().toISOString() };
    d = await authorize(principalOf(fresh), "approve_and_pay", args, mem.deps, facts);
    expect(d.decision === "require_approval" && d.reasons).toContain("autonomy_not_enabled");
  });
  it("blocks links, scam text and injection in free text, and flags the grant", async () => {
    const d = await authorize(principalOf(grant()), "create_card_draft", { ...draftArgs, message: { mode: "as_written", text: "Pay $500 to http://evil.example" } }, mem.deps);
    expect(d.decision === "deny" && d.error.code).toBe("content_blocked");
    expect(await mem.deps.abuse.isFlagged("grt_test1")).toBe(true);
    expect(agentPrintedTextRules("Thanks so much for the lovely dinner").ok).toBe(true);
    expect(agentPrintedTextRules("call me 555 123 4567").ok).toBe(false);
  });
  it("minor recipients are not usable by assistants", async () => {
    const d = await authorize(principalOf(grant()), "request_approval", { idempotencyKey: "k", draftId: "drf_aaaaaaaaaaaa" }, mem.deps, { quoteCents: 1098, recipient: { personId: "per_x", agentUsable: false, ageBand: "minor", addressStatus: "confirmed" } });
    expect(d.decision === "deny" && d.error.code).toBe("recipient_not_allowed");
  });
});

describe("dispatch", () => {
  it("audits every decision with a digest, never the arguments", async () => {
    await callTool(principalOf(grant()), "get_quote", { product: "card_mailed" }, mem.deps);
    expect(mem.audit).toHaveLength(1);
    expect(JSON.stringify(mem.audit[0])).not.toContain("card_mailed");
    expect(mem.audit[0].argsDigest).toMatch(/^[0-9a-f]{64}$/);
  });
  it("idempotency: parallel identical requests run once; different payload conflicts", async () => {
    let runs = 0;
    const { withIdempotency } = await import("@/lib/agent/idempotency");
    const scope = { userId: "u", clientId: "c", tool: "t", key: "k1" };
    const run = async () => ({ ok: true as const, data: { n: ++runs }, replayed: false });
    const res = await Promise.all(Array.from({ length: 50 }, () => withIdempotency(mem.deps.idempotency, scope, { idempotencyKey: "k1", a: 1 }, run)));
    expect(runs).toBe(1);
    expect(res.filter((r) => r.ok && r.replayed)).toHaveLength(49);
    const c = await withIdempotency(mem.deps.idempotency, scope, { idempotencyKey: "k1", a: 2 }, run);
    expect(!c.ok && c.error.code).toBe("idempotency_conflict");
  });
});

describe("api keys", () => {
  it("generates a well-formed key and hashes it with the pepper", () => {
    process.env.AGENT_KEY_PEPPER = "test-pepper-not-a-secret";
    const k = generateApiKey("test");
    expect(looksLikeApiKey(k.key)).toBe(true);
    expect(hashApiKey(k.key)).toBe(k.keyHash);
    expect(k.keyHash).not.toContain(k.key);
    delete process.env.AGENT_KEY_PEPPER;
  });
});
