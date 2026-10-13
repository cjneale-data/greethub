import { TOOL_META, toolError, type ToolError, type ToolName } from "@greethub/shared";
import type { Principal } from "./auth";
import { agentChannelEnabled, agentConfig } from "./config";
import type { AgentDeps } from "./deps";
import { screenAgentText, textFieldsOf } from "./safety";

/**
 * authorize(): the single policy gate run before every tool (AGT-006, docs/integrations/02 section 5). Checks run in the documented
 * order and the first failure wins. Returns allow, require_approval or deny with an error code from the tool spec.
 * Everything that needs data the tool does not carry (the quote, the recipient) arrives in `facts`, resolved by the service layer
 * so this file stays pure policy and is table-testable.
 */
export type RecipientFacts = { personId: string; agentUsable: boolean; ageBand: string; addressStatus: "none" | "unconfirmed" | "confirmed"; isNew?: boolean };
export type PolicyFacts = {
  /** Total price in cents for the card being approved or cancelled (from get_quote math). */
  quoteCents?: number;
  recipient?: RecipientFacts;
  /** Estimated model spend for this call in USD (a 2K card front plus inside is about 0.22 to 0.25). */
  estimatedModelUsd?: number;
};

export type Decision =
  | { decision: "allow"; reasons: string[] }
  | { decision: "require_approval"; reasons: string[]; error: ToolError }
  | { decision: "deny"; reasons: string[]; error: ToolError };

const deny = (reason: string, error: ToolError): Decision => ({ decision: "deny", reasons: [reason], error });

export async function authorize(principal: Principal, tool: ToolName, args: Record<string, unknown>, deps: AgentDeps, facts: PolicyFacts = {}): Promise<Decision> {
  const meta = TOOL_META[tool];
  const { grant } = principal;
  const cfg = agentConfig();
  const now = deps.now();

  // 1. Kill switches.
  const ks = await deps.killSwitches.read(principal.userId);
  if (!agentChannelEnabled() || cfg.paused || ks.global || ks.agentChannel) return deny("kill_switch", toolError("service_busy", "GreetHub assistants are paused right now. Please try again later.", { retryable: true }));
  if (ks.userPaused) return deny("user_paused", toolError("service_busy", "The account owner has paused assistants in GreetHub settings.", { retryable: false }));

  // 2. Scope, grant state, account standing.
  if (!principal.tokenScopes.includes(meta.scope)) return deny("scope", toolError("scope_insufficient", `This connection does not allow ${meta.title.toLowerCase()}.`, { retryable: false }));
  if (ks.accountHeld) return deny("account_held", toolError("service_busy", "This account needs a look from GreetHub support before assistants can continue.", { retryable: false }));
  if (grant.mode === "draft_only" && (meta.scope === "cards:request_send" || meta.scope === "cards:send_auto")) return deny("mode_draft_only", toolError("scope_insufficient", "This connection can create drafts but not ask to send them. The account owner can change that in GreetHub settings.", { retryable: false }));

  // 3. Quotas and rate limits.
  const rl = cfg.rateLimits;
  const bucket = meta.readOnlyHint ? "r" : "w";
  const lim = await deps.limiter.allow(`agent:${grant.grantId}:${bucket}`, meta.readOnlyHint ? rl.readsPerMin : rl.writesPerMin, 60_000);
  if (!lim.ok) {
    await deps.abuse.flag(grant.grantId, "rate_limit");
    return deny("rate_limit", toolError("quota_exceeded", "Too many requests. Please slow down and try again shortly.", { retryable: true, retryAfterSeconds: lim.retryAfterSeconds }));
  }
  const usage = await deps.usage.snapshot(grant.grantId, now);
  if (tool === "create_card_draft" && usage.draftsToday >= grant.limits.maxDraftsPerDay) return deny("drafts_per_day", toolError("quota_exceeded", `The daily limit of ${grant.limits.maxDraftsPerDay} drafts for assistants is used up.`, { retryable: true, retryAfterSeconds: secondsToMidnightUtc(now) }));
  if (tool === "request_approval" && usage.approvalsToday >= rl.approvalsPerDay) return deny("approvals_per_day", toolError("quota_exceeded", "Too many approval requests today.", { retryable: true, retryAfterSeconds: secondsToMidnightUtc(now) }));
  if (tool === "add_person" && usage.newRecipientsToday >= grant.limits.newRecipientsPerDay) return deny("new_recipients_per_day", toolError("quota_exceeded", "The daily limit for adding new recipients is used up.", { retryable: true, retryAfterSeconds: secondsToMidnightUtc(now) }));

  // 4. Spend: model money. The service must call deps.ledger.reserve() with this amount before the model call (atomic); here we only
  // refuse early when the pool is clearly exhausted so the caller gets spend_cap_reached instead of a late failure.
  if (meta.spendsModelMoney) {
    const probe = `probe:${grant.grantId}:${crypto.randomUUID()}`; // unique, so parallel calls never release each other's probe
    const r = await deps.ledger.reserve("agent", facts.estimatedModelUsd ?? 0.25, probe);
    await deps.ledger.release(probe);
    if (!r.ok) return deny("model_budget", toolError("spend_cap_reached", "GreetHub can't start new drafts right now. Please try again later.", { retryable: true }));
  }

  // 5. Money caps (settled plus pending) for tools that move or commit the user's money.
  if (tool === "request_approval" || tool === "approve_and_pay") {
    if (facts.quoteCents === undefined) return deny("no_quote", toolError("draft_not_ready", "This draft doesn't have a price yet. Preview it first.", { retryable: true }));
    if (facts.quoteCents > grant.limits.perCardCents) return deny("per_card_cap", toolError("spend_cap_reached", `This card costs more than your per-card limit for assistants. You can change the limit in GreetHub settings.`, { retryable: false }));
    if (usage.spentMonthCents + facts.quoteCents > grant.limits.monthlyCents) return deny("monthly_cap", toolError("spend_cap_reached", "This would take you past your monthly limit for assistants. You can change it in GreetHub settings.", { retryable: false }));
    if (usage.cardsThisMonth >= grant.limits.maxCardsPerMonth) return deny("cards_per_month", toolError("quota_exceeded", "The monthly card limit for assistants is reached.", { retryable: false }));
    if (!grant.limits.productAllowlist.includes("card_mailed")) return deny("product", toolError("scope_insufficient", "This connection can't buy mailed cards.", { retryable: false }));
  }

  // 6. Recipient rules.
  const rcp = facts.recipient;
  if (rcp) {
    if (!rcp.agentUsable || rcp.ageBand === "minor") return deny("recipient_not_usable", toolError("recipient_not_allowed", "This person isn't available to assistants. The account owner can change that on greethub.com.", { retryable: false }));
    if (tool === "approve_and_pay" && rcp.addressStatus !== "confirmed") return deny("address_unconfirmed", toolError("address_unconfirmed", "This recipient's address isn't confirmed yet. Ask the account owner to confirm it on greethub.com.", { retryable: false }));
  }

  // 7. Content rules on free text.
  if (meta.freeText) {
    const screen = await screenAgentText(textFieldsOf(args));
    if (!screen.ok) {
      await deps.abuse.flag(grant.grantId, screen.injection ? "injection" : "blocked_content");
      return deny("content", screen.error);
    }
  }

  // 8. Mode. Anything that would pay without a human click needs autonomy opted in on the web, an allowlisted recipient,
  // past the first-N rule, with no anomaly flag. Otherwise require_approval, which points the model to request_approval.
  if (tool === "approve_and_pay") {
    const reasons: string[] = [];
    const cooled = grant.autonomyEnabledAt && now.getTime() - new Date(grant.autonomyEnabledAt).getTime() >= cfg.autonomyCoolingOffHours * 3600_000;
    if (grant.mode !== "autonomous" || !cooled) reasons.push("autonomy_not_enabled");
    if (rcp && !grant.limits.recipientAllowlist.includes(rcp.personId)) reasons.push("recipient_not_allowlisted");
    if (rcp) {
      const sent = await deps.usage.cardsToRecipient(grant.grantId, rcp.personId);
      if (sent < grant.limits.requireApprovalFirstNPerRecipient) reasons.push("first_n_for_recipient");
    }
    if (await deps.abuse.isFlagged(grant.grantId)) reasons.push("anomaly");
    if (reasons.length) return { decision: "require_approval", reasons, error: { ...toolError("approval_required", "This card needs the account owner's approval. Use request_approval instead.", { retryable: false }), missing: reasons.map((r) => ({ path: "reason", message: r })) } };
  }
  return { decision: "allow", reasons: [] };
}

const secondsToMidnightUtc = (d: Date) => Math.max(60, Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - d.getTime()) / 1000));
