import { ART_STYLES, STYLE_IDS, PRICING, computeTotals, toolError, type CartItem, type ToolError, type ToolInput, type ToolName } from "@greethub/shared";
import type { Principal } from "./auth";
import type { AgentDeps } from "./deps";
import { agentConfig } from "./config";
import type { PolicyFacts } from "./policy";
import { fastScreen } from "../safety/fastpass";

/**
 * The one service layer behind both MCP (/api/mcp) and REST (/api/agent/v1/<tool>), docs/integrations/05 section 1.
 * Handlers return plain JSON. Tools whose backing work is not built yet return not_implemented with the ticket that delivers them,
 * so the tool list, schemas and policy can be exercised end to end today without pretending a draft or order exists.
 */
export type ToolCtx = { principal: Principal; deps: AgentDeps };
export type HandlerResult = { ok: true; data: unknown } | { ok: false; error: ToolError };
type Handler<N extends ToolName> = (ctx: ToolCtx, input: ToolInput<N>) => Promise<HandlerResult>;

const todo = (ticket: string, what: string): HandlerResult => ({ ok: false, error: toolError("not_implemented", `${what} is not available yet (${ticket}).`, { retryable: false }) });

const cardLine = (quantity: number): CartItem => ({ id: "quote", addedAt: new Date(0).toISOString(), kind: "card", format: "mailed", mailTo: "recipient", creationId: "quote", title: "Card", quantity });

export const handlers: { [N in ToolName]: Handler<N> } = {
  async search_styles(_ctx, input) {
    // TODO (AGT-013): use recommendStyles (lib/intake/knowledge/styles) for occasion and tone ranking.
    let q = (input.query ?? "").trim().toLowerCase();
    // A franchise-flavoured query gets the generic list, never an echo of the name (docs/legal/07).
    if (q && fastScreen({ text: q, field: "card_idea" }).verdict !== "ok") q = "";
    const styles = STYLE_IDS.map((id) => ({ styleId: id, name: ART_STYLES[id].label }))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .slice(0, input.limit);
    return { ok: true, data: { styles } };
  },

  async get_quote(ctx, input) {
    const totals = computeTotals([cardLine(input.quantity)], "standard");
    const sku = PRICING.skus.card_mailed;
    const limits = ctx.principal.grant.limits;
    return {
      ok: true,
      data: {
        currency: PRICING.currency,
        items: [{ sku: "card_mailed", unitCents: sku.cents, postageCents: sku.postageCents }],
        subtotalCents: totals.subtotalCents,
        postageCents: totals.postageCents,
        taxCents: null,
        taxEstimated: true,
        totalCents: totals.totalCents,
        estimatedDelivery: null, // TODO (AGT-015): from printer lead-time data.
        withinYourLimits: totals.totalCents / input.quantity <= limits.perCardCents,
      },
    };
  },

  async get_account_limits(ctx) {
    const { grant } = ctx.principal;
    const now = ctx.deps.now();
    const u = await ctx.deps.usage.snapshot(grant.grantId, now);
    const ks = await ctx.deps.killSwitches.read(ctx.principal.userId);
    const cooled = !!grant.autonomyEnabledAt && now.getTime() - new Date(grant.autonomyEnabledAt).getTime() >= agentConfig().autonomyCoolingOffHours * 3600_000;
    return {
      ok: true,
      data: {
        mode: grant.mode,
        perCardCents: grant.limits.perCardCents,
        monthlyCents: grant.limits.monthlyCents,
        monthSpentCents: u.spentMonthCents,
        annualCents: grant.limits.annualCents,
        cardsThisMonth: u.cardsThisMonth,
        maxCardsPerMonth: grant.limits.maxCardsPerMonth,
        draftsLeftToday: Math.max(0, grant.limits.maxDraftsPerDay - u.draftsToday),
        paused: ks.userPaused,
        // Matches policy.ts: autonomy only counts once the cooling-off period has passed.
        autonomyEnabled: grant.mode === "autonomous" && cooled,
      },
    };
  },

  async list_people() { return todo("AGT-005", "Listing saved people"); },
  async add_person() { return todo("AGT-005", "Saving a recipient"); },
  async create_card_draft() { return todo("AGT-013", "Creating a draft"); },
  async revise_card_draft() { return todo("AGT-013", "Revising a draft"); },
  async preview_card() { return todo("AGT-013", "Previewing a draft"); },
  async list_orders() { return todo("AGT-022", "Listing orders"); },
  async track_order() { return todo("AGT-022", "Tracking an order"); },
  async request_approval() { return todo("AGT-020", "Requesting approval"); },
  async cancel_order() { return todo("AGT-022", "Cancelling an order"); },
  async approve_and_pay() { return todo("AGT-021", "Paying for a card"); },
  async propose_standing_rule() { return todo("P3", "Standing rules"); },
  async list_standing_rules() { return todo("P3", "Standing rules"); },
  async pause_standing_rule() { return todo("P3", "Standing rules"); },
};

/**
 * Resolve the facts the policy needs (quote, recipient) for a call. Stub: the draft and people stores arrive with AGT-005 and AGT-013.
 * Until then spend tools get no facts, so authorize() refuses them (draft_not_ready), which is the safe default.
 */
export async function resolveFacts(_ctx: ToolCtx, _tool: ToolName, _args: Record<string, unknown>): Promise<PolicyFacts> {
  return {};
}
